import type {
  Artisan,
  Coordinates,
  PendingSuggestion,
  TravelMode,
} from '../types/artisan';

/**
 * Chuẩn hóa chuỗi tiếng Việt không dấu để tìm kiếm tự nhiên.
 */
export function normalizeVietnamese(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tính khoảng cách thực tế (km) bằng công thức Haversine.
 */
export function calculateDistanceKm(from: Coordinates, to: Coordinates): number {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistanceKm(km: number): string {
  if (km < 1) {
    const meters = Math.max(50, Math.round((km * 1000) / 10) * 10);
    return `${meters}m`;
  }
  return `${km.toFixed(1)}km`;
}

export function formatCompactDistance(km: number): string {
  if (km < 1) {
    const meters = Math.max(20, Math.round((km * 1000) / 10) * 10);
    return `${meters} m`;
  }
  return `${km.toFixed(1)} km`;
}

export function formatDistanceWithPrefix(km: number): string {
  return `Cách ${formatDistanceKm(km)}`;
}

export function formatDistanceMeters(meters: number): string {
  if (meters < 1000) {
    return `${Math.max(10, Math.round(meters / 10) * 10)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

export interface DuplicateMatch {
  artisan: Artisan;
  distanceMeters: number | null;
  reason: 'distance' | 'name' | 'both';
}

function getCoreNameTokens(name: string): string[] {
  const firstPart = name.split(/[–-]/)[0] ?? name;
  return normalizeVietnamese(firstPart)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !['chu', 'co', 'bac', 'anh', 'chi', 'ong', 'ba', 'sua'].includes(t));
}

/**
 * Phát hiện nghi ngờ trùng lặp khi Admin duyệt đề xuất mới:
 * - Cùng danh mục dịch vụ và nằm trong bán kính <= 200m (theo Haversine), HOẶC
 * - Trùng tên gọi tương tự cùng khu vực / danh mục.
 */
export function findPotentialDuplicates(
  pending: Pick<PendingSuggestion, 'name' | 'categories' | 'district' | 'coordinates'>,
  existingArtisans: Artisan[],
  radiusMeters = 200
): DuplicateMatch[] {
  const pendingTokens = getCoreNameTokens(pending.name);
  const pendingNameNorm = normalizeVietnamese(pending.name.split(/[–-]/)[0] ?? pending.name);
  const matches: DuplicateMatch[] = [];

  for (const artisan of existingArtisans) {
    const sharesCategory = pending.categories.some((cat) =>
      artisan.categories.includes(cat)
    );

    let distanceMeters: number | null = null;
    if (pending.coordinates) {
      distanceMeters = Math.round(
        calculateDistanceKm(pending.coordinates, artisan.coordinates) * 1000
      );
    }

    const isNearSameCategory =
      sharesCategory && distanceMeters !== null && distanceMeters <= radiusMeters;

    const artisanFirstNorm = normalizeVietnamese(
      artisan.name.split(/[–-]/)[0] ?? artisan.name
    );
    const artisanTokens = getCoreNameTokens(artisan.name);
    const hasCommonToken =
      pendingTokens.length > 0 &&
      pendingTokens.some((tok) => artisanTokens.includes(tok));

    const isSimilarName =
      (pendingNameNorm.length >= 4 &&
        (artisanFirstNorm.includes(pendingNameNorm) ||
          pendingNameNorm.includes(artisanFirstNorm))) ||
      (hasCommonToken && sharesCategory && pending.district === artisan.district);

    if (isNearSameCategory || isSimilarName) {
      matches.push({
        artisan,
        distanceMeters,
        reason:
          isNearSameCategory && isSimilarName
            ? 'both'
            : isNearSameCategory
              ? 'distance'
              : 'name',
      });
    }
  }

  return matches.sort((a, b) => {
    const da = a.distanceMeters ?? Number.POSITIVE_INFINITY;
    const db = b.distanceMeters ?? Number.POSITIVE_INFINITY;
    return da - db;
  });
}

export async function fetchStreetRoute(
  origin: Coordinates,
  destination: Coordinates,
  travelMode: TravelMode,
  signal?: AbortSignal
): Promise<{
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  isFallback: boolean;
}> {
  const profile = travelMode === 'walking' ? 'foot' : 'driving';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  const timeoutController = new AbortController();
  const timer = window.setTimeout(() => timeoutController.abort(), 7000);

  const combinedAbort = () => timeoutController.abort();
  if (signal) {
    signal.addEventListener('abort', combinedAbort, { once: true });
  }

  try {
    const response = await fetch(url, { signal: timeoutController.signal });
    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}`);
    }
    const data = await response.json();
    const route = data?.routes?.[0];
    const coords: [number, number][] | undefined = route?.geometry?.coordinates?.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    );

    if (!route || !coords || coords.length < 2) {
      throw new Error('Không tìm thấy tuyến đường');
    }

    const distanceMeters: number = route.distance;
    const rawDuration: number = route.duration;
    const urbanDuration =
      travelMode === 'walking'
        ? Math.max(60, Math.round(distanceMeters / 1.25))
        : Math.max(60, Math.round(Math.max(rawDuration, distanceMeters / 6.2)));

    return {
      coordinates: coords,
      distanceMeters,
      durationSeconds: urbanDuration,
      isFallback: false,
    };
  } catch {
    const straightKm = calculateDistanceKm(origin, destination);
    const estRoadMeters = Math.round(straightKm * 1280);
    const speedMps = travelMode === 'walking' ? 1.25 : 6.0;
    const midLat = (origin.lat + destination.lat) / 2 + 0.0006;
    const midLng = (origin.lng + destination.lng) / 2 - 0.0005;

    return {
      coordinates: [
        [origin.lat, origin.lng],
        [midLat, midLng],
        [destination.lat, destination.lng],
      ],
      distanceMeters: estRoadMeters,
      durationSeconds: Math.max(60, Math.round(estRoadMeters / speedMps)),
      isFallback: true,
    };
  } finally {
    window.clearTimeout(timer);
    if (signal) {
      signal.removeEventListener('abort', combinedAbort);
    }
  }
}

export function buildGoogleMapsDirectionsUrl(
  destination: Coordinates,
  origin?: Coordinates | null,
  travelMode: TravelMode = 'driving'
): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.lat},${destination.lng}`,
    travelmode: travelMode === 'walking' ? 'walking' : 'driving',
  });
  if (origin) {
    params.set('origin', `${origin.lat},${origin.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildArtisanDeepLink(artisanId: string): string {
  if (typeof window === 'undefined') return `?tho=${encodeURIComponent(artisanId)}`;
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('tho', artisanId);
  return url.toString();
}

export function buildQrCodeUrl(targetUrl: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(targetUrl)}`;
}
