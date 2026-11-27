import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  MapPin,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import type { AdminAccount } from '../types/artisan';
import { isSupabaseConfigured } from '../supabaseClient';

export const DEFAULT_SOFT_AUTH_PROMPT =
  'Đăng nhập nhanh trong 5 giây để lưu cô chú thợ, gửi lời khen và tích huy hiệu hồi sinh đồ.';

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
      className="fixed inset-0 z-[80] bg-[#1F2933]/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md my-auto rounded-3xl bg-white border border-[#E8E2D9] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header modal */}
        <div className="px-6 pt-5 pb-4 border-b border-[#F0EAE1] flex items-start justify-between gap-3 bg-[#FAF8F5]/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-[#D96B38] text-white flex items-center justify-center shadow-sm shrink-0">
              <MapPin className="w-5 h-5" strokeWidth={2.3} />
            </span>
            <div className="min-w-0">
              <h2
                id="auth-modal-title"
                className="text-base font-bold text-[#1F2933] leading-snug"
              >
                Góc Thợ Quanh Ta
              </h2>
              <p className="text-xs text-[#52606D] truncate">
                Đăng nhập thành viên hoặc quản trị viên
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng cửa sổ đăng nhập"
            className="w-9 h-9 rounded-xl text-[#52606D] hover:text-[#1F2933] hover:bg-[#EBE5DC]/70 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[82dvh] overflow-y-auto thin-scrollbar">
          {/* Lời nhắc thân thiện khi mở từ tương tác (Soft Auth Wall) */}
          <div className="rounded-2xl bg-[#FFF6EE] border border-[#F2D5C0] px-3.5 py-3 flex items-start gap-2.5 text-xs text-[#7C3A1B] leading-relaxed">
            <Sparkles className="w-4 h-4 text-[#D96B38] shrink-0 mt-0.5" />
            <p className="font-medium">
              {promptMessage || DEFAULT_SOFT_AUTH_PROMPT}
            </p>
          </div>

          {/* 2 Tab: Đăng nhập / Đăng ký */}
          <div
            role="tablist"
            aria-label="Chọn đăng nhập hoặc đăng ký"
            className="grid grid-cols-2 p-1 rounded-2xl bg-[#F4EFE6] border border-[#EBE5DC]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={`min-h-[42px] rounded-xl text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#D96B38] shadow-xs'
                  : 'text-[#52606D] hover:text-[#1F2933]'
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
                  ? 'bg-white text-[#3A6B5C] shadow-xs'
                  : 'text-[#52606D] hover:text-[#1F2933]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Đăng ký</span>
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl bg-[#C84B31]/10 border border-[#C84B31]/30 px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#A3361F] font-medium leading-relaxed"
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
                  className="block text-xs font-bold text-[#1F2933] mb-1.5"
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
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-login-password"
                  className="block text-xs font-bold text-[#1F2933] mb-1.5"
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
                    className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-[#FAF8F5] border border-[#E5DFD5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPwd((v) => !v)}
                    aria-label={showLoginPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#7B8794] hover:text-[#1F2933] flex items-center justify-center"
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
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] disabled:opacity-65 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
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
                <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE5DC] p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-[#52606D]">
                    Chế độ dùng thử cục bộ — điền nhanh tài khoản mẫu:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('minhanh');
                        setLoginPassword('123456');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E5DFD5] hover:border-[#D96B38] text-[11px] font-semibold text-[#1F2933]"
                    >
                      Thành viên (minhanh)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('ctv@goctho.vn');
                        setLoginPassword('ctv2025');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E5DFD5] hover:border-[#3A6B5C] text-[11px] font-semibold text-[#3A6B5C]"
                    >
                      Cộng tác viên
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('admin@goctho.vn');
                        setLoginPassword('goctho2025');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E5DFD5] hover:border-[#D96B38] text-[11px] font-semibold text-[#D96B38]"
                    >
                      Super Admin
                    </button>
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-[#52606D]">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-bold text-[#3A6B5C] hover:underline"
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
                  className="block text-xs font-bold text-[#1F2933] mb-1.5"
                >
                  Tên đăng nhập <span className="text-[#C84B31]">*</span>
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
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#3A6B5C] focus:ring-2 focus:ring-[#3A6B5C]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-reg-display-name"
                  className="block text-xs font-bold text-[#1F2933] mb-1.5"
                >
                  Tên hiển thị <span className="text-[#C84B31]">*</span>
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
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#3A6B5C] focus:ring-2 focus:ring-[#3A6B5C]/15"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="modal-reg-password"
                    className="block text-xs font-bold text-[#1F2933] mb-1.5"
                  >
                    Mật khẩu <span className="text-[#C84B31]">*</span>
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
                      className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-[#FAF8F5] border border-[#E5DFD5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#3A6B5C] focus:ring-2 focus:ring-[#3A6B5C]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPwd((v) => !v)}
                      aria-label={showRegPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#7B8794] hover:text-[#1F2933] flex items-center justify-center"
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
                    className="block text-xs font-bold text-[#1F2933] mb-1.5"
                  >
                    Nhập lại mật khẩu <span className="text-[#C84B31]">*</span>
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
                    className="w-full h-11 px-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#3A6B5C] focus:ring-2 focus:ring-[#3A6B5C]/15"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#3A6B5C] hover:bg-[#2F594C] disabled:opacity-65 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
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

              <p className="text-center text-xs text-[#52606D]">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-[#D96B38] hover:underline"
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
