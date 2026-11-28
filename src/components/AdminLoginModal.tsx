import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, Lock, Mail, X } from 'lucide-react';
import { isSupabaseConfigured } from '../supabaseClient';
import type { AdminAccount } from '../types/artisan';

interface AdminLoginModalProps {
  onClose: () => void;
  onAuthenticate: (
    identifier: string,
    password: string
  ) => Promise<{ account: AdminAccount | null; error?: string }>;
  onLoginSuccess: (account: AdminAccount) => void;
}

export function AdminLoginModal({
  onClose,
  onAuthenticate,
  onLoginSuccess,
}: AdminLoginModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result = await onAuthenticate(identifier.trim(), password);
      if (result.error) {
        setErrorMsg(result.error);
        setIsSubmitting(false);
        return;
      }

      if (!result.account) {
        setErrorMsg(
          'Email hoặc mật khẩu chưa đúng (hoặc tài khoản đang tạm khóa).'
        );
        setIsSubmitting(false);
        return;
      }

      onLoginSuccess(result.account);
    } catch {
      setErrorMsg(
        'Không thể kiểm tra đăng nhập lúc này. Vui lòng kiểm tra kết nối mạng và thử lại.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162442]/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white border border-[#E6D5C3] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6D5C3] bg-[#FDF8F2]">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#E86F2C] text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <h2
                id="admin-login-title"
                className="text-sm font-bold text-[#162442]"
              >
                Đăng nhập Khu Quản Trị
              </h2>
              <p className="text-[11px] text-[#5C564E]">
                {isSupabaseConfigured
                  ? 'Xác thực qua bảng admin_accounts trên Supabase'
                  : 'Góc Thợ Quanh Ta · Chế độ dùng thử cục bộ'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-[#5C564E] hover:bg-white hover:text-[#162442] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold text-[#162442] mb-1.5"
            >
              Email đăng nhập
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8A8177] absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm text-[#162442] placeholder:text-[#8A8177] focus:bg-white focus:outline-none focus:border-[#E86F2C] focus:ring-2 focus:ring-[#E86F2C]/15"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-[#162442] mb-1.5"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#8A8177] absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                className="w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm text-[#162442] placeholder:text-[#8A8177] focus:bg-white focus:outline-none focus:border-[#E86F2C] focus:ring-2 focus:ring-[#E86F2C]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#8A8177] hover:text-[#162442] flex items-center justify-center"
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
              className="rounded-xl bg-[#B93818]/10 border border-[#B93818]/25 px-3.5 py-2.5 text-xs font-semibold text-[#B93818]"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] disabled:opacity-70 text-white text-sm font-semibold shadow-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>

          {/* Gợi ý tài khoản dùng thử */}
          <div className="rounded-xl bg-[#FDF8F2] border border-[#E6D5C3] p-3 text-[11px] text-[#5C564E] space-y-1.5">
            <p className="font-semibold text-[#162442]">
              Tài khoản dùng thử nhanh:
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Super Admin:{' '}
                <code className="font-semibold text-[#1B3B82]">
                  admin@goctho.vn
                </code>{' '}
                / <code className="font-semibold text-[#162442]">admin123</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('admin@goctho.vn');
                  setPassword('admin123');
                  setErrorMsg('');
                }}
                className="text-[#E86F2C] font-semibold hover:underline"
              >
                Điền nhanh
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 border-t border-[#E6D5C3]/70">
              <span>
                Cộng tác viên:{' '}
                <code className="font-semibold text-[#1B3B82]">
                  ctv@goctho.vn
                </code>{' '}
                / <code className="font-semibold text-[#162442]">ctv123</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('ctv@goctho.vn');
                  setPassword('ctv123');
                  setErrorMsg('');
                }}
                className="text-[#E86F2C] font-semibold hover:underline"
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
