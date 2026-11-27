import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Banknote,
  ChevronRight,
  CreditCard,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Navigation,
  RefreshCw,
  RotateCcw,
  Search,
  Wallet,
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
import { getStatusDisplay } from './ArtisanCard';
import { ArtisanIllustration } from './ArtisanIllustration';
import { PriceComparisonModal } from './PriceComparisonModal';

interface HomeProblemPreset {
  id: string;
  label: string;
  categories?: CraftCategory[];
  keywords?: string[];
}

const HOME_PROBLEM_PRESETS: HomeProblemPreset[] = [
  {
    id: 'all',
    label: 'Tất cả góc thợ',
  },
  {
    id: 'shoes',
    label: 'Bung keo / sửa giày',
    categories: ['Sửa giày dép'],
    keywords: ['giay', 'dep', 'bung de', 'bung keo', 'khau de', 'got giay'],
  },
  {
    id: 'tailor',
    label: 'Hư dây kéo / may vá',
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
    label: 'Sửa đồng hồ',
    categories: ['Sửa đồng hồ'],
    keywords: ['dong ho', 'thay pin', 'day da', 'cat mat'],
  },
  {
    id: 'bag',
    label: 'Sửa túi xách / balo',
    categories: ['Sửa balo/túi'],
    keywords: ['balo', 'tui', 'vali', 'quai deo', 'khoa keo'],
  },
  {
    id: 'electronics',
    label: 'Sửa đồ điện nhỏ',
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
  const [selectedPresetId, setSelectedPresetId] = useState<string>('all');
  const [onlyWorking, setOnlyWorking] = useState(false);
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

  const activePreset = useMemo(
    () =>
      HOME_PROBLEM_PRESETS.find((p) => p.id === selectedPresetId) ??
      HOME_PROBLEM_PRESETS[0],
    [selectedPresetId]
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

      if (onlyWorking && artisan.status !== 'working') {
        return false;
      }

      // Lọc theo chip lỗi hỏng chọn nhanh
      if (activePreset.id !== 'all') {
        const categoryMatch =
          activePreset.categories?.some((cat) =>
            artisan.categories.includes(cat)
          ) ?? false;

        const searchablePresetText = normalizeVietnamese(
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
          activePreset.keywords?.some((kw) =>
            searchablePresetText.includes(kw)
          ) ?? false;

        if (!categoryMatch && !keywordMatch) {
          return false;
        }
      }

      // Lọc theo từ khóa tự gõ
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
      distanceKm: hasRealGps && userLocation
        ? calculateDistanceKm(userLocation.coords, artisan.coordinates)
        : null,
    }));

    enriched.sort((a, b) => {
      // Ưu tiên cô chú đang làm việc
      const aWorking = a.artisan.status === 'working' ? 0 : 1;
      const bWorking = b.artisan.status === 'working' ? 0 : 1;
      if (aWorking !== bWorking) return aWorking - bWorking;

      // Sắp xếp theo khoảng cách GPS gần nhất nếu có
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
    onlyWorking,
    activePreset,
    hasRealGps,
    userLocation,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedPresetId !== 'all' ||
    selectedDistrict !== 'Tất cả khu vực' ||
    onlyWorking;

  const handleResetFilters = () => {
    onSearchQueryChange('');
    setSelectedPresetId('all');
    onSelectedDistrictChange('Tất cả khu vực');
    setOnlyWorking(false);
  };

  return (
    <div className="min-h-full bg-[#FAF8F5] pb-24 lg:pb-14">
      {/* Khối mở đầu ấm áp, tập trung hoàn toàn vào nhu cầu sửa chữa & GPS */}
      <section className="bg-gradient-to-b from-white via-[#FFFBF6] to-[#FAF8F5] border-b border-[#EDE6DC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-7 sm:pt-11 pb-7 sm:pb-9 space-y-5">
          {/* Tiêu đề & phụ đề ngắn gọn */}
          <div className="space-y-2 max-w-2xl">
            <h1
              className="text-2xl sm:text-4xl font-bold text-[#1F2933] tracking-tight leading-[1.18]"
              style={{ textWrap: 'balance' }}
            >
              Hôm nay bạn đang cần tìm chỗ sửa lỗi gì?
            </h1>
            <p className="text-sm sm:text-base text-[#52606D] leading-relaxed">
              Tìm nhanh cô chú thợ lành nghề, giá bình dân ngay quanh khu phố —
              đỡ tốn tiền mua mới, lại giữ được món đồ quen thuộc.
            </p>
          </div>

          {/* Thanh tìm kiếm lớn + Trạng thái GPS gọn ngay phía dưới */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-5 h-5 text-[#D96B38] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Gõ lỗi hỏng cần sửa... (VD: bung đế giày, hư dây kéo, thay pin, sửa khóa)"
                aria-label="Tìm kiếm lỗi hỏng hoặc tên cô chú thợ"
                className="w-full h-13 sm:h-14 pl-12 pr-11 rounded-2xl bg-white border border-[#E2D9CC] text-sm sm:text-base text-[#1F2933] placeholder:text-[#7B8794] shadow-[0_6px_22px_rgba(31,41,51,0.05)] focus:outline-none focus:border-[#D96B38] focus:ring-4 focus:ring-[#D96B38]/12 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl text-[#7B8794] hover:text-[#1F2933] hover:bg-[#F4EFE6] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dải trạng thái GPS gọn nhẹ */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white/90 border border-[#EAE2D6] text-xs">
              {gpsStatus === 'locating' ? (
                <div className="flex items-center gap-2 text-[#52606D] font-medium">
                  <Loader2 className="w-3.5 h-3.5 text-[#D96B38] animate-spin shrink-0" />
                  <span>Đang định vị vị trí của bạn...</span>
                </div>
              ) : hasRealGps ? (
                <>
                  <div className="flex items-center gap-2 text-[#2E5A4C] font-semibold">
                    <span
                      className="w-2 h-2 rounded-full bg-[#2F9E66] shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      Đã định vị — tự động sắp xếp cô chú gần bạn nhất
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onRequestGps}
                    className="inline-flex items-center gap-1 text-[#3A6B5C] hover:text-[#23483D] font-semibold whitespace-nowrap shrink-0 transition-colors"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>Định vị lại</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-[#52606D] font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#D96B38] shrink-0" />
                    <span>
                      Chưa bật GPS — chọn quận của bạn để tìm gần nhất
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Chọn quận của bạn"
                      value={selectedDistrict}
                      onChange={(e) =>
                        onSelectedDistrictChange(
                          e.target.value as District | 'Tất cả khu vực'
                        )
                      }
                      className="h-8 px-2.5 rounded-lg bg-[#FAF8F5] border border-[#E2D9CC] text-xs font-semibold text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                    >
                      <option value="Tất cả khu vực">Tất cả khu vực</option>
                      {availableDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={onRequestGps}
                      className="h-8 px-2.5 rounded-lg bg-[#3A6B5C]/10 hover:bg-[#3A6B5C]/18 text-[#3A6B5C] font-semibold inline-flex items-center gap-1 whitespace-nowrap transition-colors"
                    >
                      <LocateFixed className="w-3.5 h-3.5" />
                      <span>Bật định vị</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Chip chọn nhanh lỗi thường gặp */}
          <div className="space-y-3">
            <div
              role="group"
              aria-label="Chọn nhanh lỗi cần sửa"
              className="flex flex-wrap items-center gap-2"
            >
              {HOME_PROBLEM_PRESETS.map((preset) => {
                const isActive = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold border transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#D96B38] border-[#D96B38] text-white shadow-xs'
                        : 'bg-white border-[#E5DFD5] text-[#1F2933] hover:border-[#D96B38]/60 hover:bg-[#FFF9F4]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Nút / thẻ gọn "So sánh giá tiết kiệm" mở Modal (ẩn mặc định) */}
            <button
              type="button"
              onClick={() => setPriceModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#FFF6EE] hover:bg-[#FDEEE1] border border-[#F0D3BC] text-left transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96B38]"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-white border border-[#F0D3BC] text-[#D96B38] flex items-center justify-center shrink-0 shadow-2xs">
                  <Wallet className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs sm:text-sm font-bold text-[#1F2933]">
                    So sánh giá tiết kiệm
                  </span>
                  <span className="block text-[11px] sm:text-xs text-[#6B5446] leading-snug">
                    Check nhanh sửa ở góc thợ rẻ hơn bao nhiêu so với tiệm lớn
                    &amp; mua mới
                  </span>
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#D96B38] shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Danh sách gợi ý cô chú thợ phù hợp ngay bên dưới */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-bold text-[#1F2933]">
              {hasRealGps
                ? 'Cô chú thợ gợi ý gần bạn'
                : 'Cô chú thợ phù hợp quanh TP.HCM'}
            </h2>
            <p className="text-xs text-[#52606D] tabular-nums">
              {isLoading
                ? 'Đang tải danh sách cô chú thợ...'
                : `Hiển thị ${suggestedArtisans.length} góc thợ đã xác minh${
                    hasRealGps ? ' · Xếp theo khoảng cách gần nhất' : ''
                  }`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasRealGps && (
              <select
                aria-label="Lọc thêm theo quận"
                value={selectedDistrict}
                onChange={(e) =>
                  onSelectedDistrictChange(
                    e.target.value as District | 'Tất cả khu vực'
                  )
                }
                className="h-9 px-3 rounded-xl border border-[#E5DFD5] bg-white text-xs font-semibold text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
              >
                <option value="Tất cả khu vực">Tất cả khu vực</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

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

        {/* Trạng thái tải / lỗi / trống / danh sách */}
        {isLoading ? (
          <div className="rounded-2xl bg-white border border-[#EBE5DC] p-10 text-center space-y-2.5">
            <Loader2 className="w-6 h-6 text-[#D96B38] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#1F2933]">
              Đang tải danh sách cô chú thợ...
            </p>
            <p className="text-xs text-[#52606D]">
              Chờ một chút để đồng bộ các góc thợ đã xác minh quanh bạn nhé.
            </p>
          </div>
        ) : dbError ? (
          <div
            role="alert"
            className="rounded-2xl bg-[#C84B31]/8 border border-[#C84B31]/25 p-6 text-center space-y-3"
          >
            <WifiOff className="w-7 h-7 text-[#C84B31] mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#A3361F]">
                Không thể tải danh sách cô chú thợ
              </p>
              <p className="text-xs text-[#7A2B1B] leading-relaxed max-w-md mx-auto">
                {dbError}
              </p>
            </div>
            <button
              type="button"
              onClick={onRetryLoad}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C84B31] hover:bg-[#B03D25] text-white text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử tải lại</span>
            </button>
          </div>
        ) : suggestedArtisans.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#EBE5DC] p-8 text-center space-y-3.5">
            <MapPin className="w-8 h-8 text-[#D96B38]/65 mx-auto" />
            <div className="space-y-1 max-w-md mx-auto">
              <p className="text-base font-bold text-[#1F2933]">
                Chưa tìm thấy góc thợ khớp với yêu cầu này
              </p>
              <p className="text-xs sm:text-sm text-[#52606D] leading-relaxed">
                Thử chọn mục khác, xóa bớt bộ lọc, hoặc nếu bạn biết một cô chú
                thợ khéo tay gần đây hãy gợi ý cho cộng đồng nhé.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xem tất cả góc thợ</span>
                </button>
              )}
              <button
                type="button"
                onClick={onRequestSuggest}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E5DFD5] hover:border-[#3A6B5C] text-[#1F2933] text-xs font-semibold transition-colors"
              >
                <span>Gợi ý cô chú thợ mới</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedArtisans.map(({ artisan, distanceKm }) => {
              const statusInfo = getStatusDisplay(artisan.status);
              const statusDotClass =
                artisan.status === 'working'
                  ? 'bg-[#2F9E66]'
                  : artisan.status === 'off_today'
                    ? 'bg-[#E9A825]'
                    : 'bg-[#C84B31]';
              const primaryCraft = artisan.categories[0] ?? 'Thợ sửa chữa';

              return (
                <article
                  key={artisan.id}
                  onClick={() => onSelectArtisanOnMap(artisan)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectArtisanOnMap(artisan);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#D96B38]/65 hover:shadow-md p-4 flex flex-col justify-between gap-3.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96B38]"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-xl overflow-hidden shrink-0 bg-[#F4EFE6]">
                      <ArtisanIllustration
                        variant={artisan.illustrationVariant}
                        customImageUrl={artisan.customImageUrl}
                        alt={artisan.name}
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-bold text-[#1F2933] group-hover:text-[#D96B38] leading-snug line-clamp-2 transition-colors">
                            {artisan.name}
                          </h3>
                          <p className="text-xs font-medium text-[#52606D] mt-0.5 truncate">
                            {primaryCraft}
                            {artisan.categories.length > 1
                              ? ` · ${artisan.categories.slice(1).join(', ')}`
                              : ''}
                          </p>
                        </div>

                        {distanceKm !== null && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D96B38] tabular-nums whitespace-nowrap shrink-0 pt-0.5">
                            <Navigation className="w-3 h-3 shrink-0" />
                            <span>{formatCompactDistance(distanceKm)}</span>
                          </span>
                        )}
                      </div>

                      {/* Trạng thái · Giá tham khảo · Thanh toán (sạch, không nhồi pill) */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        <span
                          className={`inline-flex items-center gap-1.5 font-semibold ${statusInfo.textClass}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${statusDotClass}`}
                            aria-hidden="true"
                          />
                          {statusInfo.label}
                        </span>
                        <span className="text-[#CBD2D9]" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-bold text-[#1F2933] tabular-nums">
                          {artisan.minPriceLabel}
                        </span>
                        <span className="text-[#CBD2D9]" aria-hidden="true">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#52606D]">
                          {artisan.paymentMethod === 'Có chuyển khoản' ? (
                            <CreditCard className="w-3 h-3 text-[#3A6B5C]" />
                          ) : (
                            <Banknote className="w-3 h-3 text-[#7B8794]" />
                          )}
                          <span>{artisan.paymentMethod}</span>
                        </span>
                      </div>

                      {/* Mốc địa chỉ */}
                      <p className="text-xs text-[#52606D] flex items-start gap-1.5 leading-snug">
                        <MapPin className="w-3.5 h-3.5 text-[#9AA5B1] shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {artisan.addressLandmark} ({artisan.district})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Chân thẻ: CTA mở bản đồ */}
                  <div className="pt-2.5 border-t border-[#F2ECE3] flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#7B8794] truncate">
                      {artisan.problems.slice(0, 2).join(' · ')}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#D96B38] whitespace-nowrap shrink-0">
                      <span>Xem vị trí trên bản đồ</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Liên kết tinh tế mở toàn bộ bản đồ */}
        <div className="pt-5 pb-2 flex justify-center">
          <button
            type="button"
            onClick={onOpenFullMap}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white hover:bg-[#FFF9F4] border border-[#E5DFD5] hover:border-[#D96B38]/60 text-xs sm:text-sm font-semibold text-[#52606D] hover:text-[#D96B38] inline-flex items-center gap-2 transition-colors shadow-2xs"
          >
            <MapIcon className="w-4 h-4" />
            <span>Hoặc mở xem toàn bộ bản đồ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      <PriceComparisonModal
        isOpen={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
      />
    </div>
  );
}
