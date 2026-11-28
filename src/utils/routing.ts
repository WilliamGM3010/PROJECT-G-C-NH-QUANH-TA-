import type { AppTab, Article } from '../types/artisan';
import { normalizeVietnamese } from './geo';

export interface ParsedAppRoute {
  isAdmin: boolean;
  tab: AppTab;
  artisanId: string | null;
  articleKey: string | null;
  /** True nếu URL gốc không hợp lệ hoặc là link cũ cần chuẩn hóa lại bằng replaceState */
  shouldCanonicalize: boolean;
  canonicalUrl: string;
}

export const ROUTE_PATHS = {
  home: '/',
  explore: '/ban-do',
  artisan: '/tho',
  news: '/ban-tin',
  community: '/cong-dong',
  about: '/ve-du-an',
  suggest: '/goi-y',
  avatar: '/avatar',
  admin: '/quan-tri',
} as const;

export function slugifyArticleTitle(title: string): string {
  return normalizeVietnamese(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function matchArticleByRouteKey(
  articles: Article[],
  routeKey: string | null
): Article | null {
  if (!routeKey) return null;
  const trimmed = routeKey.trim();
  if (!trimmed) return null;

  const byId = articles.find((a) => a.id === trimmed);
  if (byId) return byId;

  const normalizedKey = slugifyArticleTitle(trimmed);
  if (!normalizedKey) return null;
  return (
    articles.find((a) => slugifyArticleTitle(a.title) === normalizedKey) ?? null
  );
}

export function buildRouteUrl(options: {
  isAdmin?: boolean;
  tab?: AppTab;
  artisanId?: string | null;
  articleKey?: string | null;
}): string {
  if (options.isAdmin) {
    return ROUTE_PATHS.admin;
  }

  const tab = options.tab ?? 'home';
  switch (tab) {
    case 'home':
      return ROUTE_PATHS.home;
    case 'explore': {
      const artisanId = options.artisanId?.trim();
      if (artisanId) {
        return `${ROUTE_PATHS.explore}?tho=${encodeURIComponent(artisanId)}`;
      }
      return ROUTE_PATHS.explore;
    }
    case 'artisan': {
      const artisanId = options.artisanId?.trim();
      if (artisanId) {
        return `${ROUTE_PATHS.artisan}/${encodeURIComponent(artisanId)}`;
      }
      return ROUTE_PATHS.explore;
    }
    case 'news': {
      const articleKey = options.articleKey?.trim();
      if (articleKey) {
        return `${ROUTE_PATHS.news}/${encodeURIComponent(articleKey)}`;
      }
      return ROUTE_PATHS.news;
    }
    case 'community':
      return ROUTE_PATHS.community;
    case 'about':
      return ROUTE_PATHS.about;
    case 'suggest':
      return ROUTE_PATHS.suggest;
    case 'avatar':
      return ROUTE_PATHS.avatar;
    default:
      return ROUTE_PATHS.home;
  }
}

export function parseAppRoute(
  pathname: string,
  search = ''
): ParsedAppRoute {
  const cleanedPath =
    pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname || '/';
  const lowerPath = cleanedPath.toLowerCase();
  const params = new URLSearchParams(search);
  const thoParam = params.get('tho')?.trim() || null;

  // Trang chủ `/` (giữ tương thích ngược nếu link chia sẻ cũ có dạng `/?tho=<id>`)
  if (lowerPath === '' || lowerPath === '/') {
    if (thoParam) {
      return {
        isAdmin: false,
        tab: 'explore',
        artisanId: thoParam,
        articleKey: null,
        shouldCanonicalize: true,
        canonicalUrl: buildRouteUrl({ tab: 'explore', artisanId: thoParam }),
      };
    }
    return {
      isAdmin: false,
      tab: 'home',
      artisanId: null,
      articleKey: null,
      shouldCanonicalize: pathname !== '/' || Boolean(search),
      canonicalUrl: ROUTE_PATHS.home,
    };
  }

  // Bản đồ `/ban-do` (kèm query `?tho=<artisan_id>` nếu có)
  if (lowerPath === ROUTE_PATHS.explore) {
    const canonicalUrl = buildRouteUrl({
      tab: 'explore',
      artisanId: thoParam,
    });
    return {
      isAdmin: false,
      tab: 'explore',
      artisanId: thoParam,
      articleKey: null,
      shouldCanonicalize: `${pathname}${search}` !== canonicalUrl,
      canonicalUrl,
    };
  }

  // Trang Hồ sơ Chi tiết Người thợ `/tho/<id>`
  if (
    lowerPath === ROUTE_PATHS.artisan ||
    lowerPath.startsWith(`${ROUTE_PATHS.artisan}/`)
  ) {
    const rawSegment = cleanedPath.slice(ROUTE_PATHS.artisan.length + 1);
    let decodedId: string | null = null;
    if (rawSegment) {
      const firstPart = rawSegment.split('/')[0];
      try {
        decodedId = decodeURIComponent(firstPart).trim() || null;
      } catch {
        decodedId = firstPart.trim() || null;
      }
    }

    if (!decodedId) {
      return {
        isAdmin: false,
        tab: 'explore',
        artisanId: null,
        articleKey: null,
        shouldCanonicalize: true,
        canonicalUrl: ROUTE_PATHS.explore,
      };
    }

    const canonicalUrl = buildRouteUrl({
      tab: 'artisan',
      artisanId: decodedId,
    });
    return {
      isAdmin: false,
      tab: 'artisan',
      artisanId: decodedId,
      articleKey: null,
      shouldCanonicalize: rawSegment.includes('/') || Boolean(search),
      canonicalUrl,
    };
  }

  // Chuyên trang Bản tin `/ban-tin` và bài viết chi tiết `/ban-tin/<id_or_slug>`
  if (
    lowerPath === ROUTE_PATHS.news ||
    lowerPath.startsWith(`${ROUTE_PATHS.news}/`)
  ) {
    const rawSegment = cleanedPath.slice(ROUTE_PATHS.news.length + 1);
    let decodedSegment: string | null = null;
    if (rawSegment) {
      const firstPart = rawSegment.split('/')[0];
      try {
        decodedSegment = decodeURIComponent(firstPart).trim() || null;
      } catch {
        decodedSegment = firstPart.trim() || null;
      }
    }

    const canonicalUrl = buildRouteUrl({
      tab: 'news',
      articleKey: decodedSegment,
    });
    return {
      isAdmin: false,
      tab: 'news',
      artisanId: null,
      articleKey: decodedSegment,
      shouldCanonicalize:
        lowerPath.startsWith(`${ROUTE_PATHS.news}/`) &&
        rawSegment.includes('/'),
      canonicalUrl,
    };
  }

  // Trang Cộng đồng `/cong-dong`
  if (lowerPath === ROUTE_PATHS.community) {
    return {
      isAdmin: false,
      tab: 'community',
      artisanId: null,
      articleKey: null,
      shouldCanonicalize: pathname !== ROUTE_PATHS.community,
      canonicalUrl: ROUTE_PATHS.community,
    };
  }

  // Trang Về dự án & Team WHO `/ve-du-an`
  if (lowerPath === ROUTE_PATHS.about) {
    return {
      isAdmin: false,
      tab: 'about',
      artisanId: null,
      articleKey: null,
      shouldCanonicalize: pathname !== ROUTE_PATHS.about,
      canonicalUrl: ROUTE_PATHS.about,
    };
  }

  // Trang Gợi ý cô chú thợ mới `/goi-y`
  if (lowerPath === ROUTE_PATHS.suggest) {
    return {
      isAdmin: false,
      tab: 'suggest',
      artisanId: null,
      articleKey: null,
      shouldCanonicalize: pathname !== ROUTE_PATHS.suggest,
      canonicalUrl: ROUTE_PATHS.suggest,
    };
  }

  // Trang Góc Thợ Avatar `/avatar`
  if (lowerPath === ROUTE_PATHS.avatar) {
    return {
      isAdmin: false,
      tab: 'avatar',
      artisanId: null,
      articleKey: null,
      shouldCanonicalize: pathname !== ROUTE_PATHS.avatar,
      canonicalUrl: ROUTE_PATHS.avatar,
    };
  }

  // Trang Quản trị `/quan-tri`
  if (lowerPath === ROUTE_PATHS.admin) {
    return {
      isAdmin: true,
      tab: 'home',
      artisanId: null,
      articleKey: null,
      shouldCanonicalize: pathname !== ROUTE_PATHS.admin,
      canonicalUrl: ROUTE_PATHS.admin,
    };
  }

  // Đường dẫn lạ không khớp -> tự động đưa về `/` bằng replaceState
  return {
    isAdmin: false,
    tab: 'home',
    artisanId: null,
    articleKey: null,
    shouldCanonicalize: true,
    canonicalUrl: ROUTE_PATHS.home,
  };
}

export function getDocumentTitleForRoute(options: {
  isAdmin: boolean;
  tab: AppTab;
  selectedArtisanName?: string | null;
  activeArticleTitle?: string | null;
}): string {
  if (options.isAdmin) {
    return 'Quản trị | Góc Thợ Quanh Ta';
  }

  switch (options.tab) {
    case 'artisan':
      return options.selectedArtisanName
        ? `${options.selectedArtisanName} | Góc Thợ Quanh Ta`
        : 'Hồ sơ góc thợ | Góc Thợ Quanh Ta';
    case 'explore':
      return options.selectedArtisanName
        ? `${options.selectedArtisanName} — Bản đồ góc thợ | Góc Thợ Quanh Ta`
        : 'Bản đồ thợ | Góc Thợ Quanh Ta';
    case 'news':
      return options.activeArticleTitle
        ? `${options.activeArticleTitle} — Bản tin | Góc Thợ Quanh Ta`
        : 'Bản tin | Góc Thợ Quanh Ta';
    case 'community':
      return 'Cộng đồng | Góc Thợ Quanh Ta';
    case 'about':
      return 'Về dự án & Team WHO | Góc Thợ Quanh Ta';
    case 'suggest':
      return 'Gợi ý cô chú thợ mới | Góc Thợ Quanh Ta';
    case 'avatar':
      return 'Góc Thợ Avatar | Góc Thợ Quanh Ta';
    case 'home':
    default:
      return 'Góc Thợ Quanh Ta — Hỏng đâu sửa liền';
  }
}
