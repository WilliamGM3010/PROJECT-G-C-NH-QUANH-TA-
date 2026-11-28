import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  List,
  Loader2,
  LogIn,
  LogOut,
  Map as MapIcon,
  MapPin,
  Navigation,
  Recycle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  WifiOff,
  X,
} from 'lucide-react';
import { INITIAL_ARTICLES } from './data/articles';
import {
  CRAFT_CATEGORIES,
  DEFAULT_REVIVED_ITEMS_COUNT,
  DEFAULT_USER_CONTRIBUTION,
  DISTRICTS,
  FALLBACK_NEARBY_LOCATION,
  INITIAL_ADMIN_ACCOUNTS,
  INITIAL_ARTISANS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PENDING_SUGGESTIONS,
  INITIAL_STATUS_REPORTS,
  INITIAL_THANK_YOU_NOTES,
  QUICK_PROBLEM_CHIPS,
} from './data/artisans';
import type {
  AdminAccount,
  AdminRole,
  AppBackupPayload,
  AppTab,
  Article,
  ArticleStatus,
  Artisan,
  ArtisanStatus,
  AuditCategory,
  AuditLogEntry,
  CraftCategory,
  District,
  GpsPermissionStatus,
  KudosKey,
  PendingSuggestion,
  RouteInfo,
  StatusReport,
  StoredAuthSession,
  ThankYouNote,
  TravelMode,
  UserContributionStats,
  UserLocation,
} from './types/artisan';
import {
  buildArtisanDeepLink,
  buildGoogleMapsDirectionsUrl,
  calculateDistanceKm,
  fetchStreetRoute,
  formatDistanceWithPrefix,
  normalizeVietnamese,
} from './utils/geo';
import {
  canAccessAdminDashboard,
  formatVietnamDate,
  formatVietnamTimestamp,
  getRoleDisplayLabel,
  isSuperAdminRole,
  loadFromStorage,
  normalizeAccountRole,
  saveToStorage,
  STORAGE_KEYS,
  toIsoDate,
} from './utils/storage';
import {
  buildRouteUrl,
  getDocumentTitleForRoute,
  matchArticleByRouteKey,
  parseAppRoute,
  type ParsedAppRoute,
} from './utils/routing';
import {
  authenticateUserDb,
  bulkInsertAdminAccountsDb,
  bulkUpsertArticlesDb,
  bulkUpsertArtisansDb,
  deleteAdminAccountDb,
  deleteArticleDb,
  deleteArtisanDb,
  fetchAccountByIdDb,
  fetchAdminAccountsDb,
  fetchAllArticlesForAdminDb,
  fetchAllArtisansForAdmin,
  fetchApprovedArtisans,
  fetchPublishedArticlesDb,
  fetchStatusReportsDb,
  fetchUserSubmittedArtisansDb,
  formatSupabaseError,
  insertAdminAccountDb,
  insertPendingArtisanDb,
  insertStatusReportDb,
  registerUserDb,
  resetAccountPasswordDb,
  resolveStatusReportDb,
  updateAccountByAdminDb,
  updateAccountProfileDb,
  updateArticleStatusDb,
  updateArtisanFieldsDb,
  upsertApprovedArtisanDb,
  upsertArticleDb,
  type UserContributionItem,
} from './services/supabaseService';
import { isSupabaseConfigured, supabaseConfigWarning } from './supabaseClient';
import { AboutView } from './components/AboutView';
import { AdminDashboard } from './components/AdminDashboard';
import { ArtisanCard, getStatusDisplay } from './components/ArtisanCard';
import { ArtisanDetail } from './components/ArtisanDetail';
import { ArtisanIllustration } from './components/ArtisanIllustration';
import { ArtisanMap } from './components/ArtisanMap';
import { AuthModal, DEFAULT_SOFT_AUTH_PROMPT } from './components/AuthModal';
import { BadgeModal, evaluateUserBadges } from './components/BadgeModal';
import { HomeDiscoveryView } from './components/HomeDiscoveryView';
import { QrDirectionsModal, StatusReportModal } from './components/Modals';
import {
  AccountMenuDropdown,
  DesktopNavbar,
  MobileBottomNav,
  MobileTopHeader,
} from './components/Navbar';
import { NewsView } from './components/NewsView';
import { SiteFooter } from './components/SiteFooter';
import { SuggestArtisanView } from './components/SuggestArtisanView';
import {
  ContributionHistoryModal,
  SavedArtisansModal,
} from './components/UserAccountModals';

function copyTextFallback(text: string): boolean {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function App() {
  const initialRouteRef = useRef<ParsedAppRoute | null>(null);
  if (initialRouteRef.current === null) {
    initialRouteRef.current =
      typeof window !== 'undefined'
        ? parseAppRoute(window.location.pathname, window.location.search)
        : parseAppRoute('/', '');
  }
  const initialRoute = initialRouteRef.current;

  const [activeTab, setActiveTab] = useState<AppTab>(initialRoute.tab);
  const [readingArticleKey, setReadingArticleKey] = useState<string | null>(
    initialRoute.articleKey
  );
  const pageScrollRef = useRef<HTMLDivElement | null>(null);

  // 3 bảng cốt lõi đồng bộ với Supabase (fallback dữ liệu mẫu trong bộ nhớ nếu chưa cấu hình biến môi trường)
  const [artisans, setArtisans] = useState<Artisan[]>(() =>
    isSupabaseConfigured ? [] : INITIAL_ARTISANS
  );
  const [pendingSuggestions, setPendingSuggestions] = useState<
    PendingSuggestion[]
  >(() => (isSupabaseConfigured ? [] : INITIAL_PENDING_SUGGESTIONS));
  const [statusReports, setStatusReports] = useState<StatusReport[]>(() =>
    isSupabaseConfigured ? [] : INITIAL_STATUS_REPORTS
  );
  const [articles, setArticles] = useState<Article[]>(() =>
    isSupabaseConfigured ? [] : INITIAL_ARTICLES
  );
  const [isLoadingArticles, setIsLoadingArticles] = useState<boolean>(false);
  const [articlesDbError, setArticlesDbError] = useState<string | null>(null);
  const [isSeedingArticles, setIsSeedingArticles] = useState<boolean>(false);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>(() => {
    if (isSupabaseConfigured) return [];
    const stored = loadFromStorage<AdminAccount[]>(
      STORAGE_KEYS.ADMINS,
      INITIAL_ADMIN_ACCOUNTS
    );
    return stored.map((acc) => ({
      ...acc,
      displayName: acc.displayName || acc.name,
      username: acc.username || acc.email,
      role: normalizeAccountRole(acc.role),
      revivedCount: acc.revivedCount ?? 0,
      badges: Array.isArray(acc.badges) ? acc.badges : [],
      favoriteArtisanIds: Array.isArray(acc.favoriteArtisanIds)
        ? acc.favoriteArtisanIds
        : [],
    }));
  });

  // Trạng thái tải dữ liệu, lỗi mạng & cấu hình Supabase
  const [isLoadingPublicData, setIsLoadingPublicData] = useState<boolean>(
    isSupabaseConfigured
  );
  const [publicDbError, setPublicDbError] = useState<string | null>(null);
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(false);
  const [adminDbError, setAdminDbError] = useState<string | null>(null);
  const [isSeedingDb, setIsSeedingDb] = useState(false);
  const [dbTotalArtisansCount, setDbTotalArtisansCount] = useState<
    number | null
  >(null);
  const [dismissedConfigWarning, setDismissedConfigWarning] = useState(false);

  // Dữ liệu cộng đồng phụ trợ & tùy chọn cá nhân trên thiết bị
  const [thankYouNotes, setThankYouNotes] = useState<ThankYouNote[]>(() =>
    loadFromStorage<ThankYouNote[]>(
      STORAGE_KEYS.THANK_YOU_NOTES,
      INITIAL_THANK_YOU_NOTES
    )
  );

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    loadFromStorage<AuditLogEntry[]>(
      STORAGE_KEYS.AUDIT_LOGS,
      INITIAL_AUDIT_LOGS
    )
  );

  const [revivedCount, setRevivedCount] = useState<number>(() =>
    loadFromStorage<number>(
      STORAGE_KEYS.REVIVED_COUNT,
      DEFAULT_REVIVED_ITEMS_COUNT
    )
  );

  const [kudosReactedMap, setKudosReactedMap] = useState<
    Record<string, KudosKey[]>
  >(() =>
    loadFromStorage<Record<string, KudosKey[]>>(STORAGE_KEYS.KUDOS_REACTED, {})
  );

  const [userContribution, setUserContribution] =
    useState<UserContributionStats>(() =>
      loadFromStorage<UserContributionStats>(
        STORAGE_KEYS.USER_CONTRIBUTION,
        DEFAULT_USER_CONTRIBUTION
      )
    );

  // Lưu các trạng thái phụ trợ & tùy chọn cá nhân của trình duyệt
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.THANK_YOU_NOTES, thankYouNotes);
  }, [thankYouNotes]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.REVIVED_COUNT, revivedCount);
  }, [revivedCount]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.KUDOS_REACTED, kudosReactedMap);
  }, [kudosReactedMap]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.USER_CONTRIBUTION, userContribution);
  }, [userContribution]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      saveToStorage(STORAGE_KEYS.ADMINS, adminAccounts);
    }
  }, [adminAccounts]);

  // Hệ thống tài khoản mở tự do cho khách (Guest-first) + Soft Auth Modal khi tương tác
  const [currentUser, setCurrentUser] = useState<AdminAccount | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(true);
  const [authModalState, setAuthModalState] = useState<{
    open: boolean;
    prompt?: string;
    defaultMode?: 'login' | 'register';
  }>({ open: false });
  const pendingAuthActionRef = useRef<((account: AdminAccount) => void) | null>(
    null
  );
  const [isAdminView, setIsAdminView] = useState<boolean>(initialRoute.isAdmin);
  const adminAuthPromptedRef = useRef<boolean>(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [contributionsModalOpen, setContributionsModalOpen] = useState(false);
  const [userContributions, setUserContributions] = useState<
    UserContributionItem[]
  >([]);
  const [isLoadingContributions, setIsLoadingContributions] = useState(false);

  const openAuthModal = useCallback(
    (
      prompt?: string,
      defaultMode: 'login' | 'register' = 'login',
      onAfterAuth?: (account: AdminAccount) => void
    ) => {
      pendingAuthActionRef.current = onAfterAuth ?? null;
      setAuthModalState({
        open: true,
        prompt: prompt ?? DEFAULT_SOFT_AUTH_PROMPT,
        defaultMode,
      });
    },
    []
  );

  const closeAuthModal = useCallback(() => {
    pendingAuthActionRef.current = null;
    setAuthModalState((prev) => ({ ...prev, open: false }));
  }, []);

  const persistAuthSession = useCallback((account: AdminAccount | null) => {
    try {
      if (!account) {
        window.localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
        return;
      }
      const session: StoredAuthSession = {
        id: account.id,
        username: account.username || account.email,
        displayName: account.displayName || account.name,
        role: normalizeAccountRole(account.role),
      };
      window.localStorage.setItem(
        STORAGE_KEYS.AUTH_SESSION,
        JSON.stringify(session)
      );
    } catch {
      // Bỏ qua lỗi lưu trữ trình duyệt
    }
  }, []);

  // Khôi phục phiên đăng nhập từ localStorage & xác thực lại với Supabase
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const stored = loadFromStorage<StoredAuthSession | null>(
        STORAGE_KEYS.AUTH_SESSION,
        null
      );
      if (!stored || !stored.id) {
        if (!cancelled) setIsRestoringSession(false);
        return;
      }

      if (isSupabaseConfigured) {
        try {
          const fresh = await fetchAccountByIdDb(stored.id);
          if (cancelled) return;
          if (fresh) {
            setCurrentUser(fresh);
            persistAuthSession(fresh);
          } else {
            persistAuthSession(null);
            setCurrentUser(null);
          }
        } catch {
          if (cancelled) return;
          // Nếu tạm mất mạng khi mở lại trang, khôi phục tạm từ phiên không nhạy cảm
          const fallbackUser: AdminAccount = {
            id: stored.id,
            displayName: stored.displayName,
            name: stored.displayName,
            username: stored.username,
            email: stored.username,
            password: '',
            role: normalizeAccountRole(stored.role),
            active: true,
            revivedCount: 0,
            badges: [],
            favoriteArtisanIds: [],
            createdAt: formatVietnamDate(),
          };
          setCurrentUser(fallbackUser);
        } finally {
          if (!cancelled) setIsRestoringSession(false);
        }
        return;
      }

      // Chế độ cục bộ
      const localList = loadFromStorage<AdminAccount[]>(
        STORAGE_KEYS.ADMINS,
        INITIAL_ADMIN_ACCOUNTS
      );
      const matched = localList.find((a) => a.id === stored.id && a.active);
      if (!cancelled) {
        if (matched) {
          const normalized: AdminAccount = {
            ...matched,
            displayName: matched.displayName || matched.name,
            username: matched.username || matched.email,
            role: normalizeAccountRole(matched.role),
            revivedCount: matched.revivedCount ?? 0,
            badges: Array.isArray(matched.badges) ? matched.badges : [],
            favoriteArtisanIds: Array.isArray(matched.favoriteArtisanIds)
              ? matched.favoriteArtisanIds
              : [],
          };
          setCurrentUser(normalized);
          persistAuthSession(normalized);
        } else {
          persistAuthSession(null);
        }
        setIsRestoringSession(false);
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, [persistAuthSession]);

  // Kết hợp chỉ số đóng góp từ tài khoản Supabase + thao tác trên phiên hiện tại
  const effectiveUserStats = useMemo<UserContributionStats>(() => {
    const displayName =
      currentUser?.displayName ||
      currentUser?.name ||
      userContribution.displayName;
    const revived = Math.max(
      currentUser?.revivedCount ?? 0,
      userContribution.revivedCount
    );
    const suggestions = Math.max(
      userContributions.length,
      userContribution.suggestionsCount
    );
    return {
      ...userContribution,
      displayName,
      revivedCount: revived,
      suggestionsCount: suggestions,
    };
  }, [currentUser, userContribution, userContributions.length]);

  // Đánh giá huy hiệu hiện tại của người dùng (có kết hợp huy hiệu đã đồng bộ trên Supabase)
  const badgeSummary = useMemo(
    () => evaluateUserBadges(effectiveUserStats, currentUser?.badges ?? []),
    [effectiveUserStats, currentUser?.badges]
  );

  // Tìm kiếm & bộ lọc công khai
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    CraftCategory | 'Tất cả'
  >('Tất cả');
  const [selectedDistrict, setSelectedDistrict] = useState<
    District | 'Tất cả khu vực'
  >('Tất cả khu vực');
  const [onlyWorking, setOnlyWorking] = useState(false);
  const [sortByNearest, setSortByNearest] = useState(false);

  // Tương tác chọn & hover đồng bộ danh sách ↔ bản đồ
  const [selectedArtisanId, setSelectedArtisanId] = useState<string | null>(
    initialRoute.artisanId
  );
  const [hoveredArtisanId, setHoveredArtisanId] = useState<string | null>(null);

  // Mobile UX states
  const [mobileViewMode, setMobileViewMode] = useState<'map' | 'list'>('map');
  const [mobileDetailOpen, setMobileDetailOpen] = useState<boolean>(
    Boolean(initialRoute.artisanId)
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Định vị GPS tự động & lộ trình OSRM
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsPermissionStatus>('locating');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const routeAbortRef = useRef<AbortController | null>(null);

  // Modals & Toast
  const [qrModalArtisan, setQrModalArtisan] = useState<Artisan | null>(null);
  const [reportModalArtisan, setReportModalArtisan] = useState<Artisan | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Đồng bộ URL sạch bằng Native History API (không cần thư viện ngoài)
  const syncUrlToHistory = useCallback(
    (nextUrl: string, mode: 'push' | 'replace' = 'push') => {
      if (typeof window === 'undefined') return;
      const current = `${window.location.pathname}${window.location.search}`;
      if (current === nextUrl) return;
      if (mode === 'replace') {
        window.history.replaceState({}, '', nextUrl);
      } else {
        window.history.pushState({}, '', nextUrl);
      }
    },
    []
  );

  const scrollPageToTop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.requestAnimationFrame(() => {
      pageScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, []);

  // Chuẩn hóa đường dẫn lạ hoặc link cũ (?tho=...) ngay khi mới mở trang
  useEffect(() => {
    if (initialRoute.shouldCanonicalize) {
      syncUrlToHistory(initialRoute.canonicalUrl, 'replace');
    }
  }, [initialRoute, syncUrlToHistory]);

  // Lắng nghe nút Back / Forward của trình duyệt và điện thoại (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseAppRoute(
        window.location.pathname,
        window.location.search
      );
      if (parsed.shouldCanonicalize) {
        window.history.replaceState({}, '', parsed.canonicalUrl);
      }
      setIsAdminView(parsed.isAdmin);
      setActiveTab(parsed.tab);
      setSelectedArtisanId(parsed.artisanId);
      setReadingArticleKey(parsed.articleKey);

      if (parsed.tab === 'explore') {
        setMobileViewMode('map');
        setMobileDetailOpen(Boolean(parsed.artisanId));
      } else if (!parsed.isAdmin) {
        scrollPageToTop();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [scrollPageToTop]);

  // Tự mở hộp thoại đăng nhập gọn gàng 1 lần khi truy cập thẳng /quan-tri mà chưa đăng nhập
  useEffect(() => {
    if (!isAdminView) {
      adminAuthPromptedRef.current = false;
      return;
    }
    if (!isRestoringSession && !currentUser && !adminAuthPromptedRef.current) {
      adminAuthPromptedRef.current = true;
      openAuthModal(
        'Vui lòng đăng nhập bằng tài khoản Quản trị viên hoặc Cộng tác viên để truy cập trang Quản trị.',
        'login'
      );
    }
  }, [isAdminView, isRestoringSession, currentUser, openAuthModal]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  }, []);

  // Helper ghi Nhật ký hoạt động (Audit Log) tự động
  const appendAuditLog = useCallback(
    (action: string, category: AuditCategory, actorOverride?: AdminAccount) => {
      const actor = actorOverride ?? currentUser;
      if (!actor) return;
      const entry: AuditLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: formatVietnamTimestamp(),
        actorName: actor.displayName || actor.name,
        actorEmail: actor.username || actor.email,
        action,
        category,
      };
      setAuditLogs((prev) => [entry, ...prev].slice(0, 300));
    },
    [currentUser]
  );

  // Helper đồng bộ chỉ số cá nhân (revived_count, badges) lên Supabase & báo chúc mừng khi mở huy hiệu mới
  const recordUserContribution = useCallback(
    (
      field: 'suggestionsCount' | 'reportsCount' | 'revivedCount' | 'thanksCount',
      defaultToast: string,
      actorOverride?: AdminAccount | null
    ) => {
      const activeAccount = actorOverride ?? currentUser;
      const existingBadges = activeAccount?.badges ?? [];
      const prevEval = evaluateUserBadges(effectiveUserStats, existingBadges);
      const nextStats: UserContributionStats = {
        ...effectiveUserStats,
        [field]: effectiveUserStats[field] + 1,
      };
      const nextEval = evaluateUserBadges(nextStats, existingBadges);
      const mergedBadgeIds = Array.from(
        new Set([
          ...existingBadges,
          ...nextEval.tiers.filter((t) => t.unlocked).map((t) => t.id),
        ])
      );

      setUserContribution((prev) => ({
        ...prev,
        displayName:
          activeAccount?.displayName || activeAccount?.name || prev.displayName,
        [field]: prev[field] + 1,
      }));

      if (activeAccount) {
        const nextUserRevived =
          field === 'revivedCount'
            ? (activeAccount.revivedCount ?? 0) + 1
            : activeAccount.revivedCount ?? 0;

        const updatedUser: AdminAccount = {
          ...activeAccount,
          revivedCount: nextUserRevived,
          badges: mergedBadgeIds,
        };
        setCurrentUser(updatedUser);
        setAdminAccounts((prev) =>
          prev.map((a) => (a.id === updatedUser.id ? updatedUser : a))
        );

        if (isSupabaseConfigured) {
          void updateAccountProfileDb(activeAccount.id, {
            revivedCount: nextUserRevived,
            badges: mergedBadgeIds,
          }).catch(() => {
            // Bỏ qua lỗi đồng bộ nền để không gián đoạn trải nghiệm
          });
        }
      }

      if (
        nextEval.highestUnlocked &&
        nextEval.highestUnlocked.id !== prevEval.highestUnlocked?.id
      ) {
        showToast(
          `🎉 Chúc mừng! Bạn vừa mở khóa huy hiệu "${nextEval.highestUnlocked.title}" — mở menu tài khoản để tải thẻ Story 9:16 nhé!`
        );
      } else {
        showToast(defaultToast);
      }
    },
    [currentUser, effectiveUserStats, showToast]
  );

  // Tải lịch sử đóng góp của tài khoản hiện tại (cả Chờ duyệt & Đã lên bản đồ)
  const loadUserContributions = useCallback(
    async (targetUser?: AdminAccount | null) => {
      const user = targetUser ?? currentUser;
      if (!user) {
        setUserContributions([]);
        return;
      }

      if (isSupabaseConfigured) {
        setIsLoadingContributions(true);
        try {
          const rows = await fetchUserSubmittedArtisansDb(user);
          setUserContributions(rows);
        } catch {
          // Giữ danh sách hiện có nếu lỗi mạng tạm thời
        } finally {
          setIsLoadingContributions(false);
        }
        return;
      }

      const idSet = new Set(
        [user.username, user.id, user.email]
          .map((v) => String(v ?? '').trim().toLowerCase())
          .filter(Boolean)
      );
      const pendingItems: UserContributionItem[] = pendingSuggestions
        .filter((p) => idSet.has(p.submittedBy.trim().toLowerCase()))
        .map((p) => ({
          id: p.id,
          name: p.name,
          district: p.district,
          categories: p.categories,
          addressLandmark: p.addressLandmark,
          submittedAt: p.submittedAt,
          approvalStatus: 'pending',
        }));
      const approvedItems: UserContributionItem[] = artisans
        .filter(
          (a) =>
            a.submittedBy && idSet.has(a.submittedBy.trim().toLowerCase())
        )
        .map((a) => ({
          id: a.id,
          name: a.name,
          district: a.district,
          categories: a.categories,
          addressLandmark: a.addressLandmark,
          submittedAt: a.submittedAt ?? a.verifiedDate,
          approvalStatus: 'approved',
        }));
      setUserContributions([...pendingItems, ...approvedItems]);
    },
    [currentUser, artisans, pendingSuggestions]
  );

  // Tải danh sách cô chú thợ đã duyệt (approval_status = 'approved') cho trang bản đồ công khai
  const loadPublicArtisans = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingPublicData(true);
    setPublicDbError(null);
    try {
      const approved = await fetchApprovedArtisans();
      setArtisans(approved);
      const dbRevivedSum = approved.reduce(
        (sum, item) => sum + (item.revivedCount ?? 0),
        0
      );
      if (dbRevivedSum > 0) {
        setRevivedCount(dbRevivedSum);
      }
    } catch (err) {
      setPublicDbError(formatSupabaseError(err));
    } finally {
      setIsLoadingPublicData(false);
    }
  }, []);

  // Tải danh sách bài viết đã xuất bản cho trang Bản tin công khai
  const loadPublicArticles = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingArticles(true);
    setArticlesDbError(null);
    try {
      const published = await fetchPublishedArticlesDb();
      setArticles(published);
    } catch (err) {
      setArticlesDbError(formatSupabaseError(err));
    } finally {
      setIsLoadingArticles(false);
    }
  }, []);

  // Tải toàn bộ bảng từ Supabase cho Khu Quản Trị (gồm cả articles)
  const loadAdminData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingAdminData(true);
    setAdminDbError(null);
    try {
      const [artisanBundle, reports, accounts, allArticles] = await Promise.all([
        fetchAllArtisansForAdmin(),
        fetchStatusReportsDb(),
        fetchAdminAccountsDb(),
        fetchAllArticlesForAdminDb().catch((err) => {
          setArticlesDbError(formatSupabaseError(err));
          return null;
        }),
      ]);
      setArtisans(artisanBundle.approved);
      setPendingSuggestions(artisanBundle.pending);
      setDbTotalArtisansCount(artisanBundle.totalCount);
      setStatusReports(reports);
      setAdminAccounts(accounts);
      if (allArticles !== null) {
        setArticles(allArticles);
        setArticlesDbError(null);
      }

      // Đồng bộ lại thông tin & vai trò mới nhất của chính tài khoản đang đăng nhập
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const freshSelf = accounts.find((a) => a.id === prev.id);
        if (!freshSelf) return prev;
        persistAuthSession(freshSelf);
        return freshSelf;
      });

      const dbRevivedSum = artisanBundle.approved.reduce(
        (sum, item) => sum + (item.revivedCount ?? 0),
        0
      );
      if (dbRevivedSum > 0) {
        setRevivedCount(dbRevivedSum);
      }
    } catch (err) {
      setAdminDbError(formatSupabaseError(err));
    } finally {
      setIsLoadingAdminData(false);
    }
  }, [persistAuthSession]);

  // Tự động tải dữ liệu công khai (cô chú thợ & Bản tin) ngay khi mở app — không cần đăng nhập
  useEffect(() => {
    if (isSupabaseConfigured) {
      void loadPublicArtisans();
      void loadPublicArticles();
    }
  }, [loadPublicArtisans, loadPublicArticles]);

  // Chỉ tải lịch sử đóng góp khi đã có tài khoản đăng nhập
  useEffect(() => {
    if (!currentUser) {
      setUserContributions([]);
      return;
    }
    void loadUserContributions(currentUser);
  }, [currentUser?.id]);

  // Cập nhật lịch sử đóng góp ở chế độ cục bộ khi danh sách thay đổi
  useEffect(() => {
    if (!isSupabaseConfigured && currentUser) {
      void loadUserContributions(currentUser);
    }
  }, [artisans, pendingSuggestions, currentUser, loadUserContributions]);

  // Khi mở Khu Quản Trị -> tải đầy đủ 3 bảng từ Supabase (cho cả Super Admin và Cộng tác viên)
  useEffect(() => {
    if (
      isAdminView &&
      currentUser &&
      canAccessAdminDashboard(currentUser.role) &&
      isSupabaseConfigured
    ) {
      void loadAdminData();
    }
  }, [isAdminView, currentUser?.id, currentUser?.role, loadAdminData]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      routeAbortRef.current?.abort();
    };
  }, []);

  // Chỉ hiển thị cô chú chưa bị ẩn trên bản đồ công khai
  const publicArtisans = useMemo(
    () => artisans.filter((a) => !a.isHidden),
    [artisans]
  );

  // Bài viết đang đọc (khớp theo ID hoặc slug từ URL /ban-tin/<id>)
  const activeReadingArticle = useMemo(
    () =>
      matchArticleByRouteKey(
        articles.filter((a) => a.status === 'published'),
        readingArticleKey
      ),
    [articles, readingArticleKey]
  );

  // Lọc & sắp xếp danh sách người thợ công khai
  const filteredArtisans = useMemo(() => {
    const queryNorm = normalizeVietnamese(searchQuery);

    const matched = publicArtisans.filter((artisan) => {
      if (
        selectedCategory !== 'Tất cả' &&
        !artisan.categories.includes(selectedCategory)
      ) {
        return false;
      }

      if (
        selectedDistrict !== 'Tất cả khu vực' &&
        artisan.district !== selectedDistrict
      ) {
        return false;
      }

      if (onlyWorking && artisan.status !== 'working') {
        return false;
      }

      if (queryNorm.length > 0) {
        const haystack = normalizeVietnamese(
          [
            artisan.name,
            artisan.district,
            artisan.addressLandmark,
            artisan.paymentMethod,
            artisan.parkingInfo,
            ...artisan.categories,
            ...artisan.problems,
            ...artisan.prices.map((p) => p.service),
          ].join(' ')
        );
        return haystack.includes(queryNorm);
      }

      return true;
    });

    if (userLocation && sortByNearest) {
      return [...matched].sort(
        (a, b) =>
          calculateDistanceKm(userLocation.coords, a.coordinates) -
          calculateDistanceKm(userLocation.coords, b.coordinates)
      );
    }

    return matched;
  }, [
    publicArtisans,
    searchQuery,
    selectedCategory,
    selectedDistrict,
    onlyWorking,
    userLocation,
    sortByNearest,
  ]);

  const selectedArtisan = useMemo(
    () => publicArtisans.find((a) => a.id === selectedArtisanId) ?? null,
    [publicArtisans, selectedArtisanId]
  );

  // Tự động cập nhật tiêu đề tab trình duyệt (document.title) theo từng trang
  useEffect(() => {
    document.title = getDocumentTitleForRoute({
      isAdmin: isAdminView,
      tab: activeTab,
      selectedArtisanName: selectedArtisan?.name ?? null,
      activeArticleTitle: activeReadingArticle?.title ?? null,
    });
  }, [
    isAdminView,
    activeTab,
    selectedArtisan?.name,
    activeReadingArticle?.title,
  ]);

  const selectedArtisanApprovedThanks = useMemo(
    () =>
      selectedArtisan
        ? thankYouNotes.filter(
            (n) => n.artisanId === selectedArtisan.id && n.approved
          )
        : [],
    [selectedArtisan, thankYouNotes]
  );

  const getDistanceForArtisan = useCallback(
    (artisan: Artisan): number | null => {
      if (!userLocation) return null;
      return calculateDistanceKm(userLocation.coords, artisan.coordinates);
    },
    [userLocation]
  );

  // Tính và vẽ tuyến đường OSRM
  const computeRouteToArtisan = useCallback(
    async (origin: UserLocation, artisan: Artisan, mode: TravelMode) => {
      routeAbortRef.current?.abort();
      const controller = new AbortController();
      routeAbortRef.current = controller;

      setIsRouting(true);
      const result = await fetchStreetRoute(
        origin.coords,
        artisan.coordinates,
        mode,
        controller.signal
      );

      if (controller.signal.aborted) return;

      setRouteInfo({
        artisanId: artisan.id,
        travelMode: mode,
        coordinates: result.coordinates,
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
        isFallback: result.isFallback,
      });
      setIsRouting(false);
    },
    []
  );

  const applyFallbackLocation = useCallback(
    (customToast?: string): UserLocation => {
      const fallbackLoc: UserLocation = {
        coords: FALLBACK_NEARBY_LOCATION,
        source: 'demo',
        label: 'Khu vực Bình Thạnh / Quận 1 (mặc định)',
      };
      setUserLocation(fallbackLoc);
      setGpsError(null);
      showToast(
        customToast ??
          'Không lấy được GPS — tạm dùng mốc Bình Thạnh / Quận 1 để tính khoảng cách cho bạn nhé!'
      );
      return fallbackLoc;
    },
    [showToast]
  );

  // Tự động xin tọa độ GPS ngay khi mở trang để sắp xếp cô chú gần nhất (không ép fallback ảo)
  const requestAutoGps = useCallback(
    (interactive = false) => {
      if (!('geolocation' in navigator)) {
        setGpsStatus('unsupported');
        if (interactive) {
          showToast(
            'Trình duyệt chưa hỗ trợ GPS — bạn có thể chọn quận để tìm cô chú gần nhất.'
          );
        }
        return;
      }

      setGpsStatus('locating');
      setIsLocating(true);
      setGpsError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: UserLocation = {
            coords: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
            source: 'gps',
            label: 'Vị trí GPS của bạn',
          };
          setUserLocation(loc);
          setGpsStatus('granted');
          setSortByNearest(true);
          setIsLocating(false);
          setGpsError(null);
          if (interactive) {
            showToast('Đã định vị — tự động sắp xếp cô chú gần bạn nhất!');
          }
        },
        () => {
          setIsLocating(false);
          setGpsStatus('denied');
          if (interactive) {
            showToast(
              'Chưa bật quyền GPS — bạn hãy chọn quận ở ngay bên dưới để tìm gần nhất nhé.'
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000,
        }
      );
    },
    [showToast]
  );

  useEffect(() => {
    requestAutoGps(false);
  }, [requestAutoGps]);

  const locateUser = useCallback(
    (options?: {
      autoFallback?: boolean;
      onLocated?: (loc: UserLocation) => void;
    }) => {
      setGpsError(null);

      if (!('geolocation' in navigator)) {
        setGpsStatus('unsupported');
        if (options?.autoFallback) {
          const fallbackLoc = applyFallbackLocation(
            'Trình duyệt chưa hỗ trợ GPS — tạm dùng mốc Bình Thạnh / Quận 1 để xếp thợ gần nhất!'
          );
          options.onLocated?.(fallbackLoc);
          return;
        }
        setGpsError(
          'Trình duyệt chưa hỗ trợ GPS. Bạn có thể dùng mốc Bình Thạnh / Quận 1 để xem khoảng cách.'
        );
        showToast(
          'Trình duyệt không hỗ trợ GPS — bấm "Dùng mốc trung tâm" để xem lộ trình.'
        );
        return;
      }

      setIsLocating(true);
      setGpsStatus('locating');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: UserLocation = {
            coords: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
            source: 'gps',
            label: 'Vị trí GPS của bạn',
          };
          setUserLocation(loc);
          setGpsStatus('granted');
          setIsLocating(false);
          setGpsError(null);
          showToast('Đã xác định vị trí GPS và sắp xếp cô chú gần bạn nhất!');
          options?.onLocated?.(loc);
        },
        () => {
          setIsLocating(false);
          setGpsStatus('denied');
          if (options?.autoFallback) {
            const fallbackLoc = applyFallbackLocation();
            options.onLocated?.(fallbackLoc);
            return;
          }
          setGpsError(
            'Chưa thể lấy tín hiệu GPS (hoặc trình duyệt đang chặn quyền vị trí).'
          );
          showToast(
            'Không lấy được GPS — bạn có thể dùng mốc Bình Thạnh / Quận 1 trên bản đồ.'
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000,
        }
      );
    },
    [applyFallbackLocation, showToast]
  );

  const handleToggleSortByNearest = useCallback(() => {
    if (sortByNearest) {
      setSortByNearest(false);
      return;
    }
    setSortByNearest(true);
    if (!userLocation) {
      locateUser({ autoFallback: true });
    } else {
      showToast('Đã sắp xếp danh sách cô chú từ gần nhất đến xa nhất!');
    }
  }, [sortByNearest, userLocation, locateUser, showToast]);

  const handleUseDemoLocation = useCallback(() => {
    const demoLoc = applyFallbackLocation(
      'Đã đặt mốc vị trí tại khu vực Bình Thạnh / Quận 1 để xem khoảng cách & vẽ đường đi.'
    );
    if (selectedArtisan) {
      computeRouteToArtisan(demoLoc, selectedArtisan, travelMode);
    }
  }, [applyFallbackLocation, selectedArtisan, travelMode, computeRouteToArtisan]);

  const handleDrawRouteFromDetail = useCallback(
    (artisan: Artisan, mode: TravelMode = travelMode) => {
      setMobileDetailOpen(false);
      setMobileViewMode('map');

      if (userLocation) {
        computeRouteToArtisan(userLocation, artisan, mode);
        return;
      }

      locateUser({
        autoFallback: true,
        onLocated: (freshLoc) => {
          computeRouteToArtisan(freshLoc, artisan, mode);
        },
      });
    },
    [userLocation, travelMode, computeRouteToArtisan, locateUser]
  );

  const handleChangeTravelMode = useCallback(
    (nextMode: TravelMode) => {
      setTravelMode(nextMode);
      if (userLocation && selectedArtisan && routeInfo) {
        computeRouteToArtisan(userLocation, selectedArtisan, nextMode);
      }
    },
    [userLocation, selectedArtisan, routeInfo, computeRouteToArtisan]
  );

  const navigateToTab = useCallback(
    (
      tab: AppTab,
      options?: {
        artisanId?: string | null;
        articleKey?: string | null;
        replace?: boolean;
        skipScroll?: boolean;
      }
    ) => {
      const nextArtisanId =
        tab === 'explore' ? (options?.artisanId ?? null) : null;
      const nextArticleKey =
        tab === 'news' ? (options?.articleKey ?? null) : null;

      setIsAdminView(false);
      setActiveTab(tab);
      setSelectedArtisanId(nextArtisanId);
      setReadingArticleKey(nextArticleKey);

      if (tab === 'explore') {
        setMobileViewMode('map');
        setMobileDetailOpen(Boolean(nextArtisanId));
      }

      const targetUrl = buildRouteUrl({
        isAdmin: false,
        tab,
        artisanId: nextArtisanId,
        articleKey: nextArticleKey,
      });
      syncUrlToHistory(targetUrl, options?.replace ? 'replace' : 'push');

      if (tab !== 'explore' && !options?.skipScroll) {
        scrollPageToTop();
      }
    },
    [syncUrlToHistory, scrollPageToTop]
  );

  const handleSelectArtisanFromList = useCallback(
    (artisan: Artisan) => {
      setSelectedArtisanId(artisan.id);
      setRouteInfo((prev) => (prev?.artisanId === artisan.id ? prev : null));
      setMobileDetailOpen(true);
      syncUrlToHistory(
        buildRouteUrl({ tab: 'explore', artisanId: artisan.id }),
        'push'
      );
    },
    [syncUrlToHistory]
  );

  const handleSelectArtisanFromMap = useCallback(
    (artisan: Artisan) => {
      setSelectedArtisanId(artisan.id);
      setRouteInfo((prev) => (prev?.artisanId === artisan.id ? prev : null));
      setMobileDetailOpen(false);
      syncUrlToHistory(
        buildRouteUrl({ tab: 'explore', artisanId: artisan.id }),
        'push'
      );
    },
    [syncUrlToHistory]
  );

  const handleCloseSelectedArtisan = useCallback(() => {
    setSelectedArtisanId(null);
    setMobileDetailOpen(false);
    syncUrlToHistory(buildRouteUrl({ tab: 'explore', artisanId: null }), 'push');
  }, [syncUrlToHistory]);

  const handleSelectArtisanFromHome = useCallback(
    (artisan: Artisan) => {
      setRouteInfo((prev) => (prev?.artisanId === artisan.id ? prev : null));
      navigateToTab('explore', { artisanId: artisan.id, skipScroll: true });
    },
    [navigateToTab]
  );

  const handleOpenFullMap = useCallback(() => {
    navigateToTab('explore', { artisanId: null, skipScroll: true });
  }, [navigateToTab]);

  const handleSelectArticle = useCallback(
    (articleId: string | null) => {
      setReadingArticleKey(articleId);
      syncUrlToHistory(
        buildRouteUrl({ tab: 'news', articleKey: articleId }),
        'push'
      );
      scrollPageToTop();
    },
    [syncUrlToHistory, scrollPageToTop]
  );

  const handleNavigateTab = useCallback(
    (tab: AppTab) => {
      if (tab === 'suggest' && !currentUser) {
        openAuthModal(
          'Đăng nhập nhanh trong 5 giây để gợi ý thêm cô chú thợ mới và theo dõi trạng thái duyệt nhé.',
          'login',
          () => navigateToTab('suggest')
        );
        return;
      }
      navigateToTab(tab);
    },
    [currentUser, openAuthModal, navigateToTab]
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Tất cả');
    setSelectedDistrict('Tất cả khu vực');
    setOnlyWorking(false);
    setSortByNearest(false);
  };

  // Chia sẻ nhanh (?tho=ID)
  const handleShareArtisan = useCallback(
    async (artisan: Artisan) => {
      const shareUrl = buildArtisanDeepLink(artisan.id);
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          copied = true;
        } catch {
          copied = copyTextFallback(shareUrl);
        }
      } else {
        copied = copyTextFallback(shareUrl);
      }

      const isTouchMobile =
        typeof window !== 'undefined' &&
        window.innerWidth < 1024 &&
        typeof navigator.share === 'function';

      if (isTouchMobile) {
        try {
          await navigator.share({
            title: `${artisan.name} · Góc Thợ Quanh Ta`,
            text: `Góc thợ uy tín tại ${artisan.district}: ${artisan.addressLandmark}`,
            url: shareUrl,
          });
        } catch {
          // Người dùng đóng bảng chia sẻ gốc
        }
      }

      showToast(
        copied
          ? 'Đã sao chép link địa chỉ của cô chú! Gửi ngay cho bạn bè nhé.'
          : 'Đã tạo link chia sẻ địa chỉ của cô chú!'
      );
    },
    [showToast]
  );

  // Bộ đếm "Món đồ được hồi sinh" + đồng bộ Supabase + tích điểm Huy hiệu (Soft Auth Wall)
  const executeMarkRevived = useCallback(
    async (artisan: Artisan, actor: AdminAccount) => {
      const nextArtisanRevived = (artisan.revivedCount ?? 0) + 1;
      setRevivedCount((c) => c + 1);
      setArtisans((prev) =>
        prev.map((a) =>
          a.id === artisan.id ? { ...a, revivedCount: nextArtisanRevived } : a
        )
      );

      if (isSupabaseConfigured) {
        try {
          await updateArtisanFieldsDb(artisan.id, {
            revived_count: nextArtisanRevived,
          });
        } catch (err) {
          showToast(formatSupabaseError(err));
        }
      }

      recordUserContribution(
        'revivedCount',
        'Cảm ơn bạn đã chọn sửa chữa thay vì vứt bỏ! Bạn vừa giúp hồi sinh thêm 1 món đồ.',
        actor
      );
    },
    [recordUserContribution, showToast]
  );

  const handleMarkRevived = useCallback(
    (artisan: Artisan) => {
      if (!currentUser) {
        openAuthModal(
          'Đăng nhập nhanh trong 5 giây để xác nhận đã hồi sinh món đồ và tích huy hiệu Sống xanh nhé.',
          'login',
          (user) => {
            void executeMarkRevived(artisan, user);
          }
        );
        return;
      }
      void executeMarkRevived(artisan, currentUser);
    },
    [currentUser, openAuthModal, executeMarkRevived]
  );

  // Sổ lưu bút cảm ơn: người dùng gửi lời cảm ơn -> chờ duyệt + tích điểm Huy hiệu (Soft Auth Wall)
  const executeSubmitThankYou = useCallback(
    (
      artisan: Artisan,
      payload: { author: string; message: string },
      actor: AdminAccount
    ) => {
      const newNote: ThankYouNote = {
        id: `thanks-${Date.now()}`,
        artisanId: artisan.id,
        artisanName: artisan.name,
        author: payload.author || actor.displayName || actor.name,
        message: payload.message,
        createdAt: formatVietnamDate(),
        approved: false,
      };
      setThankYouNotes((prev) => [newNote, ...prev]);
      recordUserContribution(
        'thanksCount',
        'Cảm ơn tấm lòng của bạn! Lời nhắn sẽ hiển thị sau khi đội ngũ Góc Thợ duyệt qua nhé.',
        actor
      );
    },
    [recordUserContribution]
  );

  const handleSubmitThankYou = useCallback(
    (
      artisan: Artisan,
      payload: { author: string; message: string }
    ): boolean => {
      if (!currentUser) {
        openAuthModal(
          'Đăng nhập nhanh trong 5 giây để gửi lời cảm ơn vào sổ lưu bút của cô chú nhé.',
          'login',
          (user) => {
            executeSubmitThankYou(artisan, payload, user);
          }
        );
        return false;
      }
      executeSubmitThankYou(artisan, payload, currentUser);
      return true;
    },
    [currentUser, openAuthModal, executeSubmitThankYou]
  );

  // Quick Kudos 1 chạm + đồng bộ Supabase (Soft Auth Wall)
  const executeToggleKudos = useCallback(
    async (artisanId: string, kudosKey: KudosKey) => {
      const currentList = kudosReactedMap[artisanId] ?? [];
      const alreadyActive = currentList.includes(kudosKey);
      const target = artisans.find((a) => a.id === artisanId);
      if (!target) return;

      const nextKudos = {
        ...target.kudos,
        [kudosKey]: Math.max(
          0,
          target.kudos[kudosKey] + (alreadyActive ? -1 : 1)
        ),
      };

      setKudosReactedMap((prev) => ({
        ...prev,
        [artisanId]: alreadyActive
          ? (prev[artisanId] ?? []).filter((k) => k !== kudosKey)
          : [...(prev[artisanId] ?? []), kudosKey],
      }));

      setArtisans((prev) =>
        prev.map((a) => (a.id === artisanId ? { ...a, kudos: nextKudos } : a))
      );

      if (isSupabaseConfigured) {
        try {
          await updateArtisanFieldsDb(artisanId, { kudos: nextKudos });
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      if (!alreadyActive) {
        showToast('Cảm ơn lời khen ấm áp bạn vừa gửi tới cô chú!');
      }
    },
    [artisans, kudosReactedMap, showToast]
  );

  const handleToggleKudos = useCallback(
    (artisanId: string, kudosKey: KudosKey) => {
      if (!currentUser) {
        openAuthModal(
          'Đăng nhập nhanh trong 5 giây để gửi lời khen tiếp sức cho cô chú thợ nhé.',
          'login',
          () => {
            void executeToggleKudos(artisanId, kudosKey);
          }
        );
        return;
      }
      void executeToggleKudos(artisanId, kudosKey);
    },
    [currentUser, openAuthModal, executeToggleKudos]
  );

  // Bình luận trải nghiệm mới + đồng bộ Supabase (Soft Auth Wall)
  const executeAddPraise = useCallback(
    async (
      artisanId: string,
      payload: {
        author: string;
        kudosKey: KudosKey;
        comment: string;
      }
    ) => {
      const target = artisans.find((a) => a.id === artisanId);
      if (!target) return;

      const nextKudos = {
        ...target.kudos,
        [payload.kudosKey]: target.kudos[payload.kudosKey] + 1,
      };
      const nextPraises = [
        {
          id: `praise-${Date.now()}`,
          author: payload.author,
          kudosKey: payload.kudosKey,
          comment: payload.comment,
          createdAt: formatVietnamDate(),
        },
        ...target.praises,
      ];

      setArtisans((prev) =>
        prev.map((a) =>
          a.id === artisanId
            ? { ...a, kudos: nextKudos, praises: nextPraises }
            : a
        )
      );

      if (isSupabaseConfigured) {
        try {
          await updateArtisanFieldsDb(artisanId, {
            kudos: nextKudos,
            praises: nextPraises,
          });
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      showToast('Đã đăng lời khen của bạn vào Cộng đồng khen ngợi!');
    },
    [artisans, showToast]
  );

  const handleAddPraise = useCallback(
    async (
      artisanId: string,
      payload: {
        author: string;
        kudosKey: KudosKey;
        comment: string;
      }
    ): Promise<boolean> => {
      if (!currentUser) {
        openAuthModal(
          'Đăng nhập nhanh trong 5 giây để gửi lời khen và chia sẻ trải nghiệm sửa đồ nhé.',
          'login',
          (user) => {
            void executeAddPraise(artisanId, {
              ...payload,
              author: user.displayName || user.name || payload.author,
            });
          }
        );
        return false;
      }
      await executeAddPraise(artisanId, payload);
      return true;
    },
    [currentUser, openAuthModal, executeAddPraise]
  );

  const handleRequestStatusReport = useCallback(
    (artisan: Artisan) => {
      if (!currentUser) {
        openAuthModal(
          'Đăng nhập nhanh trong 5 giây để báo cáo tình trạng làm việc của cô chú giúp cộng đồng nhé.',
          'login',
          () => setReportModalArtisan(artisan)
        );
        return;
      }
      setReportModalArtisan(artisan);
    },
    [currentUser, openAuthModal]
  );

  // Báo tình trạng 1 chạm -> Insert vào bảng status_reports trên Supabase + tích điểm Huy hiệu
  const handleSubmitStatusReport = useCallback(
    async (artisanId: string, status: ArtisanStatus, note: string) => {
      const target = artisans.find((a) => a.id === artisanId);
      const newReport: StatusReport = {
        id: `rep-${Date.now()}`,
        artisanId,
        artisanName: target?.name ?? 'Góc thợ cộng đồng',
        reportedStatus: status,
        note,
        createdAt: formatVietnamTimestamp(),
        resolved: false,
      };

      if (isSupabaseConfigured) {
        try {
          const saved = await insertStatusReportDb(newReport);
          setStatusReports((prev) => [saved, ...prev]);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      } else {
        setStatusReports((prev) => [newReport, ...prev]);
      }

      recordUserContribution(
        'reportsCount',
        'Cảm ơn bạn! Báo cáo tình trạng đã được gửi về mục Quản trị để kiểm duyệt.'
      );
    },
    [artisans, recordUserContribution, showToast]
  );

  // Gợi ý thợ mới -> Insert vào bảng artisans với approval_status = 'pending' & submitted_by = username
  const handleSubmitPendingSuggestion = useCallback(
    async (
      suggestion: PendingSuggestion
    ): Promise<{ ok: boolean; error?: string }> => {
      const taggedSuggestion: PendingSuggestion = {
        ...suggestion,
        submittedBy:
          currentUser?.username || currentUser?.id || suggestion.submittedBy,
      };

      if (isSupabaseConfigured) {
        try {
          const saved = await insertPendingArtisanDb(taggedSuggestion);
          setPendingSuggestions((prev) => [saved, ...prev]);
          setDbTotalArtisansCount((c) => (typeof c === 'number' ? c + 1 : c));
          void loadUserContributions(currentUser);
        } catch (err) {
          const msg = formatSupabaseError(err);
          showToast(msg);
          return { ok: false, error: msg };
        }
      } else {
        setPendingSuggestions((prev) => [taggedSuggestion, ...prev]);
      }

      recordUserContribution(
        'suggestionsCount',
        'Đã gửi đề xuất vào mục Chờ duyệt — bạn có thể theo dõi trong Lịch sử đóng góp!'
      );
      return { ok: true };
    },
    [currentUser, loadUserContributions, recordUserContribution, showToast]
  );

  // =======================================================
  // CÁ NHÂN HÓA ĐỒNG BỘ SUPABASE (LƯU GÓC THỢ & ĐỔI TÊN HIỂN THỊ)
  // =======================================================
  const executeToggleFavorite = useCallback(
    async (artisanId: string, actor: AdminAccount) => {
      const currentIds = actor.favoriteArtisanIds ?? [];
      const exists = currentIds.includes(artisanId);
      const nextIds = exists
        ? currentIds.filter((id) => id !== artisanId)
        : [artisanId, ...currentIds];

      const updatedUser: AdminAccount = {
        ...actor,
        favoriteArtisanIds: nextIds,
      };
      setCurrentUser(updatedUser);
      setAdminAccounts((prev) =>
        prev.map((a) => (a.id === updatedUser.id ? updatedUser : a))
      );

      if (isSupabaseConfigured) {
        try {
          await updateAccountProfileDb(actor.id, {
            favoriteArtisanIds: nextIds,
          });
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      showToast(
        exists
          ? 'Đã bỏ góc thợ khỏi danh sách đã lưu.'
          : 'Đã lưu góc thợ vào mục "Góc thợ đã lưu" của bạn!'
      );
    },
    [showToast]
  );

  const handleToggleFavorite = useCallback(
    async (artisanId: string) => {
      if (!currentUser) {
        openAuthModal(
          'Đăng nhập nhanh trong 5 giây để lưu cô chú thợ yêu thích vào sổ tay của bạn nhé.',
          'login',
          (user) => {
            void executeToggleFavorite(artisanId, user);
          }
        );
        return;
      }
      await executeToggleFavorite(artisanId, currentUser);
    },
    [currentUser, openAuthModal, executeToggleFavorite]
  );

  const handleUpdateMyDisplayName = useCallback(
    async (nextName: string) => {
      const clean = nextName.trim() || 'Bạn trẻ Sài Gòn';
      setUserContribution((prev) => ({ ...prev, displayName: clean }));
      if (!currentUser) return;

      const updatedUser: AdminAccount = {
        ...currentUser,
        displayName: clean,
        name: clean,
      };
      setCurrentUser(updatedUser);
      persistAuthSession(updatedUser);
      setAdminAccounts((prev) =>
        prev.map((a) => (a.id === updatedUser.id ? updatedUser : a))
      );

      if (isSupabaseConfigured) {
        try {
          await updateAccountProfileDb(currentUser.id, { displayName: clean });
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      showToast(`Đã cập nhật tên hiển thị thành "${clean}".`);
    },
    [currentUser, persistAuthSession, showToast]
  );

  // =======================================================
  // ĐĂNG NHẬP / ĐĂNG KÝ / ĐĂNG XUẤT HỢP NHẤT (admin_accounts)
  // =======================================================
  const handleLogin = useCallback(
    async (
      identifier: string,
      password: string
    ): Promise<{ account: AdminAccount | null; error?: string }> => {
      if (isSupabaseConfigured) {
        try {
          const matched = await authenticateUserDb(identifier, password);
          return { account: matched };
        } catch (err) {
          return { account: null, error: formatSupabaseError(err) };
        }
      }

      const cleaned = identifier.trim().toLowerCase();
      const matched =
        adminAccounts.find(
          (acc) =>
            acc.active &&
            (acc.username.toLowerCase() === cleaned ||
              acc.email.toLowerCase() === cleaned) &&
            acc.password === password
        ) ?? null;
      return {
        account: matched
          ? { ...matched, role: normalizeAccountRole(matched.role) }
          : null,
      };
    },
    [adminAccounts]
  );

  const handleRegister = useCallback(
    async (payload: {
      username: string;
      displayName: string;
      password: string;
    }): Promise<{ account: AdminAccount | null; error?: string }> => {
      if (isSupabaseConfigured) {
        try {
          const created = await registerUserDb(payload);
          return { account: created };
        } catch (err) {
          return { account: null, error: formatSupabaseError(err) };
        }
      }

      const cleanedUsername = payload.username.trim().toLowerCase();
      const cleanDisplay = payload.displayName.trim();
      if (
        adminAccounts.some(
          (a) =>
            a.username.toLowerCase() === cleanedUsername ||
            a.email.toLowerCase() === cleanedUsername
        )
      ) {
        return {
          account: null,
          error:
            'Tên đăng nhập này đã được sử dụng. Bạn vui lòng chọn tên khác nhé.',
        };
      }

      const created: AdminAccount = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        displayName: cleanDisplay,
        name: cleanDisplay,
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
      setAdminAccounts((prev) => [...prev, created]);
      return { account: created };
    },
    [adminAccounts]
  );

  const handleAuthSuccess = useCallback(
    (account: AdminAccount, mode: 'login' | 'register') => {
      const normalized: AdminAccount = {
        ...account,
        displayName: account.displayName || account.name,
        name: account.name || account.displayName,
        username: account.username || account.email,
        role: normalizeAccountRole(account.role),
        revivedCount: account.revivedCount ?? 0,
        badges: Array.isArray(account.badges) ? account.badges : [],
        favoriteArtisanIds: Array.isArray(account.favoriteArtisanIds)
          ? account.favoriteArtisanIds
          : [],
      };
      setCurrentUser(normalized);
      persistAuthSession(normalized);
      // Giữ nguyên màn hình /quan-tri nếu người dùng vừa đăng nhập ngay tại trang Quản trị
      setAuthModalState((prev) => ({ ...prev, open: false }));
      setUserContribution((prev) => ({
        ...prev,
        displayName: normalized.displayName,
        revivedCount: normalized.revivedCount,
      }));
      showToast(
        mode === 'register'
          ? `Chào mừng ${normalized.displayName} gia nhập Góc Thợ Quanh Ta!`
          : `Chào mừng ${normalized.displayName} quay lại Góc Thợ Quanh Ta!`
      );

      const pendingAction = pendingAuthActionRef.current;
      pendingAuthActionRef.current = null;
      if (pendingAction) {
        window.setTimeout(() => {
          pendingAction(normalized);
        }, 0);
      }
    },
    [persistAuthSession, showToast]
  );

  const handleLogout = useCallback(() => {
    persistAuthSession(null);
    setCurrentUser(null);
    setSavedModalOpen(false);
    setContributionsModalOpen(false);
    setBadgeModalOpen(false);
    setUserContributions([]);
    if (isAdminView) {
      navigateToTab('home');
    }
    showToast('Đã đăng xuất tài khoản.');
  }, [persistAuthSession, isAdminView, navigateToTab, showToast]);

  // =======================================================
  // HANDLERS CHO KHU QUẢN TRỊ (CHỈ 'Super Admin' & 'Cộng tác viên')
  // =======================================================
  const handleOpenAdmin = useCallback(() => {
    setIsAdminView(true);
    syncUrlToHistory(buildRouteUrl({ isAdmin: true }), 'push');
    scrollPageToTop();
  }, [syncUrlToHistory, scrollPageToTop]);

  const handleExitAdminToMap = useCallback(() => {
    navigateToTab('explore', { artisanId: null, skipScroll: true });
    if (isSupabaseConfigured) {
      void loadPublicArtisans();
    }
  }, [navigateToTab, loadPublicArtisans]);

  // Nút "Nạp 6 dữ liệu mẫu vào Database" khi bảng artisans trên Supabase đang trống
  const handleSeedInitialArtisans = useCallback(async () => {
    if (
      !currentUser ||
      !canAccessAdminDashboard(currentUser.role) ||
      !isSupabaseConfigured ||
      isSeedingDb
    ) {
      return;
    }
    setIsSeedingDb(true);
    setAdminDbError(null);
    try {
      const inserted = await bulkUpsertArtisansDb(INITIAL_ARTISANS);
      setArtisans(inserted);
      setDbTotalArtisansCount(inserted.length + pendingSuggestions.length);
      appendAuditLog(
        `Đã nạp ${inserted.length} hồ sơ cô chú thợ mẫu vào cơ sở dữ liệu Supabase`,
        'data'
      );
      showToast('Đã nạp thành công 6 cô chú thợ mẫu vào Database Supabase!');
    } catch (err) {
      const msg = formatSupabaseError(err);
      setAdminDbError(msg);
      showToast(msg);
    } finally {
      setIsSeedingDb(false);
    }
  }, [
    currentUser,
    isSeedingDb,
    pendingSuggestions.length,
    appendAuditLog,
    showToast,
  ]);

  // Thêm, sửa hoặc duyệt đề xuất (chuyển approval_status = 'approved' trên Supabase)
  const handleSaveArtisan = useCallback(
    async (saved: Artisan, approvedPendingId?: string) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      const isExisting = artisans.some((a) => a.id === saved.id);
      let persisted = saved;

      if (isSupabaseConfigured) {
        try {
          persisted = await upsertApprovedArtisanDb(saved, approvedPendingId);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setArtisans((prev) =>
        isExisting || prev.some((a) => a.id === persisted.id)
          ? prev.map((a) => (a.id === persisted.id ? persisted : a))
          : [persisted, ...prev]
      );

      if (approvedPendingId) {
        setPendingSuggestions((prev) =>
          prev.filter((p) => p.id !== approvedPendingId)
        );
        appendAuditLog(
          `Đã duyệt đề xuất và đưa hồ sơ ${persisted.name} lên bản đồ`,
          'pending'
        );
        showToast(
          `Đã duyệt "${persisted.name}" và đưa lên bản đồ công khai!`
        );
      } else {
        if (!isExisting) {
          setDbTotalArtisansCount((c) => (typeof c === 'number' ? c + 1 : 1));
        }
        appendAuditLog(
          isExisting
            ? `Đã chỉnh sửa hồ sơ ${persisted.name}`
            : `Đã thêm mới hồ sơ ${persisted.name}`,
          'artisan'
        );
        showToast(`Đã lưu thông tin "${persisted.name}".`);
      }
    },
    [currentUser, artisans, appendAuditLog, showToast]
  );

  // Nút 1 chạm "✓ Xác nhận lại hôm nay" (Verification Reminder)
  const handleVerifyArtisanToday = useCallback(
    async (artisanId: string) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      const target = artisans.find((a) => a.id === artisanId);
      const todayVn = formatVietnamDate();
      const todayIso = toIsoDate();

      if (isSupabaseConfigured) {
        try {
          await updateArtisanFieldsDb(artisanId, {
            verified_date: todayVn,
            last_verified_date: todayIso,
          });
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setArtisans((prev) =>
        prev.map((a) =>
          a.id === artisanId
            ? { ...a, verifiedDate: todayVn, lastVerifiedDate: todayIso }
            : a
        )
      );

      if (target) {
        appendAuditLog(
          `Đã xác minh lại hồ sơ ${target.name} vào ngày ${todayVn}`,
          'artisan'
        );
        showToast(`Đã cập nhật ngày xác minh hôm nay cho ${target.name}!`);
      }
    },
    [currentUser, artisans, appendAuditLog, showToast]
  );

  const handleToggleArtisanVisibility = useCallback(
    async (artisanId: string) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      const target = artisans.find((a) => a.id === artisanId);
      if (!target) return;
      const nextHidden = !target.isHidden;

      if (isSupabaseConfigured) {
        try {
          await updateArtisanFieldsDb(artisanId, { is_hidden: nextHidden });
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setArtisans((prev) =>
        prev.map((a) =>
          a.id === artisanId ? { ...a, isHidden: nextHidden } : a
        )
      );
      if (selectedArtisanId === artisanId) {
        setSelectedArtisanId(null);
      }
      appendAuditLog(
        target.isHidden
          ? `Đã cho hiển thị lại ${target.name} trên bản đồ`
          : `Đã tạm ẩn ${target.name} khỏi bản đồ công khai`,
        'artisan'
      );
      showToast('Đã cập nhật trạng thái hiển thị trên bản đồ.');
    },
    [currentUser, artisans, selectedArtisanId, appendAuditLog, showToast]
  );

  const handleDeleteArtisan = useCallback(
    async (artisanId: string) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      const target = artisans.find((a) => a.id === artisanId);

      if (isSupabaseConfigured) {
        try {
          await deleteArtisanDb(artisanId);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setArtisans((prev) => prev.filter((a) => a.id !== artisanId));
      setDbTotalArtisansCount((c) =>
        typeof c === 'number' ? Math.max(0, c - 1) : c
      );
      if (selectedArtisanId === artisanId) {
        setSelectedArtisanId(null);
      }
      if (target) {
        appendAuditLog(`Đã xóa hồ sơ ${target.name}`, 'artisan');
      }
      showToast('Đã xóa hồ sơ người thợ khỏi danh sách.');
    },
    [currentUser, artisans, selectedArtisanId, appendAuditLog, showToast]
  );

  const handleRejectPending = useCallback(
    async (pendingId: string) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      const target = pendingSuggestions.find((p) => p.id === pendingId);

      if (isSupabaseConfigured) {
        try {
          await deleteArtisanDb(pendingId);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setPendingSuggestions((prev) => prev.filter((p) => p.id !== pendingId));
      setDbTotalArtisansCount((c) =>
        typeof c === 'number' ? Math.max(0, c - 1) : c
      );
      if (target) {
        appendAuditLog(`Đã từ chối đề xuất "${target.name}"`, 'pending');
      }
      showToast('Đã từ chối và gỡ đề xuất khỏi hàng chờ.');
    },
    [currentUser, pendingSuggestions, appendAuditLog, showToast]
  );

  // Áp dụng trạng thái từ báo cáo -> cập nhật cả artisans.status & status_reports.is_resolved = true
  const handleApplyReportStatus = useCallback(
    async (report: StatusReport) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      if (isSupabaseConfigured) {
        try {
          await Promise.all([
            updateArtisanFieldsDb(report.artisanId, {
              status: report.reportedStatus,
            }),
            resolveStatusReportDb(report.id),
          ]);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setArtisans((prev) =>
        prev.map((a) =>
          a.id === report.artisanId
            ? { ...a, status: report.reportedStatus }
            : a
        )
      );
      setStatusReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, resolved: true } : r))
      );
      appendAuditLog(
        `Đã cập nhật trạng thái hoạt động của ${report.artisanName} theo báo cáo cộng đồng`,
        'report'
      );
      showToast(`Đã cập nhật trạng thái của ${report.artisanName} lên bản đồ!`);
    },
    [currentUser, appendAuditLog, showToast]
  );

  const handleResolveReport = useCallback(
    async (reportId: string) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      const target = statusReports.find((r) => r.id === reportId);

      if (isSupabaseConfigured) {
        try {
          await resolveStatusReportDb(reportId);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setStatusReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, resolved: true } : r))
      );
      if (target) {
        appendAuditLog(
          `Đã đánh dấu đã xử lý báo cáo tình trạng của ${target.artisanName}`,
          'report'
        );
      }
      showToast('Đã đánh dấu báo cáo là đã xử lý.');
    },
    [currentUser, statusReports, appendAuditLog, showToast]
  );

  // Duyệt / Xóa lời cảm ơn trong Sổ lưu bút
  const handleApproveThankYou = useCallback(
    (noteId: string) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      const target = thankYouNotes.find((n) => n.id === noteId);
      setThankYouNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, approved: true } : n))
      );
      if (target) {
        appendAuditLog(
          `Đã duyệt lời cảm ơn của ${target.author} gửi tới ${target.artisanName}`,
          'thanks'
        );
        showToast(
          `Đã duyệt lời cảm ơn của ${target.author} lên Sổ lưu bút công khai!`
        );
      }
    },
    [currentUser, thankYouNotes, appendAuditLog, showToast]
  );

  const handleDeleteThankYou = useCallback(
    (noteId: string) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      const target = thankYouNotes.find((n) => n.id === noteId);
      setThankYouNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (target) {
        appendAuditLog(
          `Đã xóa lời cảm ơn của ${target.author} (${target.artisanName})`,
          'thanks'
        );
      }
      showToast('Đã gỡ lời nhắn khỏi Sổ lưu bút.');
    },
    [currentUser, thankYouNotes, appendAuditLog, showToast]
  );

  const handleClearAuditLogs = useCallback(() => {
    if (!currentUser || !isSuperAdminRole(currentUser.role)) return;
    setAuditLogs([]);
    showToast('Đã xóa toàn bộ Nhật ký hoạt động.');
  }, [currentUser, showToast]);

  // Quản lý Bản tin (cả 'Super Admin' & 'Cộng tác viên')
  const handleSaveArticle = useCallback(
    async (saved: Article) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      const isExisting = articles.some((a) => a.id === saved.id);
      let persisted = saved;

      if (isSupabaseConfigured) {
        try {
          persisted = await upsertArticleDb(saved);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setArticles((prev) =>
        prev.some((a) => a.id === persisted.id)
          ? prev.map((a) => (a.id === persisted.id ? persisted : a))
          : [persisted, ...prev]
      );

      appendAuditLog(
        isExisting
          ? `Đã cập nhật bài viết "${persisted.title}" (${persisted.status === 'published' ? 'Đã xuất bản' : 'Tin nháp'})`
          : `Đã tạo bài viết "${persisted.title}" (${persisted.status === 'published' ? 'Đã xuất bản' : 'Tin nháp'})`,
        'article'
      );
      showToast(
        persisted.status === 'published'
          ? `Đã xuất bản bài viết "${persisted.title}" lên Bản tin!`
          : `Đã lưu tin nháp "${persisted.title}".`
      );
    },
    [currentUser, articles, appendAuditLog, showToast]
  );

  const handleToggleArticleStatus = useCallback(
    async (articleId: string, nextStatus: ArticleStatus) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      const target = articles.find((a) => a.id === articleId);
      if (!target) return;

      if (isSupabaseConfigured) {
        try {
          await updateArticleStatusDb(articleId, nextStatus);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleId ? { ...a, status: nextStatus } : a
        )
      );
      appendAuditLog(
        nextStatus === 'published'
          ? `Đã xuất bản bài viết "${target.title}"`
          : `Đã chuyển bài viết "${target.title}" về Tin nháp`,
        'article'
      );
      showToast(
        nextStatus === 'published'
          ? `Đã xuất bản "${target.title}" lên trang Bản tin.`
          : `Đã chuyển "${target.title}" về trạng thái Tin nháp.`
      );
    },
    [currentUser, articles, appendAuditLog, showToast]
  );

  const handleDeleteArticle = useCallback(
    async (articleId: string) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      const target = articles.find((a) => a.id === articleId);

      if (isSupabaseConfigured) {
        try {
          await deleteArticleDb(articleId);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      if (target) {
        appendAuditLog(`Đã xóa bài viết "${target.title}"`, 'article');
      }
      showToast('Đã xóa bài viết khỏi Bản tin.');
    },
    [currentUser, articles, appendAuditLog, showToast]
  );

  const handleSeedInitialArticles = useCallback(async () => {
    if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
    if (!isSupabaseConfigured || isSeedingArticles) return;
    setIsSeedingArticles(true);
    try {
      const inserted = await bulkUpsertArticlesDb(INITIAL_ARTICLES);
      setArticles(inserted);
      setArticlesDbError(null);
      appendAuditLog(
        `Đã nạp ${inserted.length} bài viết Bản tin mẫu lên Supabase`,
        'article'
      );
      showToast(`Đã nạp thành công ${inserted.length} bài viết mẫu vào Database!`);
    } catch (err) {
      showToast(formatSupabaseError(err));
    } finally {
      setIsSeedingArticles(false);
    }
  }, [currentUser, isSeedingArticles, appendAuditLog, showToast]);

  // Nhập hàng loạt cô chú thợ từ CSV -> đồng bộ lên bảng artisans
  const handleImportArtisansCsv = useCallback(
    async (imported: Artisan[], skipped: number) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      let persisted = imported;
      if (isSupabaseConfigured) {
        try {
          persisted = await bulkUpsertArtisansDb(imported);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setArtisans((prev) => [...persisted, ...prev]);
      setDbTotalArtisansCount((c) =>
        typeof c === 'number' ? c + persisted.length : persisted.length
      );
      appendAuditLog(
        `Đã nhập hàng loạt ${persisted.length} hồ sơ cô chú thợ từ file CSV`,
        'data'
      );
      showToast(
        skipped > 0
          ? `Đã nhập ${persisted.length} cô chú thợ từ CSV (bỏ qua ${skipped} dòng thiếu thông tin).`
          : `Đã nhập thành công ${persisted.length} cô chú thợ từ file CSV!`
      );
    },
    [currentUser, appendAuditLog, showToast]
  );

  // Khôi phục toàn bộ dữ liệu từ file JSON Backup
  const handleRestoreBackupJson = useCallback(
    async (backup: AppBackupPayload) => {
      if (!currentUser || !canAccessAdminDashboard(currentUser.role)) return;
      if (isSupabaseConfigured) {
        try {
          if (backup.artisans.length > 0) {
            await bulkUpsertArtisansDb(backup.artisans);
          }
          if (
            isSuperAdminRole(currentUser.role) &&
            backup.adminAccounts.length > 0
          ) {
            await bulkInsertAdminAccountsDb(backup.adminAccounts);
          }
          await loadAdminData();
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      } else {
        setArtisans(backup.artisans);
        setPendingSuggestions(backup.pendingSuggestions);
        setStatusReports(backup.statusReports);
        if (isSuperAdminRole(currentUser.role)) {
          setAdminAccounts(backup.adminAccounts);
        }
      }

      setThankYouNotes(backup.thankYouNotes);
      setRevivedCount(backup.revivedCount);

      const restoreLog: AuditLogEntry = {
        id: `log-restore-${Date.now()}`,
        timestamp: formatVietnamTimestamp(),
        actorName: currentUser.displayName || currentUser.name || 'Admin',
        actorEmail: currentUser.username || currentUser.email || 'admin@goctho.vn',
        action: `Đã khôi phục dữ liệu từ bản sao lưu JSON (${backup.artisans.length} cô chú thợ)`,
        category: 'data',
      };
      setAuditLogs([restoreLog, ...backup.auditLogs].slice(0, 300));
      showToast(
        `Đã khôi phục thành công ${backup.artisans.length} hồ sơ thợ và toàn bộ dữ liệu hệ thống!`
      );
    },
    [currentUser, loadAdminData, showToast]
  );

  // Super Admin: Tạo tài khoản mới (hỗ trợ cả 'Super Admin', 'Cộng tác viên', 'user')
  const handleCreateAdminAccount = useCallback(
    async (payload: {
      displayName: string;
      username: string;
      password: string;
      role: AdminRole;
    }): Promise<{ ok: boolean; error?: string }> => {
      if (!currentUser || !isSuperAdminRole(currentUser.role)) {
        return { ok: false, error: 'Bạn không có quyền tạo tài khoản.' };
      }
      const cleanUsername = payload.username.trim().toLowerCase();
      const cleanDisplay = payload.displayName.trim();
      const normalizedRole = normalizeAccountRole(payload.role);

      const newAcc: AdminAccount = {
        id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        displayName: cleanDisplay,
        name: cleanDisplay,
        username: cleanUsername,
        email: cleanUsername,
        password: payload.password,
        role: normalizedRole,
        active: true,
        revivedCount: 0,
        badges: [],
        favoriteArtisanIds: [],
        createdAt: formatVietnamDate(),
      };

      let persisted = newAcc;
      if (isSupabaseConfigured) {
        try {
          persisted = await insertAdminAccountDb(newAcc);
        } catch (err) {
          const msg = formatSupabaseError(err);
          showToast(msg);
          return { ok: false, error: msg };
        }
      }

      setAdminAccounts((prev) => [...prev, persisted]);
      appendAuditLog(
        `Đã tạo tài khoản ${getRoleDisplayLabel(persisted.role)} cho ${persisted.displayName} (@${persisted.username})`,
        'account'
      );
      showToast(
        `Đã tạo tài khoản ${getRoleDisplayLabel(persisted.role)} cho ${persisted.displayName}.`
      );
      return { ok: true };
    },
    [currentUser, appendAuditLog, showToast]
  );

  // Super Admin: Chỉnh sửa thông tin & nâng/hạ vai trò bất kỳ tài khoản nào
  const handleUpdateAdminAccount = useCallback(
    async (
      accountId: string,
      payload: { displayName: string; username: string; role: AdminRole }
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!currentUser || !isSuperAdminRole(currentUser.role)) {
        return { ok: false, error: 'Bạn không có quyền chỉnh sửa tài khoản.' };
      }
      const cleanUsername = payload.username.trim().toLowerCase();
      const cleanDisplay = payload.displayName.trim();
      const safeRole: AdminRole =
        accountId === currentUser.id
          ? 'Super Admin'
          : normalizeAccountRole(payload.role);

      let updated: AdminAccount | null = null;
      if (isSupabaseConfigured) {
        try {
          updated = await updateAccountByAdminDb(accountId, {
            displayName: cleanDisplay,
            username: cleanUsername,
            role: safeRole,
          });
        } catch (err) {
          const msg = formatSupabaseError(err);
          showToast(msg);
          return { ok: false, error: msg };
        }
      } else {
        const conflict = adminAccounts.some(
          (a) =>
            a.id !== accountId &&
            (a.username.toLowerCase() === cleanUsername ||
              a.email.toLowerCase() === cleanUsername)
        );
        if (conflict) {
          return {
            ok: false,
            error: 'Tên đăng nhập này đã thuộc về một tài khoản khác.',
          };
        }
      }

      setAdminAccounts((prev) =>
        prev.map((a) => {
          if (a.id !== accountId) return a;
          return (
            updated ?? {
              ...a,
              displayName: cleanDisplay,
              name: cleanDisplay,
              username: cleanUsername,
              email: cleanUsername,
              role: safeRole,
            }
          );
        })
      );

      if (accountId === currentUser.id) {
        const nextSelf: AdminAccount = updated ?? {
          ...currentUser,
          displayName: cleanDisplay,
          name: cleanDisplay,
          username: cleanUsername,
          email: cleanUsername,
          role: safeRole,
        };
        setCurrentUser(nextSelf);
        persistAuthSession(nextSelf);
      }

      appendAuditLog(
        `Đã cập nhật tài khoản ${cleanDisplay} (@${cleanUsername}) → vai trò ${getRoleDisplayLabel(safeRole)}`,
        'account'
      );
      showToast(`Đã lưu thay đổi cho tài khoản ${cleanDisplay}.`);
      return { ok: true };
    },
    [currentUser, adminAccounts, persistAuthSession, appendAuditLog, showToast]
  );

  // Super Admin: Đặt lại / Đổi mật khẩu cho tài khoản bất kỳ
  const handleResetAccountPassword = useCallback(
    async (
      accountId: string,
      newPassword: string
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!currentUser || !isSuperAdminRole(currentUser.role)) {
        return { ok: false, error: 'Bạn không có quyền đặt lại mật khẩu.' };
      }
      const target = adminAccounts.find((a) => a.id === accountId);

      if (isSupabaseConfigured) {
        try {
          await resetAccountPasswordDb(accountId, newPassword);
        } catch (err) {
          const msg = formatSupabaseError(err);
          showToast(msg);
          return { ok: false, error: msg };
        }
      }

      setAdminAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId ? { ...a, password: newPassword } : a
        )
      );
      if (target) {
        appendAuditLog(
          `Đã đặt lại mật khẩu cho tài khoản ${target.displayName || target.name} (@${target.username || target.email})`,
          'account'
        );
      }
      showToast(
        `Đã cập nhật mật khẩu mới cho ${target?.displayName || 'tài khoản'}.`
      );
      return { ok: true };
    },
    [currentUser, adminAccounts, appendAuditLog, showToast]
  );

  // Import hàng loạt tài khoản từ CSV (chỉ Super Admin) -> đồng bộ bảng admin_accounts
  const handleBulkCreateAdminAccounts = useCallback(
    async (newAccounts: AdminAccount[], skipped: number, duplicates: number) => {
      if (!currentUser || !isSuperAdminRole(currentUser.role)) return;
      let persisted = newAccounts;

      if (isSupabaseConfigured) {
        try {
          persisted = await bulkInsertAdminAccountsDb(newAccounts);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setAdminAccounts((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const merged = [...prev];
        for (const item of persisted) {
          if (!existingIds.has(item.id)) {
            merged.push(item);
          }
        }
        return merged;
      });
      appendAuditLog(
        `Đã nhập hàng loạt ${persisted.length} tài khoản từ file CSV`,
        'account'
      );
      const extra: string[] = [];
      if (duplicates > 0) extra.push(`bỏ qua ${duplicates} tài khoản trùng`);
      if (skipped > 0) extra.push(`${skipped} dòng chưa hợp lệ`);
      showToast(
        extra.length > 0
          ? `Đã tạo ${persisted.length} tài khoản từ CSV (${extra.join(', ')}).`
          : `Đã tạo thành công ${persisted.length} tài khoản từ file CSV!`
      );
    },
    [currentUser, appendAuditLog, showToast]
  );

  const handleDeleteAdminAccount = useCallback(
    async (accountId: string) => {
      if (
        !currentUser ||
        !isSuperAdminRole(currentUser.role) ||
        accountId === currentUser.id
      ) {
        return;
      }
      const target = adminAccounts.find((a) => a.id === accountId);

      if (isSupabaseConfigured) {
        try {
          await deleteAdminAccountDb(accountId);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setAdminAccounts((prev) => prev.filter((a) => a.id !== accountId));
      if (target) {
        appendAuditLog(
          `Đã xóa tài khoản ${target.displayName || target.name} (@${target.username || target.email})`,
          'account'
        );
      }
      showToast('Đã xóa tài khoản khỏi hệ thống.');
    },
    [currentUser, adminAccounts, appendAuditLog, showToast]
  );

  const favoriteIdsSet = useMemo(
    () => new Set(currentUser?.favoriteArtisanIds ?? []),
    [currentUser?.favoriteArtisanIds]
  );

  const savedArtisans = useMemo(
    () => publicArtisans.filter((a) => favoriteIdsSet.has(a.id)),
    [publicArtisans, favoriteIdsSet]
  );

  // =======================================================
  // MÀN HÌNH CHỜ KHÔI PHỤC PHIÊN (NHANH, KHÔNG CHẶN KHÁCH)
  // =======================================================
  if (isRestoringSession) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF8F5] flex flex-col items-center justify-center p-6 gap-3 text-center">
        <span className="w-12 h-12 rounded-2xl bg-[#D96B38] text-white flex items-center justify-center shadow-md">
          <MapPin className="w-6 h-6" />
        </span>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2933]">
          <Loader2 className="w-4 h-4 text-[#D96B38] animate-spin" />
          <span>Đang mở Góc Thợ Quanh Ta...</span>
        </div>
      </div>
    );
  }

  // =======================================================
  // BẢO VỆ ĐƯỜNG DẪN /quan-tri (CHỈ 'Super Admin' & 'Cộng tác viên')
  // =======================================================
  if (isAdminView) {
    if (currentUser && canAccessAdminDashboard(currentUser.role)) {
      const isDbArtisansEmpty =
        isSupabaseConfigured &&
        (dbTotalArtisansCount === 0 ||
          (dbTotalArtisansCount === null &&
            !isLoadingAdminData &&
            artisans.length === 0 &&
            pendingSuggestions.length === 0));

      return (
        <>
          <AdminDashboard
            currentAdmin={currentUser}
            artisans={artisans}
            articles={articles}
            pendingSuggestions={pendingSuggestions}
            statusReports={statusReports}
            thankYouNotes={thankYouNotes}
            auditLogs={auditLogs}
            adminAccounts={adminAccounts}
            revivedCount={revivedCount}
            isSupabaseMode={isSupabaseConfigured}
            supabaseWarning={supabaseConfigWarning}
            isLoadingAdminData={isLoadingAdminData}
            isSeedingDb={isSeedingDb}
            isSeedingArticles={isSeedingArticles}
            isDbArtisansEmpty={isDbArtisansEmpty}
            dbError={adminDbError}
            onRefreshAdminData={() => void loadAdminData()}
            onSeedInitialArtisans={() => void handleSeedInitialArtisans()}
            onSeedInitialArticles={() => handleSeedInitialArticles()}
            onSaveArticle={(article) => handleSaveArticle(article)}
            onToggleArticleStatus={(id, nextStatus) =>
              handleToggleArticleStatus(id, nextStatus)
            }
            onDeleteArticle={(id) => handleDeleteArticle(id)}
            onExitToMap={handleExitAdminToMap}
            onLogout={handleLogout}
            onSaveArtisan={(artisan, pendingId) => {
              void handleSaveArtisan(artisan, pendingId);
            }}
            onVerifyArtisanToday={(id) => {
              void handleVerifyArtisanToday(id);
            }}
            onToggleArtisanVisibility={(id) => {
              void handleToggleArtisanVisibility(id);
            }}
            onDeleteArtisan={(id) => {
              void handleDeleteArtisan(id);
            }}
            onRejectPending={(id) => {
              void handleRejectPending(id);
            }}
            onApplyReportStatus={(report) => {
              void handleApplyReportStatus(report);
            }}
            onResolveReport={(id) => {
              void handleResolveReport(id);
            }}
            onApproveThankYou={handleApproveThankYou}
            onDeleteThankYou={handleDeleteThankYou}
            onClearAuditLogs={handleClearAuditLogs}
            onImportArtisansCsv={(imported, skipped) => {
              void handleImportArtisansCsv(imported, skipped);
            }}
            onRestoreBackupJson={(backup) => {
              void handleRestoreBackupJson(backup);
            }}
            onCreateAdminAccount={(payload) =>
              handleCreateAdminAccount(payload)
            }
            onUpdateAdminAccount={(id, payload) =>
              handleUpdateAdminAccount(id, payload)
            }
            onResetAccountPassword={(id, newPassword) =>
              handleResetAccountPassword(id, newPassword)
            }
            onBulkCreateAdminAccounts={(accounts, skipped, duplicates) => {
              void handleBulkCreateAdminAccounts(accounts, skipped, duplicates);
            }}
            onDeleteAdminAccount={(id) => handleDeleteAdminAccount(id)}
            onNotify={showToast}
          />

          {toastMessage && (
            <div
              role="status"
              aria-live="polite"
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] max-w-[90vw] sm:max-w-md pointer-events-none"
            >
              <div className="bg-[#1F2933] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#7CD4B2] shrink-0" />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}
        </>
      );
    }

    // Chưa đăng nhập hoặc tài khoản user thường khi truy cập /quan-tri
    return (
      <div className="min-h-[100dvh] bg-[#FAF8F5] text-[#1F2933] flex flex-col items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md rounded-3xl bg-white border border-stone-200/90 shadow-[0_12px_36px_rgba(31,41,51,0.06)] p-7 sm:p-9 text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#3A6B5C]/10 text-[#3A6B5C] flex items-center justify-center">
            {currentUser ? (
              <ShieldAlert className="w-7 h-7 text-[#D96B38]" />
            ) : (
              <ShieldCheck className="w-7 h-7" />
            )}
          </div>

          {currentUser ? (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D96B38]">
                Quản trị · Góc Thợ Quanh Ta
              </p>
              <h1 className="text-xl font-bold text-[#1F2933] tracking-tight">
                Tài khoản của bạn chưa có quyền truy cập trang Quản trị
              </h1>
              <p className="text-sm text-[#52606D] leading-relaxed">
                Bạn đang đăng nhập với tài khoản{' '}
                <strong className="font-semibold text-[#1F2933]">
                  {currentUser.displayName || currentUser.name}
                </strong>
                . Trang này chỉ dành cho Super Admin hoặc Cộng tác viên.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3A6B5C]">
                Quản trị · Góc Thợ Quanh Ta
              </p>
              <h1 className="text-xl font-bold text-[#1F2933] tracking-tight">
                Đăng nhập tài khoản Quản trị / CTV
              </h1>
              <p className="text-sm text-[#52606D] leading-relaxed">
                Vui lòng đăng nhập bằng tài khoản Super Admin hoặc Cộng tác viên
                để tiếp tục quản lý bản đồ và Bản tin.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-1">
            {!currentUser ? (
              <button
                type="button"
                onClick={() =>
                  openAuthModal(
                    'Vui lòng đăng nhập bằng tài khoản Quản trị viên hoặc Cộng tác viên để truy cập trang Quản trị.',
                    'login'
                  )
                }
                className="w-full min-h-[46px] px-5 py-2.5 rounded-full bg-[#3A6B5C] hover:bg-[#2F574A] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập Quản trị / CTV</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  persistAuthSession(null);
                  setCurrentUser(null);
                  setUserContributions([]);
                  adminAuthPromptedRef.current = true;
                  openAuthModal(
                    'Vui lòng đăng nhập bằng tài khoản Quản trị viên hoặc Cộng tác viên để truy cập trang Quản trị.',
                    'login'
                  );
                }}
                className="w-full min-h-[46px] px-5 py-2.5 rounded-full bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200 text-[#1F2933] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4 text-[#52606D]" />
                <span>Đăng xuất để đổi tài khoản</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigateToTab('home')}
              className="w-full min-h-[44px] px-5 py-2.5 rounded-full border border-stone-200/90 hover:border-stone-300 bg-white hover:bg-[#FAF8F5] text-[#52606D] hover:text-[#1F2933] text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay về trang chủ</span>
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={authModalState.open}
          defaultMode={authModalState.defaultMode}
          promptMessage={authModalState.prompt}
          onClose={closeAuthModal}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onAuthSuccess={handleAuthSuccess}
        />

        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] max-w-[90vw] sm:max-w-md pointer-events-none"
          >
            <div className="bg-[#1F2933] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7CD4B2] shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'Tất cả' ||
    selectedDistrict !== 'Tất cả khu vực' ||
    onlyWorking ||
    sortByNearest;

  const miniCardStatus = selectedArtisan
    ? getStatusDisplay(selectedArtisan.status)
    : null;
  const miniCardDistance = selectedArtisan
    ? getDistanceForArtisan(selectedArtisan)
    : null;

  const handleOpenBadgeModal = () => {
    if (!currentUser) {
      openAuthModal(
        'Đăng nhập nhanh trong 5 giây để xem hành trình Sống xanh và tích huy hiệu hồi sinh đồ nhé.',
        'login',
        () => setBadgeModalOpen(true)
      );
      return;
    }
    setBadgeModalOpen(true);
  };

  return (
    <div className="h-[100dvh] lg:h-screen flex flex-col bg-[#FAF8F5] text-[#1F2933] overflow-hidden">
      {/* Desktop Top Navbar cố định (h-16) với nút Đăng nhập / Đăng ký hoặc Tài khoản */}
      <DesktopNavbar
        activeTab={activeTab}
        onChangeTab={handleNavigateTab}
        currentUser={currentUser}
        pendingCount={pendingSuggestions.length}
        favoritesCount={savedArtisans.length}
        contributionsCount={userContributions.length}
        badgeEmoji={badgeSummary.highestUnlocked?.emoji ?? '🏅'}
        onOpenAuth={() => openAuthModal()}
        onOpenBadge={handleOpenBadgeModal}
        onOpenSaved={() => setSavedModalOpen(true)}
        onOpenContributions={() => {
          setContributionsModalOpen(true);
          void loadUserContributions(currentUser);
        }}
        onOpenAdmin={handleOpenAdmin}
        onLogout={handleLogout}
      />

      {/* Mobile Top Header trên màn hình mở đầu, Bản tin, Gợi ý, Về dự án */}
      {activeTab !== 'explore' && (
        <MobileTopHeader
          currentUser={currentUser}
          pendingCount={pendingSuggestions.length}
          favoritesCount={savedArtisans.length}
          contributionsCount={userContributions.length}
          badgeEmoji={badgeSummary.highestUnlocked?.emoji ?? '🏅'}
          onGoHome={() => navigateToTab('home')}
          onSuggestArtisan={() => handleNavigateTab('suggest')}
          onOpenAuth={() => openAuthModal()}
          onOpenBadge={handleOpenBadgeModal}
          onOpenSaved={() => setSavedModalOpen(true)}
          onOpenContributions={() => {
            setContributionsModalOpen(true);
            void loadUserContributions(currentUser);
          }}
          onOpenAdmin={handleOpenAdmin}
          onLogout={handleLogout}
        />
      )}

      {/* Cảnh báo nhỏ khi chưa cấu hình biến môi trường Supabase (tránh trắng trang) */}
      {supabaseConfigWarning && !dismissedConfigWarning && (
        <div className="bg-[#FFF8E6] border-b border-[#E9A825]/45 px-3.5 py-2 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-[#8A5A00] shrink-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-3.5 h-3.5 text-[#C48200] shrink-0" />
            <p className="truncate sm:whitespace-normal">
              {supabaseConfigWarning}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissedConfigWarning(true)}
            aria-label="Đóng thông báo cấu hình Supabase"
            className="w-6 h-6 rounded-lg hover:bg-[#E9A825]/20 flex items-center justify-center shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Nội dung chính */}
      <main className="flex-1 min-h-0 relative overflow-hidden">
        {activeTab === 'home' && (
          <div
            ref={pageScrollRef}
            className="h-full overflow-y-auto thin-scrollbar flex flex-col"
          >
            <div className="flex-1">
              <HomeDiscoveryView
                artisans={publicArtisans}
                isLoading={isLoadingPublicData}
                dbError={publicDbError}
                gpsStatus={gpsStatus}
                userLocation={userLocation}
                selectedDistrict={selectedDistrict}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSelectedDistrictChange={setSelectedDistrict}
                onRequestGps={() => requestAutoGps(true)}
                onRetryLoad={() => void loadPublicArtisans()}
                onSelectArtisanOnMap={handleSelectArtisanFromHome}
                onOpenFullMap={handleOpenFullMap}
                onRequestSuggest={() => handleNavigateTab('suggest')}
              />
            </div>
            <SiteFooter
              currentUser={currentUser}
              onNavigate={handleNavigateTab}
              onOpenAuth={() => openAuthModal()}
              onOpenAdmin={handleOpenAdmin}
            />
          </div>
        )}

        {activeTab === 'explore' && (
          <div className="h-full w-full lg:flex">
            {/* =======================================================
                CỘT TRÁI DESKTOP (440px): Quay lại Tìm lỗi khác, Tác động xanh, Tìm kiếm, Bộ lọc, Danh sách & Chi tiết
               ======================================================= */}
            <aside className="hidden lg:flex flex-col w-[440px] shrink-0 h-full bg-[#FAF8F5] border-r border-[#E8E2D9] relative overflow-hidden">
              <div className="flex flex-col h-full">
                {/* Thanh đếm gọn nhẹ + Nút quay lại trang Tìm lỗi khác */}
                <div className="px-4 py-2 bg-[#3A6B5C]/10 border-b border-[#3A6B5C]/15 flex items-center justify-between gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigateToTab('home')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1F2933] hover:text-[#D96B38] transition-colors whitespace-nowrap shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Tìm lỗi khác</span>
                  </button>
                  <p className="text-[11px] font-semibold text-[#3A6B5C] flex items-center gap-1 tabular-nums truncate">
                    <Recycle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      <strong className="font-bold">{revivedCount}</strong> món
                      đồ hồi sinh
                    </span>
                  </p>
                </div>

                {/* Khối Tìm kiếm theo vấn đề & Bộ lọc thông minh */}
                <div className="p-4 bg-white border-b border-[#EBE5DC] space-y-3 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-[#52606D]">
                      Hỏng đâu tìm đó – Gần nhau hơn mỗi ngày!
                    </p>
                    <span className="text-xs font-semibold text-[#3A6B5C] tabular-nums">
                      {filteredArtisans.length} góc thợ
                    </span>
                  </div>

                  {/* Ô tìm kiếm theo vấn đề */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Bạn cần sửa gì? (VD: bung đế giày, lên lai quần, thay pin...)"
                      className="w-full h-11 pl-10 pr-9 rounded-xl bg-[#FAF8F5] border border-[#E5DFD5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15 transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Xóa từ khóa"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-[#7B8794] hover:text-[#1F2933] hover:bg-[#EBE5DC] flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Chip gợi ý vấn đề nhanh */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {QUICK_PROBLEM_CHIPS.map((problem) => {
                      const active =
                        normalizeVietnamese(searchQuery) ===
                        normalizeVietnamese(problem);
                      return (
                        <button
                          key={problem}
                          type="button"
                          onClick={() => setSearchQuery(active ? '' : problem)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                            active
                              ? 'bg-[#D96B38] text-white'
                              : 'bg-[#F3EEE6] text-[#52606D] hover:bg-[#EAE2D6] hover:text-[#1F2933]'
                          }`}
                        >
                          {problem}
                        </button>
                      );
                    })}
                  </div>

                  {/* Thanh chip: 📍 Gần tôi nhất + Danh mục trượt ngang */}
                  <div className="flex items-center gap-1.5 overflow-x-auto thin-scrollbar pb-1">
                    <button
                      type="button"
                      onClick={handleToggleSortByNearest}
                      aria-pressed={sortByNearest}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1 transition-colors ${
                        sortByNearest
                          ? 'bg-[#D96B38] text-white shadow-xs'
                          : 'bg-[#D96B38]/10 border border-[#D96B38]/30 text-[#D96B38] hover:bg-[#D96B38]/18'
                      }`}
                    >
                      {isLocating && sortByNearest ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span aria-hidden="true">📍</span>
                      )}
                      <span>Gần tôi nhất</span>
                    </button>

                    {(['Tất cả', ...CRAFT_CATEGORIES] as const).map(
                      (category) => {
                        const active = selectedCategory === category;
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                              active
                                ? 'bg-[#1F2933] text-white shadow-xs'
                                : 'bg-white border border-[#E5DFD5] text-[#52606D] hover:border-[#1F2933]/35 hover:text-[#1F2933]'
                            }`}
                          >
                            {category}
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* Lọc khu vực & Toggle Đang làm việc */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <select
                      aria-label="Lọc theo khu vực"
                      value={selectedDistrict}
                      onChange={(e) =>
                        setSelectedDistrict(
                          e.target.value as District | 'Tất cả khu vực'
                        )
                      }
                      className="h-9 px-3 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-xs font-semibold text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                    >
                      <option value="Tất cả khu vực">Tất cả khu vực</option>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={onlyWorking}
                        onChange={(e) => setOnlyWorking(e.target.checked)}
                        className="sr-only peer"
                      />
                      <span className="w-9 h-5 rounded-full bg-[#DFD8CE] peer-checked:bg-[#3A6B5C] relative transition-colors after:content-[''] after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow-xs after:absolute after:top-0.5 after:left-0.5 peer-checked:after:translate-x-4 after:transition-transform" />
                      <span className="text-xs font-semibold text-[#1F2933] whitespace-nowrap">
                        Đang làm việc
                      </span>
                    </label>
                  </div>
                </div>

                {/* Danh sách thẻ người thợ cuộn dọc */}
                <div className="flex-1 overflow-y-auto thin-scrollbar p-4 space-y-3">
                  {isLoadingPublicData ? (
                    <div className="rounded-2xl bg-white border border-[#EBE5DC] p-6 text-center space-y-2.5 mt-4">
                      <Loader2 className="w-6 h-6 text-[#D96B38] animate-spin mx-auto" />
                      <p className="text-sm font-semibold text-[#1F2933]">
                        Đang tải danh sách cô chú thợ...
                      </p>
                      <p className="text-xs text-[#52606D]">
                        Đang đồng bộ dữ liệu trực tuyến từ cơ sở dữ liệu Supabase.
                      </p>
                    </div>
                  ) : publicDbError ? (
                    <div
                      role="alert"
                      className="rounded-2xl bg-[#C84B31]/8 border border-[#C84B31]/25 p-5 text-center space-y-3 mt-4"
                    >
                      <WifiOff className="w-7 h-7 text-[#C84B31] mx-auto" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#A3361F]">
                          Không thể tải dữ liệu
                        </p>
                        <p className="text-xs text-[#7A2B1B] leading-relaxed">
                          {publicDbError}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void loadPublicArtisans()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C84B31] hover:bg-[#B03D25] text-white text-xs font-semibold transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Thử tải lại</span>
                      </button>
                    </div>
                  ) : filteredArtisans.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-[#EBE5DC] p-6 text-center space-y-3 mt-4">
                      <MapPin className="w-8 h-8 text-[#D96B38]/60 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#1F2933]">
                          {publicArtisans.length === 0 && isSupabaseConfigured
                            ? 'Chưa có cô chú thợ nào trên bản đồ'
                            : 'Chưa tìm thấy góc thợ phù hợp'}
                        </p>
                        <p className="text-xs text-[#52606D] leading-relaxed">
                          {publicArtisans.length === 0 && isSupabaseConfigured
                            ? 'Quản trị viên có thể vào mục Quản trị để nạp 6 dữ liệu mẫu vào Database.'
                            : 'Thử xóa bớt bộ lọc hoặc tìm từ khóa ngắn hơn như “giày”, “quần”, “khóa” nhé.'}
                        </p>
                      </div>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Đặt lại bộ lọc</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredArtisans.map((artisan) => (
                      <ArtisanCard
                        key={artisan.id}
                        artisan={artisan}
                        isSelected={selectedArtisanId === artisan.id}
                        isHovered={hoveredArtisanId === artisan.id}
                        isFavorite={favoriteIdsSet.has(artisan.id)}
                        distanceKm={getDistanceForArtisan(artisan)}
                        onSelect={handleSelectArtisanFromList}
                        onHoverChange={setHoveredArtisanId}
                        onToggleFavorite={(id) => void handleToggleFavorite(id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Panel Chi tiết trượt đè mượt mà lên cột trái trên Desktop */}
              <div
                aria-hidden={!selectedArtisan}
                className={`absolute inset-0 z-30 bg-white transition-transform duration-200 ease-out ${
                  selectedArtisan
                    ? 'translate-x-0 pointer-events-auto'
                    : '-translate-x-full pointer-events-none'
                }`}
              >
                {selectedArtisan && (
                  <ArtisanDetail
                    artisan={selectedArtisan}
                    distanceKm={getDistanceForArtisan(selectedArtisan)}
                    userLocation={userLocation}
                    routeInfo={routeInfo}
                    isRouting={isRouting}
                    travelMode={travelMode}
                    userKudosKeys={kudosReactedMap[selectedArtisan.id] ?? []}
                    approvedThankYouNotes={selectedArtisanApprovedThanks}
                    isFavorite={favoriteIdsSet.has(selectedArtisan.id)}
                    currentUserDisplayName={
                      currentUser?.displayName || currentUser?.name || ''
                    }
                    onBack={handleCloseSelectedArtisan}
                    onShare={handleShareArtisan}
                    onToggleFavorite={(id) => void handleToggleFavorite(id)}
                    onMarkRevived={handleMarkRevived}
                    onSubmitThankYou={handleSubmitThankYou}
                    onDrawRoute={handleDrawRouteFromDetail}
                    onChangeTravelMode={handleChangeTravelMode}
                    onOpenQr={setQrModalArtisan}
                    onOpenStatusReport={handleRequestStatusReport}
                    onToggleKudos={handleToggleKudos}
                    onAddPraise={handleAddPraise}
                  />
                )}
              </div>
            </aside>

            {/* =======================================================
                CỘT PHẢI DESKTOP & MÀN HÌNH CHÍNH MOBILE: BẢN ĐỒ + FLOATING CONTROLS
               ======================================================= */}
            <section className="relative flex-1 h-full w-full">
              {/* Nút ← Tìm lỗi khác + Đăng nhập / Tài khoản + tìm kiếm + chip lọc nổi phía trên cho Mobile */}
              <div className="lg:hidden absolute top-0 left-0 right-0 z-[440] p-3 pointer-events-none space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigateToTab('home')}
                    className="pointer-events-auto h-9 px-3 rounded-xl bg-white/95 backdrop-blur-md border border-[#E5DFD5] shadow-sm text-xs font-bold text-[#1F2933] hover:text-[#D96B38] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Tìm lỗi khác</span>
                  </button>

                  <div className="pointer-events-auto shrink-0">
                    {currentUser ? (
                      <AccountMenuDropdown
                        compact
                        currentUser={currentUser}
                        badgeEmoji={badgeSummary.highestUnlocked?.emoji ?? '🏅'}
                        favoritesCount={savedArtisans.length}
                        contributionsCount={userContributions.length}
                        pendingCount={pendingSuggestions.length}
                        onOpenBadge={handleOpenBadgeModal}
                        onOpenSaved={() => setSavedModalOpen(true)}
                        onOpenContributions={() => {
                          setContributionsModalOpen(true);
                          void loadUserContributions(currentUser);
                        }}
                        onSuggestArtisan={() => handleNavigateTab('suggest')}
                        onOpenAdmin={handleOpenAdmin}
                        onLogout={handleLogout}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => openAuthModal()}
                        className="h-9 px-3.5 rounded-full bg-white/95 backdrop-blur-md hover:bg-[#1F2933] text-[#1F2933] hover:text-white border border-stone-300 shadow-sm text-xs font-medium whitespace-nowrap transition-colors"
                      >
                        Đăng nhập
                      </button>
                    )}
                  </div>
                </div>

                <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md border border-[#E5DFD5] rounded-2xl shadow-md px-3 py-1.5">
                  <Search className="w-4 h-4 text-[#D96B38] shrink-0" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Bạn cần sửa gì? (bung đế, lên lai...)"
                    className="flex-1 min-w-0 h-9 bg-transparent text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Xóa từ khóa"
                      className="w-8 h-8 rounded-lg text-[#7B8794] flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen((v) => !v)}
                    aria-label="Mở bộ lọc khu vực và trạng thái"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                      mobileFiltersOpen ||
                      selectedDistrict !== 'Tất cả khu vực' ||
                      onlyWorking
                        ? 'bg-[#D96B38] text-white'
                        : 'bg-[#FAF8F5] text-[#52606D]'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {mobileFiltersOpen && (
                  <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-[#E5DFD5] rounded-2xl shadow-md p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        aria-label="Chọn khu vực"
                        value={selectedDistrict}
                        onChange={(e) =>
                          setSelectedDistrict(
                            e.target.value as District | 'Tất cả khu vực'
                          )
                        }
                        className="h-10 px-3 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-xs font-semibold text-[#1F2933]"
                      >
                        <option value="Tất cả khu vực">Tất cả khu vực</option>
                        {DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onlyWorking}
                          onChange={(e) => setOnlyWorking(e.target.checked)}
                          className="sr-only peer"
                        />
                        <span className="w-9 h-5 rounded-full bg-[#DFD8CE] peer-checked:bg-[#3A6B5C] relative transition-colors after:content-[''] after:w-4 after:h-4 after:rounded-full after:bg-white after:absolute after:top-0.5 after:left-0.5 peer-checked:after:translate-x-4 after:transition-transform" />
                        <span className="text-xs font-semibold text-[#1F2933]">
                          Đang làm việc
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {QUICK_PROBLEM_CHIPS.map((problem) => {
                        const active =
                          normalizeVietnamese(searchQuery) ===
                          normalizeVietnamese(problem);
                        return (
                          <button
                            key={problem}
                            type="button"
                            onClick={() =>
                              setSearchQuery(active ? '' : problem)
                            }
                            className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 ${
                              active
                                ? 'bg-[#D96B38] text-white'
                                : 'bg-[#FAF8F5] border border-[#E5DFD5] text-[#52606D]'
                            }`}
                          >
                            {problem}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Thanh chip: 📍 Gần tôi nhất + Danh mục trượt ngang */}
                <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  <button
                    type="button"
                    onClick={handleToggleSortByNearest}
                    aria-pressed={sortByNearest}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 shadow-sm inline-flex items-center gap-1 transition-colors ${
                      sortByNearest
                        ? 'bg-[#D96B38] text-white'
                        : 'bg-white/95 text-[#D96B38] border border-[#D96B38]/40'
                    }`}
                  >
                    {isLocating && sortByNearest ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span aria-hidden="true">📍</span>
                    )}
                    <span>Gần tôi nhất</span>
                  </button>

                  {(['Tất cả', ...CRAFT_CATEGORIES] as const).map((category) => {
                    const active = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 shadow-sm transition-colors ${
                          active
                            ? 'bg-[#1F2933] text-white'
                            : 'bg-white/95 text-[#1F2933] border border-[#E5DFD5]'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>

                {/* Trạng thái Loading nhẹ & Lỗi mạng trên Mobile */}
                {isLoadingPublicData && (
                  <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E5DFD5] shadow-sm text-xs font-semibold text-[#3A6B5C]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Đang tải dữ liệu từ Supabase...</span>
                  </div>
                )}

                {publicDbError && (
                  <div
                    role="alert"
                    className="pointer-events-auto rounded-2xl bg-white/95 backdrop-blur-md border border-[#C84B31]/35 shadow-md px-3 py-2.5 flex items-center justify-between gap-2 text-xs text-[#A3361F]"
                  >
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <WifiOff className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-2 font-medium">
                        {publicDbError}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => void loadPublicArtisans()}
                      className="min-h-[34px] px-3 py-1 rounded-xl bg-[#C84B31] text-white font-semibold whitespace-nowrap shrink-0"
                    >
                      Thử lại
                    </button>
                  </div>
                )}
              </div>

              {/* Bản đồ tương tác Leaflet + OpenStreetMap */}
              <div
                className={`w-full h-full ${
                  mobileViewMode === 'list' ? 'hidden lg:block' : 'block'
                }`}
              >
                <ArtisanMap
                  artisans={filteredArtisans}
                  selectedArtisan={selectedArtisan}
                  hoveredArtisanId={hoveredArtisanId}
                  userLocation={userLocation}
                  isLocating={isLocating}
                  gpsError={gpsError}
                  routeInfo={routeInfo}
                  isRouting={isRouting}
                  travelMode={travelMode}
                  mobileMapVisible={mobileViewMode === 'map'}
                  onSelectArtisan={handleSelectArtisanFromMap}
                  onLocateUser={() => locateUser({ autoFallback: false })}
                  onUseDemoLocation={handleUseDemoLocation}
                  onChangeTravelMode={handleChangeTravelMode}
                  onClearRoute={() => setRouteInfo(null)}
                />
              </div>

              {/* Chế độ Danh sách trên Mobile */}
              {mobileViewMode === 'list' && (
                <div className="lg:hidden absolute inset-0 bg-[#FAF8F5] overflow-y-auto pt-[156px] pb-36 px-3.5 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-semibold text-[#52606D] tabular-nums">
                      Tìm thấy {filteredArtisans.length} góc thợ tại TP.HCM
                      {sortByNearest && userLocation ? ' · Gần nhất trước' : ''}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-xs font-semibold text-[#D96B38]"
                      >
                        Xóa lọc
                      </button>
                    )}
                  </div>

                  {isLoadingPublicData ? (
                    <div className="rounded-2xl bg-white border border-[#EBE5DC] p-6 text-center space-y-2">
                      <Loader2 className="w-6 h-6 text-[#D96B38] animate-spin mx-auto" />
                      <p className="text-sm font-semibold text-[#1F2933]">
                        Đang tải dữ liệu từ Supabase...
                      </p>
                    </div>
                  ) : publicDbError ? (
                    <div className="rounded-2xl bg-[#C84B31]/8 border border-[#C84B31]/25 p-5 text-center space-y-3">
                      <WifiOff className="w-6 h-6 text-[#C84B31] mx-auto" />
                      <p className="text-xs text-[#7A2B1B] font-medium">
                        {publicDbError}
                      </p>
                      <button
                        type="button"
                        onClick={() => void loadPublicArtisans()}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-[#C84B31] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Thử tải lại</span>
                      </button>
                    </div>
                  ) : filteredArtisans.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-[#EBE5DC] p-6 text-center space-y-3">
                      <p className="text-sm font-bold text-[#1F2933]">
                        {publicArtisans.length === 0 && isSupabaseConfigured
                          ? 'Chưa có cô chú thợ nào trên bản đồ'
                          : 'Chưa tìm thấy góc thợ phù hợp'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D96B38] text-white text-xs font-semibold"
                        >
                          Đặt lại bộ lọc
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredArtisans.map((artisan) => (
                      <ArtisanCard
                        key={artisan.id}
                        artisan={artisan}
                        isSelected={selectedArtisanId === artisan.id}
                        isHovered={false}
                        isFavorite={favoriteIdsSet.has(artisan.id)}
                        distanceKm={getDistanceForArtisan(artisan)}
                        onSelect={handleSelectArtisanFromList}
                        onHoverChange={() => {}}
                        onToggleFavorite={(id) => void handleToggleFavorite(id)}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Mini Artisan Card trượt lên ngay trên Bottom Bar trên Mobile */}
              {selectedArtisan &&
                mobileViewMode === 'map' &&
                !mobileDetailOpen && (
                  <div className="lg:hidden fixed left-3 right-3 bottom-[76px] z-[460]">
                    <div className="rounded-2xl bg-white border border-[#E5DFD5] shadow-xl p-3 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#F4EFE6]">
                          <ArtisanIllustration
                            variant={selectedArtisan.illustrationVariant}
                            customImageUrl={selectedArtisan.customImageUrl}
                            alt={selectedArtisan.name}
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-[#1F2933] leading-snug line-clamp-2">
                              {selectedArtisan.name}
                            </h3>
                            <button
                              type="button"
                              onClick={handleCloseSelectedArtisan}
                              aria-label="Đóng thẻ xem nhanh"
                              className="w-8 h-8 -mr-1 -mt-1 rounded-lg text-[#7B8794] flex items-center justify-center shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
                            {miniCardStatus && (
                              <span
                                className={`font-semibold ${miniCardStatus.textClass}`}
                              >
                                {miniCardStatus.label}
                              </span>
                            )}
                            <span className="text-[#CBD2D9]">·</span>
                            <span className="font-bold text-[#1F2933] tabular-nums">
                              {selectedArtisan.minPriceLabel}
                            </span>
                            {typeof miniCardDistance === 'number' && (
                              <>
                                <span className="text-[#CBD2D9]">·</span>
                                <span className="inline-flex items-center gap-0.5 text-[#D96B38] font-semibold tabular-nums">
                                  <Navigation className="w-3 h-3" />
                                  {formatDistanceWithPrefix(miniCardDistance)}
                                </span>
                              </>
                            )}
                          </div>

                          <p className="text-[11px] text-[#52606D] line-clamp-1">
                            {selectedArtisan.addressLandmark}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMobileDetailOpen(true)}
                          className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-xs font-semibold text-[#1F2933]"
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDrawRouteFromDetail(selectedArtisan)
                          }
                          className="min-h-[44px] px-3 py-2 rounded-xl bg-[#3A6B5C] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Vẽ đường</span>
                        </button>
                        <a
                          href={buildGoogleMapsDirectionsUrl(
                            selectedArtisan.coordinates,
                            userLocation?.coords,
                            travelMode
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-[#D96B38] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap"
                        >
                          <span>Chỉ đường</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

              {/* Nút nổi chuyển chế độ Bản đồ <-> Danh sách trên Mobile */}
              {(!selectedArtisan || mobileViewMode === 'list') && (
                <div className="lg:hidden fixed left-1/2 -translate-x-1/2 bottom-[82px] z-[455]">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileViewMode((m) => (m === 'map' ? 'list' : 'map'))
                    }
                    className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1F2933] text-white text-xs font-semibold shadow-lg inline-flex items-center gap-2 active:scale-[0.98] transition-transform whitespace-nowrap"
                  >
                    {mobileViewMode === 'map' ? (
                      <>
                        <List className="w-4 h-4" />
                        <span>Danh sách ({filteredArtisans.length})</span>
                      </>
                    ) : (
                      <>
                        <MapIcon className="w-4 h-4" />
                        <span>Xem bản đồ</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Bottom Sheet Chi tiết toàn màn hình trên Mobile */}
              {selectedArtisan && mobileDetailOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
                  <ArtisanDetail
                    artisan={selectedArtisan}
                    distanceKm={getDistanceForArtisan(selectedArtisan)}
                    userLocation={userLocation}
                    routeInfo={routeInfo}
                    isRouting={isRouting}
                    travelMode={travelMode}
                    userKudosKeys={kudosReactedMap[selectedArtisan.id] ?? []}
                    approvedThankYouNotes={selectedArtisanApprovedThanks}
                    isFavorite={favoriteIdsSet.has(selectedArtisan.id)}
                    currentUserDisplayName={
                      currentUser?.displayName || currentUser?.name || ''
                    }
                    onBack={() => setMobileDetailOpen(false)}
                    onShare={handleShareArtisan}
                    onToggleFavorite={(id) => void handleToggleFavorite(id)}
                    onMarkRevived={handleMarkRevived}
                    onSubmitThankYou={handleSubmitThankYou}
                    onDrawRoute={handleDrawRouteFromDetail}
                    onChangeTravelMode={handleChangeTravelMode}
                    onOpenQr={setQrModalArtisan}
                    onOpenStatusReport={handleRequestStatusReport}
                    onToggleKudos={handleToggleKudos}
                    onAddPraise={handleAddPraise}
                  />
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'news' && (
          <div
            ref={pageScrollRef}
            className="h-full overflow-y-auto thin-scrollbar flex flex-col"
          >
            <div className="flex-1">
              <NewsView
                articles={articles}
                artisans={publicArtisans}
                selectedArticleKey={readingArticleKey}
                onSelectArticle={handleSelectArticle}
                isLoading={isLoadingArticles}
                error={articlesDbError}
                onRefresh={() => void loadPublicArticles()}
                onOpenArtisanOnMap={(artisanId) =>
                  navigateToTab('explore', { artisanId, skipScroll: true })
                }
              />
            </div>
            <SiteFooter
              currentUser={currentUser}
              onNavigate={handleNavigateTab}
              onOpenAuth={() => openAuthModal()}
              onOpenAdmin={handleOpenAdmin}
            />
          </div>
        )}

        {activeTab === 'suggest' && (
          <div
            ref={pageScrollRef}
            className="h-full overflow-y-auto thin-scrollbar flex flex-col"
          >
            <div className="flex-1">
              <SuggestArtisanView
                currentUser={currentUser}
                onRequestAuth={(prompt) => openAuthModal(prompt)}
                onSubmitPendingSuggestion={handleSubmitPendingSuggestion}
                onBackToExplore={() =>
                  navigateToTab('explore', { skipScroll: true })
                }
              />
            </div>
            <SiteFooter
              currentUser={currentUser}
              onNavigate={handleNavigateTab}
              onOpenAuth={() => openAuthModal()}
              onOpenAdmin={handleOpenAdmin}
            />
          </div>
        )}

        {activeTab === 'about' && (
          <div
            ref={pageScrollRef}
            className="h-full overflow-y-auto thin-scrollbar flex flex-col"
          >
            <div className="flex-1">
              <AboutView
                totalArtisans={publicArtisans.length}
                revivedCount={revivedCount}
                totalArticles={
                  articles.filter((a) => a.status === 'published').length
                }
                districtsCount={
                  new Set(
                    publicArtisans.map((a) => a.district).filter(Boolean)
                  ).size
                }
                onNavigate={handleNavigateTab}
              />
            </div>
            <SiteFooter
              currentUser={currentUser}
              onNavigate={handleNavigateTab}
              onOpenAuth={() => openAuthModal()}
              onOpenAdmin={handleOpenAdmin}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeTab={activeTab} onChangeTab={handleNavigateTab} />

      {/* Soft Auth Modal: chỉ mở khi khách bấm Đăng nhập hoặc các hành động tương tác */}
      <AuthModal
        isOpen={authModalState.open}
        defaultMode={authModalState.defaultMode}
        promptMessage={authModalState.prompt}
        onClose={closeAuthModal}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Modals: Huy hiệu, Góc thợ đã lưu, Lịch sử đóng góp, Mã QR & Báo tình trạng */}
      {badgeModalOpen && currentUser && (
        <BadgeModal
          stats={effectiveUserStats}
          syncedBadgeIds={currentUser.badges}
          onUpdateDisplayName={(nextName) =>
            void handleUpdateMyDisplayName(nextName)
          }
          onClose={() => setBadgeModalOpen(false)}
        />
      )}

      {savedModalOpen && currentUser && (
        <SavedArtisansModal
          savedArtisans={savedArtisans}
          onSelectArtisan={(artisan) => {
            setSavedModalOpen(false);
            navigateToTab('explore', {
              artisanId: artisan.id,
              skipScroll: true,
            });
          }}
          onRemoveFavorite={(id) => void handleToggleFavorite(id)}
          onClose={() => setSavedModalOpen(false)}
        />
      )}

      {contributionsModalOpen && currentUser && (
        <ContributionHistoryModal
          items={userContributions}
          isLoading={isLoadingContributions}
          onRefresh={() => void loadUserContributions(currentUser)}
          onOpenApprovedArtisan={(artisanId) => {
            setContributionsModalOpen(false);
            navigateToTab('explore', { artisanId, skipScroll: true });
          }}
          onSuggestNew={() => handleNavigateTab('suggest')}
          onClose={() => setContributionsModalOpen(false)}
        />
      )}

      {qrModalArtisan && (
        <QrDirectionsModal
          key={qrModalArtisan.id}
          artisan={qrModalArtisan}
          userOrigin={userLocation?.coords}
          travelMode={travelMode}
          onClose={() => setQrModalArtisan(null)}
        />
      )}

      {reportModalArtisan && (
        <StatusReportModal
          key={reportModalArtisan.id}
          artisan={reportModalArtisan}
          onClose={() => setReportModalArtisan(null)}
          onSubmitReport={handleSubmitStatusReport}
        />
      )}

      {/* Toast thông báo gọn nhẹ */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] sm:max-w-md pointer-events-none"
        >
          <div className="bg-[#1F2933] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#7CD4B2] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
