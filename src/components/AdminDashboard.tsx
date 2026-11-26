import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Database,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Flag,
  Heart,
  History,
  LogOut,
  MapPin,
  Plus,
  Printer,
  QrCode,
  Recycle,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { CRAFT_CATEGORIES, DISTRICTS } from '../data/artisans';
import type {
  AdminAccount,
  AdminRole,
  AppBackupPayload,
  Artisan,
  ArtisanStatus,
  AuditCategory,
  AuditLogEntry,
  PendingSuggestion,
  StatusReport,
  ThankYouNote,
} from '../types/artisan';
import { findPotentialDuplicates } from '../utils/geo';
import {
  downloadAdminAccountsCsvTemplate,
  downloadArtisansCsvTemplate,
  exportArtisansToCsv,
  exportBackupJson,
  formatVietnamTimestamp,
  getDaysSinceVerified,
  isVerificationStale,
  parseAdminAccountsFromCsv,
  parseArtisansFromCsv,
  parseBackupJson,
} from '../utils/storage';
import { AdminArtisanFormModal } from './AdminArtisanFormModal';
import { AdminQrCardModal } from './AdminQrCardModal';
import { AdminThankYouCardModal } from './AdminThankYouCardModal';
import { getStatusDisplay } from './ArtisanCard';
import { ArtisanIllustration } from './ArtisanIllustration';

type AdminTabId =
  | 'overview'
  | 'pending'
  | 'artisans'
  | 'thanks'
  | 'reports'
  | 'audit'
  | 'accounts';

interface AdminDashboardProps {
  currentAdmin: AdminAccount;
  artisans: Artisan[];
  pendingSuggestions: PendingSuggestion[];
  statusReports: StatusReport[];
  thankYouNotes: ThankYouNote[];
  auditLogs: AuditLogEntry[];
  adminAccounts: AdminAccount[];
  revivedCount: number;
  onExitToMap: () => void;
  onLogout: () => void;
  onSaveArtisan: (artisan: Artisan, approvedPendingId?: string) => void;
  onVerifyArtisanToday: (artisanId: string) => void;
  onToggleArtisanVisibility: (artisanId: string) => void;
  onDeleteArtisan: (artisanId: string) => void;
  onRejectPending: (pendingId: string) => void;
  onApplyReportStatus: (report: StatusReport) => void;
  onResolveReport: (reportId: string) => void;
  onApproveThankYou: (noteId: string) => void;
  onDeleteThankYou: (noteId: string) => void;
  onClearAuditLogs: () => void;
  onImportArtisansCsv: (imported: Artisan[], skipped: number) => void;
  onRestoreBackupJson: (backup: AppBackupPayload) => void;
  onCreateAdminAccount: (
    account: Omit<AdminAccount, 'id' | 'createdAt' | 'active'>
  ) => void;
  onBulkCreateAdminAccounts: (
    accounts: AdminAccount[],
    skipped: number,
    duplicates: number
  ) => void;
  onDeleteAdminAccount: (accountId: string) => void;
  onNotify: (message: string) => void;
}

const REPORT_STATUS_LABEL: Record<
  ArtisanStatus,
  { icon: string; label: string; colorClass: string }
> = {
  working: {
    icon: '🟢',
    label: 'Vẫn đang làm',
    colorClass: 'text-[#3A6B5C] bg-[#3A6B5C]/10',
  },
  off_today: {
    icon: '🟡',
    label: 'Hôm nay nghỉ',
    colorClass: 'text-[#9A6807] bg-[#E9A825]/15',
  },
  relocated: {
    icon: '🔴',
    label: 'Đã chuyển chỗ / Sai thông tin',
    colorClass: 'text-[#C84B31] bg-[#C84B31]/12',
  },
};

const AUDIT_CATEGORY_LABEL: Record<
  AuditCategory,
  { label: string; badgeClass: string }
> = {
  artisan: { label: 'Hồ sơ thợ', badgeClass: 'bg-[#3A6B5C]/12 text-[#3A6B5C]' },
  pending: { label: 'Duyệt đề xuất', badgeClass: 'bg-[#D96B38]/12 text-[#D96B38]' },
  report: { label: 'Báo cáo', badgeClass: 'bg-[#E9A825]/20 text-[#9A6807]' },
  thanks: { label: 'Lưu bút', badgeClass: 'bg-[#D96B38]/15 text-[#B85427]' },
  account: { label: 'Tài khoản', badgeClass: 'bg-[#1F2933]/10 text-[#1F2933]' },
  data: { label: 'Dữ liệu', badgeClass: 'bg-[#52606D]/12 text-[#52606D]' },
};

export function AdminDashboard({
  currentAdmin,
  artisans,
  pendingSuggestions,
  statusReports,
  thankYouNotes,
  auditLogs,
  adminAccounts,
  revivedCount,
  onExitToMap,
  onLogout,
  onSaveArtisan,
  onVerifyArtisanToday,
  onToggleArtisanVisibility,
  onDeleteArtisan,
  onRejectPending,
  onApplyReportStatus,
  onResolveReport,
  onApproveThankYou,
  onDeleteThankYou,
  onClearAuditLogs,
  onImportArtisansCsv,
  onRestoreBackupJson,
  onCreateAdminAccount,
  onBulkCreateAdminAccounts,
  onDeleteAdminAccount,
  onNotify,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');

  // Quản lý thợ: tìm kiếm, lọc trạng thái & lọc hồ sơ quá hạn > 30 ngày
  const [artisanSearch, setArtisanSearch] = useState('');
  const [artisanFilter, setArtisanFilter] = useState<
    'all' | ArtisanStatus | 'hidden'
  >('all');
  const [onlyStaleVerification, setOnlyStaleVerification] = useState(false);

  // Bộ lọc Nhật ký hoạt động theo người thực hiện
  const [auditActorFilter, setAuditActorFilter] = useState<string>('all');

  // Modals: thêm/sửa/duyệt, Thẻ QR, Thiệp cảm ơn, Xem nhanh hồ sơ trùng lặp
  const [formState, setFormState] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'approve';
    artisan?: Artisan | null;
    pending?: PendingSuggestion | null;
  }>({ open: false, mode: 'create' });
  const [qrCardArtisan, setQrCardArtisan] = useState<Artisan | null>(null);
  const [thanksCardArtisan, setThanksCardArtisan] = useState<Artisan | null>(
    null
  );
  const [quickViewArtisan, setQuickViewArtisan] = useState<Artisan | null>(null);

  // Form tạo tài khoản Admin mới
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('Cộng tác viên');
  const [adminFormError, setAdminFormError] = useState('');

  // File input refs cho CSV & JSON
  const csvArtisanInputRef = useRef<HTMLInputElement | null>(null);
  const jsonBackupInputRef = useRef<HTMLInputElement | null>(null);
  const csvAdminInputRef = useRef<HTMLInputElement | null>(null);

  const isSuperAdmin = currentAdmin.role === 'Super Admin';
  const visibleArtisans = useMemo(
    () => artisans.filter((a) => !a.isHidden),
    [artisans]
  );
  const staleArtisansCount = useMemo(
    () => artisans.filter((a) => isVerificationStale(a)).length,
    [artisans]
  );
  const unresolvedReportsCount = useMemo(
    () => statusReports.filter((r) => !r.resolved).length,
    [statusReports]
  );
  const pendingThanks = useMemo(
    () => thankYouNotes.filter((n) => !n.approved),
    [thankYouNotes]
  );
  const approvedThanks = useMemo(
    () => thankYouNotes.filter((n) => n.approved),
    [thankYouNotes]
  );

  // Biểu đồ thanh ngang CSS thuần
  const districtStats = useMemo(() => {
    const counts = DISTRICTS.map((d) => ({
      label: d,
      count: visibleArtisans.filter((a) => a.district === d).length,
    }));
    const max = Math.max(1, ...counts.map((c) => c.count));
    return counts.map((c) => ({
      ...c,
      percent: Math.round((c.count / max) * 100),
    }));
  }, [visibleArtisans]);

  const categoryStats = useMemo(() => {
    const counts = CRAFT_CATEGORIES.map((cat) => ({
      label: cat,
      count: visibleArtisans.filter((a) => a.categories.includes(cat)).length,
    }));
    const max = Math.max(1, ...counts.map((c) => c.count));
    return counts.map((c) => ({
      ...c,
      percent: Math.round((c.count / max) * 100),
    }));
  }, [visibleArtisans]);

  // Danh sách thợ đã lọc trong Tab Quản lý
  const filteredArtisans = useMemo(() => {
    const q = artisanSearch.trim().toLowerCase();
    return artisans.filter((a) => {
      if (onlyStaleVerification && !isVerificationStale(a)) return false;
      if (artisanFilter === 'hidden' && !a.isHidden) return false;
      if (
        artisanFilter !== 'all' &&
        artisanFilter !== 'hidden' &&
        (a.isHidden || a.status !== artisanFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.district.toLowerCase().includes(q) ||
        a.addressLandmark.toLowerCase().includes(q) ||
        (a.pic ?? '').toLowerCase().includes(q) ||
        a.categories.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [artisans, artisanSearch, artisanFilter, onlyStaleVerification]);

  // Danh sách người thực hiện duy nhất cho bộ lọc Audit Log
  const auditActors = useMemo(() => {
    const unique = new Set<string>();
    auditLogs.forEach((log) => unique.add(log.actorName));
    return Array.from(unique);
  }, [auditLogs]);

  const filteredAuditLogs = useMemo(() => {
    if (auditActorFilter === 'all') return auditLogs;
    return auditLogs.filter((l) => l.actorName === auditActorFilter);
  }, [auditLogs, auditActorFilter]);

  // Xử lý Import CSV cô chú thợ
  const handleArtisansCsvFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const { artisans: parsed, skipped } = parseArtisansFromCsv(text);
        if (parsed.length === 0) {
          onNotify(
            'Không tìm thấy dòng dữ liệu hợp lệ trong file CSV. Hãy tải file CSV mẫu để xem định dạng chuẩn!'
          );
          return;
        }
        onImportArtisansCsv(parsed, skipped);
      } catch {
        onNotify('Lỗi khi đọc file CSV. Vui lòng kiểm tra lại định dạng tệp.');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Xử lý Export & Import JSON Backup
  const handleExportJsonBackup = () => {
    exportBackupJson({
      version: 2,
      exportedAt: formatVietnamTimestamp(),
      artisans,
      pendingSuggestions,
      statusReports,
      thankYouNotes,
      auditLogs,
      adminAccounts,
      revivedCount,
    });
    onNotify('Đã tải tệp sao lưu toàn bộ dữ liệu (.json) về máy!');
  };

  const handleRestoreJsonFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const payload = parseBackupJson(text);
        onRestoreBackupJson(payload);
      } catch (err) {
        onNotify(
          err instanceof Error
            ? err.message
            : 'File JSON không hợp lệ, không thể khôi phục.'
        );
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Xử lý Import CSV tạo hàng loạt tài khoản Admin (chỉ Super Admin)
  const handleAdminCsvFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isSuperAdmin) return;
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const existingEmails = adminAccounts.map((a) => a.email);
        const { accounts, skipped, duplicates } = parseAdminAccountsFromCsv(
          text,
          existingEmails
        );
        if (accounts.length === 0) {
          onNotify(
            duplicates > 0
              ? `Tất cả ${duplicates} email trong file đều đã tồn tại trong hệ thống.`
              : 'Không tìm thấy tài khoản hợp lệ trong file CSV (cần đủ Họ tên, Email, Mật khẩu >= 4 ký tự).'
          );
          return;
        }
        onBulkCreateAdminAccounts(accounts, skipped, duplicates);
      } catch {
        onNotify('Lỗi khi đọc file CSV tài khoản quản trị.');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleCreateAdminSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    const cleanName = newAdminName.trim();
    const cleanEmail = newAdminEmail.trim().toLowerCase();
    if (cleanName.length < 2 || !cleanEmail.includes('@')) {
      setAdminFormError('Vui lòng nhập đầy đủ họ tên và email hợp lệ.');
      return;
    }
    if (newAdminPassword.length < 4) {
      setAdminFormError('Mật khẩu cần tối thiểu 4 ký tự.');
      return;
    }
    if (adminAccounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
      setAdminFormError('Email này đã tồn tại trong danh sách quản trị.');
      return;
    }

    onCreateAdminAccount({
      name: cleanName,
      email: cleanEmail,
      password: newAdminPassword,
      role: newAdminRole,
    });

    setNewAdminName('');
    setNewAdminEmail('');
    setNewAdminPassword('');
    setNewAdminRole('Cộng tác viên');
    setAdminFormError('');
  };

  const navItems: {
    id: AdminTabId;
    label: string;
    Icon: typeof BarChart3;
    badge?: number;
    badgeHighlight?: boolean;
  }[] = [
    { id: 'overview', label: 'Tổng quan', Icon: BarChart3 },
    {
      id: 'pending',
      label: 'Duyệt đề xuất',
      Icon: ClipboardCheck,
      badge: pendingSuggestions.length,
      badgeHighlight: pendingSuggestions.length > 0,
    },
    {
      id: 'artisans',
      label: 'Quản lý cô chú thợ',
      Icon: Wrench,
      badge: staleArtisansCount > 0 ? staleArtisansCount : artisans.length,
      badgeHighlight: staleArtisansCount > 0,
    },
    {
      id: 'thanks',
      label: 'Duyệt lưu bút',
      Icon: Heart,
      badge: pendingThanks.length,
      badgeHighlight: pendingThanks.length > 0,
    },
    {
      id: 'reports',
      label: 'Báo cáo tình trạng',
      Icon: Flag,
      badge: unresolvedReportsCount,
      badgeHighlight: unresolvedReportsCount > 0,
    },
    {
      id: 'audit',
      label: 'Nhật ký hoạt động',
      Icon: History,
      badge: auditLogs.length,
    },
    { id: 'accounts', label: 'Tài khoản Admin', Icon: Users },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FAF8F5] text-[#1F2933]">
      {/* Hidden file inputs cho CSV & JSON */}
      <input
        ref={csvArtisanInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleArtisansCsvFile}
        className="sr-only"
      />
      <input
        ref={jsonBackupInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleRestoreJsonFile}
        className="sr-only"
      />
      <input
        ref={csvAdminInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleAdminCsvFile}
        className="sr-only"
      />

      {/* Top Bar Khu Quản Trị */}
      <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 bg-white border-b border-[#E8E2D9] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-[#D96B38] text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-bold text-[#1F2933] truncate">
              Khu Quản Trị · Góc Thợ Quanh Ta
            </p>
            <p className="text-[11px] text-[#52606D] truncate">
              {currentAdmin.name} ·{' '}
              <span className="font-semibold text-[#3A6B5C]">
                {currentAdmin.role}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExitToMap}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] hover:bg-[#F2ECE2] text-xs font-semibold text-[#1F2933] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-[#D96B38]" />
            <span className="hidden sm:inline">Về trang bản đồ</span>
            <span className="sm:hidden">Bản đồ</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#C84B31]/25 bg-[#C84B31]/8 hover:bg-[#C84B31]/15 text-xs font-semibold text-[#C84B31] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar trượt ngang */}
      <nav
        aria-label="Điều hướng quản trị di động"
        className="lg:hidden sticky top-16 z-20 bg-white border-b border-[#E8E2D9] px-3 py-2 overflow-x-auto no-scrollbar"
      >
        <div className="flex items-center gap-1.5">
          {navItems.map(({ id, label, Icon, badge, badgeHighlight }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#D96B38] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#52606D] hover:text-[#1F2933]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {typeof badge === 'number' && badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                      active
                        ? 'bg-white/25 text-white'
                        : badgeHighlight
                          ? 'bg-[#D96B38] text-white'
                          : 'bg-[#EBE5DC] text-[#52606D]'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Thân trang: Sidebar trái (Desktop) + Nội dung */}
      <div className="flex-1 flex min-h-0">
        <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-[#E8E2D9] p-4 justify-between">
          <nav aria-label="Điều hướng quản trị" className="space-y-1.5">
            {navItems.map(({ id, label, Icon, badge, badgeHighlight }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between gap-2 transition-colors ${
                    active
                      ? 'bg-[#D96B38] text-white shadow-sm'
                      : 'text-[#52606D] hover:bg-[#FAF8F5] hover:text-[#1F2933]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </span>
                  {typeof badge === 'number' && badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                        active
                          ? 'bg-white/25 text-white'
                          : badgeHighlight
                            ? 'bg-[#D96B38] text-white'
                            : 'bg-[#F0EAE1] text-[#52606D]'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="rounded-2xl bg-[#FAF8F5] border border-[#EBE5DC] p-3.5 text-xs text-[#52606D] space-y-1">
            <p className="font-bold text-[#3A6B5C]">Lưu trữ &amp; Nhật ký tự động</p>
            <p className="leading-relaxed">
              Mọi thao tác quản trị được lưu vào bộ nhớ trình duyệt và ghi nhận đầy đủ vào Nhật ký hoạt động.
            </p>
          </div>
        </aside>

        {/* Nội dung từng Tab */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* =====================================================
                TAB 1: TỔNG QUAN (DASHBOARD + CSV/JSON DATA TOOLS)
               ===================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1F2933]">
                      Tổng quan vận hành cộng đồng
                    </h1>
                    <p className="text-xs sm:text-sm text-[#52606D]">
                      Theo dõi bản đồ Góc Thợ Quanh Ta, dữ liệu quá hạn xác minh và công cụ nhập/sao lưu dữ liệu.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => exportArtisansToCsv(artisans)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#3A6B5C] hover:bg-[#2F594C] text-white text-xs sm:text-sm font-semibold shadow-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất dữ liệu (CSV)</span>
                  </button>
                </div>

                {/* Cảnh báo nhanh nếu có hồ sơ quá hạn xác minh > 30 ngày */}
                {staleArtisansCount > 0 && (
                  <div className="rounded-2xl bg-[#E9A825]/14 border border-[#E9A825]/50 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-[#B47A0E] shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm">
                        <p className="font-bold text-[#8A5A00]">
                          ⚠️ Có {staleArtisansCount} hồ sơ cô chú thợ đã quá 30 ngày chưa xác minh lại
                        </p>
                        <p className="text-[#7A5208]">
                          Kiểm tra nhanh để đảm bảo giờ làm việc và vị trí góc phố luôn chính xác cho người trẻ.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOnlyStaleVerification(true);
                        setActiveTab('artisans');
                      }}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold whitespace-nowrap"
                    >
                      Xem hồ sơ cần xác minh →
                    </button>
                  </div>
                )}

                {/* 5 Thẻ thống kê nhanh */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                  <div className="rounded-2xl bg-white border border-[#EBE5DC] shadow-sm p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#52606D]">
                      <span className="font-medium">Thợ đang hiển thị</span>
                      <Wrench className="w-4 h-4 text-[#3A6B5C]" />
                    </div>
                    <p className="text-3xl font-bold text-[#1F2933] tabular-nums">
                      {visibleArtisans.length}
                    </p>
                    <p className="text-[11px] text-[#52606D]">
                      Tổng lưu trữ: {artisans.length} hồ sơ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('pending')}
                    className={`rounded-2xl border shadow-sm p-4 space-y-2 text-left transition-all ${
                      pendingSuggestions.length > 0
                        ? 'bg-[#D96B38]/8 border-[#D96B38]/40 hover:border-[#D96B38]'
                        : 'bg-white border-[#EBE5DC]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-[#52606D]">
                      <span className="font-medium">Đề xuất chờ duyệt</span>
                      <ClipboardCheck
                        className={`w-4 h-4 ${
                          pendingSuggestions.length > 0
                            ? 'text-[#D96B38]'
                            : 'text-[#7B8794]'
                        }`}
                      />
                    </div>
                    <p
                      className={`text-3xl font-bold tabular-nums ${
                        pendingSuggestions.length > 0
                          ? 'text-[#D96B38]'
                          : 'text-[#1F2933]'
                      }`}
                    >
                      {pendingSuggestions.length}
                    </p>
                    <p className="text-[11px] text-[#52606D]">
                      {pendingSuggestions.length > 0
                        ? 'Bấm để xem & duyệt ngay →'
                        : 'Đã xử lý toàn bộ'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('reports')}
                    className="rounded-2xl bg-white border border-[#EBE5DC] hover:border-[#E9A825] shadow-sm p-4 space-y-2 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-[#52606D]">
                      <span className="font-medium">Báo cáo chưa xử lý</span>
                      <AlertTriangle
                        className={`w-4 h-4 ${
                          unresolvedReportsCount > 0
                            ? 'text-[#E9A825]'
                            : 'text-[#7B8794]'
                        }`}
                      />
                    </div>
                    <p className="text-3xl font-bold text-[#1F2933] tabular-nums">
                      {unresolvedReportsCount}
                    </p>
                    <p className="text-[11px] text-[#52606D]">
                      Lưu bút chờ duyệt: {pendingThanks.length}
                    </p>
                  </button>

                  <div className="rounded-2xl bg-white border border-[#EBE5DC] shadow-sm p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#52606D]">
                      <span className="font-medium">Tài khoản Admin</span>
                      <Users className="w-4 h-4 text-[#52606D]" />
                    </div>
                    <p className="text-3xl font-bold text-[#1F2933] tabular-nums">
                      {adminAccounts.length}
                    </p>
                    <p className="text-[11px] text-[#52606D]">
                      {adminAccounts.filter((a) => a.role === 'Super Admin').length}{' '}
                      Super Admin
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#3A6B5C] text-white shadow-sm p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/85">
                      <span className="font-medium">Món đồ được hồi sinh</span>
                      <Recycle className="w-4 h-4 text-[#A7E6D0]" />
                    </div>
                    <p className="text-3xl font-bold tabular-nums">
                      {revivedCount}
                    </p>
                    <p className="text-[11px] text-white/80">
                      Đồng bộ trực tiếp từ cộng đồng
                    </p>
                  </div>
                </div>

                {/* Cụm công cụ Nhập CSV & Sao lưu/Khôi phục JSON */}
                <section className="rounded-2xl bg-white border border-[#EBE5DC] shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#D96B38]" />
                    <h2 className="text-sm font-bold text-[#1F2933]">
                      Công cụ Dữ liệu hàng loạt &amp; Sao lưu hệ thống
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nhập cô chú thợ từ CSV */}
                    <div className="rounded-2xl bg-[#FAF8F5] border border-[#EBE5DC] p-4 space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#1F2933] inline-flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-[#3A6B5C]" />
                          <span>Nhập danh sách cô chú thợ từ CSV</span>
                        </p>
                        <p className="text-xs text-[#52606D] leading-relaxed">
                          Tải file CSV mẫu chuẩn tiếng Việt, điền danh sách khảo sát rồi tải lên để nạp hàng loạt vào bản đồ.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => csvArtisanInputRef.current?.click()}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Nhập từ CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={downloadArtisansCsvTemplate}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E5DFD5] bg-white hover:bg-[#F3EEE6] text-[#1F2933] text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-[#3A6B5C]" />
                          <span>Tải file CSV mẫu</span>
                        </button>
                      </div>
                    </div>

                    {/* Sao lưu & Khôi phục JSON */}
                    <div className="rounded-2xl bg-[#FAF8F5] border border-[#EBE5DC] p-4 space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#1F2933] inline-flex items-center gap-1.5">
                          <RefreshCw className="w-4 h-4 text-[#D96B38]" />
                          <span>Sao lưu &amp; Khôi phục toàn bộ dữ liệu (JSON)</span>
                        </p>
                        <p className="text-xs text-[#52606D] leading-relaxed">
                          Gồm toàn bộ cô chú thợ, đề xuất, báo cáo, sổ lưu bút, nhật ký hoạt động và tài khoản để chuyển máy an toàn.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExportJsonBackup}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#3A6B5C] hover:bg-[#2F594C] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Sao lưu (Export JSON)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => jsonBackupInputRef.current?.click()}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E5DFD5] bg-white hover:bg-[#F3EEE6] text-[#1F2933] text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#D96B38]" />
                          <span>Khôi phục (Import JSON)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Biểu đồ thanh ngang CSS thuần */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-2xl bg-white border border-[#EBE5DC] shadow-sm p-5 space-y-4">
                    <h2 className="text-sm font-bold text-[#1F2933]">
                      Phân bố cô chú thợ theo Khu vực
                    </h2>
                    <div className="space-y-3.5">
                      {districtStats.map((item) => (
                        <div key={item.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#1F2933]">
                              {item.label}
                            </span>
                            <span className="font-bold text-[#D96B38] tabular-nums">
                              {item.count} góc thợ
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-[#F3EEE6] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#D96B38] transition-all duration-300"
                              style={{
                                width: `${Math.max(item.percent, item.count > 0 ? 8 : 0)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-[#EBE5DC] shadow-sm p-5 space-y-4">
                    <h2 className="text-sm font-bold text-[#1F2933]">
                      Phân bố theo Loại dịch vụ
                    </h2>
                    <div className="space-y-3">
                      {categoryStats.map((item) => (
                        <div key={item.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#1F2933]">
                              {item.label}
                            </span>
                            <span className="font-bold text-[#3A6B5C] tabular-nums">
                              {item.count} địa điểm
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-[#EEF3F0] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#3A6B5C] transition-all duration-300"
                              style={{
                                width: `${Math.max(item.percent, item.count > 0 ? 8 : 0)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================
                TAB 2: DUYỆT ĐỀ XUẤT MỚI (+ CẢNH BÁO TRÙNG LẶP 200M)
               ===================================================== */}
            {activeTab === 'pending' && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1F2933]">
                    Đề xuất chờ duyệt ({pendingSuggestions.length})
                  </h1>
                  <p className="text-xs sm:text-sm text-[#52606D]">
                    Hệ thống tự động kiểm tra trùng lặp theo khoảng cách Haversine (bán kính 200m) &amp; tên gọi trước khi đưa lên bản đồ.
                  </p>
                </div>

                {pendingSuggestions.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-[#EBE5DC] p-10 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-[#3A6B5C] mx-auto" />
                    <p className="text-sm font-bold text-[#1F2933]">
                      Không còn đề xuất nào đang chờ duyệt
                    </p>
                    <p className="text-xs text-[#52606D]">
                      Khi người dùng gửi đề xuất mới từ mục &ldquo;Gợi ý thợ&rdquo;, hồ sơ sẽ tự động hiển thị tại đây.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingSuggestions.map((item) => {
                      const duplicates = findPotentialDuplicates(item, artisans);
                      const topMatch = duplicates[0] ?? null;

                      return (
                        <article
                          key={item.id}
                          className={`rounded-2xl bg-white border shadow-sm p-5 flex flex-col justify-between gap-4 ${
                            topMatch
                              ? 'border-[#E9A825] ring-1 ring-[#E9A825]/35'
                              : 'border-[#EBE5DC]'
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Khung cảnh báo trùng lặp màu vàng nổi bật */}
                            {topMatch && (
                              <div className="rounded-xl bg-[#E9A825]/18 border border-[#E9A825]/60 p-3 space-y-2">
                                <div className="flex items-start gap-2 text-xs font-bold text-[#8A5A00]">
                                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C48200]" />
                                  <span>
                                    ⚠️ Nghi ngờ trùng lặp: Gần{' '}
                                    {topMatch.artisan.name}
                                    {typeof topMatch.distanceMeters === 'number'
                                      ? ` (cách ${topMatch.distanceMeters}m)`
                                      : ' (trùng tên tương tự)'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setQuickViewArtisan(topMatch.artisan)
                                  }
                                  className="min-h-[34px] px-3 py-1 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E9A825]/50 text-[11px] font-bold text-[#8A5A00] inline-flex items-center gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Xem nhanh hồ sơ cũ để đối chiếu</span>
                                </button>
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-base font-bold text-[#1F2933]">
                                  {item.name}
                                </h3>
                                <p className="text-xs text-[#3A6B5C] font-semibold mt-0.5">
                                  {item.categories.join(' · ')} · {item.district}
                                </p>
                              </div>
                              <span className="text-[11px] font-semibold text-[#D96B38] bg-[#D96B38]/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                                Chờ duyệt
                              </span>
                            </div>

                            {item.customImageUrl && (
                              <div className="aspect-[16/9] rounded-xl overflow-hidden border border-[#EBE5DC]">
                                <img
                                  src={item.customImageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            <div className="space-y-1.5 text-xs text-[#52606D]">
                              <p>
                                <strong className="text-[#1F2933]">
                                  Mốc góc phố:
                                </strong>{' '}
                                {item.addressLandmark}
                              </p>
                              {item.coordinates && (
                                <p className="tabular-nums text-[11px] text-[#7B8794]">
                                  GPS ước tính: {item.coordinates.lat.toFixed(4)},{' '}
                                  {item.coordinates.lng.toFixed(4)}
                                </p>
                              )}
                              <p>
                                <strong className="text-[#1F2933]">
                                  Khung giờ:
                                </strong>{' '}
                                {item.hours} ·{' '}
                                <strong className="text-[#1F2933]">Giá:</strong>{' '}
                                {item.minPriceLabel}
                              </p>
                              <p>
                                <strong className="text-[#1F2933]">
                                  Tiện ích:
                                </strong>{' '}
                                {item.paymentMethod} · {item.parkingInfo}
                              </p>
                              <p>
                                <strong className="text-[#1F2933]">
                                  Lỗi nhận sửa:
                                </strong>{' '}
                                {item.problems.join(', ')}
                              </p>
                              {item.story && (
                                <p className="italic text-[#52606D] pt-1">
                                  &ldquo;{item.story}&rdquo;
                                </p>
                              )}
                            </div>

                            <p className="text-[11px] text-[#7B8794] pt-2 border-t border-[#F0EAE1]">
                              Gửi bởi{' '}
                              <strong className="text-[#52606D]">
                                {item.submittedBy}
                              </strong>{' '}
                              · {item.submittedAt}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setFormState({
                                  open: true,
                                  mode: 'approve',
                                  pending: item,
                                })
                              }
                              className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-[#3A6B5C] hover:bg-[#2F594C] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Chỉnh sửa &amp; Duyệt</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onRejectPending(item.id)}
                              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#C84B31]/25 bg-[#C84B31]/8 hover:bg-[#C84B31]/15 text-[#C84B31] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Từ chối</span>
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =====================================================
                TAB 3: QUẢN LÝ CÔ CHÚ THỢ (PIC, GHI CHÚ NỘI BỘ, NHẮC XÁC MINH >30 NGÀY)
               ===================================================== */}
            {activeTab === 'artisans' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1F2933]">
                      Quản lý cô chú thợ ({artisans.length})
                    </h1>
                    <p className="text-xs sm:text-sm text-[#52606D]">
                      Quản lý hồ sơ, Người phụ trách (PIC), nhắc xác minh quá 30 ngày, in Thẻ QR và Thiệp cảm ơn.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => csvArtisanInputRef.current?.click()}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5DFD5] bg-white hover:bg-[#FAF8F5] text-[#1F2933] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#3A6B5C]" />
                      <span>Nhập từ CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormState({
                          open: true,
                          mode: 'create',
                          artisan: null,
                        })
                      }
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs sm:text-sm font-semibold shadow-sm inline-flex items-center gap-2 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm cô chú thợ</span>
                    </button>
                  </div>
                </div>

                {/* Bộ lọc tìm kiếm + trạng thái + lọc hồ sơ cần xác minh lại */}
                <div className="rounded-2xl bg-white border border-[#EBE5DC] p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={artisanSearch}
                      onChange={(e) => setArtisanSearch(e.target.value)}
                      placeholder="Tìm theo tên, quận, dịch vụ, PIC hoặc mốc đường..."
                      className="w-full min-h-[42px] pl-10 pr-3 py-2 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm focus:bg-white focus:outline-none focus:border-[#D96B38]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <select
                      value={artisanFilter}
                      onChange={(e) =>
                        setArtisanFilter(
                          e.target.value as 'all' | ArtisanStatus | 'hidden'
                        )
                      }
                      className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-xs font-semibold text-[#1F2933]"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="working">Đang làm việc</option>
                      <option value="off_today">Hôm nay nghỉ</option>
                      <option value="relocated">Cần kiểm tra lại</option>
                      <option value="hidden">Đang tạm ẩn</option>
                    </select>

                    <label
                      className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 cursor-pointer select-none transition-colors ${
                        onlyStaleVerification
                          ? 'bg-[#E9A825]/20 border-[#E9A825] text-[#8A5A00]'
                          : 'bg-[#FAF8F5] border-[#E5DFD5] text-[#52606D]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={onlyStaleVerification}
                        onChange={(e) =>
                          setOnlyStaleVerification(e.target.checked)
                        }
                        className="w-4 h-4 rounded accent-[#D96B38]"
                      />
                      <span>
                        Chỉ hiện hồ sơ cần xác minh ({staleArtisansCount})
                      </span>
                    </label>
                  </div>
                </div>

                {/* Danh sách quản lý */}
                {filteredArtisans.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-[#EBE5DC] p-8 text-center text-xs text-[#52606D]">
                    Không tìm thấy hồ sơ cô chú thợ phù hợp với bộ lọc hiện tại.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredArtisans.map((artisan) => {
                      const st = getStatusDisplay(artisan.status);
                      const daysAgo = getDaysSinceVerified(artisan);
                      const stale = isVerificationStale(artisan);
                      const artisanApprovedThanks = approvedThanks.filter(
                        (n) => n.artisanId === artisan.id
                      ).length;

                      return (
                        <div
                          key={artisan.id}
                          className={`rounded-2xl bg-white border shadow-sm p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${
                            stale
                              ? 'border-[#E9A825]/70'
                              : artisan.isHidden
                                ? 'border-[#E5DFD5] opacity-75'
                                : 'border-[#EBE5DC]'
                          }`}
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#F4EFE6]">
                              <ArtisanIllustration
                                variant={artisan.illustrationVariant}
                                customImageUrl={artisan.customImageUrl}
                                alt={artisan.name}
                              />
                            </div>
                            <div className="min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-[#1F2933]">
                                  {artisan.name}
                                </h3>
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.bgClass} ${st.textClass}`}
                                >
                                  {st.label}
                                </span>
                                {stale && (
                                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E9A825]/22 text-[#8A5A00] border border-[#E9A825]/50 tabular-nums">
                                    ⚠️ Cần xác minh lại ({daysAgo} ngày)
                                  </span>
                                )}
                                {artisan.isHidden && (
                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#52606D]/15 text-[#52606D]">
                                    Đang ẩn
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-[#52606D]">
                                {artisan.district} · {artisan.addressLandmark}
                              </p>

                              {/* Người phụ trách (PIC) & Ghi chú nội bộ (chỉ hiện trong Admin) */}
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
                                <span className="inline-flex items-center gap-1 font-semibold text-[#3A6B5C] bg-[#3A6B5C]/10 px-2 py-0.5 rounded-md">
                                  <UserCheck className="w-3 h-3" />
                                  PIC: {artisan.pic || 'Chưa phân công'}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[#7B8794] tabular-nums">
                                  <Clock className="w-3 h-3" />
                                  Xác minh: {artisan.verifiedDate}
                                </span>
                                <span className="text-[#7B8794]">
                                  {artisan.paymentMethod} · {artisan.parkingInfo}
                                </span>
                              </div>

                              {artisan.internalNotes && (
                                <p className="text-[11px] text-[#52606D] bg-[#FAF8F5] border border-[#EBE5DC] rounded-lg px-2.5 py-1.5 leading-relaxed">
                                  <strong className="text-[#1F2933]">
                                    Ghi chú nội bộ:
                                  </strong>{' '}
                                  {artisan.internalNotes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => onVerifyArtisanToday(artisan.id)}
                              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                                stale
                                  ? 'bg-[#3A6B5C] hover:bg-[#2F594C] text-white shadow-xs'
                                  : 'border border-[#3A6B5C]/30 bg-[#3A6B5C]/8 hover:bg-[#3A6B5C]/15 text-[#3A6B5C]'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>✓ Xác nhận lại hôm nay</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setThanksCardArtisan(artisan)}
                              title="In thiệp cảm ơn cộng đồng tặng cô chú"
                              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#D96B38]/30 bg-[#FFFBF2] hover:bg-[#D96B38]/12 text-[#B85427] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>
                                In thiệp ({artisanApprovedThanks})
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setQrCardArtisan(artisan)}
                              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#D96B38]/35 bg-[#D96B38]/8 hover:bg-[#D96B38]/15 text-[#D96B38] text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Thẻ QR</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setFormState({
                                  open: true,
                                  mode: 'edit',
                                  artisan,
                                })
                              }
                              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] hover:bg-[#F1EAE0] text-[#1F2933] text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onToggleArtisanVisibility(artisan.id)
                              }
                              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E5DFD5] bg-white hover:bg-[#FAF8F5] text-[#52606D] text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              {artisan.isHidden ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-[#3A6B5C]" />
                                  <span>Hiện</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Ẩn</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteArtisan(artisan.id)}
                              aria-label={`Xóa ${artisan.name}`}
                              className="min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#C84B31]/20 bg-[#C84B31]/8 hover:bg-[#C84B31]/15 text-[#C84B31] text-xs font-semibold inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =====================================================
                TAB 4: DUYỆT LƯU BÚT CẢM ƠN (+ IN THIỆP CẢM ƠN TẶNG CÔ CHÚ)
               ===================================================== */}
            {activeTab === 'thanks' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1F2933]">
                    Duyệt Sổ lưu bút cảm ơn ({pendingThanks.length} chờ duyệt)
                  </h1>
                  <p className="text-xs sm:text-sm text-[#52606D]">
                    Kiểm duyệt lời nhắn ấm áp từ cộng đồng trước khi hiển thị công khai và in thiệp tri ân gửi tận tay cô chú thợ.
                  </p>
                </div>

                {/* Phần 1: Lời cảm ơn chờ duyệt */}
                <section className="space-y-3">
                  <h2 className="text-sm font-bold text-[#1F2933]">
                    Lời nhắn đang chờ duyệt ({pendingThanks.length})
                  </h2>

                  {pendingThanks.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-[#EBE5DC] p-7 text-center space-y-1.5">
                      <CheckCircle2 className="w-8 h-8 text-[#3A6B5C] mx-auto" />
                      <p className="text-sm font-bold text-[#1F2933]">
                        Không có lời cảm ơn nào đang chờ duyệt
                      </p>
                      <p className="text-xs text-[#52606D]">
                        Khi người dùng viết lời nhắn trong mục &ldquo;Sổ lưu bút cảm ơn&rdquo;, lời nhắn sẽ hiển thị tại đây.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingThanks.map((note) => (
                        <article
                          key={note.id}
                          className="rounded-2xl bg-[#FFFBF2] border border-[#EEDCB9] shadow-sm p-4 space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-bold text-[#D96B38]">
                                  Gửi tới: {note.artisanName}
                                </p>
                                <p className="text-xs font-semibold text-[#1F2933] mt-0.5">
                                  Từ: {note.author} ·{' '}
                                  <span className="font-normal text-[#7B8794] tabular-nums">
                                    {note.createdAt}
                                  </span>
                                </p>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D96B38]/12 text-[#D96B38]">
                                Chờ duyệt
                              </span>
                            </div>

                            <p className="text-xs text-[#1F2933] leading-relaxed italic bg-white/80 rounded-xl p-3 border border-[#F0E4CC]">
                              &ldquo;{note.message}&rdquo;
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onApproveThankYou(note.id)}
                              className="flex-1 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#3A6B5C] hover:bg-[#2F594C] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Duyệt hiển thị</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteThankYou(note.id)}
                              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#C84B31]/25 bg-[#C84B31]/8 hover:bg-[#C84B31]/15 text-[#C84B31] text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Từ chối</span>
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                {/* Phần 2: In thiệp cảm ơn theo từng cô chú thợ */}
                <section className="space-y-3 pt-4 border-t border-[#E8E2D9]">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-[#1F2933]">
                      Thiệp cảm ơn đã duyệt theo từng cô chú ({approvedThanks.length} lời nhắn)
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {artisans.map((artisan) => {
                      const list = approvedThanks.filter(
                        (n) => n.artisanId === artisan.id
                      );
                      return (
                        <div
                          key={artisan.id}
                          className="rounded-2xl bg-white border border-[#EBE5DC] shadow-sm p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-[#1F2933] truncate">
                                {artisan.name}
                              </h3>
                              <p className="text-xs text-[#52606D]">
                                {list.length} lời cảm ơn đã duyệt · {artisan.district}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setThanksCardArtisan(artisan)}
                              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>🖨️ In thiệp cảm ơn</span>
                            </button>
                          </div>

                          {list.length > 0 && (
                            <div className="space-y-2 max-h-44 overflow-y-auto thin-scrollbar pr-1">
                              {list.map((n) => (
                                <div
                                  key={n.id}
                                  className="rounded-xl bg-[#FAF8F5] border border-[#EBE5DC] p-2.5 flex items-start justify-between gap-2 text-xs"
                                >
                                  <div className="min-w-0 space-y-0.5">
                                    <p className="font-semibold text-[#1F2933]">
                                      {n.author}{' '}
                                      <span className="font-normal text-[#7B8794] text-[11px]">
                                        · {n.createdAt}
                                      </span>
                                    </p>
                                    <p className="text-[#52606D] italic line-clamp-2">
                                      &ldquo;{n.message}&rdquo;
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteThankYou(n.id)}
                                    aria-label="Xóa lời cảm ơn"
                                    className="w-7 h-7 rounded-lg text-[#C84B31]/75 hover:text-[#C84B31] hover:bg-[#C84B31]/10 flex items-center justify-center shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* =====================================================
                TAB 5: BÁO CÁO TÌNH TRẠNG (STATUS REPORTS)
               ===================================================== */}
            {activeTab === 'reports' && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1F2933]">
                    Báo cáo tình trạng ({unresolvedReportsCount} chưa xử lý)
                  </h1>
                  <p className="text-xs sm:text-sm text-[#52606D]">
                    Kết nối trực tiếp với nút &ldquo;Báo tình trạng&rdquo; từ người dùng ngoài trang bản đồ.
                  </p>
                </div>

                {statusReports.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-[#EBE5DC] p-10 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-[#3A6B5C] mx-auto" />
                    <p className="text-sm font-bold text-[#1F2933]">
                      Chưa có báo cáo tình trạng nào
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {statusReports.map((report) => {
                      const badge = REPORT_STATUS_LABEL[report.reportedStatus];
                      return (
                        <div
                          key={report.id}
                          className={`rounded-2xl bg-white border shadow-sm p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                            report.resolved
                              ? 'border-[#EBE5DC] opacity-70'
                              : 'border-[#E9A825]/50'
                          }`}
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-bold text-[#1F2933]">
                                {report.artisanName}
                              </h3>
                              <span
                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.colorClass}`}
                              >
                                {badge.icon} {badge.label}
                              </span>
                              {report.resolved && (
                                <span className="text-[11px] font-semibold text-[#3A6B5C] inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Đã xử lý
                                </span>
                              )}
                            </div>

                            {report.note ? (
                              <p className="text-xs text-[#1F2933] leading-relaxed">
                                Ghi chú: &ldquo;{report.note}&rdquo;
                              </p>
                            ) : (
                              <p className="text-xs text-[#7B8794] italic">
                                Người dùng không để lại ghi chú thêm.
                              </p>
                            )}

                            <p className="text-[11px] text-[#7B8794] tabular-nums">
                              Thời gian gửi: {report.createdAt}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => onApplyReportStatus(report)}
                              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                            >
                              Cập nhật trạng thái thợ
                            </button>

                            {!report.resolved && (
                              <button
                                type="button"
                                onClick={() => onResolveReport(report.id)}
                                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#3A6B5C]/30 bg-[#3A6B5C]/10 hover:bg-[#3A6B5C]/15 text-[#3A6B5C] text-xs font-semibold transition-colors whitespace-nowrap"
                              >
                                Đánh dấu đã xử lý
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =====================================================
                TAB 6: NHẬT KÝ HOẠT ĐỘNG (AUDIT LOG)
               ===================================================== */}
            {activeTab === 'audit' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1F2933]">
                      Nhật ký hoạt động ({filteredAuditLogs.length})
                    </h1>
                    <p className="text-xs sm:text-sm text-[#52606D]">
                      Ghi nhận tự động mọi thao tác duyệt, chỉnh sửa, cập nhật và quản trị trong hệ thống.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Lọc nhật ký theo người thực hiện"
                      value={auditActorFilter}
                      onChange={(e) => setAuditActorFilter(e.target.value)}
                      className="min-h-[40px] px-3 py-2 rounded-xl border border-[#E5DFD5] bg-white text-xs font-semibold text-[#1F2933]"
                    >
                      <option value="all">Tất cả người thực hiện</option>
                      {auditActors.map((actor) => (
                        <option key={actor} value={actor}>
                          {actor}
                        </option>
                      ))}
                    </select>

                    {isSuperAdmin && auditLogs.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearAuditLogs}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#C84B31]/25 bg-[#C84B31]/8 hover:bg-[#C84B31]/15 text-[#C84B31] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa nhật ký</span>
                      </button>
                    )}
                  </div>
                </div>

                {filteredAuditLogs.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-[#EBE5DC] p-10 text-center space-y-2">
                    <History className="w-10 h-10 text-[#7B8794]/50 mx-auto" />
                    <p className="text-sm font-bold text-[#1F2933]">
                      Chưa có nhật ký hoạt động nào
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white border border-[#EBE5DC] shadow-sm divide-y divide-[#F0EAE1] overflow-hidden">
                    {filteredAuditLogs.map((log) => {
                      const cat = AUDIT_CATEGORY_LABEL[log.category];
                      return (
                        <div
                          key={log.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#FAF8F5]/70 transition-colors"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.badgeClass}`}
                              >
                                {cat.label}
                              </span>
                              <span className="text-xs font-bold text-[#1F2933]">
                                {log.actorName}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#3E4C59] leading-relaxed">
                              {log.action}
                            </p>
                          </div>
                          <span className="text-[11px] font-medium text-[#7B8794] tabular-nums whitespace-nowrap shrink-0">
                            {log.timestamp}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =====================================================
                TAB 7: QUẢN LÝ TÀI KHOẢN ADMIN (+ IMPORT CSV HÀNG LOẠT)
               ===================================================== */}
            {activeTab === 'accounts' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1F2933]">
                    Quản lý Tài khoản Admin ({adminAccounts.length})
                  </h1>
                  <p className="text-xs sm:text-sm text-[#52606D]">
                    Phân quyền đội ngũ điều phối (Super Admin) và Cộng tác viên xác minh thực địa; hỗ trợ tạo lẻ hoặc nhập hàng loạt từ CSV.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Danh sách tài khoản */}
                  <div className="lg:col-span-7 space-y-3">
                    {adminAccounts.map((acc) => {
                      const isSelf = acc.id === currentAdmin.id;
                      return (
                        <div
                          key={acc.id}
                          className="rounded-2xl bg-white border border-[#EBE5DC] shadow-sm p-4 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-[#1F2933] truncate">
                                {acc.name}
                              </p>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  acc.role === 'Super Admin'
                                    ? 'bg-[#D96B38]/12 text-[#D96B38]'
                                    : 'bg-[#3A6B5C]/12 text-[#3A6B5C]'
                                }`}
                              >
                                {acc.role}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1F2933] text-white">
                                  Đang đăng nhập
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#52606D] truncate">
                              {acc.email} · Tạo ngày {acc.createdAt}
                            </p>
                          </div>

                          {isSuperAdmin && !isSelf && (
                            <button
                              type="button"
                              onClick={() => onDeleteAdminAccount(acc.id)}
                              aria-label={`Xóa tài khoản ${acc.name}`}
                              className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-[#C84B31]/20 bg-[#C84B31]/8 hover:bg-[#C84B31]/15 text-[#C84B31] text-xs font-semibold inline-flex items-center gap-1 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Cột phải: Tạo mới 1 tài khoản + Nhập hàng loạt từ CSV */}
                  <div className="lg:col-span-5 space-y-4">
                    {isSuperAdmin ? (
                      <>
                        {/* Form tạo 1 tài khoản */}
                        <form
                          onSubmit={handleCreateAdminSubmit}
                          className="rounded-2xl bg-white border border-[#EBE5DC] shadow-sm p-5 space-y-4"
                        >
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-[#D96B38]" />
                            <h2 className="text-sm font-bold text-[#1F2933]">
                              Tạo tài khoản Admin mới
                            </h2>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#1F2933] mb-1">
                              Họ tên hiển thị
                            </label>
                            <input
                              type="text"
                              required
                              value={newAdminName}
                              onChange={(e) => setNewAdminName(e.target.value)}
                              placeholder="VD: Minh Anh (CTV Bình Thạnh)"
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm focus:bg-white focus:outline-none focus:border-[#D96B38]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#1F2933] mb-1">
                              Email đăng nhập
                            </label>
                            <input
                              type="email"
                              required
                              value={newAdminEmail}
                              onChange={(e) => setNewAdminEmail(e.target.value)}
                              placeholder="ctv2@goctho.vn"
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm focus:bg-white focus:outline-none focus:border-[#D96B38]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#1F2933] mb-1">
                              Mật khẩu
                            </label>
                            <input
                              type="text"
                              required
                              value={newAdminPassword}
                              onChange={(e) =>
                                setNewAdminPassword(e.target.value)
                              }
                              placeholder="Tối thiểu 4 ký tự"
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm focus:bg-white focus:outline-none focus:border-[#D96B38]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#1F2933] mb-1">
                              Vai trò phân quyền
                            </label>
                            <select
                              value={newAdminRole}
                              onChange={(e) =>
                                setNewAdminRole(e.target.value as AdminRole)
                              }
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm focus:bg-white focus:outline-none focus:border-[#D96B38]"
                            >
                              <option value="Cộng tác viên">
                                Cộng tác viên (Duyệt &amp; cập nhật thợ)
                              </option>
                              <option value="Super Admin">
                                Super Admin (Toàn quyền quản trị)
                              </option>
                            </select>
                          </div>

                          {adminFormError && (
                            <p className="text-xs font-semibold text-[#C84B31]">
                              {adminFormError}
                            </p>
                          )}

                          <button
                            type="submit"
                            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-sm font-semibold shadow-sm"
                          >
                            Tạo tài khoản
                          </button>
                        </form>

                        {/* Nhập danh sách tạo tài khoản Admin hàng loạt từ CSV */}
                        <div className="rounded-2xl bg-[#FAF8F5] border border-[#E5DFD5] p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-[#3A6B5C]" />
                            <h3 className="text-sm font-bold text-[#1F2933]">
                              Nhập hàng loạt tài khoản từ CSV
                            </h3>
                          </div>
                          <p className="text-xs text-[#52606D] leading-relaxed">
                            Tải file CSV mẫu (gồm các cột: <strong>Họ tên, Email, Mật khẩu, Vai trò</strong>) để tạo nhanh nhiều tài khoản Cộng tác viên hoặc Super Admin cùng lúc. Email trùng sẽ tự động bỏ qua.
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => csvAdminInputRef.current?.click()}
                              className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-[#3A6B5C] hover:bg-[#2F594C] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Nhập CSV tài khoản</span>
                            </button>
                            <button
                              type="button"
                              onClick={downloadAdminAccountsCsvTemplate}
                              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5DFD5] bg-white hover:bg-[#F3EEE6] text-[#1F2933] text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <Download className="w-3.5 h-3.5 text-[#D96B38]" />
                              <span>Tải CSV mẫu</span>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-2xl bg-white border border-[#EBE5DC] p-5 space-y-2 text-xs text-[#52606D]">
                        <div className="flex items-center gap-2 text-[#1F2933] font-bold">
                          <Shield className="w-4 h-4 text-[#3A6B5C]" />
                          <span>Giới hạn phân quyền Cộng tác viên</span>
                        </div>
                        <p className="leading-relaxed">
                          Tài khoản vai trò <strong>Cộng tác viên</strong> có thể duyệt đề xuất, cập nhật hồ sơ thợ, duyệt lưu bút và xử lý báo cáo tình trạng, nhưng không có quyền tạo/nhập hoặc xóa tài khoản Admin khác.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Thêm / Sửa / Chỉnh sửa & Duyệt */}
      {formState.open && (
        <AdminArtisanFormModal
          mode={formState.mode}
          initialArtisan={formState.artisan}
          pendingSuggestion={formState.pending}
          existingArtisans={artisans}
          defaultPic={currentAdmin.name.split('(')[0]?.trim() || currentAdmin.name}
          onClose={() => setFormState({ open: false, mode: 'create' })}
          onSave={(saved, approvedPendingId) => {
            onSaveArtisan(saved, approvedPendingId);
            setFormState({ open: false, mode: 'create' });
          }}
        />
      )}

      {/* Modal Thẻ QR in ấn cho cô chú thợ */}
      {qrCardArtisan && (
        <AdminQrCardModal
          artisan={qrCardArtisan}
          onClose={() => setQrCardArtisan(null)}
        />
      )}

      {/* Modal In thiệp cảm ơn cộng đồng tặng cô chú */}
      {thanksCardArtisan && (
        <AdminThankYouCardModal
          artisan={thanksCardArtisan}
          notes={thankYouNotes}
          onClose={() => setThanksCardArtisan(null)}
        />
      )}

      {/* Modal xem nhanh hồ sơ cũ khi phát hiện trùng lặp */}
      {quickViewArtisan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-dup-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/55 backdrop-blur-xs"
          onClick={() => setQuickViewArtisan(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-[#EBE5DC] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EBE5DC] bg-[#FAF8F5]">
              <h3
                id="quick-view-dup-title"
                className="text-sm font-bold text-[#1F2933]"
              >
                Đối chiếu hồ sơ đã có trên bản đồ
              </h3>
              <button
                type="button"
                onClick={() => setQuickViewArtisan(null)}
                aria-label="Đóng"
                className="w-8 h-8 rounded-lg text-[#52606D] hover:bg-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs text-[#52606D]">
              <div>
                <p className="text-base font-bold text-[#1F2933]">
                  {quickViewArtisan.name}
                </p>
                <p className="text-[#3A6B5C] font-semibold mt-0.5">
                  {quickViewArtisan.categories.join(' · ')} ·{' '}
                  {quickViewArtisan.district}
                </p>
              </div>
              <p>
                <strong className="text-[#1F2933]">Mốc góc phố:</strong>{' '}
                {quickViewArtisan.addressLandmark}
              </p>
              <p className="tabular-nums">
                <strong className="text-[#1F2933]">Tọa độ GPS:</strong>{' '}
                {quickViewArtisan.coordinates.lat.toFixed(5)},{' '}
                {quickViewArtisan.coordinates.lng.toFixed(5)}
              </p>
              <p>
                <strong className="text-[#1F2933]">Giờ hoạt động:</strong>{' '}
                {quickViewArtisan.hours} · {quickViewArtisan.minPriceLabel}
              </p>
              <p>
                <strong className="text-[#1F2933]">Người phụ trách (PIC):</strong>{' '}
                {quickViewArtisan.pic || 'Chưa phân công'}
              </p>
              {quickViewArtisan.internalNotes && (
                <p className="rounded-xl bg-[#FAF8F5] border border-[#EBE5DC] p-2.5">
                  <strong className="text-[#1F2933]">Ghi chú nội bộ:</strong>{' '}
                  {quickViewArtisan.internalNotes}
                </p>
              )}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setQuickViewArtisan(null)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D96B38] text-white text-xs font-semibold"
                >
                  Đã đối chiếu xong
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
