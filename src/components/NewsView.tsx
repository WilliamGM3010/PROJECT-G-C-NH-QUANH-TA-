import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Newspaper,
  RefreshCw,
  Search,
  WifiOff,
} from 'lucide-react';
import { DEFAULT_ARTICLE_CATEGORIES } from '../data/articles';
import type { Article, Artisan } from '../types/artisan';
import {
  getRichTextStats,
  RichTextRenderer,
  sanitizeExternalUrl,
  sanitizeImageSrc,
} from '../utils/richText';
import { matchArticleByRouteKey } from '../utils/routing';
import { ArtisanIllustration } from './ArtisanIllustration';

function ArticleCoverImage({
  src,
  alt,
  className = '',
  compact = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const safeSrc = sanitizeImageSrc(src);

  if (!safeSrc || failed) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-[#F7F2E8] via-[#EFE7D8] to-[#E8DFD1] flex flex-col items-center justify-center gap-2 text-[#1B3B82]/70 px-4 text-center ${className}`}
      >
        <Newspaper
          className={compact ? 'w-6 h-6 opacity-70' : 'w-10 h-10 opacity-65'}
          strokeWidth={1.6}
        />
        {!compact && (
          <span className="text-xs font-medium text-[#615D57] max-w-[220px] line-clamp-2">
            {alt}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover ${className}`}
    />
  );
}

interface ArticleDetailViewProps {
  article: Article;
  relatedArtisan?: Artisan | null;
  onBack?: () => void;
  onOpenArtisanOnMap?: (artisanId: string) => void;
  onOpenArtisanProfile?: (artisanId: string) => void;
  isPreview?: boolean;
}

export function ArticleDetailView({
  article,
  relatedArtisan,
  onBack,
  onOpenArtisanOnMap,
  onOpenArtisanProfile,
  isPreview = false,
}: ArticleDetailViewProps) {
  const stats = useMemo(
    () => getRichTextStats(article.content),
    [article.content]
  );
  const safeExternalUrl = sanitizeExternalUrl(article.externalUrl);
  const displaySource =
    article.sourceType === 'external_link'
      ? article.sourceName || 'Nguồn báo chí'
      : article.authorName || 'Ban biên tập Góc Thợ';

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 lg:pb-16">
      {onBack && !isPreview && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 min-h-[40px] inline-flex items-center gap-2 text-sm font-semibold text-[#615D57] hover:text-[#1B3B82] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] rounded-lg px-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Bản tin</span>
        </button>
      )}

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#615D57]">
          <span className="font-mono font-bold uppercase tracking-wider text-[#D46534]">
            {article.category}
          </span>
          <span aria-hidden="true">·</span>
          <time className="font-mono tabular-nums">{article.publishedAt}</time>
          <span aria-hidden="true">·</span>
          <span>
            {article.sourceType === 'external_link' ? 'Nguồn: ' : 'Tác giả: '}
            <strong className="font-semibold text-[#25292E]">
              {displaySource}
            </strong>
          </span>
          {stats.words > 20 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#1B3B82]" />
                {stats.readMinutes} phút đọc
              </span>
            </>
          )}
        </div>

        <h1 className="font-serif-editorial text-2xl sm:text-4xl font-semibold text-[#25292E] tracking-tight leading-[1.22] [text-wrap:balance]">
          {article.title || 'Bài viết chưa có tiêu đề'}
        </h1>

        {article.subtitle && (
          <p className="font-serif-editorial italic text-base sm:text-lg text-[#615D57] leading-relaxed font-normal">
            {article.subtitle}
          </p>
        )}

        <div className="pt-2 border-b border-dashed border-[#DFD3C2]" />
      </header>

      {article.imageUrl && (
        <figure className="my-7 space-y-2.5">
          <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden border border-[#E8DFD1] shadow-sm bg-[#EFE8DC]">
            <ArticleCoverImage src={article.imageUrl} alt={article.title} />
          </div>
          {article.imageCaption && (
            <figcaption className="font-serif-editorial text-xs sm:text-[13px] text-[#615D57] italic text-center px-3 leading-relaxed">
              {article.imageCaption}
            </figcaption>
          )}
        </figure>
      )}

      <div className="max-w-[68ch] mx-auto">
        {article.content.trim() ? (
          <RichTextRenderer html={article.content} />
        ) : article.subtitle ? (
          <p className="my-4 text-base leading-[1.85] text-[#25292E]/90">
            {article.subtitle}
          </p>
        ) : null}

        {article.sourceType === 'external_link' && safeExternalUrl && (
          <div className="mt-8 rounded-2xl bg-white border border-[#E8DFD1] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#615D57]">
                Bài viết tổng hợp từ báo chí
              </p>
              <p className="font-display text-base font-bold text-[#25292E] truncate">
                {article.sourceName || 'Trang báo gốc'}
              </p>
              <p className="text-xs text-[#615D57] leading-relaxed">
                Nhấn nút bên cạnh để đọc toàn văn bài viết trên trang xuất bản
                gốc.
              </p>
            </div>
            <a
              href={safeExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#D46534] hover:bg-[#BC5326] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <span>
                Đọc bài viết gốc tại {article.sourceName || 'trang nguồn'}
              </span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>
          </div>
        )}

        {relatedArtisan && (
          <section className="mt-10 pt-8 border-t border-dashed border-[#DFD3C2]">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#1B3B82] mb-3">
              Gặp nhân vật trong bài viết
            </p>
            <div className="rounded-3xl bg-white border border-[#E8DFD1] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-xs">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#EFE8DC] shrink-0">
                <ArtisanIllustration
                  variant={relatedArtisan.illustrationVariant}
                  customImageUrl={
                    relatedArtisan.hidePortrait
                      ? undefined
                      : relatedArtisan.customImageUrl
                  }
                  alt={relatedArtisan.name}
                />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="font-display text-base font-bold text-[#25292E] leading-snug">
                  {relatedArtisan.name}
                </h2>
                <p className="text-xs text-[#615D57]">
                  {relatedArtisan.categories.join(' · ')} ·{' '}
                  {relatedArtisan.district}
                </p>
                <p className="text-xs text-[#615D57] line-clamp-2">
                  {relatedArtisan.addressLandmark} ({relatedArtisan.hours})
                </p>
              </div>

              <div className="w-full sm:w-auto flex flex-wrap sm:flex-col gap-2 shrink-0">
                {onOpenArtisanProfile && (
                  <button
                    type="button"
                    onClick={() => onOpenArtisanProfile(relatedArtisan.id)}
                    className="flex-1 sm:flex-none min-h-[40px] px-4 py-2 rounded-full bg-[#D46534] hover:bg-[#BC5326] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <span>Xem hồ sơ thợ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {onOpenArtisanOnMap && (
                  <button
                    type="button"
                    onClick={() => onOpenArtisanOnMap(relatedArtisan.id)}
                    className="flex-1 sm:flex-none min-h-[40px] px-4 py-2 rounded-full bg-[#1B3B82] hover:bg-[#142D66] text-[#F7F2E8] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Xem trên bản đồ</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

interface NewsViewProps {
  articles: Article[];
  artisans: Artisan[];
  selectedArticleKey?: string | null;
  onSelectArticle?: (articleId: string | null) => void;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenArtisanOnMap: (artisanId: string) => void;
  onOpenArtisanProfile?: (artisanId: string) => void;
}

export function NewsView({
  articles,
  artisans,
  selectedArticleKey,
  onSelectArticle,
  isLoading = false,
  error = null,
  onRefresh,
  onOpenArtisanOnMap,
  onOpenArtisanProfile,
}: NewsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalArticleKey, setInternalArticleKey] = useState<string | null>(
    null
  );

  const isControlled = selectedArticleKey !== undefined;
  const readingArticleKey = isControlled
    ? selectedArticleKey
    : internalArticleKey;

  const handleSetReadingArticle = (articleId: string | null) => {
    if (onSelectArticle) {
      onSelectArticle(articleId);
    } else {
      setInternalArticleKey(articleId);
    }
  };

  const publishedArticles = useMemo(() => {
    return articles
      .filter((a) => a.status === 'published')
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (a.isSpotlight !== b.isSpotlight) return a.isSpotlight ? -1 : 1;
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      });
  }, [articles]);

  const categories = useMemo(() => {
    const extra = new Set<string>();
    publishedArticles.forEach((a) => {
      if (a.category && !DEFAULT_ARTICLE_CATEGORIES.includes(a.category)) {
        extra.add(a.category);
      }
    });
    return ['Tất cả', ...DEFAULT_ARTICLE_CATEGORIES, ...Array.from(extra)];
  }, [publishedArticles]);

  const activeArticle = useMemo(
    () => matchArticleByRouteKey(publishedArticles, readingArticleKey),
    [publishedArticles, readingArticleKey]
  );

  const spotlightArticle = useMemo(() => {
    if (selectedCategory !== 'Tất cả' || searchQuery.trim()) return null;
    return (
      publishedArticles.find((a) => a.isSpotlight || a.isPinned) ??
      publishedArticles[0] ??
      null
    );
  }, [publishedArticles, selectedCategory, searchQuery]);

  const filteredGridArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedArticles.filter((article) => {
      if (spotlightArticle && article.id === spotlightArticle.id) {
        return false;
      }
      if (
        selectedCategory !== 'Tất cả' &&
        article.category !== selectedCategory
      ) {
        return false;
      }
      if (q) {
        const hay =
          `${article.title} ${article.subtitle} ${article.category} ${article.sourceName ?? ''} ${article.authorName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [publishedArticles, spotlightArticle, selectedCategory, searchQuery]);

  const relatedArtisanMap = useMemo(() => {
    const map = new Map<string, Artisan>();
    artisans.forEach((a) => map.set(a.id, a));
    return map;
  }, [artisans]);

  if (readingArticleKey && isLoading && !activeArticle) {
    return (
      <div className="min-h-full bg-[#F7F2E8] flex items-center justify-center px-4 py-20">
        <div className="rounded-3xl bg-white border border-[#E8DFD1] px-8 py-10 text-center space-y-3 max-w-md w-full">
          <Loader2 className="w-7 h-7 text-[#1B3B82] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#25292E]">
            Đang tải bài viết...
          </p>
        </div>
      </div>
    );
  }

  if (readingArticleKey && !isLoading && !activeArticle) {
    return (
      <div className="min-h-full bg-[#F7F2E8] flex items-center justify-center px-4 py-20">
        <div className="rounded-3xl bg-white border border-[#E8DFD1] px-8 py-10 text-center space-y-4 max-w-md w-full">
          <BookOpen className="w-9 h-9 text-[#D46534]/70 mx-auto" />
          <div className="space-y-1.5">
            <h2 className="font-display text-base font-bold text-[#25292E]">
              Không tìm thấy bài viết này
            </h2>
            <p className="text-xs sm:text-sm text-[#615D57] leading-relaxed">
              Bài viết có thể đã được chuyển về bản nháp hoặc đường dẫn không
              còn tồn tại.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSetReadingArticle(null)}
            className="min-h-[42px] px-5 py-2 rounded-full bg-[#1B3B82] hover:bg-[#142D66] text-[#F7F2E8] text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Bản tin</span>
          </button>
        </div>
      </div>
    );
  }

  if (activeArticle) {
    const linkedArtisan = activeArticle.relatedArtisanId
      ? relatedArtisanMap.get(activeArticle.relatedArtisanId) ?? null
      : null;
    return (
      <div className="min-h-full bg-[#F7F2E8]">
        <ArticleDetailView
          article={activeArticle}
          relatedArtisan={linkedArtisan}
          onBack={() => handleSetReadingArticle(null)}
          onOpenArtisanOnMap={(artisanId) => onOpenArtisanOnMap(artisanId)}
          onOpenArtisanProfile={onOpenArtisanProfile}
        />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F7F2E8]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-14 pb-24 lg:pb-20 space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-dashed border-[#DFD3C2]">
          <div className="space-y-2 max-w-2xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#D46534]">
              Bản tin Góc Thợ Quanh Ta
            </p>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#25292E] tracking-tight leading-tight [text-wrap:balance]">
              Chuyện nghề vỉa hè &amp; nhịp sống bền vững
            </h1>
            <p className="font-serif-editorial italic text-sm sm:text-base text-[#615D57] leading-relaxed">
              Ghi chép những câu chuyện ấm áp bên góc đường, mẹo giữ đồ bền lâu
              và tin tức cộng đồng quanh bản đồ thợ thủ công Sài Gòn.
            </p>
          </div>

          <div className="w-full md:w-72 relative shrink-0">
            <Search className="w-4 h-4 text-[#1B3B82]/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài viết, chuyên mục..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#E8DFD1] bg-white text-sm text-[#25292E] placeholder:text-[#8E877E] focus:outline-none focus:border-[#1B3B82] focus:ring-2 focus:ring-[#1B3B82]/12 transition-all"
            />
          </div>
        </header>

        <div
          role="tablist"
          aria-label="Lọc chuyên mục bản tin"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82] ${
                  active
                    ? 'bg-[#1B3B82] text-[#F7F2E8] border-[#1B3B82]'
                    : 'bg-white border-[#E8DFD1] text-[#615D57] hover:text-[#25292E] hover:border-[#1B3B82]/45'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="rounded-3xl bg-white border border-[#E8DFD1] p-12 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-[#1B3B82] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#25292E]">
              Đang tải Bản tin cộng đồng...
            </p>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-3xl bg-[#B93818]/8 border border-[#B93818]/25 p-8 text-center space-y-3"
          >
            <WifiOff className="w-7 h-7 text-[#B93818] mx-auto" />
            <p className="text-sm font-bold text-[#9C2E13]">
              Chưa thể tải danh sách bài viết
            </p>
            <p className="text-xs text-[#7F240E] max-w-md mx-auto leading-relaxed">
              {error}
            </p>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="min-h-[40px] px-4 py-2 rounded-full bg-[#B93818] hover:bg-[#9C2E13] text-[#F7F2E8] text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử tải lại</span>
              </button>
            )}
          </div>
        ) : publishedArticles.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[#E8DFD1] p-12 text-center space-y-3">
            <BookOpen className="w-9 h-9 text-[#D46534]/65 mx-auto" />
            <h2 className="font-display text-base font-bold text-[#25292E]">
              Chưa có bài viết nào được xuất bản
            </h2>
            <p className="text-xs sm:text-sm text-[#615D57] max-w-md mx-auto leading-relaxed">
              Quản trị viên hoặc Cộng tác viên có thể vào mục Quản lý Bản tin
              trong Trang Quản trị để đăng bài viết đầu tiên.
            </p>
          </div>
        ) : (
          <>
            {spotlightArticle && (
              <section aria-label="Tin tiêu điểm">
                <div
                  onClick={() => handleSetReadingArticle(spotlightArticle.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSetReadingArticle(spotlightArticle.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group grid grid-cols-1 lg:grid-cols-12 items-stretch rounded-3xl bg-white border border-[#E8DFD1] overflow-hidden hover:border-[#1B3B82]/50 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(37,41,46,0.08)] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82]"
                >
                  <div className="lg:col-span-7 aspect-[16/10] lg:aspect-auto lg:min-h-[360px] bg-[#EFE8DC] overflow-hidden">
                    <ArticleCoverImage
                      src={spotlightArticle.imageUrl}
                      alt={spotlightArticle.title}
                      className="lg:h-full transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6">
                    <div className="space-y-3.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#615D57]">
                        <span className="font-mono font-bold uppercase tracking-wider text-[#B93818]">
                          Tin tiêu điểm
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#1B3B82]">
                          {spotlightArticle.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <time className="font-mono tabular-nums">
                          {spotlightArticle.publishedAt}
                        </time>
                      </div>

                      <h2 className="font-serif-editorial text-xl sm:text-2xl lg:text-[26px] font-semibold text-[#25292E] leading-snug group-hover:text-[#1B3B82] transition-colors [text-wrap:balance]">
                        {spotlightArticle.title}
                      </h2>

                      {spotlightArticle.subtitle && (
                        <p className="text-sm sm:text-[15px] text-[#615D57] leading-relaxed line-clamp-4">
                          {spotlightArticle.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-dashed border-[#DFD3C2] flex items-center justify-between gap-3">
                      <span className="text-xs text-[#615D57] truncate">
                        {spotlightArticle.sourceType === 'external_link'
                          ? `Nguồn: ${spotlightArticle.sourceName || 'Báo chí'}`
                          : spotlightArticle.authorName || 'Góc Thợ Quanh Ta'}
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#D46534] whitespace-nowrap shrink-0">
                        <span>Đọc câu chuyện</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section aria-label="Danh sách bài viết" className="space-y-5">
              {filteredGridArticles.length === 0 ? (
                <div className="rounded-3xl bg-white border border-[#E8DFD1] p-10 text-center space-y-2">
                  <p className="font-display text-sm font-bold text-[#25292E]">
                    Chưa có bài viết nào trong mục này
                  </p>
                  <p className="text-xs text-[#615D57]">
                    Hãy thử chọn chuyên mục khác hoặc xóa từ khóa tìm kiếm nhé.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                  {filteredGridArticles.map((article) => {
                    const linkedArtisan = article.relatedArtisanId
                      ? relatedArtisanMap.get(article.relatedArtisanId)
                      : null;

                    return (
                      <article
                        key={article.id}
                        onClick={() => handleSetReadingArticle(article.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSetReadingArticle(article.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="group flex flex-col rounded-3xl bg-white border border-[#E8DFD1] overflow-hidden hover:border-[#1B3B82]/50 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,41,46,0.07)] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B82]"
                      >
                        <div className="aspect-[4/3] w-full bg-[#EFE8DC] overflow-hidden">
                          <ArticleCoverImage
                            src={article.imageUrl}
                            alt={article.title}
                            className="transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>

                        <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#615D57]">
                              <span className="font-mono text-[11px] font-bold text-[#1B3B82]">
                                {article.category}
                              </span>
                              <span aria-hidden="true">·</span>
                              <time className="font-mono text-[11px] tabular-nums">
                                {article.publishedAt}
                              </time>
                              {article.sourceType === 'external_link' &&
                                article.sourceName && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-semibold text-[#D46534]">
                                      {article.sourceName}
                                    </span>
                                  </>
                                )}
                            </div>

                            <h3 className="font-serif-editorial text-base sm:text-[18px] font-semibold text-[#25292E] leading-snug line-clamp-2 group-hover:text-[#1B3B82] transition-colors">
                              {article.title}
                            </h3>

                            {article.subtitle && (
                              <p className="text-xs sm:text-[13.5px] text-[#615D57] leading-relaxed line-clamp-3">
                                {article.subtitle}
                              </p>
                            )}
                          </div>

                          <div className="pt-3 border-t border-dashed border-[#DFD3C2] flex items-center justify-between gap-2 text-xs">
                            <span className="text-[#615D57] truncate">
                              {linkedArtisan ? (
                                <span className="inline-flex items-center gap-1 text-[#1B3B82] font-semibold">
                                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">
                                    {linkedArtisan.name}
                                  </span>
                                </span>
                              ) : article.sourceType === 'external_link' ? (
                                <span className="inline-flex items-center gap-1 text-[#615D57]">
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                  <span>Tin báo chí</span>
                                </span>
                              ) : (
                                article.authorName || 'Góc Thợ Quanh Ta'
                              )}
                            </span>

                            <span className="font-bold text-[#D46534] whitespace-nowrap shrink-0">
                              Đọc tiếp →
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
