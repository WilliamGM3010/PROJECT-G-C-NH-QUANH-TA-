import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronDown,
  MapPin,
  PlusCircle,
  Search,
  X,
} from 'lucide-react';
import {
  HCMC_ADMINISTRATIVE_UNITS,
  HCMC_DAC_KHU,
  HCMC_PHUONG,
  HCMC_XA,
  matchesAdminUnitQuery,
} from '../data/hcmcLocations';
import type { Artisan } from '../types/artisan';

export interface LocationSelectorProps {
  mode: 'filter' | 'input';
  value: string;
  onChange: (nextValue: string) => void;
  /** Danh sách góc thợ công khai để thống kê nhóm "Đang có góc thợ" trong mode="filter" */
  artisans?: Artisan[];
  /** Callback chuyển sang mục Gợi ý góc thợ cho khu vực chưa có thợ */
  onSuggestArtisan?: () => void;
  /** Kiểu nút hiển thị: pill (Floating Map), inline (Thanh tìm kiếm Trang chủ), form (Form nhập liệu) */
  variant?: 'pill' | 'inline' | 'form';
  /** Căn lề menu thả xuống */
  align?: 'left' | 'right';
  id?: string;
  placeholder?: string;
  className?: string;
}

const ALL_LOCATIONS_VALUE = 'Tất cả khu vực';

export function LocationSelector({
  mode,
  value,
  onChange,
  artisans = [],
  onSuggestArtisan,
  variant = mode === 'input' ? 'form' : 'pill',
  align = 'left',
  id,
  placeholder,
  className = '',
}: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const isFilterActive =
    mode === 'filter' && value !== '' && value !== ALL_LOCATIONS_VALUE;

  // Tổng hợp các khu vực đang có góc thợ trên Supabase (mode="filter")
  const activeDistrictEntries = useMemo(() => {
    if (mode !== 'filter') return [];
    const counts = new Map<string, number>();
    for (const artisan of artisans) {
      const loc = (artisan.district || '').trim();
      if (!loc) continue;
      counts.set(loc, (counts.get(loc) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name, 'vi');
      });
  }, [artisans, mode]);

  const activeDistrictNameSet = useMemo(
    () => new Set(activeDistrictEntries.map((e) => e.name)),
    [activeDistrictEntries]
  );

  // Lọc nhóm 1 (Đang có góc thợ) và nhóm 2 (Các phường, xã, đặc khu khác) cho mode="filter"
  const filteredActiveEntries = useMemo(
    () =>
      activeDistrictEntries.filter((entry) =>
        matchesAdminUnitQuery(entry.name, query)
      ),
    [activeDistrictEntries, query]
  );

  const filteredOtherUnits = useMemo(() => {
    if (mode !== 'filter') return [];
    return HCMC_ADMINISTRATIVE_UNITS.filter(
      (unit) =>
        !activeDistrictNameSet.has(unit) && matchesAdminUnitQuery(unit, query)
    );
  }, [mode, activeDistrictNameSet, query]);

  // Lọc 3 nhóm hành chính (Phường / Xã / Đặc khu) cho mode="input"
  const filteredPhuong = useMemo(
    () => HCMC_PHUONG.filter((u) => matchesAdminUnitQuery(u, query)),
    [query]
  );
  const filteredXa = useMemo(
    () => HCMC_XA.filter((u) => matchesAdminUnitQuery(u, query)),
    [query]
  );
  const filteredDacKhu = useMemo(
    () => HCMC_DAC_KHU.filter((u) => matchesAdminUnitQuery(u, query)),
    [query]
  );

  // Tính tọa độ dropdown neo theo nút bấm (dùng Portal để không bị cắt bởi overflow-x-auto hay modal)
  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const desiredWidth = Math.min(
      Math.max(rect.width, mode === 'input' ? 310 : 320),
      viewportW - 24
    );

    let left = align === 'right' ? rect.right - desiredWidth : rect.left;
    if (left + desiredWidth > viewportW - 12) {
      left = viewportW - desiredWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    const estimatedMenuHeight = 360;
    const spaceBelow = viewportH - rect.bottom - 12;
    const top =
      spaceBelow >= 220 || spaceBelow >= rect.top
        ? rect.bottom + 6
        : Math.max(12, rect.top - Math.min(estimatedMenuHeight, rect.top - 12) - 6);

    setMenuPos({ top, left, width: desiredWidth });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSelect = (nextVal: string) => {
    onChange(nextVal);
    setOpen(false);
    setQuery('');
  };

  const handleClearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(ALL_LOCATIONS_VALUE);
    setQuery('');
  };

  const displayLabel =
    mode === 'filter'
      ? isFilterActive
        ? value
        : (placeholder ?? 'Tất cả khu vực')
      : value || (placeholder ?? 'Chọn Phường / Xã / Đặc khu');

  const triggerClasses =
    variant === 'pill'
      ? `h-9 rounded-full px-3.5 text-xs md:text-[13px] font-medium inline-flex items-center gap-1.5 transition-all shrink-0 max-w-[230px] ${
          isFilterActive
            ? 'bg-[#1B3B82] border border-[#1B3B82] text-white shadow-sm'
            : 'bg-white/95 backdrop-blur-sm border border-[#25292E]/20 text-[#25292E] hover:border-[#25292E]/55 shadow-xs'
        }`
      : variant === 'inline'
        ? `h-9 rounded-xl px-2.5 text-xs font-medium inline-flex items-center gap-1.5 transition-colors max-w-[185px] ${
            isFilterActive
              ? 'bg-[#EEF2FA] text-[#1B3B82] border border-[#1B3B82]/30 font-semibold'
              : 'bg-[#F7F2E8] hover:bg-[#EFE7D8] text-[#25292E] border border-transparent'
          }`
        : `w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm flex items-center justify-between gap-2 text-left transition-colors ${
            open
              ? 'bg-white border-[#1B3B82] ring-2 ring-[#1B3B82]/12'
              : 'bg-[#F7F2E8] border-[#E8DFD1] hover:border-[#1B3B82]/45 text-[#25292E]'
          }`;

  const dropdownContent =
    open && menuPos
      ? createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              width: `${menuPos.width}px`,
            }}
            className="z-[1200] rounded-2xl bg-white border border-[#E8DFD1] shadow-[0_14px_38px_rgba(37,41,46,0.18)] overflow-hidden flex flex-col max-h-[min(390px,calc(100vh-100px))]"
          >
            {/* Ô gõ lọc nhanh không dấu tiếng Việt */}
            <div className="p-2.5 border-b border-[#E8DFD1] bg-[#FAF6EE]/80 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-[#8E877E] absolute left-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Gõ tên phường, xã, đặc khu (VD: thanh my, con dao)..."
                  aria-label="Tìm Phường, Xã, Đặc khu"
                  className="w-full h-9 pl-8 pr-8 rounded-xl bg-white border border-[#E8DFD1] text-xs text-[#25292E] placeholder:text-[#8E877E] focus:outline-none focus:border-[#1B3B82]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Xóa từ khóa lọc khu vực"
                    className="absolute right-2 w-5 h-5 rounded-full text-[#8E877E] hover:text-[#25292E] hover:bg-[#F7F2E8] flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách lựa chọn cuộn dọc */}
            <div className="flex-1 overflow-y-auto thin-scrollbar p-1.5 space-y-1">
              {mode === 'filter' ? (
                <>
                  {/* Tùy chọn Tất cả khu vực */}
                  {!query.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSelect(ALL_LOCATIONS_VALUE)}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2 transition-colors ${
                        !isFilterActive
                          ? 'bg-[#EEF2FA] text-[#1B3B82]'
                          : 'text-[#25292E] hover:bg-[#F7F2E8]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#D46534] shrink-0" />
                        <span>Tất cả khu vực</span>
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-[#615D57] tabular-nums">
                        {artisans.length}
                      </span>
                    </button>
                  )}

                  {/* Nhóm 1: Đang có góc thợ */}
                  {filteredActiveEntries.length > 0 && (
                    <div className="pt-1">
                      <p className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#4F6B54]">
                        Đang có góc thợ ({filteredActiveEntries.length})
                      </p>
                      <div className="space-y-0.5">
                        {filteredActiveEntries.map((entry) => {
                          const selected = value === entry.name;
                          return (
                            <button
                              key={entry.name}
                              type="button"
                              onClick={() => handleSelect(entry.name)}
                              className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-colors ${
                                selected
                                  ? 'bg-[#1B3B82] text-white font-semibold'
                                  : 'text-[#25292E] hover:bg-[#F7F2E8] font-medium'
                              }`}
                            >
                              <span className="truncate">{entry.name}</span>
                              <span
                                className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 ${
                                  selected
                                    ? 'text-white/90'
                                    : 'text-[#615D57]'
                                }`}
                              >
                                · {entry.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Nhóm 2: Các phường, xã, đặc khu khác trong 168 đơn vị */}
                  {filteredOtherUnits.length > 0 && (
                    <div className="pt-1.5 border-t border-dashed border-[#E8DFD1] mt-1">
                      <p className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#8E877E]">
                        Các phường, xã, đặc khu khác ({filteredOtherUnits.length})
                      </p>
                      <div className="space-y-0.5">
                        {(query.trim()
                          ? filteredOtherUnits
                          : filteredOtherUnits.slice(0, 40)
                        ).map((unit) => {
                          const selected = value === unit;
                          return (
                            <div
                              key={unit}
                              className={`px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 transition-colors ${
                                selected
                                  ? 'bg-[#EEF2FA]'
                                  : 'hover:bg-[#FAF6EE]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleSelect(unit)}
                                className="flex-1 min-w-0 text-left flex items-center gap-2"
                              >
                                <span
                                  className={`text-xs truncate ${
                                    selected
                                      ? 'font-semibold text-[#1B3B82]'
                                      : 'text-[#615D57]'
                                  }`}
                                >
                                  {unit}
                                </span>
                                <span className="text-[10px] text-[#9A9287] shrink-0">
                                  Chưa có thợ
                                </span>
                              </button>
                              {onSuggestArtisan && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen(false);
                                    setQuery('');
                                    onSuggestArtisan();
                                  }}
                                  className="px-2 py-1 rounded-lg bg-[#FDF0E9] hover:bg-[#D46534] text-[#D46534] hover:text-white text-[10px] font-semibold inline-flex items-center gap-1 shrink-0 transition-colors"
                                >
                                  <PlusCircle className="w-3 h-3" />
                                  <span>Gợi ý</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                        {!query.trim() && filteredOtherUnits.length > 40 && (
                          <p className="px-3 py-1.5 text-[11px] text-[#8E877E] text-center">
                            Gõ tên vào ô phía trên để tìm nhanh trong toàn bộ 168 đơn vị.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {filteredActiveEntries.length === 0 &&
                    filteredOtherUnits.length === 0 && (
                      <p className="px-3 py-6 text-center text-xs text-[#615D57]">
                        Không tìm thấy Phường / Xã / Đặc khu phù hợp với “{query}”.
                      </p>
                    )}
                </>
              ) : (
                <>
                  {/* Chế độ mode="input": đủ 168 đơn vị chia 3 nhóm PHƯỜNG / XÃ / ĐẶC KHU */}
                  {value &&
                    !HCMC_ADMINISTRATIVE_UNITS.includes(value) &&
                    matchesAdminUnitQuery(value, query) && (
                      <div className="pb-1 border-b border-dashed border-[#E8DFD1] mb-1">
                        <p className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#8E877E]">
                          Giá trị hiện tại
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSelect(value)}
                          className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold bg-[#EEF2FA] text-[#1B3B82] flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{value}</span>
                          <Check className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    )}

                  {filteredPhuong.length > 0 && (
                    <div>
                      <p className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1B3B82] bg-[#FAF6EE]/95 sticky top-0">
                        PHƯỜNG ({filteredPhuong.length})
                      </p>
                      <div className="space-y-0.5 mt-0.5">
                        {filteredPhuong.map((unit) => {
                          const selected = value === unit;
                          return (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => handleSelect(unit)}
                              className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-colors ${
                                selected
                                  ? 'bg-[#1B3B82] text-white font-semibold'
                                  : 'text-[#25292E] hover:bg-[#F7F2E8]'
                              }`}
                            >
                              <span className="truncate">{unit}</span>
                              {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {filteredXa.length > 0 && (
                    <div className="pt-1">
                      <p className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#4F6B54] bg-[#FAF6EE]/95 sticky top-0">
                        XÃ ({filteredXa.length})
                      </p>
                      <div className="space-y-0.5 mt-0.5">
                        {filteredXa.map((unit) => {
                          const selected = value === unit;
                          return (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => handleSelect(unit)}
                              className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-colors ${
                                selected
                                  ? 'bg-[#1B3B82] text-white font-semibold'
                                  : 'text-[#25292E] hover:bg-[#F7F2E8]'
                              }`}
                            >
                              <span className="truncate">{unit}</span>
                              {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {filteredDacKhu.length > 0 && (
                    <div className="pt-1">
                      <p className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#D46534] bg-[#FAF6EE]/95 sticky top-0">
                        ĐẶC KHU ({filteredDacKhu.length})
                      </p>
                      <div className="space-y-0.5 mt-0.5">
                        {filteredDacKhu.map((unit) => {
                          const selected = value === unit;
                          return (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => handleSelect(unit)}
                              className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-colors ${
                                selected
                                  ? 'bg-[#1B3B82] text-white font-semibold'
                                  : 'text-[#25292E] hover:bg-[#F7F2E8]'
                              }`}
                            >
                              <span className="truncate">{unit}</span>
                              {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {filteredPhuong.length === 0 &&
                    filteredXa.length === 0 &&
                    filteredDacKhu.length === 0 && (
                      <p className="px-3 py-6 text-center text-xs text-[#615D57]">
                        Không tìm thấy đơn vị hành chính khớp với “{query}”.
                      </p>
                    )}
                </>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={triggerRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={triggerClasses}
      >
        <span className="inline-flex items-center gap-1.5 min-w-0">
          {variant !== 'inline' && (
            <MapPin
              className={`w-3.5 h-3.5 shrink-0 ${
                isFilterActive && variant === 'pill'
                  ? 'text-white/90'
                  : 'text-[#D46534]'
              }`}
            />
          )}
          <span className="truncate">{displayLabel}</span>
        </span>

        {isFilterActive ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Xóa lọc khu vực"
            onClick={handleClearFilter}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(ALL_LOCATIONS_VALUE);
                setQuery('');
              }
            }}
            className={`w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0 transition-colors ${
              variant === 'pill'
                ? 'bg-white/20 hover:bg-white/35 text-white'
                : 'bg-[#1B3B82]/12 hover:bg-[#1B3B82]/22 text-[#1B3B82]'
            }`}
          >
            <X className="w-2.5 h-2.5" />
          </span>
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform ${
              open ? 'rotate-180' : ''
            } ${variant === 'pill' ? 'text-[#615D57]' : 'text-[#615D57]'}`}
          />
        )}
      </button>

      {dropdownContent}
    </div>
  );
}
