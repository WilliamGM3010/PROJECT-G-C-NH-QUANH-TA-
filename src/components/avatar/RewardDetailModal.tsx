import { useEffect } from 'react';
import { Check, Coins, Compass, Lock, Sparkles, X } from 'lucide-react';
import {
  AVATAR_QUESTS,
  getCollectionMetaById,
  getRarityLabel,
} from '../../data/avatarCatalog';
import type { AvatarItem } from '../../types/avatar';
import { AvatarItemSwatch } from './AvatarItemSwatch';

interface RewardDetailModalProps {
  item: AvatarItem | null;
  owned: boolean;
  equipped: boolean;
  gpBalance: number;
  onClose: () => void;
  onTryOn: (item: AvatarItem) => void;
  onUnlockWithGp: (item: AvatarItem) => void;
  onGoToQuests: () => void;
}

export function RewardDetailModal({
  item,
  owned,
  equipped,
  gpBalance,
  onClose,
  onTryOn,
  onUnlockWithGp,
  onGoToQuests,
}: RewardDetailModalProps) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item) return null;

  const collection = getCollectionMetaById(item.collection);
  const rarity = getRarityLabel(item.rarity);
  const linkedQuest = item.questId
    ? AVATAR_QUESTS.find((q) => q.id === item.questId)
    : null;
  const gpCost = item.priceGp ?? 0;
  const canAfford = gpBalance >= gpCost;

  return (
    <div
      className="fixed inset-0 z-[80] bg-[#25292E]/55 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        className="w-full max-w-md rounded-3xl bg-[#FBF8F2] border border-[#E8DFD1] shadow-2xl overflow-hidden"
      >
        {/* Top editorial bar */}
        <div className="px-5 py-4 border-b border-dashed border-[#DFD3C2] flex items-center justify-between gap-3 bg-[#F7F2E8]">
          <p className="text-xs font-semibold text-[#615D57] truncate">
            {collection.name} ·{' '}
            <span style={{ color: rarity.color }} className="font-bold">
              {rarity.label}
            </span>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết vật phẩm"
            className="w-8 h-8 rounded-full bg-white border border-[#E8DFD1] text-[#615D57] hover:text-[#25292E] flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Visual + Title */}
          <div className="flex items-start gap-4">
            <AvatarItemSwatch item={item} size="lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-[#615D57]">
                {owned ? (
                  <span className="inline-flex items-center gap-1 font-bold text-[#4F6B54]">
                    <Check className="w-3.5 h-3.5" />
                    Đã sở hữu trong tủ đồ
                  </span>
                ) : item.comingSoon ? (
                  <span className="font-bold text-[#B93818]">
                    {item.comingSoonNote || 'Sắp ra mắt'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-[#615D57]">
                    <Lock className="w-3.5 h-3.5" />
                    Chưa mở khóa
                  </span>
                )}
              </div>

              <h3 className="font-display text-lg font-extrabold text-[#25292E] leading-snug">
                {item.name}
              </h3>

              <p className="text-xs font-medium text-[#1B3B82]">
                {collection.englishTag}
              </p>
            </div>
          </div>

          {/* Editorial story in Lora */}
          <div className="p-4 rounded-2xl bg-white border border-[#EAE0D2]">
            <p className="text-[11px] font-semibold text-[#8A8278] mb-1.5">
              Câu chuyện cảm hứng
            </p>
            <p className="font-serif-editorial text-[14.5px] text-[#353940] leading-relaxed">
              “{item.story}”
            </p>
          </div>

          {/* Unlock info */}
          {!owned && !item.comingSoon && item.unlockType === 'gp' && (
            <div className="p-4 rounded-2xl bg-[#FDF5E2] border border-[#E6C77A]/60 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#7A4E0A]">
                  Mở khóa bằng Điểm Góc (GP)
                </p>
                <p className="text-xs text-[#8C6423] mt-0.5">
                  Số dư của bạn:{' '}
                  <strong className="font-mono tabular-nums">
                    {gpBalance} GP
                  </strong>
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-base font-extrabold text-[#9A6310] tabular-nums shrink-0">
                <Coins className="w-4 h-4" />
                {gpCost} GP
              </span>
            </div>
          )}

          {!owned &&
            !item.comingSoon &&
            item.unlockType === 'quest' &&
            linkedQuest && (
              <div className="p-4 rounded-2xl bg-[#EEF2FA] border border-[#1B3B82]/20 space-y-1">
                <p className="text-xs font-bold text-[#1B3B82] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D46534]" />
                  Vật phẩm giới hạn từ nhiệm vụ cộng đồng
                </p>
                <p className="text-xs text-[#3D4B63] leading-relaxed">
                  Hoàn thành nhiệm vụ <strong>“{linkedQuest.title}”</strong> và
                  bấm nhận thưởng để mở khóa vĩnh viễn món đồ này.
                </p>
              </div>
            )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            {!item.comingSoon && (
              <button
                type="button"
                onClick={() => {
                  onTryOn(item);
                  onClose();
                }}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F7F2E8] border border-[#DFD3C2] text-sm font-bold text-[#25292E] transition-colors"
              >
                {owned
                  ? equipped
                    ? 'Đang mặc trên nhân vật'
                    : 'Mặc lên nhân vật'
                  : 'Mặc thử'}
              </button>
            )}

            {!owned &&
              !item.comingSoon &&
              item.unlockType === 'gp' &&
              (canAfford ? (
                <button
                  type="button"
                  onClick={() => {
                    onUnlockWithGp(item);
                    onClose();
                  }}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#D46534] hover:bg-[#BC5326] text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Coins className="w-4 h-4" />
                  <span>Mở khóa bằng {gpCost} GP</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToQuests();
                  }}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#1B3B82] hover:bg-[#142D66] text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Compass className="w-4 h-4" />
                  <span>Thiếu {gpCost - gpBalance} GP · Làm nhiệm vụ</span>
                </button>
              ))}

            {!owned && !item.comingSoon && item.unlockType === 'quest' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToQuests();
                }}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#1B3B82] hover:bg-[#142D66] text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>Xem nhiệm vụ mở khóa</span>
              </button>
            )}

            {item.comingSoon && (
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#25292E] text-white text-sm font-bold"
              >
                Hẹn gặp tại BST Tết Sài Gòn
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
