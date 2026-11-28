import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  Image as ImageIcon,
  Palette,
  Smartphone,
  Square,
  X,
} from 'lucide-react';
import {
  getAchievementById,
  getStudioBackgroundById,
  STUDIO_BACKGROUNDS,
} from '../../data/avatarCatalog';
import type { AvatarConfig } from '../../types/avatar';
import { svgElementToImage } from '../../utils/avatarSvgExport';
import { ChibiAvatar2D } from './ChibiAvatar2D';

type ShareFormat = 'square' | 'story';

interface ShareAvatarModalProps {
  isOpen: boolean;
  config: AvatarConfig;
  displayName: string;
  equippedTitleId: string;
  gpBalance: number;
  ownedCount: number;
  onClose: () => void;
  onDownloaded?: () => void;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function ShareAvatarModal({
  isOpen,
  config,
  displayName,
  equippedTitleId,
  gpBalance,
  ownedCount,
  onClose,
  onDownloaded,
}: ShareAvatarModalProps) {
  const [format, setFormat] = useState<ShareFormat>('square');
  const [selectedBgId, setSelectedBgId] = useState<string>(config.studioBgId);
  const [composedUrl, setComposedUrl] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  const staticSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    setSelectedBgId(config.studioBgId);
  }, [config.studioBgId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const titleMeta = getAchievementById(equippedTitleId);
  const bgMeta = getStudioBackgroundById(selectedBgId);

  const composePoster = useCallback(async () => {
    if (!isOpen || !staticSvgRef.current) return;
    setIsComposing(true);
    try {
      // Độ phân giải 2x sắc nét (Square 1200x1200 / Story 1080x1920)
      const width = format === 'story' ? 1080 : 1200;
      const height = format === 'story' ? 1920 : 1200;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Phông nền Saigon/Craft
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, bgMeta.canvasStops[0]);
      grad.addColorStop(1, bgMeta.canvasStops[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Đường chỉ may đứt nét trang trí đặc trưng THE NEIGHBORHOOD CRAFT
      const margin = format === 'story' ? 54 : 46;
      ctx.save();
      drawRoundedRect(
        ctx,
        margin,
        margin,
        width - margin * 2,
        height - margin * 2,
        44
      );
      ctx.strokeStyle = bgMeta.stitchColor;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([14, 11]);
      ctx.stroke();
      ctx.restore();

      // 3. Con dấu thương hiệu trên đầu thẻ
      ctx.textAlign = 'center';
      ctx.fillStyle = bgMeta.isDark ? '#F5C451' : '#B93818';
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.fillText(
        'GÓC THỢ QUANH TA · THE NEIGHBORHOOD CRAFT',
        width / 2,
        format === 'story' ? 148 : 114
      );

      ctx.font = '800 38px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = bgMeta.isDark ? '#F7F2E8' : '#1B3B82';
      ctx.fillText(
        'Góc Thợ Avatar',
        width / 2,
        format === 'story' ? 204 : 166
      );

      // 4. Serialize bản SVG tĩnh (disableAnimation=true) sang hình 2x siêu nét
      const avatarImg = await svgElementToImage(staticSvgRef.current);
      const drawW = format === 'story' ? 760 : 580;
      const drawH = drawW * (480 / 400);
      const drawX = (width - drawW) / 2;
      const drawY = format === 'story' ? 320 : 185;
      ctx.drawImage(avatarImg, drawX, drawY, drawW, drawH);

      // 5. Bảng thông tin nhân vật ở đáy thẻ
      const cardW = width - margin * 2 - 72;
      const cardH = format === 'story' ? 320 : 216;
      const cardX = (width - cardW) / 2;
      const cardY = height - margin - cardH - 40;

      ctx.save();
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
      ctx.fillStyle = bgMeta.isDark
        ? 'rgba(255, 251, 245, 0.96)'
        : 'rgba(255, 252, 246, 0.94)';
      ctx.shadowColor = 'rgba(37, 41, 46, 0.14)';
      ctx.shadowBlur = 32;
      ctx.shadowOffsetY = 12;
      ctx.fill();
      ctx.restore();

      ctx.save();
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
      ctx.strokeStyle = '#E6D9C6';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Danh hiệu đang đeo (sạch thoáng không nặng nề)
      ctx.fillStyle = '#B93818';
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.fillText(
        `${titleMeta.badgeCode} · ${titleMeta.title}`,
        width / 2,
        cardY + (format === 'story' ? 68 : 54)
      );

      // Tên người dùng
      ctx.fillStyle = '#25292E';
      ctx.font =
        format === 'story'
          ? '800 54px "Be Vietnam Pro", sans-serif'
          : '800 46px "Be Vietnam Pro", sans-serif';
      const cleanName = displayName.trim() || 'Bạn trẻ Sài Gòn';
      ctx.fillText(
        cleanName.slice(0, 26),
        width / 2,
        cardY + (format === 'story' ? 142 : 114)
      );

      // Chỉ số sưu tầm
      ctx.fillStyle = '#615D57';
      ctx.font = '600 24px "Be Vietnam Pro", sans-serif';
      ctx.fillText(
        `${ownedCount} món tủ đồ  ·  ${gpBalance} Điểm Góc (GP)`,
        width / 2,
        cardY + (format === 'story' ? 196 : 162)
      );

      if (format === 'story') {
        ctx.fillStyle = '#1B3B82';
        ctx.font = 'italic 600 26px "Lora", Georgia, serif';
        ctx.fillText(
          'Hỏng đâu sửa liền · Sống xanh cùng các góc thợ Sài Gòn',
          width / 2,
          cardY + cardH - 46
        );
      }

      setComposedUrl(canvas.toDataURL('image/png'));
    } catch {
      setComposedUrl(null);
    } finally {
      setIsComposing(false);
    }
  }, [
    isOpen,
    format,
    bgMeta,
    titleMeta,
    displayName,
    ownedCount,
    gpBalance,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    // Chờ 1 frame để SVG ẩn kịp mount ref
    const id = window.requestAnimationFrame(() => {
      void composePoster();
    });
    return () => window.cancelAnimationFrame(id);
  }, [isOpen, composePoster, config]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!composedUrl) return;
    const link = document.createElement('a');
    link.href = composedUrl;
    link.download = `goc-tho-avatar-${format === 'story' ? 'story-9x16' : 'square-1x1'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onDownloaded?.();
  };

  return (
    <div
      className="fixed inset-0 z-[85] bg-[#25292E]/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Bản SVG tĩnh ẩn để XMLSerializer xuất ảnh PNG 2x siêu nét đứng ngay ngắn chính giữa */}
      <div
        aria-hidden="true"
        className="fixed -left-[9999px] -top-[9999px] w-[400px] h-[480px] pointer-events-none opacity-0"
      >
        <ChibiAvatar2D
          ref={staticSvgRef}
          config={config}
          disableAnimation
          showGroundShadow
          isDarkBackdrop={bgMeta.isDark}
        />
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chia sẻ thẻ Góc Thợ Avatar"
        className="w-full max-w-3xl max-h-[92dvh] rounded-3xl bg-[#FBF8F2] border border-[#E8DFD1] shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-dashed border-[#DFD3C2] bg-[#F7F2E8] flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="font-mono text-[11px] font-bold text-[#D46534]">
              Xuất ảnh PNG độ phân giải 2x
            </p>
            <h3 className="font-display text-base sm:text-lg font-extrabold text-[#25292E]">
              Chia sẻ Góc Thợ Avatar
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chia sẻ"
            className="w-9 h-9 rounded-full bg-white border border-[#E8DFD1] text-[#615D57] hover:text-[#25292E] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Preview Canvas */}
          <div className="md:col-span-7 flex items-center justify-center rounded-2xl bg-[#EFE9DD] border border-[#E3D8C6] p-4 min-h-[300px]">
            {composedUrl ? (
              <img
                src={composedUrl}
                alt="Thẻ chia sẻ Góc Thợ Avatar"
                className={`rounded-2xl shadow-lg object-contain transition-all ${
                  format === 'story'
                    ? 'max-h-[430px] w-auto'
                    : 'max-h-[380px] w-auto'
                }`}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-xs text-[#615D57]">
                <ImageIcon className="w-8 h-8 text-[#B8AFA3]" />
                <span>
                  {isComposing
                    ? 'Đang xuất ảnh 2D sắc nét...'
                    : 'Đang chuẩn bị thẻ chia sẻ...'}
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="md:col-span-5 flex flex-col justify-between gap-5">
            <div className="space-y-5">
              {/* Format switcher */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#25292E]">
                  1. Chọn khung tỷ lệ
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormat('square')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      format === 'square'
                        ? 'bg-[#EEF2FA] border-[#1B3B82] text-[#1B3B82]'
                        : 'bg-white border-[#E8DFD1] text-[#25292E] hover:border-[#CBBFA9]'
                    }`}
                  >
                    <Square className="w-4 h-4 mb-1.5" />
                    <p className="text-xs font-bold">Vuông 1:1</p>
                    <p className="text-[11px] opacity-75">Avatar / Facebook</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('story')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      format === 'story'
                        ? 'bg-[#EEF2FA] border-[#1B3B82] text-[#1B3B82]'
                        : 'bg-white border-[#E8DFD1] text-[#25292E] hover:border-[#CBBFA9]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mb-1.5" />
                    <p className="text-xs font-bold">Dọc 9:16</p>
                    <p className="text-[11px] opacity-75">Story IG / TikTok</p>
                  </button>
                </div>
              </div>

              {/* Studio backgrounds */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#25292E] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#D46534]" />
                  <span>2. Chọn phông nền</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {STUDIO_BACKGROUNDS.map((bg) => {
                    const active = bg.id === selectedBgId;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setSelectedBgId(bg.id)}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                          active
                            ? 'border-[#1B3B82] ring-2 ring-[#1B3B82]/15 bg-white'
                            : 'border-[#E8DFD1] bg-white hover:border-[#CBBFA9]'
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center border border-black/10"
                          style={{ background: bg.cssBackground }}
                        >
                          {active && (
                            <Check
                              className={`w-3.5 h-3.5 ${
                                bg.isDark ? 'text-white' : 'text-[#1B3B82]'
                              }`}
                            />
                          )}
                        </span>
                        <span className="text-[11px] font-semibold text-[#25292E] truncate">
                          {bg.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card info */}
              <div className="p-3.5 rounded-2xl bg-white border border-dashed border-[#DFD3C2] text-xs text-[#615D57] space-y-1">
                <p>
                  Tên hiển thị:{' '}
                  <strong className="text-[#25292E]">{displayName}</strong>
                </p>
                <p>
                  Danh hiệu:{' '}
                  <strong className="text-[#B93818]">{titleMeta.title}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!composedUrl || isComposing}
              onClick={handleDownload}
              className="w-full min-h-[46px] px-5 py-3 rounded-2xl bg-[#1B3B82] hover:bg-[#142D66] disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Tải ảnh PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
