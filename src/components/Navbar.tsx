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
  Newspaper,
  PlusCircle,
  Search,
  ShieldCheck,
  User,
} from 'lucide-react';
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
        className={`inline-flex items-center gap-2 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A6B5C] ${
          compact
            ? 'h-9 pl-1.5 pr-2.5 bg-white/95 backdrop-blur-md border-stone-200 shadow-xs text-xs'
            : 'h-9 pl-1.5 pr-3 bg-white hover:bg-[#FAF8F5] border-stone-200 text-sm'
        }`}
      >
        <span
          className={`rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
            compact ? 'w-6 h-6 text-[11px]' : 'w-6.5 h-6.5 text-xs'
          } ${canManage ? 'bg-[#3A6B5C]' : 'bg-[#D96B38]'}`}
        >
          {initial}
        </span>

        <span
          className={`font-medium text-[#1F2933] truncate ${
            compact ? 'max-w-[92px]' : 'max-w-[140px]'
          }`}
        >
          {displayName}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#7B8794] shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-stone-200 shadow-xl py-2 z-[60] overflow-hidden"
        >
          {/* Thông tin tài khoản */}
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
                  normalizedRole === 'Super Admin'
                    ? 'bg-[#D96B38]/12 text-[#D96B38]'
                    : normalizedRole === 'Cộng tác viên'
                      ? 'bg-[#3A6B5C]/12 text-[#3A6B5C]'
                      : 'bg-[#EBE5DC] text-[#52606D]'
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
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#1F2933] hover:bg-[#FAF8F5] flex items-center justify-between gap-2 transition-colors"
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
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#1F2933] hover:bg-[#FAF8F5] flex items-center justify-between gap-2 transition-colors"
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
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#1F2933] hover:bg-[#FAF8F5] flex items-center justify-between gap-2 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <History className="w-4 h-4 text-[#3A6B5C]" />
                <span>Lịch sử đóng góp</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#F3EEE6] text-[#52606D] text-[11px] font-bold tabular-nums">
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
                className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#1F2933] hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-[#D96B38]" />
                <span>Gợi ý cô chú thợ mới</span>
              </button>
            )}

            {/* CHỈ hiển thị Trang Quản trị nếu là 'Super Admin' hoặc 'Cộng tác viên' */}
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
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-bold text-[#3A6B5C] bg-[#3A6B5C]/8 hover:bg-[#3A6B5C]/15 flex items-center justify-between gap-2 transition-colors"
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
              className="w-full min-h-[38px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#C84B31] hover:bg-[#C84B31]/8 flex items-center gap-2.5 transition-colors"
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
 * Header tối giản trên Desktop:
 * - Trái: Logo GÓC THỢ QUANH TA (bấm về màn hình mở đầu)
 * - Giữa: Bản đồ · Bản tin · Về dự án
 * - Phải: Nút tròn viền mảnh "Đăng nhập" (hoặc menu tài khoản gọn khi đã đăng nhập)
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
    <header className="hidden lg:flex items-center justify-between gap-6 h-16 px-8 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/75 sticky top-0 z-40 shrink-0">
      {/* Trái: Logo */}
      <button
        type="button"
        onClick={() => onChangeTab('home')}
        className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A6B5C] rounded-lg px-1 py-1"
      >
        <span className="w-8 h-8 rounded-xl bg-[#D96B38] text-white flex items-center justify-center shadow-2xs transition-transform duration-150 group-hover:scale-105">
          <MapPin className="w-4 h-4" strokeWidth={2.3} />
        </span>
        <span className="text-[15px] font-bold tracking-tight text-[#1F2933]">
          GÓC THỢ QUANH TA
        </span>
      </button>

      {/* Giữa: 3 liên kết gọn gàng */}
      <nav aria-label="Điều hướng chính" className="flex items-center gap-8">
        {navItems.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeTab(id)}
              className={`relative py-2 text-sm whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A6B5C] rounded ${
                isActive
                  ? 'text-[#1F2933] font-semibold'
                  : 'text-[#616E7C] hover:text-[#1F2933] font-medium'
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute left-0 right-0 -bottom-[19px] h-[2px] rounded-full bg-[#3A6B5C]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Phải: Nút Đăng nhập tối giản hoặc Avatar/Menu tài khoản */}
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
            className="h-9 px-4 rounded-full bg-white hover:bg-[#1F2933] text-[#1F2933] hover:text-white border border-stone-300 hover:border-[#1F2933] text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3A6B5C]"
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
    <header className="lg:hidden flex items-center justify-between gap-2 h-14 px-4 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/75 sticky top-0 z-40 shrink-0">
      <button
        type="button"
        onClick={onGoHome}
        className="flex items-center gap-2 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A6B5C] rounded-lg py-1"
      >
        <span className="w-7.5 h-7.5 rounded-xl bg-[#D96B38] text-white flex items-center justify-center shadow-2xs shrink-0">
          <MapPin className="w-4 h-4" strokeWidth={2.3} />
        </span>
        <span className="text-sm font-bold tracking-tight text-[#1F2933] truncate">
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
            className="h-9 px-3.5 rounded-full bg-white hover:bg-[#1F2933] text-[#1F2933] hover:text-white border border-stone-300 text-xs font-medium whitespace-nowrap transition-colors"
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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 shadow-[0_-4px_16px_rgba(31,41,51,0.05)]"
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
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3A6B5C] ${
                isActive ? 'text-[#3A6B5C]' : 'text-[#616E7C]'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.8} />
              <span
                className={`text-[10.5px] leading-none whitespace-nowrap ${
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
