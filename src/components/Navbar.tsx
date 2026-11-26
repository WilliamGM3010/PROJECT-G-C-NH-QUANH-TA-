import { useEffect, useRef, useState } from 'react';
import {
  Award,
  Bookmark,
  ChevronDown,
  Compass,
  History,
  Info,
  LogOut,
  MapPin,
  PlusCircle,
  ShieldCheck,
  User,
} from 'lucide-react';
import type { AdminAccount, AppTab } from '../types/artisan';
import {
  canAccessAdminDashboard,
  getRoleDisplayLabel,
} from '../utils/storage';

interface AccountMenuProps {
  currentUser: AdminAccount;
  badgeEmoji?: string | null;
  favoritesCount: number;
  contributionsCount: number;
  pendingCount?: number;
  compact?: boolean;
  onOpenBadge: () => void;
  onOpenSaved: () => void;
  onOpenContributions: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

/**
 * Nút tài khoản hợp nhất kèm menu xổ xuống:
 * - Hồ sơ & Huy hiệu của tôi
 * - Góc thợ đã lưu
 * - Lịch sử đóng góp
 * - Trang Quản trị (CHỈ hiển thị nếu role là super_admin hoặc collaborator)
 * - Đăng xuất
 */
export function AccountMenuDropdown({
  currentUser,
  badgeEmoji,
  favoritesCount,
  contributionsCount,
  pendingCount = 0,
  compact = false,
  onOpenBadge,
  onOpenSaved,
  onOpenContributions,
  onOpenAdmin,
  onLogout,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canManage = canAccessAdminDashboard(currentUser.role);
  const displayName = currentUser.displayName || currentUser.name;
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96B38] ${
          compact
            ? 'h-9 px-2.5 bg-white/95 backdrop-blur-md border-[#E5DFD5] shadow-sm text-xs'
            : 'h-10 px-2.5 pr-3 bg-[#FAF8F5] hover:bg-[#F3ECE2] border-[#E5DFD5] text-sm'
        }`}
      >
        <span
          className={`rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${
            compact ? 'w-6 h-6 text-[11px]' : 'w-7 h-7 text-xs'
          } ${canManage ? 'bg-[#3A6B5C]' : 'bg-[#D96B38]'}`}
        >
          {initial}
        </span>

        <span
          className={`font-semibold text-[#1F2933] truncate ${
            compact ? 'max-w-[100px]' : 'max-w-[160px]'
          }`}
        >
          {displayName}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#52606D] shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#E8E2D9] shadow-xl py-2 z-[60] overflow-hidden"
        >
          {/* Thông tin tài khoản đầu menu */}
          <div className="px-4 py-2.5 border-b border-[#F0EAE1] bg-[#FAF8F5]/70 space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#D96B38] shrink-0" />
              <p className="text-xs font-bold text-[#1F2933] truncate">
                {displayName}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-[#52606D] truncate">
                @{currentUser.username}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                  currentUser.role === 'super_admin'
                    ? 'bg-[#D96B38]/12 text-[#D96B38]'
                    : currentUser.role === 'collaborator'
                      ? 'bg-[#3A6B5C]/12 text-[#3A6B5C]'
                      : 'bg-[#EBE5DC] text-[#52606D]'
                }`}
              >
                {getRoleDisplayLabel(currentUser.role)}
              </span>
            </div>
          </div>

          {/* Các mục cá nhân hóa */}
          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenBadge();
              }}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#1F2933] hover:bg-[#FAF8F5] flex items-center justify-between gap-2 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#D96B38]" />
                <span>Hồ sơ &amp; Huy hiệu của tôi</span>
              </span>
              <span className="text-xs" aria-hidden="true">
                {badgeEmoji || '🏅'}
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenSaved();
              }}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#1F2933] hover:bg-[#FAF8F5] flex items-center justify-between gap-2 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 text-[#D96B38]" />
                <span>Góc thợ đã lưu</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#F3EEE6] text-[#52606D] text-[11px] font-bold tabular-nums">
                {favoritesCount}
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenContributions();
              }}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#1F2933] hover:bg-[#FAF8F5] flex items-center justify-between gap-2 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <History className="w-4 h-4 text-[#3A6B5C]" />
                <span>Lịch sử đóng góp</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#F3EEE6] text-[#52606D] text-[11px] font-bold tabular-nums">
                {contributionsCount}
              </span>
            </button>

            {/* CHỈ hiển thị Trang Quản trị nếu là super_admin hoặc collaborator */}
            {canManage && (
              <>
                <div className="my-1 border-t border-[#F0EAE1]" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl text-left text-xs font-bold text-[#3A6B5C] bg-[#3A6B5C]/8 hover:bg-[#3A6B5C]/15 flex items-center justify-between gap-2 transition-colors"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Trang Quản trị</span>
                  </span>
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#D96B38] text-white text-[10px] font-bold tabular-nums">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </>
            )}

            <div className="my-1 border-t border-[#F0EAE1]" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#C84B31] hover:bg-[#C84B31]/8 flex items-center gap-2.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface NavbarProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  currentUser: AdminAccount;
  pendingCount?: number;
  favoritesCount: number;
  contributionsCount: number;
  badgeEmoji?: string | null;
  onOpenBadge: () => void;
  onOpenSaved: () => void;
  onOpenContributions: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

/**
 * Top Navbar cố định trên Desktop (h-16) gộp chung 1 nút tài khoản ở góc phải
 * và Bottom Navigation Bar cố định trên Mobile (3 tab, vùng chạm >= 44px).
 */
export function DesktopNavbar({
  activeTab,
  onChangeTab,
  currentUser,
  pendingCount = 0,
  favoritesCount,
  contributionsCount,
  badgeEmoji,
  onOpenBadge,
  onOpenSaved,
  onOpenContributions,
  onOpenAdmin,
  onLogout,
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

      {/* Vùng 3: Primary CTA Gợi ý thợ + 1 Nút Tài khoản gộp chung kèm Menu xổ xuống */}
      <div className="flex items-center gap-2.5 shrink-0">
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

        <AccountMenuDropdown
          currentUser={currentUser}
          badgeEmoji={badgeEmoji}
          favoritesCount={favoritesCount}
          contributionsCount={contributionsCount}
          pendingCount={pendingCount}
          onOpenBadge={onOpenBadge}
          onOpenSaved={onOpenSaved}
          onOpenContributions={onOpenContributions}
          onOpenAdmin={onOpenAdmin}
          onLogout={onLogout}
        />
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
