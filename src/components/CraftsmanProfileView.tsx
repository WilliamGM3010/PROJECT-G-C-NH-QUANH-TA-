import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Clock,
  CreditCard,
  ExternalLink,
  EyeOff,
  Flag,
  Heart,
  MapPin,
  Navigation,
  ParkingCircle,
  Phone,
  QrCode,
  Recycle,
  Share2,
  Sparkles,
  Tag,
  Wrench,
} from 'lucide-react';
import type {
  Artisan,
  KudosKey,
  ThankYouNote,
  TravelMode,
  UserLocation,
} from '../types/artisan';
import {
  buildGoogleMapsDirectionsUrl,
  formatDistanceWithPrefix,
} from '../utils/geo';
import { getStatusDisplay } from './ArtisanCard';
import { ArtisanIllustration } from './ArtisanIllustration';
import { PraiseCorner } from './PraiseCorner';
import { PriceComparisonModal } from './PriceComparisonModal';
import { WallOfThanksSection } from './WallOfThanksSection';

interface CraftsmanProfileViewProps {
  artisan: Artisan;
  distanceKm?: number | null;
  userLocation: UserLocation | null;
  travelMode: TravelMode;
  userKudosKeys: KudosKey[];
  approvedThankYouNotes: ThankYouNote[];
  isFavorite?: boolean;
  currentUserDisplayName: string;
  onBackToMap: () => void;
  onOpenOnMap: (artisan: Artisan) => void;
  onShare: (artisan: Artisan) => void;
  onToggleFavorite: (artisanId: string) => void;
  onMarkRevived: (artisan: Artisan) => void;
  onSubmitThankYou: (
    artisan: Artisan,
    payload: { author: string; message: string }
  ) => boolean | void;
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
  ) => boolean | Promise<boolean | void> | void;
}

/**
 * Trang Hồ sơ Chi tiết Người thợ (/tho/<id>) theo concept THE NEIGHBORHOOD CRAFT:
 * - Hero 2 cột thoáng rộng, tôn trọng quyền riêng tư (hidePortrait)
 * - Câu chuyện nghề trình bày bằng font Lora serif editorial
 * - Bảng giá thủ công viền đứt nét + Modal So sánh với mua mới
 * - Góc khen ngợi & Sổ lưu bút cảm ơn + Thanh hành động gọn trên Mobile
 */
export function CraftsmanProfileView({
  artisan,
  distanceKm,
  userLocation,
  travelMode,
  userKudosKeys,
  approvedThankYouNotes,
  isFavorite = false,
  currentUserDisplayName,
  onBackToMap,
  onOpenOnMap,
  onShare,
  onToggleFavorite,
  onMarkRevived,
  onSubmitThankYou,
  onOpenQr,
  onOpenStatusReport,
  onToggleKudos,
  onAddPraise,
}: CraftsmanProfileViewProps) {
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const statusInfo = getStatusDisplay(artisan.status);
  const gmapsUrl = buildGoogleMapsDirectionsUrl(
    artisan.coordinates,
    userLocation?.coords,
    travelMode
  );

  return (
    <div className="bg-[#F7F2E8] text-[#25292E] pb-28 lg:pb-16">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-6 sm:pt-10 space-y-12">
        {/* Nút quay lại bản đồ */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToMap}
            className="min-h-[40px] inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#615D57] hover:text-[#1B3B82] transition-colors rounded-xl px-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại bản đồ</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenOnMap(artisan)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B3B82] hover:text-[#D46534] transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Xem ghim trên bản đồ</span>
          </button>
        </div>

        {/* ============================================================
            HERO 2 CỘT HỒ SƠ NGƯỜI THỢ
           ============================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Cột trái (7 cột): Thông tin chính & Hành động */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider ${statusInfo.bgClass} ${statusInfo.textClass}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {statusInfo.label}
                </span>

                <span className="text-xs font-semibold text-[#1B3B82]">
                  {artisan.categories.join(' · ')}
                </span>

                {typeof distanceKm === 'number' && (
                  <>
                    <span className="text-[#D9CBB8]" aria-hidden="true">
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#D46534] tabular-nums">
                      <Navigation className="w-3.5 h-3.5" />
                      {formatDistanceWithPrefix(distanceKm)}
                    </span>
                  </>
                )}
              </div>

              <h1
                className="font-display text-2xl sm:text-4xl font-extrabold text-[#25292E] tracking-tight leading-[1.16]"
                style={{ textWrap: 'balance' }}
              >
                {artisan.name}
              </h1>

              {artisan.shortTitle && (
                <p className="font-serif-editorial italic text-sm sm:text-base text-[#615D57]">
                  {artisan.shortTitle}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs pt-0.5">
                {artisan.isCommunitySuggested ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-[#D46534]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Mới đề xuất bởi cộng đồng
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-[#1B3B82]">
                    <BadgeCheck className="w-4 h-4" />
                    Đã xác minh thực địa:{' '}
                    <span className="font-mono">{artisan.verifiedDate}</span>
                  </span>
                )}
                <span className="text-[#D9CBB8]" aria-hidden="true">
                  ·
                </span>
                <span className="text-[#615D57] font-medium">
                  {artisan.district}, TP.HCM
                </span>
              </div>
            </div>

            {/* Khối thông tin địa chỉ, giờ làm & thanh toán */}
            <div className="rounded-2xl bg-white border border-[#E8DFD1] p-5 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4.5 h-4.5 text-[#D46534] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#615D57]">
                    Mốc nhận diện góc phố
                  </p>
                  <p className="text-sm sm:text-[15px] font-medium text-[#25292E] leading-relaxed">
                    {artisan.addressLandmark}
                  </p>
                </div>
              </div>

              <div className="border-t border-dashed border-[#E8DFD1] pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#1B3B82] shrink-0" />
                  <span className="font-mono text-sm font-bold text-[#25292E] tabular-nums">
                    {artisan.hours}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      artisan.paymentMethod === 'Có chuyển khoản'
                        ? 'bg-[#EEF2FA] border-[#1B3B82]/20 text-[#1B3B82]'
                        : 'bg-[#F7F2E8] border-[#E8DFD1] text-[#615D57]'
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
                        ? 'bg-[#EDF3EE] border-[#4F6B54]/20 text-[#4F6B54]'
                        : 'bg-[#FDF0E9] border-[#D46534]/25 text-[#B93818]'
                    }`}
                  >
                    <ParkingCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{artisan.parkingInfo}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Cụm nút hành động chính */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[46px] px-6 py-2.5 rounded-full bg-[#D46534] hover:bg-[#BC5326] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-xs whitespace-nowrap"
              >
                <span>Chỉ đường Google Maps</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>

              {artisan.phone ? (
                <a
                  href={`tel:${artisan.phone.replace(/\s+/g, '')}`}
                  className="min-h-[46px] px-5 py-2.5 rounded-full bg-[#1B3B82] hover:bg-[#142D66] text-[#F7F2E8] text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>Gọi điện</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenOnMap(artisan)}
                  className="min-h-[46px] px-5 py-2.5 rounded-full bg-[#1B3B82] hover:bg-[#142D66] text-[#F7F2E8] text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>Xem trên bản đồ lớn</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenQr(artisan)}
                className="hidden sm:inline-flex min-h-[46px] px-4 py-2.5 rounded-full bg-white hover:bg-[#EEF2FA] border border-[#E8DFD1] text-[#25292E] hover:text-[#1B3B82] text-xs font-semibold items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <QrCode className="w-4 h-4" />
                <span>Mã QR</span>
              </button>
            </div>

            {/* Dải tương tác cộng đồng (Soft Auth Wall) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onToggleFavorite(artisan.id)}
                aria-pressed={isFavorite}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  isFavorite
                    ? 'bg-[#FDF0E9] border-[#D46534]/35 text-[#D46534]'
                    : 'bg-white border-[#E8DFD1] text-[#25292E] hover:border-[#D46534] hover:text-[#D46534]'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`}
                />
                <span>{isFavorite ? 'Đã lưu góc thợ' : 'Lưu thợ'}</span>
              </button>

              <button
                type="button"
                onClick={() => onMarkRevived(artisan)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#EDF3EE] hover:bg-[#4F6B54] text-[#4F6B54] hover:text-white border border-[#4F6B54]/25 text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Recycle className="w-3.5 h-3.5" />
                <span>Tôi đã sửa xong</span>
                {typeof artisan.revivedCount === 'number' &&
                  artisan.revivedCount > 0 && (
                    <span className="font-mono text-[11px] tabular-nums opacity-85">
                      ({artisan.revivedCount})
                    </span>
                  )}
              </button>

              <button
                type="button"
                onClick={() => onOpenStatusReport(artisan)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white hover:bg-[#B93818]/8 border border-[#E8DFD1] hover:border-[#B93818]/35 text-[#615D57] hover:text-[#B93818] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Báo cáo tình trạng</span>
              </button>

              <button
                type="button"
                onClick={() => onShare(artisan)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white hover:bg-[#EEF2FA] border border-[#E8DFD1] hover:border-[#1B3B82]/35 text-[#615D57] hover:text-[#1B3B82] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Chia sẻ link</span>
              </button>
            </div>
          </div>

          {/* Cột phải (5 cột): Ảnh góc nghề tôn trọng quyền riêng tư */}
          <div className="lg:col-span-5">
            <figure className="space-y-2.5">
              <div className="rounded-3xl bg-white border border-[#E8DFD1] p-2.5 shadow-[0_12px_32px_rgba(37,41,46,0.06)]">
                <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#EFE8DC]">
                  <ArtisanIllustration
                    variant={artisan.illustrationVariant}
                    customImageUrl={
                      artisan.hidePortrait ? undefined : artisan.customImageUrl
                    }
                    alt={`Góc làm việc của ${artisan.name}`}
                  />
                </div>
              </div>

              {artisan.hidePortrait && (
                <figcaption className="flex items-center justify-center gap-1.5 font-serif-editorial italic text-xs text-[#615D57] px-2">
                  <EyeOff className="w-3.5 h-3.5 text-[#4F6B54] shrink-0" />
                  <span>Ẩn chân dung theo nguyện vọng của cô/chú</span>
                </figcaption>
              )}
            </figure>
          </div>
        </section>

        {/* Đường chỉ đỏ phân tách nhẹ */}
        <div className="border-t border-dashed border-[#B93818]/28" />

        {/* ============================================================
            PHẦN SÂU 2 CỘT: CÂU CHUYỆN NGHỀ (LORA) + BẢNG GIÁ THỦ CÔNG
           ============================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột trái (7 cột): Câu chuyện góc nghề */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl bg-white border border-[#E8DFD1] p-6 sm:p-8 space-y-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#B93818]">
                Góc nghề &amp; Câu chuyện
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#25292E]">
                Chuyện người giữ nghề bên góc phố
              </h2>
              <div className="w-12 border-t border-dashed border-[#B93818]/45" />
              <p className="font-serif-editorial text-base sm:text-[17px] leading-[1.85] text-[#25292E]/90">
                {artisan.story ||
                  'Cô chú làm nghề tỉ mỉ ngay bên góc đường quen, luôn báo giá trước và giữ uy tín với bà con, sinh viên quanh khu vực.'}
              </p>

              <div className="pt-3 border-t border-dashed border-[#E8DFD1] space-y-2">
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#615D57]">
                  Các lỗi thường nhận sửa
                </p>
                <div className="flex flex-wrap gap-2">
                  {artisan.problems.map((prob) => (
                    <span
                      key={prob}
                      className="px-3 py-1 rounded-full bg-[#F7F2E8] border border-[#E8DFD1] text-xs font-medium text-[#25292E]"
                    >
                      {prob}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải (5 cột): Bảng giá thủ công viền đứt nét */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-3xl bg-white border border-[#E8DFD1] p-6 space-y-4 shadow-[0_8px_24px_rgba(37,41,46,0.04)]">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#25292E] flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#D46534]" />
                  <span>Bảng giá tham khảo</span>
                </h2>
                <span className="font-mono text-xs font-bold text-[#D46534]">
                  {artisan.minPriceLabel}
                </span>
              </div>

              <div className="rounded-2xl border border-dashed border-[#DFD3C2] overflow-hidden bg-[#F7F2E8]/40">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-dashed border-[#DFD3C2] divide-[#DFD3C2]">
                    {artisan.prices.map((row, idx) => (
                      <tr
                        key={`${row.service}-${idx}`}
                        className={
                          idx % 2 === 0 ? 'bg-white' : 'bg-[#F7F2E8]/70'
                        }
                      >
                        <td className="py-3 px-3.5 text-xs sm:text-[13px] font-medium text-[#25292E]">
                          {row.service}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-xs sm:text-[13px] font-bold text-[#D46534] text-right whitespace-nowrap tabular-nums">
                          {row.priceRange}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => setPriceModalOpen(true)}
                className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#FDF0E9] hover:bg-[#D46534] text-[#D46534] hover:text-white border border-[#D46534]/25 text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>So sánh với mua mới</span>
              </button>

              <p className="text-xs text-[#615D57] flex items-start gap-1.5 leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 text-[#D46534] shrink-0 mt-0.5" />
                <span>
                  Giá thực tế có thể thay đổi tùy tình trạng món đồ. Nhớ hỏi xác
                  nhận giá với cô chú trước khi sửa nhé!
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            CỘNG ĐỒNG KHEN NGỢI & SỔ LƯU BÚT CẢM ƠN
           ============================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-start">
          <div className="rounded-3xl bg-white border border-[#E8DFD1] p-5 sm:p-6">
            <PraiseCorner
              artisan={artisan}
              userKudosKeys={userKudosKeys}
              currentUserDisplayName={currentUserDisplayName}
              onToggleKudos={onToggleKudos}
              onAddPraise={onAddPraise}
            />
          </div>

          <div className="rounded-3xl bg-white border border-[#E8DFD1] p-5 sm:p-6">
            <WallOfThanksSection
              artisan={artisan}
              approvedNotes={approvedThankYouNotes}
              currentUserDisplayName={currentUserDisplayName}
              onSubmitThankYou={onSubmitThankYou}
            />
          </div>
        </section>
      </div>

      {/* Thanh hành động cố định siêu gọn trên Mobile (nằm trên MobileBottomNav) */}
      <div className="lg:hidden fixed left-3 right-3 bottom-[72px] z-30">
        <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-[#E8DFD1] shadow-[0_8px_24px_rgba(37,41,46,0.14)] p-2 flex items-center gap-2">
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-[#D46534] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>Chỉ đường</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {artisan.phone ? (
            <a
              href={`tel:${artisan.phone.replace(/\s+/g, '')}`}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#1B3B82] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Gọi điện</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onOpenOnMap(artisan)}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#1B3B82] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Bản đồ</span>
            </button>
          )}
        </div>
      </div>

      <PriceComparisonModal
        isOpen={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
      />
    </div>
  );
}
