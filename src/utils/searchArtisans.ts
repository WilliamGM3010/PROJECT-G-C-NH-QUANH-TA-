import type { Artisan, Coordinates, CraftCategory } from '../types/artisan';
import { calculateDistanceKm } from './geo';

export type CraftGroupId =
  | 'tailor'
  | 'shoes'
  | 'bag'
  | 'lock'
  | 'watch'
  | 'other';

/**
 * Bước 1: Chuẩn hóa chuỗi tiếng Việt không dấu, bỏ ký tự đặc biệt thừa và gom khoảng trắng.
 */
export function normalizeText(input: string): string {
  return (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Từ đệm phổ biến (tiếng Việt & tiếng Anh) bỏ qua khi tách từ nếu người dùng gõ nhiều từ.
 */
const STOP_WORDS = new Set([
  'can',
  'muon',
  'tim',
  'cho',
  'tiem',
  'goc',
  'tho',
  'sua',
  'bi',
  'hu',
  'hong',
  'gan',
  'day',
  'o',
  'fix',
  'repair',
  'near',
  'me',
  'shop',
  'need',
  'find',
  'a',
  'the',
  'my',
  'for',
]);

const STANDARD_CRAFT_CATEGORIES = new Set<string>([
  'sua giay dep',
  'may va',
  'sua khoa',
  'sua dong ho',
  'sua balo tui',
]);

interface CraftSynonymGroup {
  id: CraftGroupId;
  /** Các cụm từ đồng nghĩa đời thường (Việt không dấu + Anh) từ người dùng */
  querySynonyms: string[];
  /** Danh mục chuẩn của thợ */
  categories: CraftCategory[];
  /** Dấu hiệu nhận diện nhóm nghề trong tên/danh mục/lỗi nhận sửa/bảng giá của thợ */
  artisanIndicators: string[];
}

/**
 * Bước 4: Bộ Từ điển đồng nghĩa & Ý định sửa đồ song ngữ Việt–Anh.
 */
export const CRAFT_SYNONYM_GROUPS: CraftSynonymGroup[] = [
  {
    id: 'tailor',
    categories: ['May vá'],
    querySynonyms: [
      'may ao',
      'may quan',
      'may do',
      'may va',
      'sua ao',
      'sua quan',
      'sua do',
      'quan ao',
      'va do',
      'va ao',
      'va quan',
      'len lai',
      'cat lai',
      'cat ong',
      'bop eo',
      'bop ong',
      'noi rong',
      'dom cuc',
      'dom nut',
      'thay nut',
      'thay khoa quan',
      'day keo quan',
      'day keo ao',
      'rach ao',
      'rach quan',
      'ao dai',
      'so mi',
      'quan tay',
      'quan jean',
      'quan jeans',
      'vay',
      'dam',
      'ao khoac',
      'chi may',
      'thu ngan tay ao',
      'do len',
      'ao len',
      'mang va',
      'khuy ao',
      // English bilingual synonyms
      'tailor',
      'sewing',
      'alteration',
      'alterations',
      'clothes',
      'clothing',
      'shirt',
      'pants',
      'trousers',
      'jeans',
      'dress',
      'skirt',
      'hem',
      'hemming',
      'button',
      'mend',
      'mending',
      'stitch',
    ],
    artisanIndicators: [
      'may va',
      'quan ao',
      'sua do',
      'len lai',
      'bop eo',
      'may ao',
      'may quan',
      'may do',
      'sua ao',
      'sua quan',
      'va ao',
      'va quan',
      'va do',
      'dom nut',
      'dom cuc',
      'do len',
      'ao so mi',
      'ao dai',
      'chan vay',
      'lai vay',
      'tiem may',
      'tho may',
      'may may',
      'mang va',
    ],
  },
  {
    id: 'shoes',
    categories: ['Sửa giày dép'],
    querySynonyms: [
      'giay',
      'dep',
      'bung de',
      'ho keo',
      'dan keo',
      'dan giay',
      'may de',
      'khau giay',
      'khau de',
      'sua giay',
      'sua dep',
      'got giay',
      'danh giay',
      'danh xi',
      'sneaker',
      'sandal',
      'giay tay',
      'giay da',
      'bung keo',
      'lot giay',
      'mieng lot',
      // English bilingual synonyms
      'shoe',
      'shoes',
      'cobbler',
      'sole',
      'heel',
      'boots',
      'sandals',
      'polish',
      'shine',
    ],
    artisanIndicators: [
      'giay',
      'dep',
      'bung de',
      'ho keo',
      'dan keo',
      'dan giay',
      'khau de',
      'may de',
      'got giay',
      'danh xi',
      'sneaker',
      'sandal',
    ],
  },
  {
    id: 'bag',
    categories: ['Sửa balo/túi'],
    querySynonyms: [
      'balo',
      'ba lo',
      'tui',
      'tui xach',
      'cap',
      'vali',
      'banh xe vali',
      'tay keo',
      'dut quai',
      'quai deo',
      'khoa keo',
      'day keo',
      'sua vi',
      'sua bop',
      'dau keo',
      'con truot',
      // English bilingual synonyms
      'bag',
      'bags',
      'backpack',
      'luggage',
      'suitcase',
      'wallet',
      'purse',
      'strap',
      'handbag',
      'zipper',
    ],
    artisanIndicators: [
      'balo',
      'ba lo',
      'tui',
      'vali',
      'quai deo',
      'banh xe vali',
      'sua vi',
      'sua bop',
      'cap sach',
      'dau keo',
      'con truot',
    ],
  },
  {
    id: 'lock',
    categories: ['Sửa khóa'],
    querySynonyms: [
      'chia khoa',
      'cat chia',
      'danh chia',
      'lam chia',
      'sao chep chia',
      'mo khoa',
      'o khoa',
      'khoa cua',
      'khoa xe',
      'smartkey',
      'the tu',
      'sua khoa',
      'chia',
      // English bilingual synonyms
      'key',
      'keys',
      'lock',
      'locksmith',
      'padlock',
      'duplicate key',
      'copy key',
      'keycard',
    ],
    artisanIndicators: [
      'sua khoa',
      'chia khoa',
      'cat chia',
      'danh chia',
      'lam chia',
      'mo khoa',
      'o khoa',
      'smartkey',
      'the tu',
      'chia',
    ],
  },
  {
    id: 'watch',
    categories: ['Sửa đồng hồ'],
    querySynonyms: [
      'dong ho',
      'thay pin',
      'cat mat',
      'thay day dong ho',
      'vo kinh',
      'mat kinh dong ho',
      'dung kim',
      'lau dau',
      'pin dong ho',
      // English bilingual synonyms
      'watch',
      'watches',
      'watchmaker',
      'battery',
      'clock',
    ],
    artisanIndicators: [
      'dong ho',
      'thay pin',
      'cat mat',
      'lau dau',
      'pin dong ho',
    ],
  },
  {
    id: 'other',
    categories: [],
    querySynonyms: [
      'sua xe',
      'va xe',
      'bom xe',
      'thay ruot',
      'xe may',
      'xe dap',
      'sua o',
      'sua du',
      'o du',
      'do dien',
      'dien gia dung',
      'quat',
      'noi com',
      'am sieu toc',
      'ban ui',
      'o cam',
      'mai dao',
      'mai keo',
      // English bilingual synonyms
      'bike',
      'bicycle',
      'motorbike',
      'scooter',
      'tire',
      'umbrella',
      'electronics',
      'fan',
      'rice cooker',
      'kettle',
      'iron',
      'knife',
      'scissors',
      'sharpen',
    ],
    artisanIndicators: [
      'sua xe',
      'va xe',
      'bom xe',
      'thay ruot',
      'sua xe may',
      'xe dap',
      'va vo',
      'thay nhot',
      'sua o',
      'sua du',
      'o du',
      'do dien',
      'dien gia dung',
      'dien tu',
      'quat',
      'noi com',
      'am sieu toc',
      'ban ui',
      'o cam',
      'mai dao',
      'mai keo',
    ],
  },
];

const CRAFT_GROUP_MAP: Record<CraftGroupId, CraftSynonymGroup> =
  CRAFT_SYNONYM_GROUPS.reduce(
    (acc, group) => {
      acc[group.id] = group;
      return acc;
    },
    {} as Record<CraftGroupId, CraftSynonymGroup>
  );

/**
 * Kiểm tra cụm từ nằm trọn theo ranh giới từ (tránh "ao" khớp nhầm "bảo", "va" khớp "vải"...).
 */
export function containsWordPhrase(
  normalizedHaystack: string,
  normalizedPhrase: string
): boolean {
  if (!normalizedHaystack || !normalizedPhrase) return false;
  return ` ${normalizedHaystack} `.includes(` ${normalizedPhrase} `);
}

function containsTokenOrPrefix(words: string[], token: string): boolean {
  if (!token) return false;
  if (token.length <= 2) {
    return words.includes(token);
  }
  return words.some((w) => w === token || w.startsWith(token));
}

export interface ArtisanSearchIndex {
  /** Trường nghề chính: tên, danh mục, tiêu đề ngắn, lỗi nhận sửa, tên dịch vụ bảng giá */
  primaryText: string;
  primaryWords: string[];
  /** Trường tên + danh mục (dùng nhận diện nghề trực tiếp, tránh nhầm tên đường/chuyện nghề) */
  nameAndCategoryText: string;
  /** Trường địa chỉ: quận, địa chỉ / mốc dễ nhớ */
  locationText: string;
  /** Câu chuyện nghề */
  storyText: string;
  /** Toàn bộ trường tìm kiếm gộp lại (Bước 2) */
  fullText: string;
  fullWords: string[];
  /** Danh mục chuẩn đã bỏ dấu */
  normalizedCategories: string[];
}

const LOCATION_PREFIX_REGEX =
  /\b(?:phuong|p|xa|dac\s+khu|special\s+zone|ward|commune)\b/g;

function stripLocationPrefixes(normalized: string): string {
  return normalized
    .replace(LOCATION_PREFIX_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Bước 2: Gom và chuẩn hóa không dấu toàn bộ các trường tìm kiếm của cô chú thợ.
 */
export function buildArtisanSearchIndex(artisan: Artisan): ArtisanSearchIndex {
  const legacyArtisan = artisan as Artisan & {
    category?: string;
    address?: string;
    short_title?: string;
    address_landmark?: string;
  };

  const categoryList = [
    ...(artisan.categories ?? []),
    ...(legacyArtisan.category ? [legacyArtisan.category] : []),
  ];

  const primaryText = normalizeText(
    [
      artisan.name,
      artisan.shortTitle,
      legacyArtisan.short_title ?? '',
      ...categoryList,
      ...(artisan.problems ?? []),
      ...(artisan.prices ?? []).map((p) => p.service),
    ].join(' ')
  );

  const nameAndCategoryText = normalizeText(
    [artisan.name, artisan.shortTitle, ...categoryList].join(' ')
  );

  const rawLocationNorm = normalizeText(
    [
      artisan.district,
      artisan.addressLandmark,
      legacyArtisan.address ?? '',
      legacyArtisan.address_landmark ?? '',
    ].join(' ')
  );
  const strippedDistrict = stripLocationPrefixes(
    normalizeText(artisan.district ?? '')
  );
  const locationText = [rawLocationNorm, strippedDistrict]
    .filter(Boolean)
    .join(' ');

  const storyText = normalizeText(artisan.story ?? '');

  const fullText = [primaryText, locationText, storyText]
    .filter(Boolean)
    .join(' ');

  return {
    primaryText,
    primaryWords: primaryText ? primaryText.split(' ') : [],
    nameAndCategoryText,
    locationText,
    storyText,
    fullText,
    fullWords: fullText ? fullText.split(' ') : [],
    normalizedCategories: categoryList.map((c) => normalizeText(c)).filter(Boolean),
  };
}

/**
 * Kiểm tra một cô chú thợ có thuộc nhóm nghề tương ứng hay không (dùng chung cho cả Search & 6 Icon Card Trang chủ).
 */
export function artisanMatchesCraftGroup(
  artisan: Artisan,
  groupId: CraftGroupId,
  cachedIndex?: ArtisanSearchIndex
): boolean {
  const index = cachedIndex ?? buildArtisanSearchIndex(artisan);
  const group = CRAFT_GROUP_MAP[groupId];

  // 1. Khớp trực tiếp theo danh mục chuẩn của thợ
  if (
    group.categories.some((cat) =>
      index.normalizedCategories.includes(normalizeText(cat))
    )
  ) {
    return true;
  }

  // 2. Với nhóm May vá: cho phép nhận diện từ "may" trong tên/danh mục miễn không phải "xe may"
  if (
    groupId === 'tailor' &&
    containsWordPhrase(index.nameAndCategoryText, 'may') &&
    !containsWordPhrase(index.nameAndCategoryText, 'xe may')
  ) {
    return true;
  }

  // 3. Khớp các dấu hiệu nghề đặc trưng trong trường nghề chính (word-boundary an toàn)
  if (
    group.artisanIndicators.some((indicator) =>
      containsWordPhrase(index.primaryText, indicator)
    )
  ) {
    return true;
  }

  // 4. Nhóm Khác (Sửa xe / Đồ điện & Khác): nhận thêm các góc thợ có danh mục nằm ngoài 5 nhóm tiêu chuẩn
  if (groupId === 'other') {
    const hasCustomCategory = index.normalizedCategories.some(
      (cat) => cat.length > 0 && !STANDARD_CRAFT_CATEGORIES.has(cat)
    );
    if (hasCustomCategory) return true;
  }

  return false;
}

export interface ParsedSearchQuery {
  normalizedQuery: string;
  locationCoreQuery: string;
  rawTokens: string[];
  meaningfulTokens: string[];
  matchedGroups: CraftGroupId[];
}

/**
 * Bước 3 & 4: Chuẩn hóa, tách từ thông minh (bỏ từ đệm & tiền tố hành chính) và nhận diện nhóm đồng nghĩa.
 */
export function parseSearchQuery(rawQuery: string): ParsedSearchQuery {
  const normalizedQuery = normalizeText(rawQuery);
  if (!normalizedQuery) {
    return {
      normalizedQuery: '',
      locationCoreQuery: '',
      rawTokens: [],
      meaningfulTokens: [],
      matchedGroups: [],
    };
  }

  const locationCoreQuery = stripLocationPrefixes(normalizedQuery);
  const rawTokens = normalizedQuery.split(' ').filter(Boolean);
  const strippedTokens = (locationCoreQuery || normalizedQuery)
    .split(' ')
    .filter(Boolean);
  const filteredTokens =
    strippedTokens.length > 1
      ? strippedTokens.filter((token) => !STOP_WORDS.has(token))
      : strippedTokens;
  const meaningfulTokens =
    filteredTokens.length > 0 ? filteredTokens : rawTokens;

  // Nhận diện ý định khóa xe để "cắt chìa xe máy" không kéo nhầm nhóm sửa xe máy
  const hasLockIntent =
    containsWordPhrase(normalizedQuery, 'chia') ||
    containsWordPhrase(normalizedQuery, 'cat chia') ||
    containsWordPhrase(normalizedQuery, 'danh chia') ||
    containsWordPhrase(normalizedQuery, 'khoa xe') ||
    containsWordPhrase(normalizedQuery, 'mo khoa') ||
    containsWordPhrase(normalizedQuery, 'sua khoa');

  const matchedGroupSet = new Set<CraftGroupId>();
  for (const group of CRAFT_SYNONYM_GROUPS) {
    for (const synonym of group.querySynonyms) {
      if (group.id === 'other' && synonym === 'xe may' && hasLockIntent) {
        continue;
      }
      if (containsWordPhrase(normalizedQuery, synonym)) {
        matchedGroupSet.add(group.id);
        break;
      }
    }
  }

  return {
    normalizedQuery,
    locationCoreQuery,
    rawTokens,
    meaningfulTokens,
    matchedGroups: Array.from(matchedGroupSet),
  };
}

/**
 * Chấm điểm độ liên quan của 1 cô chú thợ với truy vấn tìm kiếm.
 * Trả về 0 nếu không khớp; điểm càng cao thì độ liên quan càng cao.
 */
export function scoreArtisanForQuery(
  artisan: Artisan,
  parsed: ParsedSearchQuery,
  cachedIndex?: ArtisanSearchIndex
): number {
  if (!parsed.normalizedQuery) return 1;

  const index = cachedIndex ?? buildArtisanSearchIndex(artisan);
  const { normalizedQuery, locationCoreQuery, meaningfulTokens, matchedGroups } =
    parsed;

  let score = 0;

  // Kiểm tra cô chú thợ có thuộc nhóm nghề đồng nghĩa với truy vấn không
  const belongsToMatchedGroup =
    matchedGroups.length > 0 &&
    matchedGroups.some((groupId) =>
      artisanMatchesCraftGroup(artisan, groupId, index)
    );

  // Điều kiện 1: Khớp nguyên cụm từ đã bỏ dấu (ưu tiên điểm cao nhất)
  if (containsWordPhrase(index.primaryText, normalizedQuery)) {
    score += 120;
  } else if (index.primaryText.includes(normalizedQuery)) {
    score += 100;
  } else if (
    containsWordPhrase(index.locationText, normalizedQuery) ||
    index.locationText.includes(normalizedQuery) ||
    (locationCoreQuery.length >= 2 &&
      (containsWordPhrase(index.locationText, locationCoreQuery) ||
        index.locationText.includes(locationCoreQuery)))
  ) {
    score += 90;
  } else if (
    containsWordPhrase(index.storyText, normalizedQuery) ||
    index.storyText.includes(normalizedQuery)
  ) {
    score += 75;
  }

  // Điều kiện 2: Tất cả các từ khóa chính (sau khi bỏ từ đệm) đều xuất hiện
  const allTokensInPrimary =
    meaningfulTokens.length > 0 &&
    meaningfulTokens.every((tok) =>
      containsTokenOrPrefix(index.primaryWords, tok)
    );

  const primaryPlusLocationWords = index.locationText
    ? [...index.primaryWords, ...index.locationText.split(' ')]
    : index.primaryWords;

  const allTokensInPrimaryOrLocation =
    meaningfulTokens.length > 0 &&
    meaningfulTokens.every((tok) =>
      containsTokenOrPrefix(primaryPlusLocationWords, tok)
    );

  const allTokensInFull =
    meaningfulTokens.length > 0 &&
    meaningfulTokens.every((tok) =>
      containsTokenOrPrefix(index.fullWords, tok)
    );

  // Khi truy vấn đã nhận diện rõ nhóm nghề đồng nghĩa (VD: "may quần", "vá đồ"),
  // chỉ cho phép khớp chéo sang địa chỉ/story nếu thợ thực sự thuộc nhóm nghề đó
  // (tránh "may quần" khớp nhầm thợ khóa ở "Quận 3" có "xe máy", hoặc "vá đồ" khớp "và ... đồ" trong story).
  if (allTokensInPrimary) {
    score += 80;
  } else if (
    allTokensInPrimaryOrLocation &&
    (matchedGroups.length === 0 || belongsToMatchedGroup)
  ) {
    score += 65;
  } else if (
    allTokensInFull &&
    (matchedGroups.length === 0 || belongsToMatchedGroup)
  ) {
    score += 50;
  }

  // Điều kiện 3: Khớp theo Bộ từ điển đồng nghĩa & nhóm nghề (Bước 4)
  if (belongsToMatchedGroup) {
    score += 60;

    // Ưu tiên nhẹ cho thợ gắn đúng danh mục chuẩn hoặc nhắc tên nghề ngay trong tiêu đề
    const hasDirectCategory = matchedGroups.some((groupId) =>
      CRAFT_GROUP_MAP[groupId].categories.some((cat) =>
        index.normalizedCategories.includes(normalizeText(cat))
      )
    );
    if (hasDirectCategory) {
      score += 15;
    }
  }

  return score;
}

export interface RankedArtisanResult {
  artisan: Artisan;
  score: number;
  distanceKm: number | null;
}

export interface SearchArtisansOptions {
  userCoords?: Coordinates | null;
  sortByNearest?: boolean;
  preferWorkingWhenNoQuery?: boolean;
}

/**
 * Hàm tìm kiếm & xếp hạng dùng chung cho CẢ Trang chủ (/) và Bản đồ thợ (/ban-do).
 * - Khi có từ khóa: xếp theo độ liên quan giảm dần; ngang điểm thì ưu tiên khoảng cách GPS gần nhất.
 * - Khi không có từ khóa: giữ nguyên thứ tự ưu tiên (đang làm việc / GPS gần nhất).
 */
export function searchAndRankArtisans(
  artisans: Artisan[],
  query: string,
  options: SearchArtisansOptions = {}
): RankedArtisanResult[] {
  const {
    userCoords = null,
    sortByNearest = true,
    preferWorkingWhenNoQuery = false,
  } = options;

  const parsed = parseSearchQuery(query);
  const hasQuery = parsed.normalizedQuery.length > 0;

  const results: RankedArtisanResult[] = [];

  for (const artisan of artisans) {
    const score = hasQuery ? scoreArtisanForQuery(artisan, parsed) : 0;
    if (hasQuery && score <= 0) {
      continue;
    }

    const distanceKm = userCoords
      ? calculateDistanceKm(userCoords, artisan.coordinates)
      : null;

    results.push({ artisan, score, distanceKm });
  }

  results.sort((a, b) => {
    // 1. Khi có tìm kiếm: ưu tiên điểm liên quan từ cao xuống thấp
    if (hasQuery && a.score !== b.score) {
      return b.score - a.score;
    }

    // 2. Khi không có tìm kiếm (Trang chủ): ưu tiên cô chú đang làm việc lên trên
    if (!hasQuery && preferWorkingWhenNoQuery) {
      const aWorking = a.artisan.status === 'working' ? 0 : 1;
      const bWorking = b.artisan.status === 'working' ? 0 : 1;
      if (aWorking !== bWorking) return aWorking - bWorking;
    }

    // 3. Ngang điểm liên quan: sắp xếp theo khoảng cách GPS gần nhất
    if (sortByNearest && a.distanceKm !== null && b.distanceKm !== null) {
      return a.distanceKm - b.distanceKm;
    }

    return 0;
  });

  return results;
}
