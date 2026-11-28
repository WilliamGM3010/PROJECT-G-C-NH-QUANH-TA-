import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { HCMC_DEFAULT_CENTER } from '../data/artisans';
import type { Artisan, UserLocation } from '../types/artisan';

interface HomeMiniMapProps {
  artisans: Artisan[];
  userLocation: UserLocation | null;
  onSelectArtisan: (artisan: Artisan) => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createMiniPinIcon(artisan: Artisan): L.DivIcon {
  const firstName = artisan.name.split(/[–-]/)[0]?.trim() || artisan.shortTitle;
  const html = `
    <div style="
      position: relative;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
      pointer-events: auto;
    ">
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 9px;
        border-radius: 9999px;
        background: #1B3B82;
        color: #F7F2E8;
        border: 2px solid #FFFFFF;
        box-shadow: 0 4px 12px rgba(27,59,130,0.32);
        white-space: nowrap;
        font-family: 'Be Vietnam Pro', sans-serif;
        font-size: 11px;
        font-weight: 700;
      ">
        <span style="width:6px;height:6px;border-radius:9999px;background:#D46534;flex-shrink:0;"></span>
        <span>${escapeHtml(firstName)}</span>
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid #1B3B82;
        margin-top: -1px;
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

function createMiniUserIcon(): L.DivIcon {
  const html = `
    <div style="position:relative; width:24px; height:24px; transform:translate(-50%,-50%); display:flex; align-items:center; justify-content:center;">
      <span class="gps-pulse-ring" style="position:absolute; width:22px; height:22px; border-radius:9999px; background:rgba(212,101,52,0.3);"></span>
      <span style="position:relative; width:13px; height:13px; border-radius:9999px; background:#D46534; border:2.5px solid #FFFFFF; box-shadow:0 2px 6px rgba(37,41,46,0.3);"></span>
    </div>
  `;
  return L.divIcon({
    className: 'user-gps-icon',
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/**
 * Bản đồ tương tác thu gọn trên Trang chủ ("Quanh khu vực của bạn"):
 * - Dùng OpenStreetMap chuẩn (KHÔNG dùng Carto)
 * - Tự động dọn sạch map instance khi unmount
 */
export function HomeMiniMap({
  artisans,
  userLocation,
  onSelectArtisan,
}: HomeMiniMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelectArtisan);

  useEffect(() => {
    onSelectRef.current = onSelectArtisan;
  }, [onSelectArtisan]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [HCMC_DEFAULT_CENTER.lat, HCMC_DEFAULT_CENTER.lng],
      zoom: 13,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);
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
    };
  }, []);

  useEffect(() => {
    const layer = markersLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();
    const visible = artisans.slice(0, 12);

    const bounds: [number, number][] = [];
    visible.forEach((artisan) => {
      bounds.push([artisan.coordinates.lat, artisan.coordinates.lng]);
      const marker = L.marker(
        [artisan.coordinates.lat, artisan.coordinates.lng],
        {
          icon: createMiniPinIcon(artisan),
          title: artisan.name,
        }
      );
      marker.on('click', () => onSelectRef.current(artisan));
      marker.addTo(layer);
    });

    if (userLocation) {
      bounds.push([userLocation.coords.lat, userLocation.coords.lng]);
    }

    if (bounds.length >= 2) {
      map.fitBounds(L.latLngBounds(bounds), {
        padding: [36, 36],
        maxZoom: 14,
      });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }, [artisans, userLocation]);

  useEffect(() => {
    const layer = userLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!userLocation) return;

    L.marker([userLocation.coords.lat, userLocation.coords.lng], {
      icon: createMiniUserIcon(),
      zIndexOffset: 900,
      title: userLocation.label,
    }).addTo(layer);
  }, [userLocation]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border border-[#E8DFD1] bg-[#EFE8DB]"
      aria-label="Bản đồ thu gọn các góc thợ quanh khu vực của bạn"
    />
  );
}
