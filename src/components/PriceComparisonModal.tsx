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
      className="fixed inset-0 z-[75] bg-[#1F2933]/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl my-auto rounded-3xl bg-white border border-[#E8E2D9] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 bg-[#FAF8F5] border-b border-[#EBE5DC] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#D96B38]/12 text-[#D96B38] flex items-center justify-center shrink-0 mt-0.5">
              <Wallet className="w-5 h-5" />
            </span>
            <div className="space-y-1">
              <h2
                id="price-comparison-title"
                className="text-base sm:text-lg font-bold text-[#1F2933] leading-snug"
              >
                So sánh giá tiết kiệm tại Góc Thợ
              </h2>
              <p className="text-xs sm:text-sm text-[#52606D] leading-relaxed">
                Sửa ở góc thợ quen giúp bạn{' '}
                <strong className="text-[#3A6B5C]">
                  tiết kiệm trung bình 70% – 85%
                </strong>{' '}
                chi phí so với tiệm chuỗi hoặc mua mới.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng so sánh giá"
            className="w-9 h-9 rounded-xl text-[#52606D] hover:text-[#1F2933] hover:bg-[#EBE5DC]/70 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bảng so sánh 3 cột */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75dvh] overflow-y-auto thin-scrollbar">
          <div className="rounded-2xl border border-[#EBE5DC] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[480px]">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EBE5DC] text-[11px] sm:text-xs font-bold text-[#52606D] uppercase tracking-wide">
                    <th className="py-3 px-3.5 sm:px-4">Lỗi thường gặp</th>
                    <th className="py-3 px-3.5 sm:px-4 text-[#3A6B5C]">
                      Giá tại Góc Thợ Quanh Ta
                    </th>
                    <th className="py-3 px-3.5 sm:px-4 text-right">
                      Tiệm chuỗi / Mua mới
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {PRICE_COMPARISON_ROWS.map((row, index) => (
                    <tr
                      key={row.service}
                      className={
                        index % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]/50'
                      }
                    >
                      <td className="py-3.5 px-3.5 sm:px-4">
                        <p className="text-xs sm:text-sm font-semibold text-[#1F2933]">
                          {row.service}
                        </p>
                        <p className="text-[11px] font-semibold text-[#D96B38] mt-0.5">
                          {row.savingLabel}
                        </p>
                      </td>
                      <td className="py-3.5 px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-[#3A6B5C] tabular-nums whitespace-nowrap">
                        {row.artisanPrice}
                      </td>
                      <td className="py-3.5 px-3.5 sm:px-4 text-xs sm:text-sm text-[#7B8794] line-through decoration-[#C9BFAF] text-right tabular-nums whitespace-nowrap">
                        {row.retailPrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-[#3A6B5C]/8 border border-[#3A6B5C]/20 px-4 py-3 flex items-start gap-2.5 text-xs text-[#2B5347] leading-relaxed">
            <Sparkles className="w-4 h-4 text-[#3A6B5C] shrink-0 mt-0.5" />
            <p>
              Mỗi món đồ được sửa thay vì vứt bỏ không chỉ nhẹ ví tiền mà còn
              giúp giảm rác thải và tiếp thêm thu nhập trực tiếp cho cô chú thợ
              lành nghề quanh khu phố.
            </p>
          </div>

          <p className="text-[11px] sm:text-xs text-[#52606D] flex items-start gap-1.5 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-[#7B8794] shrink-0 mt-0.5" />
            <span>
              Mức giá tham khảo do cộng đồng Góc Thợ Quanh Ta tổng hợp thực tế
              tại TP.HCM. Giá có thể thay đổi tùy chất liệu và mức độ hư hỏng —
              bạn nhớ hỏi xác nhận giá với cô chú trước khi sửa nhé.
            </span>
          </p>
        </div>

        <div className="px-5 sm:px-6 py-3.5 bg-[#FAF8F5] border-t border-[#EBE5DC] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#1F2933] hover:bg-[#323F4B] text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            Đã hiểu, quay lại tìm thợ
          </button>
        </div>
      </div>
    </div>
  );
}
