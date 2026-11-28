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
  ) => boolean | void;
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

    const result = onSubmitThankYou(artisan, {
      author: author.trim() || currentUserDisplayName || 'Thành viên Góc Thợ',
      message: cleaned.slice(0, MAX_MESSAGE_LENGTH),
    });

    if (result === false) {
      return;
    }

    setAuthor(currentUserDisplayName);
    setMessage('');
    setErrorMsg('');
    setFormOpen(false);
    setJustSubmitted(true);
  };

  return (
    <section
      aria-labelledby="wall-of-thanks-heading"
      className="pt-5 border-t border-dashed border-[#D8C3AE] space-y-3.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3
            id="wall-of-thanks-heading"
            className="font-display text-sm font-bold text-[#162442] flex items-center gap-1.5"
          >
            <span aria-hidden="true">💌</span>
            <span>Sổ lưu bút cảm ơn</span>
            {approvedNotes.length > 0 && (
              <span className="font-mono text-xs font-bold text-[#E86F2C] tabular-nums">
                ({approvedNotes.length})
              </span>
            )}
          </h3>
          <p className="text-xs text-[#5C564E]">
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
          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FFF3EB] hover:bg-[#FFE6D6] border border-[#E86F2C]/35 text-[#E86F2C] text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
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
        <div className="rounded-2xl bg-[#EEF2FA] border border-[#1B3B82]/25 p-3.5 flex items-start gap-2.5 text-xs text-[#1B3B82]">
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
          className="rounded-2xl bg-[#FDF8F2] border border-[#E6D5C3] p-4 space-y-3"
        >
          <div>
            <label
              htmlFor="thanks-author"
              className="block text-xs font-bold text-[#162442] mb-1"
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
              className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-white text-xs text-[#162442] placeholder:text-[#8A8177] focus:outline-none focus:border-[#1B3B82]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="thanks-message"
                className="text-xs font-bold text-[#162442]"
              >
                Lời nhắn cảm ơn cô chú <span className="text-[#B93818]">*</span>
              </label>
              <span className="font-mono text-[11px] text-[#8A8177] tabular-nums">
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
              className="w-full px-3 py-2 rounded-xl border border-[#DFCBB5] bg-white text-xs text-[#162442] placeholder:text-[#8A8177] resize-none focus:outline-none focus:border-[#1B3B82]"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-[#B93818]">{errorMsg}</p>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-[#5C564E]">
              Sẽ hiển thị sau khi đội ngũ Góc Thợ duyệt
            </p>
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#162442] active:translate-y-0.5 transition-all whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi lời cảm ơn</span>
            </button>
          </div>
        </form>
      )}

      {/* Danh sách các tấm thẻ giấy ghi chú (note card) màu giấy kem ấm */}
      {approvedNotes.length === 0 ? (
        <div className="rounded-2xl bg-[#FDF8F2] border border-dashed border-[#D8C3AE] p-4 text-center space-y-1">
          <HeartHandshake className="w-5 h-5 text-[#E86F2C]/75 mx-auto" />
          <p className="text-xs text-[#5C564E]">
            Chưa có tấm thiệp lưu bút nào. Hãy là người đầu tiên gửi lời cảm ơn tới cô chú nhé!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {approvedNotes.map((note) => (
            <article
              key={note.id}
              className="relative rounded-2xl bg-[#FDF8F2] border border-[#E6D5C3] p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#162442]">
                  <span
                    className="w-2 h-2 rounded-full bg-[#B93818]"
                    aria-hidden="true"
                  />
                  {note.author}
                </span>
                <span className="font-mono text-[10px] text-[#8A8177] tabular-nums">
                  {note.createdAt}
                </span>
              </div>
              <p className="text-xs text-[#5C564E] leading-relaxed italic">
                &ldquo;{note.message}&rdquo;
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
