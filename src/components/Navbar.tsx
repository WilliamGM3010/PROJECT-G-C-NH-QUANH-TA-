import { Compass, Info, Lock, MapPin, PlusCircle, ShieldCheck } from 'lucide-react';
import type { AdminAccount, AppTab } from '../types/artisan';

interface NavbarProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  currentAdmin?: AdminAccount | null;
  pendingCount?: number;
  badgeEmoji?: string | null;
  onOpenBadge?: () => void;
  onOpenAdmin?: () => void;
}

/**
 * Top Navbar cố định trên Desktop (h-16) có nút "Huy hiệu của tôi" & nút nhỏ "Quản trị" ở góc phải
 * và Bottom Navigation Bar cố định trên Mobile (3 tab, vùng chạm >= 44px).
 */
export function DesktopNavbar({
  activeTab,
  onChangeTab,
  currentAdmin,
  pendingCount = 0,
  badgeEmoji,
  onOpenBadge,
  onOpenAdmin,
}: NavbarProps) {
  return (
    <header className="hidden lg:flex items-center justify-between gap-6 h-16 px-6 bg-white border-b border-[#E8E2D9] sticky top-0 z-40">
      {/* Vùng 1: Brand Wordmark */}
      <button
        type="button"
        onClick={() => onChangeTab('explore')}
        className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96B38] rounded-lg px-1 py-1"
      >
        <span className="w-9 h-9 rounded-xl bg-[#D96B38] text-white flex items-center justify-center shadow-sm transition-transform duration-150 group-hover:scale-105">
          <MapPin className="w-5 h-5" strokeWidth={2.3} />
        </span>
        <span className="text-lg font-bold tracking-tight text-[#1F2933]">
          GÓC THỢ QUANH TA
        </span>
      </button>

      {/* Vùng 2: Nav Links */}
      <nav aria-label="Điều hướng chính" className="flex items-center gap-7">
        <button
          type="button"
          onClick={() => onChangeTab('explore')}
          className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96B38] rounded ${
            activeTab === 'explore'
              ? 'text-[#D96B38] font-semibold'
              : 'text-[#52606D] hover:text-[#1F2933]'
          }`}
        >
          Khám phá
          {activeTab === 'explore' && (
            <span className="absolute left-0 right-0 -bottom-[19px] h-[2.5px] rounded-full bg-[#D96B38]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('about')}
          className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96B38] rounded ${
            activeTab === 'about'
              ? 'text-[#D96B38] font-semibold'
              : 'text-[#52606D] hover:text-[#1F2933]'
          }`}
        >
          Về dự án
          {activeTab === 'about' && (
            <span className="absolute left-0 right-0 -bottom-[19px] h-[2.5px] rounded-full bg-[#D96B38]" />
          )}
        </button>
      </nav>

      {/* Vùng 3: Huy hiệu + Primary CTA + Nút nhỏ Quản trị */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenBadge && (
          <button
            type="button"
            onClick={onOpenBadge}
            title="Xem tiến độ & Thẻ Huy Hiệu Thổ địa Góc Phố"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border border-[#D96B38]/30 bg-[#FFFBF2] text-[#1F2933] hover:border-[#D96B38] hover:text-[#D96B38] transition-colors"
          >
            <span aria-hidden="true">{badgeEmoji || '🏅'}</span>
            <span>Huy hiệu của tôi</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onChangeTab('suggest')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D96B38] ${
            activeTab === 'suggest'
              ? 'bg-[#B85427] text-white shadow-sm'
              : 'bg-[#D96B38] hover:bg-[#C25A2B] text-white shadow-sm'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Gợi ý thợ</span>
        </button>

        {onOpenAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            title={
              currentAdmin
                ? `Mở Khu Quản Trị (${currentAdmin.name})`
                : 'Đăng nhập Khu Quản Trị'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A6B5C] ${
              currentAdmin
                ? 'bg-[#3A6B5C]/10 border-[#3A6B5C]/30 text-[#3A6B5C] hover:bg-[#3A6B5C]/15'
                : 'bg-[#FAF8F5] border-[#E8E2D9] text-[#52606D] hover:text-[#1F2933] hover:border-[#D5CCC0]'
            }`}
          >
            {currentAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>Quản trị</span>
            {currentAdmin && pendingCount > 0 && (
              <span className="ml-0.5 text-[10px] font-bold text-[#D96B38] tabular-nums">
                ({pendingCount})
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}

export function MobileBottomNav({
  activeTab,
  onChangeTab,
}: Pick<NavbarProps, 'activeTab' | 'onChangeTab'>) {
  const tabs: { id: AppTab; label: string; Icon: typeof Compass }[] = [
    { id: 'explore', label: 'Khám phá', Icon: Compass },
    { id: 'suggest', label: 'Gợi ý thợ', Icon: PlusCircle },
    { id: 'about', label: 'Về dự án', Icon: Info },
  ];

  return (
    <nav
      aria-label="Điều hướng di động"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E2D9] shadow-[0_-4px_16px_rgba(31,41,51,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-3 h-16">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeTab(id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D96B38] ${
                isActive ? 'text-[#D96B38]' : 'text-[#52606D]'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.9} />
              <span
                className={`text-[11px] leading-none whitespace-nowrap ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
