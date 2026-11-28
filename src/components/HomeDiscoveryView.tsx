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
    <div className="bg-[#FDF8F2] px-4 sm:px-6 pb-14 lg:pb-16">
      {/* Khu vực tìm kiếm siêu tối giản (1 cột căn giữa, khoảng trắng thoáng) */}
      <section className="max-w-2xl mx-auto pt-10 sm:pt-20 pb-8 sm:pb-10">
        {/* Tiêu đề duy nhất với font display ấm áp, sắc nét */}
        <h1 className="font-display text-center text-2xl sm:text-[38px] font-extrabold text-[#162442] tracking-tight leading-tight mb-6 sm:mb-8">
          Bạn đang cần sửa gì hôm nay?
        </h1>

        {/* Thanh tìm kiếm trung tâm viền xanh chàm & bóng cứng khi focus */}
        <div className="rounded-2xl bg-white border-[1.5px] border-[#1B3B82]/25 shadow-[0_2px_10px_rgba(22,36,66,0.03)] focus-within:border-[#1B3B82] focus-within:shadow-[4px_4px_0px_#1B3B82] transition-all duration-200">
          <div className="flex items-center gap-2 pl-4 pr-2.5 h-14 sm:h-15">
            <Search className="w-5 h-5 text-[#1B3B82]/70 shrink-0 pointer-events-none" />

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="VD: hở keo giày, hư dây kéo, sửa khóa..."
              aria-label="Tìm lỗi hỏng cần sửa"
              className="flex-1 min-w-0 h-full bg-transparent text-sm sm:text-[15px] text-[#162442] placeholder:text-[#8E8579] focus:outline-none"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="w-7 h-7 rounded-full text-[#5C564E] hover:text-[#162442] hover:bg-[#FDF8F2] flex items-center justify-center shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* 1 nhãn GPS / Quận siêu gọn tích hợp ngay góc phải thanh tìm kiếm */}
            <div className="hidden sm:flex items-center shrink-0 pl-2 border-l border-dashed border-[#DFCBB5]">
              {gpsStatus === 'locating' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDF8F2] border border-[#E6D5C3] text-[11.5px] font-medium text-[#5C564E] whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E86F2C] animate-pulse" />
                  <span>Đang định vị...</span>
                </span>
              ) : hasRealGps ? (
                <button
                  type="button"
                  onClick={onRequestGps}
                  title="Bấm để định vị lại GPS"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF2FA] hover:bg-[#1B3B82]/14 border border-[#1B3B82]/20 text-[11.5px] font-semibold text-[#1B3B82] whitespace-nowrap transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
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
                      className="appearance-none h-8 pl-2.5 pr-6 rounded-full bg-[#FDF8F2] hover:bg-[#F3ECE2] border border-[#E6D5C3] text-[11.5px] font-medium text-[#162442] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1B3B82]/30 transition-colors"
                    >
                      <option value="Tất cả khu vực">Tất cả quận</option>
                      {availableDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-[#5C564E] absolute right-2 pointer-events-none" />
                  </div>

                  <button
                    type="button"
                    onClick={onRequestGps}
                    title="Bật định vị GPS"
                    className="h-8 px-2.5 rounded-full text-[11.5px] font-semibold text-[#1B3B82] hover:bg-[#EEF2FA] inline-flex items-center gap-1 whitespace-nowrap transition-colors"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>Bật GPS</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dòng GPS siêu gọn cho màn hình điện thoại nhỏ */}
        <div className="sm:hidden mt-2.5 flex items-center justify-center gap-2 text-xs">
          {gpsStatus === 'locating' ? (
            <span className="inline-flex items-center gap-1.5 text-[#5C564E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E86F2C] animate-pulse" />
              <span>Đang định vị...</span>
            </span>
          ) : hasRealGps ? (
            <button
              type="button"
              onClick={onRequestGps}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF2FA] border border-[#1B3B82]/20 text-[#1B3B82] font-semibold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
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
                  className="appearance-none h-7 pl-2.5 pr-6 rounded-full bg-white border border-[#E6D5C3] text-xs font-medium text-[#162442] focus:outline-none focus:border-[#1B3B82]"
                >
                  <option value="Tất cả khu vực">Tất cả quận</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[#5C564E] absolute right-2 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={onRequestGps}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B3B82] px-2.5 py-1 rounded-full hover:bg-[#EEF2FA]"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>Bật GPS</span>
              </button>
            </>
          )}
        </div>

        {/* Hàng chọn nhanh lỗi (Craft Chips — nền trắng viền cát, active Xanh Chàm + bóng cam) */}
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
                className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-[#1B3B82] text-[#FDF8F2] border-[#162442] shadow-[2px_2px_0px_#E86F2C]'
                    : 'bg-white text-[#5C564E] border-[#E6D5C3] hover:border-[#1B3B82]/50 hover:text-[#162442]'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Thanh tiện ích siêu gọn — 1 dòng duy nhất */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs sm:text-[13px] text-[#5C564E]">
          <button
            type="button"
            onClick={() => setPriceModalOpen(true)}
            className="inline-flex items-center gap-1.5 font-semibold text-[#5C564E] hover:text-[#E86F2C] transition-colors py-1"
          >
            <Tag className="w-3.5 h-3.5 text-[#E86F2C]" />
            <span>So sánh giá tiết kiệm</span>
          </button>

          <span className="text-[#D8C3AE] select-none" aria-hidden="true">
            ·
          </span>

          <button
            type="button"
            onClick={onOpenFullMap}
            className="inline-flex items-center gap-1 font-semibold text-[#5C564E] hover:text-[#1B3B82] transition-colors py-1"
          >
            <span>Mở toàn bộ bản đồ</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#1B3B82]" />
          </button>
        </div>
      </section>

      {/* Danh sách gợi ý cô chú thợ dạng Phiếu Góc Thợ (Repair Ticket Card) */}
      <section className="max-w-2xl mx-auto pt-4 sm:pt-6 space-y-3.5">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="font-display text-sm sm:text-base font-bold text-[#162442] flex items-center gap-2">
            <span>{sectionTitle}</span>
            {!isLoading && !dbError && (
              <span className="font-mono text-xs font-semibold text-[#5C564E] tabular-nums">
                · {suggestedArtisans.length}
              </span>
            )}
          </h2>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#B93818] hover:underline"
            >
              Xóa lọc
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#5C564E]">
            <Loader2 className="w-5 h-5 text-[#1B3B82] animate-spin" />
            <p className="text-xs">Đang tải danh sách cô chú thợ...</p>
          </div>
        ) : dbError ? (
          <div
            role="alert"
            className="rounded-2xl bg-white border border-[#B93818]/30 p-6 text-center space-y-3"
          >
            <WifiOff className="w-6 h-6 text-[#B93818] mx-auto" />
            <p className="text-xs text-[#7F240E] leading-relaxed">{dbError}</p>
            <button
              type="button"
              onClick={onRetryLoad}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#B93818] hover:bg-[#9C2E13] text-[#FDF8F2] text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử tải lại</span>
            </button>
          </div>
        ) : suggestedArtisans.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E6D5C3] px-6 py-10 text-center space-y-3">
            <p className="font-display text-base font-bold text-[#162442]">
              Chưa tìm thấy cô chú thợ phù hợp
            </p>
            <p className="text-xs text-[#5C564E]">
              Thử từ khóa khác ngắn hơn, hoặc gợi ý cô chú thợ quen gần bạn.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1 text-xs">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-full bg-[#1B3B82] text-[#FDF8F2] border-[1.5px] border-[#162442] shadow-[2px_2px_0px_#E86F2C] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-semibold transition-all"
                >
                  Xem tất cả
                </button>
              )}
              <button
                type="button"
                onClick={onRequestSuggest}
                className="px-4 py-2 rounded-full border border-[#E6D5C3] bg-white text-[#162442] font-semibold hover:border-[#E86F2C] hover:text-[#E86F2C] transition-colors"
              >
                Gợi ý thợ mới
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
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
                  className="group w-full text-left rounded-2xl bg-white border border-[#E6D5C3] hover:border-[#1B3B82] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1B3B82] px-4 sm:px-5 py-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82]"
                >
                  {/* Phần thân phiếu: Tên + nghề ngắn | Khoảng cách & Con dấu mực Đang làm việc */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="font-display text-[16px] font-bold text-[#162442] group-hover:text-[#1B3B82] transition-colors">
                          {artisan.name}
                        </span>
                        {showShortTitle && (
                          <span className="text-xs text-[#5C564E] font-normal">
                            {' · '}
                            {artisan.shortTitle}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {distanceKm !== null && (
                          <span className="font-mono text-xs font-semibold text-[#1B3B82] tabular-nums whitespace-nowrap">
                            {formatCompactDistance(distanceKm)}
                          </span>
                        )}
                        {isWorking && (
                          <span className="-rotate-2 inline-flex items-center gap-1 border border-[#15803D]/50 text-[#15803D] bg-[#15803D]/5 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                            Đang mở
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mốc địa chỉ gọn 1 dòng */}
                    <p className="text-xs sm:text-[13px] text-[#5C564E] truncate">
                      {artisan.addressLandmark}
                      {artisan.district ? ` · ${artisan.district}` : ''}
                    </p>
                  </div>

                  {/* Cuống phiếu (Ticket Stub) tách bằng đường chỉ đứt nét */}
                  <div className="mt-3 pt-2.5 border-t border-dashed border-[#DFCBB5] flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <span className="font-mono font-bold text-[#E86F2C] tabular-nums whitespace-nowrap">
                        {artisan.minPriceLabel}
                      </span>
                      <span className="text-[#D8C3AE]" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-[#5C564E] truncate">
                        {artisan.paymentMethod}
                      </span>
                    </div>

                    <span className="text-[#1B3B82] group-hover:text-[#E86F2C] font-semibold whitespace-nowrap shrink-0 transition-colors">
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
