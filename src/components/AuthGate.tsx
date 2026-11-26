import { useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Bookmark,
  Eye,
  EyeOff,
  HeartHandshake,
  KeyRound,
  Loader2,
  MapPin,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react';
import { isSupabaseConfigured, supabaseConfigWarning } from '../supabaseClient';
import type { AdminAccount } from '../types/artisan';
import { isValidUsername } from '../utils/storage';

interface AuthGateProps {
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

export function AuthGate({
  onLogin,
  onRegister,
  onAuthSuccess,
}: AuthGateProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form Đăng nhập
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Form Đăng ký
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanId = identifier.trim();
    if (!cleanId || !loginPassword) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập (hoặc email) và mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const result = await onLogin(cleanId, loginPassword);
      if (result.error) {
        setErrorMsg(result.error);
        setIsSubmitting(false);
        return;
      }
      if (!result.account) {
        setErrorMsg(
          'Tên đăng nhập / email hoặc mật khẩu chưa đúng (hoặc tài khoản đang tạm khóa).'
        );
        setIsSubmitting(false);
        return;
      }
      onAuthSuccess(result.account, 'login');
    } catch {
      setErrorMsg(
        'Không thể kết nối để đăng nhập lúc này. Vui lòng kiểm tra mạng và thử lại.'
      );
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanDisplayName = regDisplayName.trim();
    const cleanUsername = regUsername.trim().toLowerCase();

    if (cleanDisplayName.length < 2) {
      setErrorMsg('Tên hiển thị cần tối thiểu 2 ký tự.');
      return;
    }
    if (/\s/.test(regUsername.trim())) {
      setErrorMsg('Tên đăng nhập không được chứa khoảng trắng.');
      return;
    }
    if (!isValidUsername(cleanUsername)) {
      setErrorMsg(
        'Tên đăng nhập từ 3–64 ký tự, chỉ dùng chữ không dấu, số, dấu chấm (.), gạch dưới (_) hoặc gạch ngang (-).'
      );
      return;
    }
    if (regPassword.length < 4) {
      setErrorMsg('Mật khẩu cần tối thiểu 4 ký tự.');
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
      if (result.error || !result.account) {
        setErrorMsg(
          result.error ?? 'Không thể tạo tài khoản lúc này. Vui lòng thử lại.'
        );
        setIsSubmitting(false);
        return;
      }
      onAuthSuccess(result.account, 'register');
    } catch {
      setErrorMsg(
        'Không thể kết nối máy chủ để đăng ký. Vui lòng kiểm tra kết nối mạng và thử lại.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F5] text-[#1F2933] flex flex-col">
      {/* Cảnh báo nhẹ nếu chưa cấu hình biến môi trường Supabase */}
      {supabaseConfigWarning && (
        <div className="bg-[#FFF8E6] border-b border-[#E9A825]/50 px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-[#8A5A00]">
          <AlertTriangle className="w-4 h-4 text-[#C48200] shrink-0" />
          <span>{supabaseConfigWarning}</span>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white border border-[#E8E2D9] shadow-xl overflow-hidden">
          {/* Cột trái: Câu chuyện ấm áp & Giá trị cộng đồng */}
          <div className="lg:col-span-6 bg-[#3A6B5C] text-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between gap-8 relative overflow-hidden">
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/8 pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#D96B38]/25 pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10 space-y-5">
              <div className="inline-flex items-center gap-2.5">
                <span className="w-11 h-11 rounded-2xl bg-[#D96B38] text-white flex items-center justify-center shadow-md">
                  <MapPin className="w-6 h-6" strokeWidth={2.3} />
                </span>
                <div>
                  <p className="text-lg font-extrabold tracking-tight leading-none">
                    GÓC THỢ QUANH TA
                  </p>
                  <p className="text-xs text-white/80 mt-1">
                    Bản đồ nghề thủ công vỉa hè TP.HCM
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F6C8A8]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hỏng đâu tìm đó – Gần nhau hơn mỗi ngày!</span>
                </p>
                <h1
                  className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight"
                  style={{ textWrap: 'balance' }}
                >
                  Kết nối những đôi tay lành nghề nơi góc phố quen
                </h1>
                <p className="text-sm text-white/85 leading-relaxed">
                  Đăng nhập để khám phá bản đồ cô chú sửa giày, may vá, đánh khóa quanh bạn và đồng bộ hành trình sống xanh trên mọi thiết bị.
                </p>
              </div>
            </div>

            <div className="relative z-10 space-y-3.5">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/12 flex items-center justify-center shrink-0">
                  <Bookmark className="w-4 h-4 text-[#F6C8A8]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Lưu góc thợ quen của riêng bạn</p>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Đánh dấu những cô chú sửa đồ ưng ý để mở chỉ đường nhanh bất cứ lúc nào.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/12 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-[#F6C8A8]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Tích lũy Huy hiệu Thổ địa Góc Phố</p>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Ghi nhận số món đồ bạn đã hồi sinh và đồng bộ huy hiệu tự động qua Supabase.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/12 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-4 h-4 text-[#F6C8A8]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Theo dõi lịch sử đóng góp cộng đồng</p>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Xem trạng thái những cô chú bạn đã gợi ý từ lúc Chờ duyệt cho tới khi lên bản đồ.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Form Đăng nhập & Đăng ký */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto space-y-6">
              {/* Chuyển đổi tab Đăng nhập / Đăng ký */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F4EFE8] border border-[#EAE2D6]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className={`min-h-[42px] rounded-xl text-sm font-semibold transition-all ${
                    mode === 'login'
                      ? 'bg-white text-[#D96B38] shadow-xs'
                      : 'text-[#52606D] hover:text-[#1F2933]'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  className={`min-h-[42px] rounded-xl text-sm font-semibold transition-all ${
                    mode === 'register'
                      ? 'bg-white text-[#D96B38] shadow-xs'
                      : 'text-[#52606D] hover:text-[#1F2933]'
                  }`}
                >
                  Đăng ký mới
                </button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-[#1F2933]">
                      Chào mừng bạn quay lại!
                    </h2>
                    <p className="text-xs text-[#52606D]">
                      Đăng nhập bằng tên đăng nhập (hoặc email đối với tài khoản quản trị/cộng tác viên).
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-login-id"
                      className="block text-xs font-semibold text-[#1F2933] mb-1.5"
                    >
                      Tên đăng nhập hoặc Email
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-login-id"
                        type="text"
                        required
                        autoFocus
                        autoComplete="username"
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="VD: minhanh hoặc admin@goctho.vn"
                        className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-login-pwd"
                      className="block text-xs font-semibold text-[#1F2933] mb-1.5"
                    >
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-login-pwd"
                        type={showLoginPwd ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="Nhập mật khẩu của bạn"
                        className="w-full min-h-[46px] pl-10 pr-11 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
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

                  {errorMsg && (
                    <div
                      role="alert"
                      className="rounded-xl bg-[#C84B31]/10 border border-[#C84B31]/25 px-3.5 py-2.5 text-xs font-semibold text-[#C84B31] leading-relaxed"
                    >
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] disabled:opacity-70 text-white text-sm font-semibold shadow-sm inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kiểm tra tài khoản...</span>
                      </>
                    ) : (
                      <>
                        <span>Vào bản đồ Góc Thợ</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-[#52606D] pt-1">
                    Chưa có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMsg('');
                      }}
                      className="font-semibold text-[#D96B38] hover:underline"
                    >
                      Đăng ký nhanh trong 15 giây
                    </button>
                  </p>

                  {!isSupabaseConfigured && (
                    <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE5DC] p-3 text-[11px] text-[#52606D] space-y-1.5">
                      <p className="font-semibold text-[#1F2933]">
                        Tài khoản dùng thử chế độ cục bộ:
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Super Admin: <code className="font-semibold text-[#3A6B5C]">admin@goctho.vn</code> / <code>admin123</code>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIdentifier('admin@goctho.vn');
                            setLoginPassword('admin123');
                            setErrorMsg('');
                          }}
                          className="text-[#D96B38] font-semibold hover:underline"
                        >
                          Điền nhanh
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#EBE5DC]/70">
                        <span>
                          Cộng tác viên: <code className="font-semibold text-[#3A6B5C]">ctv@goctho.vn</code> / <code>ctv123</code>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIdentifier('ctv@goctho.vn');
                            setLoginPassword('ctv123');
                            setErrorMsg('');
                          }}
                          className="text-[#D96B38] font-semibold hover:underline"
                        >
                          Điền nhanh
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#EBE5DC]/70">
                        <span>
                          Người dùng: <code className="font-semibold text-[#3A6B5C]">minhanh</code> / <code>user123</code>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIdentifier('minhanh');
                            setLoginPassword('user123');
                            setErrorMsg('');
                          }}
                          className="text-[#D96B38] font-semibold hover:underline"
                        >
                          Điền nhanh
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-[#1F2933]">
                      Tham gia cộng đồng Góc Thợ
                    </h2>
                    <p className="text-xs text-[#52606D]">
                      Chỉ cần 3 thông tin ngắn gọn — tài khoản được đồng bộ trực tiếp trên Supabase và tự động đăng nhập ngay.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-reg-display"
                      className="block text-xs font-semibold text-[#1F2933] mb-1.5"
                    >
                      Tên hiển thị <span className="text-[#C84B31]">*</span>
                    </label>
                    <input
                      id="auth-reg-display"
                      type="text"
                      required
                      maxLength={48}
                      value={regDisplayName}
                      onChange={(e) => {
                        setRegDisplayName(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="VD: Minh Anh, Quốc Bảo (SV Bách Khoa)..."
                      className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="auth-reg-username"
                      className="block text-xs font-semibold text-[#1F2933] mb-1.5"
                    >
                      Tên đăng nhập (không khoảng trắng){' '}
                      <span className="text-[#C84B31]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-reg-username"
                        type="text"
                        required
                        autoComplete="username"
                        maxLength={48}
                        value={regUsername}
                        onChange={(e) => {
                          setRegUsername(e.target.value.replace(/\s+/g, ''));
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="VD: minhanh_sg"
                        className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
                      />
                    </div>
                    <p className="text-[11px] text-[#7B8794] mt-1">
                      Viết liền không dấu, tối thiểu 3 ký tự (chữ, số, dấu chấm hoặc gạch dưới).
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-reg-pwd"
                      className="block text-xs font-semibold text-[#1F2933] mb-1.5"
                    >
                      Mật khẩu <span className="text-[#C84B31]">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-reg-pwd"
                        type={showRegPwd ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="Tối thiểu 4 ký tự"
                        className="w-full min-h-[46px] pl-10 pr-11 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
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

                  {errorMsg && (
                    <div
                      role="alert"
                      className="rounded-xl bg-[#C84B31]/10 border border-[#C84B31]/25 px-3.5 py-2.5 text-xs font-semibold text-[#C84B31] leading-relaxed"
                    >
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#3A6B5C] hover:bg-[#2F594C] disabled:opacity-70 text-white text-sm font-semibold shadow-sm inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tạo tài khoản...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Đăng ký &amp; Vào bản đồ ngay</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-[#52606D] pt-1">
                    Đã có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg('');
                      }}
                      className="font-semibold text-[#D96B38] hover:underline"
                    >
                      Đăng nhập ngay
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
