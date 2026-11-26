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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#1F2933]/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-2xl bg-white border border-[#EBE5DC] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EBE5DC] bg-[#FAF8F5] shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#D96B38]" />
            <h3
              id="printable-thanks-title"
              className="text-sm font-bold text-[#1F2933]"
            >
              In thiệp cảm ơn cộng đồng tặng cô chú
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-[#52606D] hover:bg-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 sm:p-6 bg-[#FAF8F5]">
          {/* Mẫu thiệp trang nhã sẵn sàng in / lưu PDF */}
          <div
            id="printable-thanks-card"
            className="rounded-3xl bg-[#FFFDF9] border-2 border-[#D96B38]/35 shadow-md overflow-hidden"
          >
            {/* Header thiệp */}
            <div className="bg-gradient-to-r from-[#D96B38] to-[#C25A2B] text-white px-6 py-6 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>GÓC THỢ QUANH TA · THIỆP TRI ÂN</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold leading-snug">
                Gửi {artisan.name}
              </h4>
              <p className="text-xs text-white/90 inline-flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {artisan.district} · {artisan.addressLandmark}
                </span>
              </p>
            </div>

            {/* Thân thiệp chứa các lời cảm ơn đã duyệt */}
            <div className="p-6 space-y-4">
              <p className="text-xs sm:text-sm text-[#52606D] text-center leading-relaxed max-w-lg mx-auto">
                Cảm ơn cô chú vì đôi tay khéo léo và sự tận tâm mỗi ngày, giúp biết bao món đồ của người trẻ Sài Gòn được tiếp tục đồng hành. Dưới đây là những lời nhắn ấm áp từ khách hàng đã ghé góc nghề của cô chú:
              </p>

              {approvedNotes.length === 0 ? (
                <div className="rounded-2xl bg-[#FAF8F5] border border-dashed border-[#DFD6C7] p-6 text-center text-xs text-[#52606D]">
                  Chưa có lời cảm ơn nào được duyệt cho cô chú này. Hãy duyệt lời nhắn trong tab &ldquo;Duyệt lưu bút&rdquo; trước khi in nhé!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {approvedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-2xl bg-[#FFFBF2] border border-[#EDE0C6] p-4 space-y-2 flex flex-col justify-between"
                    >
                      <p className="text-xs text-[#1F2933] leading-relaxed italic">
                        &ldquo;{note.message}&rdquo;
                      </p>
                      <div className="pt-2 border-t border-[#F0E4CC] flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#3A6B5C]">
                          — {note.author}
                        </span>
                        <span className="text-[#7B8794] tabular-nums">
                          {note.createdAt}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chân thiệp */}
              <div className="pt-4 border-t border-[#EBE5DC] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                <p className="text-xs font-bold text-[#3A6B5C]">
                  Hỏng đâu tìm đó – Gần nhau hơn mỗi ngày!
                </p>
                <p className="text-[11px] text-[#7B8794]">
                  Tổng hợp bởi cộng đồng Góc Thợ Quanh Ta · TP.HCM
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-[#EBE5DC] bg-white flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-xs font-semibold text-[#52606D] hover:text-[#1F2933]"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In thiệp / Lưu PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
