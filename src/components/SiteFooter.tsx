import { ArrowUpRight, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { FTU_LOGO_SRC, PROJECT_CONTACT_EMAIL } from '../data/team';
import type { AdminAccount, AppTab } from '../types/artisan';
import { canAccessAdminDashboard } from '../utils/storage';

interface SiteFooterProps {
  currentUser: AdminAccount | null;
  onNavigate: (tab: AppTab) => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
}

/**
 * Footer chung toàn web theo phong cách Editorial Minimalism:
 * - Hiển thị ở cuối các trang cuộn (Trang mở đầu, Bản tin, Về dự án, Gợi ý thợ)
 * - Tự động ẩn trên giao diện Bản đồ toàn màn hình (Map View) và Khu Quản Trị (Admin Dashboard)
 */
export function SiteFooter({
  currentUser,
  onNavigate,
  onOpenAuth,
  onOpenAdmin,
}: SiteFooterProps) {
  const canManage = currentUser
    ? canAccessAdminDashboard(currentUser.role)
    : false;

  return (
    <footer className="bg-[#FAF8F5] border-t border-stone-200/80 text-[#52606D] pb-24 lg:pb-12">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
          {/* Cột 1: Thương hiệu & Nhận diện Team WHO - FTU */}
          <div className="md:col-span-5 space-y-4">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A6B5C] rounded-lg"
            >
              <span className="w-8 h-8 rounded-xl bg-[#D96B38] text-white flex items-center justify-center shadow-2xs transition-transform duration-200 group-hover:scale-105">
                <MapPin className="w-4 h-4" strokeWidth={2.3} />
              </span>
              <span className="text-sm font-bold tracking-tight text-[#1F2933]">
                GÓC THỢ QUANH TA
              </span>
            </button>

            <p className="text-xs sm:text-[13px] leading-relaxed text-[#616E7C] max-w-sm">
              Nền tảng cộng đồng phi lợi nhuận giúp sinh viên và người dân
              TP.HCM tìm nhanh cô chú thợ sửa chữa lành nghề gần nhà, lan tỏa
              lối sống xanh bền vững.
            </p>

            {/* Nhận diện FTU HCMC & Team WHO */}
            <div className="inline-flex items-center gap-3 pt-1">
              <span className="w-9 h-9 rounded-full overflow-hidden bg-white ring-1 ring-stone-200/80 shadow-xs shrink-0">
                <img
                  src={FTU_LOGO_SRC}
                  alt="Logo Trường Đại học Ngoại thương"
                  className="w-full h-full object-cover scale-[1.03]"
                />
              </span>
              <div className="leading-snug">
                <p className="text-[11px] font-bold tracking-[0.08em] text-[#1F2933] uppercase">
                  Team WHO · Lớp Học phần KDO441
                </p>
                <p className="text-[11px] text-[#616E7C]">
                  Phân hiệu Trường ĐH Ngoại thương tại TP.HCM
                </p>
              </div>
            </div>
          </div>

          {/* Cột 2: Khám phá nhanh */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1F2933]">
              Khám phá
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#D96B38] transition-colors"
                >
                  Tìm chỗ sửa gần bạn
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="hover:text-[#D96B38] transition-colors"
                >
                  Bản đồ góc thợ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('news')}
                  className="hover:text-[#D96B38] transition-colors"
                >
                  Bản tin cộng đồng
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#D96B38] transition-colors"
                >
                  Về dự án &amp; Team WHO
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('suggest')}
                  className="hover:text-[#D96B38] transition-colors"
                >
                  Gợi ý cô chú thợ mới
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 3: Liên hệ & Đồng hành */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1F2933]">
              Đồng hành &amp; Liên hệ
            </h3>
            <div className="space-y-2.5 text-xs sm:text-[13px]">
              <a
                href={`mailto:${PROJECT_CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 text-[#1F2933] hover:text-[#D96B38] font-medium transition-colors break-all"
              >
                <Mail className="w-3.5 h-3.5 text-[#D96B38] shrink-0" />
                <span>{PROJECT_CONTACT_EMAIL}</span>
              </a>

              <p className="text-xs text-[#616E7C] leading-relaxed">
                Số 15 Đường D5, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh
                (FTU Cơ sở II).
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                {currentUser ? (
                  canManage ? (
                    <button
                      type="button"
                      onClick={onOpenAdmin}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#3A6B5C] hover:underline"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Trang Quản trị</span>
                    </button>
                  ) : (
                    <span className="text-[#616E7C]">
                      Đang đăng nhập:{' '}
                      <strong className="text-[#1F2933] font-semibold">
                        {currentUser.displayName || currentUser.name}
                      </strong>
                    </span>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="inline-flex items-center gap-1 font-semibold text-[#3A6B5C] hover:text-[#D96B38] transition-colors"
                  >
                    <span>Đăng nhập thành viên</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dòng bản quyền & nguyên tắc cộng đồng */}
        <div className="mt-9 pt-5 border-t border-stone-200/75 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11.5px] text-[#7B8794]">
          <p>
            © 2026 Góc Thợ Quanh Ta · Dự án cộng đồng bởi Team WHO (KDO441 — FTU
            HCMC).
          </p>
          <p className="text-[#616E7C]">
            Phi lợi nhuận · Tôn trọng người thợ · Sống xanh bền vững
          </p>
        </div>
      </div>
    </footer>
  );
}
