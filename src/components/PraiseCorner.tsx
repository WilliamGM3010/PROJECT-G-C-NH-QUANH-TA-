import { useState, type FormEvent } from 'react';
import { HeartHandshake, MessageSquarePlus, Send } from 'lucide-react';
import { KUDOS_ITEMS } from '../data/artisans';
import type { Artisan, KudosKey } from '../types/artisan';

interface PraiseCornerProps {
  artisan: Artisan;
  userKudosKeys: KudosKey[];
  currentUserDisplayName: string;
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

const KUDOS_MAP: Record<KudosKey, { emoji: string; label: string }> = {
  sturdy: { emoji: '✨', label: 'Sửa kỹ & chắc' },
  studentPrice: { emoji: '💸', label: 'Giá sinh viên' },
  fast: { emoji: '⚡', label: 'Lấy liền nhanh' },
  friendly: { emoji: '💛', label: 'Cô chú thân thiện' },
};

/**
 * Cộng đồng khen ngợi (Quick Kudos + Góc khen ngợi):
 * - 4 nút khen nhanh 1 chạm (pill buttons) tăng/giảm +1/-1, lưu vào localStorage
 * - Khung bình luận trải nghiệm ngắn kèm danh sách lời khen thực tế
 */
export function PraiseCorner({
  artisan,
  userKudosKeys,
  currentUserDisplayName,
  onToggleKudos,
  onAddPraise,
}: PraiseCornerProps) {
  const [selectedTag, setSelectedTag] = useState<KudosKey>('sturdy');
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = comment.trim();
    if (cleaned.length < 6) {
      setErrorMsg('Hãy chia sẻ ít nhất vài chữ về trải nghiệm sửa đồ của bạn nhé!');
      return;
    }

    onAddPraise(artisan.id, {
      author: currentUserDisplayName.trim() || 'Thành viên Góc Thợ',
      kudosKey: selectedTag,
      comment: cleaned,
    });

    setComment('');
    setErrorMsg('');
  };

  const totalKudos = Object.values(artisan.kudos).reduce(
    (sum, n) => sum + n,
    0
  );

  return (
    <section
      aria-labelledby="praise-corner-heading"
      className="pt-5 border-t border-[#EBE5DC] space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-[#D96B38]" />
          <h3
            id="praise-corner-heading"
            className="text-sm font-bold text-[#1F2933]"
          >
            Cộng đồng khen ngợi
          </h3>
        </div>
        <span className="text-xs text-[#52606D] tabular-nums">
          {totalKudos} lượt khen · {artisan.praises.length} chia sẻ
        </span>
      </div>

      {/* 4 nút khen nhanh 1 chạm (Quick Kudos pill buttons) */}
      <div>
        <p className="text-xs text-[#52606D] mb-2.5">
          Chạm để tặng lời khen nhanh cho cô chú (bấm lại để bỏ chọn):
        </p>
        <div className="flex flex-wrap gap-2">
          {KUDOS_ITEMS.map((item) => {
            const count = artisan.kudos[item.key] ?? 0;
            const isReacted = userKudosKeys.includes(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onToggleKudos(artisan.id, item.key)}
                aria-pressed={isReacted}
                className={`min-h-[40px] px-3.5 py-2 rounded-full border text-xs font-semibold inline-flex items-center gap-2 transition-all duration-150 active:scale-[0.97] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96B38] ${
                  isReacted
                    ? 'bg-[#D96B38] border-[#D96B38] text-white shadow-sm'
                    : 'bg-white border-[#E5DFD5] text-[#1F2933] hover:border-[#D96B38]/60 hover:bg-[#FAF8F5]'
                }`}
              >
                <span aria-hidden="true">{item.emoji}</span>
                <span>{item.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                    isReacted
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F3EEE6] text-[#52606D]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form gửi bình luận ngắn */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-[#FAF8F5] border border-[#EBE5DC] p-3.5 space-y-3"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F2933]">
          <MessageSquarePlus className="w-3.5 h-3.5 text-[#3A6B5C]" />
          <span>Góc khen ngợi — Chia sẻ trải nghiệm sửa đồ</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {KUDOS_ITEMS.map((item) => {
            const active = selectedTag === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedTag(item.key)}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#3A6B5C] text-white'
                    : 'bg-white border border-[#E5DFD5] text-[#52606D] hover:text-[#1F2933]'
                }`}
              >
                {item.emoji} {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] text-[#52606D] bg-white border border-[#EBE5DC] rounded-xl px-3 py-2">
          <span>Đang gửi lời khen với tên:</span>
          <strong className="text-[#3A6B5C] truncate">
            {currentUserDisplayName}
          </strong>
        </div>

        <div>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            maxLength={240}
            placeholder="VD: Chú sửa nhanh, đường may chắc chắn, giá rất sinh viên..."
            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5DFD5] text-xs text-[#1F2933] placeholder:text-[#7B8794] resize-none focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            {errorMsg ? (
              <p className="text-[11px] text-[#C84B31] font-medium">{errorMsg}</p>
            ) : (
              <span className="text-[11px] text-[#7B8794] tabular-nums">
                {comment.length}/240 ký tự
              </span>
            )}

            <button
              type="submit"
              className="min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi lời khen</span>
            </button>
          </div>
        </div>
      </form>

      {/* Danh sách lời khen từ cộng đồng */}
      <div className="space-y-2.5">
        {artisan.praises.length === 0 ? (
          <p className="text-xs text-[#52606D] italic py-2">
            Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ trải nghiệm nhé!
          </p>
        ) : (
          artisan.praises.map((entry) => {
            const tag = KUDOS_MAP[entry.kudosKey] ?? KUDOS_MAP.sturdy;
            return (
              <div
                key={entry.id}
                className="rounded-xl bg-white border border-[#EBE5DC] p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#1F2933] truncate">
                    {entry.author}
                  </span>
                  <span className="text-[11px] text-[#7B8794] whitespace-nowrap shrink-0">
                    {tag.emoji} {tag.label} · {entry.createdAt}
                  </span>
                </div>
                <p className="text-xs text-[#52606D] leading-relaxed">
                  {entry.comment}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
