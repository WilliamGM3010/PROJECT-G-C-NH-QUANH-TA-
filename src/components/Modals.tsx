import { useState, type FormEvent } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  X,
} from 'lucide-react';
import type { Artisan, ArtisanStatus, Coordinates, TravelMode } from '../types/artisan';
import { buildGoogleMapsDirectionsUrl, buildQrCodeUrl } from '../utils/geo';

interface QrDirectionsModalProps {
  artisan: Artisan | null;
  userOrigin?: Coordinates | null;
  travelMode: TravelMode;
  onClose: () => void;
}

export function QrDirectionsModal({
  artisan,
  userOrigin,
  travelMode,
  onClose,
}: QrDirectionsModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  if (!artisan) return null;

  const mapsUrl = buildGoogleMapsDirectionsUrl(
    artisan.coordinates,
    userOrigin,
    travelMode
  );
  const qrImgUrl = buildQrCodeUrl(mapsUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mapsUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-[#EBE5DC] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBE5DC]">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#D96B38]" />
            <h3 id="qr-modal-title" className="text-sm font-bold text-[#1F2933]">
              Quét mã QR chỉ đường
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-[#52606D] hover:bg-[#FAF8F5] hover:text-[#1F2933] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 text-center space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#1F2933]">{artisan.name}</p>
            <p className="text-xs text-[#52606D] leading-relaxed">
              Mở camera điện thoại quét mã bên dưới để mở thẳng chỉ đường Google Maps.
            </p>
          </div>

          <div className="mx-auto w-[216px] h-[216px] rounded-2xl bg-[#FAF8F5] border border-[#E5DFD5] p-2 flex items-center justify-center">
            {!qrFailed ? (
              <img
                src={qrImgUrl}
                alt={`Mã QR chỉ đường tới ${artisan.name}`}
                width={200}
                height={200}
                referrerPolicy="no-referrer"
                onError={() => setQrFailed(true)}
                className="w-[200px] h-[200px] rounded-xl bg-white"
              />
            ) : (
              <div className="p-4 text-xs text-[#52606D] space-y-2">
                <QrCode className="w-10 h-10 mx-auto text-[#D96B38]/60" />
                <p>Không tải được ảnh QR lúc này. Bạn có thể sao chép liên kết bên dưới.</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] hover:bg-[#F1EAE0] text-xs font-semibold text-[#1F2933] inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#3A6B5C]" />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép link</span>
                </>
              )}
            </button>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Mở bản đồ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatusReportModalProps {
  artisan: Artisan | null;
  onClose: () => void;
  onSubmitReport: (
    artisanId: string,
    status: ArtisanStatus,
    note: string
  ) => void;
}

const STATUS_CHOICES: {
  value: ArtisanStatus;
  icon: string;
  title: string;
  desc: string;
  activeBorder: string;
}[] = [
  {
    value: 'working',
    icon: '🟢',
    title: 'Vẫn đang làm',
    desc: 'Cô chú đang ngồi đúng góc phố quen thuộc',
    activeBorder: 'border-[#3A6B5C] bg-[#3A6B5C]/8',
  },
  {
    value: 'off_today',
    icon: '🟡',
    title: 'Hôm nay nghỉ',
    desc: 'Tạm vắng hôm nay do thời tiết hoặc việc riêng',
    activeBorder: 'border-[#E9A825] bg-[#E9A825]/12',
  },
  {
    value: 'relocated',
    icon: '🔴',
    title: 'Đã chuyển chỗ / Sai thông tin',
    desc: 'Vị trí hoặc khung giờ cần cộng đồng kiểm tra lại',
    activeBorder: 'border-[#C84B31] bg-[#C84B31]/10',
  },
];

export function StatusReportModal({
  artisan,
  onClose,
  onSubmitReport,
}: StatusReportModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ArtisanStatus>(
    artisan?.status ?? 'working'
  );
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!artisan) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmitReport(artisan.id, selectedStatus, note.trim());
    setSubmitted(true);
    window.setTimeout(() => {
      setSubmitted(false);
      setNote('');
      onClose();
    }, 1500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#1F2933]/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white shadow-xl border border-[#EBE5DC] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBE5DC]">
          <div>
            <h3
              id="report-modal-title"
              className="text-sm font-bold text-[#1F2933]"
            >
              Báo tình trạng hiện tại
            </h3>
            <p className="text-xs text-[#52606D] truncate">{artisan.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-[#52606D] hover:bg-[#FAF8F5] hover:text-[#1F2933] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#3A6B5C]/12 text-[#3A6B5C] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-[#1F2933]">
              Cảm ơn bạn đã cập nhật!
            </h4>
            <p className="text-xs text-[#52606D] leading-relaxed">
              Thông tin từ cộng đồng giúp người đến sau tìm đúng lúc cô chú đang làm việc.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-2">
              {STATUS_CHOICES.map((option) => {
                const isSelected = selectedStatus === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedStatus(option.value)}
                    className={`w-full min-h-[52px] p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      isSelected
                        ? option.activeBorder
                        : 'border-[#E5DFD5] bg-white hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className="text-base leading-none mt-0.5" aria-hidden="true">
                      {option.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1F2933]">
                        {option.title}
                      </p>
                      <p className="text-xs text-[#52606D]">{option.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <label
                htmlFor="status-report-note"
                className="block text-xs font-semibold text-[#1F2933] mb-1.5"
              >
                Ghi chú thêm (không bắt buộc)
              </label>
              <input
                id="status-report-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={140}
                placeholder="VD: Chú dời qua bên kia đường tránh nắng..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm text-[#1F2933] placeholder:text-[#7B8794] focus:bg-white focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#52606D] hover:bg-[#FAF8F5] transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-sm font-semibold shadow-sm transition-colors"
              >
                Gửi cập nhật
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
