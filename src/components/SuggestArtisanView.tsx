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
import { CRAFT_CATEGORIES, DISTRICT_COORDS, DISTRICTS } from '../data/artisans';
import type {
  AdminAccount,
  CraftCategory,
  District,
  ParkingInfo,
  PaymentMethod,
  PendingSuggestion,
} from '../types/artisan';
import { formatVietnamTimestamp } from '../utils/storage';

interface SuggestArtisanViewProps {
  currentUser: AdminAccount | null;
  onRequestAuth: (prompt?: string) => void;
  onSubmitPendingSuggestion: (
    suggestion: PendingSuggestion
  ) => Promise<{ ok: boolean; error?: string }> | { ok: boolean; error?: string } | void;
  onBackToExplore: () => void;
}

export function SuggestArtisanView({
  currentUser,
  onRequestAuth,
  onSubmitPendingSuggestion,
  onBackToExplore,
}: SuggestArtisanViewProps) {
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<CraftCategory[]>(
    ['Sửa giày dép']
  );
  const [district, setDistrict] = useState<District>('Bình Thạnh');
  const [landmark, setLandmark] = useState('');
  const [hours, setHours] = useState('08:00 – 17:30 (T2–T7)');
  const [problemsText, setProblemsText] = useState('');
  const [minPrice, setMinPrice] = useState('Từ 15k');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('Chỉ tiền mặt');
  const [parkingInfo, setParkingInfo] = useState<ParkingInfo>('Dễ đậu xe');
  const [story, setStory] = useState('');
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

    const baseCoords = DISTRICT_COORDS[district];
    const newSuggestion: PendingSuggestion = {
      id: `pending-${Date.now()}`,
      name: formattedName,
      categories: selectedCategories,
      district,
      coordinates: {
        lat: Number((baseCoords.lat + (Math.random() - 0.5) * 0.002).toFixed(5)),
        lng: Number((baseCoords.lng + (Math.random() - 0.5) * 0.002).toFixed(5)),
      },
      addressLandmark: landmark.trim(),
      hours: hours.trim() || 'Linh hoạt trong ngày',
      problems:
        parsedProblems.length > 0
          ? parsedProblems
          : selectedCategories.map((c) => c.toLowerCase()),
      minPriceLabel: minPrice.trim() || 'Từ 15k',
      story:
        story.trim() ||
        `Địa điểm được cộng đồng Góc Thợ Quanh Ta giới thiệu tại ${district}.`,
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
      setStory('');
      setPhotoPreview(undefined);
      setErrorMsg('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#FDF8F2] py-6 px-4 sm:px-6 lg:py-10 pb-24 lg:pb-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2 pb-5 border-b border-dashed border-[#D8C3AE]">
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#E86F2C]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đóng góp từ cộng đồng TP.HCM</span>
          </div>
          <h1
            className="font-display text-2xl sm:text-3xl font-extrabold text-[#162442] tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Gợi ý một góc thợ quen gần bạn
          </h1>
          <p className="text-sm sm:text-base text-[#5C564E] max-w-2xl leading-relaxed">
            Biết một cô chú sửa giày, may vá hay đánh khóa khéo tay trên đường đi học, đi làm? Gửi thông tin để đội ngũ xác minh, xin phép cô chú và đưa lên bản đồ nhé.
          </p>
        </header>

        {!currentUser && (
          <div className="rounded-2xl bg-[#FFF3EB] border border-[#E86F2C]/28 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-[#7C3515]">
            <p className="font-medium leading-relaxed">
              Đăng nhập nhanh trong 5 giây để gửi gợi ý cô chú thợ mới và tích huy hiệu đóng góp cộng đồng.
            </p>
            <button
              type="button"
              onClick={() =>
                onRequestAuth(
                  'Đăng nhập nhanh trong 5 giây để gửi gợi ý cô chú thợ mới và theo dõi trạng thái duyệt nhé.'
                )
              }
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] text-[#FDF8F2] border-[1.5px] border-[#162442] shadow-[2px_2px_0px_#E86F2C] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-xs font-bold whitespace-nowrap shrink-0 transition-all"
            >
              Đăng nhập / Đăng ký
            </button>
          </div>
        )}

        {submittedSuggestion ? (
          <div className="rounded-3xl bg-white border-[1.5px] border-[#1B3B82]/22 shadow-[5px_5px_0px_rgba(27,59,130,0.1)] p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF2FA] text-[#1B3B82] border border-[#1B3B82]/20 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="font-display text-xl font-extrabold text-[#162442]">
                Đã gửi đề xuất thành công!
              </h2>
              <p className="text-sm text-[#5C564E] leading-relaxed">
                Thông tin về{' '}
                <strong className="text-[#162442]">
                  {submittedSuggestion.name}
                </strong>{' '}
                đã được đưa vào danh sách{' '}
                <span className="font-bold text-[#E86F2C]">Chờ duyệt</span>. Đội ngũ cộng tác viên sẽ kiểm tra tọa độ, xin phép cô chú và sớm đưa lên bản đồ!
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onBackToExplore}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] text-[#FDF8F2] border-[1.5px] border-[#162442] shadow-[3px_3px_0px_#E86F2C] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-sm font-bold inline-flex items-center gap-2 transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Quay lại bản đồ</span>
              </button>
              <button
                type="button"
                onClick={() => setSubmittedSuggestion(null)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#E6D5C3] bg-white hover:bg-[#FDF8F2] text-sm font-semibold text-[#162442] transition-colors"
              >
                Gợi ý thêm thợ khác
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white border border-[#E6D5C3] shadow-[4px_4px_0px_rgba(27,59,130,0.06)] p-5 sm:p-7 space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cột trái */}
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="artisan-name"
                    className="block text-sm font-bold text-[#162442] mb-1.5"
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
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E6D5C3] bg-[#FDF8F2] text-sm text-[#162442] placeholder:text-[#8E8579] focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                  />
                </div>

                <div>
                  <span className="block text-sm font-bold text-[#162442] mb-2">
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
                          className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${
                            active
                              ? 'bg-[#1B3B82] text-[#FDF8F2] border-[#162442] shadow-[2px_2px_0px_#E86F2C]'
                              : 'bg-[#FDF8F2] text-[#5C564E] border-[#E6D5C3] hover:border-[#1B3B82]/50 hover:text-[#162442]'
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
                      className="block text-sm font-bold text-[#162442] mb-1.5"
                    >
                      Khu vực
                    </label>
                    <select
                      id="artisan-district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value as District)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E6D5C3] bg-[#FDF8F2] text-sm text-[#162442] focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="artisan-price"
                      className="block text-sm font-bold text-[#162442] mb-1.5"
                    >
                      Mức giá tham khảo
                    </label>
                    <input
                      id="artisan-price"
                      type="text"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="VD: Từ 15k"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E6D5C3] bg-[#FDF8F2] font-mono text-sm text-[#162442] placeholder:text-[#8E8579] focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="artisan-payment"
                      className="block text-sm font-bold text-[#162442] mb-1.5"
                    >
                      Hình thức thanh toán
                    </label>
                    <select
                      id="artisan-payment"
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as PaymentMethod)
                      }
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E6D5C3] bg-[#FDF8F2] text-sm text-[#162442] focus:bg-white focus:outline-none focus:border-[#1B3B82]"
                    >
                      <option value="Chỉ tiền mặt">Chỉ tiền mặt</option>
                      <option value="Có chuyển khoản">Có chuyển khoản</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="artisan-parking"
                      className="block text-sm font-bold text-[#162442] mb-1.5"
                    >
                      Chỗ đậu xe
                    </label>
                    <select
                      id="artisan-parking"
                      value={parkingInfo}
                      onChange={(e) =>
                        setParkingInfo(e.target.value as ParkingInfo)
                      }
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E6D5C3] bg-[#FDF8F2] text-sm text-[#162442] focus:bg-white focus:outline-none focus:border-[#1B3B82]"
                    >
                      <option value="Dễ đậu xe">Dễ đậu xe</option>
                      <option value="Gửi xe gần đó">Gửi xe gần đó</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="artisan-landmark"
                    className="block text-sm font-bold text-[#162442] mb-1.5"
                  >
                    Mô tả góc đường &amp; mốc dễ nhận diện{' '}
                    <span className="text-[#B93818]">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#E86F2C] absolute left-3.5 top-3.5" />
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
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E6D5C3] bg-[#FDF8F2] text-sm text-[#162442] placeholder:text-[#8E8579] resize-none focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                    />
                  </div>
                </div>
              </div>

              {/* Cột phải */}
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="artisan-hours"
                    className="block text-sm font-bold text-[#162442] mb-1.5"
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
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E6D5C3] bg-[#FDF8F2] font-mono text-sm text-[#162442] placeholder:text-[#8E8579] focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="artisan-problems"
                    className="block text-sm font-bold text-[#162442] mb-1.5"
                  >
                    Các lỗi thường sửa (cách nhau bằng dấu phẩy)
                  </label>
                  <input
                    id="artisan-problems"
                    type="text"
                    value={problemsText}
                    onChange={(e) => setProblemsText(e.target.value)}
                    placeholder="VD: bung đế giày, thay dây kéo, lên lai quần"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E6D5C3] bg-[#FDF8F2] text-sm text-[#162442] placeholder:text-[#8E8579] focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="artisan-story"
                    className="block text-sm font-bold text-[#162442] mb-1.5"
                  >
                    Đôi nét về tay nghề cô chú (không bắt buộc)
                  </label>
                  <textarea
                    id="artisan-story"
                    rows={2}
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="VD: Chú làm rất kỹ, đường chỉ chắc chắn và luôn báo giá trước..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D5C3] bg-[#FDF8F2] text-sm text-[#162442] placeholder:text-[#8E8579] resize-none focus:bg-white focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/15"
                  />
                </div>

                <div className="rounded-xl bg-[#FDF8F2] border border-[#E6D5C3] px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#5C564E]">Người đóng góp (lưu lịch sử):</span>
                  <span className="font-semibold text-[#1B3B82] truncate">
                    {currentUser
                      ? `${currentUser.displayName} (@${currentUser.username})`
                      : 'Cần đăng nhập trước khi gửi'}
                  </span>
                </div>

                {/* Ô tải ảnh kèm nhắc nhở xin phép */}
                <div className="space-y-2">
                  <span className="block text-sm font-bold text-[#162442]">
                    Ảnh góc đồ nghề (không bắt buộc)
                  </span>

                  {photoPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-[#E6D5C3] aspect-[16/9] bg-[#FDF8F2]">
                      <img
                        src={photoPreview}
                        alt="Ảnh xem trước góc làm việc"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotoPreview(undefined)}
                        aria-label="Xóa ảnh đã chọn"
                        className="absolute top-2.5 right-2.5 w-9 h-9 rounded-xl bg-[#162442]/80 hover:bg-[#162442] text-[#FDF8F2] flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D8C3AE] bg-[#FDF8F2] hover:border-[#1B3B82] hover:bg-[#EEF2FA]/50 px-4 py-4 cursor-pointer transition-colors">
                      <span className="w-10 h-10 rounded-xl bg-white border border-[#E6D5C3] flex items-center justify-center text-[#E86F2C]">
                        <Camera className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-semibold text-[#162442]">
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

                  <p className="text-xs text-[#1B3B82] flex items-start gap-1.5 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Hãy xin phép cô chú trước khi chụp, hoặc chỉ chụp góc đồ nghề nhé!
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

            <div className="pt-3 border-t border-dashed border-[#DFCBB5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <p className="text-xs text-[#5C564E]">
                Đề xuất sẽ được chuyển về mục{' '}
                <strong className="text-[#1B3B82]">Chờ duyệt</strong> để xác minh tọa độ &amp; sự đồng thuận của cô chú trước khi hiển thị công khai.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] disabled:opacity-60 text-[#FDF8F2] border-[1.5px] border-[#162442] shadow-[3px_3px_0px_#162442] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-sm font-bold inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi đề xuất...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Gửi đề xuất chờ duyệt</span>
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
