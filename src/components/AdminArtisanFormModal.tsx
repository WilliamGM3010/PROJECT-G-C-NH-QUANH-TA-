import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckSquare,
  EyeOff,
  Plus,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { CRAFT_CATEGORIES } from '../data/artisans';
import {
  DEFAULT_HCMC_LOCATION,
  getLocationFallbackCoords,
} from '../data/hcmcLocations';
import type {
  Artisan,
  ArtisanStatus,
  CraftCategory,
  District,
  IllustrationVariant,
  ParkingInfo,
  PaymentMethod,
  PendingSuggestion,
  PriceItem,
} from '../types/artisan';
import { findPotentialDuplicates } from '../utils/geo';
import { LocationSelector } from './LocationSelector';
import { formatVietnamDate, toIsoDate } from '../utils/storage';

interface AdminArtisanFormModalProps {
  mode: 'create' | 'edit' | 'approve';
  initialArtisan?: Artisan | null;
  pendingSuggestion?: PendingSuggestion | null;
  existingArtisans?: Artisan[];
  defaultPic?: string;
  onClose: () => void;
  onSave: (artisan: Artisan, approvedPendingId?: string) => void;
}

function mapCategoryToIllustration(
  category: CraftCategory
): IllustrationVariant {
  switch (category) {
    case 'Sửa giày dép':
      return 'cobbler';
    case 'May vá':
      return 'tailor';
    case 'Sửa khóa':
    case 'Sửa đồng hồ':
      return 'locksmith';
    case 'Sửa balo/túi':
      return 'bag_repair';
  }
}

function vnDateToIso(vnDate: string, fallbackIso: string): string {
  const parts = vnDate.trim().split('/').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    const [dd, mo, yyyy] = parts;
    if (yyyy >= 2000 && mo >= 1 && mo <= 12 && dd >= 1 && dd <= 31) {
      return `${yyyy}-${String(mo).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }
  }
  return fallbackIso;
}

export function AdminArtisanFormModal({
  mode,
  initialArtisan,
  pendingSuggestion,
  existingArtisans = [],
  defaultPic = '',
  onClose,
  onSave,
}: AdminArtisanFormModalProps) {
  const defaultDistrict: District =
    initialArtisan?.district ??
    pendingSuggestion?.district ??
    DEFAULT_HCMC_LOCATION;
  const defaultCoords =
    initialArtisan?.coordinates ??
    pendingSuggestion?.coordinates ??
    getLocationFallbackCoords(defaultDistrict);

  const [name, setName] = useState(
    initialArtisan?.name ?? pendingSuggestion?.name ?? ''
  );
  const [categories, setCategories] = useState<CraftCategory[]>(
    initialArtisan?.categories ?? pendingSuggestion?.categories ?? ['Sửa giày dép']
  );
  const [district, setDistrict] = useState<District>(defaultDistrict);
  const [latStr, setLatStr] = useState(String(defaultCoords.lat));
  const [lngStr, setLngStr] = useState(String(defaultCoords.lng));
  const [addressLandmark, setAddressLandmark] = useState(
    initialArtisan?.addressLandmark ?? pendingSuggestion?.addressLandmark ?? ''
  );
  const [hours, setHours] = useState(
    initialArtisan?.hours ?? pendingSuggestion?.hours ?? '08:00 – 17:30 (T2–T7)'
  );
  const [minPriceLabel, setMinPriceLabel] = useState(
    initialArtisan?.minPriceLabel ?? pendingSuggestion?.minPriceLabel ?? 'Từ 15k'
  );
  const [status, setStatus] = useState<ArtisanStatus>(
    initialArtisan?.status ?? 'working'
  );
  const [verifiedDate, setVerifiedDate] = useState(
    initialArtisan?.verifiedDate ?? formatVietnamDate()
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialArtisan?.paymentMethod ??
      pendingSuggestion?.paymentMethod ??
      'Chỉ tiền mặt'
  );
  const [parkingInfo, setParkingInfo] = useState<ParkingInfo>(
    initialArtisan?.parkingInfo ?? pendingSuggestion?.parkingInfo ?? 'Dễ đậu xe'
  );
  const [problemsText, setProblemsText] = useState(
    (initialArtisan?.problems ?? pendingSuggestion?.problems ?? []).join(', ')
  );
  const [story, setStory] = useState(
    initialArtisan?.story ?? pendingSuggestion?.story ?? ''
  );
  const [prices, setPrices] = useState<PriceItem[]>(
    initialArtisan?.prices ?? [
      {
        service:
          pendingSuggestion?.problems[0] ||
          `Sửa ${pendingSuggestion?.categories[0]?.toLowerCase() || 'đồ cơ bản'}`,
        priceRange: pendingSuggestion?.minPriceLabel || '15.000đ – 30.000đ',
      },
      { service: 'Các dịch vụ khác', priceRange: '20.000đ – 50.000đ' },
    ]
  );
  const [customImageUrl, setCustomImageUrl] = useState<string | undefined>(
    initialArtisan?.customImageUrl ?? pendingSuggestion?.customImageUrl
  );
  const [hasConsent, setHasConsent] = useState<boolean>(
    initialArtisan?.hasConsent ?? true
  );
  const [hidePortrait, setHidePortrait] = useState<boolean>(
    initialArtisan?.hidePortrait ?? true
  );
  // Thông tin nội bộ (chỉ hiện trong Khu Quản Trị, tuyệt đối không hiện công khai)
  const [pic, setPic] = useState(
    initialArtisan?.pic ?? (mode !== 'edit' ? defaultPic : '')
  );
  const [internalNotes, setInternalNotes] = useState(
    initialArtisan?.internalNotes ?? ''
  );
  const [errorMsg, setErrorMsg] = useState('');

  // Cảnh báo trùng lặp thời gian thực theo tọa độ / tên khi duyệt đề xuất hoặc tạo mới
  const liveDuplicates = useMemo(() => {
    if (mode === 'edit' || existingArtisans.length === 0) return [];
    const lat = Number.parseFloat(latStr);
    const lng = Number.parseFloat(lngStr);
    return findPotentialDuplicates(
      {
        name,
        categories,
        district,
        coordinates:
          Number.isFinite(lat) && Number.isFinite(lng)
            ? { lat, lng }
            : undefined,
      },
      existingArtisans
    );
  }, [mode, existingArtisans, name, categories, district, latStr, lngStr]);

  const toggleCategory = (cat: CraftCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleDistrictChange = (nextDistrict: District) => {
    setDistrict(nextDistrict);
    if (mode === 'create') {
      const preset = getLocationFallbackCoords(nextDistrict);
      setLatStr(String(preset.lat));
      setLngStr(String(preset.lng));
    }
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePriceChange = (
    idx: number,
    field: 'service' | 'priceRange',
    val: string
  ) => {
    setPrices((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const lat = Number.parseFloat(latStr);
    const lng = Number.parseFloat(lngStr);

    if (name.trim().length < 2) {
      setErrorMsg('Vui lòng nhập tên hoặc cách gọi cô chú.');
      return;
    }
    if (categories.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 dịch vụ.');
      return;
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setErrorMsg('Tọa độ Lat / Lng chưa hợp lệ (VD: 10.7852 và 106.7012).');
      return;
    }
    if (addressLandmark.trim().length < 4) {
      setErrorMsg('Vui lòng nhập mốc nhận diện góc phố.');
      return;
    }

    const cleanName = name.trim();
    const firstPart = cleanName.split('–')[0]?.trim() || cleanName;
    const primaryCat = categories[0];
    const cleanPrices = prices
      .map((p) => ({
        service: p.service.trim(),
        priceRange: p.priceRange.trim(),
      }))
      .filter((p) => p.service.length > 0 && p.priceRange.length > 0);

    const parsedProblems = problemsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const finalVerifiedVn = verifiedDate.trim() || formatVietnamDate();
    const finalVerifiedIso = vnDateToIso(
      finalVerifiedVn,
      initialArtisan?.lastVerifiedDate ?? toIsoDate()
    );

    const savedArtisan: Artisan = {
      id: initialArtisan?.id ?? `tho-${Date.now()}`,
      name: cleanName,
      shortTitle: `${firstPart} · ${primaryCat}`,
      categories,
      district,
      coordinates: { lat, lng },
      addressLandmark: addressLandmark.trim(),
      problems:
        parsedProblems.length > 0
          ? parsedProblems
          : categories.map((c) => c.toLowerCase()),
      hours: hours.trim() || '08:00 – 17:30',
      minPriceLabel: minPriceLabel.trim() || 'Từ 15k',
      prices:
        cleanPrices.length > 0
          ? cleanPrices
          : [
              {
                service: primaryCat,
                priceRange: minPriceLabel.trim() || '20.000đ',
              },
            ],
      story:
        story.trim() ||
        `Góc sửa chữa quen thuộc tại ${district}, làm việc tỉ mỉ và báo giá rõ ràng.`,
      status,
      verifiedDate: finalVerifiedVn,
      lastVerifiedDate: finalVerifiedIso,
      paymentMethod,
      parkingInfo,
      hasConsent,
      hidePortrait,
      isHidden: initialArtisan?.isHidden ?? false,
      isCommunitySuggested: false,
      illustrationVariant:
        initialArtisan?.illustrationVariant ??
        mapCategoryToIllustration(primaryCat),
      customImageUrl,
      kudos: initialArtisan?.kudos ?? {
        sturdy: 2,
        studentPrice: 1,
        fast: 1,
        friendly: 2,
      },
      praises: initialArtisan?.praises ?? [],
      revivedCount: initialArtisan?.revivedCount ?? 0,
      submittedBy: initialArtisan?.submittedBy ?? pendingSuggestion?.submittedBy,
      submittedAt: initialArtisan?.submittedAt ?? pendingSuggestion?.submittedAt,
      pic: pic.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,
    };

    onSave(savedArtisan, pendingSuggestion?.id);
  };

  const titleMap = {
    create: 'Thêm cô chú thợ mới',
    edit: 'Chỉnh sửa thông tin cô chú thợ',
    approve: 'Chỉnh sửa & Duyệt đề xuất lên bản đồ',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="artisan-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#162442]/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92dvh] flex flex-col rounded-2xl bg-white border border-[#E6D5C3] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6D5C3] bg-[#FDF8F2] shrink-0">
          <div>
            <h2
              id="artisan-form-title"
              className="text-base font-bold text-[#162442]"
            >
              {titleMap[mode]}
            </h2>
            {pendingSuggestion && (
              <p className="text-xs text-[#5C564E]">
                Đề xuất bởi {pendingSuggestion.submittedBy} lúc{' '}
                {pendingSuggestion.submittedAt}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-[#5C564E] hover:bg-white hover:text-[#162442] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto thin-scrollbar p-5 space-y-5"
        >
          {/* Khung cảnh báo trùng lặp trong Modal duyệt / thêm mới */}
          {liveDuplicates.length > 0 && (
            <div className="rounded-2xl bg-[#E9A825]/15 border border-[#E9A825]/60 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8A5A00]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#C48200]" />
                <span>
                  ⚠️ Nghi ngờ trùng lặp: Gần {liveDuplicates[0].artisan.name}
                  {typeof liveDuplicates[0].distanceMeters === 'number'
                    ? ` (cách ${liveDuplicates[0].distanceMeters}m)`
                    : ' (trùng tên tương tự)'}
                </span>
              </div>
              <p className="text-[11px] text-[#7A5208] leading-relaxed">
                Hồ sơ hiện có tại: {liveDuplicates[0].artisan.addressLandmark}. Vui lòng đối chiếu kỹ tọa độ để tránh tạo điểm trùng trên bản đồ.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#162442] mb-1">
                Tên &amp; Nghề hiển thị <span className="text-[#B93818]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Chú Ba – Sửa Giày Dép & Balo"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
              />
            </div>

            <div className="md:col-span-2">
              <span className="block text-xs font-semibold text-[#162442] mb-1.5">
                Danh mục dịch vụ <span className="text-[#B93818]">*</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {CRAFT_CATEGORIES.map((cat) => {
                  const active = categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-[#E86F2C] text-white'
                          : 'bg-[#FDF8F2] border border-[#DFCBB5] text-[#5C564E]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#162442] mb-1">
                Phường / Xã / Đặc khu
              </label>
              <LocationSelector
                mode="input"
                variant="form"
                value={district}
                onChange={(val) => handleDistrictChange(val)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#162442] mb-1">
                Trạng thái hoạt động
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ArtisanStatus)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
              >
                <option value="working">Đang làm việc</option>
                <option value="off_today">Hôm nay nghỉ</option>
                <option value="relocated">Đã chuyển chỗ / Sai thông tin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#162442] mb-1">
                Vĩ độ (Lat) <span className="text-[#B93818]">*</span>
              </label>
              <input
                type="text"
                required
                value={latStr}
                onChange={(e) => setLatStr(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm tabular-nums focus:bg-white focus:outline-none focus:border-[#E86F2C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#162442] mb-1">
                Kinh độ (Lng) <span className="text-[#B93818]">*</span>
              </label>
              <input
                type="text"
                required
                value={lngStr}
                onChange={(e) => setLngStr(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm tabular-nums focus:bg-white focus:outline-none focus:border-[#E86F2C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#162442] mb-1">
                Hình thức thanh toán
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
              >
                <option value="Chỉ tiền mặt">Chỉ tiền mặt</option>
                <option value="Có chuyển khoản">Có chuyển khoản</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#162442] mb-1">
                Chỗ đậu xe
              </label>
              <select
                value={parkingInfo}
                onChange={(e) => setParkingInfo(e.target.value as ParkingInfo)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
              >
                <option value="Dễ đậu xe">Dễ đậu xe</option>
                <option value="Gửi xe gần đó">Gửi xe gần đó</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#162442] mb-1">
                Mốc nhận diện góc phố <span className="text-[#B93818]">*</span>
              </label>
              <input
                type="text"
                required
                value={addressLandmark}
                onChange={(e) => setAddressLandmark(e.target.value)}
                placeholder="VD: Vỉa hè trước số 124 Nguyễn Gia Trí, cạnh tiệm tạp hóa"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#162442] mb-1">
                Khung giờ hoạt động
              </label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#162442] mb-1">
                  Nhãn giá từ
                </label>
                <input
                  type="text"
                  value={minPriceLabel}
                  onChange={(e) => setMinPriceLabel(e.target.value)}
                  placeholder="Từ 15k"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#162442] mb-1">
                  Ngày xác minh (dd/mm/yyyy)
                </label>
                <input
                  type="text"
                  value={verifiedDate}
                  onChange={(e) => setVerifiedDate(e.target.value)}
                  placeholder="25/11/2026"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm tabular-nums focus:bg-white focus:outline-none focus:border-[#E86F2C]"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#162442] mb-1">
                Danh sách vấn đề nhận sửa (cách nhau bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={problemsText}
                onChange={(e) => setProblemsText(e.target.value)}
                placeholder="bung đế giày, khâu viền sneaker, thay dây kéo balo"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm focus:bg-white focus:outline-none focus:border-[#E86F2C]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#162442] mb-1">
                Giới thiệu góc nghề &amp; tay nghề
              </label>
              <textarea
                rows={2}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-sm resize-none focus:bg-white focus:outline-none focus:border-[#E86F2C]"
              />
            </div>
          </div>

          {/* Ghi chú nội bộ & Người phụ trách (CHỈ HIỆN TRONG KHU QUẢN TRỊ) */}
          <div className="rounded-2xl bg-[#FDF8F2] border border-[#DFD6C8] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#162442] inline-flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#E86F2C]" />
                <span>Thông tin nội bộ vận hành (PIC &amp; Ghi chú)</span>
              </span>
              <span className="text-[11px] font-semibold text-[#5C564E] inline-flex items-center gap-1 bg-white border border-[#DFCBB5] px-2 py-0.5 rounded-full">
                <EyeOff className="w-3 h-3" />
                Chỉ hiện trong Admin
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#162442] mb-1">
                  Người phụ trách thực địa (PIC)
                </label>
                <input
                  type="text"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  placeholder="VD: William Gia Minh, Quang Huy..."
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-white text-sm focus:outline-none focus:border-[#E86F2C]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#162442] mb-1">
                  Ghi chú nội bộ (không hiển thị ra trang công khai)
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="VD: Chú không dùng smartphone, liên hệ qua con gái; Đã tặng bảng QR ép nhựa..."
                  className="w-full px-3 py-2 rounded-xl border border-[#DFCBB5] bg-white text-sm resize-none focus:outline-none focus:border-[#E86F2C]"
                />
              </div>
            </div>
          </div>

          {/* Bảng giá tham khảo */}
          <div className="space-y-2 pt-3 border-t border-[#E6D5C3]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#162442]">
                Bảng giá tham khảo
              </span>
              <button
                type="button"
                onClick={() =>
                  setPrices((prev) => [...prev, { service: '', priceRange: '' }])
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B3B82] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm dòng giá</span>
              </button>
            </div>
            <div className="space-y-2">
              {prices.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.service}
                    onChange={(e) =>
                      handlePriceChange(idx, 'service', e.target.value)
                    }
                    placeholder="Tên dịch vụ (VD: Dán keo đế giày)"
                    className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-xs focus:bg-white focus:outline-none focus:border-[#E86F2C]"
                  />
                  <input
                    type="text"
                    value={row.priceRange}
                    onChange={(e) =>
                      handlePriceChange(idx, 'priceRange', e.target.value)
                    }
                    placeholder="20.000đ"
                    className="w-36 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#DFCBB5] bg-[#FDF8F2] text-xs tabular-nums focus:bg-white focus:outline-none focus:border-[#E86F2C]"
                  />
                  {prices.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPrices((prev) => prev.filter((_, i) => i !== idx))
                      }
                      aria-label="Xóa dòng giá"
                      className="w-9 h-9 rounded-xl text-[#B93818] hover:bg-[#B93818]/10 flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ảnh góc nghề */}
          <div className="space-y-2 pt-3 border-t border-[#E6D5C3]">
            <span className="block text-xs font-bold text-[#162442]">
              Ảnh góc làm việc / đồ nghề (tùy chọn)
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {customImageUrl && (
                <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-[#DFCBB5]">
                  <img
                    src={customImageUrl}
                    alt="Xem trước ảnh góc nghề"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomImageUrl(undefined)}
                    aria-label="Xóa ảnh"
                    className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-[#162442]/80 text-white flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <label className="min-h-[40px] px-3.5 py-2 rounded-xl border border-dashed border-[#D5CCC0] bg-[#FDF8F2] hover:border-[#E86F2C] text-xs font-semibold text-[#162442] inline-flex items-center gap-2 cursor-pointer">
                <Camera className="w-4 h-4 text-[#E86F2C]" />
                <span>{customImageUrl ? 'Đổi ảnh khác' : 'Tải ảnh lên'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* 2 Checkbox cam kết đồng thuận & ẩn chân dung */}
          <div className="rounded-2xl bg-[#1B3B82]/8 border border-[#1B3B82]/20 p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B3B82]">
              <CheckSquare className="w-4 h-4" />
              <span>Xác nhận tôn trọng quyền riêng tư của cô chú</span>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-[#162442] cursor-pointer">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[#1B3B82]"
              />
              <span className="font-medium">
                ✓ Đã xin phép &amp; có sự đồng thuận của cô chú trước khi đưa thông tin lên bản đồ
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-[#162442] cursor-pointer">
              <input
                type="checkbox"
                checked={hidePortrait}
                onChange={(e) => setHidePortrait(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[#1B3B82]"
              />
              <span className="font-medium">
                Ẩn chân dung (chỉ dùng ảnh đồ nghề / minh họa bàn tay làm nghề)
              </span>
            </label>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl bg-[#B93818]/10 border border-[#B93818]/25 px-3.5 py-2.5 text-xs font-semibold text-[#B93818]"
            >
              {errorMsg}
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-2 border-t border-[#E6D5C3] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DFCBB5] bg-white text-sm font-semibold text-[#5C564E] hover:bg-[#FDF8F2]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] text-white text-sm font-semibold shadow-sm"
            >
              {mode === 'approve'
                ? 'Duyệt & đưa lên bản đồ'
                : mode === 'edit'
                  ? 'Lưu thay đổi'
                  : 'Thêm lên bản đồ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
