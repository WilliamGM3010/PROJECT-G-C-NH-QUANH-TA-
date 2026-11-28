export type TeamDepartment =
  | 'Nội dung - Phát triển'
  | 'Truyền thông Chiến lược'
  | 'Nhân sự - Vận hành';

export type TeamMemberTier = 'pl' | 'leader' | 'member';

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  tier: TeamMemberTier;
  role: string;
  departments: TeamDepartment[];
  /** Nhãn tên ban hiển thị đầy đủ (dùng cho Project Leader & Trưởng ban) */
  departmentDisplayLabel?: string;
  quote: string;
  facebookUrl: string;
  /** Đường dẫn ảnh chân dung trong public/members/; tự động fallback sang nền pastel chữ cái nếu chưa có file ảnh */
  avatarUrl?: string;
  accentTone: 'forest' | 'terracotta' | 'stone';
}

export const FTU_LOGO_SRC = '/assets/aistudio/FTU_logo_2020.svg_da31367b.png';

export const TEAM_WHO_PHOTO_SRC =
  '/assets/aistudio/1795609449385_6329416613398058595_g4896312124801558342_6d307affad66bf5bdfb21abb15a34ca3_49b15997.jpg';

export const PROJECT_CONTACT_EMAIL = 'gocnhoquanhta.hcmc.ftu@gmail.com';

export const TEAM_DEPARTMENTS: readonly TeamDepartment[] = [
  'Nội dung - Phát triển',
  'Truyền thông Chiến lược',
  'Nhân sự - Vận hành',
] as const;

export const TEAM_WHO_MEMBERS: TeamMember[] = [
  // Tầng 1 — Project Leader
  {
    id: 'tran-diem-quynh',
    name: 'Trần Diễm Quỳnh',
    initials: 'DQ',
    tier: 'pl',
    role: 'Project Leader',
    departments: ['Truyền thông Chiến lược'],
    departmentDisplayLabel: 'Ban Truyền thông Chiến lược Dự án',
    quote:
      'Mỗi món đồ được giữ lại là thêm một câu chuyện tử tế được nối dài giữa thành phố.',
    facebookUrl: 'https://facebook.com',
    avatarUrl: '/members/quynh.jpg',
    accentTone: 'forest',
  },
  // Tầng 2 — 3 Trưởng ban
  {
    id: 'bui-gia-minh',
    name: 'Bùi Gia Minh',
    initials: 'GM',
    tier: 'leader',
    role: 'Trưởng ban',
    departments: ['Nội dung - Phát triển'],
    departmentDisplayLabel: 'Ban Nội dung - Phát triển dự án',
    quote:
      'Công nghệ đẹp nhất là khi giúp những người lao động thầm lặng được nhìn thấy nhiều hơn.',
    facebookUrl: 'https://facebook.com',
    avatarUrl: '/assets/aistudio/minh_2a239f32.jpg',
    accentTone: 'forest',
  },
  {
    id: 'le-nguyen-tam-nhu',
    name: 'Lê Nguyễn Tâm Như',
    initials: 'TN',
    tier: 'leader',
    role: 'Trưởng ban',
    departments: ['Truyền thông Chiến lược'],
    departmentDisplayLabel: 'Ban Truyền thông Chiến lược Dự án',
    quote:
      'Chúng mình không kể chuyện để gây thương hại, mà để lan tỏa niềm tự hào về tay nghề cô chú.',
    facebookUrl: 'https://facebook.com',
    avatarUrl: '/members/nhu.jpg',
    accentTone: 'terracotta',
  },
  {
    id: 'le-dang-khang',
    name: 'Lê Đăng Khang',
    initials: 'ĐK',
    tier: 'leader',
    role: 'Trưởng ban',
    departments: ['Nhân sự - Vận hành'],
    departmentDisplayLabel: 'Ban Nhân sự - Vận hành Dự án',
    quote:
      'Đi thực địa dưới nắng mới thấy nụ cười của cô chú thợ đáng giá hơn mọi giờ chạy deadline.',
    facebookUrl: 'https://facebook.com',
    avatarUrl: '/members/khang.jpg',
    accentTone: 'stone',
  },
  // Tầng 3 — 5 Thành viên
  {
    id: 'duong-duy-khanh',
    name: 'Dương Duy Khánh',
    initials: 'DK',
    tier: 'member',
    role: 'Thành viên',
    departments: ['Nội dung - Phát triển', 'Nhân sự - Vận hành'],
    quote:
      'Sửa một món đồ cũ không chỉ tiết kiệm cho sinh viên, mà còn là cách sống chậm và xanh hơn.',
    facebookUrl: 'https://facebook.com',
    avatarUrl: '/members/khanh.jpg',
    accentTone: 'stone',
  },
  {
    id: 'chau-quoc-anh',
    name: 'Châu Quốc Anh',
    initials: 'QA',
    tier: 'member',
    role: 'Thành viên',
    departments: ['Nội dung - Phát triển', 'Truyền thông Chiến lược'],
    quote:
      "Hy vọng góc web nhỏ này sẽ là nơi đầu tiên mọi người nhớ đến mỗi khi đồ đạc 'dở chứng'.",
    facebookUrl: 'https://facebook.com',
    avatarUrl: '/members/quoc-anh.jpg',
    accentTone: 'forest',
  },
  {
    id: 'tran-ngoc-ha',
    name: 'Trần Ngọc Hà',
    initials: 'NH',
    tier: 'member',
    role: 'Thành viên',
    departments: ['Nội dung - Phát triển', 'Nhân sự - Vận hành'],
    quote:
      'Đằng sau mỗi chấm nhỏ trên bản đồ là cả một cuộc mưu sinh bền bỉ đáng được trân trọng.',
    facebookUrl: 'https://facebook.com',
    avatarUrl: '/members/ha.jpg',
    accentTone: 'terracotta',
  },
  {
    id: 'tran-thanh-nhan',
    name: 'Trần Thành Nhân',
    initials: 'TN',
    tier: 'member',
    role: 'Thành viên',
    departments: ['Nhân sự - Vận hành'],
    quote:
      'Một địa chỉ chuẩn xác, một mức giá rõ ràng — đôi khi sự tiện lợi nhỏ lại tạo nên kết nối lớn.',
    facebookUrl: 'https://facebook.com',
    avatarUrl: '/members/nhan.jpg',
    accentTone: 'forest',
  },
  {
    id: 'trinh-dang-linh',
    name: 'Trịnh Đăng Linh',
    initials: 'ĐL',
    tier: 'member',
    role: 'Thành viên',
    departments: ['Truyền thông Chiến lược'],
    quote:
      'Mong những góc thợ bình dị trong hẻm nhỏ sẽ không còn bị bỏ quên giữa nhịp sống vội vã.',
    facebookUrl: 'https://facebook.com',
    avatarUrl: '/members/linh.jpg',
    accentTone: 'terracotta',
  },
];
