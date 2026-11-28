import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { GTQT_LOGO_SRC } from '../data/team';
import type { AdminAccount } from '../types/artisan';
import { isSupabaseConfigured } from '../supabaseClient';

export const DEFAULT_SOFT_AUTH_PROMPT =
  'Đăng nhập nhanh để lưu thợ, gửi lời khen và tích huy hiệu.';

interface AuthModalProps {
  isOpen: boolean;
  defaultMode?: 'login' | 'register';
  promptMessage?: string;
  onClose: () => void;
  onLogin: (
    identifier: string,
    password: string
  ) => Promise<{ account: AdminAccount | null; error?: string }>;
  onRegister: (payload: {
    username: string;
    displayName: string;
    password: string;
  }) => Promise<{ account: AdminAccount | null; error?: string }>;
  onAuthSuccess: (account: AdminAccount, mode: 'login' | 'register') => void;
}

const USERNAME_REGEX = /^[a-zA-Z0-9._@-]{3,40}$/;

export function AuthModal({
  isOpen,
  defaultMode = 'login',
  promptMessage,
  onClose,
  onLogin,
  onRegister,
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Form Đăng nhập
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Form Đăng ký
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setMode(defaultMode);
    setErrorMsg('');
  }, [isOpen, defaultMode]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanIdentifier = loginIdentifier.trim();
    if (!cleanIdentifier || !loginPassword) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu nhé.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const result = await onLogin(cleanIdentifier, loginPassword);
      if (result.error) {
        setErrorMsg(result.error);
        return;
      }
      if (!result.account) {
        setErrorMsg(
          'Tên đăng nhập hoặc mật khẩu chưa đúng (hoặc tài khoản đang tạm khóa).'
        );
        return;
      }
      setLoginPassword('');
      onAuthSuccess(result.account, 'login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanUsername = regUsername.trim().toLowerCase();
    const cleanDisplayName = regDisplayName.trim();

    if (!USERNAME_REGEX.test(cleanUsername)) {
      setErrorMsg(
        'Tên đăng nhập từ 3–40 ký tự, viết liền không dấu (chỉ gồm chữ, số, dấu chấm, gạch dưới).'
      );
      return;
    }
    if (cleanDisplayName.length < 2) {
      setErrorMsg('Vui lòng nhập tên hiển thị (tối thiểu 2 ký tự) nhé.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự để bảo vệ tài khoản.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu nhập lại chưa khớp. Bạn kiểm tra lại nhé.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const result = await onRegister({
        username: cleanUsername,
        displayName: cleanDisplayName,
        password: regPassword,
      });
      if (result.error) {
        setErrorMsg(result.error);
        return;
      }
      if (!result.account) {
        setErrorMsg('Không thể tạo tài khoản lúc này. Vui lòng thử lại.');
        return;
      }
      setRegPassword('');
      setRegConfirmPassword('');
      onAuthSuccess(result.account, 'register');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-[80] bg-[#162442]/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md my-auto rounded-3xl bg-white border-[1.5px] border-[#162442]/20 shadow-[6px_6px_0px_#1B3B82] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header modal với Logo tròn chính thức */}
        <div className="px-6 pt-5 pb-4 border-b border-dashed border-[#D8C3AE] flex items-start justify-between gap-3 bg-[#FDF8F2]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-[#E86F2C]/35 bg-[#FDF8F2] shadow-xs">
              <img
                src={GTQT_LOGO_SRC}
                alt="Logo Góc Thợ Quanh Ta"
                className="w-full h-full object-cover scale-[1.07]"
              />
            </span>
            <div className="min-w-0">
              <h2
                id="auth-modal-title"
                className="font-display text-base font-extrabold text-[#162442] leading-snug"
              >
                Góc Thợ Quanh Ta
              </h2>
              <p className="text-xs text-[#5C564E] truncate">
                Đăng nhập thành viên hoặc quản trị viên
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng cửa sổ đăng nhập"
            className="w-9 h-9 rounded-xl text-[#5C564E] hover:text-[#162442] hover:bg-[#EFE6DA] flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[82dvh] overflow-y-auto thin-scrollbar">
          {/* Lời nhắc thân thiện khi mở từ tương tác (Soft Auth Wall) */}
          <div className="rounded-2xl bg-[#FFF3EB] border border-[#E86F2C]/25 px-3.5 py-3 flex items-start gap-2.5 text-xs text-[#7C3515] leading-relaxed">
            <Sparkles className="w-4 h-4 text-[#E86F2C] shrink-0 mt-0.5" />
            <p className="font-medium">
              {promptMessage || DEFAULT_SOFT_AUTH_PROMPT}
            </p>
          </div>

          {/* 2 Tab: Đăng nhập / Đăng ký */}
          <div
            role="tablist"
            aria-label="Chọn đăng nhập hoặc đăng ký"
            className="grid grid-cols-2 p-1 rounded-2xl bg-[#FDF8F2] border border-[#E6D5C3]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={`min-h-[42px] rounded-xl text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
                mode === 'login'
                  ? 'bg-[#1B3B82] text-[#FDF8F2] shadow-xs'
                  : 'text-[#5C564E] hover:text-[#162442]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => switchMode('register')}
              className={`min-h-[42px] rounded-xl text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
                mode === 'register'
                  ? 'bg-[#E86F2C] text-[#FDF8F2] shadow-xs'
                  : 'text-[#5C564E] hover:text-[#162442]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Đăng ký</span>
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl bg-[#B93818]/10 border border-[#B93818]/30 px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#9C2E13] font-medium leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="modal-login-identifier"
                  className="block text-xs font-bold text-[#162442] mb-1.5"
                >
                  Tên đăng nhập hoặc Email
                </label>
                <input
                  id="modal-login-identifier"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  value={loginIdentifier}
                  onChange={(e) => {
                    setLoginIdentifier(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="VD: minhanh99 hoặc admin@goctho.vn"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FDF8F2] border border-[#E6D5C3] text-sm text-[#162442] placeholder:text-[#8E8579] focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-login-password"
                  className="block text-xs font-bold text-[#162442] mb-1.5"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="modal-login-password"
                    type={showLoginPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-[#FDF8F2] border border-[#E6D5C3] text-sm text-[#162442] placeholder:text-[#8E8579] focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPwd((v) => !v)}
                    aria-label={showLoginPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#8C8378] hover:text-[#162442] flex items-center justify-center"
                  >
                    {showLoginPwd ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] disabled:opacity-65 text-[#FDF8F2] border-[1.5px] border-[#162442] shadow-[3px_3px_0px_#E86F2C] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-sm font-bold inline-flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập &amp; tiếp tục</span>
                  </>
                )}
              </button>

              {!isSupabaseConfigured && (
                <div className="rounded-xl bg-[#FDF8F2] border border-[#E6D5C3] p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-[#5C564E]">
                    Chế độ dùng thử cục bộ — điền nhanh tài khoản mẫu:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('minhanh');
                        setLoginPassword('123456');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E6D5C3] hover:border-[#E86F2C] text-[11px] font-semibold text-[#162442]"
                    >
                      Thành viên (minhanh)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('ctv@goctho.vn');
                        setLoginPassword('ctv2025');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E6D5C3] hover:border-[#1B3B82] text-[11px] font-semibold text-[#1B3B82]"
                    >
                      Cộng tác viên
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('admin@goctho.vn');
                        setLoginPassword('goctho2025');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E6D5C3] hover:border-[#E86F2C] text-[11px] font-semibold text-[#E86F2C]"
                    >
                      Super Admin
                    </button>
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-[#5C564E]">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-bold text-[#E86F2C] hover:underline"
                >
                  Đăng ký nhanh trong 5 giây
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="modal-reg-username"
                  className="block text-xs font-bold text-[#162442] mb-1.5"
                >
                  Tên đăng nhập <span className="text-[#B93818]">*</span>
                </label>
                <input
                  id="modal-reg-username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  value={regUsername}
                  onChange={(e) => {
                    setRegUsername(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="VD: minhanh99 (viết liền, không dấu)"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FDF8F2] border border-[#E6D5C3] text-sm text-[#162442] placeholder:text-[#8E8579] focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-reg-display-name"
                  className="block text-xs font-bold text-[#162442] mb-1.5"
                >
                  Tên hiển thị <span className="text-[#B93818]">*</span>
                </label>
                <input
                  id="modal-reg-display-name"
                  type="text"
                  autoComplete="name"
                  value={regDisplayName}
                  onChange={(e) => {
                    setRegDisplayName(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="VD: Minh Anh, Hoàng Nam..."
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FDF8F2] border border-[#E6D5C3] text-sm text-[#162442] placeholder:text-[#8E8579] focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="modal-reg-password"
                    className="block text-xs font-bold text-[#162442] mb-1.5"
                  >
                    Mật khẩu <span className="text-[#B93818]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="modal-reg-password"
                      type={showRegPwd ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Ít nhất 6 ký tự"
                      className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-[#FDF8F2] border border-[#E6D5C3] text-sm text-[#162442] placeholder:text-[#8E8579] focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPwd((v) => !v)}
                      aria-label={showRegPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#8C8378] hover:text-[#162442] flex items-center justify-center"
                    >
                      {showRegPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="modal-reg-confirm-password"
                    className="block text-xs font-bold text-[#162442] mb-1.5"
                  >
                    Nhập lại mật khẩu <span className="text-[#B93818]">*</span>
                  </label>
                  <input
                    id="modal-reg-confirm-password"
                    type={showRegPwd ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Xác nhận mật khẩu"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#FDF8F2] border border-[#E6D5C3] text-sm text-[#162442] placeholder:text-[#8E8579] focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] disabled:opacity-65 text-[#FDF8F2] border-[1.5px] border-[#162442] shadow-[3px_3px_0px_#162442] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-sm font-bold inline-flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Tạo tài khoản &amp; tiếp tục</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#5C564E]">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-[#1B3B82] hover:underline"
                >
                  Đăng nhập ngay
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
