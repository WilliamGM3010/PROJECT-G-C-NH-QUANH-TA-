import {
  BadgeCheck,
  Clock,
  Heart,
  MapPin,
  Navigation,
  Sparkles,
} from 'lucide-react';
import type { Artisan } from '../types/artisan';
import { formatDistanceWithPrefix } from '../utils/geo';
import { ArtisanIllustration } from './ArtisanIllustration';

interface ArtisanCardProps {
  artisan: Artisan;
  isSelected: boolean;
  isHovered: boolean;
  isFavorite?: boolean;
  distanceKm?: number | null;
  onSelect: (artisan: Artisan) => void;
  onHoverChange: (artisanId: string | null) => void;
  onToggleFavorite?: (artisanId: string) => void;
}

export function getStatusDisplay(status: Artisan['status']) {
  switch (status) {
    case 'working':
      return {
        label: 'Đang làm việc',
        textClass: 'text-[#15803D]',
        bgClass: 'bg-[#15803D]/10',
      };
    case 'off_today':
      return {
        label: 'Hôm nay nghỉ',
        textClass: 'text-[#B45309]',
        bgClass: 'bg-[#D97706]/14',
      };
    case 'relocated':
      return {
        label: 'Cần kiểm tra lại',
        textClass: 'text-[#B93818]',
        bgClass: 'bg-[#B93818]/12',
      };
  }
}

export function ArtisanCard({
  artisan,
  isSelected,
  isHovered,
  isFavorite = false,
  distanceKm,
  onSelect,
  onHoverChange,
  onToggleFavorite,
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
      className={`group relative rounded-2xl bg-white transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-[1.5px] border-[#1B3B82] shadow-[4px_4px_0px_#E86F2C]'
          : isHovered
            ? 'border-[1.5px] border-[#1B3B82] shadow-[4px_4px_0px_#1B3B82] -translate-y-0.5'
            : 'border border-[#E6D5C3] hover:border-[#1B3B82] hover:shadow-[3px_3px_0px_#1B3B82]'
      }`}
    >
      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(artisan.id);
          }}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Bỏ lưu ${artisan.name}`
              : `Lưu góc thợ ${artisan.name}`
          }
          title={isFavorite ? 'Đã lưu góc thợ' : 'Lưu góc thợ yêu thích'}
          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
            isFavorite
              ? 'bg-[#FFF3EB] text-[#E86F2C] border border-[#E86F2C]/25'
              : 'bg-[#FDF8F2] text-[#8C8378] hover:text-[#E86F2C] hover:bg-[#FFF3EB]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      )}

      <button
        type="button"
        onClick={() => onSelect(artisan)}
        className="w-full text-left p-3.5 flex gap-3.5 items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B3B82]"
      >
        {/* Thumbnail ảnh góc nghề */}
        <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-[#F3ECE2] border border-[#E6D5C3]/70">
          <ArtisanIllustration
            variant={artisan.illustrationVariant}
            customImageUrl={artisan.customImageUrl}
            alt={`Góc nghề của ${artisan.name}`}
          />
          <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-[#162442]/88 backdrop-blur-[2px] text-[#FDF8F2] font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-md text-center tabular-nums truncate">
            {artisan.minPriceLabel}
          </div>
        </div>

        {/* Nội dung chính */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2 pr-8">
            <h3 className="font-display text-[15px] font-bold text-[#162442] leading-snug group-hover:text-[#1B3B82] transition-colors line-clamp-2">
              {artisan.name}
            </h3>
          </div>

          {/* Metadata gọn gàng: Trạng thái · Khu vực · Khoảng cách thực tế */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
            <span className={`font-semibold ${statusInfo.textClass}`}>
              {statusInfo.label}
            </span>
            <span className="text-[#D8C3AE]" aria-hidden="true">
              ·
            </span>
            <span className="text-[#5C564E] font-medium">{artisan.district}</span>
            {typeof distanceKm === 'number' && (
              <>
                <span className="text-[#D8C3AE]" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-0.5 font-mono text-[#E86F2C] font-bold tabular-nums">
                  <Navigation className="w-3 h-3" />
                  {formatDistanceWithPrefix(distanceKm)}
                </span>
              </>
            )}
          </div>

          {/* Mốc nhận diện góc phố */}
          <p className="text-xs text-[#5C564E] flex items-start gap-1.5 leading-relaxed line-clamp-2">
            <MapPin className="w-3.5 h-3.5 text-[#E86F2C] shrink-0 mt-0.5" />
            <span>{artisan.addressLandmark}</span>
          </p>

          {/* Chân thẻ: Giờ làm & Xác minh / Khen ngợi */}
          <div className="pt-1.5 border-t border-dashed border-[#E6D5C3] flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-[#5C564E]">
            <span className="inline-flex items-center gap-1 truncate font-mono">
              <Clock className="w-3 h-3 shrink-0 text-[#8C8378]" />
              <span className="truncate">{artisan.hours}</span>
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {artisan.isCommunitySuggested ? (
                <span className="inline-flex items-center gap-1 font-semibold text-[#E86F2C]">
                  <Sparkles className="w-3 h-3" />
                  Mới đề xuất
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-[#1B3B82]">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Đã xác minh
                </span>
              )}
              {totalKudos > 0 && (
                <span className="font-mono text-[#5C564E] tabular-nums font-medium">
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
