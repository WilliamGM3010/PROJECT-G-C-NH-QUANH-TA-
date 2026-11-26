import {
  Compass,
  EyeOff,
  Handshake,
  Heart,
  Leaf,
  Lock,
  PlusCircle,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import type { AdminAccount, AppTab } from '../types/artisan';

interface AboutViewProps {
  totalArtisans: number;
  revivedCount: number;
  currentAdmin: AdminAccount | null;
  badgeTitle?: string | null;
  onNavigate: (tab: AppTab) => void;
  onOpenBadge: () => void;
  onOpenAdmin: () => void;
}

export function AboutView({
  totalArtisans,
  revivedCount,
  currentAdmin,
  badgeTitle,
  onNavigate,
  onOpenBadge,
  onOpenAdmin,
}: AboutViewProps) {
  const values = [
    {
      title: 'Kết nối sinh kế bền vững',
      description:
        'Giúp những đôi tay lành nghề nơi góc phố dễ dàng được thế hệ trẻ tìm thấy hơn trên bản đồ số, mang lại nguồn khách đều đặn và sự trân trọng xứng đáng với công sức lao động.',
      Icon: Handshake,
      iconTone: 'bg-[#D96B38]/12 text-[#D96B38]',
    },
    {
      title: 'Tiêu dùng có trách nhiệm (Sống xanh)',
      description:
        'Một đôi giày bung keo, chiếc balo đứt khóa hay chiếc quần hơi dài đều có thể sửa gọn trong vài chục nghìn đồng — kéo dài vòng đời đồ dùng và giảm rác thải thời trang đô thị.',
      Icon: Leaf,
      iconTone: 'bg-[#3A6B5C]/12 text-[#3A6B5C]',
    },
    {
      title: 'Gìn giữ nghề thủ công đô thị',
      description:
        'Lưu giữ những góc sửa giày, máy may đạp chân và tủ khóa nhỏ thân quen — một phần ký ức sống động, ấm áp và tử tế của nhịp sống vỉa hè Sài Gòn.',
      Icon: Wrench,
      iconTone: 'bg-[#E9A825]/18 text-[#9A6807]',
    },
  ];

  return (
    <div className="min-h-full bg-[#FAF8F5] py-8 px-4 sm:px-6 lg:py-12 pb-24 lg:pb-16">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Hero thông điệp cốt lõi */}
        <section className="rounded-3xl bg-white border border-[#EBE5DC] shadow-sm p-6 sm:p-10 lg:p-12 space-y-6">
          <div className="space-y-3 max-w-3xl">
            <p className="text-xs sm:text-sm font-semibold text-[#D96B38]">
              Hỏng đâu tìm đó – Gần nhau hơn mỗi ngày!
            </p>
            <h1
              className="text-2xl sm:text-4xl font-bold text-[#1F2933] leading-tight tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Mỗi góc phố đều có một người thợ, mỗi món đồ cũ đều có cơ hội được tiếp tục đồng hành.
            </h1>
            <p className="text-sm sm:text-base text-[#52606D] leading-relaxed">
              <strong className="text-[#1F2933]">Góc Thợ Quanh Ta</strong> là bản đồ cộng đồng phi lợi nhuận dành cho người trẻ tại TP.HCM. Chúng mình tin rằng sự kết nối giữa công nghệ số và nghề thủ công truyền thống không nằm ở sự thương hại, mà ở sự tin cậy, tiện lợi và tôn trọng tay nghề đích thực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#3A6B5C] font-semibold tabular-nums">
            <span>{totalArtisans} góc thợ đang hiển thị</span>
            <span className="text-[#CBD2D9]" aria-hidden="true">
              ·
            </span>
            <span>♻️ {revivedCount} món đồ đã được hồi sinh cùng cộng đồng</span>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-sm font-semibold shadow-sm inline-flex items-center gap-2 transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>Khám phá {totalArtisans} góc thợ quanh đây</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('suggest')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] hover:bg-[#F2ECE2] text-[#1F2933] text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-[#D96B38]" />
              <span>Gợi ý thêm cô chú thợ</span>
            </button>

            <button
              type="button"
              onClick={onOpenBadge}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#D96B38]/35 bg-[#FFFBF2] hover:border-[#D96B38] text-[#1F2933] text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <span aria-hidden="true">🏅</span>
              <span>
                {badgeTitle ? `Huy hiệu: ${badgeTitle}` : 'Huy hiệu của tôi'}
              </span>
            </button>
          </div>
        </section>

        {/* 3 Thẻ giá trị cốt lõi */}
        <section aria-labelledby="values-heading" className="space-y-4">
          <h2 id="values-heading" className="text-lg sm:text-xl font-bold text-[#1F2933]">
            Ba điều chúng mình gìn giữ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {values.map(({ title, description, Icon, iconTone }) => (
              <article
                key={title}
                className="rounded-2xl bg-white border border-[#EBE5DC] shadow-sm p-6 space-y-3.5"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconTone}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#1F2933]">{title}</h3>
                <p className="text-sm text-[#52606D] leading-relaxed">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Khối Cam kết quyền riêng tư */}
        <section
          aria-labelledby="privacy-heading"
          className="rounded-3xl bg-[#3A6B5C] text-white p-6 sm:p-8 lg:p-10 space-y-6 shadow-sm"
        >
          <div className="flex items-start gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </span>
            <div className="space-y-1">
              <h2 id="privacy-heading" className="text-lg sm:text-xl font-bold">
                Cam kết quyền riêng tư & tôn trọng người thợ
              </h2>
              <p className="text-sm text-white/85 leading-relaxed max-w-2xl">
                Mọi thông tin hiển thị trên bản đồ đều được xây dựng trên nguyên tắc minh bạch, văn minh và đặt sự thoải mái của cô chú lên hàng đầu.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Heart className="w-4 h-4 text-[#F6C8A8]" />
                <span>Hoàn toàn phi lợi nhuận</span>
              </div>
              <p className="text-xs text-white/85 leading-relaxed">
                Không thu phí hoa hồng, không quảng cáo làm phiền và không thương mại hóa hình ảnh của cô chú.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <ShieldCheck className="w-4 h-4 text-[#F6C8A8]" />
                <span>Chỉ đăng khi có đồng thuận</span>
              </div>
              <p className="text-xs text-white/85 leading-relaxed">
                Tất cả địa điểm xác minh đều được trao đổi trực tiếp, xin phép cô chú trước khi đưa lên bản đồ và sẵn sàng gỡ bỏ ngay khi cô chú yêu cầu.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <EyeOff className="w-4 h-4 text-[#F6C8A8]" />
                <span>Cho phép ẩn danh, không lộ mặt</span>
              </div>
              <p className="text-xs text-white/85 leading-relaxed">
                Khuyến khích chỉ ghi cách gọi thân mật (Chú Ba, Cô Tư…) và chụp góc đồ nghề, bàn tay làm nghề để bảo vệ tuyệt đối quyền riêng tư.
              </p>
            </div>
          </div>
        </section>

        {/* Nút nhỏ Quản trị dành cho đội ngũ điều phối (đặc biệt tiện trên Mobile) */}
        <footer className="pt-2 border-t border-[#E8E2D9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#52606D]">
          <p>Góc Thợ Quanh Ta · Dự án cộng đồng tại TP.HCM</p>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E5DFD5] text-[#52606D] hover:text-[#1F2933] hover:border-[#D96B38]/50 font-semibold transition-colors"
          >
            {currentAdmin ? (
              <>
                <ShieldCheck className="w-4 h-4 text-[#3A6B5C]" />
                <span>Vào Khu Quản Trị ({currentAdmin.role})</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Quản trị</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
