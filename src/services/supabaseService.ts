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
import { formatVietnamDate, formatVietnamTimestamp, toIsoDate } from '../utils/storage';

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
    return 'Chưa tìm thấy bảng dữ liệu trên Supabase. Vui lòng tạo 3 bảng artisans, status_reports, admin_accounts theo file supabase-schema.sql.';
  }

  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'Supabase đang chặn quyền truy cập bảng (RLS). Vui lòng bật policy cho phép đọc/ghi trên 3 bảng artisans, status_reports, admin_accounts.';
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
  const roleStr = String(row.role ?? '');
  const role: AdminRole = roleStr === 'Super Admin' ? 'Super Admin' : 'Cộng tác viên';
  return {
    id: String(row.id),
    name: String(row.name ?? row.email ?? 'Quản trị viên'),
    email: String(row.email ?? ''),
    password: String(row.password ?? ''),
    role,
    active: row.active === undefined ? true : Boolean(row.active),
    createdAt: String(row.created_at ?? row.createdAt ?? formatVietnamDate()),
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
// BẢNG admin_accounts
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

/**
 * Kiểm tra đăng nhập trực tiếp trên bảng admin_accounts của Supabase
 * (so khớp email & password bằng truy vấn tham số hóa).
 */
export async function authenticateAdminDb(
  identifier: string,
  password: string
): Promise<AdminAccount | null> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const cleaned = identifier.trim().toLowerCase();

  // Truy vấn so khớp chính xác email & password trên Supabase
  const { data, error } = await supabase
    .from('admin_accounts')
    .select('*')
    .eq('email', cleaned)
    .eq('password', password)
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    const acc = rowToAdminAccount(data[0] as UnknownRow);
    return acc.active ? acc : null;
  }

  // Nếu bảng admin_accounts trên Supabase hoàn toàn trống (lần đầu mới khởi tạo),
  // hỗ trợ tài khoản khởi tạo mặc định và tự đồng bộ lên bảng admin_accounts.
  const { count, error: countError } = await supabase
    .from('admin_accounts')
    .select('*', { count: 'exact', head: true });

  if (!countError && (count ?? 0) === 0) {
    const bootstrapMatch = INITIAL_ADMIN_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === cleaned && a.password === password
    );
    if (bootstrapMatch) {
      await supabase.from('admin_accounts').upsert(
        INITIAL_ADMIN_ACCOUNTS.map((a) => ({
          id: a.id,
          name: a.name,
          email: a.email,
          password: a.password,
          role: a.role,
          active: a.active,
          created_at: a.createdAt,
        })),
        { onConflict: 'email' }
      );
      return bootstrapMatch;
    }
  }

  return null;
}

export async function insertAdminAccountDb(
  account: AdminAccount
): Promise<AdminAccount> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình.');
  }

  const row = {
    id: account.id,
    name: account.name,
    email: account.email.trim().toLowerCase(),
    password: account.password,
    role: account.role,
    active: account.active,
    created_at: account.createdAt,
  };

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

  const rows = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email.trim().toLowerCase(),
    password: a.password,
    role: a.role,
    active: a.active,
    created_at: a.createdAt,
  }));

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
