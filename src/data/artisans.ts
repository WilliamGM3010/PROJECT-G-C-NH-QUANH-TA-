import type {
  AdminAccount,
  Artisan,
  AuditLogEntry,
  Coordinates,
  CraftCategory,
  District,
  KudosKey,
  PendingSuggestion,
  StatusReport,
  ThankYouNote,
  UserContributionStats,
} from '../types/artisan';

export const HCMC_DEFAULT_CENTER: Coordinates = {
  lat: 10.788,
  lng: 106.705,
};

/** Tọa độ mặc định tại khu vực Bình Thạnh / Quận 1 khi trình duyệt từ chối GPS */
export const FALLBACK_NEARBY_LOCATION: Coordinates = {
  lat: 10.79,
  lng: 106.705,
};

export const DEFAULT_REVIVED_ITEMS_COUNT = 38;

export const CRAFT_CATEGORIES: CraftCategory[] = [
  'Sửa giày dép',
  'May vá',
  'Sửa khóa',
  'Sửa đồng hồ',
  'Sửa balo/túi',
];

export const DISTRICTS: District[] = ['Bình Thạnh', 'Quận 1', 'Quận 3'];

export const DISTRICT_COORDS: Record<District, Coordinates> = {
  'Bình Thạnh': { lat: 10.8015, lng: 106.7128 },
  'Quận 1': { lat: 10.7824, lng: 106.6998 },
  'Quận 3': { lat: 10.7791, lng: 106.6905 },
};

export const QUICK_PROBLEM_CHIPS: string[] = [
  'Bung đế giày',
  'Lên lai quần',
  'Đứt dây kéo',
  'Cắt chìa khóa',
  'Thay pin đồng hồ',
];

export interface KudosMeta {
  key: KudosKey;
  emoji: string;
  label: string;
}

export const KUDOS_ITEMS: KudosMeta[] = [
  { key: 'sturdy', emoji: '✨', label: 'Sửa kỹ & chắc' },
  { key: 'studentPrice', emoji: '💸', label: 'Giá sinh viên' },
  { key: 'fast', emoji: '⚡', label: 'Lấy liền nhanh' },
  { key: 'friendly', emoji: '💛', label: 'Cô chú thân thiện' },
];

function daysAgoDates(daysAgo: number): { vn: string; iso: string } {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return {
    vn: `${dd}/${mo}/${yyyy}`,
    iso: `${yyyy}-${mo}-${dd}`,
  };
}

const RECENT_5_DAYS = daysAgoDates(5);
const RECENT_10_DAYS = daysAgoDates(10);
const STALE_42_DAYS = daysAgoDates(42);
const STALE_51_DAYS = daysAgoDates(51);

export const INITIAL_ARTISANS: Artisan[] = [
  {
    id: 'chu-ba-d2',
    name: 'Chú Ba – Sửa Giày Dép & Balo',
    shortTitle: 'Chú Ba · Giày & Balo',
    categories: ['Sửa giày dép', 'Sửa balo/túi'],
    district: 'Bình Thạnh',
    coordinates: { lat: 10.8035, lng: 106.7155 },
    addressLandmark: 'Vỉa hè trước 124 Nguyễn Gia Trí (D2), cạnh tiệm tạp hóa',
    problems: [
      'bung đế giày',
      'khâu viền sneaker',
      'thay dây kéo balo',
      'sửa quai túi',
      'dán keo giày',
    ],
    hours: '08:00 – 17:30 (T2–T7)',
    minPriceLabel: 'Từ 20k',
    prices: [
      { service: 'Dán keo đế giày', priceRange: '20.000đ' },
      { service: 'Khâu viền đế sneaker', priceRange: '40.000đ – 50.000đ' },
      { service: 'Thay khóa kéo balo', priceRange: '25.000đ – 35.000đ' },
      { service: 'Gia cố quai túi xách', priceRange: '20.000đ – 30.000đ' },
    ],
    story:
      'Gần 20 năm gắn bó với góc đường D2, chú Ba nổi tiếng với đường chỉ khâu đế đều tăm tắp, giấu mối khéo để đôi sneaker giữ nguyên dáng thể thao. Chú luôn kiểm tra kỹ độ bám keo và tư vấn rõ nên dán hay khâu trước khi làm.',
    status: 'working',
    verifiedDate: RECENT_5_DAYS.vn,
    lastVerifiedDate: RECENT_5_DAYS.iso,
    paymentMethod: 'Có chuyển khoản',
    parkingInfo: 'Dễ đậu xe',
    hasConsent: true,
    hidePortrait: true,
    isHidden: false,
    illustrationVariant: 'cobbler',
    revivedCount: 9,
    pic: 'William Gia Minh',
    internalNotes: 'Đã tặng bảng QR đặt gọn trên hộp đồ nghề. Chú dùng Zalo con gái khi cần liên hệ.',
    kudos: {
      sturdy: 24,
      studentPrice: 19,
      fast: 11,
      friendly: 18,
    },
    praises: [
      {
        id: 'p-ba-1',
        author: 'Minh Khôi (SV Hutech)',
        kudosKey: 'sturdy',
        comment:
          'Mình mang đôi sneaker bị hở mũi ra khâu lại, chú may sát rãnh đế nên nhìn rất gọn, đi mưa mấy tháng nay vẫn chắc chắn.',
        createdAt: '2 ngày trước',
      },
      {
        id: 'p-ba-2',
        author: 'Thảo Vy',
        kudosKey: 'studentPrice',
        comment:
          'Thay dây kéo balo laptop hết 30k, chú còn tiện tay chấm lại miếng keo góc túi giúp mà không tính thêm tiền.',
        createdAt: '5 ngày trước',
      },
    ],
  },
  {
    id: 'co-tu-ntmk',
    name: 'Cô Tư – May Vá & Sửa Quần Áo',
    shortTitle: 'Cô Tư · May vá',
    categories: ['May vá'],
    district: 'Quận 1',
    coordinates: { lat: 10.7852, lng: 106.7012 },
    addressLandmark: 'Đầu hẻm 18A Nguyễn Thị Minh Khai, gần khu văn phòng',
    problems: [
      'lên lai quần',
      'bóp eo',
      'thay dây kéo quần jeans',
      'đơm nút',
      'vá áo',
    ],
    hours: '08:30 – 18:00 (Hằng ngày)',
    minPriceLabel: 'Từ 15k',
    prices: [
      { service: 'Lên lai quần tây / jeans', priceRange: '15.000đ – 20.000đ' },
      { service: 'Thay dây kéo quần jeans', priceRange: '25.000đ' },
      { service: 'Bóp eo quần / chân váy', priceRange: '30.000đ – 40.000đ' },
      { service: 'Đơm nút / vá đường chỉ nhỏ', priceRange: '10.000đ – 15.000đ' },
    ],
    story:
      'Góc máy may đạp chân của cô Tư là địa chỉ quen thuộc của dân văn phòng quanh Nguyễn Thị Minh Khai. Cô giữ chuẩn đường lai jeans gốc, chọn chỉ tiệp màu vải và có thể lấy liền trong giờ nghỉ trưa với các lỗi nhỏ.',
    status: 'working',
    verifiedDate: RECENT_5_DAYS.vn,
    lastVerifiedDate: RECENT_5_DAYS.iso,
    paymentMethod: 'Có chuyển khoản',
    parkingInfo: 'Gửi xe gần đó',
    hasConsent: true,
    hidePortrait: true,
    isHidden: false,
    illustrationVariant: 'tailor',
    revivedCount: 8,
    pic: 'Quang Huy',
    internalNotes: 'Cô đã đồng ý in thẻ QR treo cạnh máy may. Nên ghé khảo sát sau 14h đỡ đông khách văn phòng.',
    kudos: {
      sturdy: 29,
      studentPrice: 17,
      fast: 16,
      friendly: 22,
    },
    praises: [
      {
        id: 'p-tu-1',
        author: 'Lan Anh (NVVP)',
        kudosKey: 'fast',
        comment:
          'Tranh thủ giờ trưa mang quần tây ra lên lai, đợi 15 phút là có mặc đi họp buổi chiều luôn. Đường may giấu chỉ đẹp lắm!',
        createdAt: 'Hôm qua',
      },
      {
        id: 'p-tu-2',
        author: 'Đức Thịnh',
        kudosKey: 'friendly',
        comment:
          'Cô đo kỹ chiều dài gấu quần theo đôi giày mình hay mang, làm xong mặc vừa vặn hẳn.',
        createdAt: '4 ngày trước',
      },
    ],
  },
  {
    id: 'chu-sau-vvt',
    name: 'Chú Sáu – Sửa Khóa & Đồng Hồ',
    shortTitle: 'Chú Sáu · Khóa & Đồng hồ',
    categories: ['Sửa khóa', 'Sửa đồng hồ'],
    district: 'Quận 3',
    coordinates: { lat: 10.7768, lng: 106.6885 },
    addressLandmark:
      'Góc đường Võ Văn Tần – Cách Mạng Tháng Tám, dưới tán cây xà cừ',
    problems: [
      'đánh chìa khóa phòng trọ',
      'cắt chìa xe máy',
      'thay pin đồng hồ',
      'cắt mắt dây',
      'sửa khóa',
    ],
    hours: '07:30 – 17:00 (T2–CN)',
    minPriceLabel: 'Từ 10k',
    prices: [
      { service: 'Cắt chìa khóa phòng trọ / nhà', priceRange: '10.000đ – 15.000đ' },
      { service: 'Cắt chìa khóa xe máy', priceRange: '20.000đ – 30.000đ' },
      { service: 'Thay pin đồng hồ đeo tay', priceRange: '20.000đ – 40.000đ' },
      { service: 'Cắt mắt dây đồng hồ kim loại', priceRange: '15.000đ' },
    ],
    story:
      'Chiếc tủ kính nhỏ dưới tán xà cừ của chú Sáu lúc nào cũng gọn gàng với đủ phôi chìa và pin Nhật chính hãng. Chú làm rất cẩn thận khi mở nắp lưng đồng hồ để không trầy xước và luôn lau gioăng chống ẩm giúp khách.',
    status: 'working',
    verifiedDate: RECENT_10_DAYS.vn,
    lastVerifiedDate: RECENT_10_DAYS.iso,
    paymentMethod: 'Chỉ tiền mặt',
    parkingInfo: 'Dễ đậu xe',
    hasConsent: true,
    hidePortrait: true,
    isHidden: false,
    illustrationVariant: 'locksmith',
    revivedCount: 7,
    pic: 'Quang Huy',
    internalNotes: 'Chú không dùng smartphone, trao đổi trực tiếp tại tủ kính. Đã xin phép chỉ đăng ảnh đồ nghề.',
    kudos: {
      sturdy: 21,
      studentPrice: 25,
      fast: 27,
      friendly: 16,
    },
    praises: [
      {
        id: 'p-sau-1',
        author: 'Hoàng Nam',
        kudosKey: 'fast',
        comment:
          'Đánh 2 chìa phòng trọ chưa tới 5 phút, về mở trơn tru không bị kẹt răng khóa chút nào.',
        createdAt: '3 ngày trước',
      },
      {
        id: 'p-sau-2',
        author: 'Ngọc Hân',
        kudosKey: 'sturdy',
        comment:
          'Thay pin đồng hồ Casio với cắt 2 mắt dây chỉ 35k, chú lót khăn mềm lúc tháo chốt nên không bị xước vỏ.',
        createdAt: '1 tuần trước',
      },
    ],
  },
  {
    id: 'chu-nam-dbp',
    name: 'Chú Năm – Sửa Balo & Vali',
    shortTitle: 'Chú Năm · Balo & Vali',
    categories: ['Sửa balo/túi'],
    district: 'Bình Thạnh',
    coordinates: { lat: 10.7992, lng: 106.7104 },
    addressLandmark: 'Góc đường Điện Biên Phủ – Ung Văn Khiêm, gần trạm xe buýt',
    problems: [
      'đứt dây kéo balo',
      'gãy bánh xe vali',
      'rách quai đeo',
      'thay móc khóa',
      'sửa balo',
    ],
    hours: '08:00 – 18:00 (T2–T7)',
    minPriceLabel: 'Từ 15k',
    prices: [
      { service: 'Thay đầu kéo / con trượt', priceRange: '15.000đ' },
      { service: 'Thay dây kéo balo mới', priceRange: '30.000đ – 45.000đ' },
      { service: 'May gia cố quai đeo chịu lực', priceRange: '20.000đ' },
      { service: 'Thay bánh xe vali (1 cặp)', priceRange: '60.000đ – 90.000đ' },
    ],
    story:
      'Chuyên trị những chiếc balo đi học, đi phượt bị bung đường may hay vali gãy bánh trước giờ ra sân bay. Chú Năm dùng loại chỉ dù dày và đầu kéo kim loại chắc chắn để bạn tiếp tục dùng món đồ quen thuộc thêm nhiều năm nữa.',
    status: 'working',
    verifiedDate: STALE_42_DAYS.vn,
    lastVerifiedDate: STALE_42_DAYS.iso,
    paymentMethod: 'Chỉ tiền mặt',
    parkingInfo: 'Dễ đậu xe',
    hasConsent: true,
    hidePortrait: true,
    isHidden: false,
    illustrationVariant: 'bag_repair',
    revivedCount: 6,
    pic: 'William Gia Minh',
    internalNotes: 'Cần ghé hỏi lại khung giờ mùa mưa và cập nhật xem chú có nhận thêm chuyển khoản chưa.',
    kudos: {
      sturdy: 19,
      studentPrice: 17,
      fast: 13,
      friendly: 14,
    },
    praises: [
      {
        id: 'p-nam-1',
        author: 'Quốc Bảo',
        kudosKey: 'friendly',
        comment:
          'Balo mình tưởng bỏ vì đứt khóa chính, ra chú Năm thay củ kéo 15k là dùng ngon ơ lại như mới, đỡ phải mua balo khác.',
        createdAt: '3 ngày trước',
      },
    ],
  },
  {
    id: 'co-hanh-tqt',
    name: 'Cô Hạnh – May Vá & Sửa Đồ Len',
    shortTitle: 'Cô Hạnh · May & Đồ len',
    categories: ['May vá'],
    district: 'Quận 3',
    coordinates: { lat: 10.7815, lng: 106.6928 },
    addressLandmark: 'Vỉa hè đường Trần Quốc Thảo, đối diện cổng trường học',
    problems: [
      'lên lai váy',
      'sửa áo sơ mi',
      'vá rách quần áo',
      'thu ngắn tay áo',
      'sửa đồ len',
    ],
    hours: '09:00 – 17:30 (T2–T6)',
    minPriceLabel: 'Từ 10k',
    prices: [
      { service: 'Đơm nút / sửa khuy áo sơ mi', priceRange: '10.000đ' },
      { service: 'Lên lai váy / quần', priceRange: '20.000đ' },
      { service: 'Thu ngắn tay áo sơ mi', priceRange: '30.000đ' },
      { service: 'Mạng vá đồ len / vải mỏng', priceRange: '25.000đ – 40.000đ' },
    ],
    story:
      'Cô Hạnh rất khéo tay với các chất liệu khó chiều như vải lụa, voan và áo len móc bị xước sợi. Mũi kim tỉ mỉ giúp che khuyết điểm tự nhiên, giữ lại những chiếc áo kỷ niệm mà tiệm lớn thường ngại nhận.',
    status: 'off_today',
    verifiedDate: STALE_51_DAYS.vn,
    lastVerifiedDate: STALE_51_DAYS.iso,
    paymentMethod: 'Chỉ tiền mặt',
    parkingInfo: 'Gửi xe gần đó',
    hasConsent: true,
    hidePortrait: true,
    isHidden: false,
    illustrationVariant: 'knit_tailor',
    revivedCount: 4,
    pic: 'Quang Huy',
    internalNotes: 'Đã quá 30 ngày chưa ghé thăm lại. Dự kiến mang thiệp cảm ơn cộng đồng gửi cô tuần này.',
    kudos: {
      sturdy: 23,
      studentPrice: 14,
      fast: 8,
      friendly: 15,
    },
    praises: [
      {
        id: 'p-hanh-1',
        author: 'Thanh Trúc',
        kudosKey: 'sturdy',
        comment:
          'Áo cardigan len bị móc rách một lỗ nhỏ, cô mạng lại nhìn gần cũng khó nhận ra chỗ sửa. Quá khéo tay!',
        createdAt: '6 ngày trước',
      },
    ],
  },
  {
    id: 'chu-bay-pasteur',
    name: 'Chú Bảy – Sửa Giày Da & Đánh Xi',
    shortTitle: 'Chú Bảy · Giày da & Xi',
    categories: ['Sửa giày dép'],
    district: 'Quận 1',
    coordinates: { lat: 10.7795, lng: 106.6982 },
    addressLandmark: 'Góc đường Pasteur – Lý Tự Trọng, ngồi cạnh bức tường vàng',
    problems: [
      'dán đế giày tây',
      'đánh xi làm mới',
      'thay miếng lót',
      'sửa gót giày',
      'bung đế giày',
    ],
    hours: '07:30 – 16:30 (T2–T7)',
    minPriceLabel: 'Từ 15k',
    prices: [
      { service: 'Đánh xi dưỡng da làm mới', priceRange: '15.000đ – 20.000đ' },
      { service: 'Dán đế giày tây', priceRange: '30.000đ – 40.000đ' },
      { service: 'Thay gót giày cao su chống trượt', priceRange: '40.000đ' },
      { service: 'Thay miếng lót da êm chân', priceRange: '25.000đ – 35.000đ' },
    ],
    story:
      'Ngồi bên bức tường vàng quen thuộc góc Pasteur – Lý Tự Trọng, chú Bảy am hiểu từng loại da bò, da lộn. Đôi giày tây cũ qua bàn tay đánh xi và dưỡng da của chú lên bóng dịu tự nhiên, sẵn sàng đồng hành tiếp trong mọi buổi gặp mặt.',
    status: 'working',
    verifiedDate: RECENT_10_DAYS.vn,
    lastVerifiedDate: RECENT_10_DAYS.iso,
    paymentMethod: 'Có chuyển khoản',
    parkingInfo: 'Gửi xe gần đó',
    hasConsent: true,
    hidePortrait: true,
    isHidden: false,
    illustrationVariant: 'leather_shoes',
    revivedCount: 4,
    pic: 'William Gia Minh',
    internalNotes: 'Đã tặng thẻ QR ép nhựa chống nước. Chú có tài khoản ngân hàng nhận QR rất tiện.',
    kudos: {
      sturdy: 26,
      studentPrice: 18,
      fast: 15,
      friendly: 20,
    },
    praises: [
      {
        id: 'p-bay-1',
        author: 'Anh Khoa',
        kudosKey: 'sturdy',
        comment:
          'Đôi giày tây đi phỏng vấn bị trầy mũi, chú Bảy đánh xi dưỡng lại lên màu nâu đều đẹp lắm, gót thay đi êm ru.',
        createdAt: '2 ngày trước',
      },
      {
        id: 'p-bay-2',
        author: 'Gia Huy',
        kudosKey: 'friendly',
        comment:
          'Chú chỉ thêm cách nhét giấy giữ form giày mùa mưa Sài Gòn, nói chuyện vui vẻ và làm cực kỳ kỹ tính.',
        createdAt: '1 tuần trước',
      },
    ],
  },
];

export const INITIAL_PENDING_SUGGESTIONS: PendingSuggestion[] = [
  {
    id: 'pending-dup-sample',
    name: 'Chú Ba D2 – Khâu Sneaker & Sửa Giày',
    categories: ['Sửa giày dép'],
    district: 'Bình Thạnh',
    coordinates: { lat: 10.8041, lng: 106.7159 },
    addressLandmark:
      'Vỉa hè đường Nguyễn Gia Trí (D2), gần tiệm tạp hóa số 124',
    hours: '08:00 – 17:30 (T2–T7)',
    problems: ['khâu viền sneaker', 'dán keo đế giày'],
    minPriceLabel: 'Từ 20k',
    story:
      'Mình thấy chú ngồi sửa giày rất kỹ ở đoạn đường D2, giá sinh viên nên gửi lên bản đồ.',
    paymentMethod: 'Có chuyển khoản',
    parkingInfo: 'Dễ đậu xe',
    submittedBy: 'Tuấn Kiệt (SV Giao Thông Vận Tải)',
    submittedAt: '11:10 · 25/11/2026',
  },
  {
    id: 'pending-1',
    name: 'Chú Tám – Sửa Khóa & Đánh Chìa',
    categories: ['Sửa khóa'],
    district: 'Bình Thạnh',
    coordinates: { lat: 10.7998, lng: 106.6914 },
    addressLandmark:
      'Vỉa hè đầu đường Vạn Kiếp giao Phan Xích Long, cạnh trụ ATM',
    hours: '07:30 – 18:00 (Hằng ngày)',
    problems: ['đánh chìa khóa phòng trọ', 'mở khóa kẹt', 'cắt chìa xe máy'],
    minPriceLabel: 'Từ 10k',
    story:
      'Chú Tám làm khóa rất nhanh, có sẵn nhiều phôi chìa xe đời mới và chìa cửa cuốn. Sinh viên quanh Phan Xích Long hay ghé.',
    paymentMethod: 'Có chuyển khoản',
    parkingInfo: 'Dễ đậu xe',
    submittedBy: 'Hải Đăng (Cộng đồng)',
    submittedAt: '14:20 · 24/11/2026',
  },
  {
    id: 'pending-2',
    name: 'Cô Mai – Sửa Quần Áo & Thay Dây Kéo',
    categories: ['May vá', 'Sửa balo/túi'],
    district: 'Quận 3',
    coordinates: { lat: 10.7886, lng: 106.6789 },
    addressLandmark:
      'Đầu hẻm 284 Lê Văn Sỹ, ngồi dưới mái hiên xanh gần tiệm bánh mì',
    hours: '08:30 – 17:00 (T2–T7)',
    problems: ['lên lai quần jeans', 'thay dây kéo áo khoác', 'bóp eo đầm'],
    minPriceLabel: 'Từ 15k',
    story:
      'Cô Mai nhận sửa cả áo khoác gió bị hư dây kéo và lên lai quần lấy liền trong 20 phút, đường may gọn đẹp.',
    paymentMethod: 'Chỉ tiền mặt',
    parkingInfo: 'Dễ đậu xe',
    submittedBy: 'Khánh Linh (SV ĐH Sư Phạm)',
    submittedAt: '09:45 · 25/11/2026',
  },
];

export const INITIAL_STATUS_REPORTS: StatusReport[] = [
  {
    id: 'rep-1',
    artisanId: 'co-hanh-tqt',
    artisanName: 'Cô Hạnh – May Vá & Sửa Đồ Len',
    reportedStatus: 'off_today',
    note: 'Sáng nay mình ghé 10h thấy cô nghỉ vì trời mưa lớn, tiệm kế bên báo mai cô ngồi lại.',
    createdAt: '10:15 · 25/11/2026',
    resolved: false,
  },
  {
    id: 'rep-2',
    artisanId: 'chu-ba-d2',
    artisanName: 'Chú Ba – Sửa Giày Dép & Balo',
    reportedStatus: 'working',
    note: 'Chú vẫn ngồi đúng trước số 124 Nguyễn Gia Trí, mới thêm mã QR chuyển khoản luôn!',
    createdAt: '16:30 · 24/11/2026',
    resolved: false,
  },
];

export const INITIAL_THANK_YOU_NOTES: ThankYouNote[] = [
  {
    id: 'thanks-1',
    artisanId: 'chu-ba-d2',
    artisanName: 'Chú Ba – Sửa Giày Dép & Balo',
    author: 'Ngọc Mai (SV D2)',
    message:
      'Cảm ơn chú Ba đã cứu đôi giày trắng đi học của con trước ngày thuyết trình! Đường chỉ chú khâu chắc mà đẹp quá chừng, chúc chú luôn mạnh khỏe ạ.',
    createdAt: '20/11/2026',
    approved: true,
  },
  {
    id: 'thanks-2',
    artisanId: 'chu-ba-d2',
    artisanName: 'Chú Ba – Sửa Giày Dép & Balo',
    author: 'Anh Tuấn',
    message:
      'Chiếc balo kỷ niệm thời sinh viên đứt khóa tưởng phải bỏ, nhờ chú sửa lại giờ vẫn đồng hành đi làm mỗi ngày. Cảm ơn chú rất nhiều!',
    createdAt: '18/11/2026',
    approved: true,
  },
  {
    id: 'thanks-3',
    artisanId: 'co-tu-ntmk',
    artisanName: 'Cô Tư – May Vá & Sửa Quần Áo',
    author: 'Phương Nhi',
    message:
      'Cảm ơn cô Tư lúc nào cũng vui vẻ, lên lai quần siêu gọn để kịp giờ đi làm buổi chiều. Chúc cô nhiều sức khỏe và đắt khách ạ!',
    createdAt: '22/11/2026',
    approved: true,
  },
  {
    id: 'thanks-4',
    artisanId: 'chu-sau-vvt',
    artisanName: 'Chú Sáu – Sửa Khóa & Đồng Hồ',
    author: 'Ẩn danh',
    message:
      'Hôm trước rớt chìa khóa may có chú đánh lại nhanh gọn, giá lại rất nhẹ nhàng. Cảm ơn chú Sáu đã giữ góc tủ khóa quen thuộc giữa Quận 3.',
    createdAt: '19/11/2026',
    approved: true,
  },
  {
    id: 'thanks-5',
    artisanId: 'chu-bay-pasteur',
    artisanName: 'Chú Bảy – Sửa Giày Da & Đánh Xi',
    author: 'Hoàng Long',
    message:
      'Nhờ chú Bảy đánh xi dưỡng da mà đôi giày tây cũ sáng bóng hẳn lên cho buổi phỏng vấn đầu tiên. Chúc chú luôn vui khỏe!',
    createdAt: '21/11/2026',
    approved: true,
  },
  {
    id: 'thanks-pending-1',
    artisanId: 'co-hanh-tqt',
    artisanName: 'Cô Hạnh – May Vá & Sửa Đồ Len',
    author: 'Bảo Trân',
    message:
      'Cảm ơn cô Hạnh đã mạng lại chiếc áo len mẹ tặng con thật khéo tay! Con rất trân trọng sự tỉ mỉ của cô.',
    createdAt: '25/11/2026',
    approved: false,
  },
  {
    id: 'thanks-pending-2',
    artisanId: 'chu-nam-dbp',
    artisanName: 'Chú Năm – Sửa Balo & Vali',
    author: 'Gia Bảo',
    message:
      'Cảm ơn chú Năm thay bánh xe vali siêu nhanh giúp mình kịp chuyến xe về quê tối nay. Chúc chú thật nhiều sức khỏe!',
    createdAt: '25/11/2026',
    approved: false,
  },
];

export const INITIAL_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'admin-super-1',
    displayName: 'William Gia Minh (Điều phối dự án)',
    name: 'William Gia Minh (Điều phối dự án)',
    username: 'admin@goctho.vn',
    email: 'admin@goctho.vn',
    password: 'admin123',
    role: 'super_admin',
    active: true,
    revivedCount: 5,
    badges: ['friend', 'local_guide', 'green_ambassador'],
    favoriteArtisanIds: ['chu-ba-d2', 'co-tu-ntmk'],
    createdAt: '01/11/2026',
  },
  {
    id: 'admin-ctv-1',
    displayName: 'Quang Huy (Cộng tác viên Q.1)',
    name: 'Quang Huy (Cộng tác viên Q.1)',
    username: 'ctv@goctho.vn',
    email: 'ctv@goctho.vn',
    password: 'ctv123',
    role: 'collaborator',
    active: true,
    revivedCount: 2,
    badges: ['friend'],
    favoriteArtisanIds: ['chu-sau-vvt'],
    createdAt: '12/11/2026',
  },
  {
    id: 'user-demo-1',
    displayName: 'Minh Anh (SV Bình Thạnh)',
    name: 'Minh Anh (SV Bình Thạnh)',
    username: 'minhanh',
    email: 'minhanh',
    password: 'user123',
    role: 'user',
    active: true,
    revivedCount: 1,
    badges: ['friend'],
    favoriteArtisanIds: ['chu-ba-d2'],
    createdAt: '20/11/2026',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-init-1',
    timestamp: '16:40 · 24/11/2026',
    actorName: 'William Gia Minh (Điều phối dự án)',
    actorEmail: 'admin@goctho.vn',
    action: 'Đã xác minh lại hồ sơ Chú Ba – Sửa Giày Dép & Balo',
    category: 'artisan',
  },
  {
    id: 'log-init-2',
    timestamp: '10:05 · 23/11/2026',
    actorName: 'Quang Huy (Cộng tác viên Q.1)',
    actorEmail: 'ctv@goctho.vn',
    action: 'Đã duyệt lời cảm ơn của Phương Nhi gửi tới Cô Tư – May Vá & Sửa Quần Áo',
    category: 'thanks',
  },
  {
    id: 'log-init-3',
    timestamp: '09:15 · 22/11/2026',
    actorName: 'William Gia Minh (Điều phối dự án)',
    actorEmail: 'admin@goctho.vn',
    action: 'Đã cập nhật hình thức thanh toán chuyển khoản cho Chú Bảy – Sửa Giày Da & Đánh Xi',
    category: 'artisan',
  },
];

export const DEFAULT_USER_CONTRIBUTION: UserContributionStats = {
  displayName: 'Bạn trẻ Sài Gòn',
  suggestionsCount: 0,
  reportsCount: 0,
  revivedCount: 0,
  thanksCount: 0,
  kudosCount: 0,
};
