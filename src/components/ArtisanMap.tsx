import { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Bike,
  Crosshair,
  Footprints,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Route,
  X,
} from 'lucide-react';
import { HCMC_DEFAULT_CENTER } from '../data/artisans';
import type {
  Artisan,
  CraftCategory,
  RouteInfo,
  TravelMode,
  UserLocation,
} from '../types/artisan';
import { formatDistanceMeters, formatDuration } from '../utils/geo';

interface ArtisanMapProps {
  artisans: Artisan[];
  selectedArtisan: Artisan | null;
  hoveredArtisanId: string | null;
  userLocation: UserLocation | null;
  isLocating: boolean;
  gpsError: string | null;
  routeInfo: RouteInfo | null;
  isRouting: boolean;
  travelMode: TravelMode;
  mobileMapVisible?: boolean;
  onSelectArtisan: (artisan: Artisan) => void;
  onLocateUser: () => void;
  onUseDemoLocation: () => void;
  onChangeTravelMode: (mode: TravelMode) => void;
  onClearRoute: () => void;
}

function getCategorySvg(category: CraftCategory): string {
  switch (category) {
    case 'Sửa giày dép':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M4 16c0-4 2-7 5-8l2 2c2 1.5 5 2 9 2.5V16H4z"/></svg>`;
    case 'May vá':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`;
    case 'Sửa khóa':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`;
    case 'Sửa đồng hồ':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M9.5 2h5"/><path d="M9.5 22h5"/></svg>`;
    case 'Sửa balo/túi':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M8 14h8"/></svg>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createArtisanDivIcon(
  artisan: Artisan,
  isSelected: boolean,
  isHovered: boolean
): L.DivIcon {
  const isHighlighted = isSelected || isHovered;
  const primaryCategory = artisan.categories[0] ?? 'Sửa giày dép';
  const iconSvg = getCategorySvg(primaryCategory);

  // Ghim mặc định: Xanh Chàm Cobalt #1B3B82 viền trắng sắc nét
  let bg = '#1B3B82';
  let text = '#F7F2E8';
  const border = '#FFFFFF';
  let iconBg = 'rgba(255,255,255,0.18)';
  const iconColor = '#FFFFFF';

  if (artisan.status === 'off_today') {
    iconBg = '#C47A24';
  } else if (artisan.status === 'relocated') {
    iconBg = '#B93818';
  }

  // Khi chọn hoặc hover: nổi bật Terracotta #D46534 kèm quầng sáng ấm
  if (isHighlighted) {
    bg = '#D46534';
    text = '#FFFFFF';
    iconBg = 'rgba(255,255,255,0.24)';
  }

  const scale = isSelected ? 1.12 : isHovered ? 1.07 : 1;
  const shadow = isHighlighted
    ? '0 0 0 6px rgba(212,101,52,0.22), 0 8px 20px rgba(212,101,52,0.4)'
    : '0 4px 12px rgba(37,41,46,0.26)';

  const firstName = artisan.name.split('–')[0]?.trim() || artisan.shortTitle;

  const html = `
    <div style="
      position: relative;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%) scale(${scale});
      transform-origin: bottom center;
      transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
    ">
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px 4px 5px;
        border-radius: 9999px;
        background: ${bg};
        color: ${text};
        border: 2px solid ${border};
        box-shadow: ${shadow};
        white-space: nowrap;
        font-family: 'Be Vietnam Pro', sans-serif;
      ">
        <span style="
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: ${iconBg};
          color: ${iconColor};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">${iconSvg}</span>
        <span style="display:flex; flex-direction:column; line-height:1.15;">
          <span style="font-size:11px; font-weight:700; letter-spacing:-0.01em;">${escapeHtml(firstName)}</span>
          <span style="font-family:'JetBrains Mono', monospace; font-size:9.5px; font-weight:600; opacity:0.92; font-variant-numeric: tabular-nums;">${escapeHtml(artisan.minPriceLabel)}</span>
        </span>
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 7px solid ${bg};
        margin-top: -1px;
        filter: drop-shadow(0 2px 2px rgba(37,41,46,0.2));
      "></div>
    </div>
  `;

  return L.divIcon({
    className: 'artisan-div-icon',
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function createUserLocationIcon(): L.DivIcon {
  const html = `
    <div style="position:relative; width:28px; height:28px; transform:translate(-50%,-50%); display:flex; align-items:center; justify-content:center;">
      <span class="gps-pulse-ring" style="position:absolute; width:26px; height:26px; border-radius:9999px; background:rgba(27,59,130,0.32);"></span>
      <span style="position:relative; width:16px; height:16px; border-radius:9999px; background:#1B3B82; border:3px solid #FFFFFF; box-shadow:0 2px 8px rgba(37,41,46,0.34);"></span>
    </div>
  `;
  return L.divIcon({
    className: 'user-gps-icon',
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export function ArtisanMap({
  artisans,
  selectedArtisan,
  hoveredArtisanId,
  userLocation,
  isLocating,
  gpsError,
  routeInfo,
  isRouting,
  travelMode,
  mobileMapVisible = true,
  onSelectArtisan,
  onLocateUser,
  onUseDemoLocation,
  onChangeTravelMode,
  onClearRoute,
}: ArtisanMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelectArtisan);

  useEffect(() => {
    onSelectRef.current = onSelectArtisan;
  }, [onSelectArtisan]);

  // Khởi tạo bản đồ Leaflet với OpenStreetMap chuẩn (KHÔNG dùng Carto)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [HCMC_DEFAULT_CENTER.lat, HCMC_DEFAULT_CENTER.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      userLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  // Làm mới kích thước bản đồ khi chuyển chế độ trên Mobile
  useEffect(() => {
    if (mobileMapVisible && mapRef.current) {
      const id = window.setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 120);
      return () => window.clearTimeout(id);
    }
  }, [mobileMapVisible]);

  // Cập nhật các ghim người thợ (custom HTML L.divIcon)
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    artisans.forEach((artisan) => {
      const isSelected = selectedArtisan?.id === artisan.id;
      const isHovered = hoveredArtisanId === artisan.id;

      const marker = L.marker(
        [artisan.coordinates.lat, artisan.coordinates.lng],
        {
          icon: createArtisanDivIcon(artisan, isSelected, isHovered),
          zIndexOffset: isSelected ? 1000 : isHovered ? 800 : 100,
          keyboard: true,
          title: artisan.name,
        }
      );

      marker.on('click', () => {
        onSelectRef.current(artisan);
      });

      marker.addTo(layer);
    });
  }, [artisans, selectedArtisan, hoveredArtisanId]);

  // Căn tâm khi chọn một người thợ (nếu chưa có lộ trình đang fitBounds)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedArtisan || routeInfo) return;

    map.flyTo(
      [selectedArtisan.coordinates.lat, selectedArtisan.coordinates.lng],
      Math.max(map.getZoom(), 15),
      { duration: 0.55 }
    );
  }, [selectedArtisan, routeInfo]);

  // Hiển thị vị trí GPS người dùng
  useEffect(() => {
    const layer = userLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();
    if (!userLocation) return;

    const marker = L.marker(
      [userLocation.coords.lat, userLocation.coords.lng],
      {
        icon: createUserLocationIcon(),
        zIndexOffset: 900,
        title: userLocation.label,
      }
    );
    marker.bindTooltip(userLocation.label, {
      direction: 'top',
      offset: [0, -14],
    });
    marker.addTo(layer);

    if (!routeInfo && !selectedArtisan) {
      map.flyTo([userLocation.coords.lat, userLocation.coords.lng], 15, {
        duration: 0.6,
      });
    }
  }, [userLocation, routeInfo, selectedArtisan]);

  // Vẽ đường đi thực tế (Polyline) từ GPS đến người thợ
  useEffect(() => {
    const layer = routeLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();
    if (!routeInfo || routeInfo.coordinates.length < 2) return;

    L.polyline(routeInfo.coordinates, {
      color: '#FFFFFF',
      weight: 9,
      opacity: 0.94,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layer);

    const routeLine = L.polyline(routeInfo.coordinates, {
      color: '#D46534',
      weight: 5,
      opacity: 0.96,
      dashArray:
        routeInfo.isFallback || routeInfo.travelMode === 'walking'
          ? '8 8'
          : undefined,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layer);

    const bounds = routeLine.getBounds();
    if (bounds.isValid()) {
      const isDesktop = window.innerWidth >= 768;
      map.fitBounds(bounds, {
        paddingTopLeft: isDesktop ? [396, 96] : [36, 152],
        paddingBottomRight: [56, 128],
        maxZoom: 16,
      });
    }
  }, [routeInfo]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full"
        aria-label="Bản đồ tương tác các cô chú thợ tại TP.HCM"
      />

      {/* Thanh thông tin lộ trình GPS khi đang vẽ đường đi */}
      {(routeInfo || isRouting) && selectedArtisan && (
        <div className="absolute top-[132px] left-3 right-3 md:top-[76px] md:left-[372px] lg:left-[392px] md:right-auto md:max-w-md z-[450] pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md border border-[#E8DFD1] rounded-2xl shadow-[0_8px_24px_rgba(37,41,46,0.12)] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-[#FDF0E9] text-[#D46534] border border-[#D46534]/20 flex items-center justify-center shrink-0">
                {isRouting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Route className="w-4 h-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="font-display text-xs font-bold text-[#25292E] truncate">
                  {isRouting
                    ? 'Đang tìm tuyến đường ngắn nhất...'
                    : `Đến ${selectedArtisan.shortTitle}`}
                </p>
                {routeInfo && !isRouting && (
                  <p className="font-mono text-[11px] text-[#615D57] tabular-nums">
                    <span className="font-bold text-[#D46534]">
                      {formatDistanceMeters(routeInfo.distanceMeters)}
                    </span>
                    {' · '}
                    <span>khoảng {formatDuration(routeInfo.durationSeconds)}</span>
                    {routeInfo.isFallback && ' (ước lượng)'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="inline-flex p-0.5 rounded-xl bg-[#F7F2E8] border border-[#E8DFD1]">
                <button
                  type="button"
                  onClick={() => onChangeTravelMode('driving')}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                    travelMode === 'driving'
                      ? 'bg-[#1B3B82] text-[#F7F2E8]'
                      : 'text-[#615D57] hover:text-[#25292E]'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Xe máy</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTravelMode('walking')}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                    travelMode === 'walking'
                      ? 'bg-[#1B3B82] text-[#F7F2E8]'
                      : 'text-[#615D57] hover:text-[#25292E]'
                  }`}
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>Đi bộ</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClearRoute}
                aria-label="Đóng lộ trình"
                className="w-8 h-8 rounded-lg text-[#615D57] hover:text-[#25292E] hover:bg-[#F7F2E8] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cụm nút Zoom (+/-) & Định vị GPS tối giản ở góc dưới bên phải */}
      <div className="absolute right-3.5 md:right-4 bottom-36 md:bottom-20 lg:bottom-6 z-[450] flex flex-col items-end gap-2.5 pointer-events-none">
        {gpsError && !userLocation && (
          <div className="pointer-events-auto max-w-[235px] bg-white/95 backdrop-blur-md border border-[#E8DFD1] rounded-2xl shadow-md p-2.5 text-[11px] text-[#615D57] space-y-1.5">
            <p className="leading-snug">{gpsError}</p>
            <button
              type="button"
              onClick={onUseDemoLocation}
              className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] text-[#F7F2E8] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Dùng mốc trung tâm TP.HCM</span>
            </button>
          </div>
        )}

        {/* Nút định vị GPS tròn tối giản */}
        <button
          type="button"
          onClick={onLocateUser}
          disabled={isLocating}
          aria-label="Định vị GPS của tôi"
          title={
            isLocating
              ? 'Đang dò vị trí GPS...'
              : userLocation
                ? userLocation.source === 'gps'
                  ? 'Đã định vị GPS — bấm để cập nhật lại'
                  : 'Đang dùng mốc trung tâm — bấm để dò GPS'
                : 'Định vị GPS của tôi'
          }
          className={`pointer-events-auto w-10 h-10 rounded-full border inline-flex items-center justify-center transition-all duration-150 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] ${
            userLocation?.source === 'gps'
              ? 'bg-[#4F6B54] text-white border-[#4F6B54]'
              : userLocation
                ? 'bg-[#1B3B82] text-[#F7F2E8] border-[#1B3B82]'
                : 'bg-white/95 backdrop-blur-md text-[#25292E] border-[#E8DFD1] hover:border-[#4F6B54] hover:text-[#4F6B54]'
          }`}
        >
          {isLocating ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <Crosshair className="w-4.5 h-4.5" />
          )}
        </button>

        {/* Cụm nút Zoom + / - tối giản */}
        <div
          role="group"
          aria-label="Thu phóng bản đồ"
          className="pointer-events-auto flex flex-col bg-white/95 backdrop-blur-md border border-[#E8DFD1] rounded-2xl shadow-md overflow-hidden"
        >
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            aria-label="Phóng to bản đồ"
            title="Phóng to"
            className="w-10 h-10 flex items-center justify-center text-[#25292E] hover:bg-[#F7F2E8] hover:text-[#D46534] border-b border-[#E8DFD1] transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            aria-label="Thu nhỏ bản đồ"
            title="Thu nhỏ"
            className="w-10 h-10 flex items-center justify-center text-[#25292E] hover:bg-[#F7F2E8] hover:text-[#D46534] transition-colors"
          >
            <Minus className="w-4 h-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
