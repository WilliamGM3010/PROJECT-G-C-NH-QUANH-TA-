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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F2933]/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88dvh] flex flex-col rounded-3xl bg-[#FAF8F5] border border-[#EBE5DC] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#EBE5DC] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#D96B38]/12 text-[#D96B38] flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </span>
            <div>
              <h2
                id="saved-artisans-title"
                className="text-base font-bold text-[#1F2933]"
              >
                Góc thợ đã lưu ({savedArtisans.length})
              </h2>
              <p className="text-xs text-[#52606D]">
                Danh sách cô chú thợ yêu thích được đồng bộ theo tài khoản của bạn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-[#52606D] hover:bg-[#FAF8F5] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 sm:p-5 space-y-3">
          {savedArtisans.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#EBE5DC] p-8 text-center space-y-3">
              <Heart className="w-10 h-10 text-[#D96B38]/40 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1F2933]">
                  Bạn chưa lưu góc thợ nào
                </p>
                <p className="text-xs text-[#52606D] max-w-sm mx-auto leading-relaxed">
                  Bấm biểu tượng trái tim trên thẻ hoặc trang chi tiết của cô chú thợ để lưu lại cho những lần sửa đồ sau nhé.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
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
                  className="rounded-2xl bg-white border border-[#EBE5DC] shadow-xs p-3.5 flex items-start gap-3.5"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#F4EFE6]">
                    <ArtisanIllustration
                      variant={artisan.illustrationVariant}
                      customImageUrl={artisan.customImageUrl}
                      alt={artisan.name}
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#1F2933] leading-snug">
                        {artisan.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onRemoveFavorite(artisan.id)}
                        title="Bỏ lưu góc thợ này"
                        aria-label={`Bỏ lưu ${artisan.name}`}
                        className="w-8 h-8 rounded-lg bg-[#D96B38]/10 text-[#D96B38] hover:bg-[#D96B38]/20 flex items-center justify-center shrink-0 transition-colors"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
                      <span className={`font-semibold ${st.textClass}`}>
                        {st.label}
                      </span>
                      <span className="text-[#CBD2D9]">·</span>
                      <span className="text-[#52606D]">{artisan.district}</span>
                      <span className="text-[#CBD2D9]">·</span>
                      <span className="font-semibold text-[#1F2933]">
                        {artisan.minPriceLabel}
                      </span>
                    </div>

                    <p className="text-xs text-[#52606D] flex items-start gap-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D96B38] shrink-0 mt-0.5" />
                      <span>{artisan.addressLandmark}</span>
                    </p>

                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectArtisan(artisan);
                          onClose();
                        }}
                        className="min-h-[34px] px-3 py-1.5 rounded-xl bg-[#3A6B5C] hover:bg-[#2F594C] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Xem trên bản đồ</span>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F2933]/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88dvh] flex flex-col rounded-3xl bg-[#FAF8F5] border border-[#EBE5DC] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 bg-white border-b border-[#EBE5DC] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-[#3A6B5C]/12 text-[#3A6B5C] flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2
                id="contribution-history-title"
                className="text-base font-bold text-[#1F2933]"
              >
                Lịch sử đóng góp ({items.length})
              </h2>
              <p className="text-xs text-[#52606D] truncate">
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
              className="w-9 h-9 rounded-xl text-[#3A6B5C] hover:bg-[#FAF8F5] flex items-center justify-center"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="w-9 h-9 rounded-xl text-[#52606D] hover:bg-[#FAF8F5] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 sm:p-5 space-y-3">
          {isLoading ? (
            <div className="rounded-2xl bg-white border border-[#EBE5DC] p-8 text-center space-y-2.5">
              <Loader2 className="w-6 h-6 text-[#D96B38] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#52606D]">
                Đang tải lịch sử các góc thợ bạn đã gợi ý...
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#EBE5DC] p-8 text-center space-y-3">
              <PlusCircle className="w-10 h-10 text-[#3A6B5C]/45 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1F2933]">
                  Bạn chưa gợi ý cô chú thợ nào
                </p>
                <p className="text-xs text-[#52606D] max-w-sm mx-auto leading-relaxed">
                  Biết một góc sửa giày, may vá hay đánh khóa khéo tay gần nhà? Hãy giới thiệu để mọi người cùng biết đến cô chú nhé!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSuggestNew();
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
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
                  className="rounded-2xl bg-white border border-[#EBE5DC] shadow-xs p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1F2933]">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#52606D] mt-0.5">
                        {item.categories.join(' · ')} · {item.district}
                      </p>
                    </div>

                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#3A6B5C]/12 text-[#3A6B5C] text-[11px] font-bold whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã lên bản đồ</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E9A825]/18 text-[#9A6807] text-[11px] font-bold whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Chờ duyệt</span>
                      </span>
                    )}
                  </div>

                  {item.addressLandmark && (
                    <p className="text-xs text-[#52606D] flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-[#D96B38] shrink-0 mt-0.5" />
                      <span>{item.addressLandmark}</span>
                    </p>
                  )}

                  <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-[#F4EFE8]">
                    <span className="text-[11px] text-[#7B8794] tabular-nums">
                      Gửi lúc: {item.submittedAt}
                    </span>

                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenApprovedArtisan(item.id);
                          onClose();
                        }}
                        className="text-xs font-semibold text-[#3A6B5C] hover:underline inline-flex items-center gap-1"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Xem trên bản đồ</span>
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
