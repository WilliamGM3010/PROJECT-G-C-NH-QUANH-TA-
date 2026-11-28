import { useEffect } from 'react';
import { Info, Sparkles, Wallet, X } from 'lucide-react';

interface PriceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ComparisonRow {
  service: string;
  artisanPrice: string;
  retailPrice: string;
  savingLabel: string;
}

const PRICE_COMPARISON_ROWS: ComparisonRow[] = [
  {
    service: 'Dán đế / khâu giày',
    artisanPrice: '20.000 – 45.000đ',
    retailPrice: '150.000 – 800.000đ',
    savingLabel: 'Tiết kiệm ~80%',
  },
  {
    service: 'Thay dây kéo balo / áo khoác',
    artisanPrice: '25.000 – 50.000đ',
    retailPrice: '150.000 – 450.000đ',
    savingLabel: 'Tiết kiệm ~80%',
  },
  {
    service: 'Lên lai / sửa form quần áo',
    artisanPrice: '15.000 – 40.000đ',
    retailPrice: '90.000 – 350.000đ',
    savingLabel: 'Tiết kiệm ~75%',
  },
  {
    service: 'Đánh chìa / sửa khóa',
    artisanPrice: '10.000 – 35.000đ',
    retailPrice: '80.000 – 250.000đ',
    savingLabel: 'Tiết kiệm ~85%',
  },
  {
    service: 'Thay pin / dây đồng hồ',
    artisanPrice: '25.000 – 60.000đ',
    retailPrice: '150.000 – 500.000đ',
    savingLabel: 'Tiết kiệm ~80%',
  },
  {
    service: 'Sửa quạt / nồi cơm điện',
    artisanPrice: '30.000 – 80.000đ',
    retailPrice: '250.000 – 750.000đ',
    savingLabel: 'Tiết kiệm ~85%',
  },
];

export function PriceComparisonModal({
  isOpen,
  onClose,
}: PriceComparisonModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-comparison-title"
      className="fixed inset-0 z-[75] bg-[#25292E]/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl my-auto rounded-3xl bg-white border border-[#E8DFD1] shadow-2xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 bg-[#F7F2E8] border-b border-dashed border-[#DFD3C2] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#FDF0E9] border border-[#D46534]/20 text-[#D46534] flex items-center justify-center shrink-0 mt-0.5">
              <Wallet className="w-5 h-5" />
            </span>
            <div className="space-y-1">
              <h2
                id="price-comparison-title"
                className="font-display text-base sm:text-lg font-extrabold text-[#25292E] leading-snug"
              >
                So sánh giá tiết kiệm tại Góc Thợ
              </h2>
              <p className="text-xs sm:text-sm text-[#615D57] leading-relaxed">
                Sửa ở góc thợ quen giúp bạn{' '}
                <strong className="font-mono text-[#1B3B82]">
                  tiết kiệm 70% – 85%
                </strong>{' '}
                chi phí so với tiệm chuỗi hoặc mua mới.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng so sánh giá"
            className="w-9 h-9 rounded-xl text-[#615D57] hover:text-[#25292E] hover:bg-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[75dvh] overflow-y-auto thin-scrollbar">
          <div className="rounded-2xl border border-dashed border-[#DFD3C2] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[480px]">
                <thead>
                  <tr className="bg-[#F7F2E8] border-b border-dashed border-[#DFD3C2] font-mono text-[11px] font-bold text-[#615D57] uppercase tracking-wide">
                    <th className="py-3 px-3.5 sm:px-4">Lỗi thường gặp</th>
                    <th className="py-3 px-3.5 sm:px-4 text-[#1B3B82]">
                      Giá tại Góc Thợ
                    </th>
                    <th className="py-3 px-3.5 sm:px-4 text-right">
                      Tiệm chuỗi / Mua mới
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-[#DFD3C2]">
                  {PRICE_COMPARISON_ROWS.map((row, index) => (
                    <tr
                      key={row.service}
                      className={
                        index % 2 === 0 ? 'bg-white' : 'bg-[#F7F2E8]/60'
                      }
                    >
                      <td className="py-3.5 px-3.5 sm:px-4">
                        <p className="text-xs sm:text-sm font-semibold text-[#25292E]">
                          {row.service}
                        </p>
                        <p className="font-mono text-[11px] font-bold text-[#4F6B54] mt-0.5">
                          {row.savingLabel}
                        </p>
                      </td>
                      <td className="py-3.5 px-3.5 sm:px-4 font-mono text-xs sm:text-sm font-bold text-[#D46534] tabular-nums whitespace-nowrap">
                        {row.artisanPrice}
                      </td>
                      <td className="py-3.5 px-3.5 sm:px-4 font-mono text-xs sm:text-sm text-[#8A847C] line-through decoration-[#B93818]/45 text-right tabular-nums whitespace-nowrap">
                        {row.retailPrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-[#EDF3EE] border border-[#4F6B54]/20 px-4 py-3 flex items-start gap-2.5 text-xs text-[#25292E] leading-relaxed">
            <Sparkles className="w-4 h-4 text-[#4F6B54] shrink-0 mt-0.5" />
            <p>
              Mỗi món đồ được sửa thay vì vứt bỏ không chỉ nhẹ ví tiền mà còn
              giúp giảm rác thải và tiếp thêm thu nhập trực tiếp cho cô chú thợ
              lành nghề quanh khu phố.
            </p>
          </div>

          <p className="text-[11px] sm:text-xs text-[#615D57] flex items-start gap-1.5 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-[#8A847C] shrink-0 mt-0.5" />
            <span>
              Mức giá tham khảo do cộng đồng Góc Thợ Quanh Ta tổng hợp thực tế
              tại TP.HCM. Giá có thể thay đổi tùy chất liệu và mức độ hư hỏng —
              bạn nhớ hỏi xác nhận giá với cô chú trước khi sửa nhé.
            </span>
          </p>
        </div>

        <div className="px-5 sm:px-6 py-3.5 bg-[#F7F2E8] border-t border-dashed border-[#DFD3C2] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 py-2 rounded-full bg-[#1B3B82] hover:bg-[#142D66] text-[#F7F2E8] text-xs sm:text-sm font-bold transition-colors"
          >
            Đã hiểu, quay lại tìm thợ
          </button>
        </div>
      </div>
    </div>
  );
}
