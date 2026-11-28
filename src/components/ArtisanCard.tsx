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
        textClass: 'text-[#4F6B54]',
        bgClass: 'bg-[#EDF3EE]',
      };
    case 'off_today':
      return {
        label: 'Hôm nay nghỉ',
        textClass: 'text-[#A86214]',
        bgClass: 'bg-[#C47A24]/12',
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
          ? 'border-[1.5px] border-[#D46534] shadow-[0_8px_24px_rgba(212,101,52,0.14)] ring-1 ring-[#D46534]/20'
          : isHovered
            ? 'border border-[#1B3B82]/60 shadow-[0_6px_18px_rgba(27,59,130,0.1)] -translate-y-0.5'
            : 'border border-[#E8DFD1] hover:border-[#1B3B82]/50 hover:shadow-sm'
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
              ? 'bg-[#FDF0E9] text-[#D46534] border border-[#D46534]/25'
              : 'bg-[#F7F2E8] text-[#8A847C] hover:text-[#D46534] hover:bg-[#FDF0E9]'
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
        <div className="relative w-22 h-22 rounded-xl overflow-hidden shrink-0 bg-[#EFE8DC] border border-[#E8DFD1]">
          <ArtisanIllustration
            variant={artisan.illustrationVariant}
            customImageUrl={artisan.hidePortrait ? undefined : artisan.customImageUrl}
            alt={`Góc nghề của ${artisan.name}`}
          />
          <div className="absolute bottom-1 left-1 right-1 bg-[#25292E]/88 backdrop-blur-[2px] text-[#F7F2E8] font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md text-center tabular-nums truncate">
            {artisan.minPriceLabel}
          </div>
        </div>

        {/* Nội dung chính */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2 pr-8">
            <h3 className="font-display text-[14.5px] font-bold text-[#25292E] leading-snug group-hover:text-[#1B3B82] transition-colors line-clamp-2">
              {artisan.name}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
            <span className={`font-semibold ${statusInfo.textClass}`}>
              {statusInfo.label}
            </span>
            <span className="text-[#D9CBB8]" aria-hidden="true">
              ·
            </span>
            <span className="text-[#615D57] font-medium">{artisan.district}</span>
            {typeof distanceKm === 'number' && (
              <>
                <span className="text-[#D9CBB8]" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-0.5 font-mono text-[#D46534] font-bold tabular-nums">
                  <Navigation className="w-3 h-3" />
                  {formatDistanceWithPrefix(distanceKm)}
                </span>
              </>
            )}
          </div>

          <p className="text-xs text-[#615D57] flex items-start gap-1.5 leading-relaxed line-clamp-2">
            <MapPin className="w-3.5 h-3.5 text-[#D46534] shrink-0 mt-0.5" />
            <span>{artisan.addressLandmark}</span>
          </p>

          <div className="pt-1.5 border-t border-dashed border-[#E8DFD1] flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-[#615D57]">
            <span className="inline-flex items-center gap-1 truncate font-mono">
              <Clock className="w-3 h-3 shrink-0 text-[#8A847C]" />
              <span className="truncate">{artisan.hours}</span>
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {artisan.isCommunitySuggested ? (
                <span className="inline-flex items-center gap-1 font-semibold text-[#D46534]">
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
                <span className="font-mono text-[#615D57] tabular-nums font-medium">
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
