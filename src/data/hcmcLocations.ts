import type { Coordinates } from '../types/artisan';

const PHUONG_NAMES = [
  'An Đông',
  'An Hội Đông',
  'An Hội Tây',
  'An Khánh',
  'An Lạc',
  'An Nhơn',
  'An Phú',
  'An Phú Đông',
  'Bà Rịa',
  'Bàn Cờ',
  'Bảy Hiền',
  'Bến Cát',
  'Bến Thành',
  'Bình Cơ',
  'Bình Đông',
  'Bình Dương',
  'Bình Hòa',
  'Bình Hưng Hòa',
  'Bình Lợi Trung',
  'Bình Phú',
  'Bình Quới',
  'Bình Tân',
  'Bình Tây',
  'Bình Thạnh',
  'Bình Thới',
  'Bình Tiên',
  'Bình Trị Đông',
  'Bình Trưng',
  'Cát Lái',
  'Cầu Kiệu',
  'Cầu Ông Lãnh',
  'Chánh Hiệp',
  'Chánh Hưng',
  'Chánh Phú Hòa',
  'Chợ Lớn',
  'Chợ Quán',
  'Dĩ An',
  'Diên Hồng',
  'Đông Hòa',
  'Đông Hưng Thuận',
  'Đức Nhuận',
  'Gia Định',
  'Gò Vấp',
  'Hạnh Thông',
  'Hiệp Bình',
  'Hòa Bình',
  'Hòa Hưng',
  'Hòa Lợi',
  'Khánh Hội',
  'Lái Thiêu',
  'Linh Xuân',
  'Long Bình',
  'Long Hương',
  'Long Nguyên',
  'Long Phước',
  'Long Trường',
  'Minh Phụng',
  'Nhiêu Lộc',
  'Phú An',
  'Phú Định',
  'Phú Lâm',
  'Phú Lợi',
  'Phú Mỹ',
  'Phú Nhuận',
  'Phú Thạnh',
  'Phú Thọ',
  'Phú Thọ Hòa',
  'Phú Thuận',
  'Phước Long',
  'Phước Thắng',
  'Rạch Dừa',
  'Sài Gòn',
  'Tam Bình',
  'Tam Long',
  'Tam Thắng',
  'Tân Bình',
  'Tân Định',
  'Tân Đông Hiệp',
  'Tân Hải',
  'Tân Hiệp',
  'Tân Hòa',
  'Tân Hưng',
  'Tân Khánh',
  'Tân Mỹ',
  'Tân Phú',
  'Tân Phước',
  'Tân Sơn',
  'Tân Sơn Hòa',
  'Tân Sơn Nhất',
  'Tân Sơn Nhì',
  'Tân Tạo',
  'Tân Thành',
  'Tân Thới Hiệp',
  'Tân Thuận',
  'Tân Uyên',
  'Tăng Nhơn Phú',
  'Tây Nam',
  'Tây Thạnh',
  'Thạnh Mỹ Tây',
  'Thông Tây Hội',
  'Thới An',
  'Thới Hòa',
  'Thủ Dầu Một',
  'Thủ Đức',
  'Thuận An',
  'Thuận Giao',
  'Trung Mỹ Tây',
  'Vĩnh Hội',
  'Vĩnh Tân',
  'Vũng Tàu',
  'Vườn Lài',
  'Xóm Chiếu',
  'Xuân Hòa',
];

const XA_NAMES = [
  'An Long',
  'An Nhơn Tây',
  'An Thới Đông',
  'Bà Điểm',
  'Bàu Bàng',
  'Bàu Lâm',
  'Bắc Tân Uyên',
  'Bình Chánh',
  'Bình Châu',
  'Bình Giã',
  'Bình Hưng',
  'Bình Khánh',
  'Bình Lợi',
  'Bình Mỹ',
  'Cần Giờ',
  'Châu Đức',
  'Châu Pha',
  'Củ Chi',
  'Dầu Tiếng',
  'Đất Đỏ',
  'Đông Thạnh',
  'Hiệp Phước',
  'Hòa Hiệp',
  'Hòa Hội',
  'Hồ Tràm',
  'Hóc Môn',
  'Hưng Long',
  'Kim Long',
  'Long Điền',
  'Long Hải',
  'Long Hòa',
  'Long Sơn',
  'Minh Thạnh',
  'Ngãi Giao',
  'Nghĩa Thành',
  'Nhà Bè',
  'Nhuận Đức',
  'Phú Giáo',
  'Phú Hòa Đông',
  'Phước Hải',
  'Phước Hòa',
  'Phước Thành',
  'Tân An Hội',
  'Tân Nhựt',
  'Tân Vĩnh Lộc',
  'Thái Mỹ',
  'Thanh An',
  'Thạnh An',
  'Thường Tân',
  'Trừ Văn Thố',
  'Vĩnh Lộc',
  'Xuân Sơn',
  'Xuân Thới Sơn',
  'Xuyên Mộc',
];

const DAC_KHU_NAMES = ['Côn Đảo'];

export const HCMC_PHUONG = PHUONG_NAMES.map((n) => `Phường ${n}`);
export const HCMC_XA = XA_NAMES.map((n) => `Xã ${n}`);
export const HCMC_DAC_KHU = DAC_KHU_NAMES.map((n) => `Đặc khu ${n}`);

export const HCMC_ADMINISTRATIVE_UNITS = [
  ...HCMC_PHUONG,
  ...HCMC_XA,
  ...HCMC_DAC_KHU,
];

export const DEFAULT_HCMC_LOCATION = 'Phường Thạnh Mỹ Tây';

const CENTRAL_HCMC_FALLBACK: Coordinates = { lat: 10.788, lng: 106.705 };

/**
 * Tọa độ tham chiếu cho các khu vực trọng điểm TP.HCM (mới & cũ) khi chưa có tọa độ cụ thể.
 */
const KNOWN_LOCATION_COORDS: Record<string, Coordinates> = {
  'Phường Thạnh Mỹ Tây': { lat: 10.8015, lng: 106.7128 },
  'Phường Bình Thạnh': { lat: 10.8065, lng: 106.7068 },
  'Phường Gia Định': { lat: 10.8022, lng: 106.6975 },
  'Phường Bình Lợi Trung': { lat: 10.8184, lng: 106.7024 },
  'Phường Bình Quới': { lat: 10.8172, lng: 106.7305 },
  'Phường Sài Gòn': { lat: 10.7824, lng: 106.6998 },
  'Phường Bến Thành': { lat: 10.7725, lng: 106.698 },
  'Phường Tân Định': { lat: 10.7905, lng: 106.6908 },
  'Phường Cầu Ông Lãnh': { lat: 10.7646, lng: 106.6938 },
  'Phường Xuân Hòa': { lat: 10.7815, lng: 106.6905 },
  'Phường Bàn Cờ': { lat: 10.7725, lng: 106.6828 },
  'Phường Nhiêu Lộc': { lat: 10.7882, lng: 106.6815 },
  'Phường Thủ Đức': { lat: 10.8495, lng: 106.7634 },
  'Phường Linh Xuân': { lat: 10.8756, lng: 106.7681 },
  'Phường An Khánh': { lat: 10.7886, lng: 106.7346 },
  'Phường Phú Nhuận': { lat: 10.7996, lng: 106.6806 },
  'Phường Gò Vấp': { lat: 10.8386, lng: 106.6652 },
  'Phường Tân Bình': { lat: 10.8014, lng: 106.6528 },
  'Phường Dĩ An': { lat: 10.9068, lng: 106.7694 },
  'Phường Thủ Dầu Một': { lat: 10.9804, lng: 106.6519 },
  'Phường Vũng Tàu': { lat: 10.346, lng: 107.0843 },
  'Phường Bà Rịa': { lat: 10.4962, lng: 107.1684 },
  'Xã Cần Giờ': { lat: 10.4114, lng: 106.9547 },
  'Xã Nhà Bè': { lat: 10.6952, lng: 106.7357 },
  'Xã Hóc Môn': { lat: 10.8893, lng: 106.5955 },
  'Xã Củ Chi': { lat: 10.9733, lng: 106.4933 },
  'Xã Bình Chánh': { lat: 10.6873, lng: 106.5938 },
  'Đặc khu Côn Đảo': { lat: 8.683, lng: 106.606 },
  // Tương thích ngược với các bản ghi cũ trên Supabase
  'Bình Thạnh': { lat: 10.8015, lng: 106.7128 },
  'Quận 1': { lat: 10.7824, lng: 106.6998 },
  'Quận 3': { lat: 10.7791, lng: 106.6905 },
};

function normalizeLocationKey(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Loại bỏ các tiền tố hành chính (Phường / P. / Xã / Đặc khu / Ward / Commune / Special Zone)
 * để so khớp linh hoạt khi gõ lọc hoặc tìm kiếm.
 */
export function stripAdminUnitPrefix(normalizedText: string): string {
  return normalizedText
    .replace(
      /^(?:phuong|p|xa|dac khu|special zone|ward|commune)\s+/g,
      ''
    )
    .trim();
}

const CANONICAL_BY_FULL_NORM = new Map<string, string>();
const CANONICAL_BY_STRIPPED_NORM = new Map<string, string>();

for (const unit of HCMC_ADMINISTRATIVE_UNITS) {
  const norm = normalizeLocationKey(unit);
  CANONICAL_BY_FULL_NORM.set(norm, unit);
  const stripped = stripAdminUnitPrefix(norm);
  if (stripped && !CANONICAL_BY_STRIPPED_NORM.has(stripped)) {
    CANONICAL_BY_STRIPPED_NORM.set(stripped, unit);
  }
}

/**
 * Chuẩn hóa tên khu vực từ dữ liệu nhập/Supabase:
 * - Nếu khớp với 1 trong 168 đơn vị hành chính TP.HCM, trả về tên chuẩn đầy đủ (VD: "Phường Thạnh Mỹ Tây").
 * - Nếu là chuỗi khác đang tồn tại trên Supabase (VD dữ liệu cũ), giữ nguyên không ghi đè mất dữ liệu.
 * - Nếu rỗng, dùng mặc định "Phường Thạnh Mỹ Tây".
 */
export function resolveLocationName(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return DEFAULT_HCMC_LOCATION;

  const norm = normalizeLocationKey(raw);
  const exact = CANONICAL_BY_FULL_NORM.get(norm);
  if (exact) return exact;

  // Khớp trường hợp viết tắt như "P. Thạnh Mỹ Tây" hoặc "P Thạnh Mỹ Tây"
  if (/^(?:phuong|p)\s+/.test(norm)) {
    const stripped = stripAdminUnitPrefix(norm);
    const matchedPhuong = CANONICAL_BY_FULL_NORM.get(`phuong ${stripped}`);
    if (matchedPhuong) return matchedPhuong;
  }

  return raw;
}

/**
 * Kiểm tra chuỗi nhập của người dùng có khớp với 1 đơn vị hành chính hay không
 * (không dấu tiếng Việt, tự động bỏ tiền tố phường/xã/đặc khu).
 */
export function matchesAdminUnitQuery(unit: string, rawQuery: string): boolean {
  const queryNorm = normalizeLocationKey(rawQuery);
  if (!queryNorm) return true;

  const unitNorm = normalizeLocationKey(unit);
  if (unitNorm.includes(queryNorm)) return true;

  const queryStripped = stripAdminUnitPrefix(queryNorm);
  const unitStripped = stripAdminUnitPrefix(unitNorm);
  if (queryStripped && unitStripped.includes(queryStripped)) return true;

  // Hỗ trợ gõ nhiều từ rời (VD: "thanh tay" khớp "Phường Thạnh Mỹ Tây")
  const tokens = (queryStripped || queryNorm).split(' ').filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every((tok) => unitStripped.includes(tok) || unitNorm.includes(tok));
  }

  return false;
}

export function getLocationFallbackCoords(location: string): Coordinates {
  const trimmed = String(location ?? '').trim();
  if (trimmed && KNOWN_LOCATION_COORDS[trimmed]) {
    return KNOWN_LOCATION_COORDS[trimmed];
  }
  const canonical = resolveLocationName(trimmed);
  if (KNOWN_LOCATION_COORDS[canonical]) {
    return KNOWN_LOCATION_COORDS[canonical];
  }
  return CENTRAL_HCMC_FALLBACK;
}
