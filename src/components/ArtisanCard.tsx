import { BadgeCheck, Clock, MapPin, Navigation, Sparkles } from 'lucide-react';
import type { Artisan } from '../types/artisan';
import { formatDistanceWithPrefix } from '../utils/geo';
import { ArtisanIllustration } from './ArtisanIllustration';

interface ArtisanCardProps {
  artisan: Artisan;
  isSelected: boolean;
  isHovered: boolean;
  distanceKm?: number | null;
  onSelect: (artisan: Artisan) => void;
  onHoverChange: (artisanId: string | null) => void;
}

export function getStatusDisplay(status: Artisan['status']) {
  switch (status) {
    case 'working':
      return {
        label: 'Đang làm việc',
        textClass: 'text-[#3A6B5C]',
        bgClass: 'bg-[#3A6B5C]/10',
      };
    case 'off_today':
      return {
        label: 'Hôm nay nghỉ',
        textClass: 'text-[#B47A0E]',
        bgClass: 'bg-[#E9A825]/15',
      };
    case 'relocated':
      return {
        label: 'Cần kiểm tra lại',
        textClass: 'text-[#C84B31]',
        bgClass: 'bg-[#C84B31]/12',
      };
  }
}

export function ArtisanCard({
  artisan,
  isSelected,
  isHovered,
  distanceKm,
  onSelect,
  onHoverChange,
}: ArtisanCardProps) {
  const statusInfo = getStatusDisplay(artisan.status);
  const totalKudos = Object.values(artisan.kudos).reduce(
    (sum, n) => sum + n,
    0
  );

  return (
    <article
      onMouseEnter={() => onHoverChange(artisan.id)}
      onMouseLeave={() => onHoverChange(null)}
      className={`group rounded-2xl bg-white transition-all duration-150 overflow-hidden ${
        isSelected
          ? 'ring-2 ring-[#D96B38] shadow-md'
          : isHovered
            ? 'ring-1 ring-[#D96B38]/60 shadow-md -translate-y-0.5'
            : 'border border-[#EBE5DC] shadow-sm hover:shadow-md'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(artisan)}
        className="w-full text-left p-3.5 flex gap-3.5 items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D96B38]"
      >
        {/* Thumbnail ảnh góc nghề */}
        <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-[#F4EFE6]">
          <ArtisanIllustration
            variant={artisan.illustrationVariant}
            customImageUrl={artisan.customImageUrl}
            alt={`Góc nghề của ${artisan.name}`}
          />
          <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-[#1F2933]/80 backdrop-blur-[2px] text-white text-[11px] font-semibold px-2 py-0.5 rounded-md text-center tabular-nums truncate">
            {artisan.minPriceLabel}
          </div>
        </div>

        {/* Nội dung chính */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-[#1F2933] leading-snug group-hover:text-[#D96B38] transition-colors line-clamp-2">
              {artisan.name}
            </h3>
          </div>

          {/* Metadata gọn gàng: Trạng thái · Khu vực · Khoảng cách thực tế */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
            <span className={`font-semibold ${statusInfo.textClass}`}>
              {statusInfo.label}
            </span>
            <span className="text-[#CBD2D9]" aria-hidden="true">
              ·
            </span>
            <span className="text-[#52606D] font-medium">{artisan.district}</span>
            {typeof distanceKm === 'number' && (
              <>
                <span className="text-[#CBD2D9]" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-0.5 text-[#D96B38] font-semibold tabular-nums">
                  <Navigation className="w-3 h-3" />
                  {formatDistanceWithPrefix(distanceKm)}
                </span>
              </>
            )}
          </div>

          {/* Mốc nhận diện góc phố */}
          <p className="text-xs text-[#52606D] flex items-start gap-1.5 leading-relaxed line-clamp-2">
            <MapPin className="w-3.5 h-3.5 text-[#D96B38] shrink-0 mt-0.5" />
            <span>{artisan.addressLandmark}</span>
          </p>

          {/* Chân thẻ: Giờ làm & Xác minh / Khen ngợi */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-[#52606D]">
            <span className="inline-flex items-center gap-1 truncate">
              <Clock className="w-3 h-3 shrink-0 text-[#7B8794]" />
              <span className="truncate">{artisan.hours}</span>
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {artisan.isCommunitySuggested ? (
                <span className="inline-flex items-center gap-1 font-semibold text-[#D96B38]">
                  <Sparkles className="w-3 h-3" />
                  Mới đề xuất
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-[#3A6B5C]">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Đã xác minh
                </span>
              )}
              {totalKudos > 0 && (
                <span className="text-[#52606D] tabular-nums font-medium">
                  · {totalKudos} khen
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </article>
  );
}
