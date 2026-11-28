import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  Loader2,
  MapPin,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { CRAFT_CATEGORIES } from '../data/artisans';
import {
  DEFAULT_HCMC_LOCATION,
  getLocationFallbackCoords,
} from '../data/hcmcLocations';
import type {
  AdminAccount,
  CraftCategory,
  District,
  ParkingInfo,
  PaymentMethod,
  PendingSuggestion,
} from '../types/artisan';
import { formatVietnamTimestamp } from '../utils/storage';
import { LocationSelector } from './LocationSelector';

interface SuggestArtisanViewProps {
  currentUser: AdminAccount | null;
  onRequestAuth: (prompt?: string) => void;
  onSubmitPendingSuggestion: (
    suggestion: PendingSuggestion
  ) =>
    | Promise<{ ok: boolean; error?: string }>
    | { ok: boolean; error?: string }
    | void;
  onBackToExplore: () => void;
  mode?: 'community' | 'owner';
  embedded?: boolean;
}

export function SuggestArtisanView({
  currentUser,
  onRequestAuth,
  onSubmitPendingSuggestion,
  onBackToExplore,
  mode = 'community',
  embedded = false,
}: SuggestArtisanViewProps) {
  const isOwnerMode = mode === 'owner';
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<CraftCategory[]>(
    ['Sửa giày dép']
  );
  const [district, setDistrict] = useState<District>(DEFAULT_HCMC_LOCATION);
  const [landmark, setLandmark] = useState('');
  const [hours, setHours] = useState('08:00 – 17:30 (T2–T7)');
  const [problemsText, setProblemsText] = useState('');
  const [minPrice, setMinPrice] = useState('Từ 15k');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('Chỉ tiền mặt');
  const [parkingInfo, setParkingInfo] = useState<ParkingInfo>('Dễ đậu xe');
  const [story, setStory] = useState(
    isOwnerMode
      ? '[Đăng ký trực tiếp từ chính chủ/người thân] '
      : ''
  );
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(
    undefined
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuggestion, setSubmittedSuggestion] =
    useState<PendingSuggestion | null>(null);

  const toggleCategory = (cat: CraftCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    if (errorMsg) setErrorMsg('');
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp hình ảnh (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!currentUser) {
      onRequestAuth(
        'Đăng nhập nhanh trong 5 giây để gửi gợi ý cô chú thợ mới và theo dõi quá trình xác minh nhé.'
      );
      return;
    }

    if (name.trim().length < 2) {
      setErrorMsg('Bạn vui lòng nhập tên hoặc cách gọi thân mật của cô chú nhé.');
      return;
    }
    if (selectedCategories.length === 0) {
      setErrorMsg('Hãy chọn ít nhất 1 dịch vụ sửa chữa mà cô chú nhận làm.');
      return;
    }
    if (landmark.trim().length < 6) {
      setErrorMsg('Hãy mô tả rõ mốc nhận diện góc đường để mọi người dễ tìm.');
      return;
    }

    const parsedProblems = problemsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const cleanName = name.trim();
    const formattedName = cleanName.includes('–')
      ? cleanName
      : `${cleanName} – ${selectedCategories.join(' & ')}`;

    const baseCoords = getLocationFallbackCoords(district);
    const defaultStory = isOwnerMode
      ? `[Đăng ký trực tiếp từ chính chủ/người thân] Góc nghề tại ${district}.`
      : `Địa điểm được cộng đồng Góc Thợ Quanh Ta giới thiệu tại ${district}.`;

    const newSuggestion: PendingSuggestion = {
      id: `pending-${Date.now()}`,
      name: formattedName,
      categories: selectedCategories,
      district,
      coordinates: {
        lat: Number(
          (baseCoords.lat + (Math.random() - 0.5) * 0.002).toFixed(5)
        ),
        lng: Number(
          (baseCoords.lng + (Math.random() - 0.5) * 0.002).toFixed(5)
        ),
      },
      addressLandmark: landmark.trim(),
      hours: hours.trim() || 'Linh hoạt trong ngày',
      problems:
        parsedProblems.length > 0
          ? parsedProblems
          : selectedCategories.map((c) => c.toLowerCase()),
      minPriceLabel: minPrice.trim() || 'Từ 15k',
      story: story.trim() || defaultStory,
      paymentMethod,
      parkingInfo,
      customImageUrl: photoPreview,
      submittedBy: currentUser?.username || currentUser?.id || 'community',
      submittedAt: formatVietnamTimestamp(),
    };

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const result = await onSubmitPendingSuggestion(newSuggestion);
      if (result && result.ok === false) {
        setErrorMsg(
          result.error ??
            'Không thể gửi đề xuất lên máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'
        );
        return;
      }

      setSubmittedSuggestion(newSuggestion);
      setName('');
      setLandmark('');
      setProblemsText('');
      setStory(
        isOwnerMode ? '[Đăng ký trực tiếp từ chính chủ/người thân] ' : ''
      );
      setPhotoPreview(undefined);
      setErrorMsg('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={
        embedded
          ? 'bg-[#F7F2E8] p-4 sm:p-6'
          : 'min-h-full bg-[#F7F2E8] py-8 px-4 sm:px-6 lg:py-12 pb-24 lg:pb-14'
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2 pb-5 border-b border-dashed border-[#DFD3C2]">
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#D46534]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isOwnerMode
                ? 'Đăng ký hoàn toàn miễn phí (0đ) · Tôn trọng quyền riêng tư'
                : 'Đóng góp từ cộng đồng TP.HCM'}
            </span>
          </div>
          <h1
            className="font-display text-2xl sm:text-3xl font-extrabold text-[#25292E] tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            {isOwnerMode
              ? 'Đăng ký góc nghề lên bản đồ'
              : 'Gợi ý một góc thợ quen gần bạn'}
          </h1>
          <p className="text-sm sm:text-base text-[#615D57] max-w-2xl leading-relaxed">
            {isOwnerMode
              ? 'Dành cho cô chú thợ hoặc người thân muốn đưa góc sửa chữa lên bản đồ Góc Thợ Quanh Ta. Cam kết 0đ chi phí và luôn tôn trọng nguyện vọng ẩn chân dung.'
              : 'Biết một cô chú sửa giày, may vá hay đánh khóa khéo tay trên đường đi học, đi làm? Gửi thông tin để đội ngũ xác minh, xin phép cô chú và đưa lên bản đồ nhé.'}
          </p>
        </header>

        {!currentUser && (
          <div className="rounded-2xl bg-[#FDF0E9] border border-[#D46534]/25 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-[#7C3515]">
            <p className="font-medium leading-relaxed">
              Đăng nhập nhanh trong 5 giây để gửi thông tin góc thợ mới và theo
              dõi trạng thái duyệt cộng đồng.
            </p>
            <button
              type="button"
              onClick={() =>
                onRequestAuth(
                  'Đăng nhập nhanh trong 5 giây để gửi gợi ý cô chú thợ mới và theo dõi trạng thái duyệt nhé.'
                )
              }
              className="min-h-[40px] px-4 py-2 rounded-full bg-[#1B3B82] hover:bg-[#142D66] text-[#F7F2E8] text-xs font-bold whitespace-nowrap shrink-0 transition-colors"
            >
              Đăng nhập / Đăng ký
            </button>
          </div>
        )}

        {submittedSuggestion ? (
          <div className="rounded-3xl bg-white border border-[#E8DFD1] p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EDF3EE] text-[#4F6B54] border border-[#4F6B54]/20 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="font-display text-xl font-extrabold text-[#25292E]">
                Đã gửi đề xuất thành công!
              </h2>
              <p className="text-sm text-[#615D57] leading-relaxed">
                Thông tin về{' '}
                <strong className="text-[#25292E]">
                  {submittedSuggestion.name}
                </strong>{' '}
                đã được đưa vào danh sách{' '}
                <span className="font-bold text-[#D46534]">Chờ duyệt</span>. Đội
                ngũ cộng tác viên sẽ kiểm tra tọa độ, xin phép cô chú và sớm đưa
                lên bản đồ!
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onBackToExplore}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1B3B82] hover:bg-[#142D66] text-[#F7F2E8] text-sm font-bold inline-flex items-center gap-2 transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>Quay lại bản đồ</span>
              </button>
              <button
                type="button"
                onClick={() => setSubmittedSuggestion(null)}
                className="min-h-[44px] px-5 py-2.5 rounded-full border border-[#E8DFD1] bg-white hover:bg-[#F7F2E8] text-sm font-semibold text-[#25292E] transition-colors"
              >
                Gửi thêm góc thợ khác
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white border border-[#E8DFD1] p-5 sm:p-7 space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cột trái */}
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="artisan-name"
                    className="block text-sm font-bold text-[#25292E] mb-1.5"
                  >
                    Tên hoặc cách gọi cô chú{' '}
                    <span className="text-[#B93818]">*</span>
                  </label>
                  <input
                    id="artisan-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="VD: Chú Tám – Sửa Giày Dép, Cô Lan May Vá..."
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F7F2E8] text-sm text-[#25292E] placeholder:text-[#8E877E] focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                  />
                </div>

                <div>
                  <span className="block text-sm font-bold text-[#25292E] mb-2">
                    Dịch vụ cô chú nhận sửa{' '}
                    <span className="text-[#B93818]">*</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CRAFT_CATEGORIES.map((category) => {
                      const active = selectedCategories.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          aria-pressed={active}
                          className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${
                            active
                              ? 'bg-[#1B3B82] text-[#F7F2E8] border-[#1B3B82]'
                              : 'bg-[#F7F2E8] text-[#615D57] border-[#E8DFD1] hover:border-[#1B3B82]/50 hover:text-[#25292E]'
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="artisan-district"
                      className="block text-sm font-bold text-[#25292E] mb-1.5"
                    >
                      Phường / Xã / Đặc khu
                    </label>
                    <LocationSelector
                      id="artisan-district"
                      mode="input"
                      variant="form"
                      value={district}
                      onChange={(val) => setDistrict(val)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="artisan-price"
                      className="block text-sm font-bold text-[#25292E] mb-1.5"
                    >
                      Mức giá tham khảo
                    </label>
                    <input
                      id="artisan-price"
                      type="text"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="VD: Từ 15k"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F7F2E8] font-mono text-sm text-[#25292E] placeholder:text-[#8E877E] focus:bg-white focus:outline-none focus:border-[#1B3B82]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="artisan-payment"
                      className="block text-sm font-bold text-[#25292E] mb-1.5"
                    >
                      Hình thức thanh toán
                    </label>
                    <select
                      id="artisan-payment"
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as PaymentMethod)
                      }
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F7F2E8] text-sm text-[#25292E] focus:bg-white focus:outline-none focus:border-[#1B3B82]"
                    >
                      <option value="Chỉ tiền mặt">Chỉ tiền mặt</option>
                      <option value="Có chuyển khoản">Có chuyển khoản</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="artisan-parking"
                      className="block text-sm font-bold text-[#25292E] mb-1.5"
                    >
                      Chỗ đậu xe
                    </label>
                    <select
                      id="artisan-parking"
                      value={parkingInfo}
                      onChange={(e) =>
                        setParkingInfo(e.target.value as ParkingInfo)
                      }
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F7F2E8] text-sm text-[#25292E] focus:bg-white focus:outline-none focus:border-[#1B3B82]"
                    >
                      <option value="Dễ đậu xe">Dễ đậu xe</option>
                      <option value="Gửi xe gần đó">Gửi xe gần đó</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="artisan-landmark"
                    className="block text-sm font-bold text-[#25292E] mb-1.5"
                  >
                    Mô tả góc đường &amp; mốc dễ nhận diện{' '}
                    <span className="text-[#B93818]">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#D46534] absolute left-3.5 top-3.5" />
                    <textarea
                      id="artisan-landmark"
                      rows={3}
                      required
                      value={landmark}
                      onChange={(e) => {
                        setLandmark(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="VD: Vỉa hè trước số 56 Phan Xích Long, ngồi dưới tán cây bàng cạnh tiệm trà sữa..."
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F7F2E8] text-sm text-[#25292E] placeholder:text-[#8E877E] resize-none focus:bg-white focus:outline-none focus:border-[#1B3B82]"
                    />
                  </div>
                </div>
              </div>

              {/* Cột phải */}
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="artisan-hours"
                    className="block text-sm font-bold text-[#25292E] mb-1.5"
                  >
                    Khung giờ hay gặp cô chú
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-[#1B3B82] absolute left-3.5 top-3.5" />
                    <input
                      id="artisan-hours"
                      type="text"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="VD: 08:00 – 17:30 (T2–T7)"
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F7F2E8] font-mono text-sm text-[#25292E] placeholder:text-[#8E877E] focus:bg-white focus:outline-none focus:border-[#1B3B82]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="artisan-problems"
                    className="block text-sm font-bold text-[#25292E] mb-1.5"
                  >
                    Các lỗi thường sửa (cách nhau bằng dấu phẩy)
                  </label>
                  <input
                    id="artisan-problems"
                    type="text"
                    value={problemsText}
                    onChange={(e) => setProblemsText(e.target.value)}
                    placeholder="VD: bung đế giày, thay dây kéo, lên lai quần"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F7F2E8] text-sm text-[#25292E] placeholder:text-[#8E877E] focus:bg-white focus:outline-none focus:border-[#1B3B82]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="artisan-story"
                    className="block text-sm font-bold text-[#25292E] mb-1.5"
                  >
                    Đôi nét về tay nghề cô chú (không bắt buộc)
                  </label>
                  <textarea
                    id="artisan-story"
                    rows={2}
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="VD: Chú làm rất kỹ, đường chỉ chắc chắn và luôn báo giá trước..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F7F2E8] text-sm text-[#25292E] placeholder:text-[#8E877E] resize-none focus:bg-white focus:outline-none focus:border-[#1B3B82]"
                  />
                </div>

                <div className="rounded-xl bg-[#F7F2E8] border border-[#E8DFD1] px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#615D57]">
                    Người đóng góp (lưu lịch sử):
                  </span>
                  <span className="font-semibold text-[#1B3B82] truncate">
                    {currentUser
                      ? `${currentUser.displayName} (@${currentUser.username})`
                      : 'Cần đăng nhập trước khi gửi'}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="block text-sm font-bold text-[#25292E]">
                    Ảnh góc đồ nghề (không bắt buộc)
                  </span>

                  {photoPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-[#E8DFD1] aspect-[16/9] bg-[#F7F2E8]">
                      <img
                        src={photoPreview}
                        alt="Ảnh xem trước góc làm việc"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotoPreview(undefined)}
                        aria-label="Xóa ảnh đã chọn"
                        className="absolute top-2.5 right-2.5 w-9 h-9 rounded-xl bg-[#25292E]/80 hover:bg-[#25292E] text-white flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#DFD3C2] bg-[#F7F2E8] hover:border-[#1B3B82] hover:bg-[#EEF2FA]/50 px-4 py-4 cursor-pointer transition-colors">
                      <span className="w-10 h-10 rounded-xl bg-white border border-[#E8DFD1] flex items-center justify-center text-[#D46534]">
                        <Camera className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-semibold text-[#25292E]">
                        Chọn ảnh từ thiết bị
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="sr-only"
                      />
                    </label>
                  )}

                  <p className="text-xs text-[#4F6B54] flex items-start gap-1.5 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Hãy xin phép cô chú trước khi chụp, hoặc chỉ chụp góc đồ
                      nghề nhé!
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl bg-[#B93818]/10 border border-[#B93818]/25 px-4 py-3 text-xs font-semibold text-[#B93818]"
              >
                {errorMsg}
              </div>
            )}

            <div className="pt-3 border-t border-dashed border-[#DFD3C2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <p className="text-xs text-[#615D57]">
                Đề xuất sẽ được chuyển về mục{' '}
                <strong className="text-[#1B3B82]">Chờ duyệt</strong> để xác
                minh tọa độ &amp; sự đồng thuận của cô chú trước khi hiển thị
                công khai.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[46px] px-6 py-2.5 rounded-full bg-[#D46534] hover:bg-[#BC5326] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi đề xuất...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>
                      {isOwnerMode
                        ? 'Gửi đăng ký góc nghề'
                        : 'Gửi đề xuất chờ duyệt'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
