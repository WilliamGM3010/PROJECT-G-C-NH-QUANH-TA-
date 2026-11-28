import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Handshake,
  Mail,
  MapPinPlus,
  Phone,
  Store,
  X,
} from 'lucide-react';
import { PROJECT_CONTACT_EMAIL } from '../data/team';
import type { AdminAccount, PendingSuggestion } from '../types/artisan';
import { SuggestArtisanView } from './SuggestArtisanView';

interface CommunityViewProps {
  currentUser: AdminAccount | null;
  onRequestAuth: (prompt?: string) => void;
  onSubmitPendingSuggestion: (
    suggestion: PendingSuggestion
  ) =>
    | Promise<{ ok: boolean; error?: string }>
    | { ok: boolean; error?: string }
    | void;
  onBackToExplore: () => void;
}

const PL_NAME = 'Trần Diễm Quỳnh';
const PL_PHONE = '0934088328';
const PL_EMAIL = 'diemquynhtran2628@gmail.com';

const COMMUNITY_FAQS = [
  {
    q: 'Cô chú thợ đăng ký lên bản đồ có mất phí không?',
    a: 'Hoàn toàn miễn phí (0đ). Góc Thợ Quanh Ta là dự án cộng đồng phi lợi nhuận do sinh viên Team WHO (FTU HCMC) vận hành, không thu bất kỳ chi phí hay hoa hồng nào từ cô chú thợ và người dùng.',
  },
  {
    q: 'Nếu cô chú ngại chụp ảnh chân dung thì sao?',
    a: 'Chúng mình luôn tôn trọng tuyệt đối quyền riêng tư của cô chú. Khi có nguyện vọng ẩn chân dung, hệ thống sẽ chỉ hiển thị hình minh họa thủ công hoặc ảnh góc đồ nghề kèm chú thích rõ ràng.',
  },
  {
    q: 'Sau khi tôi đề xuất một góc thợ mới thì bao lâu mới hiện trên bản đồ?',
    a: 'Đề xuất của bạn sẽ vào danh sách Chờ duyệt trên hệ thống. Đội ngũ Cộng tác viên sẽ kiểm tra mốc địa chỉ, tọa độ thực tế và xin phép cô chú trước khi duyệt hiển thị công khai (thường trong 2 – 5 ngày).',
  },
  {
    q: 'Làm sao để cập nhật khi cô chú nghỉ hôm nay hoặc đổi vị trí ngồi?',
    a: 'Bạn chỉ cần mở hồ sơ của cô chú và nhấn nút "Báo cáo tình trạng". Thông tin sẽ gửi trực tiếp về Ban quản trị để cập nhật kịp thời, giúp các bạn khác không đi nhầm chuyến.',
  },
  {
    q: 'Sinh viên trường khác có thể tham gia làm Cộng tác viên không?',
    a: 'Rất hoan nghênh! Bất kỳ bạn trẻ nào yêu thích sống xanh, thích đi khảo sát thực địa hoặc viết chuyện nghề tại TP.HCM đều có thể liên hệ trực tiếp với Project Leader Trần Diễm Quỳnh để đồng hành.',
  },
] as const;

export function CommunityView({
  currentUser,
  onRequestAuth,
  onSubmitPendingSuggestion,
  onBackToExplore,
}: CommunityViewProps) {
  const [activeFormModal, setActiveFormModal] = useState<
    null | 'community' | 'owner'
  >(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (value: string, key: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2200);
    } catch {
      // Bỏ qua nếu trình duyệt hạn chế clipboard
    }
  };

  return (
    <div className="bg-[#F7F2E8] text-[#25292E]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 md:py-16 space-y-20 md:space-y-24 pb-24 lg:pb-20">
        {/* ============================================================
            1. HERO ẤM ÁP
           ============================================================ */}
        <header className="max-w-3xl space-y-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#D46534]">
            CỘNG ĐỒNG · GÓC THỢ QUANH TA
          </p>
          <h1
            className="font-display text-3xl sm:text-5xl font-extrabold text-[#25292E] tracking-tight leading-[1.14]"
            style={{ textWrap: 'balance' }}
          >
            Mỗi chấm nhỏ bạn góp thêm là một góc nghề được giữ lại.
          </h1>
          <p className="font-serif-editorial italic text-base sm:text-lg text-[#615D57] leading-relaxed">
            Bản đồ chỉ thật sự sống khi có sự chung tay của những người đi qua
            từng con hẻm Sài Gòn mỗi ngày.
          </p>
        </header>

        {/* ============================================================
            2. BENTO GRID 2x2 — 4 HÌNH THỨC THAM GIA
           ============================================================ */}
        <section
          aria-label="Các cách tham gia cùng cộng đồng"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Card 01: Đề xuất một góc thợ mới */}
          <article className="rounded-3xl bg-white border border-[#E8DFD1] hover:border-[#D46534]/55 p-7 sm:p-8 flex flex-col justify-between gap-6 transition-all hover:shadow-[0_12px_30px_rgba(37,41,46,0.06)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#D46534]">
                  01 · Đề xuất góc thợ
                </span>
                <span className="w-10 h-10 rounded-2xl bg-[#FDF0E9] text-[#D46534] flex items-center justify-center">
                  <MapPinPlus className="w-5 h-5" />
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#25292E] leading-snug">
                Đề xuất một góc thợ mới
              </h2>
              <p className="text-sm text-[#615D57] leading-relaxed">
                Gặp một cô chú sửa giày, may vá, đánh khóa hay sửa đồng hồ khéo
                tay trên đường đi học? Chỉ mất 1 phút điền mốc địa chỉ để gửi về
                hàng chờ xác minh của đội ngũ.
              </p>
            </div>

            <div className="pt-4 border-t border-dashed border-[#E8DFD1]">
              <button
                type="button"
                onClick={() => setActiveFormModal('community')}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#D46534] hover:bg-[#BC5326] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
              >
                <span>Gửi thông tin góc thợ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </article>

          {/* Card 02: Đăng ký góc nghề lên bản đồ (dành cho chính chủ/người thân) */}
          <article className="rounded-3xl bg-white border border-[#E8DFD1] hover:border-[#1B3B82]/50 p-7 sm:p-8 flex flex-col justify-between gap-6 transition-all hover:shadow-[0_12px_30px_rgba(37,41,46,0.06)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#1B3B82]">
                  02 · Dành cho cô chú &amp; người thân
                </span>
                <span className="w-10 h-10 rounded-2xl bg-[#EEF2FA] text-[#1B3B82] flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#25292E] leading-snug">
                Đăng ký góc nghề lên bản đồ
              </h2>
              <p className="text-sm text-[#615D57] leading-relaxed">
                Cô chú thợ hoặc con cháu muốn đưa góc làm việc lên bản đồ để
                sinh viên quanh khu vực dễ tìm đến hơn.{' '}
                <strong className="text-[#4F6B54] font-semibold">
                  Miễn phí 0đ trọn đời
                </strong>{' '}
                và luôn tôn trọng quyền ẩn chân dung.
              </p>
            </div>

            <div className="pt-4 border-t border-dashed border-[#E8DFD1]">
              <button
                type="button"
                onClick={() => setActiveFormModal('owner')}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1B3B82] hover:bg-[#142D66] text-[#F7F2E8] text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
              >
                <span>Đăng ký góc nghề (0đ)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </article>

          {/* Card 03: Gửi câu chuyện về người thợ */}
          <article className="rounded-3xl bg-white border border-[#E8DFD1] hover:border-[#B93818]/45 p-7 sm:p-8 flex flex-col justify-between gap-6 transition-all hover:shadow-[0_12px_30px_rgba(37,41,46,0.06)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#B93818]">
                  03 · Chuyện nghề vỉa hè
                </span>
                <span className="w-10 h-10 rounded-2xl bg-[#B93818]/10 text-[#B93818] flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#25292E] leading-snug">
                Gửi câu chuyện về người thợ
              </h2>
              <p className="text-sm text-[#615D57] leading-relaxed">
                Bạn có một kỷ niệm đẹp khi đi sửa đôi giày cũ, chiếc áo thân
                quen hay muốn giới thiệu một nhân vật giàu cảm hứng lên chuyên
                trang Bản tin? Hãy kể cho Ban biên tập nghe nhé.
              </p>
            </div>

            <div className="pt-4 border-t border-dashed border-[#E8DFD1] flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setStoryModalOpen(true)}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#F7F2E8] hover:bg-[#B93818] text-[#25292E] hover:text-white border border-[#E8DFD1] hover:border-[#B93818] text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
              >
                <span>Gửi bài / đề xuất nhân vật</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </article>

          {/* Card 04: Đồng hành cùng dự án / Cộng tác viên */}
          <article className="rounded-3xl bg-white border border-[#E8DFD1] hover:border-[#4F6B54]/50 p-7 sm:p-8 flex flex-col justify-between gap-6 transition-all hover:shadow-[0_12px_30px_rgba(37,41,46,0.06)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#4F6B54]">
                  04 · Hợp tác &amp; Cộng tác viên
                </span>
                <span className="w-10 h-10 rounded-2xl bg-[#EDF3EE] text-[#4F6B54] flex items-center justify-center">
                  <Handshake className="w-5 h-5" />
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#25292E] leading-snug">
                Đồng hành cùng dự án / CTV
              </h2>
              <p className="text-sm text-[#615D57] leading-relaxed">
                Muốn cùng Team WHO đi thực địa mở rộng bản đồ, truyền thông
                sống xanh hoặc kết nối CLB/doanh nghiệp xã hội? Liên hệ trực
                tiếp Trưởng dự án (Project Leader):
              </p>

              <div className="rounded-2xl bg-[#F7F2E8] border border-[#E8DFD1] p-4 space-y-2 text-xs">
                <p className="font-display font-bold text-sm text-[#25292E]">
                  {PL_NAME}{' '}
                  <span className="font-mono text-[11px] font-semibold text-[#1B3B82]">
                    · Project Leader
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <a
                    href={`tel:${PL_PHONE}`}
                    className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#25292E] hover:text-[#D46534] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#D46534]" />
                    <span>{PL_PHONE}</span>
                  </a>
                  <a
                    href={`mailto:${PL_EMAIL}`}
                    className="inline-flex items-center gap-1.5 font-medium text-[#1B3B82] hover:text-[#D46534] transition-colors break-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#1B3B82]" />
                    <span>{PL_EMAIL}</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed border-[#E8DFD1] flex flex-wrap items-center gap-2.5">
              <a
                href={`mailto:${PL_EMAIL}?subject=${encodeURIComponent('[Góc Thợ Quanh Ta] Liên hệ đồng hành / Cộng tác viên')}`}
                className="min-h-[42px] px-4 py-2 rounded-full bg-[#4F6B54] hover:bg-[#3E5743] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Gửi email kết nối</span>
              </a>

              <button
                type="button"
                onClick={() => handleCopy(PL_EMAIL, 'pl-email')}
                className="min-h-[42px] px-3.5 py-2 rounded-full bg-white hover:bg-[#F7F2E8] border border-[#E8DFD1] text-xs font-semibold text-[#615D57] inline-flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'pl-email' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#4F6B54]" />
                    <span className="text-[#4F6B54]">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép email</span>
                  </>
                )}
              </button>
            </div>
          </article>
        </section>

        {/* ============================================================
            3. CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION 5 CÂU)
           ============================================================ */}
        <section
          aria-label="Câu hỏi thường gặp"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          <div className="lg:col-span-4 space-y-2.5">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1B3B82]">
              Giải đáp nhanh
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#25292E] tracking-tight">
              Câu hỏi thường gặp
            </h2>
            <p className="text-sm text-[#615D57] leading-relaxed">
              Những điều cộng đồng và cô chú thợ thường quan tâm khi tham gia
              cùng Góc Thợ Quanh Ta.
            </p>
          </div>

          <div className="lg:col-span-8 rounded-3xl bg-white border border-[#E8DFD1] divide-y divide-dashed divide-[#DFD3C2] overflow-hidden">
            {COMMUNITY_FAQS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#F7F2E8]/60 transition-colors"
                  >
                    <span className="font-display text-sm sm:text-[15.5px] font-bold text-[#25292E] leading-snug">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-4.5 h-4.5 text-[#D46534] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-[#615D57] leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================
            4. KÊNH LIÊN HỆ CHÍNH THỨC & 3 KÊNH MẠNG XÃ HỘI
           ============================================================ */}
        <section
          aria-label="Kênh liên hệ chính thức"
          className="rounded-3xl bg-[#1B3B82] text-[#F7F2E8] p-3 sm:p-4"
        >
          <div className="rounded-2xl border border-dashed border-[#F7F2E8]/28 px-6 sm:px-10 py-8 sm:py-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-2.5 max-w-xl">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#F4C4A8]">
                Kênh liên hệ chính thức
              </p>
              <h2 className="font-display text-2xl font-extrabold text-[#F7F2E8]">
                Kết nối cùng Team WHO · Góc Thợ Quanh Ta
              </h2>
              <p className="text-sm text-[#F7F2E8]/80 leading-relaxed">
                Mọi góp ý, câu chuyện hay đề nghị hợp tác xin gửi về hòm thư
                chính thức của dự án tại Phân hiệu Trường ĐH Ngoại thương TP.HCM.
              </p>
            </div>

            <div className="space-y-4 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`mailto:${PROJECT_CONTACT_EMAIL}`}
                  className="min-h-[42px] px-4 py-2 rounded-full bg-white text-[#1B3B82] hover:bg-[#F7F2E8] text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#D46534]" />
                  <span>{PROJECT_CONTACT_EMAIL}</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(PROJECT_CONTACT_EMAIL, 'official')}
                  className="min-h-[42px] px-3.5 py-2 rounded-full bg-white/12 hover:bg-white/20 border border-white/25 text-xs font-semibold text-[#F7F2E8] inline-flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === 'official' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#F7F2E8] font-semibold transition-colors"
                >
                  Facebook Fanpage
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#F7F2E8] font-semibold transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#F7F2E8] font-semibold transition-colors"
                >
                  TikTok
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal Form Đề xuất / Đăng ký góc thợ (đẩy thẳng lên Supabase pending suggestions) */}
      {activeFormModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] bg-[#25292E]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveFormModal(null);
          }}
        >
          <div className="w-full max-w-4xl max-h-[90dvh] rounded-3xl bg-[#F7F2E8] border border-[#E8DFD1] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-white border-b border-dashed border-[#DFD3C2] flex items-center justify-between gap-3 shrink-0">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1B3B82]">
                {activeFormModal === 'owner'
                  ? 'Đăng ký góc nghề trực tiếp (0đ)'
                  : 'Đề xuất góc thợ mới'}
              </span>
              <button
                type="button"
                onClick={() => setActiveFormModal(null)}
                aria-label="Đóng biểu mẫu"
                className="w-9 h-9 rounded-xl text-[#615D57] hover:bg-[#F7F2E8] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto thin-scrollbar flex-1">
              <SuggestArtisanView
                embedded
                mode={activeFormModal}
                currentUser={currentUser}
                onRequestAuth={onRequestAuth}
                onSubmitPendingSuggestion={onSubmitPendingSuggestion}
                onBackToExplore={() => {
                  setActiveFormModal(null);
                  onBackToExplore();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Gửi câu chuyện về người thợ */}
      {storyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] bg-[#25292E]/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setStoryModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E8DFD1] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#F7F2E8] border-b border-dashed border-[#DFD3C2] flex items-center justify-between gap-3">
              <h3 className="font-display text-base font-extrabold text-[#25292E]">
                Gửi câu chuyện về người thợ
              </h3>
              <button
                type="button"
                onClick={() => setStoryModalOpen(false)}
                aria-label="Đóng hộp thoại"
                className="w-8 h-8 rounded-xl text-[#615D57] hover:bg-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-[#615D57] leading-relaxed">
                Hãy gửi cho Ban biên tập vài dòng về cô chú thợ bạn ấn tượng
                (tên gọi, góc đường, kỷ niệm sửa đồ và ảnh góc đồ nghề nếu có).
                Chúng mình sẽ liên hệ để biên tập lên chuyên trang Bản tin!
              </p>

              <div className="rounded-2xl bg-[#F7F2E8] border border-[#E8DFD1] p-4 space-y-2 text-xs">
                <p className="font-mono font-bold uppercase tracking-wider text-[#615D57]">
                  Hòm thư tiếp nhận câu chuyện
                </p>
                <p className="font-mono text-sm font-bold text-[#1B3B82] break-all">
                  {PROJECT_CONTACT_EMAIL}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <a
                  href={`mailto:${PROJECT_CONTACT_EMAIL}?subject=${encodeURIComponent('[Góc Thợ Quanh Ta] Gửi câu chuyện về người thợ')}&body=${encodeURIComponent('Xin chào Team WHO,\n\nMình muốn chia sẻ câu chuyện về cô/chú thợ:\n- Tên / Góc đường:\n- Kỷ niệm / Điều ấn tượng:\n\nCảm ơn dự án!')}`}
                  className="flex-1 min-h-[44px] px-5 py-2.5 rounded-full bg-[#D46534] hover:bg-[#BC5326] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Mail className="w-4 h-4" />
                  <span>Mở ứng dụng Email</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(PROJECT_CONTACT_EMAIL, 'story')}
                  className="min-h-[44px] px-4 py-2.5 rounded-full border border-[#E8DFD1] bg-white hover:bg-[#F7F2E8] text-xs sm:text-sm font-semibold text-[#25292E] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  {copiedKey === 'story' ? (
                    <>
                      <Check className="w-4 h-4 text-[#4F6B54]" />
                      <span className="text-[#4F6B54]">Đã chép email</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
