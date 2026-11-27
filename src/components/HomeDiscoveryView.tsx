import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  Loader2,
  LocateFixed,
  RefreshCw,
  Search,
  Tag,
  WifiOff,
  X,
} from 'lucide-react';
import { DISTRICTS } from '../data/artisans';
import type {
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
import { PriceComparisonModal } from './PriceComparisonModal';

interface MinimalProblemChip {
  id: string;
  label: string;
  categories?: CraftCategory[];
  keywords?: string[];
}

const MINIMAL_PROBLEM_CHIPS: MinimalProblemChip[] = [
  {
    id: 'shoes',
    label: 'Giày dép',
    categories: ['Sửa giày dép'],
    keywords: ['giay', 'dep', 'bung de', 'bung keo', 'ho keo', 'khau de', 'got'],
  },
  {
    id: 'tailor',
    label: 'May vá / Dây kéo',
    categories: ['May vá'],
    keywords: ['day keo', 'may va', 'len lai', 'bop eo', 'quan', 'ao', 'va'],
  },
  {
    id: 'lock',
    label: 'Sửa khóa',
    categories: ['Sửa khóa'],
    keywords: ['khoa', 'chia', 'o khoa', 'smartkey', 'ket'],
  },
  {
    id: 'watch',
    label: 'Đồng hồ',
    categories: ['Sửa đồng hồ'],
    keywords: ['dong ho', 'thay pin', 'day da', 'cat mat'],
  },
  {
    id: 'bag',
    label: 'Túi / Balo',
    categories: ['Sửa balo/túi'],
    keywords: ['balo', 'tui', 'vali', 'quai deo', 'khoa keo'],
  },
  {
    id: 'electronics',
    label: 'Đồ điện',
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

interface HomeDiscoveryViewProps {
  artisans: Artisan[];
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
  onSelectArtisanOnMap: (artisan: Artisan) => void;
  onOpenFullMap: () => void;
  onRequestSuggest: () => void;
}

export function HomeDiscoveryView({
  artisans,
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
  onSelectArtisanOnMap,
  onOpenFullMap,
  onRequestSuggest,
}: HomeDiscoveryViewProps) {
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const [priceModalOpen, setPriceModalOpen] = useState(false);

  const hasRealGps =
    gpsStatus === 'granted' && userLocation?.source === 'gps';

  const availableDistricts = useMemo(() => {
    const set = new Set<string>(DISTRICTS);
    for (const a of artisans) {
      if (a.district) set.add(a.district);
    }
    return Array.from(set);
  }, [artisans]);

  const activeChip = useMemo(
    () =>
      selectedChipId
        ? (MINIMAL_PROBLEM_CHIPS.find((c) => c.id === selectedChipId) ?? null)
        : null,
    [selectedChipId]
  );

  const suggestedArtisans = useMemo(() => {
    const queryNorm = normalizeVietnamese(searchQuery);

    const matched = artisans.filter((artisan) => {
      if (artisan.isHidden) return false;
      if (artisan.approvalStatus === 'pending') return false;

      if (
        selectedDistrict !== 'Tất cả khu vực' &&
        artisan.district !== selectedDistrict
      ) {
        return false;
      }

      if (activeChip) {
        const categoryMatch =
          activeChip.categories?.some((cat) =>
            artisan.categories.includes(cat)
          ) ?? false;

        const searchableChipText = normalizeVietnamese(
          [
            artisan.name,
            artisan.shortTitle,
            ...artisan.categories,
            ...artisan.problems,
            ...artisan.prices.map((p) => p.service),
            artisan.story,
          ].join(' ')
        );

        const keywordMatch =
          activeChip.keywords?.some((kw) => searchableChipText.includes(kw)) ??
          false;

        if (!categoryMatch && !keywordMatch) {
          return false;
        }
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
    artisans,
    searchQuery,
    selectedDistrict,
    activeChip,
    hasRealGps,
    userLocation,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedChipId !== null ||
    selectedDistrict !== 'Tất cả khu vực';

  const handleResetFilters = () => {
    onSearchQueryChange('');
    setSelectedChipId(null);
    onSelectedDistrictChange('Tất cả khu vực');
  };

  const sectionTitle = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (trimmed) return `Kết quả cho "${trimmed}"`;
    if (activeChip) return `Kết quả cho ${activeChip.label}`;
    if (selectedDistrict !== 'Tất cả khu vực') return `Tại ${selectedDistrict}`;
    if (hasRealGps) return 'Gần bạn nhất';
    return 'Góc thợ quanh TP.HCM';
  }, [searchQuery, activeChip, selectedDistrict, hasRealGps]);

  return (
    <div className="bg-[#FAF8F5] px-4 sm:px-6 pb-14 lg:pb-16">
      {/* Khu vực tìm kiếm siêu tối giản (1 cột căn giữa, khoảng trắng thoáng) */}
      <section className="max-w-2xl mx-auto pt-10 sm:pt-20 pb-8 sm:pb-10">
        {/* Tiêu đề duy nhất, thoáng, tối đa 1 dòng */}
        <h1 className="text-center text-2xl sm:text-[34px] font-bold text-[#1F2933] tracking-tight leading-tight mb-6 sm:mb-8">
          Bạn đang cần sửa gì hôm nay?
        </h1>

        {/* Thanh tìm kiếm trung tâm tích hợp GPS thông minh */}
        <div className="rounded-2xl bg-white border border-stone-200 shadow-[0_2px_10px_rgba(31,41,51,0.03)] focus-within:border-[#3A6B5C]/55 focus-within:shadow-[0_10px_30px_rgba(31,41,51,0.07)] transition-all">
          <div className="flex items-center gap-2 pl-4 pr-2.5 h-14 sm:h-15">
            <Search className="w-5 h-5 text-[#7B8794] shrink-0 pointer-events-none" />

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="VD: hở keo giày, hư dây kéo, sửa khóa..."
              aria-label="Tìm lỗi hỏng cần sửa"
              className="flex-1 min-w-0 h-full bg-transparent text-sm sm:text-[15px] text-[#1F2933] placeholder:text-[#9AA5B1] focus:outline-none"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="w-7 h-7 rounded-full text-[#7B8794] hover:text-[#1F2933] hover:bg-stone-100 flex items-center justify-center shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* 1 nhãn GPS / Quận siêu gọn tích hợp ngay góc phải thanh tìm kiếm */}
            <div className="hidden sm:flex items-center shrink-0 pl-2 border-l border-stone-200/80">
              {gpsStatus === 'locating' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-[11.5px] font-medium text-[#52606D] whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D96B38] animate-pulse" />
                  <span>Đang định vị...</span>
                </span>
              ) : hasRealGps ? (
                <button
                  type="button"
                  onClick={onRequestGps}
                  title="Bấm để định vị lại GPS"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3A6B5C]/10 hover:bg-[#3A6B5C]/16 text-[11.5px] font-semibold text-[#3A6B5C] whitespace-nowrap transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F9E66]" />
                  <span>Gần bạn</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1">
                  <div className="relative flex items-center">
                    <select
                      aria-label="Chọn quận"
                      value={selectedDistrict}
                      onChange={(e) =>
                        onSelectedDistrictChange(
                          e.target.value as District | 'Tất cả khu vực'
                        )
                      }
                      className="appearance-none h-8 pl-2.5 pr-6 rounded-full bg-stone-100/90 hover:bg-stone-200/70 text-[11.5px] font-medium text-[#1F2933] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3A6B5C]/30 transition-colors"
                    >
                      <option value="Tất cả khu vực">Tất cả quận</option>
                      {availableDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-[#616E7C] absolute right-2 pointer-events-none" />
                  </div>

                  <button
                    type="button"
                    onClick={onRequestGps}
                    title="Bật định vị GPS"
                    className="h-8 px-2.5 rounded-full text-[11.5px] font-medium text-[#3A6B5C] hover:bg-[#3A6B5C]/10 inline-flex items-center gap-1 whitespace-nowrap transition-colors"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>Bật GPS</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dòng GPS siêu gọn cho màn hình điện thoại nhỏ (để ô input luôn rộng thoáng) */}
        <div className="sm:hidden mt-2.5 flex items-center justify-center gap-2 text-xs">
          {gpsStatus === 'locating' ? (
            <span className="inline-flex items-center gap-1.5 text-[#616E7C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D96B38] animate-pulse" />
              <span>Đang định vị...</span>
            </span>
          ) : hasRealGps ? (
            <button
              type="button"
              onClick={onRequestGps}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3A6B5C]/10 text-[#3A6B5C] font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F9E66]" />
              <span>Gần bạn</span>
            </button>
          ) : (
            <>
              <div className="relative inline-flex items-center">
                <select
                  aria-label="Chọn quận"
                  value={selectedDistrict}
                  onChange={(e) =>
                    onSelectedDistrictChange(
                      e.target.value as District | 'Tất cả khu vực'
                    )
                  }
                  className="appearance-none h-7 pl-2.5 pr-6 rounded-full bg-white border border-stone-200 text-xs font-medium text-[#1F2933] focus:outline-none focus:border-[#3A6B5C]"
                >
                  <option value="Tất cả khu vực">Tất cả quận</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[#616E7C] absolute right-2 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={onRequestGps}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#3A6B5C] px-2 py-1 rounded-full hover:bg-[#3A6B5C]/10"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>Bật GPS</span>
              </button>
            </>
          )}
        </div>

        {/* Hàng chọn nhanh lỗi (Minimal Chips — nền trung tính, đổi xanh rêu đậm khi chọn) */}
        <div
          role="group"
          aria-label="Chọn nhanh lỗi cần sửa"
          className="mt-4 flex flex-wrap items-center justify-center gap-2"
        >
          {MINIMAL_PROBLEM_CHIPS.map((chip) => {
            const isActive = selectedChipId === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  setSelectedChipId((prev) =>
                    prev === chip.id ? null : chip.id
                  )
                }
                className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#3A6B5C] text-white shadow-2xs'
                    : 'bg-[#EFE9E0]/85 text-[#52606D] hover:bg-[#E6DDD0] hover:text-[#1F2933]'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Thanh tiện ích siêu gọn — 1 dòng duy nhất */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs sm:text-[13px] text-[#616E7C]">
          <button
            type="button"
            onClick={() => setPriceModalOpen(true)}
            className="inline-flex items-center gap-1.5 font-medium text-[#52606D] hover:text-[#D96B38] transition-colors py-1"
          >
            <Tag className="w-3.5 h-3.5 text-[#D96B38]" />
            <span>So sánh giá tiết kiệm</span>
          </button>

          <span className="text-stone-300 select-none" aria-hidden="true">
            ·
          </span>

          <button
            type="button"
            onClick={onOpenFullMap}
            className="inline-flex items-center gap-1 font-medium text-[#52606D] hover:text-[#3A6B5C] transition-colors py-1"
          >
            <span>Mở toàn bộ bản đồ</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Danh sách gợi ý cô chú thợ tối giản (1 cột, max-w-2xl) */}
      <section className="max-w-2xl mx-auto pt-4 sm:pt-6 space-y-3.5">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="text-sm font-semibold text-[#1F2933] flex items-center gap-2">
            <span>{sectionTitle}</span>
            {!isLoading && !dbError && (
              <span className="text-xs font-normal text-[#7B8794] tabular-nums">
                · {suggestedArtisans.length}
              </span>
            )}
          </h2>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-medium text-[#D96B38] hover:underline"
            >
              Xóa lọc
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#616E7C]">
            <Loader2 className="w-5 h-5 text-[#3A6B5C] animate-spin" />
            <p className="text-xs">Đang tải danh sách cô chú thợ...</p>
          </div>
        ) : dbError ? (
          <div
            role="alert"
            className="rounded-2xl bg-white border border-[#C84B31]/25 p-6 text-center space-y-3"
          >
            <WifiOff className="w-6 h-6 text-[#C84B31] mx-auto" />
            <p className="text-xs text-[#7A2B1B] leading-relaxed">{dbError}</p>
            <button
              type="button"
              onClick={onRetryLoad}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#C84B31] hover:bg-[#B03D25] text-white text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử tải lại</span>
            </button>
          </div>
        ) : suggestedArtisans.length === 0 ? (
          <div className="rounded-2xl bg-white border border-stone-200/85 px-6 py-10 text-center space-y-3">
            <p className="text-sm font-medium text-[#1F2933]">
              Chưa tìm thấy cô chú thợ phù hợp
            </p>
            <p className="text-xs text-[#616E7C]">
              Thử từ khóa khác ngắn hơn, hoặc gợi ý cô chú thợ quen gần bạn.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1 text-xs">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-full bg-[#3A6B5C] text-white font-medium hover:bg-[#2F594C] transition-colors"
                >
                  Xem tất cả
                </button>
              )}
              <button
                type="button"
                onClick={onRequestSuggest}
                className="px-4 py-2 rounded-full border border-stone-200 bg-white text-[#1F2933] font-medium hover:border-[#D96B38] hover:text-[#D96B38] transition-colors"
              >
                Gợi ý thợ mới
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {suggestedArtisans.map(({ artisan, distanceKm }) => {
              const isWorking = artisan.status === 'working';
              const showShortTitle =
                Boolean(artisan.shortTitle) &&
                !normalizeVietnamese(artisan.name).includes(
                  normalizeVietnamese(artisan.shortTitle)
                );

              return (
                <button
                  key={artisan.id}
                  type="button"
                  onClick={() => onSelectArtisanOnMap(artisan)}
                  className="group w-full text-left rounded-2xl bg-white border border-stone-200/85 hover:border-[#3A6B5C]/45 hover:shadow-[0_6px_22px_rgba(31,41,51,0.05)] px-4 sm:px-5 py-4 space-y-1.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A6B5C]"
                >
                  {/* Dòng 1: Tên cô chú + nghề ngắn | Khoảng cách GPS + chấm xanh đang làm việc */}
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0 flex-1 truncate">
                      <span className="text-[15px] font-semibold text-[#1F2933] group-hover:text-[#3A6B5C] transition-colors">
                        {artisan.name}
                      </span>
                      {showShortTitle && (
                        <span className="text-xs text-[#616E7C] font-normal">
                          {' · '}
                          {artisan.shortTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {distanceKm !== null && (
                        <span className="text-xs font-semibold text-[#3A6B5C] tabular-nums whitespace-nowrap">
                          {formatCompactDistance(distanceKm)}
                        </span>
                      )}
                      {isWorking && (
                        <span
                          title="Đang làm việc"
                          aria-label="Đang làm việc"
                          className="w-2 h-2 rounded-full bg-[#2F9E66] shrink-0"
                        />
                      )}
                    </div>
                  </div>

                  {/* Dòng 2: 1 dòng duy nhất màu xám dịu hiển thị mốc địa chỉ */}
                  <p className="text-xs sm:text-[13px] text-[#616E7C] truncate">
                    {artisan.addressLandmark}
                    {artisan.district ? ` · ${artisan.district}` : ''}
                  </p>

                  {/* Dòng 3: Giá tham khảo + Thanh toán | Xem bản đồ → */}
                  <div className="pt-1 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <span className="font-semibold text-[#D96B38] tabular-nums whitespace-nowrap">
                        {artisan.minPriceLabel}
                      </span>
                      <span className="text-stone-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-[#616E7C] truncate">
                        {artisan.paymentMethod}
                      </span>
                    </div>

                    <span className="text-[#7B8794] group-hover:text-[#D96B38] font-medium whitespace-nowrap shrink-0 transition-colors">
                      Xem bản đồ →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <PriceComparisonModal
        isOpen={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
      />
    </div>
  );
}
