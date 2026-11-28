import { ArrowUpRight, Mail, ShieldCheck } from 'lucide-react';
import {
  FTU_LOGO_SRC,
  GTQT_LOGO_SRC,
  PROJECT_CONTACT_EMAIL,
} from '../data/team';
import type { AdminAccount, AppTab } from '../types/artisan';
import { canAccessAdminDashboard } from '../utils/storage';

interface SiteFooterProps {
  currentUser: AdminAccount | null;
  onNavigate: (tab: AppTab) => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
}

/**
 * Footer chung toàn web theo phong cách Craft Editorial Minimalism:
 * - Đường viền đứt nét trên cùng gợi sợi chỉ khâu
 * - Co-branding Logo tròn GTQT | Logo tròn FTU
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
    <footer className="bg-[#FDF8F2] border-t border-dashed border-[#D8C3AE] text-[#5C564E] pb-24 lg:pb-12">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
          {/* Cột 1: Co-branding GTQT & Team WHO - FTU */}
          <div className="md:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] rounded-xl"
              >
                <span className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-[#E86F2C]/35 bg-[#FDF8F2] shadow-2xs transition-transform duration-200 group-hover:scale-105">
                  <img
                    src={GTQT_LOGO_SRC}
                    alt="Logo Góc Thợ Quanh Ta"
                    className="w-full h-full object-cover scale-[1.07]"
                  />
                </span>
                <span className="font-display text-[15px] font-extrabold tracking-tight text-[#162442] group-hover:text-[#1B3B82] transition-colors">
                  GÓC THỢ QUANH TA
                </span>
              </button>

              <span
                aria-hidden="true"
                className="h-6 w-px bg-[#D8C3AE] shrink-0"
              />

              <span className="w-9 h-9 rounded-full overflow-hidden bg-white ring-1 ring-[#E6D5C3] shadow-2xs shrink-0">
                <img
                  src={FTU_LOGO_SRC}
                  alt="Logo Trường Đại học Ngoại thương"
                  className="w-full h-full object-cover scale-[1.03]"
                />
              </span>
            </div>

            <p className="text-xs sm:text-[13px] leading-relaxed text-[#5C564E] max-w-sm">
              Nền tảng cộng đồng phi lợi nhuận giúp sinh viên và người dân
              TP.HCM tìm nhanh cô chú thợ sửa chữa lành nghề gần nhà, lan tỏa
              lối sống xanh bền vững.
            </p>

            {/* Nhận diện FTU HCMC & Team WHO */}
            <div className="pt-0.5 leading-snug">
              <p className="text-[11px] font-bold tracking-[0.08em] text-[#1B3B82] uppercase">
                Team WHO · Lớp Học phần KDO441
              </p>
              <p className="text-[11px] text-[#5C564E] mt-0.5">
                Phân hiệu Trường ĐH Ngoại thương tại TP.HCM
              </p>
            </div>
          </div>

          {/* Cột 2: Khám phá nhanh */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#162442]">
              Khám phá
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#E86F2C] transition-colors"
                >
                  Tìm chỗ sửa gần bạn
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="hover:text-[#E86F2C] transition-colors"
                >
                  Bản đồ góc thợ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('news')}
                  className="hover:text-[#E86F2C] transition-colors"
                >
                  Bản tin cộng đồng
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#E86F2C] transition-colors"
                >
                  Về dự án &amp; Team WHO
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('suggest')}
                  className="hover:text-[#E86F2C] transition-colors"
                >
                  Gợi ý cô chú thợ mới
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 3: Liên hệ & Đồng hành */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#162442]">
              Đồng hành &amp; Liên hệ
            </h3>
            <div className="space-y-2.5 text-xs sm:text-[13px]">
              <a
                href={`mailto:${PROJECT_CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 text-[#162442] hover:text-[#E86F2C] font-medium transition-colors break-all"
              >
                <Mail className="w-3.5 h-3.5 text-[#E86F2C] shrink-0" />
                <span>{PROJECT_CONTACT_EMAIL}</span>
              </a>

              <p className="text-xs text-[#5C564E] leading-relaxed">
                Số 15 Đường D5, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh
                (FTU Cơ sở II).
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                {currentUser ? (
                  canManage ? (
                    <button
                      type="button"
                      onClick={onOpenAdmin}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#1B3B82] hover:text-[#E86F2C] transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Trang Quản trị</span>
                    </button>
                  ) : (
                    <span className="text-[#5C564E]">
                      Đang đăng nhập:{' '}
                      <strong className="text-[#162442] font-semibold">
                        {currentUser.displayName || currentUser.name}
                      </strong>
                    </span>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="inline-flex items-center gap-1 font-semibold text-[#1B3B82] hover:text-[#E86F2C] transition-colors"
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
        <div className="mt-9 pt-5 border-t border-dashed border-[#DFCBB5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11.5px] text-[#7A7267]">
          <p>
            © 2026 Góc Thợ Quanh Ta · Dự án cộng đồng bởi Team WHO (KDO441 — FTU
            HCMC).
          </p>
          <p className="text-[#5C564E]">
            Phi lợi nhuận · Tôn trọng người thợ · Sống xanh bền vững
          </p>
        </div>
      </div>
    </footer>
  );
}
