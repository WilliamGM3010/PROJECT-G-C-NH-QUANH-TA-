import { Heart, MapPin, Printer, Sparkles, X } from 'lucide-react';
import type { Artisan, ThankYouNote } from '../types/artisan';

interface AdminThankYouCardModalProps {
  artisan: Artisan;
  notes: ThankYouNote[];
  onClose: () => void;
}

/**
 * Modal gom toàn bộ lời cảm ơn đã duyệt của một cô chú thợ vào mẫu thiệp trang nhã
 * sẵn sàng In / Lưu PDF để đội ngũ dự án in tặng trực tiếp cho cô chú.
 */
export function AdminThankYouCardModal({
  artisan,
  notes,
  onClose,
}: AdminThankYouCardModalProps) {
  const approvedNotes = notes.filter(
    (n) => n.artisanId === artisan.id && n.approved
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="printable-thanks-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#162442]/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-2xl bg-white border-2 border-[#162442] shadow-[6px_6px_0px_#162442] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dashed border-[#D8C3AE] bg-[#FDF8F2] shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#E86F2C]" />
            <h3
              id="printable-thanks-title"
              className="font-display text-sm font-bold text-[#162442]"
            >
              In thiệp cảm ơn cộng đồng tặng cô chú
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-[#5C564E] hover:bg-white hover:text-[#162442] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 sm:p-6 bg-[#FDF8F2]">
          {/* Mẫu thiệp trang nhã sẵn sàng in / lưu PDF */}
          <div
            id="printable-thanks-card"
            className="rounded-3xl bg-white border-2 border-[#1B3B82] shadow-md overflow-hidden"
          >
            {/* Header thiệp */}
            <div className="bg-[#1B3B82] text-white px-6 py-6 text-center space-y-2 border-b-4 border-[#E86F2C]">
              <div className="font-mono inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-[#FDBA8C]" />
                <span>GÓC THỢ QUANH TA · THIỆP TRI ÂN</span>
              </div>
              <h4 className="font-display text-xl sm:text-2xl font-bold leading-snug">
                Gửi {artisan.name}
              </h4>
              <p className="text-xs text-white/90 inline-flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#FDBA8C]" />
                <span>
                  {artisan.district} · {artisan.addressLandmark}
                </span>
              </p>
            </div>

            {/* Thân thiệp chứa các lời cảm ơn đã duyệt */}
            <div className="p-6 space-y-4">
              <p className="text-xs sm:text-sm text-[#5C564E] text-center leading-relaxed max-w-lg mx-auto">
                Cảm ơn cô chú vì đôi tay khéo léo và sự tận tâm mỗi ngày, giúp biết bao món đồ của người trẻ Sài Gòn được tiếp tục đồng hành. Dưới đây là những lời nhắn ấm áp từ khách hàng đã ghé góc nghề của cô chú:
              </p>

              {approvedNotes.length === 0 ? (
                <div className="rounded-2xl bg-[#FDF8F2] border border-dashed border-[#D8C3AE] p-6 text-center text-xs text-[#5C564E]">
                  Chưa có lời cảm ơn nào được duyệt cho cô chú này. Hãy duyệt lời nhắn trong tab &ldquo;Duyệt lưu bút&rdquo; trước khi in nhé!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {approvedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-2xl bg-[#FDF8F2] border border-[#E6D5C3] p-4 space-y-2 flex flex-col justify-between"
                    >
                      <p className="text-xs text-[#162442] leading-relaxed italic">
                        &ldquo;{note.message}&rdquo;
                      </p>
                      <div className="pt-2 border-t border-dashed border-[#D8C3AE] flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#1B3B82]">
                          — {note.author}
                        </span>
                        <span className="font-mono text-[#8A8177] tabular-nums">
                          {note.createdAt}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chân thiệp */}
              <div className="pt-4 border-t border-dashed border-[#D8C3AE] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                <p className="font-display text-xs font-bold text-[#E86F2C]">
                  Hỏng đâu tìm đó – Gần nhau hơn mỗi ngày!
                </p>
                <p className="text-[11px] text-[#8A8177]">
                  Tổng hợp bởi cộng đồng Góc Thợ Quanh Ta · TP.HCM
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-dashed border-[#D8C3AE] bg-white flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-xs font-bold text-[#5C564E] hover:text-[#162442]"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] text-white text-xs font-bold inline-flex items-center gap-2 shadow-[2px_2px_0px_#162442] transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>In thiệp / Lưu PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
