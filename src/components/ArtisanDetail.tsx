import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Bike,
  Clock,
  CreditCard,
  ExternalLink,
  Flag,
  Footprints,
  Loader2,
  MapPin,
  Navigation,
  ParkingCircle,
  QrCode,
  Recycle,
  Route,
  Share2,
  Sparkles,
  Wrench,
} from 'lucide-react';
import type {
  Artisan,
  KudosKey,
  RouteInfo,
  ThankYouNote,
  TravelMode,
  UserLocation,
} from '../types/artisan';
import {
  buildGoogleMapsDirectionsUrl,
  formatDistanceMeters,
  formatDistanceWithPrefix,
  formatDuration,
} from '../utils/geo';
import { getStatusDisplay } from './ArtisanCard';
import { ArtisanIllustration } from './ArtisanIllustration';
import { PraiseCorner } from './PraiseCorner';
import { WallOfThanksSection } from './WallOfThanksSection';

interface ArtisanDetailProps {
  artisan: Artisan;
  distanceKm?: number | null;
  userLocation: UserLocation | null;
  routeInfo: RouteInfo | null;
  isRouting: boolean;
  travelMode: TravelMode;
  userKudosKeys: KudosKey[];
  approvedThankYouNotes: ThankYouNote[];
  onBack: () => void;
  onShare: (artisan: Artisan) => void;
  onMarkRevived: (artisan: Artisan) => void;
  onSubmitThankYou: (
    artisan: Artisan,
    payload: { author: string; message: string }
  ) => void;
  onDrawRoute: (artisan: Artisan, mode?: TravelMode) => void;
  onChangeTravelMode: (mode: TravelMode) => void;
  onOpenQr: (artisan: Artisan) => void;
  onOpenStatusReport: (artisan: Artisan) => void;
  onToggleKudos: (artisanId: string, kudosKey: KudosKey) => void;
  onAddPraise: (
    artisanId: string,
    payload: {
      author: string;
      kudosKey: KudosKey;
      comment: string;
    }
  ) => void;
}

export function ArtisanDetail({
  artisan,
  distanceKm,
  userLocation,
  routeInfo,
  isRouting,
  travelMode,
  userKudosKeys,
  approvedThankYouNotes,
  onBack,
  onShare,
  onMarkRevived,
  onSubmitThankYou,
  onDrawRoute,
  onChangeTravelMode,
  onOpenQr,
  onOpenStatusReport,
  onToggleKudos,
  onAddPraise,
}: ArtisanDetailProps) {
  const statusInfo = getStatusDisplay(artisan.status);
  const isRouteActiveForArtisan = routeInfo?.artisanId === artisan.id;
  const gmapsUrl = buildGoogleMapsDirectionsUrl(
    artisan.coordinates,
    userLocation?.coords,
    travelMode
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header quay lại danh sách + nút Chia sẻ nhanh (Deep Linking) */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-2 px-4 h-14 bg-white/95 backdrop-blur-md border-b border-[#EBE5DC] shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-[#1F2933] hover:text-[#D96B38] transition-colors -ml-1 px-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96B38]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="whitespace-nowrap">Quay lại danh sách</span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.bgClass} ${statusInfo.textClass} whitespace-nowrap`}
          >
            {statusInfo.label}
          </span>

          <button
            type="button"
            onClick={() => onShare(artisan)}
            title="Chia sẻ link địa chỉ cô chú"
            aria-label="Chia sẻ địa chỉ người thợ"
            className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] hover:border-[#D96B38] hover:text-[#D96B38] text-[#1F2933] inline-flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>
        </div>
      </div>

      {/* Nội dung cuộn chi tiết */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {/* Ảnh góc làm việc / bàn tay làm nghề */}
        <div className="relative aspect-[4/3] w-full bg-[#F4EFE6] overflow-hidden">
          <ArtisanIllustration
            variant={artisan.illustrationVariant}
            customImageUrl={artisan.customImageUrl}
            alt={`Góc làm việc của ${artisan.name}`}
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#1F2933]/70 via-[#1F2933]/25 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-white">
            <span className="text-xs font-medium text-white/95">
              {artisan.categories.join(' · ')}
            </span>
            {typeof distanceKm === 'number' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#1F2933]/75 backdrop-blur-xs px-2.5 py-1 rounded-lg tabular-nums">
                <Navigation className="w-3 h-3 text-[#F5C09E]" />
                {formatDistanceWithPrefix(distanceKm)}
              </span>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* Tên gọi + Huy hiệu xác minh */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#1F2933] leading-snug">
              {artisan.name}
            </h2>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {artisan.isCommunitySuggested ? (
                <span className="inline-flex items-center gap-1 font-semibold text-[#D96B38]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Mới đề xuất bởi cộng đồng
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-[#3A6B5C]">
                  <BadgeCheck className="w-4 h-4" />
                  Đã xác minh: {artisan.verifiedDate}
                </span>
              )}
              <span className="text-[#CBD2D9]" aria-hidden="true">
                ·
              </span>
              <span className="text-[#52606D] font-medium">
                {artisan.district}, TP.HCM
              </span>
            </div>
          </div>

          {/* Khối định vị & Vẽ lộ trình trực tiếp trên bản đồ */}
          <div className="rounded-2xl bg-[#FAF8F5] border border-[#E5DFD5] p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F2933]">
                <Route className="w-4 h-4 text-[#D96B38]" />
                <span>Vẽ đường đi từ vị trí GPS</span>
              </div>

              <div className="inline-flex p-0.5 rounded-lg bg-[#EAE3D8]">
                <button
                  type="button"
                  onClick={() => onChangeTravelMode('driving')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                    travelMode === 'driving'
                      ? 'bg-white text-[#1F2933] shadow-xs'
                      : 'text-[#52606D] hover:text-[#1F2933]'
                  }`}
                >
                  <Bike className="w-3 h-3" />
                  <span>Xe máy</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTravelMode('walking')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                    travelMode === 'walking'
                      ? 'bg-white text-[#1F2933] shadow-xs'
                      : 'text-[#52606D] hover:text-[#1F2933]'
                  }`}
                >
                  <Footprints className="w-3 h-3" />
                  <span>Đi bộ</span>
                </button>
              </div>
            </div>

            {isRouteActiveForArtisan && routeInfo ? (
              <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-[#EBE5DC] px-3 py-2.5">
                <div className="text-xs text-[#52606D] tabular-nums">
                  <span className="font-bold text-[#D96B38] text-sm">
                    {formatDistanceMeters(routeInfo.distanceMeters)}
                  </span>
                  {' · '}
                  <span className="font-semibold text-[#1F2933]">
                    {formatDuration(routeInfo.durationSeconds)}
                  </span>
                  <span className="block text-[11px] text-[#7B8794] mt-0.5">
                    Từ {userLocation?.label || 'vị trí của bạn'} (đã vẽ trên bản đồ)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onDrawRoute(artisan, travelMode)}
                  className="text-xs font-semibold text-[#3A6B5C] hover:underline whitespace-nowrap shrink-0"
                >
                  Cập nhật
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onDrawRoute(artisan, travelMode)}
                disabled={isRouting}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#3A6B5C] hover:bg-[#2F594C] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                {isRouting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tính lộ trình...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>
                      {userLocation
                        ? 'Vẽ đường đi trên bản đồ'
                        : 'Định vị GPS & vẽ đường đi'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Mốc nhận diện góc phố */}
          <section className="space-y-1.5">
            <h3 className="text-xs font-bold text-[#52606D] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D96B38]" />
              <span>Mốc nhận diện góc phố</span>
            </h3>
            <p className="text-sm text-[#1F2933] leading-relaxed font-medium">
              {artisan.addressLandmark}
            </p>
          </section>

          {/* Khung giờ hoạt động + 2 nhãn Thanh toán & Chỗ đậu xe */}
          <section className="space-y-2.5 pt-4 border-t border-[#EBE5DC]">
            <h3 className="text-xs font-bold text-[#52606D] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#3A6B5C]" />
              <span>Khung giờ hoạt động</span>
            </h3>
            <p className="text-sm font-semibold text-[#1F2933] tabular-nums">
              {artisan.hours}
            </p>

            {/* Tag Thanh toán & Chỗ đậu xe (xóa rào cản tâm lý cho sinh viên trước khi ghé) */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  artisan.paymentMethod === 'Có chuyển khoản'
                    ? 'bg-[#3A6B5C]/10 border-[#3A6B5C]/25 text-[#3A6B5C]'
                    : 'bg-[#FAF8F5] border-[#E5DFD5] text-[#52606D]'
                }`}
              >
                {artisan.paymentMethod === 'Có chuyển khoản' ? (
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Banknote className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{artisan.paymentMethod}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  artisan.parkingInfo === 'Dễ đậu xe'
                    ? 'bg-[#3A6B5C]/10 border-[#3A6B5C]/25 text-[#3A6B5C]'
                    : 'bg-[#E9A825]/12 border-[#E9A825]/30 text-[#9A6807]'
                }`}
              >
                <ParkingCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{artisan.parkingInfo}</span>
              </span>
            </div>

            <p className="text-xs text-[#52606D] leading-relaxed">
              Giờ làm việc có thể thay đổi linh hoạt tùy thời tiết hoặc việc cá nhân của cô chú.
            </p>
          </section>

          {/* Bảng giá tham khảo */}
          <section className="space-y-2.5 pt-4 border-t border-[#EBE5DC]">
            <h3 className="text-xs font-bold text-[#52606D] flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#D96B38]" />
              <span>Bảng giá tham khảo</span>
            </h3>

            <div className="rounded-xl border border-[#EBE5DC] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-[#F0EAE1]">
                  {artisan.prices.map((row, idx) => (
                    <tr
                      key={`${row.service}-${idx}`}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]/70'}
                    >
                      <td className="py-2.5 px-3 text-xs sm:text-[13px] text-[#1F2933]">
                        {row.service}
                      </td>
                      <td className="py-2.5 px-3 text-xs sm:text-[13px] font-semibold text-[#1F2933] text-right whitespace-nowrap tabular-nums">
                        {row.priceRange}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-[#52606D] flex items-start gap-1.5 leading-relaxed">
              <AlertCircle className="w-3.5 h-3.5 text-[#E9A825] shrink-0 mt-0.5" />
              <span>
                Giá thực tế có thể thay đổi tùy tình trạng đồ. Bạn nhớ hỏi xác nhận giá trước khi sửa nhé!
              </span>
            </p>
          </section>

          {/* Góc nghề & Tay nghề */}
          <section className="space-y-2 pt-4 border-t border-[#EBE5DC]">
            <h3 className="text-sm font-bold text-[#1F2933]">
              Góc nghề & Tay nghề
            </h3>
            <p className="text-sm text-[#52606D] leading-relaxed">
              {artisan.story}
            </p>
            <p className="text-xs text-[#52606D] pt-1">
              <span className="font-semibold text-[#1F2933]">Nhận sửa: </span>
              {artisan.problems.join(' · ')}
            </p>
          </section>

          {/* Cộng đồng khen ngợi (Quick Kudos + Góc khen ngợi) */}
          <PraiseCorner
            artisan={artisan}
            userKudosKeys={userKudosKeys}
            onToggleKudos={onToggleKudos}
            onAddPraise={onAddPraise}
          />

          {/* Sổ lưu bút cảm ơn (Wall of Thanks) */}
          <WallOfThanksSection
            artisan={artisan}
            approvedNotes={approvedThankYouNotes}
            onSubmitThankYou={onSubmitThankYou}
          />
        </div>
      </div>

      {/* Thanh hành động dính ở đáy: Nút "Tôi đã đến sửa đồ ở đây" + Sticky Action Bar */}
      <div
        className="sticky bottom-0 z-20 px-4 py-3 bg-white border-t border-[#EBE5DC] shadow-[0_-4px_14px_rgba(31,41,51,0.06)] shrink-0 space-y-2"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      >
        {/* Bộ đếm Món đồ được hồi sinh (Impact Counter CTA) */}
        <button
          type="button"
          onClick={() => onMarkRevived(artisan)}
          className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#3A6B5C] hover:bg-[#2F594C] active:scale-[0.99] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          <Recycle className="w-4 h-4 shrink-0" />
          <span>♻️ Tôi đã đến sửa đồ ở đây</span>
          {typeof artisan.revivedCount === 'number' && artisan.revivedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold tabular-nums">
              {artisan.revivedCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
          >
            <span>Chỉ đường Google Maps</span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>

          {/* Nút Mã QR chỉ hiển thị trên Desktop */}
          <button
            type="button"
            onClick={() => onOpenQr(artisan)}
            title="Quét mã QR để mở chỉ đường trên điện thoại"
            className="hidden lg:inline-flex min-h-[44px] px-3 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] hover:border-[#D96B38] hover:text-[#D96B38] text-[#1F2933] text-xs font-semibold items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Mã QR</span>
          </button>

          {/* Nút Báo tình trạng */}
          <button
            type="button"
            onClick={() => onOpenStatusReport(artisan)}
            title="Cập nhật tình trạng làm việc của cô chú"
            className="min-h-[44px] px-3 py-2.5 rounded-xl border border-[#E5DFD5] bg-white hover:bg-[#FAF8F5] text-[#52606D] hover:text-[#1F2933] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">Báo tình trạng</span>
          </button>
        </div>
      </div>
    </div>
  );
}
