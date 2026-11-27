import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Database,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Link2,
  Loader2,
  Newspaper,
  Pin,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { fetchMicrolinkMetadata } from '../services/supabaseService';
import type {
  AdminAccount,
  Article,
  ArticleStatus,
  Artisan,
} from '../types/artisan';
import { sanitizeImageSrc } from '../utils/richText';
import {
  AdminArticleEditorModal,
  type ArticleEditorDraftSeed,
} from './AdminArticleEditorModal';
import { ArticleDetailView } from './NewsView';

interface AdminArticlesTabProps {
  currentAdmin: AdminAccount;
  articles: Article[];
  artisans: Artisan[];
  isSupabaseMode?: boolean;
  isSeedingArticles?: boolean;
  onSaveArticle: (article: Article) => Promise<void> | void;
  onToggleArticleStatus: (articleId: string, nextStatus: ArticleStatus) => Promise<void> | void;
  onDeleteArticle: (articleId: string) => Promise<void> | void;
  onSeedInitialArticles?: () => Promise<void> | void;
}

export function AdminArticlesTab({
  currentAdmin,
  articles,
  artisans,
  isSupabaseMode = false,
  isSeedingArticles = false,
  onSaveArticle,
  onToggleArticleStatus,
  onDeleteArticle,
  onSeedInitialArticles,
}: AdminArticlesTabProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | ArticleStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Trình soạn thảo CMS 2 cột
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSeed, setEditorSeed] = useState<ArticleEditorDraftSeed | null>(
    null
  );

  // Hộp thoại "Nhập tin từ link báo" (Microlink)
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [importError, setImportError] = useState('');
  const [importFallbackUrl, setImportFallbackUrl] = useState<string | null>(null);

  // Xem trước & Xác nhận xóa trong app
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const existingCategories = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category).filter(Boolean))),
    [articles]
  );

  const publishedCount = useMemo(
    () => articles.filter((a) => a.status === 'published').length,
    [articles]
  );
  const draftCount = useMemo(
    () => articles.filter((a) => a.status === 'draft').length,
    [articles]
  );

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (q) {
        const hay = `${a.title} ${a.subtitle} ${a.category} ${a.sourceName ?? ''} ${a.authorName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [articles, statusFilter, searchQuery]);

  const artisanNameMap = useMemo(() => {
    const map = new Map<string, Artisan>();
    artisans.forEach((a) => map.set(a.id, a));
    return map;
  }, [artisans]);

  const openCreateNew = () => {
    setEditorSeed({
      sourceType: 'original',
      authorName: currentAdmin.displayName || currentAdmin.name,
    });
    setEditorOpen(true);
  };

  const openEditArticle = (article: Article) => {
    setEditorSeed(article);
    setEditorOpen(true);
  };

  const openImportDialog = () => {
    setImportUrl('');
    setImportError('');
    setImportFallbackUrl(null);
    setImportModalOpen(true);
  };

  const handleFetchNewsLink = async (e: FormEvent) => {
    e.preventDefault();
    if (isImportingUrl) return;
    setImportError('');
    setImportFallbackUrl(null);
    setIsImportingUrl(true);

    try {
      const res = await fetchMicrolinkMetadata(importUrl);
      if (res.ok && res.data) {
        const extracted = res.data;
        const seedContent = extracted.description
          ? `<p>${extracted.description.replace(/[<>]/g, '')}</p>`
          : '';
        setImportModalOpen(false);
        setEditorSeed({
          title: extracted.title,
          subtitle: extracted.description,
          content: seedContent,
          imageUrl: extracted.imageUrl,
          category: 'Báo chí & Cộng đồng',
          sourceType: 'external_link',
          externalUrl: extracted.externalUrl,
          sourceName: extracted.publisher,
          authorName: extracted.publisher
            ? `Tổng hợp từ ${extracted.publisher}`
            : currentAdmin.displayName || currentAdmin.name,
        });
        setEditorOpen(true);
      } else {
        setImportError(
          res.error ??
            'Trang báo này không cho phép trích xuất tự động. Bạn có thể tự nhập tiêu đề và ảnh trong khung soạn thảo.'
        );
        if (res.normalizedUrl) {
          setImportFallbackUrl(res.normalizedUrl);
        }
      }
    } finally {
      setIsImportingUrl(false);
    }
  };

  const handleOpenManualFromFailedImport = () => {
    const urlToUse = importFallbackUrl || importUrl.trim();
    let host = '';
    try {
      host = new URL(urlToUse).hostname.replace(/^www\./i, '');
    } catch {
      host = '';
    }
    setImportModalOpen(false);
    setEditorSeed({
      sourceType: 'external_link',
      externalUrl: urlToUse,
      sourceName: host,
      category: 'Báo chí & Cộng đồng',
      authorName: host
        ? `Tổng hợp từ ${host}`
        : currentAdmin.displayName || currentAdmin.name,
    });
    setEditorOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingArticle || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteArticle(deletingArticle.id);
      setDeletingArticle(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header + 2 nút tạo bài viết rõ ràng ở góc trên */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1F2933]">Quản lý Bản tin</h2>
          <p className="text-xs text-[#52606D] mt-0.5">
            Soạn câu chuyện nghề vỉa hè, mẹo giữ đồ bền hoặc nhập tin từ báo chí ·{' '}
            <span className="tabular-nums font-semibold text-[#1F2933]">
              {publishedCount} đã xuất bản, {draftCount} tin nháp
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isSupabaseMode &&
            articles.length === 0 &&
            onSeedInitialArticles && (
              <button
                type="button"
                disabled={isSeedingArticles}
                onClick={() => void onSeedInitialArticles()}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#3A6B5C]/30 bg-[#3A6B5C]/10 hover:bg-[#3A6B5C]/18 disabled:opacity-60 text-xs font-semibold text-[#3A6B5C] inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                {isSeedingArticles ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>Nạp 4 bài mẫu vào Database</span>
              </button>
            )}

          <button
            type="button"
            onClick={openImportDialog}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-[#3A6B5C]/35 bg-white hover:bg-[#3A6B5C]/8 text-xs sm:text-sm font-semibold text-[#3A6B5C] inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <Link2 className="w-4 h-4" />
            <span>Nhập tin từ link báo</span>
          </button>

          <button
            type="button"
            onClick={openCreateNew}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng bài mới</span>
          </button>
        </div>
      </div>

      {/* Bộ lọc trạng thái + Tìm kiếm */}
      <div className="rounded-2xl bg-white border border-[#EBE5DC] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'all', label: `Tất cả (${articles.length})` },
              { id: 'published', label: `Đã xuất bản (${publishedCount})` },
              { id: 'draft', label: `Tin nháp (${draftCount})` },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors tabular-nums ${
                  active
                    ? 'bg-[#1F2933] text-white'
                    : 'bg-[#FAF8F5] text-[#52606D] hover:text-[#1F2933]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#7B8794] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, nguồn..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] text-xs text-[#1F2933] focus:outline-none focus:bg-white focus:border-[#D96B38]"
          />
        </div>
      </div>

      {/* Danh sách bài viết */}
      {filteredArticles.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#EBE5DC] p-10 text-center space-y-3">
          <Newspaper className="w-8 h-8 text-[#D96B38]/60 mx-auto" />
          <p className="text-sm font-bold text-[#1F2933]">
            {articles.length === 0
              ? 'Chưa có bài viết nào trong hệ thống'
              : 'Không tìm thấy bài viết phù hợp bộ lọc'}
          </p>
          <p className="text-xs text-[#52606D] max-w-md mx-auto">
            {articles.length === 0
              ? 'Bấm "Đăng bài mới" để tự viết câu chuyện hoặc "Nhập tin từ link báo" để trích xuất nhanh từ một bài báo có sẵn.'
              : 'Thử chọn tab Tất cả hoặc xóa từ khóa tìm kiếm.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article) => {
            const safeThumb = sanitizeImageSrc(article.imageUrl);
            const linkedArtisan = article.relatedArtisanId
              ? artisanNameMap.get(article.relatedArtisanId)
              : null;

            return (
              <div
                key={article.id}
                className="rounded-2xl bg-white border border-[#EBE5DC] p-4 flex flex-col md:flex-row md:items-center gap-4 hover:border-[#D96B38]/35 transition-colors"
              >
                {/* Ảnh nhỏ */}
                <div className="w-full md:w-32 h-36 md:h-22 rounded-xl overflow-hidden bg-[#F4EFE6] shrink-0 flex items-center justify-center">
                  {safeThumb ? (
                    <img
                      src={safeThumb}
                      alt={article.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Newspaper className="w-6 h-6 text-[#9AA5B1]" />
                  )}
                </div>

                {/* Thông tin bài viết */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-[#616E7C]">
                    <span
                      className={`font-bold ${
                        article.status === 'published'
                          ? 'text-[#3A6B5C]'
                          : 'text-[#9A6807]'
                      }`}
                    >
                      {article.status === 'published'
                        ? 'Đã xuất bản'
                        : 'Tin nháp'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#1F2933]">
                      {article.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{article.publishedAt}</span>
                    {article.sourceType === 'external_link' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#D96B38] font-semibold">
                          <Globe className="w-3 h-3" />
                          {article.sourceName || 'Link báo'}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-[#1F2933] leading-snug line-clamp-2">
                    {article.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#52606D]">
                    {article.isSpotlight && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#D96B38]">
                        <Sparkles className="w-3 h-3" />
                        Tiêu điểm
                      </span>
                    )}
                    {article.isPinned && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#3A6B5C]">
                        <Pin className="w-3 h-3" />
                        Ghim đầu trang
                      </span>
                    )}
                    {article.isFeatured && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#9A6807]">
                        <Star className="w-3 h-3" />
                        Nổi bật
                      </span>
                    )}
                    {linkedArtisan && (
                      <span className="text-[#3A6B5C]">
                        Nhân vật: <strong>{linkedArtisan.name}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Nút thao tác */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewArticle(article)}
                    title="Xem trước"
                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] hover:bg-[#F2ECE2] text-xs font-semibold text-[#52606D] inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Xem</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditArticle(article)}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl border border-[#D96B38]/30 bg-[#D96B38]/8 hover:bg-[#D96B38]/15 text-xs font-semibold text-[#D96B38] inline-flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void onToggleArticleStatus(
                        article.id,
                        article.status === 'published' ? 'draft' : 'published'
                      )
                    }
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                      article.status === 'published'
                        ? 'border-[#E5DFD5] bg-white hover:bg-[#FAF8F5] text-[#52606D]'
                        : 'border-[#3A6B5C]/30 bg-[#3A6B5C]/10 hover:bg-[#3A6B5C]/18 text-[#3A6B5C]'
                    }`}
                  >
                    {article.status === 'published' ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Chuyển nháp</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Xuất bản</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingArticle(article)}
                    title="Xóa bài viết"
                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-[#C84B31]/25 bg-[#C84B31]/8 hover:bg-[#C84B31]/16 text-xs font-semibold text-[#C84B31] inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="sr-only sm:not-sr-only">Xóa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hộp thoại CÁCH 1: Nhập tin từ link báo (Microlink API) */}
      {importModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Nhập tin từ link báo"
          className="fixed inset-0 z-50 bg-[#1F2933]/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E5DFD5] shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EFECE6] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#3A6B5C]/12 text-[#3A6B5C] flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#1F2933]">
                    Nhập tin từ link báo
                  </h3>
                  <p className="text-[11px] text-[#616E7C]">
                    Tự động trích xuất tiêu đề, sa-pô, ảnh bìa và tên trang báo nguồn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                aria-label="Đóng hộp thoại"
                className="w-9 h-9 rounded-xl hover:bg-[#FAF8F5] text-[#52606D] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFetchNewsLink} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="microlink-url-input"
                  className="text-xs font-bold text-[#1F2933]"
                >
                  Đường dẫn bài báo (URL)
                </label>
                <input
                  id="microlink-url-input"
                  type="url"
                  required
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://tuoitre.vn/bai-viet-ve-nguoi-tho-sua-giay..."
                  className="w-full h-11 px-3.5 rounded-xl border border-[#DFD8CE] bg-[#FAF8F5] focus:bg-white text-sm text-[#1F2933] focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
                />
                <p className="text-[11px] text-[#616E7C] leading-relaxed">
                  Sau khi lấy dữ liệu, bài viết sẽ mở sẵn trong khung soạn thảo để
                  bạn kiểm tra, gắn thẻ cô chú thợ liên quan rồi bấm Xuất bản.
                </p>
              </div>

              {importError && (
                <div
                  role="alert"
                  className="rounded-xl bg-[#FFF8E6] border border-[#E9A825]/60 p-3.5 space-y-2.5 text-xs text-[#8A5A00]"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C48200]" />
                    <p className="leading-relaxed">{importError}</p>
                  </div>
                  {importFallbackUrl && (
                    <button
                      type="button"
                      onClick={handleOpenManualFromFailedImport}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#1F2933] hover:bg-[#323F4B] text-white text-xs font-semibold"
                    >
                      Mở trình soạn thảo để tự dán tiêu đề &amp; ảnh
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-[#DFD8CE] bg-[#FAF8F5] text-xs font-semibold text-[#52606D]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isImportingUrl}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#3A6B5C] hover:bg-[#2F574A] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-xs"
                >
                  {isImportingUrl ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lấy dữ liệu...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>Lấy dữ liệu bài báo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trình soạn thảo CMS 2 cột */}
      {editorOpen && (
        <AdminArticleEditorModal
          initialArticle={editorSeed}
          artisans={artisans}
          existingCategories={existingCategories}
          defaultAuthorName={currentAdmin.displayName || currentAdmin.name}
          onSave={async (article) => {
            await onSaveArticle(article);
            setEditorOpen(false);
            setEditorSeed(null);
          }}
          onClose={() => {
            setEditorOpen(false);
            setEditorSeed(null);
          }}
        />
      )}

      {/* Modal xem trước bài viết từ danh sách quản lý */}
      {previewArticle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem trước bài viết"
          className="fixed inset-0 z-50 bg-[#1F2933]/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6"
        >
          <div className="w-full max-w-4xl max-h-[92dvh] rounded-2xl bg-[#FAF8F5] border border-[#E5DFD5] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-3 bg-white border-b border-[#E8E2D9] flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs font-semibold text-[#3A6B5C]">
                Xem trước bài viết ({previewArticle.status === 'published' ? 'Đã xuất bản' : 'Tin nháp'})
              </span>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#1F2933] text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Đóng</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto thin-scrollbar">
              <ArticleDetailView
                article={previewArticle}
                relatedArtisan={
                  previewArticle.relatedArtisanId
                    ? artisanNameMap.get(previewArticle.relatedArtisanId) ?? null
                    : null
                }
                isPreview
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa bài viết (trong app, không dùng window.confirm) */}
      {deletingArticle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận xóa bài viết"
          className="fixed inset-0 z-50 bg-[#1F2933]/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5DFD5] shadow-2xl p-5 space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#1F2933]">
                Xóa bài viết khỏi Bản tin?
              </h3>
              <p className="text-xs text-[#52606D] leading-relaxed">
                Bạn có chắc muốn xóa bài{' '}
                <strong className="text-[#1F2933]">
                  “{deletingArticle.title}”
                </strong>
                ? Thao tác này sẽ gỡ bài viết khỏi cơ sở dữ liệu Supabase và không
                thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingArticle(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-[#DFD8CE] bg-[#FAF8F5] text-xs font-semibold text-[#52606D]"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleConfirmDelete()}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#C84B31] hover:bg-[#AE3C24] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Xóa bài viết</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
