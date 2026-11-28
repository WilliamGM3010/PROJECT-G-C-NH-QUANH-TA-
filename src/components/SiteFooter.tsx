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
 * Footer chung toàn web theo concept THE NEIGHBORHOOD CRAFT:
 * - Nền Warm Ivory #F7F2E8 + đường chỉ đứt nét #DFD3C2
 * - Co-branding Logo tròn GTQT | Logo tròn FTU
 * - Tự động ẩn trên Bản đồ (/ban-do) và Khu Quản Trị (/quan-tri)
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
    <footer className="bg-[#F7F2E8] border-t border-dashed border-[#DFD3C2] text-[#615D57] pb-24 lg:pb-12">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
          {/* Cột 1: Co-branding GTQT & Team WHO - FTU */}
          <div className="md:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] rounded-xl"
              >
                <span className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-[#D46534]/35 bg-[#F7F2E8] shadow-2xs transition-transform duration-200 group-hover:scale-105">
                  <img
                    src={GTQT_LOGO_SRC}
                    alt="Logo Góc Thợ Quanh Ta"
                    className="w-full h-full object-cover scale-[1.07]"
                  />
                </span>
                <span className="font-display text-[15px] font-extrabold tracking-tight text-[#25292E] group-hover:text-[#1B3B82] transition-colors">
                  GÓC THỢ QUANH TA
                </span>
              </button>

              <span
                aria-hidden="true"
                className="h-6 w-px bg-[#DFD3C2] shrink-0"
              />

              <span className="w-9 h-9 rounded-full overflow-hidden bg-white ring-1 ring-[#E8DFD1] shadow-2xs shrink-0">
                <img
                  src={FTU_LOGO_SRC}
                  alt="Logo Trường Đại học Ngoại thương"
                  className="w-full h-full object-cover scale-[1.03]"
                />
              </span>
            </div>

            <p className="text-xs sm:text-[13px] leading-relaxed text-[#615D57] max-w-sm">
              Nền tảng cộng đồng phi lợi nhuận giúp sinh viên và người dân
              TP.HCM tìm nhanh cô chú thợ sửa chữa lành nghề gần nhà, lan tỏa
              lối sống xanh bền vững.
            </p>

            <div className="pt-0.5 leading-snug">
              <p className="text-[11px] font-bold tracking-[0.08em] text-[#1B3B82] uppercase">
                Team WHO · Lớp Học phần KDO441
              </p>
              <p className="text-[11px] text-[#615D57] mt-0.5">
                Phân hiệu Trường ĐH Ngoại thương tại TP.HCM
              </p>
            </div>
          </div>

          {/* Cột 2: Khám phá nhanh (5 trang chính) */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#25292E]">
              Khám phá
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-[13px]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#D46534] transition-colors"
                >
                  Trang chủ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="hover:text-[#D46534] transition-colors"
                >
                  Bản đồ thợ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('avatar')}
                  className="hover:text-[#D46534] transition-colors font-semibold text-[#1B3B82]"
                >
                  Góc Thợ Avatar 3D
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('news')}
                  className="hover:text-[#D46534] transition-colors"
                >
                  Bản tin cộng đồng
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('community')}
                  className="hover:text-[#D46534] transition-colors"
                >
                  Cộng đồng &amp; Đóng góp
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#D46534] transition-colors"
                >
                  Về dự án &amp; Team WHO
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 3: Liên hệ & Đồng hành */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#25292E]">
              Đồng hành &amp; Liên hệ
            </h3>
            <div className="space-y-2.5 text-xs sm:text-[13px]">
              <a
                href={`mailto:${PROJECT_CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 text-[#25292E] hover:text-[#D46534] font-medium transition-colors break-all"
              >
                <Mail className="w-3.5 h-3.5 text-[#D46534] shrink-0" />
                <span>{PROJECT_CONTACT_EMAIL}</span>
              </a>

              <p className="text-xs text-[#615D57] leading-relaxed">
                Số 15 Đường D5, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh
                (FTU Cơ sở II).
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                {currentUser ? (
                  canManage ? (
                    <button
                      type="button"
                      onClick={onOpenAdmin}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#1B3B82] hover:text-[#D46534] transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Trang Quản trị</span>
                    </button>
                  ) : (
                    <span className="text-[#615D57]">
                      Đang đăng nhập:{' '}
                      <strong className="text-[#25292E] font-semibold">
                        {currentUser.displayName || currentUser.name}
                      </strong>
                    </span>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="inline-flex items-center gap-1 font-semibold text-[#1B3B82] hover:text-[#D46534] transition-colors"
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
        <div className="mt-10 pt-5 border-t border-dashed border-[#DFD3C2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11.5px] text-[#7A746C]">
          <p>
            © 2026 Góc Thợ Quanh Ta · Dự án cộng đồng bởi Team WHO (KDO441 — FTU
            HCMC).
          </p>
          <p className="text-[#615D57]">
            Phi lợi nhuận · Tôn trọng người thợ · Sống xanh bền vững
          </p>
        </div>
      </div>
    </footer>
  );
}
