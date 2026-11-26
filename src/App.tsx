import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  List,
  Loader2,
  Map as MapIcon,
  MapPin,
  Navigation,
  Recycle,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  WifiOff,
  X,
} from 'lucide-react';
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
  AppBackupPayload,
  AppTab,
  Artisan,
  ArtisanStatus,
  AuditCategory,
  AuditLogEntry,
  CraftCategory,
  District,
  KudosKey,
  PendingSuggestion,
  RouteInfo,
  StatusReport,
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
  formatVietnamDate,
  formatVietnamTimestamp,
  loadFromStorage,
  saveToStorage,
  STORAGE_KEYS,
  toIsoDate,
} from './utils/storage';
import {
  authenticateAdminDb,
  bulkInsertAdminAccountsDb,
  bulkUpsertArtisansDb,
  deleteAdminAccountDb,
  deleteArtisanDb,
  fetchAdminAccountsDb,
  fetchAllArtisansForAdmin,
  fetchApprovedArtisans,
  fetchStatusReportsDb,
  formatSupabaseError,
  insertAdminAccountDb,
  insertPendingArtisanDb,
  insertStatusReportDb,
  resolveStatusReportDb,
  updateArtisanFieldsDb,
  upsertApprovedArtisanDb,
} from './services/supabaseService';
import { isSupabaseConfigured, supabaseConfigWarning } from './supabaseClient';
import { AboutView } from './components/AboutView';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ArtisanCard, getStatusDisplay } from './components/ArtisanCard';
import { ArtisanDetail } from './components/ArtisanDetail';
import { ArtisanIllustration } from './components/ArtisanIllustration';
import { ArtisanMap } from './components/ArtisanMap';
import { BadgeModal, evaluateUserBadges } from './components/BadgeModal';
import { QrDirectionsModal, StatusReportModal } from './components/Modals';
import { DesktopNavbar, MobileBottomNav } from './components/Navbar';
import { SuggestArtisanView } from './components/SuggestArtisanView';

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
  const [activeTab, setActiveTab] = useState<AppTab>('explore');

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
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>(() =>
    isSupabaseConfigured ? [] : INITIAL_ADMIN_ACCOUNTS
  );

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

  // Phiên đăng nhập quản trị giữ trong bộ nhớ ứng dụng (không lưu mật khẩu/phiên xuống localStorage)
  const [currentAdmin, setCurrentAdmin] = useState<AdminAccount | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);

  // Đánh giá huy hiệu hiện tại của người dùng
  const badgeSummary = useMemo(
    () => evaluateUserBadges(userContribution),
    [userContribution]
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
    null
  );
  const [hoveredArtisanId, setHoveredArtisanId] = useState<string | null>(null);

  // Mobile UX states
  const [mobileViewMode, setMobileViewMode] = useState<'map' | 'list'>('map');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Định vị GPS & lộ trình OSRM
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
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
  const deepLinkHandledRef = useRef(false);

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
      const actor = actorOverride ?? currentAdmin;
      if (!actor) return;
      const entry: AuditLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: formatVietnamTimestamp(),
        actorName: actor.name,
        actorEmail: actor.email,
        action,
        category,
      };
      setAuditLogs((prev) => [entry, ...prev].slice(0, 300));
    },
    [currentAdmin]
  );

  // Helper ghi nhận đóng góp người dùng + báo chúc mừng khi mở khóa huy hiệu mới
  const recordUserContribution = useCallback(
    (
      field: 'suggestionsCount' | 'reportsCount' | 'revivedCount' | 'thanksCount',
      defaultToast: string
    ) => {
      const prevHighest = evaluateUserBadges(userContribution).highestUnlocked;
      const nextStats: UserContributionStats = {
        ...userContribution,
        [field]: userContribution[field] + 1,
      };
      const nextHighest = evaluateUserBadges(nextStats).highestUnlocked;
      setUserContribution(nextStats);

      if (nextHighest && nextHighest.id !== prevHighest?.id) {
        showToast(
          `🎉 Chúc mừng! Bạn vừa mở khóa huy hiệu "${nextHighest.title}" — bấm "🏅 Huy hiệu của tôi" để tải thẻ Story 9:16 nhé!`
        );
      } else {
        showToast(defaultToast);
      }
    },
    [userContribution, showToast]
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

  // Tải toàn bộ 3 bảng từ Supabase cho Khu Quản Trị
  const loadAdminData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingAdminData(true);
    setAdminDbError(null);
    try {
      const [artisanBundle, reports, accounts] = await Promise.all([
        fetchAllArtisansForAdmin(),
        fetchStatusReportsDb(),
        fetchAdminAccountsDb(),
      ]);
      setArtisans(artisanBundle.approved);
      setPendingSuggestions(artisanBundle.pending);
      setDbTotalArtisansCount(artisanBundle.totalCount);
      setStatusReports(reports);
      setAdminAccounts(accounts);
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
  }, []);

  // Tự động tải dữ liệu công khai khi mở ứng dụng
  useEffect(() => {
    if (isSupabaseConfigured) {
      void loadPublicArtisans();
    }
  }, [loadPublicArtisans]);

  // Khi mở Khu Quản Trị -> tải đầy đủ 3 bảng từ Supabase
  useEffect(() => {
    if (isAdminView && currentAdmin && isSupabaseConfigured) {
      void loadAdminData();
    }
  }, [isAdminView, currentAdmin, loadAdminData]);

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

  // Deep Linking (?tho=ID) - chờ dữ liệu từ Supabase tải xong rồi mới khớp ID
  useEffect(() => {
    if (deepLinkHandledRef.current || isLoadingPublicData) return;

    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('tho');
    if (!sharedId) {
      deepLinkHandledRef.current = true;
      return;
    }

    if (publicArtisans.length === 0) return;
    deepLinkHandledRef.current = true;

    const matched = publicArtisans.find((a) => a.id === sharedId);
    if (matched) {
      setActiveTab('explore');
      setSelectedArtisanId(matched.id);
      setMobileViewMode('map');
      setMobileDetailOpen(true);
    }
  }, [publicArtisans, isLoadingPublicData]);

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

  const locateUser = useCallback(
    (options?: {
      autoFallback?: boolean;
      onLocated?: (loc: UserLocation) => void;
    }) => {
      setGpsError(null);

      if (!('geolocation' in navigator)) {
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
          setIsLocating(false);
          setGpsError(null);
          showToast('Đã xác định vị trí GPS và sắp xếp cô chú gần bạn nhất!');
          options?.onLocated?.(loc);
        },
        () => {
          setIsLocating(false);
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

  const handleSelectArtisanFromList = useCallback((artisan: Artisan) => {
    setSelectedArtisanId(artisan.id);
    setRouteInfo((prev) => (prev?.artisanId === artisan.id ? prev : null));
    setMobileDetailOpen(true);
  }, []);

  const handleSelectArtisanFromMap = useCallback((artisan: Artisan) => {
    setSelectedArtisanId(artisan.id);
    setRouteInfo((prev) => (prev?.artisanId === artisan.id ? prev : null));
    setMobileDetailOpen(false);
  }, []);

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

  // Bộ đếm "Món đồ được hồi sinh" + đồng bộ Supabase + tích điểm Huy hiệu
  const handleMarkRevived = useCallback(
    async (artisan: Artisan) => {
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
        'Cảm ơn bạn đã chọn sửa chữa thay vì vứt bỏ! Bạn vừa giúp hồi sinh thêm 1 món đồ.'
      );
    },
    [recordUserContribution, showToast]
  );

  // Sổ lưu bút cảm ơn: người dùng gửi lời cảm ơn -> chờ duyệt + tích điểm Huy hiệu
  const handleSubmitThankYou = useCallback(
    (artisan: Artisan, payload: { author: string; message: string }) => {
      const newNote: ThankYouNote = {
        id: `thanks-${Date.now()}`,
        artisanId: artisan.id,
        artisanName: artisan.name,
        author: payload.author,
        message: payload.message,
        createdAt: formatVietnamDate(),
        approved: false,
      };
      setThankYouNotes((prev) => [newNote, ...prev]);
      recordUserContribution(
        'thanksCount',
        'Cảm ơn tấm lòng của bạn! Lời nhắn sẽ hiển thị sau khi đội ngũ Góc Thợ duyệt qua nhé.'
      );
    },
    [recordUserContribution]
  );

  // Quick Kudos 1 chạm + đồng bộ Supabase
  const handleToggleKudos = useCallback(
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

  // Bình luận trải nghiệm mới + đồng bộ Supabase
  const handleAddPraise = useCallback(
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

  // Gợi ý thợ mới -> Insert vào bảng artisans với approval_status = 'pending'
  const handleSubmitPendingSuggestion = useCallback(
    async (
      suggestion: PendingSuggestion
    ): Promise<{ ok: boolean; error?: string }> => {
      if (isSupabaseConfigured) {
        try {
          const saved = await insertPendingArtisanDb(suggestion);
          setPendingSuggestions((prev) => [saved, ...prev]);
          setDbTotalArtisansCount((c) => (typeof c === 'number' ? c + 1 : c));
        } catch (err) {
          const msg = formatSupabaseError(err);
          showToast(msg);
          return { ok: false, error: msg };
        }
      } else {
        setPendingSuggestions((prev) => [suggestion, ...prev]);
      }

      recordUserContribution(
        'suggestionsCount',
        'Đã gửi đề xuất vào mục Chờ duyệt của đội ngũ quản trị!'
      );
      return { ok: true };
    },
    [recordUserContribution, showToast]
  );

  // =======================================================
  // HANDLERS CHO KHU QUẢN TRỊ (SUPABASE + AUDIT LOG)
  // =======================================================
  const handleOpenAdmin = useCallback(() => {
    if (currentAdmin) {
      setIsAdminView(true);
    } else {
      setLoginModalOpen(true);
    }
  }, [currentAdmin]);

  // Kiểm tra đăng nhập Admin trên bảng admin_accounts của Supabase
  const handleAuthenticateAdmin = useCallback(
    async (
      identifier: string,
      password: string
    ): Promise<{ account: AdminAccount | null; error?: string }> => {
      if (isSupabaseConfigured) {
        try {
          const matched = await authenticateAdminDb(identifier, password);
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
            (acc.email.toLowerCase() === cleaned ||
              acc.name.toLowerCase() === cleaned) &&
            acc.password === password
        ) ?? null;
      return { account: matched };
    },
    [adminAccounts]
  );

  const handleLoginSuccess = useCallback(
    (account: AdminAccount) => {
      setCurrentAdmin(account);
      setLoginModalOpen(false);
      setIsAdminView(true);
      showToast(`Chào mừng ${account.name} đến Khu Quản Trị!`);
    },
    [showToast]
  );

  const handleLogoutAdmin = useCallback(() => {
    setCurrentAdmin(null);
    setIsAdminView(false);
    showToast('Đã đăng xuất khỏi Khu Quản Trị.');
    if (isSupabaseConfigured) {
      void loadPublicArtisans();
    }
  }, [showToast, loadPublicArtisans]);

  const handleExitAdminToMap = useCallback(() => {
    setIsAdminView(false);
    if (isSupabaseConfigured) {
      void loadPublicArtisans();
    }
  }, [loadPublicArtisans]);

  // Nút "Nạp 6 dữ liệu mẫu vào Database" khi bảng artisans trên Supabase đang trống
  const handleSeedInitialArtisans = useCallback(async () => {
    if (!isSupabaseConfigured || isSeedingDb) return;
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
  }, [isSeedingDb, pendingSuggestions.length, appendAuditLog, showToast]);

  // Thêm, sửa hoặc duyệt đề xuất (chuyển approval_status = 'approved' trên Supabase)
  const handleSaveArtisan = useCallback(
    async (saved: Artisan, approvedPendingId?: string) => {
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
    [artisans, appendAuditLog, showToast]
  );

  // Nút 1 chạm "✓ Xác nhận lại hôm nay" (Verification Reminder)
  const handleVerifyArtisanToday = useCallback(
    async (artisanId: string) => {
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
    [artisans, appendAuditLog, showToast]
  );

  const handleToggleArtisanVisibility = useCallback(
    async (artisanId: string) => {
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
    [artisans, selectedArtisanId, appendAuditLog, showToast]
  );

  const handleDeleteArtisan = useCallback(
    async (artisanId: string) => {
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
    [artisans, selectedArtisanId, appendAuditLog, showToast]
  );

  const handleRejectPending = useCallback(
    async (pendingId: string) => {
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
    [pendingSuggestions, appendAuditLog, showToast]
  );

  // Áp dụng trạng thái từ báo cáo -> cập nhật cả artisans.status & status_reports.is_resolved = true
  const handleApplyReportStatus = useCallback(
    async (report: StatusReport) => {
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
    [appendAuditLog, showToast]
  );

  const handleResolveReport = useCallback(
    async (reportId: string) => {
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
    [statusReports, appendAuditLog, showToast]
  );

  // Duyệt / Xóa lời cảm ơn trong Sổ lưu bút
  const handleApproveThankYou = useCallback(
    (noteId: string) => {
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
    [thankYouNotes, appendAuditLog, showToast]
  );

  const handleDeleteThankYou = useCallback(
    (noteId: string) => {
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
    [thankYouNotes, appendAuditLog, showToast]
  );

  const handleClearAuditLogs = useCallback(() => {
    if (currentAdmin?.role !== 'Super Admin') return;
    setAuditLogs([]);
    showToast('Đã xóa toàn bộ Nhật ký hoạt động.');
  }, [currentAdmin, showToast]);

  // Nhập hàng loạt cô chú thợ từ CSV -> đồng bộ lên bảng artisans
  const handleImportArtisansCsv = useCallback(
    async (imported: Artisan[], skipped: number) => {
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
    [appendAuditLog, showToast]
  );

  // Khôi phục toàn bộ dữ liệu từ file JSON Backup
  const handleRestoreBackupJson = useCallback(
    async (backup: AppBackupPayload) => {
      if (isSupabaseConfigured) {
        try {
          if (backup.artisans.length > 0) {
            await bulkUpsertArtisansDb(backup.artisans);
          }
          if (backup.adminAccounts.length > 0) {
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
        setAdminAccounts(backup.adminAccounts);
      }

      setThankYouNotes(backup.thankYouNotes);
      setRevivedCount(backup.revivedCount);

      const restoreLog: AuditLogEntry = {
        id: `log-restore-${Date.now()}`,
        timestamp: formatVietnamTimestamp(),
        actorName: currentAdmin?.name ?? 'Admin',
        actorEmail: currentAdmin?.email ?? 'admin@goctho.vn',
        action: `Đã khôi phục dữ liệu từ bản sao lưu JSON (${backup.artisans.length} cô chú thợ)`,
        category: 'data',
      };
      setAuditLogs([restoreLog, ...backup.auditLogs].slice(0, 300));
      showToast(
        `Đã khôi phục thành công ${backup.artisans.length} hồ sơ thợ và toàn bộ dữ liệu hệ thống!`
      );
    },
    [currentAdmin, loadAdminData, showToast]
  );

  const handleCreateAdminAccount = useCallback(
    async (payload: Omit<AdminAccount, 'id' | 'createdAt' | 'active'>) => {
      if (currentAdmin?.role !== 'Super Admin') return;
      const newAcc: AdminAccount = {
        id: `admin-${Date.now()}`,
        ...payload,
        active: true,
        createdAt: formatVietnamDate(),
      };

      let persisted = newAcc;
      if (isSupabaseConfigured) {
        try {
          persisted = await insertAdminAccountDb(newAcc);
        } catch (err) {
          showToast(formatSupabaseError(err));
          return;
        }
      }

      setAdminAccounts((prev) => [...prev, persisted]);
      appendAuditLog(
        `Đã tạo tài khoản ${persisted.role} cho ${persisted.name} (${persisted.email})`,
        'account'
      );
      showToast(`Đã tạo tài khoản ${persisted.role} cho ${persisted.name}.`);
    },
    [currentAdmin, appendAuditLog, showToast]
  );

  // Import hàng loạt tài khoản Admin từ CSV (chỉ Super Admin) -> đồng bộ bảng admin_accounts
  const handleBulkCreateAdminAccounts = useCallback(
    async (newAccounts: AdminAccount[], skipped: number, duplicates: number) => {
      if (currentAdmin?.role !== 'Super Admin') return;
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
        `Đã nhập hàng loạt ${persisted.length} tài khoản quản trị từ file CSV`,
        'account'
      );
      const extra: string[] = [];
      if (duplicates > 0) extra.push(`bỏ qua ${duplicates} email trùng`);
      if (skipped > 0) extra.push(`${skipped} dòng chưa hợp lệ`);
      showToast(
        extra.length > 0
          ? `Đã tạo ${persisted.length} tài khoản Admin từ CSV (${extra.join(', ')}).`
          : `Đã tạo thành công ${persisted.length} tài khoản Admin từ file CSV!`
      );
    },
    [currentAdmin, appendAuditLog, showToast]
  );

  const handleDeleteAdminAccount = useCallback(
    async (accountId: string) => {
      if (currentAdmin?.role !== 'Super Admin' || accountId === currentAdmin.id) {
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
          `Đã xóa tài khoản quản trị ${target.name} (${target.email})`,
          'account'
        );
      }
      showToast('Đã xóa tài khoản quản trị.');
    },
    [currentAdmin, adminAccounts, appendAuditLog, showToast]
  );

  // =======================================================
  // RENDER KHU QUẢN TRỊ NẾU ĐANG MỞ ADMIN DASHBOARD
  // =======================================================
  if (isAdminView && currentAdmin) {
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
          currentAdmin={currentAdmin}
          artisans={artisans}
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
          isDbArtisansEmpty={isDbArtisansEmpty}
          dbError={adminDbError}
          onRefreshAdminData={() => void loadAdminData()}
          onSeedInitialArtisans={() => void handleSeedInitialArtisans()}
          onExitToMap={handleExitAdminToMap}
          onLogout={handleLogoutAdmin}
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
          onCreateAdminAccount={(payload) => {
            void handleCreateAdminAccount(payload);
          }}
          onBulkCreateAdminAccounts={(accounts, skipped, duplicates) => {
            void handleBulkCreateAdminAccounts(accounts, skipped, duplicates);
          }}
          onDeleteAdminAccount={(id) => {
            void handleDeleteAdminAccount(id);
          }}
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

  return (
    <div className="h-[100dvh] lg:h-screen flex flex-col bg-[#FAF8F5] text-[#1F2933] overflow-hidden">
      {/* Desktop Top Navbar cố định (h-16) */}
      <DesktopNavbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        currentAdmin={currentAdmin}
        pendingCount={pendingSuggestions.length}
        badgeEmoji={badgeSummary.highestUnlocked?.emoji ?? '🏅'}
        onOpenBadge={() => setBadgeModalOpen(true)}
        onOpenAdmin={handleOpenAdmin}
      />

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
        {activeTab === 'explore' && (
          <div className="h-full w-full lg:flex">
            {/* =======================================================
                CỘT TRÁI DESKTOP (440px): Tác động xanh, Tìm kiếm, Bộ lọc, Danh sách & Chi tiết
               ======================================================= */}
            <aside className="hidden lg:flex flex-col w-[440px] shrink-0 h-full bg-[#FAF8F5] border-r border-[#E8E2D9] relative overflow-hidden">
              <div className="flex flex-col h-full">
                {/* Thanh đếm gọn nhẹ: Món đồ được hồi sinh */}
                <div className="px-4 py-2 bg-[#3A6B5C]/10 border-b border-[#3A6B5C]/15 flex items-center justify-between gap-2 shrink-0">
                  <p className="text-xs font-semibold text-[#3A6B5C] flex items-center gap-1.5 tabular-nums">
                    <Recycle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      ♻️ Đã có{' '}
                      <strong className="font-bold">{revivedCount}</strong> món đồ
                      được hồi sinh cùng Góc Thợ
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
                        distanceKm={getDistanceForArtisan(artisan)}
                        onSelect={handleSelectArtisanFromList}
                        onHoverChange={setHoveredArtisanId}
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
                    onBack={() => setSelectedArtisanId(null)}
                    onShare={handleShareArtisan}
                    onMarkRevived={handleMarkRevived}
                    onSubmitThankYou={handleSubmitThankYou}
                    onDrawRoute={handleDrawRouteFromDetail}
                    onChangeTravelMode={handleChangeTravelMode}
                    onOpenQr={setQrModalArtisan}
                    onOpenStatusReport={setReportModalArtisan}
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
              {/* Thanh tác động xanh + Huy hiệu + tìm kiếm + chip lọc nổi phía trên cho Mobile */}
              <div className="lg:hidden absolute top-0 left-0 right-0 z-[440] p-3 pointer-events-none space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#3A6B5C]/95 backdrop-blur-md text-white text-[11px] font-semibold shadow-sm tabular-nums truncate">
                    <span className="truncate">
                      ♻️ <strong>{revivedCount}</strong> món đồ hồi sinh
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBadgeModalOpen(true)}
                    className="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFFBF2]/95 backdrop-blur-md border border-[#D96B38]/40 text-[#1F2933] text-[11px] font-bold shadow-sm whitespace-nowrap shrink-0"
                  >
                    <span aria-hidden="true">
                      {badgeSummary.highestUnlocked?.emoji ?? '🏅'}
                    </span>
                    <span>Huy hiệu</span>
                  </button>
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
                        distanceKm={getDistanceForArtisan(artisan)}
                        onSelect={handleSelectArtisanFromList}
                        onHoverChange={() => {}}
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
                              onClick={() => setSelectedArtisanId(null)}
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
                    onBack={() => setMobileDetailOpen(false)}
                    onShare={handleShareArtisan}
                    onMarkRevived={handleMarkRevived}
                    onSubmitThankYou={handleSubmitThankYou}
                    onDrawRoute={handleDrawRouteFromDetail}
                    onChangeTravelMode={handleChangeTravelMode}
                    onOpenQr={setQrModalArtisan}
                    onOpenStatusReport={setReportModalArtisan}
                    onToggleKudos={handleToggleKudos}
                    onAddPraise={handleAddPraise}
                  />
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'suggest' && (
          <div className="h-full overflow-y-auto thin-scrollbar">
            <SuggestArtisanView
              onSubmitPendingSuggestion={handleSubmitPendingSuggestion}
              onBackToExplore={() => setActiveTab('explore')}
            />
          </div>
        )}

        {activeTab === 'about' && (
          <div className="h-full overflow-y-auto thin-scrollbar">
            <AboutView
              totalArtisans={publicArtisans.length}
              revivedCount={revivedCount}
              currentAdmin={currentAdmin}
              badgeTitle={badgeSummary.highestUnlocked?.title ?? null}
              onNavigate={setActiveTab}
              onOpenBadge={() => setBadgeModalOpen(true)}
              onOpenAdmin={handleOpenAdmin}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar 3 tab */}
      <MobileBottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Modals: Huy hiệu, Đăng nhập Quản trị, Mã QR & Báo tình trạng */}
      {badgeModalOpen && (
        <BadgeModal
          stats={userContribution}
          onUpdateDisplayName={(nextName) => {
            setUserContribution((prev) => ({ ...prev, displayName: nextName }));
            showToast(`Đã cập nhật tên trên thẻ thành "${nextName}".`);
          }}
          onClose={() => setBadgeModalOpen(false)}
        />
      )}

      {loginModalOpen && (
        <AdminLoginModal
          onAuthenticate={handleAuthenticateAdmin}
          onClose={() => setLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
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
