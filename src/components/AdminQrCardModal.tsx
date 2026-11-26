import { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  MapPin,
  Printer,
  QrCode,
  X,
} from 'lucide-react';
import type { Artisan } from '../types/artisan';
import { buildArtisanDeepLink, buildQrCodeUrl } from '../utils/geo';

interface AdminQrCardModalProps {
  artisan: Artisan;
  onClose: () => void;
}

/**
 * Tấm thẻ QR in ấn đẹp mắt cho từng cô chú thợ (Logo Góc Thợ Quanh Ta, Tên, Dịch vụ,
 * Mốc góc phố, Mã QR dẫn trực tiếp tới link ?tho=ID) kèm nút In / Tải thẻ.
 */
export function AdminQrCardModal({ artisan, onClose }: AdminQrCardModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  const deepLink = buildArtisanDeepLink(artisan.id);
  const qrUrl = buildQrCodeUrl(deepLink, 240);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadCard = () => {
    // Tạo file thẻ SVG sắc nét để tải thẳng về máy không phụ thuộc CORS
    const safeName = artisan.name.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const safeServices = artisan.categories
      .join(' · ')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;');
    const safeLandmark = artisan.addressLandmark
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;');

    const svgDoc = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="820" viewBox="0 0 600 820">
  <rect width="600" height="820" rx="32" fill="#FAF8F5" stroke="#D96B38" stroke-width="6"/>
  <rect x="0" y="0" width="600" height="128" rx="28" fill="#D96B38"/>
  <rect x="0" y="96" width="600" height="32" fill="#D96B38"/>
  <text x="300" y="64" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">GÓC THỢ QUANH TA</text>
  <text x="300" y="98" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#FCE7DA">Hỏng đâu tìm đó – Gần nhau hơn mỗi ngày!</text>
  <text x="300" y="190" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="700" fill="#1F2933">${safeName}</text>
  <text x="300" y="226" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="600" fill="#3A6B5C">${safeServices}</text>
  <rect x="150" y="262" width="300" height="300" rx="24" fill="#FFFFFF" stroke="#E5DFD5" stroke-width="3"/>
  <image href="${qrUrl}" x="175" y="287" width="250" height="250"/>
  <text x="300" y="608" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="600" fill="#1F2933">Quét mã để xem bảng giá &amp; chỉ đường</text>
  <text x="300" y="652" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#52606D">${safeLandmark.slice(0, 58)}</text>
  <text x="300" y="688" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="600" fill="#3A6B5C">${artisan.hours} · ${artisan.paymentMethod}</text>
  <text x="300" y="772" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#7B8794">${deepLink.replace(/&/g, '&amp;')}</text>
</svg>`;

    const blob = new Blob([svgDoc], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `the-qr-${artisan.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="printable-qr-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white border border-[#EBE5DC] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EBE5DC]">
          <h3
            id="printable-qr-title"
            className="text-sm font-bold text-[#1F2933]"
          >
            Thẻ QR in ấn cho cô chú thợ
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-[#52606D] hover:bg-[#FAF8F5] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 bg-[#FAF8F5]">
          {/* Tấm thẻ QR sẵn sàng in */}
          <div
            id="printable-qr-card"
            className="rounded-3xl bg-white border-2 border-[#D96B38]/30 shadow-md overflow-hidden text-center"
          >
            <div className="bg-[#D96B38] text-white px-5 py-4 space-y-1">
              <div className="inline-flex items-center justify-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </span>
                <span className="text-sm font-bold tracking-wide">
                  GÓC THỢ QUANH TA
                </span>
              </div>
              <p className="text-[11px] text-white/90">
                Hỏng đâu tìm đó – Gần nhau hơn mỗi ngày!
              </p>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#1F2933]">
                  {artisan.name}
                </h4>
                <p className="text-xs font-semibold text-[#3A6B5C]">
                  {artisan.categories.join(' · ')}
                </p>
              </div>

              <div className="mx-auto w-[196px] h-[196px] rounded-2xl bg-[#FAF8F5] border border-[#E5DFD5] p-2.5 flex items-center justify-center">
                {!qrFailed ? (
                  <img
                    src={qrUrl}
                    alt={`Mã QR dẫn tới trang chi tiết của ${artisan.name}`}
                    width={176}
                    height={176}
                    referrerPolicy="no-referrer"
                    onError={() => setQrFailed(true)}
                    className="w-[176px] h-[176px] rounded-xl bg-white"
                  />
                ) : (
                  <div className="p-3 text-xs text-[#52606D] space-y-1">
                    <QrCode className="w-8 h-8 mx-auto text-[#D96B38]" />
                    <p>Đang ngoại tuyến</p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#1F2933]">
                  Quét mã để xem bảng giá &amp; chỉ đường
                </p>
                <p className="text-[11px] text-[#52606D] leading-relaxed">
                  {artisan.addressLandmark}
                </p>
                <p className="text-[11px] font-medium text-[#3A6B5C]">
                  {artisan.hours} · {artisan.paymentMethod}
                </p>
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In thẻ</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCard}
              className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#3A6B5C] hover:bg-[#2F594C] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Tải thẻ</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Sao chép link chi tiết"
              className="min-h-[44px] px-3 py-2 rounded-xl border border-[#E5DFD5] bg-white hover:bg-[#FAF8F5] text-[#1F2933] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#3A6B5C]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
