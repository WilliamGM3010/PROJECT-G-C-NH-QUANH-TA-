import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Lock, Mail, X } from 'lucide-react';
import type { AdminAccount } from '../types/artisan';

interface AdminLoginModalProps {
  accounts: AdminAccount[];
  onClose: () => void;
  onLoginSuccess: (account: AdminAccount) => void;
}

export function AdminLoginModal({
  accounts,
  onClose,
  onLoginSuccess,
}: AdminLoginModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanedId = identifier.trim().toLowerCase();
    const matched = accounts.find(
      (acc) =>
        acc.active &&
        (acc.email.toLowerCase() === cleanedId ||
          acc.name.toLowerCase() === cleanedId) &&
        acc.password === password
    );

    if (!matched) {
      setErrorMsg(
        'Email/tên đăng nhập hoặc mật khẩu chưa đúng (hoặc tài khoản đang tạm khóa).'
      );
      return;
    }

    onLoginSuccess(matched);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white border border-[#EBE5DC] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBE5DC] bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#D96B38] text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <h2
                id="admin-login-title"
                className="text-sm font-bold text-[#1F2933]"
              >
                Đăng nhập Khu Quản Trị
              </h2>
              <p className="text-[11px] text-[#52606D]">
                Góc Thợ Quanh Ta · Dành cho điều phối & cộng tác viên
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-[#52606D] hover:bg-white hover:text-[#1F2933] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold text-[#1F2933] mb-1.5"
            >
              Email hoặc Tên đăng nhập
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-email"
                type="text"
                required
                autoFocus
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="admin@goctho.vn"
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-[#1F2933] mb-1.5"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Nhập mật khẩu"
                className="w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#7B8794] hover:text-[#1F2933] flex items-center justify-center"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl bg-[#C84B31]/10 border border-[#C84B31]/25 px-3.5 py-2.5 text-xs font-semibold text-[#C84B31]"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-sm font-semibold shadow-sm transition-colors"
          >
            Đăng nhập
          </button>

          {/* Gợi ý nhỏ tài khoản mặc định để test */}
          <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE5DC] p-3 text-[11px] text-[#52606D] space-y-1.5">
            <p className="font-semibold text-[#1F2933]">
              Tài khoản dùng thử nhanh:
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Super Admin:{' '}
                <code className="font-semibold text-[#3A6B5C]">
                  admin@goctho.vn
                </code>{' '}
                / <code className="font-semibold text-[#1F2933]">admin123</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('admin@goctho.vn');
                  setPassword('admin123');
                  setErrorMsg('');
                }}
                className="text-[#D96B38] font-semibold hover:underline"
              >
                Điền nhanh
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 border-t border-[#EBE5DC]/70">
              <span>
                Cộng tác viên:{' '}
                <code className="font-semibold text-[#3A6B5C]">
                  ctv@goctho.vn
                </code>{' '}
                / <code className="font-semibold text-[#1F2933]">ctv123</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('ctv@goctho.vn');
                  setPassword('ctv123');
                  setErrorMsg('');
                }}
                className="text-[#D96B38] font-semibold hover:underline"
              >
                Điền nhanh
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
