import { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Printer,
  QrCode,
  X,
} from 'lucide-react';
import { GTQT_LOGO_SRC } from '../data/team';
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
    // Tạo file thẻ SVG sắc nét theo bảng màu Craft Editorial Minimalism (Xanh Chàm - Cam Cờ-lê - Giấy Kem)
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
  <rect width="600" height="820" rx="32" fill="#FDF8F2" stroke="#1B3B82" stroke-width="6"/>
  <rect x="0" y="0" width="600" height="128" rx="28" fill="#1B3B82"/>
  <rect x="0" y="96" width="600" height="32" fill="#1B3B82"/>
  <text x="300" y="64" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">GÓC THỢ QUANH TA</text>
  <text x="300" y="98" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#FDBA8C">Hỏng đâu tìm đó – Gần nhau hơn mỗi ngày!</text>
  <text x="300" y="190" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="700" fill="#162442">${safeName}</text>
  <text x="300" y="226" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="600" fill="#E86F2C">${safeServices}</text>
  <rect x="150" y="262" width="300" height="300" rx="24" fill="#FFFFFF" stroke="#D8C3AE" stroke-dasharray="8 6" stroke-width="3"/>
  <image href="${qrUrl}" x="175" y="287" width="250" height="250"/>
  <text x="300" y="608" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="#162442">Quét mã để xem bảng giá &amp; chỉ đường</text>
  <text x="300" y="652" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#5C564E">${safeLandmark.slice(0, 58)}</text>
  <text x="300" y="688" text-anchor="middle" font-family="monospace" font-size="14" font-weight="600" fill="#1B3B82">${artisan.hours} · ${artisan.paymentMethod}</text>
  <text x="300" y="772" text-anchor="middle" font-family="monospace" font-size="12" fill="#8A8177">${deepLink.replace(/&/g, '&amp;')}</text>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162442]/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white border-2 border-[#162442] shadow-[6px_6px_0px_#162442] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dashed border-[#D8C3AE]">
          <h3
            id="printable-qr-title"
            className="font-display text-sm font-bold text-[#162442]"
          >
            Thẻ QR in ấn cho cô chú thợ
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-[#5C564E] hover:bg-[#FDF8F2] hover:text-[#162442] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 bg-[#FDF8F2]">
          {/* Tấm thẻ QR sẵn sàng in */}
          <div
            id="printable-qr-card"
            className="rounded-3xl bg-white border-2 border-[#1B3B82] shadow-md overflow-hidden text-center"
          >
            <div className="bg-[#1B3B82] text-white px-5 py-4 space-y-1">
              <div className="inline-flex items-center justify-center gap-2">
                <span className="w-7 h-7 rounded-full overflow-hidden bg-white ring-2 ring-white/40 shrink-0">
                  <img
                    src={GTQT_LOGO_SRC}
                    alt="Góc Thợ Quanh Ta"
                    className="w-full h-full object-cover scale-[1.07]"
                  />
                </span>
                <span className="font-display text-sm font-bold tracking-wide">
                  GÓC THỢ QUANH TA
                </span>
              </div>
              <p className="text-[11px] text-[#FDBA8C]">
                Hỏng đâu tìm đó – Gần nhau hơn mỗi ngày!
              </p>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="space-y-1">
                <h4 className="font-display text-base font-bold text-[#162442]">
                  {artisan.name}
                </h4>
                <p className="text-xs font-bold text-[#E86F2C]">
                  {artisan.categories.join(' · ')}
                </p>
              </div>

              <div className="mx-auto w-[196px] h-[196px] rounded-2xl bg-[#FDF8F2] border border-dashed border-[#D8C3AE] p-2.5 flex items-center justify-center">
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
                  <div className="p-3 text-xs text-[#5C564E] space-y-1">
                    <QrCode className="w-8 h-8 mx-auto text-[#1B3B82]" />
                    <p>Đang ngoại tuyến</p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-[#162442]">
                  Quét mã để xem bảng giá &amp; chỉ đường
                </p>
                <p className="text-[11px] text-[#5C564E] leading-relaxed">
                  {artisan.addressLandmark}
                </p>
                <p className="font-mono text-[11px] font-semibold text-[#1B3B82]">
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
              className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#E86F2C] hover:bg-[#D25C1B] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#162442] transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>In thẻ</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCard}
              className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Tải thẻ</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Sao chép link chi tiết"
              className="min-h-[44px] px-3 py-2 rounded-xl border border-[#DFCBB5] bg-white hover:border-[#1B3B82] text-[#162442] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#15803D]" />
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
