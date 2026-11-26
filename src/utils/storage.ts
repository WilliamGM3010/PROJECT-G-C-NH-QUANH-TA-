import type {
  AdminAccount,
  AdminRole,
  AppBackupPayload,
  Artisan,
  ArtisanStatus,
  CraftCategory,
  District,
  IllustrationVariant,
  ParkingInfo,
  PaymentMethod,
} from '../types/artisan';
import { CRAFT_CATEGORIES, DISTRICT_COORDS, DISTRICTS } from '../data/artisans';

export const STORAGE_KEYS = {
  ARTISANS: 'gtqt_v2_artisans',
  PENDING: 'gtqt_v2_pending_suggestions',
  REPORTS: 'gtqt_v2_status_reports',
  ADMINS: 'gtqt_v2_admin_accounts',
  CURRENT_ADMIN: 'gtqt_v2_current_admin_id',
  REVIVED_COUNT: 'gtqt_v2_revived_count',
  KUDOS_REACTED: 'gtqt_v2_kudos_reacted',
  AUDIT_LOGS: 'gtqt_v2_audit_logs',
  THANK_YOU_NOTES: 'gtqt_v2_thank_you_notes',
  USER_CONTRIBUTION: 'gtqt_v2_user_contribution',
} as const;

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Bỏ qua lỗi khi bộ nhớ trình duyệt đầy hoặc ở chế độ ẩn danh hạn chế
  }
}

export function formatVietnamTimestamp(date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${hh}:${mm} · ${dd}/${mo}/${yyyy}`;
}

export function formatVietnamDate(date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mo}/${yyyy}`;
}

export function toIsoDate(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mo}-${dd}`;
}

export function parseArtisanVerifiedDate(
  artisan: Pick<Artisan, 'lastVerifiedDate' | 'verifiedDate'>
): Date | null {
  if (artisan.lastVerifiedDate) {
    const isoParts = artisan.lastVerifiedDate.split('-').map(Number);
    if (isoParts.length === 3 && isoParts.every((n) => !Number.isNaN(n))) {
      return new Date(isoParts[0], isoParts[1] - 1, isoParts[2]);
    }
  }
  if (artisan.verifiedDate) {
    const vnParts = artisan.verifiedDate.split('/').map(Number);
    if (vnParts.length === 3 && vnParts.every((n) => !Number.isNaN(n))) {
      return new Date(vnParts[2], vnParts[1] - 1, vnParts[0]);
    }
  }
  return null;
}

export function getDaysSinceVerified(
  artisan: Pick<Artisan, 'lastVerifiedDate' | 'verifiedDate'>
): number {
  const parsed = parseArtisanVerifiedDate(artisan);
  if (!parsed) return 0;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startVerified = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );
  const diffMs = startToday.getTime() - startVerified.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function isVerificationStale(
  artisan: Pick<Artisan, 'lastVerifiedDate' | 'verifiedDate'>,
  thresholdDays = 30
): boolean {
  return getDaysSinceVerified(artisan) > thresholdDays;
}

function escapeCsvField(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportArtisansToCsv(artisans: Artisan[]): void {
  const headers = [
    'ID',
    'Tên cô chú',
    'Dịch vụ',
    'Khu vực',
    'Vĩ độ (Lat)',
    'Kinh độ (Lng)',
    'Mốc nhận diện',
    'Khung giờ',
    'Giá từ',
    'Thanh toán',
    'Chỗ đậu xe',
    'Trạng thái',
    'Hiển thị',
    'Ngày xác minh',
    'Người phụ trách (PIC)',
    'Ghi chú nội bộ',
  ];

  const statusText: Record<ArtisanStatus, string> = {
    working: 'Đang làm việc',
    off_today: 'Hôm nay nghỉ',
    relocated: 'Đã chuyển chỗ / Sai thông tin',
  };

  const rows = artisans.map((a) =>
    [
      a.id,
      a.name,
      a.categories.join('; '),
      a.district,
      String(a.coordinates.lat),
      String(a.coordinates.lng),
      a.addressLandmark,
      a.hours,
      a.minPriceLabel,
      a.paymentMethod,
      a.parkingInfo,
      statusText[a.status],
      a.isHidden ? 'Đang ẩn' : 'Hiển thị',
      a.verifiedDate,
      a.pic ?? '',
      a.internalNotes ?? '',
    ]
      .map(escapeCsvField)
      .join(',')
  );

  const csvContent = `\uFEFF${headers.map(escapeCsvField).join(',')}\n${rows.join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const today = new Date().toISOString().slice(0, 10);
  triggerFileDownload(blob, `goc-tho-quanh-ta-${today}.csv`);
}

/**
 * Tải file CSV mẫu chuẩn tiếng Việt để nhập hàng loạt cô chú thợ.
 */
export function downloadArtisansCsvTemplate(): void {
  const headers = [
    'Tên cô chú',
    'Dịch vụ',
    'Khu vực',
    'Vĩ độ (Lat)',
    'Kinh độ (Lng)',
    'Mốc nhận diện',
    'Khung giờ',
    'Giá từ',
    'Thanh toán',
    'Chỗ đậu xe',
    'Các lỗi nhận sửa',
    'Giới thiệu ngắn',
    'Người phụ trách (PIC)',
    'Ghi chú nội bộ',
  ];

  const sampleRows = [
    [
      'Chú Chín – Sửa Giày & Dán Đế',
      'Sửa giày dép; Sửa balo/túi',
      'Bình Thạnh',
      '10.8052',
      '106.7118',
      'Vỉa hè trước số 88 Xô Viết Nghệ Tĩnh, gần ngã tư Hàng Xanh',
      '08:00 – 17:30 (T2–T7)',
      'Từ 15k',
      'Có chuyển khoản',
      'Dễ đậu xe',
      'bung đế giày, khâu viền sneaker, thay khóa balo',
      'Chú làm cẩn thận, báo giá trước khi dán keo.',
      'William Gia Minh',
      'Đã gửi bảng QR cho chú ngày khảo sát',
    ],
    [
      'Cô Xuân – May Vá Nhanh',
      'May vá',
      'Quận 3',
      '10.7834',
      '106.6872',
      'Đầu hẻm 112 Nguyễn Đình Chiểu, ngồi cạnh quán cà phê cóc',
      '08:30 – 17:00 (T2–T7)',
      'Từ 15k',
      'Chỉ tiền mặt',
      'Gửi xe gần đó',
      'lên lai quần, bóp eo, thay dây kéo',
      'Cô may kỹ, nhận lấy liền trong 20 phút.',
      'Quang Huy',
      'Liên hệ khảo sát buổi sáng tránh giờ trưa',
    ],
  ];

  const csvContent = `\uFEFF${headers.map(escapeCsvField).join(',')}\n${sampleRows
    .map((r) => r.map(escapeCsvField).join(','))
    .join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(blob, 'mau-nhap-goc-tho-quanh-ta.csv');
}

function parseCsvRows(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field.trim());
      field = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
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

/**
 * Đọc file CSV tiếng Việt thành danh sách Artisan hợp lệ (hỗ trợ cả file mẫu và file Xuất CSV).
 */
export function parseArtisansFromCsv(csvText: string): {
  artisans: Artisan[];
  skipped: number;
} {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return { artisans: [], skipped: 0 };
  }

  const headerNorm = rows[0].map((h) => h.toLowerCase().trim());
  const findCol = (keywords: string[]): number =>
    headerNorm.findIndex((h) => keywords.some((kw) => h.includes(kw)));

  const idxName = findCol(['tên cô chú', 'tên', 'name']);
  const idxServices = findCol(['dịch vụ', 'category', 'nghề']);
  const idxDistrict = findCol(['khu vực', 'quận', 'district']);
  const idxLat = findCol(['vĩ độ', 'lat']);
  const idxLng = findCol(['kinh độ', 'lng']);
  const idxLandmark = findCol(['mốc nhận diện', 'địa chỉ', 'landmark']);
  const idxHours = findCol(['khung giờ', 'giờ', 'hours']);
  const idxPrice = findCol(['giá từ', 'giá', 'price']);
  const idxPayment = findCol(['thanh toán', 'payment']);
  const idxParking = findCol(['đậu xe', 'parking']);
  const idxProblems = findCol(['lỗi', 'vấn đề', 'problems']);
  const idxStory = findCol(['giới thiệu', 'câu chuyện', 'story']);
  const idxPic = findCol(['phụ trách', 'pic']);
  const idxNotes = findCol(['ghi chú nội bộ', 'nội bộ', 'notes']);

  const todayVn = formatVietnamDate();
  const todayIso = toIsoDate();
  const imported: Artisan[] = [];
  let skipped = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const r = rows[i];
    const getCell = (colIdx: number) =>
      colIdx >= 0 && colIdx < r.length ? r[colIdx].trim() : '';

    const rawName = getCell(idxName >= 0 ? idxName : 0);
    if (rawName.length < 2) {
      skipped += 1;
      continue;
    }

    const rawDistrict = getCell(idxDistrict);
    const district: District =
      DISTRICTS.find(
        (d) => d.toLowerCase() === rawDistrict.toLowerCase()
      ) ?? 'Bình Thạnh';

    const rawServices = getCell(idxServices)
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const categories: CraftCategory[] = rawServices
      .map((s) =>
        CRAFT_CATEGORIES.find((c) => c.toLowerCase() === s.toLowerCase())
      )
      .filter((c): c is CraftCategory => Boolean(c));
    const finalCategories: CraftCategory[] =
      categories.length > 0 ? categories : ['Sửa giày dép'];

    const latParsed = Number.parseFloat(getCell(idxLat));
    const lngParsed = Number.parseFloat(getCell(idxLng));
    const fallbackCoord = DISTRICT_COORDS[district];
    const lat = Number.isFinite(latParsed)
      ? latParsed
      : fallbackCoord.lat + (i * 0.0004) % 0.004;
    const lng = Number.isFinite(lngParsed)
      ? lngParsed
      : fallbackCoord.lng + (i * 0.0004) % 0.004;

    const paymentMethod: PaymentMethod = getCell(idxPayment)
      .toLowerCase()
      .includes('chuyển khoản')
      ? 'Có chuyển khoản'
      : 'Chỉ tiền mặt';

    const parkingInfo: ParkingInfo = getCell(idxParking)
      .toLowerCase()
      .includes('gửi xe')
      ? 'Gửi xe gần đó'
      : 'Dễ đậu xe';

    const minPriceLabel = getCell(idxPrice) || 'Từ 15k';
    const addressLandmark =
      getCell(idxLandmark) || `Góc phố khu vực ${district}, TP.HCM`;
    const hours = getCell(idxHours) || '08:00 – 17:30 (T2–T7)';
    const problems = getCell(idxProblems)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const firstPart = rawName.split(/[–-]/)[0]?.trim() || rawName;

    imported.push({
      id: `csv-${Date.now()}-${i}`,
      name: rawName,
      shortTitle: `${firstPart} · ${finalCategories[0]}`,
      categories: finalCategories,
      district,
      coordinates: { lat, lng },
      addressLandmark,
      problems:
        problems.length > 0
          ? problems
          : finalCategories.map((c) => c.toLowerCase()),
      hours,
      minPriceLabel,
      prices: [
        {
          service: problems[0] || finalCategories[0],
          priceRange: minPriceLabel,
        },
      ],
      story:
        getCell(idxStory) ||
        `Góc thợ được nhập từ danh sách khảo sát tại ${district}.`,
      status: 'working',
      verifiedDate: todayVn,
      lastVerifiedDate: todayIso,
      paymentMethod,
      parkingInfo,
      hasConsent: true,
      hidePortrait: true,
      isHidden: false,
      illustrationVariant: mapCategoryToIllustration(finalCategories[0]),
      kudos: { sturdy: 1, studentPrice: 1, fast: 1, friendly: 1 },
      praises: [],
      revivedCount: 0,
      pic: getCell(idxPic) || undefined,
      internalNotes: getCell(idxNotes) || undefined,
    });
  }

  return { artisans: imported, skipped };
}

/**
 * Sao lưu toàn bộ dữ liệu ứng dụng thành 1 file JSON.
 */
export function exportBackupJson(payload: AppBackupPayload): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const today = new Date().toISOString().slice(0, 10);
  triggerFileDownload(blob, `backup-goc-tho-quanh-ta-${today}.json`);
}

/**
 * Kiểm tra và khôi phục dữ liệu từ file JSON đã sao lưu.
 */
export function parseBackupJson(jsonText: string): AppBackupPayload {
  const parsed = JSON.parse(jsonText) as Partial<AppBackupPayload>;
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray(parsed.artisans) ||
    !Array.isArray(parsed.adminAccounts)
  ) {
    throw new Error(
      'Tệp JSON không đúng định dạng sao lưu của Góc Thợ Quanh Ta.'
    );
  }

  return {
    version: typeof parsed.version === 'number' ? parsed.version : 2,
    exportedAt:
      typeof parsed.exportedAt === 'string'
        ? parsed.exportedAt
        : formatVietnamTimestamp(),
    artisans: parsed.artisans,
    pendingSuggestions: Array.isArray(parsed.pendingSuggestions)
      ? parsed.pendingSuggestions
      : [],
    statusReports: Array.isArray(parsed.statusReports)
      ? parsed.statusReports
      : [],
    thankYouNotes: Array.isArray(parsed.thankYouNotes)
      ? parsed.thankYouNotes
      : [],
    auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
    adminAccounts: parsed.adminAccounts,
    revivedCount:
      typeof parsed.revivedCount === 'number' ? parsed.revivedCount : 38,
  };
}

/**
 * Tải file CSV mẫu để nhập hàng loạt tài khoản Admin / Cộng tác viên.
 */
export function downloadAdminAccountsCsvTemplate(): void {
  const headers = ['Họ tên', 'Email', 'Mật khẩu', 'Vai trò'];
  const sampleRows = [
    ['Lan Phương (CTV Bình Thạnh)', 'lanphuong@goctho.vn', 'ctv2026', 'Cộng tác viên'],
    ['Đức Anh (CTV Quận 3)', 'ducanh@goctho.vn', 'ctv2026', 'Cộng tác viên'],
    ['Hoàng Nam (Điều phối)', 'hoangnam@goctho.vn', 'admin2026', 'Super Admin'],
  ];
  const csvContent = `\uFEFF${headers.map(escapeCsvField).join(',')}\n${sampleRows
    .map((r) => r.map(escapeCsvField).join(','))
    .join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(blob, 'mau-nhap-tai-khoan-admin.csv');
}

/**
 * Đọc file CSV danh sách tài khoản quản trị mới, tự động bỏ qua dòng thiếu thông tin hoặc trùng email.
 */
export function parseAdminAccountsFromCsv(
  csvText: string,
  existingEmails: string[]
): {
  accounts: AdminAccount[];
  skipped: number;
  duplicates: number;
} {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return { accounts: [], skipped: 0, duplicates: 0 };
  }

  const headerNorm = rows[0].map((h) => h.toLowerCase().trim());
  const findCol = (keywords: string[]): number =>
    headerNorm.findIndex((h) => keywords.some((kw) => h.includes(kw)));

  const idxName = findCol(['họ tên', 'tên', 'name']);
  const idxEmail = findCol(['email', 'mail']);
  const idxPassword = findCol(['mật khẩu', 'password', 'pass']);
  const idxRole = findCol(['vai trò', 'quyền', 'role']);

  const seenEmails = new Set(existingEmails.map((e) => e.toLowerCase().trim()));
  const todayVn = formatVietnamDate();
  const accounts: AdminAccount[] = [];
  let skipped = 0;
  let duplicates = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const r = rows[i];
    const getCell = (colIdx: number, fallbackIdx: number) => {
      const idx = colIdx >= 0 ? colIdx : fallbackIdx;
      return idx >= 0 && idx < r.length ? r[idx].trim() : '';
    };

    const name = getCell(idxName, 0);
    const email = getCell(idxEmail, 1).toLowerCase();
    const password = getCell(idxPassword, 2);
    const rawRole = getCell(idxRole, 3).toLowerCase();

    if (name.length < 2 || !email.includes('@') || password.length < 4) {
      skipped += 1;
      continue;
    }

    if (seenEmails.has(email)) {
      duplicates += 1;
      continue;
    }

    seenEmails.add(email);
    const role: AdminRole = rawRole.includes('super')
      ? 'Super Admin'
      : 'Cộng tác viên';

    accounts.push({
      id: `admin-csv-${Date.now()}-${i}`,
      name,
      email,
      password,
      role,
      active: true,
      createdAt: todayVn,
    });
  }

  return { accounts, skipped, duplicates };
}

