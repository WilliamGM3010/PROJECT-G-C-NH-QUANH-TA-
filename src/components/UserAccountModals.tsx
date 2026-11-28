import {
  Bookmark,
  CheckCircle2,
  Clock,
  Compass,
  Heart,
  History,
  Loader2,
  MapPin,
  PlusCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import type { UserContributionItem } from '../services/supabaseService';
import type { Artisan } from '../types/artisan';
import { getStatusDisplay } from './ArtisanCard';
import { ArtisanIllustration } from './ArtisanIllustration';

interface SavedArtisansModalProps {
  savedArtisans: Artisan[];
  onSelectArtisan: (artisan: Artisan) => void;
  onRemoveFavorite: (artisanId: string) => void;
  onClose: () => void;
}

export function SavedArtisansModal({
  savedArtisans,
  onSelectArtisan,
  onRemoveFavorite,
  onClose,
}: SavedArtisansModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-artisans-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#25292E]/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88dvh] flex flex-col rounded-3xl bg-[#F7F2E8] border border-[#E8DFD1] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E8DFD1] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#FDF0E9] border border-[#D46534]/25 text-[#D46534] flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </span>
            <div>
              <h2
                id="saved-artisans-title"
                className="font-display text-base font-bold text-[#25292E]"
              >
                Góc thợ đã lưu{' '}
                <span className="font-mono text-[#1B3B82]">({savedArtisans.length})</span>
              </h2>
              <p className="text-xs text-[#615D57]">
                Danh sách cô chú thợ yêu thích được đồng bộ theo tài khoản của bạn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-[#615D57] hover:bg-[#F7F2E8] hover:text-[#25292E] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 sm:p-5 space-y-3">
          {savedArtisans.length === 0 ? (
            <div className="rounded-2xl bg-white border border-dashed border-[#DDD2C2] p-8 text-center space-y-3">
              <Heart className="w-10 h-10 text-[#D46534]/45 mx-auto" />
              <div className="space-y-1">
                <p className="font-display text-sm font-bold text-[#25292E]">
                  Bạn chưa lưu góc thợ nào
                </p>
                <p className="text-xs text-[#615D57] max-w-sm mx-auto leading-relaxed">
                  Bấm biểu tượng trái tim trên thẻ hoặc trang chi tiết của cô chú thợ để lưu lại cho những lần sửa đồ sau nhé.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#D46534] hover:bg-[#BC5326] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>Khám phá bản đồ ngay</span>
              </button>
            </div>
          ) : (
            savedArtisans.map((artisan) => {
              const st = getStatusDisplay(artisan.status);
              return (
                <div
                  key={artisan.id}
                  className="rounded-2xl bg-white border border-[#E8DFD1] hover:border-[#D46534]/50 p-3.5 flex items-start gap-3.5 transition-all"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#F7F2E8] border border-[#E8DFD1]">
                    <ArtisanIllustration
                      variant={artisan.illustrationVariant}
                      customImageUrl={
                        artisan.hidePortrait ? undefined : artisan.customImageUrl
                      }
                      alt={artisan.name}
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-sm font-bold text-[#25292E] leading-snug">
                        {artisan.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onRemoveFavorite(artisan.id)}
                        title="Bỏ lưu góc thợ này"
                        aria-label={`Bỏ lưu ${artisan.name}`}
                        className="w-8 h-8 rounded-lg bg-[#FDF0E9] text-[#B93818] hover:bg-[#FAE2D6] flex items-center justify-center shrink-0 transition-colors"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
                      <span className={`font-semibold ${st.textClass}`}>
                        {st.label}
                      </span>
                      <span className="text-[#DDD2C2]">·</span>
                      <span className="text-[#615D57]">{artisan.district}</span>
                      <span className="text-[#DDD2C2]">·</span>
                      <span className="font-mono font-bold text-[#D46534]">
                        {artisan.minPriceLabel}
                      </span>
                    </div>

                    <p className="text-xs text-[#615D57] flex items-start gap-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D46534] shrink-0 mt-0.5" />
                      <span>{artisan.addressLandmark}</span>
                    </p>

                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectArtisan(artisan);
                          onClose();
                        }}
                        className="min-h-[34px] px-3 py-1.5 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Xem hồ sơ cô chú</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

interface ContributionHistoryModalProps {
  items: UserContributionItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenApprovedArtisan: (artisanId: string) => void;
  onSuggestNew: () => void;
  onClose: () => void;
}

export function ContributionHistoryModal({
  items,
  isLoading,
  onRefresh,
  onOpenApprovedArtisan,
  onSuggestNew,
  onClose,
}: ContributionHistoryModalProps) {
  const approvedCount = items.filter((i) => i.approvalStatus === 'approved').length;
  const pendingCount = items.filter((i) => i.approvalStatus === 'pending').length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contribution-history-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#25292E]/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88dvh] flex flex-col rounded-3xl bg-[#F7F2E8] border border-[#E8DFD1] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 bg-white border-b border-[#E8DFD1] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-[#EEF2FA] border border-[#1B3B82]/20 text-[#1B3B82] flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2
                id="contribution-history-title"
                className="font-display text-base font-bold text-[#25292E]"
              >
                Lịch sử đóng góp{' '}
                <span className="font-mono text-[#1B3B82]">({items.length})</span>
              </h2>
              <p className="font-mono text-[11px] text-[#615D57] truncate">
                {approvedCount} đã lên bản đồ · {pendingCount} đang chờ duyệt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Làm mới trạng thái duyệt"
              className="w-9 h-9 rounded-xl text-[#1B3B82] hover:bg-[#F7F2E8] flex items-center justify-center"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="w-9 h-9 rounded-xl text-[#615D57] hover:bg-[#F7F2E8] hover:text-[#25292E] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 sm:p-5 space-y-3">
          {isLoading ? (
            <div className="rounded-2xl bg-white border border-[#E8DFD1] p-8 text-center space-y-2.5">
              <Loader2 className="w-6 h-6 text-[#D46534] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#615D57]">
                Đang tải lịch sử các góc thợ bạn đã gợi ý...
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-white border border-dashed border-[#DDD2C2] p-8 text-center space-y-3">
              <PlusCircle className="w-10 h-10 text-[#1B3B82]/45 mx-auto" />
              <div className="space-y-1">
                <p className="font-display text-sm font-bold text-[#25292E]">
                  Bạn chưa gợi ý cô chú thợ nào
                </p>
                <p className="text-xs text-[#615D57] max-w-sm mx-auto leading-relaxed">
                  Biết một góc sửa giày, may vá hay đánh khóa khéo tay gần nhà? Hãy giới thiệu để mọi người cùng biết đến cô chú nhé!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSuggestNew();
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#D46534] hover:bg-[#BC5326] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Gợi ý góc thợ đầu tiên</span>
              </button>
            </div>
          ) : (
            items.map((item) => {
              const isApproved = item.approvalStatus === 'approved';
              return (
                <article
                  key={item.id}
                  className="rounded-2xl bg-white border border-[#E8DFD1] p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-bold text-[#25292E]">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#615D57] mt-0.5">
                        {item.categories.join(' · ')} · {item.district}
                      </p>
                    </div>

                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EDF3EE] text-[#4F6B54] text-[11px] font-bold whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã lên bản đồ</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-[11px] font-bold whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Chờ duyệt</span>
                      </span>
                    )}
                  </div>

                  {item.addressLandmark && (
                    <p className="text-xs text-[#615D57] flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-[#D46534] shrink-0 mt-0.5" />
                      <span>{item.addressLandmark}</span>
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-dashed border-[#E8DFD1]">
                    <span className="font-mono text-[11px] text-[#8E8880] tabular-nums">
                      Gửi lúc: {item.submittedAt}
                    </span>

                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenApprovedArtisan(item.id);
                          onClose();
                        }}
                        className="text-xs font-bold text-[#1B3B82] hover:text-[#D46534] hover:underline inline-flex items-center gap-1"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Xem hồ sơ cô chú</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
