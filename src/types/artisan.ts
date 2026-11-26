export type CraftCategory =
  | 'Sửa giày dép'
  | 'May vá'
  | 'Sửa khóa'
  | 'Sửa đồng hồ'
  | 'Sửa balo/túi';

export type District = 'Bình Thạnh' | 'Quận 1' | 'Quận 3';

export type ArtisanStatus = 'working' | 'off_today' | 'relocated';

export type PaymentMethod = 'Chỉ tiền mặt' | 'Có chuyển khoản';

export type ParkingInfo = 'Dễ đậu xe' | 'Gửi xe gần đó';

export type KudosKey = 'sturdy' | 'studentPrice' | 'fast' | 'friendly';

export type IllustrationVariant =
  | 'cobbler'
  | 'tailor'
  | 'locksmith'
  | 'bag_repair'
  | 'knit_tailor'
  | 'leather_shoes';

export interface PriceItem {
  service: string;
  priceRange: string;
}

export interface PraiseEntry {
  id: string;
  author: string;
  kudosKey: KudosKey;
  comment: string;
  createdAt: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Artisan {
  id: string;
  name: string;
  shortTitle: string;
  categories: CraftCategory[];
  district: District;
  coordinates: Coordinates;
  addressLandmark: string;
  problems: string[];
  hours: string;
  minPriceLabel: string;
  prices: PriceItem[];
  story: string;
  status: ArtisanStatus;
  verifiedDate: string; // Định dạng hiển thị dd/mm/yyyy
  lastVerifiedDate?: string; // Định dạng ISO YYYY-MM-DD dùng tính quá hạn 30 ngày
  paymentMethod: PaymentMethod;
  parkingInfo: ParkingInfo;
  hasConsent: boolean;
  hidePortrait: boolean;
  isHidden?: boolean;
  isCommunitySuggested?: boolean;
  illustrationVariant: IllustrationVariant;
  customImageUrl?: string;
  kudos: Record<KudosKey, number>;
  praises: PraiseEntry[];
  revivedCount?: number;
  /** Username / ID người dùng đã gợi ý góc thợ này */
  submittedBy?: string;
  submittedAt?: string;
  approvalStatus?: 'approved' | 'pending';
  /** Chỉ hiển thị trong Khu Quản Trị — tuyệt đối không lộ ra trang công khai */
  pic?: string;
  /** Chỉ hiển thị trong Khu Quản Trị — tuyệt đối không lộ ra trang công khai */
  internalNotes?: string;
}

export interface PendingSuggestion {
  id: string;
  name: string;
  categories: CraftCategory[];
  district: District;
  coordinates?: Coordinates;
  addressLandmark: string;
  hours: string;
  problems: string[];
  minPriceLabel: string;
  story: string;
  paymentMethod: PaymentMethod;
  parkingInfo: ParkingInfo;
  customImageUrl?: string;
  submittedBy: string;
  submittedAt: string;
}

export interface StatusReport {
  id: string;
  artisanId: string;
  artisanName: string;
  reportedStatus: ArtisanStatus;
  note: string;
  createdAt: string;
  resolved: boolean;
}

export type AdminRole = 'super_admin' | 'collaborator' | 'user';

export interface AdminAccount {
  id: string;
  /** Tên hiển thị công khai (đồng bộ cột display_name & name) */
  displayName: string;
  /** Giữ tương thích với cột name cũ */
  name: string;
  /** Tên đăng nhập không khoảng trắng (hoặc email với tài khoản cũ) */
  username: string;
  /** Email (tương thích ngược với tài khoản cũ) */
  email: string;
  password: string;
  role: AdminRole;
  active: boolean;
  revivedCount: number;
  badges: string[];
  favoriteArtisanIds: string[];
  createdAt: string;
}

export type UserAccount = AdminAccount;

export interface StoredAuthSession {
  id: string;
  username: string;
  displayName: string;
  role: AdminRole;
}

export type AuditCategory =
  | 'artisan'
  | 'pending'
  | 'report'
  | 'thanks'
  | 'account'
  | 'data';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  action: string;
  category: AuditCategory;
}

export interface ThankYouNote {
  id: string;
  artisanId: string;
  artisanName: string;
  author: string;
  message: string;
  createdAt: string;
  approved: boolean;
}

export interface UserContributionStats {
  displayName: string;
  suggestionsCount: number;
  reportsCount: number;
  revivedCount: number;
  thanksCount: number;
  kudosCount: number;
}

export interface AppBackupPayload {
  version: number;
  exportedAt: string;
  artisans: Artisan[];
  pendingSuggestions: PendingSuggestion[];
  statusReports: StatusReport[];
  thankYouNotes: ThankYouNote[];
  auditLogs: AuditLogEntry[];
  adminAccounts: AdminAccount[];
  revivedCount: number;
}

export interface UserLocation {
  coords: Coordinates;
  source: 'gps' | 'demo';
  label: string;
}

export type TravelMode = 'driving' | 'walking';

export interface RouteInfo {
  artisanId: string;
  travelMode: TravelMode;
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  isFallback: boolean;
}

export type AppTab = 'explore' | 'suggest' | 'about';
