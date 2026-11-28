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
  KeyRound,
  Loader2,
  LogOut,
  MapPin,
  Newspaper,
  Plus,
  Printer,
  QrCode,
  Recycle,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import { CRAFT_CATEGORIES, DISTRICTS } from '../data/artisans';
import { GTQT_LOGO_SRC } from '../data/team';
import type {
  AdminAccount,
  AdminRole,
  AppBackupPayload,
  Article,
  ArticleStatus,
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
  canAccessAdminDashboard,
  downloadAdminAccountsCsvTemplate,
  downloadArtisansCsvTemplate,
  exportArtisansToCsv,
  exportBackupJson,
  formatVietnamTimestamp,
  getDaysSinceVerified,
  getRoleDisplayLabel,
  isSuperAdminRole,
  isValidUsername,
  isVerificationStale,
  normalizeAccountRole,
  parseAdminAccountsFromCsv,
  parseArtisansFromCsv,
  parseBackupJson,
} from '../utils/storage';
import { AdminArticlesTab } from './AdminArticlesTab';
import { AdminArtisanFormModal } from './AdminArtisanFormModal';
import { AdminQrCardModal } from './AdminQrCardModal';
import { AdminThankYouCardModal } from './AdminThankYouCardModal';
import { getStatusDisplay } from './ArtisanCard';
import { ArtisanIllustration } from './ArtisanIllustration';

type AdminTabId =
  | 'overview'
  | 'articles'
  | 'pending'
  | 'artisans'
  | 'thanks'
  | 'reports'
  | 'audit'
  | 'accounts';

interface AdminDashboardProps {
  currentAdmin: AdminAccount;
  artisans: Artisan[];
  articles: Article[];
  pendingSuggestions: PendingSuggestion[];
  statusReports: StatusReport[];
  thankYouNotes: ThankYouNote[];
  auditLogs: AuditLogEntry[];
  adminAccounts: AdminAccount[];
  revivedCount: number;
  onExitToMap: () => void;
  onLogout: () => void;
  onSaveArticle: (article: Article) => Promise<void> | void;
  onToggleArticleStatus: (
    articleId: string,
    nextStatus: ArticleStatus
  ) => Promise<void> | void;
  onDeleteArticle: (articleId: string) => Promise<void> | void;
  onSeedInitialArticles?: () => Promise<void> | void;
  isSeedingArticles?: boolean;
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
  onCreateAdminAccount: (payload: {
    displayName: string;
    username: string;
    password: string;
    role: AdminRole;
  }) => Promise<{ ok: boolean; error?: string }> | void;
  onUpdateAdminAccount: (
    accountId: string,
    payload: {
      displayName: string;
      username: string;
      role: AdminRole;
    }
  ) => Promise<{ ok: boolean; error?: string }> | void;
  onResetAccountPassword: (
    accountId: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }> | void;
  onBulkCreateAdminAccounts: (
    accounts: AdminAccount[],
    skipped: number,
    duplicates: number
  ) => void;
  onDeleteAdminAccount: (accountId: string) => Promise<void> | void;
  onNotify: (message: string) => void;
  isSupabaseMode?: boolean;
  supabaseWarning?: string | null;
  isLoadingAdminData?: boolean;
  isSeedingDb?: boolean;
  isDbArtisansEmpty?: boolean;
  dbError?: string | null;
  onRefreshAdminData?: () => void;
  onSeedInitialArtisans?: () => void;
}

const REPORT_STATUS_LABEL: Record<
  ArtisanStatus,
  { icon: string; label: string; colorClass: string }
> = {
  working: {
    icon: '🟢',
    label: 'Vẫn đang làm',
    colorClass: 'text-[#15803D] bg-[#15803D]/10',
  },
  off_today: {
    icon: '🟡',
    label: 'Hôm nay nghỉ',
    colorClass: 'text-[#9A6807] bg-[#E9A825]/15',
  },
  relocated: {
    icon: '🔴',
    label: 'Đã chuyển chỗ / Sai thông tin',
    colorClass: 'text-[#B93818] bg-[#B93818]/12',
  },
};

const AUDIT_CATEGORY_LABEL: Record<
  AuditCategory,
  { label: string; badgeClass: string }
> = {
  artisan: { label: 'Hồ sơ thợ', badgeClass: 'bg-[#1B3B82]/12 text-[#1B3B82]' },
  pending: { label: 'Duyệt đề xuất', badgeClass: 'bg-[#E86F2C]/12 text-[#E86F2C]' },
  report: { label: 'Báo cáo', badgeClass: 'bg-[#E9A825]/20 text-[#9A6807]' },
  thanks: { label: 'Lưu bút', badgeClass: 'bg-[#E86F2C]/15 text-[#B93818]' },
  article: { label: 'Bản tin', badgeClass: 'bg-[#1B3B82]/15 text-[#142D66]' },
  account: { label: 'Tài khoản', badgeClass: 'bg-[#162442]/10 text-[#162442]' },
  data: { label: 'Dữ liệu', badgeClass: 'bg-[#5C564E]/12 text-[#5C564E]' },
};

export function AdminDashboard({
  currentAdmin,
  artisans,
  articles,
  pendingSuggestions,
  statusReports,
  thankYouNotes,
  auditLogs,
  adminAccounts,
  revivedCount,
  onExitToMap,
  onLogout,
  onSaveArticle,
  onToggleArticleStatus,
  onDeleteArticle,
  onSeedInitialArticles,
  isSeedingArticles = false,
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
  onUpdateAdminAccount,
  onResetAccountPassword,
  onBulkCreateAdminAccounts,
  onDeleteAdminAccount,
  onNotify,
  isSupabaseMode = false,
  supabaseWarning = null,
  isLoadingAdminData = false,
  isSeedingDb = false,
  isDbArtisansEmpty = false,
  dbError = null,
  onRefreshAdminData,
  onSeedInitialArtisans,
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

  // Bộ lọc & tìm kiếm Quản lý tài khoản
  const [accountRoleFilter, setAccountRoleFilter] = useState<'all' | AdminRole>(
    'all'
  );
  const [accountSearch, setAccountSearch] = useState('');

  // Form tạo tài khoản mới (Super Admin)
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('Cộng tác viên');
  const [adminFormError, setAdminFormError] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Modals Quản lý tài khoản: Chỉnh sửa, Đổi mật khẩu, Xác nhận xóa
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<AdminRole>('user');
  const [editAccountError, setEditAccountError] = useState('');
  const [isSavingAccountEdit, setIsSavingAccountEdit] = useState(false);

  const [resetPwdAccount, setResetPwdAccount] = useState<AdminAccount | null>(
    null
  );
  const [nextResetPassword, setNextResetPassword] = useState('');
  const [resetPwdError, setResetPwdError] = useState('');
  const [isResettingPwd, setIsResettingPwd] = useState(false);

  const [deletingAccount, setDeletingAccount] = useState<AdminAccount | null>(
    null
  );
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // File input refs cho CSV & JSON
  const csvArtisanInputRef = useRef<HTMLInputElement | null>(null);
  const jsonBackupInputRef = useRef<HTMLInputElement | null>(null);
  const csvAdminInputRef = useRef<HTMLInputElement | null>(null);

  const currentNormalizedRole = normalizeAccountRole(currentAdmin.role);
  const isSuperAdmin = isSuperAdminRole(currentNormalizedRole);
  const hasAdminAccess = canAccessAdminDashboard(currentNormalizedRole);

  const accountCounts = useMemo(() => {
    let superAdmins = 0;
    let collaborators = 0;
    let users = 0;
    for (const acc of adminAccounts) {
      const r = normalizeAccountRole(acc.role);
      if (r === 'Super Admin') superAdmins += 1;
      else if (r === 'Cộng tác viên') collaborators += 1;
      else users += 1;
    }
    return { superAdmins, collaborators, users };
  }, [adminAccounts]);

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    return adminAccounts.filter((acc) => {
      const roleNorm = normalizeAccountRole(acc.role);
      if (accountRoleFilter !== 'all' && roleNorm !== accountRoleFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (acc.displayName || acc.name).toLowerCase().includes(q) ||
        (acc.username || '').toLowerCase().includes(q) ||
        (acc.email || '').toLowerCase().includes(q)
      );
    });
  }, [adminAccounts, accountRoleFilter, accountSearch]);
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

  // Xử lý Import CSV tạo hàng loạt tài khoản (chỉ Super Admin)
  const handleAdminCsvFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isSuperAdmin) return;
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const existingIdentifiers = adminAccounts.flatMap((a) =>
          [a.username, a.email].filter(Boolean)
        );
        const { accounts, skipped, duplicates } = parseAdminAccountsFromCsv(
          text,
          existingIdentifiers
        );
        if (accounts.length === 0) {
          onNotify(
            duplicates > 0
              ? `Tất cả ${duplicates} tài khoản trong file đều đã tồn tại trong hệ thống.`
              : 'Không tìm thấy tài khoản hợp lệ trong file CSV (cần đủ Tên hiển thị, Tên đăng nhập/Email, Mật khẩu >= 4 ký tự).'
          );
          return;
        }
        onBulkCreateAdminAccounts(accounts, skipped, duplicates);
      } catch {
        onNotify('Lỗi khi đọc file CSV tài khoản.');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleCreateAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || isCreatingAccount) return;

    const cleanName = newAdminName.trim();
    const cleanUsername = newAdminUsername.trim().toLowerCase();
    if (cleanName.length < 2) {
      setAdminFormError('Vui lòng nhập tên hiển thị tối thiểu 2 ký tự.');
      return;
    }
    if (!isValidUsername(cleanUsername)) {
      setAdminFormError(
        'Tên đăng nhập từ 3–64 ký tự, không khoảng trắng (hỗ trợ chữ, số, ., _, -, @).'
      );
      return;
    }
    if (newAdminPassword.length < 4) {
      setAdminFormError('Mật khẩu cần tối thiểu 4 ký tự.');
      return;
    }
    if (
      adminAccounts.some(
        (a) =>
          a.username.toLowerCase() === cleanUsername ||
          a.email.toLowerCase() === cleanUsername
      )
    ) {
      setAdminFormError('Tên đăng nhập / email này đã tồn tại trên hệ thống.');
      return;
    }

    setIsCreatingAccount(true);
    setAdminFormError('');
    try {
      const res = await onCreateAdminAccount({
        displayName: cleanName,
        username: cleanUsername,
        password: newAdminPassword,
        role: normalizeAccountRole(newAdminRole),
      });
      if (res && !res.ok) {
        setAdminFormError(res.error ?? 'Không thể tạo tài khoản mới.');
        return;
      }
      setNewAdminName('');
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminRole('Cộng tác viên');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const openEditAccountModal = (acc: AdminAccount) => {
    if (!isSuperAdmin) return;
    setEditingAccount(acc);
    setEditDisplayName(acc.displayName || acc.name);
    setEditUsername(acc.username || acc.email);
    setEditRole(normalizeAccountRole(acc.role));
    setEditAccountError('');
  };

  const handleSaveAccountEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !editingAccount || isSavingAccountEdit) return;

    const cleanName = editDisplayName.trim();
    const cleanUsername = editUsername.trim().toLowerCase();
    if (cleanName.length < 2) {
      setEditAccountError('Tên hiển thị cần tối thiểu 2 ký tự.');
      return;
    }
    if (!isValidUsername(cleanUsername)) {
      setEditAccountError(
        'Tên đăng nhập không hợp lệ (3–64 ký tự, không chứa khoảng trắng).'
      );
      return;
    }
    const isSelf = editingAccount.id === currentAdmin.id;
    const finalRole: AdminRole = isSelf
      ? 'Super Admin'
      : normalizeAccountRole(editRole);

    setIsSavingAccountEdit(true);
    setEditAccountError('');
    try {
      const res = await onUpdateAdminAccount(editingAccount.id, {
        displayName: cleanName,
        username: cleanUsername,
        role: finalRole,
      });
      if (res && !res.ok) {
        setEditAccountError(res.error ?? 'Không thể cập nhật tài khoản.');
        return;
      }
      setEditingAccount(null);
    } finally {
      setIsSavingAccountEdit(false);
    }
  };

  const openResetPwdModal = (acc: AdminAccount) => {
    if (!isSuperAdmin) return;
    setResetPwdAccount(acc);
    setNextResetPassword('');
    setResetPwdError('');
  };

  const handleConfirmResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !resetPwdAccount || isResettingPwd) return;

    if (nextResetPassword.length < 4) {
      setResetPwdError('Mật khẩu mới cần tối thiểu 4 ký tự.');
      return;
    }

    setIsResettingPwd(true);
    setResetPwdError('');
    try {
      const res = await onResetAccountPassword(
        resetPwdAccount.id,
        nextResetPassword
      );
      if (res && !res.ok) {
        setResetPwdError(res.error ?? 'Không thể đặt lại mật khẩu.');
        return;
      }
      setResetPwdAccount(null);
      setNextResetPassword('');
    } finally {
      setIsResettingPwd(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (
      !isSuperAdmin ||
      !deletingAccount ||
      deletingAccount.id === currentAdmin.id ||
      isDeletingAccount
    ) {
      return;
    }
    setIsDeletingAccount(true);
    try {
      await onDeleteAdminAccount(deletingAccount.id);
      setDeletingAccount(null);
    } finally {
      setIsDeletingAccount(false);
    }
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
      id: 'articles',
      label: 'Quản lý Bản tin',
      Icon: Newspaper,
      badge: articles.length,
    },
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
    {
      id: 'accounts',
      label: 'Quản lý tài khoản',
      Icon: Users,
      badge: adminAccounts.length,
    },
  ];

  if (!hasAdminAccess) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#FDF8F2] p-6">
        <div className="max-w-md w-full rounded-3xl bg-white border border-[#E6D5C3] shadow-lg p-7 text-center space-y-4">
          <span className="w-12 h-12 rounded-2xl bg-[#B93818]/10 text-[#B93818] flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </span>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-[#162442]">
              Khu vực chỉ dành cho quản trị viên
            </h1>
            <p className="text-xs text-[#5C564E] leading-relaxed">
              Chỉ tài khoản có vai trò <strong>Super Admin</strong> hoặc{' '}
              <strong>Cộng tác viên</strong> mới có quyền truy cập Khu Quản Trị.
            </p>
          </div>
          <button
            type="button"
            onClick={onExitToMap}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] text-white text-sm font-semibold"
          >
            Quay về bản đồ Góc Thợ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FDF8F2] text-[#162442]">
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
      <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 bg-white border-b border-[#E6D5C3] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative w-10 h-10 rounded-full overflow-hidden bg-white ring-2 ring-[#1B3B82]/20 shadow-sm shrink-0">
            <img
              src={GTQT_LOGO_SRC}
              alt="Góc Thợ Quanh Ta"
              className="w-full h-full object-cover scale-[1.07]"
            />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm sm:text-base font-bold text-[#162442] truncate">
              Khu Quản Trị · Góc Thợ Quanh Ta
            </p>
            <p className="text-[11px] text-[#5C564E] truncate inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1B3B82] shrink-0" />
              <span>{currentAdmin.displayName || currentAdmin.name}</span>
              <span>·</span>
              <span className="font-bold text-[#1B3B82]">
                {getRoleDisplayLabel(currentNormalizedRole)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isSupabaseMode && onRefreshAdminData && (
            <button
              type="button"
              onClick={onRefreshAdminData}
              disabled={isLoadingAdminData}
              title="Đồng bộ lại dữ liệu mới nhất từ Supabase"
              className="min-h-[40px] px-3 py-2 rounded-xl border border-[#1B3B82]/25 bg-[#1B3B82]/8 hover:bg-[#1B3B82]/15 disabled:opacity-60 text-xs font-semibold text-[#1B3B82] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingAdminData ? 'animate-spin' : ''}`}
              />
              <span className="hidden md:inline">Đồng bộ</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExitToMap}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] hover:bg-[#F3EAE0] text-xs font-semibold text-[#162442] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-[#E86F2C]" />
            <span className="hidden sm:inline">Về trang bản đồ</span>
            <span className="sm:hidden">Bản đồ</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#B93818]/25 bg-[#B93818]/8 hover:bg-[#B93818]/15 text-xs font-semibold text-[#B93818] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar trượt ngang */}
      <nav
        aria-label="Điều hướng quản trị di động"
        className="lg:hidden sticky top-16 z-20 bg-white border-b border-[#E6D5C3] px-3 py-2 overflow-x-auto no-scrollbar"
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
                    ? 'bg-[#E86F2C] text-white shadow-xs'
                    : 'bg-[#FDF8F2] text-[#5C564E] hover:text-[#162442]'
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
                          ? 'bg-[#E86F2C] text-white'
                          : 'bg-[#E6D5C3] text-[#5C564E]'
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
        <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-[#E6D5C3] p-4 justify-between">
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
                      ? 'bg-[#E86F2C] text-white shadow-sm'
                      : 'text-[#5C564E] hover:bg-[#FDF8F2] hover:text-[#162442]'
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
                            ? 'bg-[#E86F2C] text-white'
                            : 'bg-[#F3EAE0] text-[#5C564E]'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="rounded-2xl bg-[#FDF8F2] border border-[#E6D5C3] p-3.5 text-xs text-[#5C564E] space-y-1">
            <p className="font-bold text-[#1B3B82]">
              {isSupabaseMode
                ? 'Đồng bộ Supabase trực tuyến'
                : 'Chế độ dữ liệu mẫu cục bộ'}
            </p>
            <p className="leading-relaxed">
              {isSupabaseMode
                ? 'Hồ sơ cô chú thợ, đề xuất chờ duyệt, báo cáo tình trạng và tài khoản Admin được đồng bộ giữa mọi thiết bị.'
                : 'Thêm VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY để đồng bộ dữ liệu trực tuyến trên mọi thiết bị.'}
            </p>
          </div>
        </aside>

        {/* Nội dung từng Tab */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Cảnh báo cấu hình thiếu biến môi trường Supabase */}
            {supabaseWarning && (
              <div className="rounded-2xl bg-[#FFF8E6] border border-[#E9A825]/60 px-4 py-3 flex items-start gap-2.5 text-xs text-[#8A5A00]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C48200]" />
                <p className="leading-relaxed">{supabaseWarning}</p>
              </div>
            )}

            {/* Trạng thái Loading nhẹ khi đang đồng bộ từ Supabase */}
            {isLoadingAdminData && (
              <div className="rounded-2xl bg-white border border-[#E6D5C3] px-4 py-3 flex items-center gap-2.5 text-xs font-semibold text-[#1B3B82] shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Đang tải dữ liệu mới nhất từ Supabase...</span>
              </div>
            )}

            {/* Thông báo lỗi mạng / cơ sở dữ liệu rõ ràng kèm nút Thử lại */}
            {dbError && (
              <div
                role="alert"
                className="rounded-2xl bg-[#B93818]/10 border border-[#B93818]/30 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#992C12]"
              >
                <div className="flex items-start gap-2.5">
                  <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{dbError}</p>
                </div>
                {onRefreshAdminData && (
                  <button
                    type="button"
                    onClick={onRefreshAdminData}
                    className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#B93818] hover:bg-[#992C12] text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Thử lại</span>
                  </button>
                )}
              </div>
            )}

            {/* Nút nạp 6 dữ liệu mẫu khi bảng artisans trên Supabase đang trống */}
            {isSupabaseMode &&
              isDbArtisansEmpty &&
              !isLoadingAdminData &&
              onSeedInitialArtisans && (
                <div className="rounded-2xl bg-[#1B3B82]/8 border border-[#1B3B82]/30 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-[#1B3B82] shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm">
                      <p className="font-bold text-[#162442]">
                        Bảng dữ liệu cô chú thợ trên Supabase đang trống
                      </p>
                      <p className="text-[#5C564E]">
                        Bạn có thể bấm 1 lần để đẩy sẵn 6 cô chú thợ mẫu khu vực Bình Thạnh, Quận 1, Quận 3 lên Database.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSeedingDb}
                    onClick={onSeedInitialArtisans}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] disabled:opacity-60 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-2 whitespace-nowrap transition-colors"
                  >
                    {isSeedingDb ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang nạp dữ liệu...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5" />
                        <span>Nạp 6 dữ liệu mẫu vào Database</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            {/* =====================================================
                TAB 1: TỔNG QUAN (DASHBOARD + CSV/JSON DATA TOOLS)
               ===================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#162442]">
                      Tổng quan vận hành cộng đồng
                    </h1>
                    <p className="text-xs sm:text-sm text-[#5C564E]">
                      Theo dõi bản đồ Góc Thợ Quanh Ta, dữ liệu quá hạn xác minh và công cụ nhập/sao lưu dữ liệu.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => exportArtisansToCsv(artisans)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] text-white text-xs sm:text-sm font-semibold shadow-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap"
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
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] text-white text-xs font-semibold whitespace-nowrap"
                    >
                      Xem hồ sơ cần xác minh →
                    </button>
                  </div>
                )}

                {/* 5 Thẻ thống kê nhanh */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                  <div className="rounded-2xl bg-white border border-[#E6D5C3] shadow-sm p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#5C564E]">
                      <span className="font-medium">Thợ đang hiển thị</span>
                      <Wrench className="w-4 h-4 text-[#1B3B82]" />
                    </div>
                    <p className="text-3xl font-bold text-[#162442] tabular-nums">
                      {visibleArtisans.length}
                    </p>
                    <p className="text-[11px] text-[#5C564E]">
                      Tổng lưu trữ: {artisans.length} hồ sơ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('pending')}
                    className={`rounded-2xl border shadow-sm p-4 space-y-2 text-left transition-all ${
                      pendingSuggestions.length > 0
                        ? 'bg-[#E86F2C]/8 border-[#E86F2C]/40 hover:border-[#E86F2C]'
                        : 'bg-white border-[#E6D5C3]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-[#5C564E]">
                      <span className="font-medium">Đề xuất chờ duyệt</span>
                      <ClipboardCheck
                        className={`w-4 h-4 ${
                          pendingSuggestions.length > 0
                            ? 'text-[#E86F2C]'
                            : 'text-[#8A8177]'
                        }`}
                      />
                    </div>
                    <p
                      className={`text-3xl font-bold tabular-nums ${
                        pendingSuggestions.length > 0
                          ? 'text-[#E86F2C]'
                          : 'text-[#162442]'
                      }`}
                    >
                      {pendingSuggestions.length}
                    </p>
                    <p className="text-[11px] text-[#5C564E]">
                      {pendingSuggestions.length > 0
                        ? 'Bấm để xem & duyệt ngay →'
                        : 'Đã xử lý toàn bộ'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('reports')}
                    className="rounded-2xl bg-white border border-[#E6D5C3] hover:border-[#E9A825] shadow-sm p-4 space-y-2 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-[#5C564E]">
                      <span className="font-medium">Báo cáo chưa xử lý</span>
                      <AlertTriangle
                        className={`w-4 h-4 ${
                          unresolvedReportsCount > 0
                            ? 'text-[#E9A825]'
                            : 'text-[#8A8177]'
                        }`}
                      />
                    </div>
                    <p className="text-3xl font-bold text-[#162442] tabular-nums">
                      {unresolvedReportsCount}
                    </p>
                    <p className="text-[11px] text-[#5C564E]">
                      Lưu bút chờ duyệt: {pendingThanks.length}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('accounts')}
                    className="rounded-2xl bg-white border border-[#E6D5C3] hover:border-[#1B3B82]/40 shadow-sm p-4 space-y-2 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-[#5C564E]">
                      <span className="font-medium">Tài khoản hệ thống</span>
                      <Users className="w-4 h-4 text-[#5C564E]" />
                    </div>
                    <p className="text-3xl font-bold text-[#162442] tabular-nums">
                      {adminAccounts.length}
                    </p>
                    <p className="text-[11px] text-[#5C564E] tabular-nums">
                      {accountCounts.superAdmins} Admin · {accountCounts.collaborators} CTV · {accountCounts.users} TV
                    </p>
                  </button>

                  <div className="rounded-2xl bg-[#1B3B82] text-white shadow-sm p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/85">
                      <span className="font-medium">Món đồ được hồi sinh</span>
                      <Recycle className="w-4 h-4 text-[#FDBA8C]" />
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
                <section className="rounded-2xl bg-white border border-[#E6D5C3] shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#E86F2C]" />
                    <h2 className="text-sm font-bold text-[#162442]">
                      Công cụ Dữ liệu hàng loạt &amp; Sao lưu hệ thống
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nhập cô chú thợ từ CSV */}
                    <div className="rounded-2xl bg-[#FDF8F2] border border-[#E6D5C3] p-4 space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#162442] inline-flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-[#1B3B82]" />
                          <span>Nhập danh sách cô chú thợ từ CSV</span>
                        </p>
                        <p className="text-xs text-[#5C564E] leading-relaxed">
                          Tải file CSV mẫu chuẩn tiếng Việt, điền danh sách khảo sát rồi tải lên để nạp hàng loạt vào bản đồ.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => csvArtisanInputRef.current?.click()}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Nhập từ CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={downloadArtisansCsvTemplate}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#DFCBB5] bg-white hover:bg-[#F6EFE6] text-[#162442] text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-[#1B3B82]" />
                          <span>Tải file CSV mẫu</span>
                        </button>
                      </div>
                    </div>

                    {/* Sao lưu & Khôi phục JSON */}
                    <div className="rounded-2xl bg-[#FDF8F2] border border-[#E6D5C3] p-4 space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#162442] inline-flex items-center gap-1.5">
                          <RefreshCw className="w-4 h-4 text-[#E86F2C]" />
                          <span>Sao lưu &amp; Khôi phục toàn bộ dữ liệu (JSON)</span>
                        </p>
                        <p className="text-xs text-[#5C564E] leading-relaxed">
                          Gồm toàn bộ cô chú thợ, đề xuất, báo cáo, sổ lưu bút, nhật ký hoạt động và tài khoản để chuyển máy an toàn.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExportJsonBackup}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Sao lưu (Export JSON)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => jsonBackupInputRef.current?.click()}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#DFCBB5] bg-white hover:bg-[#F6EFE6] text-[#162442] text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#E86F2C]" />
                          <span>Khôi phục (Import JSON)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Biểu đồ thanh ngang CSS thuần */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-2xl bg-white border border-[#E6D5C3] shadow-sm p-5 space-y-4">
                    <h2 className="text-sm font-bold text-[#162442]">
                      Phân bố cô chú thợ theo Khu vực
                    </h2>
                    <div className="space-y-3.5">
                      {districtStats.map((item) => (
                        <div key={item.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#162442]">
                              {item.label}
                            </span>
                            <span className="font-bold text-[#E86F2C] tabular-nums">
                              {item.count} góc thợ
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-[#F6EFE6] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#E86F2C] transition-all duration-300"
                              style={{
                                width: `${Math.max(item.percent, item.count > 0 ? 8 : 0)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-[#E6D5C3] shadow-sm p-5 space-y-4">
                    <h2 className="text-sm font-bold text-[#162442]">
                      Phân bố theo Loại dịch vụ
                    </h2>
                    <div className="space-y-3">
                      {categoryStats.map((item) => (
                        <div key={item.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#162442]">
                              {item.label}
                            </span>
                            <span className="font-bold text-[#1B3B82] tabular-nums">
                              {item.count} địa điểm
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-[#EEF2FA] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#1B3B82] transition-all duration-300"
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
                  <h1 className="text-xl sm:text-2xl font-bold text-[#162442]">
                    Đề xuất chờ duyệt ({pendingSuggestions.length})
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5C564E]">
                    Hệ thống tự động kiểm tra trùng lặp theo khoảng cách Haversine (bán kính 200m) &amp; tên gọi trước khi đưa lên bản đồ.
                  </p>
                </div>

                {pendingSuggestions.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-[#E6D5C3] p-10 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-[#1B3B82] mx-auto" />
                    <p className="text-sm font-bold text-[#162442]">
                      Không còn đề xuất nào đang chờ duyệt
                    </p>
                    <p className="text-xs text-[#5C564E]">
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
                              : 'border-[#E6D5C3]'
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
                                  className="min-h-[34px] px-3 py-1 rounded-lg bg-white hover:bg-[#FDF8F2] border border-[#E9A825]/50 text-[11px] font-bold text-[#8A5A00] inline-flex items-center gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Xem nhanh hồ sơ cũ để đối chiếu</span>
                                </button>
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-base font-bold text-[#162442]">
                                  {item.name}
                                </h3>
                                <p className="text-xs text-[#1B3B82] font-semibold mt-0.5">
                                  {item.categories.join(' · ')} · {item.district}
                                </p>
                              </div>
                              <span className="text-[11px] font-semibold text-[#E86F2C] bg-[#E86F2C]/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                                Chờ duyệt
                              </span>
                            </div>

                            {item.customImageUrl && (
                              <div className="aspect-[16/9] rounded-xl overflow-hidden border border-[#E6D5C3]">
                                <img
                                  src={item.customImageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            <div className="space-y-1.5 text-xs text-[#5C564E]">
                              <p>
                                <strong className="text-[#162442]">
                                  Mốc góc phố:
                                </strong>{' '}
                                {item.addressLandmark}
                              </p>
                              {item.coordinates && (
                                <p className="tabular-nums text-[11px] text-[#8A8177]">
                                  GPS ước tính: {item.coordinates.lat.toFixed(4)},{' '}
                                  {item.coordinates.lng.toFixed(4)}
                                </p>
                              )}
                              <p>
                                <strong className="text-[#162442]">
                                  Khung giờ:
                                </strong>{' '}
                                {item.hours} ·{' '}
                                <strong className="text-[#162442]">Giá:</strong>{' '}
                                {item.minPriceLabel}
                              </p>
                              <p>
                                <strong className="text-[#162442]">
                                  Tiện ích:
                                </strong>{' '}
                                {item.paymentMethod} · {item.parkingInfo}
                              </p>
                              <p>
                                <strong className="text-[#162442]">
                                  Lỗi nhận sửa:
                                </strong>{' '}
                                {item.problems.join(', ')}
                              </p>
                              {item.story && (
                                <p className="italic text-[#5C564E] pt-1">
                                  &ldquo;{item.story}&rdquo;
                                </p>
                              )}
                            </div>

                            <p className="text-[11px] text-[#8A8177] pt-2 border-t border-[#F3EAE0]">
                              Gửi bởi{' '}
                              <strong className="text-[#5C564E]">
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
                              className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Chỉnh sửa &amp; Duyệt</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onRejectPending(item.id)}
                              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#B93818]/25 bg-[#B93818]/8 hover:bg-[#B93818]/15 text-[#B93818] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
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
                    <h1 className="text-xl sm:text-2xl font-bold text-[#162442]">
                      Quản lý cô chú thợ ({artisans.length})
                    </h1>
                    <p className="text-xs sm:text-sm text-[#5C564E]">
                      Quản lý hồ sơ, Người phụ trách (PIC), nhắc xác minh quá 30 ngày, in Thẻ QR và Thiệp cảm ơn.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => csvArtisanInputRef.current?.click()}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DFCBB5] bg-white hover:bg-[#FDF8F2] text-[#162442] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#1B3B82]" />
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
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] text-white text-xs sm:text-sm font-semibold shadow-sm inline-flex items-center gap-2 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm cô chú thợ</span>
                    </button>
                  </div>
                </div>

                {/* Bộ lọc tìm kiếm + trạng thái + lọc hồ sơ cần xác minh lại */}
                <div className="rounded-2xl bg-white border border-[#E6D5C3] p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#8A8177] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={artisanSearch}
                      onChange={(e) => setArtisanSearch(e.target.value)}
                      placeholder="Tìm theo tên, quận, dịch vụ, PIC hoặc mốc đường..."
                      className="w-full min-h-[42px] pl-10 pr-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
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
                      className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-xs font-semibold text-[#162442]"
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
                          : 'bg-[#FDF8F2] border-[#DFCBB5] text-[#5C564E]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={onlyStaleVerification}
                        onChange={(e) =>
                          setOnlyStaleVerification(e.target.checked)
                        }
                        className="w-4 h-4 rounded accent-[#E86F2C]"
                      />
                      <span>
                        Chỉ hiện hồ sơ cần xác minh ({staleArtisansCount})
                      </span>
                    </label>
                  </div>
                </div>

                {/* Danh sách quản lý */}
                {filteredArtisans.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-[#E6D5C3] p-8 text-center space-y-3">
                    <p className="text-xs text-[#5C564E]">
                      {artisans.length === 0 && isSupabaseMode
                        ? 'Chưa có hồ sơ cô chú thợ nào trên Supabase.'
                        : 'Không tìm thấy hồ sơ cô chú thợ phù hợp với bộ lọc hiện tại.'}
                    </p>
                    {isSupabaseMode &&
                      isDbArtisansEmpty &&
                      onSeedInitialArtisans && (
                        <button
                          type="button"
                          disabled={isSeedingDb}
                          onClick={onSeedInitialArtisans}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          {isSeedingDb ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Database className="w-3.5 h-3.5" />
                          )}
                          <span>Nạp 6 dữ liệu mẫu vào Database</span>
                        </button>
                      )}
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
                                ? 'border-[#DFCBB5] opacity-75'
                                : 'border-[#E6D5C3]'
                          }`}
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#F6EFE6]">
                              <ArtisanIllustration
                                variant={artisan.illustrationVariant}
                                customImageUrl={artisan.customImageUrl}
                                alt={artisan.name}
                              />
                            </div>
                            <div className="min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-[#162442]">
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
                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#5C564E]/15 text-[#5C564E]">
                                    Đang ẩn
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-[#5C564E]">
                                {artisan.district} · {artisan.addressLandmark}
                              </p>

                              {/* Người phụ trách (PIC) & Ghi chú nội bộ (chỉ hiện trong Admin) */}
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
                                <span className="inline-flex items-center gap-1 font-semibold text-[#1B3B82] bg-[#1B3B82]/10 px-2 py-0.5 rounded-md">
                                  <UserCheck className="w-3 h-3" />
                                  PIC: {artisan.pic || 'Chưa phân công'}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[#8A8177] tabular-nums">
                                  <Clock className="w-3 h-3" />
                                  Xác minh: {artisan.verifiedDate}
                                </span>
                                <span className="text-[#8A8177]">
                                  {artisan.paymentMethod} · {artisan.parkingInfo}
                                </span>
                              </div>

                              {artisan.internalNotes && (
                                <p className="text-[11px] text-[#5C564E] bg-[#FDF8F2] border border-[#E6D5C3] rounded-lg px-2.5 py-1.5 leading-relaxed">
                                  <strong className="text-[#162442]">
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
                                  ? 'bg-[#1B3B82] hover:bg-[#142D66] text-white shadow-xs'
                                  : 'border border-[#1B3B82]/30 bg-[#1B3B82]/8 hover:bg-[#1B3B82]/15 text-[#1B3B82]'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>✓ Xác nhận lại hôm nay</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setThanksCardArtisan(artisan)}
                              title="In thiệp cảm ơn cộng đồng tặng cô chú"
                              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E86F2C]/30 bg-[#FDF8F2] hover:bg-[#E86F2C]/12 text-[#B93818] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>
                                In thiệp ({artisanApprovedThanks})
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setQrCardArtisan(artisan)}
                              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E86F2C]/35 bg-[#E86F2C]/8 hover:bg-[#E86F2C]/15 text-[#E86F2C] text-xs font-semibold inline-flex items-center gap-1.5"
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
                              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] hover:bg-[#F3EAE0] text-[#162442] text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onToggleArtisanVisibility(artisan.id)
                              }
                              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DFCBB5] bg-white hover:bg-[#FDF8F2] text-[#5C564E] text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              {artisan.isHidden ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-[#1B3B82]" />
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
                              className="min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#B93818]/20 bg-[#B93818]/8 hover:bg-[#B93818]/15 text-[#B93818] text-xs font-semibold inline-flex items-center gap-1"
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
                  <h1 className="text-xl sm:text-2xl font-bold text-[#162442]">
                    Duyệt Sổ lưu bút cảm ơn ({pendingThanks.length} chờ duyệt)
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5C564E]">
                    Kiểm duyệt lời nhắn ấm áp từ cộng đồng trước khi hiển thị công khai và in thiệp tri ân gửi tận tay cô chú thợ.
                  </p>
                </div>

                {/* Phần 1: Lời cảm ơn chờ duyệt */}
                <section className="space-y-3">
                  <h2 className="text-sm font-bold text-[#162442]">
                    Lời nhắn đang chờ duyệt ({pendingThanks.length})
                  </h2>

                  {pendingThanks.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-[#E6D5C3] p-7 text-center space-y-1.5">
                      <CheckCircle2 className="w-8 h-8 text-[#1B3B82] mx-auto" />
                      <p className="text-sm font-bold text-[#162442]">
                        Không có lời cảm ơn nào đang chờ duyệt
                      </p>
                      <p className="text-xs text-[#5C564E]">
                        Khi người dùng viết lời nhắn trong mục &ldquo;Sổ lưu bút cảm ơn&rdquo;, lời nhắn sẽ hiển thị tại đây.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingThanks.map((note) => (
                        <article
                          key={note.id}
                          className="rounded-2xl bg-[#FDF8F2] border border-[#EEDCB9] shadow-sm p-4 space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-bold text-[#E86F2C]">
                                  Gửi tới: {note.artisanName}
                                </p>
                                <p className="text-xs font-semibold text-[#162442] mt-0.5">
                                  Từ: {note.author} ·{' '}
                                  <span className="font-normal text-[#8A8177] tabular-nums">
                                    {note.createdAt}
                                  </span>
                                </p>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E86F2C]/12 text-[#E86F2C]">
                                Chờ duyệt
                              </span>
                            </div>

                            <p className="text-xs text-[#162442] leading-relaxed italic bg-white/80 rounded-xl p-3 border border-[#F0E4CC]">
                              &ldquo;{note.message}&rdquo;
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onApproveThankYou(note.id)}
                              className="flex-1 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Duyệt hiển thị</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteThankYou(note.id)}
                              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#B93818]/25 bg-[#B93818]/8 hover:bg-[#B93818]/15 text-[#B93818] text-xs font-semibold inline-flex items-center gap-1.5"
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
                <section className="space-y-3 pt-4 border-t border-[#E6D5C3]">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-[#162442]">
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
                          className="rounded-2xl bg-white border border-[#E6D5C3] shadow-sm p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-[#162442] truncate">
                                {artisan.name}
                              </h3>
                              <p className="text-xs text-[#5C564E]">
                                {list.length} lời cảm ơn đã duyệt · {artisan.district}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setThanksCardArtisan(artisan)}
                              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
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
                                  className="rounded-xl bg-[#FDF8F2] border border-[#E6D5C3] p-2.5 flex items-start justify-between gap-2 text-xs"
                                >
                                  <div className="min-w-0 space-y-0.5">
                                    <p className="font-semibold text-[#162442]">
                                      {n.author}{' '}
                                      <span className="font-normal text-[#8A8177] text-[11px]">
                                        · {n.createdAt}
                                      </span>
                                    </p>
                                    <p className="text-[#5C564E] italic line-clamp-2">
                                      &ldquo;{n.message}&rdquo;
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteThankYou(n.id)}
                                    aria-label="Xóa lời cảm ơn"
                                    className="w-7 h-7 rounded-lg text-[#B93818]/75 hover:text-[#B93818] hover:bg-[#B93818]/10 flex items-center justify-center shrink-0"
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
                  <h1 className="text-xl sm:text-2xl font-bold text-[#162442]">
                    Báo cáo tình trạng ({unresolvedReportsCount} chưa xử lý)
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5C564E]">
                    Kết nối trực tiếp với nút &ldquo;Báo tình trạng&rdquo; từ người dùng ngoài trang bản đồ.
                  </p>
                </div>

                {statusReports.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-[#E6D5C3] p-10 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-[#1B3B82] mx-auto" />
                    <p className="text-sm font-bold text-[#162442]">
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
                              ? 'border-[#E6D5C3] opacity-70'
                              : 'border-[#E9A825]/50'
                          }`}
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-bold text-[#162442]">
                                {report.artisanName}
                              </h3>
                              <span
                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.colorClass}`}
                              >
                                {badge.icon} {badge.label}
                              </span>
                              {report.resolved && (
                                <span className="text-[11px] font-semibold text-[#1B3B82] inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Đã xử lý
                                </span>
                              )}
                            </div>

                            {report.note ? (
                              <p className="text-xs text-[#162442] leading-relaxed">
                                Ghi chú: &ldquo;{report.note}&rdquo;
                              </p>
                            ) : (
                              <p className="text-xs text-[#8A8177] italic">
                                Người dùng không để lại ghi chú thêm.
                              </p>
                            )}

                            <p className="text-[11px] text-[#8A8177] tabular-nums">
                              Thời gian gửi: {report.createdAt}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => onApplyReportStatus(report)}
                              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                            >
                              Cập nhật trạng thái thợ
                            </button>

                            {!report.resolved && (
                              <button
                                type="button"
                                onClick={() => onResolveReport(report.id)}
                                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#1B3B82]/30 bg-[#1B3B82]/10 hover:bg-[#1B3B82]/15 text-[#1B3B82] text-xs font-semibold transition-colors whitespace-nowrap"
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
                    <h1 className="text-xl sm:text-2xl font-bold text-[#162442]">
                      Nhật ký hoạt động ({filteredAuditLogs.length})
                    </h1>
                    <p className="text-xs sm:text-sm text-[#5C564E]">
                      Ghi nhận tự động mọi thao tác duyệt, chỉnh sửa, cập nhật và quản trị trong hệ thống.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Lọc nhật ký theo người thực hiện"
                      value={auditActorFilter}
                      onChange={(e) => setAuditActorFilter(e.target.value)}
                      className="min-h-[40px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-white text-xs font-semibold text-[#162442]"
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
                        className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#B93818]/25 bg-[#B93818]/8 hover:bg-[#B93818]/15 text-[#B93818] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa nhật ký</span>
                      </button>
                    )}
                  </div>
                </div>

                {filteredAuditLogs.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-[#E6D5C3] p-10 text-center space-y-2">
                    <History className="w-10 h-10 text-[#8A8177]/50 mx-auto" />
                    <p className="text-sm font-bold text-[#162442]">
                      Chưa có nhật ký hoạt động nào
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white border border-[#E6D5C3] shadow-sm divide-y divide-[#F3EAE0] overflow-hidden">
                    {filteredAuditLogs.map((log) => {
                      const cat = AUDIT_CATEGORY_LABEL[log.category];
                      return (
                        <div
                          key={log.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#FDF8F2]/70 transition-colors"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.badgeClass}`}
                              >
                                {cat.label}
                              </span>
                              <span className="text-xs font-bold text-[#162442]">
                                {log.actorName}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#3A455C] leading-relaxed">
                              {log.action}
                            </p>
                          </div>
                          <span className="text-[11px] font-medium text-[#8A8177] tabular-nums whitespace-nowrap shrink-0">
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
                TAB 7: QUẢN LÝ TÀI KHOẢN (TOÀN BỘ TÀI KHOẢN TRÊN SUPABASE)
               ===================================================== */}
            {activeTab === 'accounts' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#162442]">
                      Quản lý tài khoản ({adminAccounts.length})
                    </h1>
                    <p className="text-xs sm:text-sm text-[#5C564E]">
                      Quản lý toàn bộ tài khoản Super Admin, Cộng tác viên và Người dùng trên bảng{' '}
                      <code className="font-semibold text-[#1B3B82]">admin_accounts</code>.
                    </p>
                  </div>
                </div>

                {/* Bộ lọc theo vai trò & Ô tìm kiếm */}
                <div className="rounded-2xl bg-white border border-[#E6D5C3] shadow-xs p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {(
                      [
                        { id: 'all', label: `Tất cả (${adminAccounts.length})` },
                        {
                          id: 'Super Admin',
                          label: `Super Admin (${accountCounts.superAdmins})`,
                        },
                        {
                          id: 'Cộng tác viên',
                          label: `Cộng tác viên (${accountCounts.collaborators})`,
                        },
                        {
                          id: 'user',
                          label: `Người dùng (${accountCounts.users})`,
                        },
                      ] as const
                    ).map((tab) => {
                      const active = accountRoleFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setAccountRoleFilter(tab.id)}
                          className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                            active
                              ? 'bg-[#E86F2C] text-white shadow-xs'
                              : 'bg-[#FDF8F2] border border-[#DFCBB5] text-[#5C564E] hover:text-[#162442]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full md:w-64 shrink-0">
                    <Search className="w-4 h-4 text-[#8A8177] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      placeholder="Tìm theo tên, username, email..."
                      className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-xs text-[#162442] focus:bg-white focus:outline-none focus:border-[#E86F2C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Danh sách tài khoản */}
                  <div className="lg:col-span-7 space-y-3">
                    {filteredAccounts.length === 0 ? (
                      <div className="rounded-2xl bg-white border border-[#E6D5C3] p-8 text-center space-y-1.5">
                        <Users className="w-8 h-8 text-[#8A8177]/50 mx-auto" />
                        <p className="text-sm font-bold text-[#162442]">
                          Không tìm thấy tài khoản phù hợp
                        </p>
                        <p className="text-xs text-[#5C564E]">
                          Thử đổi bộ lọc vai trò hoặc từ khóa tìm kiếm khác.
                        </p>
                      </div>
                    ) : (
                      filteredAccounts.map((acc) => {
                        const isSelf = acc.id === currentAdmin.id;
                        const roleNorm = normalizeAccountRole(acc.role);
                        const displayName = acc.displayName || acc.name;
                        const handle = acc.username || acc.email;
                        return (
                          <div
                            key={acc.id}
                            className="rounded-2xl bg-white border border-[#E6D5C3] shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-[#162442] truncate">
                                  {displayName}
                                </p>
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                    roleNorm === 'Super Admin'
                                      ? 'bg-[#E86F2C]/12 text-[#E86F2C]'
                                      : roleNorm === 'Cộng tác viên'
                                        ? 'bg-[#1B3B82]/12 text-[#1B3B82]'
                                        : 'bg-[#E6D5C3] text-[#5C564E]'
                                  }`}
                                >
                                  {getRoleDisplayLabel(roleNorm)}
                                </span>
                                {isSelf && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#162442] text-white">
                                    Đang đăng nhập
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#5C564E] truncate">
                                @{handle} · Tạo ngày {acc.createdAt}
                              </p>
                              <p className="text-[11px] text-[#8A8177] tabular-nums">
                                ♻️ {acc.revivedCount ?? 0} lần sửa đồ · ❤️{' '}
                                {acc.favoriteArtisanIds?.length ?? 0} góc thợ đã lưu
                              </p>
                            </div>

                            {isSuperAdmin && (
                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditAccountModal(acc)}
                                  title="Chỉnh sửa tên hiển thị, tên đăng nhập & vai trò"
                                  className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] hover:border-[#E86F2C] text-[#162442] text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-[#E86F2C]" />
                                  <span>Sửa</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openResetPwdModal(acc)}
                                  title="Đặt lại mật khẩu mới cho tài khoản này"
                                  className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#1B3B82]/25 bg-[#1B3B82]/8 hover:bg-[#1B3B82]/15 text-[#1B3B82] text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>Đổi MK</span>
                                </button>

                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingAccount(acc)}
                                    aria-label={`Xóa tài khoản ${displayName}`}
                                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#B93818]/20 bg-[#B93818]/8 hover:bg-[#B93818]/15 text-[#B93818] text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Xóa</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Cột phải: Tạo mới 1 tài khoản + Nhập hàng loạt từ CSV */}
                  <div className="lg:col-span-5 space-y-4">
                    {isSuperAdmin ? (
                      <>
                        {/* Form tạo 1 tài khoản */}
                        <form
                          onSubmit={handleCreateAdminSubmit}
                          className="rounded-2xl bg-white border border-[#E6D5C3] shadow-sm p-5 space-y-4"
                        >
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-[#E86F2C]" />
                            <h2 className="text-sm font-bold text-[#162442]">
                              Tạo tài khoản mới
                            </h2>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#162442] mb-1">
                              Tên hiển thị
                            </label>
                            <input
                              type="text"
                              required
                              value={newAdminName}
                              onChange={(e) => {
                                setNewAdminName(e.target.value);
                                if (adminFormError) setAdminFormError('');
                              }}
                              placeholder="VD: Minh Anh (CTV Bình Thạnh)"
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#162442] mb-1">
                              Tên đăng nhập hoặc Email (không khoảng trắng)
                            </label>
                            <input
                              type="text"
                              required
                              value={newAdminUsername}
                              onChange={(e) => {
                                setNewAdminUsername(
                                  e.target.value.replace(/\s+/g, '')
                                );
                                if (adminFormError) setAdminFormError('');
                              }}
                              placeholder="VD: ctv2@goctho.vn hoặc minhanh"
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#162442] mb-1">
                              Mật khẩu
                            </label>
                            <input
                              type="text"
                              required
                              value={newAdminPassword}
                              onChange={(e) => {
                                setNewAdminPassword(e.target.value);
                                if (adminFormError) setAdminFormError('');
                              }}
                              placeholder="Tối thiểu 4 ký tự"
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#162442] mb-1">
                              Vai trò phân quyền
                            </label>
                            <select
                              value={newAdminRole}
                              onChange={(e) =>
                                setNewAdminRole(e.target.value as AdminRole)
                              }
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
                            >
                              <option value="Cộng tác viên">
                                Cộng tác viên (Duyệt &amp; cập nhật thợ)
                              </option>
                              <option value="Super Admin">
                                Super Admin (Toàn quyền quản trị)
                              </option>
                              <option value="user">
                                Người dùng (Thành viên bản đồ)
                              </option>
                            </select>
                          </div>

                          {adminFormError && (
                            <p className="text-xs font-semibold text-[#B93818]">
                              {adminFormError}
                            </p>
                          )}

                          <button
                            type="submit"
                            disabled={isCreatingAccount}
                            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] disabled:opacity-70 text-white text-sm font-semibold shadow-sm inline-flex items-center justify-center gap-2"
                          >
                            {isCreatingAccount && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            <span>Tạo tài khoản</span>
                          </button>
                        </form>

                        {/* Nhập danh sách tạo tài khoản hàng loạt từ CSV */}
                        <div className="rounded-2xl bg-[#FDF8F2] border border-[#DFCBB5] p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-[#1B3B82]" />
                            <h3 className="text-sm font-bold text-[#162442]">
                              Nhập hàng loạt tài khoản từ CSV
                            </h3>
                          </div>
                          <p className="text-xs text-[#5C564E] leading-relaxed">
                            Tải file CSV mẫu (gồm các cột:{' '}
                            <strong>Tên hiển thị, Tên đăng nhập / Email, Mật khẩu, Vai trò</strong>) để tạo nhanh nhiều tài khoản{' '}
                            <strong>Super Admin</strong>, <strong>Cộng tác viên</strong> hoặc{' '}
                            <strong>user</strong> cùng lúc.
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => csvAdminInputRef.current?.click()}
                              className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Nhập CSV tài khoản</span>
                            </button>
                            <button
                              type="button"
                              onClick={downloadAdminAccountsCsvTemplate}
                              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DFCBB5] bg-white hover:bg-[#F6EFE6] text-[#162442] text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <Download className="w-3.5 h-3.5 text-[#E86F2C]" />
                              <span>Tải CSV mẫu</span>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-2xl bg-white border border-[#E6D5C3] p-5 space-y-2 text-xs text-[#5C564E]">
                        <div className="flex items-center gap-2 text-[#162442] font-bold">
                          <Shield className="w-4 h-4 text-[#1B3B82]" />
                          <span>Giới hạn phân quyền Cộng tác viên</span>
                        </div>
                        <p className="leading-relaxed">
                          Tài khoản vai trò <strong>Cộng tác viên</strong> có thể duyệt đề xuất, cập nhật hồ sơ cô chú thợ, duyệt lưu bút và xử lý báo cáo tình trạng, nhưng không có quyền tạo mới, chỉnh sửa vai trò, đặt lại mật khẩu hay xóa tài khoản người khác.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* =====================================================
                TAB QUẢN LÝ BẢN TIN (CẢ Super Admin & Cộng tác viên)
               ===================================================== */}
            {activeTab === 'articles' && (
              <AdminArticlesTab
                currentAdmin={currentAdmin}
                articles={articles}
                artisans={artisans}
                isSupabaseMode={isSupabaseMode}
                isSeedingArticles={isSeedingArticles}
                onSaveArticle={onSaveArticle}
                onToggleArticleStatus={onToggleArticleStatus}
                onDeleteArticle={onDeleteArticle}
                onSeedInitialArticles={onSeedInitialArticles}
              />
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162442]/55 backdrop-blur-xs"
          onClick={() => setQuickViewArtisan(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-[#E6D5C3] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6D5C3] bg-[#FDF8F2]">
              <h3
                id="quick-view-dup-title"
                className="text-sm font-bold text-[#162442]"
              >
                Đối chiếu hồ sơ đã có trên bản đồ
              </h3>
              <button
                type="button"
                onClick={() => setQuickViewArtisan(null)}
                aria-label="Đóng"
                className="w-8 h-8 rounded-lg text-[#5C564E] hover:bg-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs text-[#5C564E]">
              <div>
                <p className="text-base font-bold text-[#162442]">
                  {quickViewArtisan.name}
                </p>
                <p className="text-[#1B3B82] font-semibold mt-0.5">
                  {quickViewArtisan.categories.join(' · ')} ·{' '}
                  {quickViewArtisan.district}
                </p>
              </div>
              <p>
                <strong className="text-[#162442]">Mốc góc phố:</strong>{' '}
                {quickViewArtisan.addressLandmark}
              </p>
              <p className="tabular-nums">
                <strong className="text-[#162442]">Tọa độ GPS:</strong>{' '}
                {quickViewArtisan.coordinates.lat.toFixed(5)},{' '}
                {quickViewArtisan.coordinates.lng.toFixed(5)}
              </p>
              <p>
                <strong className="text-[#162442]">Giờ hoạt động:</strong>{' '}
                {quickViewArtisan.hours} · {quickViewArtisan.minPriceLabel}
              </p>
              <p>
                <strong className="text-[#162442]">Người phụ trách (PIC):</strong>{' '}
                {quickViewArtisan.pic || 'Chưa phân công'}
              </p>
              {quickViewArtisan.internalNotes && (
                <p className="rounded-xl bg-[#FDF8F2] border border-[#E6D5C3] p-2.5">
                  <strong className="text-[#162442]">Ghi chú nội bộ:</strong>{' '}
                  {quickViewArtisan.internalNotes}
                </p>
              )}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setQuickViewArtisan(null)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E86F2C] text-white text-xs font-semibold"
                >
                  Đã đối chiếu xong
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa tài khoản (Super Admin) */}
      {isSuperAdmin && editingAccount && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-account-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162442]/55 backdrop-blur-xs"
          onClick={() => setEditingAccount(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-[#E6D5C3] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6D5C3] bg-[#FDF8F2]">
              <h3
                id="edit-account-title"
                className="text-sm font-bold text-[#162442]"
              >
                Chỉnh sửa tài khoản
              </h3>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                aria-label="Đóng"
                className="w-8 h-8 rounded-lg text-[#5C564E] hover:bg-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAccountEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#162442] mb-1">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => {
                    setEditDisplayName(e.target.value);
                    if (editAccountError) setEditAccountError('');
                  }}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#162442] mb-1">
                  Tên đăng nhập / Email
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => {
                    setEditUsername(e.target.value.replace(/\s+/g, ''));
                    if (editAccountError) setEditAccountError('');
                  }}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#162442] mb-1">
                  Vai trò phân quyền
                </label>
                <select
                  value={editRole}
                  disabled={editingAccount.id === currentAdmin.id}
                  onChange={(e) => setEditRole(e.target.value as AdminRole)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm disabled:opacity-60 focus:bg-white focus:outline-none focus:border-[#E86F2C]"
                >
                  <option value="user">Người dùng (Thành viên bản đồ)</option>
                  <option value="Cộng tác viên">
                    Cộng tác viên (Duyệt &amp; cập nhật thợ)
                  </option>
                  <option value="Super Admin">
                    Super Admin (Toàn quyền quản trị)
                  </option>
                </select>
                {editingAccount.id === currentAdmin.id && (
                  <p className="text-[11px] text-[#8A8177] mt-1">
                    Không thể hạ quyền của chính tài khoản Super Admin đang đăng nhập.
                  </p>
                )}
              </div>

              {editAccountError && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-[#B93818]"
                >
                  {editAccountError}
                </p>
              )}

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-[#DFCBB5] bg-white text-xs font-semibold text-[#5C564E]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingAccountEdit}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] disabled:opacity-70 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isSavingAccountEdit && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đặt lại mật khẩu (Super Admin) */}
      {isSuperAdmin && resetPwdAccount && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-pwd-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162442]/55 backdrop-blur-xs"
          onClick={() => setResetPwdAccount(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-[#E6D5C3] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6D5C3] bg-[#FDF8F2]">
              <h3
                id="reset-pwd-title"
                className="text-sm font-bold text-[#162442] inline-flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-[#1B3B82]" />
                <span>Đặt lại mật khẩu</span>
              </h3>
              <button
                type="button"
                onClick={() => setResetPwdAccount(null)}
                aria-label="Đóng"
                className="w-8 h-8 rounded-lg text-[#5C564E] hover:bg-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={handleConfirmResetPassword}
              className="p-5 space-y-4"
            >
              <p className="text-xs text-[#5C564E] leading-relaxed">
                Đặt mật khẩu mới cho tài khoản{' '}
                <strong className="text-[#162442]">
                  {resetPwdAccount.displayName || resetPwdAccount.name}
                </strong>{' '}
                (@{resetPwdAccount.username || resetPwdAccount.email}).
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#162442] mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nextResetPassword}
                  onChange={(e) => {
                    setNextResetPassword(e.target.value);
                    if (resetPwdError) setResetPwdError('');
                  }}
                  placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#1B3B82]"
                />
              </div>

              {resetPwdError && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-[#B93818]"
                >
                  {resetPwdError}
                </p>
              )}

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPwdAccount(null)}
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-[#DFCBB5] bg-white text-xs font-semibold text-[#5C564E]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isResettingPwd}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] disabled:opacity-70 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isResettingPwd && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Cập nhật mật khẩu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa tài khoản (Super Admin — không cho xóa tài khoản đang đăng nhập) */}
      {isSuperAdmin && deletingAccount && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162442]/55 backdrop-blur-xs"
          onClick={() => setDeletingAccount(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-[#E6D5C3] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#B93818]/12 text-[#B93818] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <div className="space-y-1">
                  <h3
                    id="delete-account-title"
                    className="text-sm font-bold text-[#162442]"
                  >
                    Xác nhận xóa tài khoản?
                  </h3>
                  <p className="text-xs text-[#5C564E] leading-relaxed">
                    Bạn sắp xóa vĩnh viễn tài khoản{' '}
                    <strong className="text-[#162442]">
                      {deletingAccount.displayName || deletingAccount.name}
                    </strong>{' '}
                    (@{deletingAccount.username || deletingAccount.email} ·{' '}
                    {getRoleDisplayLabel(deletingAccount.role)}). Thao tác này không thể hoàn tác.
                  </p>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingAccount(null)}
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-[#DFCBB5] bg-white text-xs font-semibold text-[#5C564E]"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={() => void handleConfirmDeleteAccount()}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#B93818] hover:bg-[#992C12] disabled:opacity-70 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isDeletingAccount && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Xóa vĩnh viễn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
