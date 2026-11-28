import { useEffect, useRef, useState } from 'react';
import {
  Award,
  Bookmark,
  ChevronDown,
  Compass,
  History,
  Info,
  LogOut,
  Newspaper,
  PlusCircle,
  Search,
  ShieldCheck,
  User,
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

/**
 * Menu tài khoản gọn cho thành viên đã đăng nhập:
 * - Hồ sơ & Huy hiệu
 * - Góc thợ đã lưu
 * - Lịch sử đóng góp
 * - Gợi ý thợ mới
 * - Trang Quản trị (CHỈ hiển thị với 'Super Admin' hoặc 'Cộng tác viên')
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
        className={`inline-flex items-center gap-2 rounded-full border-[1.5px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] ${
          compact
            ? 'h-9 pl-1.5 pr-2.5 bg-white/95 backdrop-blur-md border-[#162442]/20 shadow-[2px_2px_0px_rgba(27,59,130,0.14)] text-xs'
            : 'h-9 pl-1.5 pr-3 bg-white hover:bg-[#FDF8F2] border-[#162442]/20 hover:border-[#1B3B82] shadow-[2px_2px_0px_rgba(27,59,130,0.12)] text-sm'
        }`}
      >
        <span
          className={`rounded-full flex items-center justify-center font-bold text-[#FDF8F2] shrink-0 ${
            compact ? 'w-6 h-6 text-[11px]' : 'w-6.5 h-6.5 text-xs'
          } ${canManage ? 'bg-[#1B3B82]' : 'bg-[#E86F2C]'}`}
        >
          {initial}
        </span>

        <span
          className={`font-semibold text-[#162442] truncate ${
            compact ? 'max-w-[92px]' : 'max-w-[140px]'
          }`}
        >
          {displayName}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#5C564E] shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border-[1.5px] border-[#162442]/18 shadow-[4px_4px_0px_rgba(27,59,130,0.16)] py-2 z-[60] overflow-hidden"
        >
          {/* Thông tin tài khoản */}
          <div className="px-4 py-2.5 border-b border-dashed border-[#DFCBB5] bg-[#FDF8F2] space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#E86F2C] shrink-0" />
              <p className="text-xs font-bold text-[#162442] truncate">
                {displayName}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-mono text-[#5C564E] truncate">
                @{currentUser.username}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                  normalizedRole === 'Super Admin'
                    ? 'bg-[#FFF3EB] text-[#E86F2C] border border-[#E86F2C]/25'
                    : normalizedRole === 'Cộng tác viên'
                      ? 'bg-[#EEF2FA] text-[#1B3B82] border border-[#1B3B82]/20'
                      : 'bg-[#F3ECE2] text-[#5C564E]'
                }`}
              >
                {getRoleDisplayLabel(normalizedRole)}
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
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#162442] hover:bg-[#FDF8F2] flex items-center justify-between gap-2 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#E86F2C]" />
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
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#162442] hover:bg-[#FDF8F2] flex items-center justify-between gap-2 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 text-[#E86F2C]" />
                <span>Góc thợ đã lưu</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FDF8F2] border border-[#E6D5C3] text-[#1B3B82] text-[11px] font-mono font-bold tabular-nums">
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
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#162442] hover:bg-[#FDF8F2] flex items-center justify-between gap-2 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <History className="w-4 h-4 text-[#1B3B82]" />
                <span>Lịch sử đóng góp</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FDF8F2] border border-[#E6D5C3] text-[#1B3B82] text-[11px] font-mono font-bold tabular-nums">
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
                className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#162442] hover:bg-[#FDF8F2] flex items-center gap-2.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-[#E86F2C]" />
                <span>Gợi ý cô chú thợ mới</span>
              </button>
            )}

            {/* CHỈ hiển thị Trang Quản trị nếu là 'Super Admin' hoặc 'Cộng tác viên' */}
            {canManage && (
              <>
                <div className="my-1 border-t border-dashed border-[#DFCBB5]" />
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
                    <span className="px-2 py-0.5 rounded-full bg-[#E86F2C] text-white text-[10px] font-mono font-bold tabular-nums">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </>
            )}

            <div className="my-1 border-t border-dashed border-[#DFCBB5]" />

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

/**
 * Header Craft Editorial Minimalism trên Desktop:
 * - Trái: Logo tròn GÓC THỢ QUANH TA (bấm về màn hình mở đầu)
 * - Giữa: Bản đồ · Bản tin · Về dự án (gạch chân đỏ sợi chỉ #B93818)
 * - Phải: Nút "Đăng nhập" viền mực sắc nét (hoặc menu tài khoản gọn)
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
  const navItems: { id: AppTab; label: string }[] = [
    { id: 'explore', label: 'Bản đồ' },
    { id: 'news', label: 'Bản tin' },
    { id: 'about', label: 'Về dự án' },
  ];

  return (
    <header className="hidden lg:flex items-center justify-between gap-6 h-16 px-8 bg-[#FDF8F2]/90 backdrop-blur-md border-b border-dashed border-[#D8C3AE] sticky top-0 z-40 shrink-0">
      {/* Trái: Logo chính thức */}
      <button
        type="button"
        onClick={() => onChangeTab('home')}
        className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] rounded-xl px-1 py-1"
      >
        <span className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden shrink-0 ring-1 ring-[#E86F2C]/35 bg-[#FDF8F2] shadow-2xs transition-transform duration-200 group-hover:scale-105">
          <img
            src={GTQT_LOGO_SRC}
            alt="Logo Góc Thợ Quanh Ta"
            className="w-full h-full object-cover scale-[1.07]"
          />
        </span>
        <span className="font-display text-[16px] font-extrabold tracking-tight text-[#162442] group-hover:text-[#1B3B82] transition-colors">
          GÓC THỢ QUANH TA
        </span>
      </button>

      {/* Giữa: 3 liên kết gọn gàng với gạch chân đỏ sợi chỉ */}
      <nav aria-label="Điều hướng chính" className="flex items-center gap-8">
        {navItems.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeTab(id)}
              className={`relative py-2 text-sm whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] rounded ${
                isActive
                  ? 'text-[#1B3B82] font-bold'
                  : 'text-[#5C564E] hover:text-[#162442] font-medium'
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

      {/* Phải: Nút Đăng nhập sắc nét hoặc Menu tài khoản */}
      <div className="flex items-center justify-end min-w-[160px] shrink-0">
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
            className="h-9 px-4 rounded-full bg-white hover:bg-[#1B3B82] text-[#162442] hover:text-[#FDF8F2] border-[1.5px] border-[#162442] shadow-[2px_2px_0px_#E86F2C] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-sm font-semibold whitespace-nowrap shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B3B82]"
          >
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}

/**
 * Header tối giản trên Mobile (khi không ở chế độ Bản đồ toàn màn hình)
 */
export function MobileTopHeader({
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
}: Omit<NavbarProps, 'activeTab' | 'onChangeTab'> & {
  onGoHome: () => void;
  onSuggestArtisan: () => void;
}) {
  return (
    <header className="lg:hidden flex items-center justify-between gap-2 h-14 px-4 bg-[#FDF8F2]/95 backdrop-blur-md border-b border-dashed border-[#D8C3AE] sticky top-0 z-40 shrink-0">
      <button
        type="button"
        onClick={onGoHome}
        className="flex items-center gap-2 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] rounded-lg py-1"
      >
        <span className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-[#E86F2C]/35 bg-[#FDF8F2] shadow-2xs">
          <img
            src={GTQT_LOGO_SRC}
            alt="Logo Góc Thợ Quanh Ta"
            className="w-full h-full object-cover scale-[1.07]"
          />
        </span>
        <span className="font-display text-sm font-extrabold tracking-tight text-[#162442] truncate">
          GÓC THỢ QUANH TA
        </span>
      </button>

      <div className="shrink-0">
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
            className="h-9 px-3.5 rounded-full bg-white hover:bg-[#1B3B82] text-[#162442] hover:text-[#FDF8F2] border-[1.5px] border-[#162442] shadow-[2px_2px_0px_#E86F2C] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-xs font-semibold whitespace-nowrap transition-all"
          >
            Đăng nhập
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
    { id: 'home', label: 'Tìm thợ', Icon: Search },
    { id: 'explore', label: 'Bản đồ', Icon: Compass },
    { id: 'news', label: 'Bản tin', Icon: Newspaper },
    { id: 'suggest', label: 'Gợi ý', Icon: PlusCircle },
    { id: 'about', label: 'Về dự án', Icon: Info },
  ];

  return (
    <nav
      aria-label="Điều hướng di động"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDF8F2]/96 backdrop-blur-md border-t border-dashed border-[#D8C3AE] shadow-[0_-4px_16px_rgba(22,36,66,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5 h-16">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeTab(id)}
              className={`relative min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B3B82] ${
                isActive ? 'text-[#1B3B82]' : 'text-[#5C564E]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-3 right-3 h-[2px] rounded-full bg-[#B93818]" />
              )}
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.8} />
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
