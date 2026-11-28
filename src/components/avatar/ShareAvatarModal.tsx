import { useCallback, useEffect, useState } from 'react';
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

type ShareFormat = 'square' | 'story';

interface ShareAvatarModalProps {
  isOpen: boolean;
  avatarSnapshotUrl: string | null;
  displayName: string;
  equippedTitleId: string;
  initialBgId: string;
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
  avatarSnapshotUrl,
  displayName,
  equippedTitleId,
  initialBgId,
  gpBalance,
  ownedCount,
  onClose,
  onDownloaded,
}: ShareAvatarModalProps) {
  const [format, setFormat] = useState<ShareFormat>('square');
  const [selectedBgId, setSelectedBgId] = useState<string>(initialBgId);
  const [composedUrl, setComposedUrl] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    setSelectedBgId(initialBgId);
  }, [initialBgId, isOpen]);

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
    if (!isOpen || !avatarSnapshotUrl) return;
    setIsComposing(true);
    try {
      const width = 1080;
      const height = format === 'story' ? 1920 : 1080;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Soft radial studio gradient backdrop
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.36,
        60,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.72
      );
      grad.addColorStop(0, bgMeta.canvasStops[0]);
      grad.addColorStop(0.58, bgMeta.canvasStops[1]);
      grad.addColorStop(1, bgMeta.canvasStops[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Decorative editorial border frame
      const margin = format === 'story' ? 54 : 44;
      ctx.save();
      drawRoundedRect(
        ctx,
        margin,
        margin,
        width - margin * 2,
        height - margin * 2,
        44
      );
      ctx.strokeStyle = 'rgba(37, 41, 46, 0.12)';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.stroke();
      ctx.restore();

      // 3. Top brand stamp
      ctx.textAlign = 'center';
      ctx.fillStyle = bgMeta.textColor;
      ctx.globalAlpha = 0.78;
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.fillText(
        'THE NEIGHBORHOOD CRAFT · SÀI GÒN',
        width / 2,
        format === 'story' ? 148 : 112
      );
      ctx.globalAlpha = 1;

      ctx.font = '800 36px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = '#1B3B82';
      ctx.fillText(
        'GÓC THỢ AVATAR',
        width / 2,
        format === 'story' ? 202 : 160
      );

      // 4. Load & draw 3D Chibi snapshot centered
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = avatarSnapshotUrl;
      });

      const drawSize = format === 'story' ? 880 : 620;
      const drawX = (width - drawSize) / 2;
      const drawY = format === 'story' ? 320 : 175;
      ctx.drawImage(img, drawX, drawY, drawSize, drawSize);

      // 5. Bottom editorial identity card
      const cardW = width - margin * 2 - 72;
      const cardH = format === 'story' ? 330 : 210;
      const cardX = (width - cardW) / 2;
      const cardY = height - margin - cardH - 42;

      ctx.save();
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
      ctx.fillStyle = 'rgba(255, 252, 246, 0.94)';
      ctx.shadowColor = 'rgba(37, 41, 46, 0.12)';
      ctx.shadowBlur = 32;
      ctx.shadowOffsetY = 12;
      ctx.fill();
      ctx.restore();

      ctx.save();
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
      ctx.strokeStyle = '#E8DFD1';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Title pill inside card
      const badgeLabel = `${titleMeta.badgeCode} · ${titleMeta.title.toUpperCase()}`;
      ctx.font = '700 22px "JetBrains Mono", monospace';
      const badgeW = Math.min(cardW - 80, ctx.measureText(badgeLabel).width + 54);
      const badgeH = 46;
      const badgeX = width / 2 - badgeW / 2;
      const badgeY = cardY + (format === 'story' ? 42 : 28);

      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 23);
      ctx.fillStyle = '#FDF0E9';
      ctx.fill();
      ctx.strokeStyle = '#E5B29A';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#B93818';
      ctx.textAlign = 'center';
      ctx.fillText(badgeLabel, width / 2, badgeY + 31);

      // User display name
      ctx.fillStyle = '#25292E';
      ctx.font =
        format === 'story'
          ? '800 52px "Be Vietnam Pro", sans-serif'
          : '800 44px "Be Vietnam Pro", sans-serif';
      const cleanName = displayName.trim() || 'Bạn trẻ Sài Gòn';
      ctx.fillText(
        cleanName.slice(0, 26),
        width / 2,
        badgeY + (format === 'story' ? 116 : 96)
      );

      // Stats & Footer tagline
      ctx.fillStyle = '#615D57';
      ctx.font = '600 24px "Be Vietnam Pro", sans-serif';
      ctx.fillText(
        `${ownedCount} món tủ đồ  ·  ${gpBalance} Điểm Góc (GP)`,
        width / 2,
        badgeY + (format === 'story' ? 172 : 140)
      );

      if (format === 'story') {
        ctx.fillStyle = '#1B3B82';
        ctx.font = '700 24px "Be Vietnam Pro", sans-serif';
        ctx.fillText(
          'Hỏng đâu sửa liền · Sống xanh cùng Góc Thợ Quanh Ta',
          width / 2,
          cardY + cardH - 46
        );
      }

      setComposedUrl(canvas.toDataURL('image/png'));
    } catch {
      setComposedUrl(avatarSnapshotUrl);
    } finally {
      setIsComposing(false);
    }
  }, [
    isOpen,
    avatarSnapshotUrl,
    format,
    bgMeta,
    titleMeta,
    displayName,
    ownedCount,
    gpBalance,
  ]);

  useEffect(() => {
    void composePoster();
  }, [composePoster]);

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
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chia sẻ thẻ Góc Thợ Avatar"
        className="w-full max-w-3xl max-h-[92dvh] rounded-3xl bg-[#FBF8F2] border border-[#E8DFD1] shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-dashed border-[#DFD3C2] bg-[#F7F2E8] flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#D46534]">
              XUẤT ẢNH CHIA SẺ PNG
            </p>
            <h3 className="font-display text-base sm:text-lg font-extrabold text-[#25292E]">
              Tạo thẻ nhân vật Góc Thợ Avatar
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
                  format === 'story' ? 'max-h-[420px] w-auto' : 'max-h-[380px] w-auto'
                }`}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-xs text-[#615D57]">
                <ImageIcon className="w-8 h-8 text-[#B8AFA3]" />
                <span>
                  {isComposing
                    ? 'Đang dựng thẻ ảnh sắc nét...'
                    : 'Đang chụp nhân vật 3D...'}
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="md:col-span-5 flex flex-col justify-between gap-5">
            <div className="space-y-5">
              {/* Format switcher */}
              <div className="space-y-2">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#615D57]">
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
                    <p className="text-xs font-bold">Ảnh vuông 1:1</p>
                    <p className="text-[11px] opacity-75">Avatar / Bài đăng</p>
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
                    <p className="text-xs font-bold">Story 9:16</p>
                    <p className="text-[11px] opacity-75">Instagram / TikTok</p>
                  </button>
                </div>
              </div>

              {/* Studio pastel backgrounds */}
              <div className="space-y-2">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#615D57] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#D46534]" />
                  2. Phông nền studio
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {STUDIO_BACKGROUNDS.map((bg) => {
                    const active = bg.id === selectedBgId;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setSelectedBgId(bg.id)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          active
                            ? 'border-[#1B3B82] ring-2 ring-[#1B3B82]/20 bg-white'
                            : 'border-[#E8DFD1] bg-white hover:border-[#CBBFA9]'
                        }`}
                      >
                        <div
                          className="h-7 rounded-lg mb-1.5 flex items-center justify-center"
                          style={{ background: bg.cssGradient }}
                        >
                          {active && (
                            <Check className="w-3.5 h-3.5 text-[#1B3B82]" />
                          )}
                        </div>
                        <p className="text-[10.5px] font-semibold text-[#25292E] truncate">
                          {bg.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info card */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#EAE0D2] text-xs text-[#615D57] space-y-1">
                <p className="font-bold text-[#25292E]">
                  Thông tin in trên thẻ:
                </p>
                <p>
                  Tên: <strong className="text-[#25292E]">{displayName}</strong>
                </p>
                <p>
                  Danh hiệu:{' '}
                  <strong className="text-[#D46534]">{titleMeta.title}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!composedUrl || isComposing}
              onClick={handleDownload}
              className="w-full min-h-[46px] px-5 py-3 rounded-2xl bg-[#D46534] hover:bg-[#BC5326] disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Tải ảnh PNG sắc nét</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
