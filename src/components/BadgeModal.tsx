import { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  Edit3,
  Lock,
  Sparkles,
  X,
} from 'lucide-react';
import type { UserContributionStats } from '../types/artisan';

export interface BadgeTier {
  id: 'friend' | 'local_guide' | 'green_ambassador';
  emoji: string;
  title: string;
  subtitle: string;
  requirement: string;
  accentBg: string;
  accentPrimary: string;
  accentSecondary: string;
  unlocked: boolean;
}

export function evaluateUserBadges(
  stats: UserContributionStats,
  syncedBadgeIds: string[] = []
): {
  totalActions: number;
  tiers: BadgeTier[];
  highestUnlocked: BadgeTier | null;
} {
  const syncedSet = new Set(syncedBadgeIds);
  const totalActions =
    stats.suggestionsCount +
    stats.reportsCount +
    stats.revivedCount +
    stats.thanksCount;

  const tiers: BadgeTier[] = [
    {
      id: 'friend',
      emoji: '🌱',
      title: 'Người bạn Góc Phố',
      subtitle: 'Hành trình sống xanh bắt đầu từ lần sửa đồ đầu tiên',
      requirement: 'Thực hiện ít nhất 1 hành động (sửa đồ, báo tình trạng hoặc gửi cảm ơn)',
      accentBg: '#3A6B5C',
      accentPrimary: '#3A6B5C',
      accentSecondary: '#D96B38',
      unlocked: totalActions >= 1 || syncedSet.has('friend'),
    },
    {
      id: 'local_guide',
      emoji: '🧭',
      title: 'Thổ địa Góc Phố',
      subtitle: 'Người dẫn đường tin cậy kết nối cô chú thợ quanh Sài Gòn',
      requirement: 'Gửi ít nhất 1 gợi ý thợ mới HOẶC tổng cộng 3 đóng góp',
      accentBg: '#D96B38',
      accentPrimary: '#D96B38',
      accentSecondary: '#3A6B5C',
      unlocked:
        stats.suggestionsCount >= 1 ||
        totalActions >= 3 ||
        syncedSet.has('local_guide'),
    },
    {
      id: 'green_ambassador',
      emoji: '💛',
      title: 'Đại sứ Sống Xanh',
      subtitle: 'Lan tỏa lối sống bền vững và trân trọng nghề thủ công đô thị',
      requirement: 'Thực hiện từ 5 hành động đóng góp trở lên',
      accentBg: '#B85427',
      accentPrimary: '#D96B38',
      accentSecondary: '#2F594C',
      unlocked: totalActions >= 5 || syncedSet.has('green_ambassador'),
    },
  ];

  const unlockedList = tiers.filter((t) => t.unlocked);
  const highestUnlocked =
    unlockedList.length > 0 ? unlockedList[unlockedList.length - 1] : null;

  return { totalActions, tiers, highestUnlocked };
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
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let y = startY;

  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, cx, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, cx, y);
    y += lineHeight;
  }
  return y;
}

/**
 * Render Thẻ Huy Hiệu 9:16 chuẩn Instagram Story (1080x1920px) trực tiếp bằng HTML Canvas
 * và tải về dưới dạng tệp ảnh PNG sắc nét.
 */
function downloadStoryBadgePng(
  tier: BadgeTier,
  displayName: string,
  stats: UserContributionStats,
  totalActions: number
) {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Nền chuyển sắc Cam Đất & Xanh Rêu ấm áp
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, tier.accentPrimary);
  grad.addColorStop(0.55, '#8A5E47');
  grad.addColorStop(1, tier.accentSecondary);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Các mảng hình học mờ trang trí tinh tế
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(140, 260, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(960, 1620, 320, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Khung thẻ Kem Sáng trung tâm
  ctx.save();
  ctx.shadowColor = 'rgba(31, 41, 51, 0.28)';
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 20;
  drawRoundedRect(ctx, 84, 150, W - 168, H - 300, 56);
  ctx.fillStyle = '#FAF8F5';
  ctx.fill();
  ctx.restore();

  // Viền tinh tế bên trong thẻ
  drawRoundedRect(ctx, 114, 180, W - 228, H - 360, 42);
  ctx.strokeStyle = 'rgba(217, 107, 56, 0.28)';
  ctx.lineWidth = 4;
  ctx.stroke();

  const fontStack = '"Be Vietnam Pro", system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';

  // Nhãn dự án phía trên
  drawRoundedRect(ctx, W / 2 - 220, 240, 440, 68, 34);
  ctx.fillStyle = 'rgba(58, 107, 92, 0.12)';
  ctx.fill();
  ctx.fillStyle = '#3A6B5C';
  ctx.font = `700 28px ${fontStack}`;
  ctx.fillText('GÓC THỢ QUANH TA · TP.HCM', W / 2, 284);

  // Vòng tròn huy hiệu trung tâm
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, 540, 160, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(217, 107, 56, 0.22)';
  ctx.shadowBlur = 32;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = tier.accentPrimary;
  ctx.stroke();
  ctx.restore();

  ctx.font = `140px ${fontStack}`;
  ctx.fillText(tier.emoji, W / 2, 592);

  // Nhãn "CHỨNG NHẬN DANH HIỆU"
  ctx.fillStyle = '#D96B38';
  ctx.font = `700 30px ${fontStack}`;
  ctx.fillText('CHỨNG NHẬN ĐÓNG GÓP CỘNG ĐỒNG', W / 2, 790);

  // Tên danh hiệu
  ctx.fillStyle = '#1F2933';
  ctx.font = `800 66px ${fontStack}`;
  ctx.fillText(tier.title, W / 2, 876);

  // Tên người dùng (cho phép đổi tên)
  drawRoundedRect(ctx, 180, 930, W - 360, 106, 28);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#E5DFD5';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#52606D';
  ctx.font = `600 24px ${fontStack}`;
  ctx.fillText('TRAO TẶNG CHO', W / 2, 968);

  ctx.fillStyle = '#3A6B5C';
  ctx.font = `800 42px ${fontStack}`;
  ctx.fillText(displayName.slice(0, 28), W / 2, 1018);

  // Dòng mô tả ngắn
  ctx.fillStyle = '#52606D';
  ctx.font = `500 32px ${fontStack}`;
  drawWrappedText(ctx, tier.subtitle, W / 2, 1110, 740, 46);

  // Khối chỉ số đóng góp
  drawRoundedRect(ctx, 150, 1230, W - 300, 240, 32);
  ctx.fillStyle = '#3A6B5C';
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 84px ${fontStack}`;
  ctx.fillText(String(totalActions), W / 2, 1340);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = `600 30px ${fontStack}`;
  ctx.fillText('HÀNH ĐỘNG GẮN KẾT & SỐNG XANH', W / 2, 1394);

  ctx.fillStyle = '#F6C8A8';
  ctx.font = `600 24px ${fontStack}`;
  ctx.fillText(
    `${stats.revivedCount} lần sửa đồ  ·  ${stats.suggestionsCount} gợi ý thợ  ·  ${stats.thanksCount} lời cảm ơn  ·  ${stats.reportsCount} cập nhật`,
    W / 2,
    1442
  );

  // Tagline ở đáy thẻ
  ctx.fillStyle = '#D96B38';
  ctx.font = `700 34px ${fontStack}`;
  ctx.fillText('“Hỏng đâu tìm đó – Gần nhau hơn mỗi ngày!”', W / 2, 1600);

  ctx.fillStyle = '#7B8794';
  ctx.font = `500 26px ${fontStack}`;
  ctx.fillText('Bản đồ số kết nối nghề thủ công vỉa hè TP.HCM', W / 2, 1656);

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `huy-hieu-${tier.id}-goc-tho.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface BadgeModalProps {
  stats: UserContributionStats;
  syncedBadgeIds?: string[];
  onUpdateDisplayName: (nextName: string) => void;
  onClose: () => void;
}

export function BadgeModal({
  stats,
  syncedBadgeIds = [],
  onUpdateDisplayName,
  onClose,
}: BadgeModalProps) {
  const { totalActions, tiers, highestUnlocked } = useMemo(
    () => evaluateUserBadges(stats, syncedBadgeIds),
    [stats, syncedBadgeIds]
  );

  const [selectedTierId, setSelectedTierId] = useState<BadgeTier['id']>(
    highestUnlocked?.id ?? 'friend'
  );
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(stats.displayName);

  const activeTier =
    tiers.find((t) => t.id === selectedTierId) ?? highestUnlocked ?? tiers[0];

  const handleSaveName = () => {
    const clean = draftName.trim() || 'Bạn trẻ Sài Gòn';
    onUpdateDisplayName(clean);
    setDraftName(clean);
    setEditingName(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1F2933]/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-3xl bg-[#FAF8F5] border border-[#EBE5DC] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#EBE5DC] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#D96B38]/12 text-[#D96B38] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h2
                id="badge-modal-title"
                className="text-base font-bold text-[#1F2933]"
              >
                🏅 Huy hiệu Thổ địa Góc Phố
              </h2>
              <p className="text-xs text-[#52606D]">
                Mỗi lần sửa đồ, gợi ý thợ hay gửi lời cảm ơn đều giúp góc phố thêm gắn kết
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-[#52606D] hover:bg-[#FAF8F5] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: 2 cột trên Desktop (Tiến độ + Thẻ Story 9:16), 1 cột cuộn trên Mobile */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cột trái: Thống kê đóng góp + 3 cấp bậc huy hiệu */}
            <div className="lg:col-span-7 space-y-5">
              {/* Tóm tắt đóng góp cá nhân */}
              <div className="rounded-2xl bg-white border border-[#EBE5DC] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1F2933]">
                    Hành trình đóng góp của bạn
                  </span>
                  <span className="text-xs font-bold text-[#3A6B5C] tabular-nums">
                    Tổng: {totalActions} hành động
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE5DC] p-2.5 text-center">
                    <p className="text-lg font-bold text-[#3A6B5C] tabular-nums">
                      {stats.revivedCount}
                    </p>
                    <p className="text-[11px] text-[#52606D]">Lần sửa đồ</p>
                  </div>
                  <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE5DC] p-2.5 text-center">
                    <p className="text-lg font-bold text-[#D96B38] tabular-nums">
                      {stats.suggestionsCount}
                    </p>
                    <p className="text-[11px] text-[#52606D]">Gợi ý thợ mới</p>
                  </div>
                  <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE5DC] p-2.5 text-center">
                    <p className="text-lg font-bold text-[#1F2933] tabular-nums">
                      {stats.reportsCount}
                    </p>
                    <p className="text-[11px] text-[#52606D]">Báo tình trạng</p>
                  </div>
                  <div className="rounded-xl bg-[#FAF8F5] border border-[#EBE5DC] p-2.5 text-center">
                    <p className="text-lg font-bold text-[#D96B38] tabular-nums">
                      {stats.thanksCount}
                    </p>
                    <p className="text-[11px] text-[#52606D]">Lời cảm ơn</p>
                  </div>
                </div>
              </div>

              {/* 3 Cấp bậc mở khóa */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[#52606D] uppercase tracking-wider">
                  3 cấp bậc danh hiệu
                </h3>
                {tiers.map((tier) => {
                  const isSelected = activeTier.id === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedTierId(tier.id)}
                      className={`w-full text-left rounded-2xl p-4 border transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-white border-[#D96B38] ring-2 ring-[#D96B38]/20 shadow-sm'
                          : tier.unlocked
                            ? 'bg-white border-[#EBE5DC] hover:border-[#D96B38]/50'
                            : 'bg-white/60 border-[#EBE5DC] opacity-80'
                      }`}
                    >
                      <span
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                          tier.unlocked ? 'bg-[#FAF8F5]' : 'bg-[#EFECE6] grayscale'
                        }`}
                      >
                        {tier.emoji}
                      </span>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-bold text-[#1F2933]">
                            {tier.title}
                          </span>
                          {tier.unlocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3A6B5C] bg-[#3A6B5C]/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã mở khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7B8794] bg-[#EFECE6] px-2 py-0.5 rounded-full">
                              <Lock className="w-3 h-3" />
                              Chưa mở khóa
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#52606D] leading-relaxed">
                          {tier.requirement}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Đổi tên hiển thị trên Thẻ Huy Hiệu */}
              <div className="rounded-2xl bg-white border border-[#EBE5DC] p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#1F2933]">
                      Tên hiển thị trên Thẻ Story
                    </p>
                    <p className="text-xs text-[#3A6B5C] font-semibold">
                      {stats.displayName}
                    </p>
                  </div>
                  {!editingName && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftName(stats.displayName);
                        setEditingName(true);
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] hover:border-[#D96B38] text-xs font-semibold text-[#1F2933] inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#D96B38]" />
                      <span>Đổi tên trên thẻ</span>
                    </button>
                  )}
                </div>

                {editingName && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      maxLength={28}
                      placeholder="Nhập tên hoặc biệt danh của bạn..."
                      className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-sm focus:bg-white focus:outline-none focus:border-[#D96B38]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#3A6B5C] text-white text-xs font-semibold"
                    >
                      Lưu
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cột phải: Bản xem trước Thẻ Huy Hiệu tỉ lệ 9:16 chuẩn Instagram Story + Nút Tải PNG */}
            <div className="lg:col-span-5 flex flex-col items-center space-y-3.5">
              <div
                className="relative w-full max-w-[270px] aspect-[9/16] rounded-[28px] p-4 shadow-xl overflow-hidden flex flex-col justify-between text-center"
                style={{
                  background: `linear-gradient(155deg, ${activeTier.accentPrimary} 0%, #8A5E47 55%, ${activeTier.accentSecondary} 100%)`,
                }}
              >
                {/* Khung thẻ Kem Sáng bên trong chuẩn 9:16 */}
                <div className="relative z-10 h-full rounded-[22px] bg-[#FAF8F5] border border-[#D96B38]/30 px-4 py-5 flex flex-col items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-[#3A6B5C]/12 text-[#3A6B5C] text-[9px] font-bold tracking-wider">
                    GÓC THỢ QUANH TA · TP.HCM
                  </span>

                  <div className="space-y-2.5 flex flex-col items-center">
                    <div
                      className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center text-4xl border-4"
                      style={{ borderColor: activeTier.accentPrimary }}
                    >
                      {activeTier.emoji}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-[#D96B38] tracking-wide uppercase">
                        Chứng nhận đóng góp cộng đồng
                      </p>
                      <h4 className="text-lg font-extrabold text-[#1F2933] leading-tight">
                        {activeTier.title}
                      </h4>
                    </div>

                    <div className="w-full rounded-xl bg-white border border-[#E5DFD5] px-3 py-1.5">
                      <p className="text-[8px] font-semibold text-[#7B8794] uppercase">
                        Trao tặng cho
                      </p>
                      <p className="text-xs font-extrabold text-[#3A6B5C] truncate">
                        {stats.displayName}
                      </p>
                    </div>

                    <p className="text-[10px] text-[#52606D] leading-snug px-1">
                      {activeTier.subtitle}
                    </p>
                  </div>

                  <div className="w-full space-y-2.5">
                    <div className="rounded-xl bg-[#3A6B5C] text-white py-2.5 px-3">
                      <p className="text-2xl font-extrabold leading-none tabular-nums">
                        {totalActions}
                      </p>
                      <p className="text-[8px] font-semibold text-white/90 uppercase mt-1 tracking-wide">
                        Hành động gắn kết &amp; sống xanh
                      </p>
                    </div>

                    <p className="text-[10px] font-bold text-[#D96B38] leading-snug">
                      &ldquo;Hỏng đâu tìm đó – Gần nhau hơn mỗi ngày!&rdquo;
                    </p>
                  </div>
                </div>

                {/* Lớp khóa nhẹ nếu cấp bậc đang xem chưa mở khóa */}
                {!activeTier.unlocked && (
                  <div className="absolute inset-0 z-20 bg-[#1F2933]/45 backdrop-blur-[1.5px] flex flex-col items-center justify-center p-5 text-white text-center space-y-2">
                    <span className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </span>
                    <p className="text-xs font-bold">
                      Hoàn thành mục tiêu để mở khóa thẻ này
                    </p>
                    <p className="text-[11px] text-white/85 leading-relaxed">
                      {activeTier.requirement}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!activeTier.unlocked}
                onClick={() =>
                  downloadStoryBadgePng(
                    activeTier,
                    stats.displayName,
                    stats,
                    totalActions
                  )
                }
                className="w-full max-w-[270px] min-h-[46px] px-4 py-2.5 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] disabled:bg-[#CBD2D9] disabled:text-[#52606D] text-white text-xs sm:text-sm font-semibold shadow-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Tải ảnh Story (PNG)</span>
              </button>

              {!highestUnlocked && (
                <p className="text-[11px] text-[#3A6B5C] text-center flex items-center gap-1 max-w-[270px]">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Bấm &ldquo;Tôi đã đến sửa đồ ở đây&rdquo; hoặc viết 1 lời cảm ơn để mở khóa huy hiệu đầu tiên ngay!
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
