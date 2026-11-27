import { useEffect, useRef, useState } from 'react';
import {
  Award,
  Bookmark,
  ChevronDown,
  Compass,
  History,
  Info,
  LogIn,
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
  onOpenAdmin: () => void;
  onLogout: () => void;
}

/**
 * Nút tài khoản hợp nhất kèm menu xổ xuống:
 * - Hồ sơ & Huy hiệu của tôi
 * - Góc thợ đã lưu
 * - Lịch sử đóng góp
 * - Trang Quản trị (CHỈ hiển thị nếu role là 'Super Admin' hoặc 'Cộng tác viên')
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
            compact ? 'max-w-[96px]' : 'max-w-[150px]'
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
 * Top Navbar cố định trên Desktop (h-16):
 * - Khách chưa đăng nhập thấy ngay nút "Đăng nhập / Đăng ký" rõ ràng ở góc phải.
 * - Thành viên đã đăng nhập thấy AccountMenuDropdown (tên, huy hiệu, Trang Quản trị nếu có quyền, Đăng xuất).
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
    { id: 'home', label: 'Tìm thợ' },
    { id: 'explore', label: 'Bản đồ' },
    { id: 'news', label: 'Bản tin' },
    { id: 'about', label: 'Về dự án' },
  ];

  return (
    <header className="hidden lg:flex items-center justify-between gap-6 h-16 px-6 bg-white border-b border-[#E8E2D9] sticky top-0 z-40 shrink-0">
      {/* Vùng 1: Brand Wordmark */}
      <button
        type="button"
        onClick={() => onChangeTab('home')}
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
        {navItems.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeTab(id)}
              className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96B38] rounded ${
                isActive
                  ? 'text-[#D96B38] font-semibold'
                  : 'text-[#52606D] hover:text-[#1F2933]'
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute left-0 right-0 -bottom-[19px] h-[2.5px] rounded-full bg-[#D96B38]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Vùng 3: Gợi ý thợ + Đăng nhập / Đăng ký hoặc Menu tài khoản */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => onChangeTab('suggest')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D96B38] ${
            activeTab === 'suggest'
              ? 'bg-[#3A6B5C] text-white shadow-sm'
              : 'bg-[#FAF8F5] hover:bg-[#F3ECE2] text-[#1F2933] border border-[#E5DFD5]'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-[#D96B38]" />
          <span>Gợi ý thợ</span>
        </button>

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
            onOpenAdmin={onOpenAdmin}
            onLogout={onLogout}
          />
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-sm font-semibold shadow-sm whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D96B38]"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập / Đăng ký</span>
          </button>
        )}
      </div>
    </header>
  );
}

/**
 * Header gọn cho Mobile trên các trang Tìm thợ, Bản tin, Gợi ý, Về dự án
 * (đảm bảo nút Đăng nhập / Đăng ký hoặc Menu tài khoản luôn hiển thị rõ góc trên bên phải).
 */
export function MobileTopHeader({
  currentUser,
  pendingCount = 0,
  favoritesCount,
  contributionsCount,
  badgeEmoji,
  onGoHome,
  onOpenAuth,
  onOpenBadge,
  onOpenSaved,
  onOpenContributions,
  onOpenAdmin,
  onLogout,
}: Omit<NavbarProps, 'activeTab' | 'onChangeTab'> & { onGoHome: () => void }) {
  return (
    <header className="lg:hidden flex items-center justify-between gap-2 h-14 px-3.5 bg-white/95 backdrop-blur-md border-b border-[#E8E2D9] sticky top-0 z-40 shrink-0">
      <button
        type="button"
        onClick={onGoHome}
        className="flex items-center gap-2 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96B38] rounded-lg py-1"
      >
        <span className="w-8 h-8 rounded-xl bg-[#D96B38] text-white flex items-center justify-center shadow-xs shrink-0">
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
            onOpenAdmin={onOpenAdmin}
            onLogout={onLogout}
          />
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="h-9 px-3 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs whitespace-nowrap transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập / Đăng ký</span>
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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E2D9] shadow-[0_-4px_16px_rgba(31,41,51,0.06)]"
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
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D96B38] ${
                isActive ? 'text-[#D96B38]' : 'text-[#52606D]'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.9} />
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
