import { useEffect, useRef, useState } from 'react';
import {
  Award,
  Bookmark,
  ChevronDown,
  Compass,
  History,
  Home,
  Info,
  LogOut,
  Menu,
  Newspaper,
  PlusCircle,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import { GTQT_LOGO_SRC } from '../data/team';
import type { AdminAccount, AppTab } from '../types/artisan';
import {
  canAccessAdminDashboard,
  getRoleDisplayLabel,
  normalizeAccountRole,
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
  onSuggestArtisan?: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

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
  onSuggestArtisan,
  onOpenAdmin,
  onLogout,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const normalizedRole = normalizeAccountRole(currentUser.role);
  const canManage = canAccessAdminDashboard(normalizedRole);
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
        className={`inline-flex items-center gap-2 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] ${
          compact
            ? 'h-9 pl-1.5 pr-2.5 bg-white/95 backdrop-blur-md border-[#E8DFD1] shadow-xs text-xs'
            : 'h-9 pl-1.5 pr-3 bg-white hover:bg-[#F7F2E8] border-[#E8DFD1] hover:border-[#1B3B82]/50 shadow-2xs text-sm'
        }`}
      >
        <span
          className={`rounded-full flex items-center justify-center font-bold text-[#F7F2E8] shrink-0 ${
            compact ? 'w-6 h-6 text-[11px]' : 'w-6.5 h-6.5 text-xs'
          } ${canManage ? 'bg-[#1B3B82]' : 'bg-[#D46534]'}`}
        >
          {initial}
        </span>

        <span
          className={`font-semibold text-[#25292E] truncate ${
            compact ? 'max-w-[88px]' : 'max-w-[136px]'
          }`}
        >
          {displayName}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#615D57] shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#E8DFD1] shadow-[0_12px_32px_rgba(37,41,46,0.12)] py-2 z-[60] overflow-hidden"
        >
          <div className="px-4 py-2.5 border-b border-dashed border-[#DFD3C2] bg-[#F7F2E8] space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#D46534] shrink-0" />
              <p className="text-xs font-bold text-[#25292E] truncate">
                {displayName}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-mono text-[#615D57] truncate">
                @{currentUser.username}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                  normalizedRole === 'Super Admin'
                    ? 'bg-[#FDF0E9] text-[#D46534] border border-[#D46534]/25'
                    : normalizedRole === 'Cộng tác viên'
                      ? 'bg-[#EEF2FA] text-[#1B3B82] border border-[#1B3B82]/20'
                      : 'bg-white border border-[#E8DFD1] text-[#615D57]'
                }`}
              >
                {getRoleDisplayLabel(normalizedRole)}
              </span>
            </div>
          </div>

          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenBadge();
              }}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#25292E] hover:bg-[#F7F2E8] flex items-center justify-between gap-2 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#D46534]" />
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
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#25292E] hover:bg-[#F7F2E8] flex items-center justify-between gap-2 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 text-[#D46534]" />
                <span>Góc thợ đã lưu</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#F7F2E8] border border-[#E8DFD1] text-[#1B3B82] text-[11px] font-mono font-bold tabular-nums">
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
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#25292E] hover:bg-[#F7F2E8] flex items-center justify-between gap-2 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <History className="w-4 h-4 text-[#1B3B82]" />
                <span>Lịch sử đóng góp</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#F7F2E8] border border-[#E8DFD1] text-[#1B3B82] text-[11px] font-mono font-bold tabular-nums">
                {contributionsCount}
              </span>
            </button>

            {onSuggestArtisan && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSuggestArtisan();
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#25292E] hover:bg-[#F7F2E8] flex items-center gap-2.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-[#D46534]" />
                <span>Đề xuất góc thợ mới</span>
              </button>
            )}

            {canManage && (
              <>
                <div className="my-1 border-t border-dashed border-[#DFD3C2]" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-bold text-[#1B3B82] bg-[#EEF2FA] hover:bg-[#1B3B82]/14 flex items-center justify-between gap-2 transition-colors"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Trang Quản trị</span>
                  </span>
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#D46534] text-white text-[10px] font-mono font-bold tabular-nums">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </>
            )}

            <div className="my-1 border-t border-dashed border-[#DFD3C2]" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full min-h-[38px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#B93818] hover:bg-[#B93818]/8 flex items-center gap-2.5 transition-colors"
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
  currentUser: AdminAccount | null;
  pendingCount?: number;
  favoritesCount: number;
  contributionsCount: number;
  badgeEmoji?: string | null;
  onOpenAuth: () => void;
  onOpenBadge: () => void;
  onOpenSaved: () => void;
  onOpenContributions: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

const DESKTOP_NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'explore', label: 'Bản đồ thợ' },
  { id: 'news', label: 'Bản tin' },
  { id: 'community', label: 'Cộng đồng' },
  { id: 'about', label: 'Về dự án' },
];

function isNavItemActive(navId: AppTab, activeTab: AppTab): boolean {
  if (navId === activeTab) return true;
  if (navId === 'explore' && activeTab === 'artisan') return true;
  if (navId === 'community' && activeTab === 'suggest') return true;
  return false;
}

/**
 * Header THE NEIGHBORHOOD CRAFT trên Desktop:
 * - Warm Ivory #F7F2E8/90 + đường chỉ đứt nét #DFD3C2
 * - Trái: Logo tròn GTQT + GÓC THỢ QUANH TA
 * - Giữa: 5 liên kết (Trang chủ · Bản đồ thợ · Bản tin · Cộng đồng · Về dự án) với gạch chân đỏ sợi chỉ #B93818
 * - Phải: Đăng nhập hoặc AccountMenuDropdown
 */
export function DesktopNavbar({
  activeTab,
  onChangeTab,
  currentUser,
  pendingCount = 0,
  favoritesCount,
  contributionsCount,
  badgeEmoji,
  onOpenAuth,
  onOpenBadge,
  onOpenSaved,
  onOpenContributions,
  onOpenAdmin,
  onLogout,
}: NavbarProps) {
  return (
    <header className="hidden lg:flex items-center justify-between gap-6 h-16 px-8 bg-[#F7F2E8]/92 backdrop-blur-md border-b border-dashed border-[#DFD3C2] sticky top-0 z-40 shrink-0">
      {/* Trái: Logo chính thức */}
      <button
        type="button"
        onClick={() => onChangeTab('home')}
        className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] rounded-xl px-1 py-1"
      >
        <span className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden shrink-0 ring-1 ring-[#D46534]/35 bg-[#F7F2E8] shadow-2xs transition-transform duration-200 group-hover:scale-105">
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

      {/* Giữa: 5 liên kết tinh gọn với gạch chân đỏ sợi chỉ #B93818 */}
      <nav aria-label="Điều hướng chính" className="flex items-center gap-7">
        {DESKTOP_NAV_ITEMS.map(({ id, label }) => {
          const isActive = isNavItemActive(id, activeTab);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeTab(id)}
              className={`relative py-2 text-sm whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] rounded ${
                isActive
                  ? 'text-[#1B3B82] font-bold'
                  : 'text-[#615D57] hover:text-[#25292E] font-medium'
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute left-0 right-0 -bottom-[19px] h-[2.5px] rounded-full bg-[#B93818]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Phải: Nút Đăng nhập hoặc Menu tài khoản */}
      <div className="flex items-center justify-end min-w-[148px] shrink-0">
        {currentUser ? (
          <AccountMenuDropdown
            currentUser={currentUser}
            badgeEmoji={badgeEmoji}
            favoritesCount={favoritesCount}
            contributionsCount={contributionsCount}
            pendingCount={pendingCount}
            onOpenBadge={onOpenBadge}
            onOpenSaved={onOpenSaved}
            onOpenContributions={onOpenContributions}
            onSuggestArtisan={() => onChangeTab('suggest')}
            onOpenAdmin={onOpenAdmin}
            onLogout={onLogout}
          />
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="h-9 px-4 rounded-full bg-white hover:bg-[#1B3B82] text-[#25292E] hover:text-[#F7F2E8] border border-[#25292E]/20 hover:border-[#1B3B82] shadow-2xs text-sm font-semibold whitespace-nowrap shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B3B82]"
          >
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}

/**
 * Header tối giản trên Mobile kèm Menu Drawer trượt ngang tiện lợi
 */
export function MobileTopHeader({
  activeTab,
  onChangeTab,
  currentUser,
  pendingCount = 0,
  favoritesCount,
  contributionsCount,
  badgeEmoji,
  onGoHome,
  onSuggestArtisan,
  onOpenAuth,
  onOpenBadge,
  onOpenSaved,
  onOpenContributions,
  onOpenAdmin,
  onLogout,
}: NavbarProps & {
  onGoHome: () => void;
  onSuggestArtisan: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [drawerOpen]);

  return (
    <>
      <header className="lg:hidden flex items-center justify-between gap-2 h-14 px-4 bg-[#F7F2E8]/95 backdrop-blur-md border-b border-dashed border-[#DFD3C2] sticky top-0 z-40 shrink-0">
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] rounded-lg py-1"
        >
          <span className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-[#D46534]/35 bg-[#F7F2E8] shadow-2xs">
            <img
              src={GTQT_LOGO_SRC}
              alt="Logo Góc Thợ Quanh Ta"
              className="w-full h-full object-cover scale-[1.07]"
            />
          </span>
          <span className="font-display text-sm font-extrabold tracking-tight text-[#25292E] truncate">
            GÓC THỢ QUANH TA
          </span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {currentUser ? (
            <AccountMenuDropdown
              compact
              currentUser={currentUser}
              badgeEmoji={badgeEmoji}
              favoritesCount={favoritesCount}
              contributionsCount={contributionsCount}
              pendingCount={pendingCount}
              onOpenBadge={onOpenBadge}
              onOpenSaved={onOpenSaved}
              onOpenContributions={onOpenContributions}
              onSuggestArtisan={onSuggestArtisan}
              onOpenAdmin={onOpenAdmin}
              onLogout={onLogout}
            />
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="h-9 px-3.5 rounded-full bg-white hover:bg-[#1B3B82] text-[#25292E] hover:text-[#F7F2E8] border border-[#E8DFD1] text-xs font-semibold whitespace-nowrap transition-all"
            >
              Đăng nhập
            </button>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở menu điều hướng"
            className="w-9 h-9 rounded-xl bg-white border border-[#E8DFD1] text-[#25292E] hover:text-[#1B3B82] flex items-center justify-center transition-colors shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[70] bg-[#25292E]/45 backdrop-blur-xs flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
        >
          <div className="w-72 max-w-[84vw] h-full bg-[#F7F2E8] border-l border-[#E8DFD1] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-dashed border-[#DFD3C2]">
              <span className="font-display text-sm font-extrabold text-[#25292E]">
                Khám phá
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Đóng menu"
                className="w-9 h-9 rounded-xl text-[#615D57] hover:bg-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
              {DESKTOP_NAV_ITEMS.map(({ id, label }) => {
                const active = isNavItemActive(id, activeTab);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onChangeTab(id);
                    }}
                    className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                      active
                        ? 'bg-[#1B3B82] text-[#F7F2E8]'
                        : 'text-[#25292E] hover:bg-white'
                    }`}
                  >
                    <span>{label}</span>
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D46534]" />
                    )}
                  </button>
                );
              })}

              <div className="my-3 border-t border-dashed border-[#DFD3C2]" />

              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onSuggestArtisan();
                }}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D46534] hover:bg-[#BC5326] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Đề xuất góc thợ mới</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileBottomNav({
  activeTab,
  onChangeTab,
}: Pick<NavbarProps, 'activeTab' | 'onChangeTab'>) {
  const tabs: { id: AppTab; label: string; Icon: typeof Compass }[] = [
    { id: 'home', label: 'Trang chủ', Icon: Home },
    { id: 'explore', label: 'Bản đồ', Icon: Compass },
    { id: 'news', label: 'Bản tin', Icon: Newspaper },
    { id: 'community', label: 'Cộng đồng', Icon: Users },
    { id: 'about', label: 'Về dự án', Icon: Info },
  ];

  return (
    <nav
      aria-label="Điều hướng di động"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F7F2E8]/96 backdrop-blur-md border-t border-dashed border-[#DFD3C2] shadow-[0_-4px_16px_rgba(37,41,46,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5 h-16">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = isNavItemActive(id, activeTab);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeTab(id)}
              className={`relative min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B3B82] ${
                isActive ? 'text-[#1B3B82]' : 'text-[#615D57]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-3 right-3 h-[2px] rounded-full bg-[#B93818]" />
              )}
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.8} />
              <span
                className={`text-[10.5px] leading-none whitespace-nowrap ${
                  isActive ? 'font-bold' : 'font-medium'
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
