import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Heart,
  Loader2,
  LocateFixed,
  LogIn,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Tag,
  WifiOff,
  X,
} from 'lucide-react';
import { INITIAL_ARTICLES } from './data/articles';
import { GTQT_LOGO_SRC } from './data/team';
import {
  CRAFT_CATEGORIES,
  DEFAULT_REVIVED_ITEMS_COUNT,
  DEFAULT_USER_CONTRIBUTION,
  FALLBACK_NEARBY_LOCATION,
  INITIAL_ADMIN_ACCOUNTS,
  INITIAL_ARTISANS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PENDING_SUGGESTIONS,
  INITIAL_STATUS_REPORTS,
  INITIAL_THANK_YOU_NOTES,
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
} from './utils/geo';
import { searchAndRankArtisans } from './utils/searchArtisans';
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
import { ArtisanIllustration } from './components/ArtisanIllustration';
import { ArtisanMap } from './components/ArtisanMap';
import { AuthModal, DEFAULT_SOFT_AUTH_PROMPT } from './components/AuthModal';
import { BadgeModal, evaluateUserBadges } from './components/BadgeModal';
import { CommunityView } from './components/CommunityView';
import { CraftsmanProfileView } from './components/CraftsmanProfileView';
import { HomeDiscoveryView } from './components/HomeDiscoveryView';
import { LocationSelector } from './components/LocationSelector';
import { QrDirectionsModal, StatusReportModal } from './components/Modals';
import {
  DesktopNavbar,
  MobileBottomNav,
  MobileTopHeader,
} from './components/Navbar';
import { NewsView } from './components/NewsView';
import { PriceComparisonModal } from './components/PriceComparisonModal';
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

  // Mobile UX & Map Modal states
  const [mapBottomSheetExpanded, setMapBottomSheetExpanded] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mapPriceModalOpen, setMapPriceModalOpen] = useState(false);

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
        setMapBottomSheetExpanded(false);
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

  // Lọc & sắp xếp danh sách người thợ công khai dùng chung thuật toán tìm kiếm thông minh Việt–Anh
  const filteredArtisans = useMemo(() => {
    const preFiltered = publicArtisans.filter((artisan) => {
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

      return true;
    });

    return searchAndRankArtisans(preFiltered, searchQuery, {
      userCoords: userLocation?.coords ?? null,
      sortByNearest,
    }).map((item) => item.artisan);
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
      setMapBottomSheetExpanded(false);

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
        tab === 'explore' || tab === 'artisan'
          ? (options?.artisanId ?? null)
          : null;
      const nextArticleKey =
        tab === 'news' ? (options?.articleKey ?? null) : null;

      setIsAdminView(false);
      setActiveTab(tab);
      setSelectedArtisanId(nextArtisanId);
      setReadingArticleKey(nextArticleKey);

      if (tab === 'explore') {
        setMapBottomSheetExpanded(false);
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
      setMapBottomSheetExpanded(false);
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
      setMapBottomSheetExpanded(false);
      syncUrlToHistory(
        buildRouteUrl({ tab: 'explore', artisanId: artisan.id }),
        'push'
      );
    },
    [syncUrlToHistory]
  );

  const handleCloseSelectedArtisan = useCallback(() => {
    setSelectedArtisanId(null);
    syncUrlToHistory(buildRouteUrl({ tab: 'explore', artisanId: null }), 'push');
  }, [syncUrlToHistory]);

  const handleSelectArtisanFromHome = useCallback(
    (artisan: Artisan) => {
      setRouteInfo((prev) => (prev?.artisanId === artisan.id ? prev : null));
      navigateToTab('explore', { artisanId: artisan.id, skipScroll: true });
    },
    [navigateToTab]
  );

  const handleOpenArtisanProfile = useCallback(
    (artisanOrId: Artisan | string) => {
      const artisanId =
        typeof artisanOrId === 'string' ? artisanOrId : artisanOrId.id;
      navigateToTab('artisan', { artisanId });
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
      <div className="min-h-[100dvh] bg-[#FDF8F2] text-[#162442] flex flex-col items-center justify-center p-6 gap-4 text-center relative">
        <div className="craft-paper-grain" aria-hidden="true" />
        <span className="w-16 h-16 rounded-full overflow-hidden bg-white ring-2 ring-[#1B3B82]/20 shadow-[3px_3px_0px_#1B3B82] flex items-center justify-center">
          <img
            src={GTQT_LOGO_SRC}
            alt="Góc Thợ Quanh Ta"
            className="w-full h-full object-cover scale-[1.07]"
          />
        </span>
        <div className="flex items-center gap-2 font-display text-sm font-bold text-[#162442]">
          <Loader2 className="w-4 h-4 text-[#E86F2C] animate-spin" />
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

          <div className="craft-paper-grain" aria-hidden="true" />

          {toastMessage && (
            <div
              role="status"
              aria-live="polite"
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] max-w-[90vw] sm:max-w-md pointer-events-none"
            >
              <div className="bg-[#162442] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-2xl border border-[#1B3B82] shadow-[3px_3px_0px_#E86F2C] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E86F2C] shrink-0" />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}
        </>
      );
    }

    // Chưa đăng nhập hoặc tài khoản user thường khi truy cập /quan-tri
    return (
      <div className="min-h-[100dvh] bg-[#FDF8F2] text-[#162442] flex flex-col items-center justify-center p-5 sm:p-8 relative">
        <div className="craft-paper-grain" aria-hidden="true" />
        <div className="w-full max-w-md rounded-3xl bg-white border-2 border-[#162442] shadow-[6px_6px_0px_#1B3B82] p-7 sm:p-9 text-center space-y-6 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white ring-2 ring-[#1B3B82]/20 shadow-md">
                <img
                  src={GTQT_LOGO_SRC}
                  alt="Góc Thợ Quanh Ta"
                  className="w-full h-full object-cover scale-[1.07]"
                />
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                  currentUser
                    ? 'bg-[#FFF3EB] text-[#B93818]'
                    : 'bg-[#EEF2FA] text-[#1B3B82]'
                }`}
              >
                {currentUser ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
              </span>
            </div>
          </div>

          {currentUser ? (
            <div className="space-y-2">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#B93818]">
                Quản trị · Góc Thợ Quanh Ta
              </p>
              <h1 className="font-display text-xl font-bold text-[#162442] tracking-tight">
                Tài khoản của bạn chưa có quyền truy cập trang Quản trị
              </h1>
              <p className="text-sm text-[#5C564E] leading-relaxed">
                Bạn đang đăng nhập với tài khoản{' '}
                <strong className="font-bold text-[#162442]">
                  {currentUser.displayName || currentUser.name}
                </strong>
                . Trang này chỉ dành cho Super Admin hoặc Cộng tác viên.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#1B3B82]">
                Quản trị · Góc Thợ Quanh Ta
              </p>
              <h1 className="font-display text-xl font-bold text-[#162442] tracking-tight">
                Đăng nhập tài khoản Quản trị / CTV
              </h1>
              <p className="text-sm text-[#5C564E] leading-relaxed">
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
                className="w-full min-h-[46px] px-5 py-2.5 rounded-full bg-[#1B3B82] hover:bg-[#142D66] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all shadow-[3px_3px_0px_#E86F2C] active:translate-y-0.5"
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
                className="w-full min-h-[46px] px-5 py-2.5 rounded-full bg-[#FDF8F2] hover:bg-[#EEF2FA] border border-[#DFCBB5] text-[#162442] text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4 text-[#5C564E]" />
                <span>Đăng xuất để đổi tài khoản</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigateToTab('home')}
              className="w-full min-h-[44px] px-5 py-2.5 rounded-full border border-[#DFCBB5] hover:border-[#1B3B82] bg-white hover:bg-[#FDF8F2] text-[#5C564E] hover:text-[#162442] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
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
            <div className="bg-[#25292E] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-2xl border border-[#3A4048] shadow-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D46534] shrink-0" />
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
    <div className="h-[100dvh] lg:h-screen flex flex-col bg-[#F7F2E8] text-[#25292E] overflow-hidden relative">
      <div className="craft-paper-grain" aria-hidden="true" />
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

      {/* Mobile Top Header trên các trang nội dung */}
      {activeTab !== 'explore' && (
        <MobileTopHeader
          activeTab={activeTab}
          onChangeTab={handleNavigateTab}
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
                articles={articles}
                revivedCount={revivedCount}
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
                onOpenArtisanProfile={handleOpenArtisanProfile}
                onOpenFullMap={handleOpenFullMap}
                onOpenArticle={(articleId) =>
                  navigateToTab('news', { articleKey: articleId })
                }
                onNavigateTab={handleNavigateTab}
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
          <div className="relative w-full h-full overflow-hidden isolate">
            {/* Bản đồ OpenStreetMap tràn toàn màn hình (Full-bleed z-0) */}
            <div className="absolute inset-0 z-0">
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
                mobileMapVisible={!mapBottomSheetExpanded}
                onSelectArtisan={handleSelectArtisanFromMap}
                onLocateUser={() => locateUser({ autoFallback: false })}
                onUseDemoLocation={handleUseDemoLocation}
                onChangeTravelMode={handleChangeTravelMode}
                onClearRoute={() => setRouteInfo(null)}
              />
            </div>

            {/* =======================================================
                1. THANH TÌM KIẾM & BỘ LỌC NỔI PHÍA TRÊN (TOP FLOATING BAR)
               ======================================================= */}
            <div className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-[1000] flex flex-col md:flex-row md:items-center gap-2.5 pointer-events-none">
              {/* Ô tìm kiếm dạng viên thuốc */}
              <div className="pointer-events-auto w-full md:w-[340px] lg:w-[360px] shrink-0 bg-white/98 backdrop-blur-md rounded-full shadow-md border border-[#E8DFD1] px-4 py-2 flex items-center gap-2.5 focus-within:border-[#1B3B82] focus-within:ring-2 focus-within:ring-[#1B3B82]/12 transition-all">
                <Search className="w-4 h-4 text-[#615D57] shrink-0 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm lỗi cần sửa, tên đường, phường..."
                  aria-label="Tìm lỗi cần sửa, tên đường hoặc phường xã"
                  className="flex-1 min-w-0 h-7 bg-transparent text-sm text-[#25292E] placeholder:text-[#8E877E] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Xóa từ khóa tìm kiếm"
                    className="w-6 h-6 rounded-full text-[#8E877E] hover:text-[#25292E] hover:bg-[#F7F2E8] flex items-center justify-center shrink-0 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleToggleSortByNearest}
                  disabled={isLocating}
                  aria-label="Định vị GPS gần tôi nhất"
                  title={
                    userLocation?.source === 'gps'
                      ? 'Đã định vị GPS — bấm để xếp theo khoảng cách gần nhất'
                      : 'Định vị gần tôi nhất'
                  }
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    userLocation?.source === 'gps'
                      ? 'bg-[#EDF3EE] text-[#4F6B54] border border-[#4F6B54]/30'
                      : sortByNearest
                        ? 'bg-[#FDF0E9] text-[#D46534] border border-[#D46534]/30'
                        : 'text-[#615D57] hover:text-[#4F6B54] hover:bg-[#F7F2E8]'
                  }`}
                >
                  {isLocating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LocateFixed className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Hàng Chip bộ lọc cuộn ngang mượt ngay bên phải */}
              <div className="pointer-events-auto flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {CRAFT_CATEGORIES.map((category) => {
                  const active = selectedCategory === category;
                  const activeTone: Record<CraftCategory, string> = {
                    'Sửa giày dép':
                      'bg-[#D46534] border-[#D46534] text-white shadow-sm',
                    'May vá':
                      'bg-[#DCE7F7] border-[#1B3B82]/35 text-[#1B3B82] shadow-sm',
                    'Sửa khóa':
                      'bg-[#EFE4D2] border-[#8A673B]/35 text-[#4A3519] shadow-sm',
                    'Sửa đồng hồ':
                      'bg-[#E5EFE7] border-[#4F6B54]/40 text-[#2E4A34] shadow-sm',
                    'Sửa balo/túi':
                      'bg-[#F6E2D6] border-[#B93818]/35 text-[#8E2E14] shadow-sm',
                  };
                  return (
                    <button
                      key={category}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setSelectedCategory(active ? 'Tất cả' : category)
                      }
                      className={`h-9 rounded-full px-3.5 text-xs md:text-sm font-medium transition-all shrink-0 inline-flex items-center gap-1.5 border ${
                        active
                          ? activeTone[category]
                          : 'bg-white/95 backdrop-blur-sm border-[#25292E]/25 text-[#25292E] hover:border-[#25292E]/60 shadow-xs'
                      }`}
                    >
                      <span className="whitespace-nowrap">{category}</span>
                      {active && <X className="w-3.5 h-3.5 opacity-85 shrink-0" />}
                    </button>
                  );
                })}

                {/* Combobox chọn Phường / Xã / Đặc khu (168 đơn vị TP.HCM) */}
                <LocationSelector
                  mode="filter"
                  variant="pill"
                  value={selectedDistrict}
                  onChange={(nextVal) =>
                    setSelectedDistrict(nextVal as District | 'Tất cả khu vực')
                  }
                  artisans={publicArtisans}
                  onSuggestArtisan={() => handleNavigateTab('suggest')}
                  placeholder="Khu vực"
                />

                {/* Chip gạt Đang làm việc */}
                <button
                  type="button"
                  aria-pressed={onlyWorking}
                  onClick={() => setOnlyWorking((prev) => !prev)}
                  className={`h-9 rounded-full px-3.5 text-xs md:text-sm font-medium transition-all shrink-0 inline-flex items-center gap-1.5 border ${
                    onlyWorking
                      ? 'bg-[#4F6B54] border-[#4F6B54] text-white shadow-sm'
                      : 'bg-white/95 backdrop-blur-sm border-[#25292E]/25 text-[#25292E] hover:border-[#25292E]/60 shadow-xs'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      onlyWorking ? 'bg-white' : 'bg-[#4F6B54]'
                    }`}
                  />
                  <span className="whitespace-nowrap">Đang làm việc</span>
                  {onlyWorking && <X className="w-3.5 h-3.5 opacity-90 shrink-0" />}
                </button>

                {/* Nút viên thuốc tương phản đậm mở Modal So sánh giá */}
                <button
                  type="button"
                  onClick={() => setMapPriceModalOpen(true)}
                  title="So sánh chi phí sửa chữa và mua mới"
                  className="h-9 rounded-full px-4 bg-[#162442] hover:bg-[#1B3B82] text-white border border-[#162442] shadow-sm text-xs md:text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors md:ml-auto"
                >
                  <Tag className="w-3.5 h-3.5 text-[#F2A67E]" />
                  <span className="whitespace-nowrap">So sánh giá</span>
                </button>
              </div>
            </div>

            {/* Trạng thái Loading nhẹ & Lỗi mạng trên Mobile */}
            {(isLoadingPublicData || publicDbError) && (
              <div className="md:hidden absolute top-[116px] left-3 right-3 z-[990] pointer-events-none flex flex-col gap-2">
                {isLoadingPublicData && (
                  <div className="pointer-events-auto self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E8DFD1] shadow-sm text-xs font-semibold text-[#1B3B82]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-[#D46534]" />
                    <span>Đang tải bản đồ...</span>
                  </div>
                )}
                {publicDbError && (
                  <div
                    role="alert"
                    className="pointer-events-auto rounded-2xl bg-white/95 backdrop-blur-md border border-[#B93818]/35 shadow-md px-3 py-2.5 flex items-center justify-between gap-2 text-xs text-[#B93818]"
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
                      className="min-h-[34px] px-3 py-1 rounded-xl bg-[#B93818] text-white font-bold whitespace-nowrap shrink-0"
                    >
                      Thử lại
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* =======================================================
                2. BẢNG KẾT QUẢ NỔI BÊN TRÁI (FLOATING RESULTS PANEL — DESKTOP)
               ======================================================= */}
            <aside className="hidden md:flex flex-col absolute left-4 top-[76px] bottom-20 lg:bottom-4 w-[340px] lg:w-[360px] z-[999] bg-[#FAF6EE]/95 backdrop-blur-md rounded-3xl shadow-xl border border-[#E8DFD1] overflow-hidden">
              {/* Header bảng kết quả */}
              <div className="px-4 py-3.5 border-b border-[#E8DFD1] bg-white/75 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-baseline gap-2 min-w-0">
                  <h2 className="font-display text-base font-extrabold text-[#25292E] tracking-tight">
                    Kết quả
                  </h2>
                  <span className="font-mono text-xs font-semibold text-[#615D57] tabular-nums whitespace-nowrap">
                    {filteredArtisans.length} góc thợ
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleToggleSortByNearest}
                    aria-pressed={sortByNearest}
                    className={`h-7 px-2.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                      sortByNearest
                        ? 'bg-[#FDF0E9] text-[#D46534] border border-[#D46534]/30'
                        : 'bg-[#F7F2E8] text-[#615D57] hover:text-[#25292E] border border-[#E8DFD1]'
                    }`}
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Gần nhất</span>
                  </button>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      title="Đặt lại bộ lọc"
                      className="h-7 px-2 rounded-full text-[11px] font-semibold text-[#B93818] hover:bg-[#B93818]/10 transition-colors whitespace-nowrap"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>
              </div>

              {/* Danh sách thẻ người thợ cuộn dọc */}
              <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-2.5">
                {isLoadingPublicData ? (
                  <div className="rounded-2xl bg-white border border-[#E8DFD1] p-6 text-center space-y-2.5 mt-3">
                    <Loader2 className="w-6 h-6 text-[#D46534] animate-spin mx-auto" />
                    <p className="font-display text-sm font-bold text-[#25292E]">
                      Đang tải danh sách cô chú thợ...
                    </p>
                    <p className="text-xs text-[#615D57]">
                      Đang đồng bộ dữ liệu trực tuyến từ cơ sở dữ liệu.
                    </p>
                  </div>
                ) : publicDbError ? (
                  <div
                    role="alert"
                    className="rounded-2xl bg-[#B93818]/8 border border-[#B93818]/25 p-5 text-center space-y-3 mt-3"
                  >
                    <WifiOff className="w-7 h-7 text-[#B93818] mx-auto" />
                    <div className="space-y-1">
                      <p className="font-display text-sm font-bold text-[#B93818]">
                        Không thể tải dữ liệu
                      </p>
                      <p className="text-xs text-[#7A2B1B] leading-relaxed">
                        {publicDbError}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadPublicArtisans()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B93818] hover:bg-[#992C12] text-white text-xs font-bold transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Thử tải lại</span>
                    </button>
                  </div>
                ) : filteredArtisans.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-dashed border-[#DDD2C2] p-6 text-center space-y-3 mt-3">
                    <MapPin className="w-8 h-8 text-[#D46534]/65 mx-auto" />
                    <div className="space-y-1">
                      <p className="font-display text-sm font-bold text-[#25292E]">
                        {publicArtisans.length === 0 && isSupabaseConfigured
                          ? 'Chưa có cô chú thợ nào trên bản đồ'
                          : 'Chưa tìm thấy góc thợ phù hợp'}
                      </p>
                      <p className="text-xs text-[#615D57] leading-relaxed">
                        {publicArtisans.length === 0 && isSupabaseConfigured
                          ? 'Quản trị viên có thể vào mục Quản trị để nạp dữ liệu vào hệ thống.'
                          : 'Thử xóa bớt bộ lọc hoặc gõ từ khóa tự nhiên như “may áo”, “hở keo giày”, “lên lai” nhé.'}
                      </p>
                    </div>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D46534] hover:bg-[#BC5326] text-white text-xs font-semibold transition-colors"
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
            </aside>

            {/* =======================================================
                3. DESKTOP FLOATING QUICK-DETAIL CARD (ngay cạnh bảng kết quả)
               ======================================================= */}
            {selectedArtisan && (
              <div className="hidden md:block absolute left-[372px] lg:left-[392px] bottom-20 lg:bottom-4 z-[998] w-[372px] max-w-[calc(100%-410px)]">
                <div className="rounded-3xl bg-white/98 backdrop-blur-md border border-[#E8DFD1] shadow-2xl overflow-hidden">
                  <div className="p-4 space-y-3.5">
                    <div className="flex items-start gap-3.5">
                      <div className="w-22 h-22 rounded-2xl overflow-hidden shrink-0 bg-[#F7F2E8] border border-[#E8DFD1]">
                        <ArtisanIllustration
                          variant={selectedArtisan.illustrationVariant}
                          customImageUrl={
                            selectedArtisan.hidePortrait
                              ? undefined
                              : selectedArtisan.customImageUrl
                          }
                          alt={selectedArtisan.name}
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-base font-bold text-[#25292E] leading-snug line-clamp-2">
                            {selectedArtisan.name}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0 -mr-1 -mt-1">
                            <button
                              type="button"
                              onClick={() =>
                                void handleToggleFavorite(selectedArtisan.id)
                              }
                              aria-label={
                                favoriteIdsSet.has(selectedArtisan.id)
                                  ? 'Bỏ lưu góc thợ'
                                  : 'Lưu góc thợ'
                              }
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                favoriteIdsSet.has(selectedArtisan.id)
                                  ? 'text-[#B93818] bg-[#B93818]/10'
                                  : 'text-[#8E8880] hover:text-[#B93818] hover:bg-[#F7F2E8]'
                              }`}
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  favoriteIdsSet.has(selectedArtisan.id)
                                    ? 'fill-current'
                                    : ''
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={handleCloseSelectedArtisan}
                              aria-label="Đóng thẻ xem nhanh"
                              className="w-8 h-8 rounded-lg text-[#8E8880] hover:text-[#25292E] hover:bg-[#F7F2E8] flex items-center justify-center transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          {miniCardStatus && (
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${miniCardStatus.textClass}`}
                            >
                              {miniCardStatus.label}
                            </span>
                          )}
                          <span className="text-[#DDD2C2]">·</span>
                          <span className="text-[#615D57] font-medium">
                            {selectedArtisan.district}
                          </span>
                          {typeof miniCardDistance === 'number' && (
                            <>
                              <span className="text-[#DDD2C2]">·</span>
                              <span className="font-mono font-semibold text-[#1B3B82] tabular-nums">
                                {formatDistanceWithPrefix(miniCardDistance)}
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-xs text-[#615D57] line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#D46534] shrink-0" />
                          <span className="truncate">
                            {selectedArtisan.addressLandmark}
                          </span>
                        </p>

                        <p className="text-[11px] text-[#615D57] flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#8E8880] shrink-0" />
                          <span className="truncate">
                            {selectedArtisan.hours}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Tóm tắt giá 2 dịch vụ tiêu biểu */}
                    {selectedArtisan.prices.length > 0 && (
                      <div className="rounded-2xl bg-[#F7F2E8]/80 border border-dashed border-[#DDD2C2] px-3 py-2 space-y-1">
                        {selectedArtisan.prices.slice(0, 2).map((item) => (
                          <div
                            key={item.service}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="text-[#615D57] truncate">
                              {item.service}
                            </span>
                            <span className="font-mono font-semibold text-[#D46534] tabular-nums shrink-0">
                              {item.priceRange}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Các nút hành động trực tiếp */}
                    <div className="flex items-center gap-2">
                      <a
                        href={buildGoogleMapsDirectionsUrl(
                          selectedArtisan.coordinates,
                          userLocation?.coords,
                          travelMode
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 h-10 px-3 rounded-xl bg-[#D46534] hover:bg-[#BC5326] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <span>Chỉ đường</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {selectedArtisan.phone ? (
                        <a
                          href={`tel:${selectedArtisan.phone.replace(/\s+/g, '')}`}
                          className="h-10 px-3 rounded-xl bg-[#EDF3EE] hover:bg-[#DFEBDF] border border-[#4F6B54]/25 text-[#4F6B54] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Gọi điện</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleDrawRouteFromDetail(selectedArtisan)
                          }
                          className="h-10 px-3 rounded-xl bg-[#EEF2FA] hover:bg-[#E1E9F8] border border-[#1B3B82]/20 text-[#1B3B82] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Vẽ đường</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenArtisanProfile(selectedArtisan)}
                      className="w-full h-10 px-4 rounded-xl bg-[#25292E] hover:bg-[#1B3B82] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Xem hồ sơ & câu chuyện</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =======================================================
                4. MOBILE BOTTOM SHEET (2 trạng thái + Thẻ xem nhanh cô chú)
               ======================================================= */}
            <div className="md:hidden fixed left-0 right-0 bottom-16 z-[999] px-2.5 pb-2 pointer-events-none">
              {selectedArtisan ? (
                <div className="pointer-events-auto rounded-3xl bg-white border border-[#E8DFD1] shadow-2xl p-3.5 space-y-3">
                  <div className="w-10 h-1 rounded-full bg-[#DDD2C2] mx-auto" />
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-[#F7F2E8] border border-[#E8DFD1]">
                      <ArtisanIllustration
                        variant={selectedArtisan.illustrationVariant}
                        customImageUrl={
                          selectedArtisan.hidePortrait
                            ? undefined
                            : selectedArtisan.customImageUrl
                        }
                        alt={selectedArtisan.name}
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-sm font-bold text-[#25292E] leading-snug line-clamp-2">
                          {selectedArtisan.name}
                        </h3>
                        <div className="flex items-center gap-0.5 shrink-0 -mr-1 -mt-1">
                          <button
                            type="button"
                            onClick={() =>
                              void handleToggleFavorite(selectedArtisan.id)
                            }
                            aria-label={
                              favoriteIdsSet.has(selectedArtisan.id)
                                ? 'Bỏ lưu góc thợ'
                                : 'Lưu góc thợ'
                            }
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              favoriteIdsSet.has(selectedArtisan.id)
                                ? 'text-[#B93818]'
                                : 'text-[#8E8880]'
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                favoriteIdsSet.has(selectedArtisan.id)
                                  ? 'fill-current'
                                  : ''
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={handleCloseSelectedArtisan}
                            aria-label="Đóng thẻ xem nhanh"
                            className="w-8 h-8 rounded-lg text-[#8E8880] hover:text-[#25292E] flex items-center justify-center shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
                        {miniCardStatus && (
                          <span
                            className={`font-semibold ${miniCardStatus.textClass}`}
                          >
                            {miniCardStatus.label}
                          </span>
                        )}
                        <span className="text-[#DDD2C2]">·</span>
                        <span className="font-mono font-semibold text-[#D46534] tabular-nums">
                          {selectedArtisan.minPriceLabel}
                        </span>
                        {typeof miniCardDistance === 'number' && (
                          <>
                            <span className="text-[#DDD2C2]">·</span>
                            <span className="font-mono inline-flex items-center gap-0.5 text-[#1B3B82] font-semibold tabular-nums">
                              <Navigation className="w-3 h-3" />
                              {formatDistanceWithPrefix(miniCardDistance)}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-[11px] text-[#615D57] line-clamp-1">
                        {selectedArtisan.district} ·{' '}
                        {selectedArtisan.addressLandmark}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={buildGoogleMapsDirectionsUrl(
                        selectedArtisan.coordinates,
                        userLocation?.coords,
                        travelMode
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-[#D46534] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <span>Chỉ đường</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {selectedArtisan.phone ? (
                      <a
                        href={`tel:${selectedArtisan.phone.replace(/\s+/g, '')}`}
                        className="min-h-[42px] px-3 py-2 rounded-xl bg-[#EDF3EE] border border-[#4F6B54]/25 text-[#4F6B54] text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Gọi</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleDrawRouteFromDetail(selectedArtisan)
                        }
                        className="min-h-[42px] px-3 py-2 rounded-xl bg-[#EEF2FA] border border-[#1B3B82]/20 text-[#1B3B82] text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Vẽ đường</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenArtisanProfile(selectedArtisan)}
                      className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-[#25292E] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <span>Xem hồ sơ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`pointer-events-auto rounded-3xl bg-white border border-[#E8DFD1] shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
                    mapBottomSheetExpanded ? 'h-[62dvh]' : 'h-auto'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setMapBottomSheetExpanded((v) => !v)}
                    className="w-full px-4 py-3 flex flex-col items-center gap-1.5 bg-white shrink-0"
                  >
                    <span className="w-10 h-1 rounded-full bg-[#DDD2C2]" />
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#25292E]">
                        {mapBottomSheetExpanded
                          ? `Kết quả · ${filteredArtisans.length} góc thợ`
                          : `Xem ${filteredArtisans.length} góc thợ quanh đây`}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#D46534]">
                        {mapBottomSheetExpanded ? (
                          <>
                            <span>Thu gọn</span>
                            <ChevronDown className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>Mở danh sách</span>
                            <ChevronUp className="w-4 h-4" />
                          </>
                        )}
                      </span>
                    </div>
                  </button>

                  {mapBottomSheetExpanded && (
                    <div className="flex-1 overflow-y-auto thin-scrollbar bg-[#FAF6EE] border-t border-[#E8DFD1] p-3 space-y-2.5">
                      {hasActiveFilters && (
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-medium text-[#615D57]">
                            Đang bật bộ lọc
                          </span>
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="text-xs font-semibold text-[#D46534]"
                          >
                            Đặt lại bộ lọc
                          </button>
                        </div>
                      )}

                      {filteredArtisans.length === 0 ? (
                        <div className="rounded-2xl bg-white border border-dashed border-[#DDD2C2] p-5 text-center space-y-2">
                          <p className="text-xs font-bold text-[#25292E]">
                            Chưa tìm thấy góc thợ phù hợp
                          </p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="px-4 py-2 rounded-xl bg-[#D46534] text-white text-xs font-semibold"
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
                            onToggleFavorite={(id) =>
                              void handleToggleFavorite(id)
                            }
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'artisan' && (
          <div
            ref={pageScrollRef}
            className="h-full overflow-y-auto thin-scrollbar flex flex-col"
          >
            <div className="flex-1">
              {selectedArtisan ? (
                <CraftsmanProfileView
                  artisan={selectedArtisan}
                  distanceKm={getDistanceForArtisan(selectedArtisan)}
                  userLocation={userLocation}
                  travelMode={travelMode}
                  userKudosKeys={kudosReactedMap[selectedArtisan.id] ?? []}
                  approvedThankYouNotes={selectedArtisanApprovedThanks}
                  isFavorite={favoriteIdsSet.has(selectedArtisan.id)}
                  currentUserDisplayName={
                    currentUser?.displayName || currentUser?.name || ''
                  }
                  onBackToMap={() =>
                    navigateToTab('explore', { skipScroll: true })
                  }
                  onOpenOnMap={(artisan) =>
                    navigateToTab('explore', {
                      artisanId: artisan.id,
                      skipScroll: true,
                    })
                  }
                  onShare={handleShareArtisan}
                  onToggleFavorite={(id) => void handleToggleFavorite(id)}
                  onMarkRevived={handleMarkRevived}
                  onSubmitThankYou={handleSubmitThankYou}
                  onOpenQr={setQrModalArtisan}
                  onOpenStatusReport={handleRequestStatusReport}
                  onToggleKudos={handleToggleKudos}
                  onAddPraise={handleAddPraise}
                />
              ) : isLoadingPublicData ? (
                <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-3">
                  <Loader2 className="w-7 h-7 text-[#D46534] animate-spin mx-auto" />
                  <p className="font-display text-base font-bold text-[#25292E]">
                    Đang tải hồ sơ góc thợ...
                  </p>
                </div>
              ) : (
                <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FDF0E9] text-[#D46534] flex items-center justify-center mx-auto">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="font-display text-xl font-bold text-[#25292E]">
                      Không tìm thấy hồ sơ góc thợ này
                    </h2>
                    <p className="text-sm text-[#615D57]">
                      Có thể đường dẫn đã thay đổi hoặc cô chú vừa tạm ẩn khỏi
                      bản đồ công khai.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateToTab('explore', { skipScroll: true })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D46534] hover:bg-[#BC5326] text-white text-sm font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay về Bản đồ thợ</span>
                  </button>
                </div>
              )}
            </div>
            <SiteFooter
              currentUser={currentUser}
              onNavigate={handleNavigateTab}
              onOpenAuth={() => openAuthModal()}
              onOpenAdmin={handleOpenAdmin}
            />
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
                onOpenArtisanProfile={handleOpenArtisanProfile}
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

        {activeTab === 'community' && (
          <div
            ref={pageScrollRef}
            className="h-full overflow-y-auto thin-scrollbar flex flex-col"
          >
            <div className="flex-1">
              <CommunityView
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

      {/* Modal So sánh chi phí mở từ trang Bản đồ */}
      <PriceComparisonModal
        isOpen={mapPriceModalOpen}
        onClose={() => setMapPriceModalOpen(false)}
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
            handleOpenArtisanProfile(artisan);
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
            handleOpenArtisanProfile(artisanId);
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
          <div className="bg-[#25292E] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-2xl border border-[#3A4048] shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D46534] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
