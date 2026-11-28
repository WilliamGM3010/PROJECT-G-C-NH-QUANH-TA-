import { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Compass,
  Footprints,
  KeyRound,
  Loader2,
  LocateFixed,
  MapPin,
  PlusCircle,
  RefreshCw,
  Scissors,
  Search,
  ShoppingBag,
  Tag,
  Watch,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import { DISTRICTS } from '../data/artisans';
import { GTQT_COVER_SRC } from '../data/team';
import type {
  AppTab,
  Article,
  Artisan,
  CraftCategory,
  District,
  GpsPermissionStatus,
  UserLocation,
} from '../types/artisan';
import {
  calculateDistanceKm,
  formatCompactDistance,
  normalizeVietnamese,
} from '../utils/geo';
import { sanitizeImageSrc } from '../utils/richText';
import { ArtisanIllustration } from './ArtisanIllustration';
import { HomeMiniMap } from './HomeMiniMap';
import { PriceComparisonModal } from './PriceComparisonModal';

interface ServiceCategoryItem {
  id: string;
  label: string;
  Icon: typeof Wrench;
  categories?: CraftCategory[];
  keywords?: string[];
}

const SERVICE_CATEGORY_ITEMS: ServiceCategoryItem[] = [
  {
    id: 'shoes',
    label: 'Giày dép',
    Icon: Footprints,
    categories: ['Sửa giày dép'],
    keywords: ['giay', 'dep', 'bung de', 'bung keo', 'ho keo', 'khau de', 'got'],
  },
  {
    id: 'tailor',
    label: 'Quần áo / May vá',
    Icon: Scissors,
    categories: ['May vá'],
    keywords: ['day keo', 'may va', 'len lai', 'bop eo', 'quan', 'ao', 'va'],
  },
  {
    id: 'lock',
    label: 'Chìa khóa',
    Icon: KeyRound,
    categories: ['Sửa khóa'],
    keywords: ['khoa', 'chia', 'o khoa', 'smartkey', 'ket'],
  },
  {
    id: 'watch',
    label: 'Đồng hồ',
    Icon: Watch,
    categories: ['Sửa đồng hồ'],
    keywords: ['dong ho', 'thay pin', 'day da', 'cat mat'],
  },
  {
    id: 'bag',
    label: 'Balo / Túi xách',
    Icon: ShoppingBag,
    categories: ['Sửa balo/túi'],
    keywords: ['balo', 'tui', 'vali', 'quai deo', 'khoa keo'],
  },
  {
    id: 'electronics',
    label: 'Đồ điện & Khác',
    Icon: Wrench,
    keywords: [
      'do dien',
      'quat',
      'noi com',
      'am sieu toc',
      'ban ui',
      'dien gia dung',
      'o cam',
    ],
  },
];

function matchesServiceCategory(
  artisan: Artisan,
  item: ServiceCategoryItem
): boolean {
  const categoryMatch =
    item.categories?.some((cat) => artisan.categories.includes(cat)) ?? false;
  if (categoryMatch) return true;

  const searchable = normalizeVietnamese(
    [
      artisan.name,
      artisan.shortTitle,
      ...artisan.categories,
      ...artisan.problems,
      ...artisan.prices.map((p) => p.service),
      artisan.story,
    ].join(' ')
  );

  return item.keywords?.some((kw) => searchable.includes(kw)) ?? false;
}

interface HomeDiscoveryViewProps {
  artisans: Artisan[];
  articles: Article[];
  revivedCount: number;
  isLoading: boolean;
  dbError: string | null;
  gpsStatus: GpsPermissionStatus;
  userLocation: UserLocation | null;
  selectedDistrict: District | 'Tất cả khu vực';
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSelectedDistrictChange: (district: District | 'Tất cả khu vực') => void;
  onRequestGps: () => void;
  onRetryLoad: () => void;
  onOpenArtisanProfile: (artisan: Artisan) => void;
  onSelectArtisanOnMap: (artisan: Artisan) => void;
  onOpenFullMap: () => void;
  onOpenArticle: (articleId: string) => void;
  onNavigateTab: (tab: AppTab) => void;
}

export function HomeDiscoveryView({
  artisans,
  articles,
  revivedCount,
  isLoading,
  dbError,
  gpsStatus,
  userLocation,
  selectedDistrict,
  searchQuery,
  onSearchQueryChange,
  onSelectedDistrictChange,
  onRequestGps,
  onRetryLoad,
  onOpenArtisanProfile,
  onSelectArtisanOnMap,
  onOpenFullMap,
  onOpenArticle,
  onNavigateTab,
}: HomeDiscoveryViewProps) {
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [bannerSrc, setBannerSrc] = useState<string>('/cover-gtqt.gif');
  const resultsSectionRef = useRef<HTMLElement | null>(null);

  const handleBannerError = () => {
    setBannerSrc((prev) => {
      if (prev === '/cover-gtqt.gif') return '/cover-gtqt.jpg';
      if (prev === '/cover-gtqt.jpg') return GTQT_COVER_SRC;
      return prev;
    });
  };

  const hasRealGps =
    gpsStatus === 'granted' && userLocation?.source === 'gps';

  const visiblePublicArtisans = useMemo(
    () =>
      artisans.filter((a) => !a.isHidden && a.approvalStatus !== 'pending'),
    [artisans]
  );

  const availableDistricts = useMemo(() => {
    const set = new Set<string>(DISTRICTS);
    for (const a of visiblePublicArtisans) {
      if (a.district) set.add(a.district);
    }
    return Array.from(set);
  }, [visiblePublicArtisans]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of SERVICE_CATEGORY_ITEMS) {
      map[item.id] = visiblePublicArtisans.filter((a) =>
        matchesServiceCategory(a, item)
      ).length;
    }
    return map;
  }, [visiblePublicArtisans]);

  const activeCategory = useMemo(
    () =>
      selectedCatId
        ? (SERVICE_CATEGORY_ITEMS.find((c) => c.id === selectedCatId) ?? null)
        : null,
    [selectedCatId]
  );

  const suggestedArtisans = useMemo(() => {
    const queryNorm = normalizeVietnamese(searchQuery);

    const matched = visiblePublicArtisans.filter((artisan) => {
      if (
        selectedDistrict !== 'Tất cả khu vực' &&
        artisan.district !== selectedDistrict
      ) {
        return false;
      }

      if (activeCategory && !matchesServiceCategory(artisan, activeCategory)) {
        return false;
      }

      if (queryNorm.length > 0) {
        const haystack = normalizeVietnamese(
          [
            artisan.name,
            artisan.shortTitle,
            artisan.district,
            artisan.addressLandmark,
            ...artisan.categories,
            ...artisan.problems,
            ...artisan.prices.map((p) => p.service),
          ].join(' ')
        );
        if (!haystack.includes(queryNorm)) {
          return false;
        }
      }

      return true;
    });

    const enriched = matched.map((artisan) => ({
      artisan,
      distanceKm:
        hasRealGps && userLocation
          ? calculateDistanceKm(userLocation.coords, artisan.coordinates)
          : null,
    }));

    enriched.sort((a, b) => {
      const aWorking = a.artisan.status === 'working' ? 0 : 1;
      const bWorking = b.artisan.status === 'working' ? 0 : 1;
      if (aWorking !== bWorking) return aWorking - bWorking;

      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }

      return 0;
    });

    return enriched;
  }, [
    visiblePublicArtisans,
    searchQuery,
    selectedDistrict,
    activeCategory,
    hasRealGps,
    userLocation,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCatId !== null ||
    selectedDistrict !== 'Tất cả khu vực';

  const displayedArtisans = hasActiveFilters
    ? suggestedArtisans
    : suggestedArtisans.slice(0, 3);
  const remainingCount = Math.max(0, suggestedArtisans.length - 3);

  const handleResetFilters = () => {
    onSearchQueryChange('');
    setSelectedCatId(null);
    onSelectedDistrictChange('Tất cả khu vực');
  };

  const handleSearchSubmit = () => {
    resultsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const sectionTitle = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (trimmed) return `Kết quả cho "${trimmed}"`;
    if (activeCategory) return `Góc thợ ${activeCategory.label.toLowerCase()}`;
    if (selectedDistrict !== 'Tất cả khu vực')
      return `Góc thợ tại ${selectedDistrict}`;
    if (hasRealGps) return 'Góc thợ gần bạn nhất';
    return 'Góc thợ tiêu biểu quanh Sài Gòn';
  }, [searchQuery, activeCategory, selectedDistrict, hasRealGps]);

  // 2 câu chuyện biên tập nổi bật (ưu tiên bài viết Bản tin đã xuất bản, fallback sang câu chuyện cô chú thợ)
  const editorialStories = useMemo(() => {
    const published = articles.filter((a) => a.status === 'published');
    if (published.length >= 2) {
      return published.slice(0, 2).map((article) => ({
        kind: 'article' as const,
        id: article.id,
        kicker: article.category,
        date: article.publishedAt,
        title: article.title,
        excerpt: article.subtitle,
        imageUrl: sanitizeImageSrc(article.imageUrl),
        article,
      }));
    }

    const fromArticles = published.map((article) => ({
      kind: 'article' as const,
      id: article.id,
      kicker: article.category,
      date: article.publishedAt,
      title: article.title,
      excerpt: article.subtitle,
      imageUrl: sanitizeImageSrc(article.imageUrl),
      article,
    }));

    const fromArtisans = visiblePublicArtisans
      .filter((a) => a.story && a.story.trim().length > 20)
      .slice(0, 2 - fromArticles.length)
      .map((artisan) => ({
        kind: 'artisan' as const,
        id: artisan.id,
        kicker: artisan.categories[0] ?? 'Chuyện nghề',
        date: artisan.district,
        title: artisan.name,
        excerpt: artisan.story,
        imageUrl: artisan.hidePortrait ? undefined : artisan.customImageUrl,
        artisan,
      }));

    return [...fromArticles, ...fromArtisans];
  }, [articles, visiblePublicArtisans]);

  return (
    <div className="bg-[#F7F2E8] text-[#25292E] overflow-x-hidden">
      {/* ============================================================
          1. HERO EDITORIAL — BANNER GIF TRÀN VIỀN FULL-BLEED + TÌM KIẾM CĂN GIỮA
         ============================================================ */}
      <section>
        {/* Banner GIF tràn viền toàn màn hình sát ngay dưới thanh Header, không đè chữ/lớp tối */}
        <div className="w-full relative overflow-hidden bg-[#FDF2E6]">
          <img
            src={bannerSrc}
            alt="Góc Thợ Quanh Ta"
            fetchPriority="high"
            decoding="async"
            onError={handleBannerError}
            className="w-full h-auto max-h-[480px] xl:max-h-[560px] object-cover object-center block"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 md:h-20 bg-gradient-to-t from-[#F7F2E8] via-[#F7F2E8]/45 to-transparent"
            aria-hidden="true"
          />
        </div>

        {/* Nội dung Hero căn giữa ngay bên dưới banner */}
        <div className="max-w-3xl mx-auto px-5 text-center mt-6 md:mt-8 space-y-6">
          <div className="space-y-3.5">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#D46534]">
              THE NEIGHBORHOOD CRAFT · SÀI GÒN
            </p>

            <h1
              className="font-display text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#25292E] tracking-tight leading-[1.14]"
              style={{ textWrap: 'balance' }}
            >
              Tìm lại những góc nghề bình dị ngay quanh bạn.
            </h1>

            <p className="font-serif-editorial italic text-base sm:text-lg text-[#615D57] leading-relaxed">
              Hỏng đâu sửa liền — Thợ giỏi gần bên.
            </p>
          </div>

          {/* Thanh tìm kiếm trung tâm + GPS + nút Tìm ngay */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit();
            }}
            className="max-w-2xl mx-auto text-left rounded-2xl bg-white border border-[#E8DFD1] shadow-[0_8px_28px_rgba(37,41,46,0.06)] focus-within:border-[#1B3B82] focus-within:ring-2 focus-within:ring-[#1B3B82]/12 p-2 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2.5 flex-1 min-w-0 pl-2.5 pr-1">
                <Search className="w-4.5 h-4.5 text-[#1B3B82]/75 shrink-0 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder="VD: hở keo giày, lên lai quần, sửa khóa..."
                  aria-label="Tìm lỗi hỏng cần sửa"
                  className="flex-1 min-w-0 h-11 bg-transparent text-sm sm:text-[15px] text-[#25292E] placeholder:text-[#8E877E] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchQueryChange('')}
                    aria-label="Xóa từ khóa tìm kiếm"
                    className="w-7 h-7 rounded-full text-[#615D57] hover:text-[#25292E] hover:bg-[#F7F2E8] flex items-center justify-center shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 pt-1.5 sm:pt-0 border-t sm:border-t-0 sm:border-l border-dashed border-[#E8DFD1] sm:pl-2.5">
                {gpsStatus === 'locating' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F7F2E8] text-xs font-medium text-[#615D57] whitespace-nowrap">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D46534]" />
                    <span>Định vị...</span>
                  </span>
                ) : hasRealGps ? (
                  <button
                    type="button"
                    onClick={onRequestGps}
                    title="Bấm để định vị lại GPS"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#EDF3EE] text-xs font-semibold text-[#4F6B54] hover:bg-[#4F6B54]/15 whitespace-nowrap transition-colors"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>Gần bạn</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1">
                    <div className="relative flex items-center">
                      <select
                        aria-label="Chọn khu vực"
                        value={selectedDistrict}
                        onChange={(e) =>
                          onSelectedDistrictChange(
                            e.target.value as District | 'Tất cả khu vực'
                          )
                        }
                        className="appearance-none h-9 pl-2.5 pr-6 rounded-xl bg-[#F7F2E8] hover:bg-[#EFE7D8] text-xs font-medium text-[#25292E] cursor-pointer focus:outline-none"
                      >
                        <option value="Tất cả khu vực">Tất cả quận</option>
                        {availableDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-[#615D57] absolute right-2 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={onRequestGps}
                      title="Bật định vị GPS"
                      aria-label="Bật định vị GPS"
                      className="w-9 h-9 rounded-xl text-[#1B3B82] hover:bg-[#EEF2FA] flex items-center justify-center shrink-0 transition-colors"
                    >
                      <LocateFixed className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#D46534] hover:bg-[#BC5326] text-white text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors"
                >
                  Tìm ngay
                </button>
              </div>
            </div>
          </form>

          {/* 1 dòng tiện ích & chỉ số live tinh gọn */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs sm:text-[13px] text-[#615D57]">
            <button
              type="button"
              onClick={() => setPriceModalOpen(true)}
              className="inline-flex items-center gap-1.5 font-semibold text-[#615D57] hover:text-[#D46534] transition-colors py-0.5"
            >
              <Tag className="w-3.5 h-3.5 text-[#D46534]" />
              <span>So sánh giá sửa vs mua mới</span>
            </button>

            <span className="text-[#D9CBB8] select-none" aria-hidden="true">
              ·
            </span>

            <button
              type="button"
              onClick={onOpenFullMap}
              className="inline-flex items-center gap-1 font-semibold text-[#1B3B82] hover:text-[#D46534] transition-colors py-0.5"
            >
              <span>Mở bản đồ</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <span className="text-[#D9CBB8] select-none" aria-hidden="true">
              ·
            </span>

            <span className="inline-flex items-center gap-1">
              <strong className="font-mono font-bold text-[#1B3B82] tabular-nums">
                {visiblePublicArtisans.length}
              </strong>
              <span>góc thợ đã xác thực</span>
            </span>

            <span className="text-[#D9CBB8] select-none" aria-hidden="true">
              ·
            </span>

            <span className="inline-flex items-center gap-1">
              <strong className="font-mono font-bold text-[#4F6B54] tabular-nums">
                {revivedCount}
              </strong>
              <span>món đồ hồi sinh</span>
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 md:pt-20 pb-12 md:pb-16 space-y-20 md:space-y-28">
        {/* ============================================================
            2. DẢI 6 NHÓM NGHỀ SỬA CHỮA (CÓ SỐ LƯỢNG LIVE TỪ SUPABASE)
           ============================================================ */}
        <section aria-label="Nhóm nghề sửa chữa" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#615D57]">
              Chọn nhanh theo món đồ cần sửa
            </h2>
            {selectedCatId && (
              <button
                type="button"
                onClick={() => setSelectedCatId(null)}
                className="text-xs font-semibold text-[#B93818] hover:underline"
              >
                Bỏ chọn
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 lg:grid lg:grid-cols-6">
            {SERVICE_CATEGORY_ITEMS.map((item) => {
              const isActive = selectedCatId === item.id;
              const count = categoryCounts[item.id] ?? 0;
              const Icon = item.Icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    setSelectedCatId((prev) =>
                      prev === item.id ? null : item.id
                    )
                  }
                  className={`min-w-[144px] lg:min-w-0 rounded-2xl px-4 py-3.5 text-left border transition-all duration-200 flex items-center lg:flex-col lg:items-start gap-3 shrink-0 ${
                    isActive
                      ? 'bg-[#1B3B82] border-[#1B3B82] text-[#F7F2E8] shadow-[0_8px_20px_rgba(27,59,130,0.2)]'
                      : 'bg-white border-[#E8DFD1] text-[#25292E] hover:border-[#D46534]/55 hover:-translate-y-0.5 hover:shadow-xs'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-white/15 text-[#F7F2E8]'
                        : 'bg-[#F7F2E8] text-[#D46534]'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-[13px] font-bold leading-snug truncate">
                      {item.label}
                    </p>
                    <p
                      className={`font-mono text-[11px] mt-0.5 tabular-nums ${
                        isActive ? 'text-[#F7F2E8]/80' : 'text-[#615D57]'
                      }`}
                    >
                      {count} góc thợ
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ============================================================
            3. GÓC THỢ GẦN BẠN (SMART DENSITY: MẶC ĐỊNH TỐI ĐA 3 THẺ THOÁNG)
           ============================================================ */}
        <section
          ref={resultsSectionRef}
          aria-label="Danh sách góc thợ gần bạn"
          className="scroll-mt-20 space-y-7"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-dashed border-[#DFD3C2] pb-4">
            <div className="space-y-1">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-[#D46534]">
                Khám phá thực tế
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#25292E] tracking-tight">
                {sectionTitle}
                {!isLoading && !dbError && (
                  <span className="ml-2 font-mono text-base font-semibold text-[#615D57] tabular-nums">
                    ({suggestedArtisans.length})
                  </span>
                )}
              </h2>
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="self-start sm:self-auto text-xs sm:text-sm font-semibold text-[#B93818] hover:underline"
              >
                Xóa lọc
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenFullMap}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1B3B82] hover:text-[#D46534] transition-colors whitespace-nowrap"
              >
                <span>Xem toàn bộ bản đồ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-14 rounded-3xl bg-white border border-[#E8DFD1] flex flex-col items-center justify-center gap-2.5 text-[#615D57]">
              <Loader2 className="w-6 h-6 text-[#1B3B82] animate-spin" />
              <p className="text-sm font-medium">
                Đang tải danh sách cô chú thợ...
              </p>
            </div>
          ) : dbError ? (
            <div
              role="alert"
              className="rounded-3xl bg-white border border-[#B93818]/25 p-8 text-center space-y-3"
            >
              <WifiOff className="w-7 h-7 text-[#B93818] mx-auto" />
              <p className="text-sm text-[#7F240E] max-w-md mx-auto leading-relaxed">
                {dbError}
              </p>
              <button
                type="button"
                onClick={onRetryLoad}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#B93818] hover:bg-[#9C2E13] text-[#F7F2E8] text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử tải lại</span>
              </button>
            </div>
          ) : displayedArtisans.length === 0 ? (
            <div className="rounded-3xl bg-white border border-[#E8DFD1] px-6 py-12 text-center space-y-3.5">
              <p className="font-display text-lg font-bold text-[#25292E]">
                Chưa tìm thấy cô chú thợ phù hợp
              </p>
              <p className="text-sm text-[#615D57] max-w-md mx-auto">
                Hãy thử từ khóa ngắn hơn hoặc giới thiệu cho chúng mình một góc
                thợ quen gần bạn nhé.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="min-h-[40px] px-5 py-2 rounded-full bg-[#1B3B82] hover:bg-[#142D66] text-white text-xs sm:text-sm font-bold transition-colors"
                  >
                    Xem tất cả
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigateTab('community')}
                  className="min-h-[40px] px-5 py-2 rounded-full border border-[#E8DFD1] bg-white text-[#25292E] hover:border-[#D46534] hover:text-[#D46534] text-xs sm:text-sm font-semibold transition-colors"
                >
                  Đề xuất góc thợ mới
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                {displayedArtisans.map(({ artisan, distanceKm }) => {
                  const isWorking = artisan.status === 'working';
                  return (
                    <article
                      key={artisan.id}
                      onClick={() => onOpenArtisanProfile(artisan)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenArtisanProfile(artisan);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="group rounded-3xl bg-white border border-[#E8DFD1] hover:border-[#1B3B82]/45 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(37,41,46,0.08)] p-5 flex flex-col gap-4 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82]"
                    >
                      {/* Ảnh góc nghề 4:3 tôn trọng hidePortrait */}
                      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#EFE8DC]">
                        <ArtisanIllustration
                          variant={artisan.illustrationVariant}
                          customImageUrl={
                            artisan.hidePortrait
                              ? undefined
                              : artisan.customImageUrl
                          }
                          alt={`Góc nghề của ${artisan.name}`}
                        />
                        {isWorking && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[#4F6B54] font-mono text-[10.5px] font-bold uppercase tracking-wider shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4F6B54]" />
                            Đang mở
                          </span>
                        )}
                      </div>

                      {/* Thông tin chính */}
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11.5px] font-semibold text-[#1B3B82] truncate">
                            {artisan.categories.join(' · ')}
                          </span>
                          {distanceKm !== null && (
                            <span className="font-mono text-[11.5px] font-bold text-[#4F6B54] tabular-nums whitespace-nowrap shrink-0">
                              {formatCompactDistance(distanceKm)}
                            </span>
                          )}
                        </div>

                        <h3 className="font-display text-lg font-bold text-[#25292E] leading-snug group-hover:text-[#1B3B82] transition-colors line-clamp-2">
                          {artisan.name}
                        </h3>

                        <p className="text-xs sm:text-[13px] text-[#615D57] flex items-start gap-1.5 line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 text-[#D46534] shrink-0 mt-0.5" />
                          <span className="truncate">
                            {artisan.addressLandmark} · {artisan.district}
                          </span>
                        </p>

                        {/* Chân thẻ: Giá tham khảo Terracotta & nút Ghim bản đồ */}
                        <div className="mt-auto pt-3.5 border-t border-dashed border-[#E8DFD1] flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-bold text-[#D46534] tabular-nums">
                            {artisan.minPriceLabel}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectArtisanOnMap(artisan);
                              }}
                              title="Xem vị trí trên bản đồ"
                              aria-label={`Xem ${artisan.name} trên bản đồ`}
                              className="h-8 px-2.5 rounded-xl bg-[#F7F2E8] hover:bg-[#EEF2FA] text-[#1B3B82] text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Bản đồ</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {!hasActiveFilters && remainingCount > 0 && (
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={onOpenFullMap}
                    className="min-h-[44px] px-6 py-2.5 rounded-full bg-white hover:bg-[#1B3B82] text-[#25292E] hover:text-[#F7F2E8] border border-[#E8DFD1] hover:border-[#1B3B82] text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all shadow-2xs"
                  >
                    <span>Khám phá thêm {remainingCount} góc thợ khác</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ============================================================
            4. MINI INTERACTIVE MAP — "QUANH KHU VỰC CỦA BẠN"
           ============================================================ */}
        <section
          aria-label="Bản đồ thu gọn quanh khu vực của bạn"
          className="rounded-3xl bg-white/80 border border-[#E8DFD1] p-6 md:p-10 shadow-[0_10px_30px_rgba(37,41,46,0.04)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-5">
              <div className="space-y-2.5">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1B3B82]">
                  Bản đồ tương tác
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#25292E] tracking-tight leading-snug">
                  Quanh khu vực của bạn
                </h2>
                <p className="text-sm sm:text-[15px] text-[#615D57] leading-relaxed">
                  Mỗi chấm nhỏ trên bản đồ là một góc nghề thật tại TP.HCM đã
                  được đội ngũ khảo sát thực địa, ghi nhận mốc đường và khung
                  giờ rõ ràng. Bấm trực tiếp vào ghim để xem vị trí chi tiết.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenFullMap}
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1B3B82] hover:bg-[#142D66] text-[#F7F2E8] text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <Compass className="w-4 h-4" />
                  <span>Mở bản đồ đầy đủ</span>
                </button>

                {!hasRealGps && (
                  <button
                    type="button"
                    onClick={onRequestGps}
                    className="min-h-[44px] px-4 py-2.5 rounded-full bg-[#F7F2E8] hover:bg-[#EFE7D8] border border-[#E8DFD1] text-[#25292E] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <LocateFixed className="w-4 h-4 text-[#D46534]" />
                    <span>Định vị gần tôi</span>
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-7">
              <HomeMiniMap
                artisans={visiblePublicArtisans}
                userLocation={userLocation}
                onSelectArtisan={onSelectArtisanOnMap}
              />
            </div>
          </div>
        </section>

        {/* ============================================================
            5. CHUYỆN NGHỀ GÓC PHỐ (2 CỘT EDITORIAL STORIES)
           ============================================================ */}
        {editorialStories.length > 0 && (
          <section aria-label="Chuyện nghề nổi bật" className="space-y-7">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-dashed border-[#DFD3C2] pb-4">
              <div className="space-y-1">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#B93818]">
                  Bản tin &amp; Ký sự
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#25292E] tracking-tight">
                  Chuyện nghề bên góc đường
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('news')}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1B3B82] hover:text-[#D46534] transition-colors whitespace-nowrap"
              >
                <span>Đọc thêm tại Bản tin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {editorialStories.map((story) => (
                <article
                  key={`${story.kind}-${story.id}`}
                  onClick={() => {
                    if (story.kind === 'article') {
                      onOpenArticle(story.article.id);
                    } else {
                      onOpenArtisanProfile(story.artisan);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (story.kind === 'article') {
                        onOpenArticle(story.article.id);
                      } else {
                        onOpenArtisanProfile(story.artisan);
                      }
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group rounded-3xl bg-white border border-[#E8DFD1] hover:border-[#1B3B82]/45 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,41,46,0.07)] overflow-hidden flex flex-col transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82]"
                >
                  <div className="aspect-[16/9] w-full bg-[#EFE8DC] overflow-hidden">
                    {story.imageUrl ? (
                      <img
                        src={story.imageUrl}
                        alt={story.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : story.kind === 'artisan' ? (
                      <ArtisanIllustration
                        variant={story.artisan.illustrationVariant}
                        alt={story.title}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#F7F2E8] to-[#E8DFD1] flex items-center justify-center text-[#1B3B82]/50 font-serif-editorial italic text-sm px-6 text-center">
                        Góc Thợ Quanh Ta · Chuyện nghề Sài Gòn
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-[#615D57]">
                      <span className="font-bold text-[#D46534] uppercase">
                        {story.kicker}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{story.date}</span>
                    </div>

                    <h3 className="font-serif-editorial text-xl font-semibold text-[#25292E] leading-snug group-hover:text-[#1B3B82] transition-colors line-clamp-2">
                      {story.title}
                    </h3>

                    {story.excerpt && (
                      <p className="font-serif-editorial italic text-sm text-[#615D57] leading-relaxed line-clamp-2">
                        &ldquo;{story.excerpt}&rdquo;
                      </p>
                    )}

                    <div className="mt-auto pt-3 border-t border-dashed border-[#E8DFD1] flex justify-end">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B3B82] group-hover:text-[#D46534] transition-colors">
                        <span>Đọc câu chuyện</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================
            6. COMPACT CTA BAND (SAIGON COBALT #1B3B82 + ĐƯỜNG CHỈ ĐỨT NÉT)
           ============================================================ */}
        <section aria-label="Đồng hành cùng bản đồ">
          <div className="rounded-3xl bg-[#1B3B82] text-[#F7F2E8] p-3 sm:p-4 shadow-[0_16px_40px_rgba(27,59,130,0.18)]">
            <div className="rounded-2xl border border-dashed border-[#F7F2E8]/28 px-6 sm:px-10 py-8 sm:py-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#F4C4A8]">
                  Cùng giữ lại những góc nghề quen
                </p>
                <h2
                  className="font-display text-xl sm:text-2xl font-extrabold text-[#F7F2E8] leading-snug"
                  style={{ textWrap: 'balance' }}
                >
                  Biết một cô chú thợ lành nghề gần nhà? Góp một chấm nhỏ để bản
                  đồ cộng đồng thêm đủ đầy.
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onOpenFullMap}
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-white text-[#1B3B82] hover:bg-[#F7F2E8] text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Compass className="w-4 h-4" />
                  <span>Khám phá bản đồ thợ</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('community')}
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#D46534] hover:bg-[#BC5326] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Đề xuất góc thợ mới</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <PriceComparisonModal
        isOpen={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
      />
    </div>
  );
}
