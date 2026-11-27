import {
  CRAFT_CATEGORIES,
  DISTRICT_COORDS,
  DISTRICTS,
  INITIAL_ADMIN_ACCOUNTS,
} from '../data/artisans';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import type {
  AdminAccount,
  AdminRole,
  Article,
  ArticleSourceType,
  ArticleStatus,
  Artisan,
  ArtisanStatus,
  CraftCategory,
  District,
  IllustrationVariant,
  KudosKey,
  ParkingInfo,
  PaymentMethod,
  PendingSuggestion,
  PraiseEntry,
  PriceItem,
  StatusReport,
} from '../types/artisan';
import {
  formatVietnamDate,
  formatVietnamTimestamp,
  normalizeAccountRole,
  toIsoDate,
} from '../utils/storage';
import {
  sanitizeExternalUrl,
  sanitizeImageSrc,
  sanitizeRichHtmlString,
  validatePublicArticleUrl,
} from '../utils/richText';

type UnknownRow = Record<string, unknown>;

export function formatSupabaseError(err: unknown): string {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Thiết bị đang mất kết nối mạng. Vui lòng kiểm tra Wi-Fi / 4G rồi thử lại.';
  }

  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: unknown }).message)
        : String(err ?? '');

  const lower = rawMessage.toLowerCase();
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed')
  ) {
    return 'Không thể kết nối tới máy chủ Supabase (lỗi mạng hoặc URL chưa đúng). Vui lòng kiểm tra kết nối mạng và thử lại.';
  }

  if (lower.includes('relation') && lower.includes('does not exist')) {
    return 'Chưa tìm thấy bảng dữ liệu trên Supabase. Vui lòng tạo các bảng artisans, status_reports, admin_accounts, articles theo file supabase-schema.sql.';
  }

  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'Supabase đang chặn quyền truy cập bảng (RLS). Vui lòng bật policy cho phép đọc/ghi trên các bảng dữ liệu.';
  }

  if (lower.includes('column') && lower.includes('does not exist')) {
    return 'Bảng dữ liệu trên Supabase chưa có đủ cột mới. Vui lòng chạy đoạn ALTER TABLE trong file supabase-schema.sql.';
  }

  return rawMessage
    ? `Lỗi đồng bộ dữ liệu: ${rawMessage}`
    : 'Đã xảy ra lỗi khi kết nối cơ sở dữ liệu. Vui lòng thử lại.';
}

function parseArrayField<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean) as unknown as T[];
    }
  }
  return fallback;
}

function parseKudos(value: unknown): Record<KudosKey, number> {
  const fallback: Record<KudosKey, number> = {
    sturdy: 0,
    studentPrice: 0,
    fast: 0,
    friendly: 0,
  };
  let obj: unknown = value;
  if (typeof value === 'string') {
    try {
      obj = JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  if (!obj || typeof obj !== 'object') return fallback;
  const rec = obj as Record<string, unknown>;
  return {
    sturdy: Number(rec.sturdy ?? 0) || 0,
    studentPrice: Number(rec.studentPrice ?? 0) || 0,
    fast: Number(rec.fast ?? 0) || 0,
    friendly: Number(rec.friendly ?? 0) || 0,
  };
}

function safeImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }
  return undefined;
}

function normalizeDistrict(value: unknown): District {
  const str = String(value ?? '').trim();
  return (
    DISTRICTS.find((d) => d.toLowerCase() === str.toLowerCase()) ?? 'Bình Thạnh'
  );
}

function normalizeCategories(value: unknown): CraftCategory[] {
  const raw = parseArrayField<string>(value, []);
  const matched = raw
    .map((item) =>
      CRAFT_CATEGORIES.find(
        (c) => c.toLowerCase() === String(item).trim().toLowerCase()
      )
    )
    .filter((c): c is CraftCategory => Boolean(c));
  return matched.length > 0 ? matched : ['Sửa giày dép'];
}

function mapCategoryToIllustration(category: CraftCategory): IllustrationVariant {
  switch (category) {
    case 'Sửa giày dép':
      return 'cobbler';
    case 'May vá':
      return 'tailor';
    case 'Sửa khóa':
    case 'Sửa đồng hồ':
      return 'locksmith';
    case 'Sửa balo/túi':
      return 'bag_repair';
  }
}

function normalizeIllustration(
  value: unknown,
  primaryCat: CraftCategory
): IllustrationVariant {
  const allowed: IllustrationVariant[] = [
    'cobbler',
    'tailor',
    'locksmith',
    'bag_repair',
    'knit_tailor',
    'leather_shoes',
  ];
  const str = String(value ?? '');
  return allowed.includes(str as IllustrationVariant)
    ? (str as IllustrationVariant)
    : mapCategoryToIllustration(primaryCat);
}

function normalizeStatus(value: unknown): ArtisanStatus {
  if (value === 'working' || value === 'off_today' || value === 'relocated') {
    return value;
  }
  return 'working';
}

function extractCoordinates(row: UnknownRow, district: District): { lat: number; lng: number } {
  const fallback = DISTRICT_COORDS[district];
  const latDirect = Number(row.lat);
  const lngDirect = Number(row.lng);
  if (Number.isFinite(latDirect) && Number.isFinite(lngDirect) && latDirect !== 0) {
    return { lat: latDirect, lng: lngDirect };
  }
  if (row.coordinates && typeof row.coordinates === 'object') {
    const c = row.coordinates as Record<string, unknown>;
    const latNested = Number(c.lat);
    const lngNested = Number(c.lng);
    if (Number.isFinite(latNested) && Number.isFinite(lngNested)) {
      return { lat: latNested, lng: lngNested };
    }
  }
  return fallback;
}

export function rowToArtisan(row: UnknownRow): Artisan {
  const district = normalizeDistrict(row.district);
  const categories = normalizeCategories(row.categories);
  const name = String(row.name ?? 'Cô chú thợ quanh đây');
  const firstPart = name.split(/[–-]/)[0]?.trim() || name;
  const coordinates = extractCoordinates(row, district);

  const paymentRaw = String(row.payment_method ?? row.paymentMethod ?? '');
  const paymentMethod: PaymentMethod = paymentRaw.includes('chuyển khoản')
    ? 'Có chuyển khoản'
    : 'Chỉ tiền mặt';

  const parkingRaw = String(row.parking_info ?? row.parkingInfo ?? '');
  const parkingInfo: ParkingInfo = parkingRaw.includes('Gửi xe')
    ? 'Gửi xe gần đó'
    : 'Dễ đậu xe';

  const prices = parseArrayField<PriceItem>(row.prices, []);
  const problems = parseArrayField<string>(row.problems, []);
  const praises = parseArrayField<PraiseEntry>(row.praises, []);
  const minPriceLabel = String(row.min_price_label ?? row.minPriceLabel ?? 'Từ 15k');

  return {
    id: String(row.id),
    name,
    shortTitle: String(
      row.short_title ?? row.shortTitle ?? `${firstPart} · ${categories[0]}`
    ),
    categories,
    district,
    coordinates,
    addressLandmark: String(row.address_landmark ?? row.addressLandmark ?? ''),
    problems: problems.length > 0 ? problems : categories.map((c) => c.toLowerCase()),
    hours: String(row.hours ?? '08:00 – 17:30'),
    minPriceLabel,
    prices:
      prices.length > 0
        ? prices
        : [{ service: categories[0], priceRange: minPriceLabel }],
    story: String(row.story ?? ''),
    status: normalizeStatus(row.status),
    verifiedDate: String(
      row.verified_date ?? row.verifiedDate ?? formatVietnamDate()
    ),
    lastVerifiedDate:
      typeof row.last_verified_date === 'string'
        ? row.last_verified_date
        : typeof row.lastVerifiedDate === 'string'
          ? row.lastVerifiedDate
          : toIsoDate(),
    paymentMethod,
    parkingInfo,
    hasConsent: Boolean(row.has_consent ?? row.hasConsent ?? true),
    hidePortrait: Boolean(row.hide_portrait ?? row.hidePortrait ?? true),
    isHidden: Boolean(row.is_hidden ?? row.isHidden ?? false),
    illustrationVariant: normalizeIllustration(
      row.illustration_variant ?? row.illustrationVariant,
      categories[0]
    ),
    customImageUrl: safeImageUrl(row.custom_image_url ?? row.customImageUrl),
    kudos: parseKudos(row.kudos),
    praises,
    revivedCount: Number(row.revived_count ?? row.revivedCount ?? 0) || 0,
    submittedBy:
      typeof row.submitted_by === 'string' && row.submitted_by.trim()
        ? row.submitted_by.trim()
        : typeof row.submittedBy === 'string' && row.submittedBy.trim()
          ? row.submittedBy.trim()
          : undefined,
    submittedAt:
      typeof row.submitted_at === 'string' && row.submitted_at.trim()
        ? row.submitted_at.trim()
        : typeof row.submittedAt === 'string' && row.submittedAt.trim()
          ? row.submittedAt.trim()
          : undefined,
    approvalStatus:
      String(row.approval_status ?? 'approved').toLowerCase() === 'pending'
        ? 'pending'
        : 'approved',
    pic: typeof row.pic === 'string' && row.pic.trim() ? row.pic : undefined,
    internalNotes:
      typeof row.internal_notes === 'string' && row.internal_notes.trim()
        ? row.internal_notes
        : typeof row.internalNotes === 'string' && row.internalNotes.trim()
          ? row.internalNotes
          : undefined,
  };
}

export function rowToPendingSuggestion(row: UnknownRow): PendingSuggestion {
  const district = normalizeDistrict(row.district);
  const categories = normalizeCategories(row.categories);
  const coordinates = extractCoordinates(row, district);

  const paymentRaw = String(row.payment_method ?? row.paymentMethod ?? '');
  const paymentMethod: PaymentMethod = paymentRaw.includes('chuyển khoản')
    ? 'Có chuyển khoản'
    : 'Chỉ tiền mặt';

  const parkingRaw = String(row.parking_info ?? row.parkingInfo ?? '');
  const parkingInfo: ParkingInfo = parkingRaw.includes('Gửi xe')
    ? 'Gửi xe gần đó'
    : 'Dễ đậu xe';

  return {
    id: String(row.id),
    name: String(row.name ?? 'Đề xuất mới'),
    categories,
    district,
    coordinates,
    addressLandmark: String(row.address_landmark ?? row.addressLandmark ?? ''),
    hours: String(row.hours ?? '08:00 – 17:30'),
    problems: parseArrayField<string>(row.problems, []),
    minPriceLabel: String(row.min_price_label ?? row.minPriceLabel ?? 'Từ 15k'),
    story: String(row.story ?? ''),
    paymentMethod,
    parkingInfo,
    customImageUrl: safeImageUrl(row.custom_image_url ?? row.customImageUrl),
    submittedBy: String(row.submitted_by ?? row.submittedBy ?? 'Cộng đồng'),
    submittedAt: String(
      row.submitted_at ?? row.submittedAt ?? formatVietnamTimestamp()
    ),
  };
}

export function artisanToRow(
  artisan: Artisan,
  approvalStatus: 'approved' | 'pending' = 'approved'
): Record<string, unknown> {
  return {
    id: artisan.id,
    name: artisan.name,
    short_title: artisan.shortTitle,
    categories: artisan.categories,
    district: artisan.district,
    lat: artisan.coordinates.lat,
    lng: artisan.coordinates.lng,
    address_landmark: artisan.addressLandmark,
    problems: artisan.problems,
    hours: artisan.hours,
    min_price_label: artisan.minPriceLabel,
    prices: artisan.prices,
    story: artisan.story,
    status: artisan.status,
    approval_status: approvalStatus,
    verified_date: artisan.verifiedDate,
    last_verified_date: artisan.lastVerifiedDate ?? toIsoDate(),
    payment_method: artisan.paymentMethod,
    parking_info: artisan.parkingInfo,
    has_consent: artisan.hasConsent,
    hide_portrait: artisan.hidePortrait,
    is_hidden: Boolean(artisan.isHidden),
    illustration_variant: artisan.illustrationVariant,
    custom_image_url: artisan.customImageUrl ?? null,
    kudos: artisan.kudos,
    praises: artisan.praises,
    revived_count: artisan.revivedCount ?? 0,
    pic: artisan.pic ?? null,
    internal_notes: artisan.internalNotes ?? null,
    ...(artisan.submittedBy ? { submitted_by: artisan.submittedBy } : {}),
    ...(artisan.submittedAt ? { submitted_at: artisan.submittedAt } : {}),
  };
}

export function pendingSuggestionToRow(
  suggestion: PendingSuggestion
): Record<string, unknown> {
  const coords = suggestion.coordinates ?? DISTRICT_COORDS[suggestion.district];
  const primaryCat = suggestion.categories[0] ?? 'Sửa giày dép';
  const firstPart = suggestion.name.split(/[–-]/)[0]?.trim() || suggestion.name;

  return {
    id: suggestion.id,
    name: suggestion.name,
    short_title: `${firstPart} · ${primaryCat}`,
    categories: suggestion.categories,
    district: suggestion.district,
    lat: coords.lat,
    lng: coords.lng,
    address_landmark: suggestion.addressLandmark,
    problems: suggestion.problems,
    hours: suggestion.hours,
    min_price_label: suggestion.minPriceLabel,
    prices: [
      {
        service: suggestion.problems[0] || primaryCat,
        priceRange: suggestion.minPriceLabel,
      },
    ],
    story: suggestion.story,
    status: 'working',
    approval_status: 'pending',
    verified_date: formatVietnamDate(),
    last_verified_date: toIsoDate(),
    payment_method: suggestion.paymentMethod,
    parking_info: suggestion.parkingInfo,
    has_consent: false,
    hide_portrait: true,
    is_hidden: false,
    illustration_variant: mapCategoryToIllustration(primaryCat),
    custom_image_url: suggestion.customImageUrl ?? null,
    kudos: { sturdy: 0, studentPrice: 0, fast: 0, friendly: 0 },
    praises: [],
    revived_count: 0,
    submitted_by: suggestion.submittedBy,
    submitted_at: suggestion.submittedAt,
  };
}

export function rowToStatusReport(row: UnknownRow): StatusReport {
  return {
    id: String(row.id),
    artisanId: String(row.artisan_id ?? row.artisanId ?? ''),
    artisanName: String(row.artisan_name ?? row.artisanName ?? 'Góc thợ'),
    reportedStatus: normalizeStatus(row.reported_status ?? row.reportedStatus),
    note: String(row.note ?? ''),
    createdAt: String(
      row.created_at ?? row.createdAt ?? formatVietnamTimestamp()
    ),
    resolved: Boolean(row.is_resolved ?? row.resolved ?? false),
  };
}

export function rowToAdminAccount(row: UnknownRow): AdminAccount {
  const role: AdminRole = normalizeAccountRole(row.role);
  const rawEmail = String(row.email ?? '').trim();
  const rawUsername = String(row.username ?? '').trim() || rawEmail;
  const rawDisplayName =
    String(row.display_name ?? row.displayName ?? '').trim() ||
    String(row.name ?? '').trim() ||
    rawUsername ||
    'Thành viên';

  const badges = parseArrayField<string>(row.badges, [])
    .map((b) => String(b).trim())
    .filter(Boolean);
  const favoriteArtisanIds = parseArrayField<string>(
    row.favorite_artisan_ids ?? row.favoriteArtisanIds,
    []
  )
    .map((id) => String(id).trim())
    .filter(Boolean);

  return {
    id: String(row.id),
    displayName: rawDisplayName,
    name: String(row.name ?? rawDisplayName).trim() || rawDisplayName,
    username: rawUsername,
    email: rawEmail || rawUsername,
    password: String(row.password ?? ''),
    role,
    active: row.active === undefined ? true : Boolean(row.active),
    revivedCount: Number(row.revived_count ?? row.revivedCount ?? 0) || 0,
    badges,
    favoriteArtisanIds,
    createdAt: String(row.created_at ?? row.createdAt ?? formatVietnamDate()),
  };
}

function accountToDbRow(account: AdminAccount): Record<string, unknown> {
  const normalizedUsername = (account.username || account.email)
    .trim()
    .toLowerCase();
  const displayName = (account.displayName || account.name).trim();
  return {
    id: account.id,
    name: displayName,
    display_name: displayName,
    username: normalizedUsername,
    email: (account.email || normalizedUsername).trim().toLowerCase(),
    password: account.password,
    role: normalizeAccountRole(account.role),
    active: account.active,
    revived_count: account.revivedCount ?? 0,
    badges: account.badges ?? [],
    favorite_artisan_ids: account.favoriteArtisanIds ?? [],
    created_at: account.createdAt,
  };
}

// ============================================================================
// API FUNCTIONS CHO 3 BẢNG TRÊN SUPABASE: artisans, status_reports, admin_accounts
// ============================================================================

/**
 * Trang bản đồ chính: chỉ tải các dòng có approval_status = 'approved'.
 */
export async function fetchApprovedArtisans(): Promise<Artisan[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const { data, error } = await supabase
    .from('artisans')
    .select('*')
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToArtisan(row as UnknownRow));
}

/**
 * Khu Quản trị (Admin): tải toàn bộ bảng artisans (cả 'approved' lẫn 'pending').
 */
export async function fetchAllArtisansForAdmin(): Promise<{
  approved: Artisan[];
  pending: PendingSuggestion[];
  totalCount: number;
}> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const { data, error } = await supabase
    .from('artisans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as UnknownRow[];

  const approved: Artisan[] = [];
  const pending: PendingSuggestion[] = [];

  for (const row of rows) {
    const approvalStatus = String(row.approval_status ?? 'approved').toLowerCase();
    if (approvalStatus === 'pending') {
      pending.push(rowToPendingSuggestion(row));
    } else {
      approved.push(rowToArtisan(row));
    }
  }

  return { approved, pending, totalCount: rows.length };
}

/**
 * Form "Gợi ý thợ mới": insert dòng mới vào bảng artisans với approval_status = 'pending'.
 */
export async function insertPendingArtisanDb(
  suggestion: PendingSuggestion
): Promise<PendingSuggestion> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const row = pendingSuggestionToRow(suggestion);
  const { data, error } = await supabase
    .from('artisans')
    .insert(row)
    .select('*')
    .single();

  if (error) throw error;
  return rowToPendingSuggestion((data ?? row) as UnknownRow);
}

/**
 * Thêm mới, chỉnh sửa hoặc duyệt đề xuất (chuyển approval_status = 'approved').
 */
export async function upsertApprovedArtisanDb(
  artisan: Artisan,
  approvedPendingId?: string
): Promise<Artisan> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  // Nếu đang duyệt đề xuất từ hàng chờ, giữ nguyên ID dòng pending để update sang 'approved'
  const finalArtisan: Artisan = approvedPendingId
    ? { ...artisan, id: approvedPendingId }
    : artisan;

  const row = artisanToRow(finalArtisan, 'approved');
  const { data, error } = await supabase
    .from('artisans')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return rowToArtisan((data ?? row) as UnknownRow);
}

/**
 * Cập nhật nhanh một số trường trên bảng artisans (trạng thái, xác minh, ẩn/hiện, kudos, hồi sinh).
 */
export async function updateArtisanFieldsDb(
  artisanId: string,
  patch: Record<string, unknown>
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const { error } = await supabase
    .from('artisans')
    .update(patch)
    .eq('id', artisanId);

  if (error) throw error;
}

/**
 * Nạp hàng loạt cô chú thợ (dùng cho nút "Nạp 6 dữ liệu mẫu vào Database" & Nhập CSV).
 */
export async function bulkUpsertArtisansDb(artisans: Artisan[]): Promise<Artisan[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const rows = artisans.map((a) => artisanToRow(a, 'approved'));
  const { data, error } = await supabase
    .from('artisans')
    .upsert(rows, { onConflict: 'id' })
    .select('*');

  if (error) throw error;
  return (data ?? rows).map((r) => rowToArtisan(r as UnknownRow));
}

export async function deleteArtisanDb(artisanId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const { error } = await supabase.from('artisans').delete().eq('id', artisanId);
  if (error) throw error;
}

export interface UserContributionItem {
  id: string;
  name: string;
  district: District;
  categories: CraftCategory[];
  addressLandmark: string;
  submittedAt: string;
  approvalStatus: 'pending' | 'approved';
}

/**
 * Lịch sử đóng góp: tải các cô chú thợ do tài khoản hiện tại gợi ý (cả 'pending' và 'approved').
 */
export async function fetchUserSubmittedArtisansDb(
  account: Pick<AdminAccount, 'id' | 'username' | 'email'>
): Promise<UserContributionItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const identifiers = Array.from(
    new Set(
      [account.username, account.id, account.email]
        .map((v) => String(v ?? '').trim())
        .filter(Boolean)
    )
  );
  if (identifiers.length === 0) return [];

  const { data, error } = await supabase
    .from('artisans')
    .select('*')
    .in('submitted_by', identifiers)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((raw) => {
    const row = raw as UnknownRow;
    const isPending =
      String(row.approval_status ?? 'approved').toLowerCase() === 'pending';
    return {
      id: String(row.id),
      name: String(row.name ?? 'Góc thợ'),
      district: normalizeDistrict(row.district),
      categories: normalizeCategories(row.categories),
      addressLandmark: String(row.address_landmark ?? ''),
      submittedAt: String(
        row.submitted_at ?? row.verified_date ?? formatVietnamDate()
      ),
      approvalStatus: isPending ? 'pending' : 'approved',
    };
  });
}

// ============================================================================
// BẢNG status_reports
// ============================================================================

export async function fetchStatusReportsDb(): Promise<StatusReport[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const { data, error } = await supabase
    .from('status_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => rowToStatusReport(r as UnknownRow));
}

export async function insertStatusReportDb(
  report: StatusReport
): Promise<StatusReport> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const row = {
    id: report.id,
    artisan_id: report.artisanId,
    artisan_name: report.artisanName,
    reported_status: report.reportedStatus,
    note: report.note,
    is_resolved: false,
    created_at: report.createdAt,
  };

  const { data, error } = await supabase
    .from('status_reports')
    .insert(row)
    .select('*')
    .single();

  if (error) throw error;
  return rowToStatusReport((data ?? row) as UnknownRow);
}

export async function resolveStatusReportDb(reportId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const { error } = await supabase
    .from('status_reports')
    .update({ is_resolved: true })
    .eq('id', reportId);

  if (error) throw error;
}

// ============================================================================
// BẢNG admin_accounts (Tài khoản hợp nhất: super_admin, collaborator, user)
// ============================================================================

export async function fetchAdminAccountsDb(): Promise<AdminAccount[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const { data, error } = await supabase
    .from('admin_accounts')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => rowToAdminAccount(r as UnknownRow));
}

export async function fetchAccountByIdDb(
  accountId: string
): Promise<AdminAccount | null> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const { data, error } = await supabase
    .from('admin_accounts')
    .select('*')
    .eq('id', accountId)
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return null;
  const acc = rowToAdminAccount(data[0] as UnknownRow);
  return acc.active ? acc : null;
}

/**
 * Kiểm tra đăng nhập trên bảng admin_accounts:
 * So khớp theo username HOẶC email (tương thích hoàn toàn với tài khoản cũ) và password.
 * Sử dụng các truy vấn .eq() tham số hóa độc lập (an toàn, không dùng chuỗi filter .or).
 */
export async function authenticateUserDb(
  identifier: string,
  password: string
): Promise<AdminAccount | null> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const cleaned = identifier.trim().toLowerCase();
  if (!cleaned || !password) return null;

  // 1. Thử khớp theo cột username (nếu cột username đã có trên Supabase)
  const byUsername = await supabase
    .from('admin_accounts')
    .select('*')
    .eq('username', cleaned)
    .eq('password', password)
    .limit(1);

  if (!byUsername.error && byUsername.data && byUsername.data.length > 0) {
    const acc = rowToAdminAccount(byUsername.data[0] as UnknownRow);
    return acc.active ? acc : null;
  }

  // Nếu lỗi không phải do thiếu cột username thì ném lỗi mạng/RLS ngay
  if (
    byUsername.error &&
    !String(byUsername.error.message ?? '').toLowerCase().includes('username')
  ) {
    throw byUsername.error;
  }

  // 2. Thử khớp theo cột email (tương thích mọi tài khoản Super Admin & CTV cũ)
  const byEmail = await supabase
    .from('admin_accounts')
    .select('*')
    .eq('email', cleaned)
    .eq('password', password)
    .limit(1);

  if (byEmail.error) throw byEmail.error;
  if (byEmail.data && byEmail.data.length > 0) {
    const acc = rowToAdminAccount(byEmail.data[0] as UnknownRow);
    return acc.active ? acc : null;
  }

  // 3. Trường hợp bảng admin_accounts hoàn toàn trống (lần đầu khởi tạo), hỗ trợ tài khoản khởi tạo
  const { count, error: countError } = await supabase
    .from('admin_accounts')
    .select('*', { count: 'exact', head: true });

  if (!countError && (count ?? 0) === 0) {
    const bootstrapMatch = INITIAL_ADMIN_ACCOUNTS.find(
      (a) =>
        (a.username.toLowerCase() === cleaned ||
          a.email.toLowerCase() === cleaned) &&
        a.password === password
    );
    if (bootstrapMatch) {
      await supabase
        .from('admin_accounts')
        .upsert(INITIAL_ADMIN_ACCOUNTS.map(accountToDbRow), {
          onConflict: 'email',
        });
      return bootstrapMatch;
    }
  }

  return null;
}

/** Alias giữ tương thích nếu có nơi gọi tên cũ */
export const authenticateAdminDb = authenticateUserDb;

/**
 * Kiểm tra tên đăng nhập đã tồn tại trong cột username hoặc email chưa.
 */
export async function checkUsernameTakenDb(
  username: string,
  excludeAccountId?: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const cleaned = username.trim().toLowerCase();

  const byUsername = await supabase
    .from('admin_accounts')
    .select('id')
    .eq('username', cleaned)
    .limit(2);

  if (!byUsername.error && byUsername.data) {
    const conflict = byUsername.data.some(
      (row) => String((row as UnknownRow).id) !== excludeAccountId
    );
    if (conflict) return true;
  }

  const byEmail = await supabase
    .from('admin_accounts')
    .select('id')
    .eq('email', cleaned)
    .limit(2);

  if (byEmail.error) throw byEmail.error;
  return (byEmail.data ?? []).some(
    (row) => String((row as UnknownRow).id) !== excludeAccountId
  );
}

/**
 * Đăng ký tài khoản mới từ Cổng Đăng nhập (mặc định role = 'user').
 */
export async function registerUserDb(payload: {
  username: string;
  displayName: string;
  password: string;
}): Promise<AdminAccount> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const cleanedUsername = payload.username.trim().toLowerCase();
  const cleanedDisplayName = payload.displayName.trim();

  const taken = await checkUsernameTakenDb(cleanedUsername);
  if (taken) {
    throw new Error(
      'Tên đăng nhập này đã được sử dụng. Bạn vui lòng chọn tên khác nhé.'
    );
  }

  const newAccount: AdminAccount = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    displayName: cleanedDisplayName,
    name: cleanedDisplayName,
    username: cleanedUsername,
    email: cleanedUsername,
    password: payload.password,
    role: 'user',
    active: true,
    revivedCount: 0,
    badges: [],
    favoriteArtisanIds: [],
    createdAt: formatVietnamDate(),
  };

  const row = accountToDbRow(newAccount);
  const { data, error } = await supabase
    .from('admin_accounts')
    .insert(row)
    .select('*')
    .single();

  if (error) throw error;
  return rowToAdminAccount((data ?? row) as UnknownRow);
}

/**
 * Đồng bộ hồ sơ cá nhân (revived_count, badges, favorite_artisan_ids, display_name) lên bảng admin_accounts.
 */
export async function updateAccountProfileDb(
  accountId: string,
  patch: {
    displayName?: string;
    revivedCount?: number;
    badges?: string[];
    favoriteArtisanIds?: string[];
  }
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const dbPatch: Record<string, unknown> = {};
  if (patch.displayName !== undefined) {
    dbPatch.display_name = patch.displayName;
    dbPatch.name = patch.displayName;
  }
  if (patch.revivedCount !== undefined) {
    dbPatch.revived_count = patch.revivedCount;
  }
  if (patch.badges !== undefined) {
    dbPatch.badges = patch.badges;
  }
  if (patch.favoriteArtisanIds !== undefined) {
    dbPatch.favorite_artisan_ids = patch.favoriteArtisanIds;
  }

  if (Object.keys(dbPatch).length === 0) return;

  const { error } = await supabase
    .from('admin_accounts')
    .update(dbPatch)
    .eq('id', accountId);

  if (error) throw error;
}

/**
 * Super Admin chỉnh sửa thông tin & vai trò của tài khoản bất kỳ.
 */
export async function updateAccountByAdminDb(
  accountId: string,
  payload: {
    displayName: string;
    username: string;
    role: AdminRole;
  }
): Promise<AdminAccount> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const cleanedUsername = payload.username.trim().toLowerCase();
  const cleanedDisplayName = payload.displayName.trim();

  const taken = await checkUsernameTakenDb(cleanedUsername, accountId);
  if (taken) {
    throw new Error('Tên đăng nhập này đã thuộc về một tài khoản khác.');
  }

  const dbPatch = {
    name: cleanedDisplayName,
    display_name: cleanedDisplayName,
    username: cleanedUsername,
    email: cleanedUsername,
    role: normalizeAccountRole(payload.role),
  };

  const { data, error } = await supabase
    .from('admin_accounts')
    .update(dbPatch)
    .eq('id', accountId)
    .select('*')
    .single();

  if (error) throw error;
  return rowToAdminAccount((data ?? { id: accountId, ...dbPatch }) as UnknownRow);
}

/**
 * Super Admin đặt lại / đổi mật khẩu cho bất kỳ tài khoản nào.
 */
export async function resetAccountPasswordDb(
  accountId: string,
  newPassword: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const { error } = await supabase
    .from('admin_accounts')
    .update({ password: newPassword })
    .eq('id', accountId);

  if (error) throw error;
}

export async function insertAdminAccountDb(
  account: AdminAccount
): Promise<AdminAccount> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const cleanedUsername = (account.username || account.email)
    .trim()
    .toLowerCase();
  const taken = await checkUsernameTakenDb(cleanedUsername);
  if (taken) {
    throw new Error('Tên đăng nhập / Email này đã tồn tại trên hệ thống.');
  }

  const row = accountToDbRow(account);
  const { data, error } = await supabase
    .from('admin_accounts')
    .insert(row)
    .select('*')
    .single();

  if (error) throw error;
  return rowToAdminAccount((data ?? row) as UnknownRow);
}

export async function bulkInsertAdminAccountsDb(
  accounts: AdminAccount[]
): Promise<AdminAccount[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const rows = accounts.map(accountToDbRow);
  const { data, error } = await supabase
    .from('admin_accounts')
    .upsert(rows, { onConflict: 'email' })
    .select('*');

  if (error) throw error;
  return (data ?? rows).map((r) => rowToAdminAccount(r as UnknownRow));
}

export async function deleteAdminAccountDb(accountId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const { error } = await supabase
    .from('admin_accounts')
    .delete()
    .eq('id', accountId);

  if (error) throw error;
}

// ============================================================================
// BẢNG ARTICLES (Bản tin kể chuyện & tin tức cộng đồng)
// ============================================================================

function normalizeArticleSourceType(value: unknown): ArticleSourceType {
  return String(value ?? '').toLowerCase() === 'external_link'
    ? 'external_link'
    : 'original';
}

function normalizeArticleStatus(value: unknown): ArticleStatus {
  return String(value ?? '').toLowerCase() === 'draft' ? 'draft' : 'published';
}

function formatPublishedDateFallback(row: UnknownRow): string {
  const direct = String(row.published_at ?? '').trim();
  if (direct) {
    // Nếu là chuỗi ISO (YYYY-MM-DD...) thì chuyển sang dd/mm/yyyy dễ đọc
    if (/^\d{4}-\d{2}-\d{2}/.test(direct)) {
      const parsed = new Date(direct);
      if (!Number.isNaN(parsed.getTime())) {
        return formatVietnamDate(parsed);
      }
    }
    return direct;
  }
  const created = String(row.created_at ?? '').trim();
  if (created) {
    const parsed = new Date(created);
    if (!Number.isNaN(parsed.getTime())) {
      return formatVietnamDate(parsed);
    }
  }
  return formatVietnamDate();
}

export function rowToArticle(row: UnknownRow): Article {
  const sourceType = normalizeArticleSourceType(row.source_type);
  const externalUrl = sanitizeExternalUrl(
    String(row.external_url ?? row.source_url ?? '')
  );
  const imageUrl = sanitizeImageSrc(
    String(row.image_url ?? row.cover_image ?? row.thumbnail_url ?? '')
  );

  return {
    id: String(row.id ?? `art-${Date.now()}`),
    title: String(row.title ?? 'Bài viết chưa có tiêu đề').trim(),
    subtitle: String(row.subtitle ?? row.summary ?? row.sapo ?? '').trim(),
    content: sanitizeRichHtmlString(String(row.content ?? '')),
    imageUrl,
    imageCaption: String(row.image_caption ?? '').trim() || undefined,
    category: String(row.category ?? 'Chuyện nghề vỉa hè').trim() || 'Chuyện nghề vỉa hè',
    sourceType,
    externalUrl,
    sourceName: String(row.source_name ?? '').trim() || undefined,
    authorName: String(row.author_name ?? row.author ?? 'Ban biên tập Góc Thợ').trim(),
    relatedArtisanId: String(row.related_artisan_id ?? '').trim() || undefined,
    isSpotlight: Boolean(row.is_spotlight ?? row.is_hero ?? false),
    isFeatured: Boolean(row.is_featured ?? false),
    isPinned: Boolean(row.is_pinned ?? false),
    status: normalizeArticleStatus(row.status),
    publishedAt: formatPublishedDateFallback(row),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function articleToDbRow(article: Article) {
  return {
    id: article.id,
    title: article.title.trim(),
    subtitle: article.subtitle.trim(),
    content: sanitizeRichHtmlString(article.content),
    image_url: sanitizeImageSrc(article.imageUrl) ?? null,
    image_caption: article.imageCaption?.trim() ?? '',
    category: article.category.trim() || 'Chuyện nghề vỉa hè',
    source_type: normalizeArticleSourceType(article.sourceType),
    external_url: sanitizeExternalUrl(article.externalUrl) ?? null,
    source_name: article.sourceName?.trim() || null,
    author_name: article.authorName.trim() || 'Ban biên tập Góc Thợ',
    related_artisan_id: article.relatedArtisanId?.trim() || null,
    is_spotlight: Boolean(article.isSpotlight),
    is_featured: Boolean(article.isFeatured),
    is_pinned: Boolean(article.isPinned),
    status: normalizeArticleStatus(article.status),
    published_at: article.publishedAt || formatVietnamDate(),
    updated_at: new Date().toISOString(),
  };
}

export async function fetchPublishedArticlesDb(): Promise<Article[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('is_pinned', { ascending: false })
    .order('is_spotlight', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => rowToArticle(r as UnknownRow));
}

export async function fetchAllArticlesForAdminDb(): Promise<Article[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => rowToArticle(r as UnknownRow));
}

export async function upsertArticleDb(article: Article): Promise<Article> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const row = articleToDbRow(article);
  const { data, error } = await supabase
    .from('articles')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return rowToArticle((data ?? row) as UnknownRow);
}

export async function updateArticleStatusDb(
  articleId: string,
  status: ArticleStatus
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const { error } = await supabase
    .from('articles')
    .update({
      status: normalizeArticleStatus(status),
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId);

  if (error) throw error;
}

export async function deleteArticleDb(articleId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', articleId);

  if (error) throw error;
}

export async function bulkUpsertArticlesDb(
  articles: Article[]
): Promise<Article[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const rows = articles.map(articleToDbRow);
  const { data, error } = await supabase
    .from('articles')
    .upsert(rows, { onConflict: 'id' })
    .select('*');

  if (error) throw error;
  return (data ?? rows).map((r) => rowToArticle(r as UnknownRow));
}

export interface MicrolinkExtractedArticle {
  title: string;
  description: string;
  imageUrl?: string;
  publisher: string;
  externalUrl: string;
}

const ARTICLE_FETCH_TIMEOUT_MS = 12_000;

async function fetchJsonWithTimeout<T>(
  endpoint: string,
  timeoutMs = ARTICLE_FETCH_TIMEOUT_MS
): Promise<T | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('json')) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    window.clearTimeout(timer);
    return null;
  }
}

function resolveSafeArticleImage(
  rawImg: string | null | undefined,
  pageUrl: string
): string | undefined {
  if (!rawImg || typeof rawImg !== 'string') return undefined;
  const trimmed = rawImg.trim();
  if (!trimmed) return undefined;
  try {
    const resolved = new URL(trimmed, pageUrl).toString();
    return sanitizeImageSrc(resolved);
  } catch {
    return sanitizeImageSrc(trimmed);
  }
}

function parseMetaFromHtmlInBrowser(
  html: string,
  pageUrl: string,
  fallbackHost: string
): MicrolinkExtractedArticle | null {
  if (!html || !html.trim() || typeof DOMParser === 'undefined') return null;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const getMeta = (selector: string): string =>
    (doc.querySelector(selector)?.getAttribute('content') ?? '').trim();

  const title =
    getMeta('meta[property="og:title"]') ||
    getMeta('meta[name="twitter:title"]') ||
    (doc.querySelector('title')?.textContent ?? '').trim();

  const description =
    getMeta('meta[property="og:description"]') ||
    getMeta('meta[name="description"]') ||
    getMeta('meta[name="twitter:description"]');

  const rawImg =
    getMeta('meta[property="og:image:secure_url"]') ||
    getMeta('meta[property="og:image"]') ||
    getMeta('meta[name="twitter:image"]') ||
    getMeta('meta[name="twitter:image:src"]');

  const imageUrl = resolveSafeArticleImage(rawImg, pageUrl);
  const publisher =
    getMeta('meta[property="og:site_name"]') || fallbackHost;

  if (!title && !description && !imageUrl) {
    return null;
  }

  return {
    title,
    description,
    imageUrl,
    publisher,
    externalUrl: pageUrl,
  };
}

/**
 * Cơ chế lấy thông tin bài báo 3 lớp ổn định:
 * - Lớp 1: Vercel Serverless API `/api/fetch-article` (ưu tiên, nhanh & không giới hạn)
 * - Lớp 2: Microlink API `https://api.microlink.io` (dự phòng khi chạy local preview hoặc Lớp 1 lỗi)
 * - Lớp 3: AllOrigins `https://api.allorigins.win/get` + bóc tách thẻ OpenGraph ngay trên trình duyệt
 */
export async function fetchMicrolinkMetadata(
  rawUrl: string
): Promise<{
  ok: boolean;
  data?: MicrolinkExtractedArticle;
  error?: string;
  normalizedUrl?: string;
}> {
  const checked = validatePublicArticleUrl(rawUrl);
  if (!checked.ok || !checked.normalized) {
    return { ok: false, error: checked.error ?? 'URL không hợp lệ.' };
  }

  const safeUrl = checked.normalized;
  let fallbackHost = '';
  try {
    fallbackHost = new URL(safeUrl).hostname.replace(/^www\./i, '');
  } catch {
    fallbackHost = '';
  }

  // LỚP 1: Vercel Serverless Function `/api/fetch-article` (timeout 12 giây)
  const layer1 = await fetchJsonWithTimeout<{
    ok?: boolean;
    data?: {
      title?: string | null;
      description?: string | null;
      image?: string | null;
      publisher?: string | null;
      url?: string | null;
    };
  }>(`/api/fetch-article?url=${encodeURIComponent(safeUrl)}`);

  if (layer1?.ok && layer1.data) {
    const title = String(layer1.data.title ?? '').trim();
    const description = String(layer1.data.description ?? '').trim();
    const imageUrl = resolveSafeArticleImage(layer1.data.image, safeUrl);
    const publisher =
      String(layer1.data.publisher ?? '').trim() || fallbackHost;
    const finalUrl = sanitizeExternalUrl(layer1.data.url) || safeUrl;

    if (title || description || imageUrl) {
      return {
        ok: true,
        normalizedUrl: finalUrl,
        data: {
          title,
          description,
          imageUrl,
          publisher,
          externalUrl: finalUrl,
        },
      };
    }
  }

  // LỚP 2: Microlink API (dự phòng khi chạy local hoặc Lớp 1 lỗi — timeout 12 giây)
  const layer2 = await fetchJsonWithTimeout<{
    status?: string;
    data?: {
      title?: string | null;
      description?: string | null;
      image?: { url?: string | null } | null;
      logo?: { url?: string | null } | null;
      publisher?: string | null;
    };
  }>(`https://api.microlink.io?url=${encodeURIComponent(safeUrl)}`);

  if (layer2?.data) {
    const meta = layer2.data;
    const title = String(meta.title ?? '').trim();
    const description = String(meta.description ?? '').trim();
    const rawImg = meta.image?.url ?? meta.logo?.url ?? '';
    const imageUrl = resolveSafeArticleImage(rawImg, safeUrl);
    const publisher = String(meta.publisher ?? '').trim() || fallbackHost;

    if (title || description || imageUrl) {
      return {
        ok: true,
        normalizedUrl: safeUrl,
        data: {
          title,
          description,
          imageUrl,
          publisher,
          externalUrl: safeUrl,
        },
      };
    }
  }

  // LỚP 3: AllOrigins proxy + bóc tách og:title, og:description, og:image trên trình duyệt (timeout 12 giây)
  const layer3 = await fetchJsonWithTimeout<{
    contents?: string | null;
  }>(`https://api.allorigins.win/get?url=${encodeURIComponent(safeUrl)}`);

  if (layer3?.contents) {
    const parsed = parseMetaFromHtmlInBrowser(
      layer3.contents,
      safeUrl,
      fallbackHost
    );
    if (parsed) {
      return {
        ok: true,
        normalizedUrl: safeUrl,
        data: parsed,
      };
    }
  }

  // Chỉ thông báo lỗi khi cả 3 lớp đều thất bại
  return {
    ok: false,
    normalizedUrl: safeUrl,
    error:
      'Không thể lấy dữ liệu tự động từ trang báo này sau khi thử đủ 3 nguồn kết nối (trang báo có thể chặn truy cập tự động). Bạn vẫn có thể mở trình soạn thảo để tự dán tiêu đề và ảnh nhé.',
  };
}
