import { useState, type FormEvent } from 'react';
import { CheckCircle2, HeartHandshake, Mail, Send, X } from 'lucide-react';
import type { Artisan, ThankYouNote } from '../types/artisan';

interface WallOfThanksSectionProps {
  artisan: Artisan;
  approvedNotes: ThankYouNote[];
  currentUserDisplayName: string;
  onSubmitThankYou: (
    artisan: Artisan,
    payload: { author: string; message: string }
  ) => void;
}

const MAX_MESSAGE_LENGTH = 200;

export function WallOfThanksSection({
  artisan,
  approvedNotes,
  currentUserDisplayName,
  onSubmitThankYou,
}: WallOfThanksSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [author, setAuthor] = useState(currentUserDisplayName);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = message.trim();
    if (cleaned.length < 6) {
      setErrorMsg('Bạn hãy viết đôi lời cảm ơn rõ hơn một chút nhé (tối thiểu 6 ký tự).');
      return;
    }

    onSubmitThankYou(artisan, {
      author: author.trim() || currentUserDisplayName || 'Thành viên Góc Thợ',
      message: cleaned.slice(0, MAX_MESSAGE_LENGTH),
    });

    setAuthor(currentUserDisplayName);
    setMessage('');
    setErrorMsg('');
    setFormOpen(false);
    setJustSubmitted(true);
  };

  return (
    <section
      aria-labelledby="wall-of-thanks-heading"
      className="pt-5 border-t border-[#EBE5DC] space-y-3.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3
            id="wall-of-thanks-heading"
            className="text-sm font-bold text-[#1F2933] flex items-center gap-1.5"
          >
            <span aria-hidden="true">💌</span>
            <span>Sổ lưu bút cảm ơn</span>
            {approvedNotes.length > 0 && (
              <span className="text-xs font-semibold text-[#D96B38] tabular-nums">
                ({approvedNotes.length})
              </span>
            )}
          </h3>
          <p className="text-xs text-[#52606D]">
            Những tấm thiệp nhỏ gửi tới tay nghề tận tâm của cô chú.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormOpen((v) => !v);
            setJustSubmitted(false);
            setErrorMsg('');
          }}
          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#D96B38]/12 hover:bg-[#D96B38]/20 text-[#D96B38] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          {formOpen ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Đóng</span>
            </>
          ) : (
            <>
              <Mail className="w-3.5 h-3.5" />
              <span>Viết lời cảm ơn cô chú</span>
            </>
          )}
        </button>
      </div>

      {/* Thông báo sau khi gửi lời cảm ơn */}
      {justSubmitted && (
        <div className="rounded-2xl bg-[#3A6B5C]/10 border border-[#3A6B5C]/25 p-3.5 flex items-start gap-2.5 text-xs text-[#3A6B5C]">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            Cảm ơn tấm lòng của bạn! Lời nhắn sẽ hiển thị sau khi đội ngũ Góc Thợ duyệt qua nhé.
          </p>
        </div>
      )}

      {/* Form nhỏ viết lời cảm ơn */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-[#FFFBF2] border border-[#EEDEC0] p-4 space-y-3 shadow-xs"
        >
          <div>
            <label
              htmlFor="thanks-author"
              className="block text-xs font-semibold text-[#1F2933] mb-1"
            >
              Tên / Biệt danh (có thể để trống để ẩn danh)
            </label>
            <input
              id="thanks-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={40}
              placeholder="VD: Minh Anh (SV D2), hoặc để trống..."
              className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-[#E5D7BD] bg-white text-xs text-[#1F2933] placeholder:text-[#7B8794] focus:outline-none focus:border-[#D96B38]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="thanks-message"
                className="text-xs font-semibold text-[#1F2933]"
              >
                Lời nhắn cảm ơn cô chú <span className="text-[#C84B31]">*</span>
              </label>
              <span className="text-[11px] text-[#7B8794] tabular-nums">
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <textarea
              id="thanks-message"
              rows={3}
              required
              maxLength={MAX_MESSAGE_LENGTH}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Gửi lời cảm ơn về món đồ cô chú vừa giúp bạn sửa hoặc chúc cô chú thật nhiều sức khỏe..."
              className="w-full px-3 py-2 rounded-xl border border-[#E5D7BD] bg-white text-xs text-[#1F2933] placeholder:text-[#7B8794] resize-none focus:outline-none focus:border-[#D96B38]"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-medium text-[#C84B31]">{errorMsg}</p>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-[#52606D]">
              Sẽ hiển thị sau khi đội ngũ Góc Thợ duyệt
            </p>
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi lời cảm ơn</span>
            </button>
          </div>
        </form>
      )}

      {/* Danh sách các tấm thẻ giấy ghi chú (note card) màu kem dịu mắt */}
      {approvedNotes.length === 0 ? (
        <div className="rounded-2xl bg-[#FFFBF2] border border-dashed border-[#E6D8BE] p-4 text-center space-y-1">
          <HeartHandshake className="w-5 h-5 text-[#D96B38]/70 mx-auto" />
          <p className="text-xs text-[#52606D]">
            Chưa có tấm thiệp lưu bút nào. Hãy là người đầu tiên gửi lời cảm ơn tới cô chú nhé!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {approvedNotes.map((note) => (
            <article
              key={note.id}
              className="relative rounded-2xl bg-[#FFFBF2] border border-[#EFE2C6] p-3.5 shadow-[0_2px_8px_rgba(217,107,56,0.06)] space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F2933]">
                  <span
                    className="w-2 h-2 rounded-full bg-[#D96B38]"
                    aria-hidden="true"
                  />
                  {note.author}
                </span>
                <span className="text-[11px] text-[#7B8794] tabular-nums">
                  {note.createdAt}
                </span>
              </div>
              <p className="text-xs text-[#3E4C59] leading-relaxed italic">
                &ldquo;{note.message}&rdquo;
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
