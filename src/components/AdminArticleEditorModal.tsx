import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Eye,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Save,
  Send,
  Trash2,
  Underline,
  Upload,
  X,
} from 'lucide-react';
import { DEFAULT_ARTICLE_CATEGORIES } from '../data/articles';
import type {
  Article,
  ArticleSourceType,
  ArticleStatus,
  Artisan,
} from '../types/artisan';
import {
  buildSanitizedFragment,
  compressImageFileToDataUrl,
  getRichTextStats,
  sanitizeExternalUrl,
  sanitizeImageSrc,
  sanitizeRichHtmlString,
} from '../utils/richText';
import { formatVietnamDate } from '../utils/storage';
import { ArticleDetailView } from './NewsView';

export interface ArticleEditorDraftSeed {
  id?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  imageCaption?: string;
  category?: string;
  sourceType?: ArticleSourceType;
  externalUrl?: string;
  sourceName?: string;
  authorName?: string;
  relatedArtisanId?: string;
  isSpotlight?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  status?: ArticleStatus;
  publishedAt?: string;
  createdAt?: string;
}

interface AdminArticleEditorModalProps {
  initialArticle?: ArticleEditorDraftSeed | null;
  artisans: Artisan[];
  existingCategories: string[];
  defaultAuthorName: string;
  onSave: (article: Article) => Promise<void> | void;
  onClose: () => void;
}

export function AdminArticleEditorModal({
  initialArticle,
  artisans,
  existingCategories,
  defaultAuthorName,
  onSave,
  onClose,
}: AdminArticleEditorModalProps) {
  const isEditing = Boolean(initialArticle?.id);

  const [title, setTitle] = useState(initialArticle?.title ?? '');
  const [subtitle, setSubtitle] = useState(initialArticle?.subtitle ?? '');
  const [contentHtml, setContentHtml] = useState(initialArticle?.content ?? '');
  const [imageUrl, setImageUrl] = useState(initialArticle?.imageUrl ?? '');
  const [imageUrlInput, setImageUrlInput] = useState(initialArticle?.imageUrl ?? '');
  const [imageCaption, setImageCaption] = useState(
    initialArticle?.imageCaption ?? ''
  );
  const [imageError, setImageError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const allCategoryOptions = useMemo(() => {
    const merged = new Set<string>([
      ...DEFAULT_ARTICLE_CATEGORIES,
      ...existingCategories.filter(Boolean),
    ]);
    if (initialArticle?.category) merged.add(initialArticle.category);
    return Array.from(merged);
  }, [existingCategories, initialArticle?.category]);

  const [category, setCategory] = useState(
    initialArticle?.category || DEFAULT_ARTICLE_CATEGORIES[0]
  );
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [sourceType, setSourceType] = useState<ArticleSourceType>(
    initialArticle?.sourceType ?? 'original'
  );
  const [externalUrl, setExternalUrl] = useState(
    initialArticle?.externalUrl ?? ''
  );
  const [sourceName, setSourceName] = useState(initialArticle?.sourceName ?? '');
  const [authorName, setAuthorName] = useState(
    initialArticle?.authorName || defaultAuthorName
  );
  const [relatedArtisanId, setRelatedArtisanId] = useState(
    initialArticle?.relatedArtisanId ?? ''
  );

  const [isSpotlight, setIsSpotlight] = useState(
    Boolean(initialArticle?.isSpotlight)
  );
  const [isFeatured, setIsFeatured] = useState(
    Boolean(initialArticle?.isFeatured)
  );
  const [isPinned, setIsPinned] = useState(Boolean(initialArticle?.isPinned));

  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Inline popovers cho Chèn liên kết & Chèn ảnh (không dùng window.prompt)
  const [activePopover, setActivePopover] = useState<'none' | 'link' | 'image'>(
    'none'
  );
  const [linkTextInput, setLinkTextInput] = useState('');
  const [linkUrlInput, setLinkUrlInput] = useState('https://');
  const [inlineImgUrlInput, setInlineImgUrlInput] = useState('https://');
  const [inlineImgAltInput, setInlineImgAltInput] = useState('');
  const [popoverError, setPopoverError] = useState('');

  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  // Nạp nội dung sạch ban đầu vào contentEditable bằng DOM fragment (không gán raw innerHTML chưa lọc)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.replaceChildren();
    if (initialArticle?.content) {
      el.appendChild(buildSanitizedFragment(initialArticle.content, document));
    }
  }, [initialArticle?.content]);

  const contentStats = useMemo(
    () => getRichTextStats(contentHtml),
    [contentHtml]
  );

  const syncEditorHtml = () => {
    if (!editorRef.current) return;
    const raw = editorRef.current.innerHTML;
    setContentHtml(raw);
  };

  const captureSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const runFormatCommand = (command: string, value?: string) => {
    restoreSelection();
    try {
      document.execCommand(command, false, value);
    } catch {
      // Bỏ qua nếu trình duyệt không hỗ trợ lệnh con
    }
    syncEditorHtml();
  };

  const openLinkPopover = () => {
    captureSelection();
    const selText = window.getSelection()?.toString().trim() ?? '';
    setLinkTextInput(selText);
    setLinkUrlInput('https://');
    setPopoverError('');
    setActivePopover((prev) => (prev === 'link' ? 'none' : 'link'));
  };

  const openInlineImagePopover = () => {
    captureSelection();
    setInlineImgUrlInput('https://');
    setInlineImgAltInput('');
    setPopoverError('');
    setActivePopover((prev) => (prev === 'image' ? 'none' : 'image'));
  };

  const handleInsertLink = () => {
    const safeUrl = sanitizeExternalUrl(linkUrlInput);
    if (!safeUrl) {
      setPopoverError('Vui lòng nhập liên kết bắt đầu bằng http:// hoặc https://.');
      return;
    }

    restoreSelection();
    const anchor = document.createElement('a');
    anchor.href = safeUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = linkTextInput.trim() || safeUrl;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(anchor);
      range.setStartAfter(anchor);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (editorRef.current) {
      editorRef.current.appendChild(anchor);
    }

    syncEditorHtml();
    setActivePopover('none');
  };

  const handleInsertInlineImage = () => {
    const safeSrc = sanitizeImageSrc(inlineImgUrlInput);
    if (!safeSrc) {
      setPopoverError(
        'Vui lòng nhập đường dẫn ảnh hợp lệ (https://... hoặc http://...).'
      );
      return;
    }

    restoreSelection();
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = safeSrc;
    img.alt = inlineImgAltInput.trim() || 'Ảnh minh họa bài viết';
    figure.appendChild(img);

    if (inlineImgAltInput.trim()) {
      const caption = document.createElement('figcaption');
      caption.textContent = inlineImgAltInput.trim();
      figure.appendChild(caption);
    }

    const spacer = document.createElement('p');
    spacer.appendChild(document.createElement('br'));

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.collapse(false);
      range.insertNode(spacer);
      range.insertNode(figure);
    } else if (editorRef.current) {
      editorRef.current.appendChild(figure);
      editorRef.current.appendChild(spacer);
    }

    syncEditorHtml();
    setActivePopover('none');
  };

  const handleUploadCoverFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImageError('');
    setIsUploadingImage(true);
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setImageUrl(compressed);
      setImageUrlInput('');
    } catch (err) {
      setImageError(
        err instanceof Error ? err.message : 'Không thể xử lý ảnh tải lên.'
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFetchCoverUrl = () => {
    setImageError('');
    const safe = sanitizeImageSrc(imageUrlInput);
    if (!safe) {
      setImageError(
        'Link ảnh chưa hợp lệ. Hãy dán đường dẫn bắt đầu bằng https:// hoặc http://.'
      );
      return;
    }
    setImageUrl(safe);
  };

  const effectiveCategory = isCustomCategory
    ? customCategoryInput.trim() || DEFAULT_ARTICLE_CATEGORIES[0]
    : category;

  const buildArticlePayload = (targetStatus: ArticleStatus): Article => {
    const cleanContent = sanitizeRichHtmlString(
      editorRef.current?.innerHTML ?? contentHtml
    );
    const cleanExternal =
      sourceType === 'external_link' ? sanitizeExternalUrl(externalUrl) : undefined;

    return {
      id: initialArticle?.id || `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      content: cleanContent,
      imageUrl: sanitizeImageSrc(imageUrl),
      imageCaption: imageCaption.trim() || undefined,
      category: effectiveCategory,
      sourceType,
      externalUrl: cleanExternal,
      sourceName:
        sourceType === 'external_link'
          ? sourceName.trim() || undefined
          : undefined,
      authorName: authorName.trim() || defaultAuthorName,
      relatedArtisanId: relatedArtisanId || undefined,
      isSpotlight,
      isFeatured,
      isPinned,
      status: targetStatus,
      publishedAt: initialArticle?.publishedAt || formatVietnamDate(),
      createdAt: initialArticle?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSubmit = async (targetStatus: ArticleStatus) => {
    setFormError('');
    if (!title.trim()) {
      setFormError('Vui lòng nhập Tiêu đề chính cho bài viết.');
      return;
    }

    const currentHtml = editorRef.current?.innerHTML ?? contentHtml;
    const stats = getRichTextStats(currentHtml);
    if (
      sourceType === 'original' &&
      stats.chars < 10 &&
      !currentHtml.includes('<img')
    ) {
      setFormError('Vui lòng nhập nội dung bài viết (tối thiểu 10 ký tự).');
      return;
    }

    if (sourceType === 'external_link') {
      const safeExt = sanitizeExternalUrl(externalUrl);
      if (!safeExt) {
        setFormError(
          'Bài tin từ báo chí cần có đường dẫn bài gốc hợp lệ (https://...).'
        );
        return;
      }
    }

    const payload = buildArticlePayload(targetStatus);
    setIsSaving(true);
    try {
      await onSave(payload);
    } finally {
      setIsSaving(false);
    }
  };

  const previewArticle = useMemo(
    () => buildArticlePayload('published'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      title,
      subtitle,
      contentHtml,
      imageUrl,
      imageCaption,
      effectiveCategory,
      sourceType,
      externalUrl,
      sourceName,
      authorName,
      relatedArtisanId,
      isSpotlight,
      isFeatured,
      isPinned,
    ]
  );

  const previewRelatedArtisan = useMemo(
    () => artisans.find((a) => a.id === relatedArtisanId) ?? null,
    [artisans, relatedArtisanId]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Chỉnh sửa bài viết' : 'Đăng bài viết mới'}
      className="fixed inset-0 z-50 bg-[#1F2933]/55 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
    >
      <div className="w-full max-w-6xl h-[94dvh] rounded-2xl bg-[#FAF8F5] border border-[#E5DFD5] shadow-2xl flex flex-col overflow-hidden">
        {/* Header CMS */}
        <div className="px-5 py-3.5 bg-white border-b border-[#E8E2D9] flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-[#1F2933] truncate">
              {isEditing
                ? 'Chỉnh sửa bài viết'
                : sourceType === 'external_link'
                  ? 'Soạn tin nhập từ link báo'
                  : 'Đăng bài viết mới'}
            </h2>
            <p className="text-xs text-[#616E7C]">
              Đồng bộ trực tiếp lên bảng Bản tin cộng đồng của Góc Thợ Quanh Ta
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trình soạn thảo"
            className="w-10 h-10 rounded-xl hover:bg-[#FAF8F5] text-[#52606D] flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân CMS 2 cột */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 sm:p-6">
          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-xl bg-[#C84B31]/10 border border-[#C84B31]/30 px-4 py-3 text-xs sm:text-sm font-medium text-[#A3361F]"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT TRÁI (8/12): Nội dung chính */}
            <div className="lg:col-span-8 space-y-5">
              {/* Tiêu đề chính + Bộ đếm ký tự */}
              <div className="rounded-2xl bg-white border border-[#E8E2D9] p-4 sm:p-5 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="cms-article-title"
                      className="text-xs font-bold text-[#1F2933]"
                    >
                      Tiêu đề chính <span className="text-[#C84B31]">*</span>
                    </label>
                    <span className="text-[11px] text-[#616E7C] tabular-nums">
                      {title.length} ký tự
                    </span>
                  </div>
                  <input
                    id="cms-article-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề thu hút, ấm áp và rõ ý..."
                    className="w-full h-11 px-3.5 rounded-xl border border-[#DFD8CE] bg-[#FAF8F5] focus:bg-white text-sm sm:text-base font-semibold text-[#1F2933] focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15"
                  />
                </div>

                {/* Sa-pô tóm tắt + Bộ đếm ký tự */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="cms-article-subtitle"
                      className="text-xs font-bold text-[#1F2933]"
                    >
                      Tiêu đề phụ / Sa-pô tóm tắt
                    </label>
                    <span className="text-[11px] text-[#616E7C] tabular-nums">
                      {subtitle.length} ký tự
                    </span>
                  </div>
                  <textarea
                    id="cms-article-subtitle"
                    rows={3}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Đoạn mở đầu tóm tắt nội dung chính sẽ hiển thị trên thẻ bài viết..."
                    className="w-full p-3.5 rounded-xl border border-[#DFD8CE] bg-[#FAF8F5] focus:bg-white text-sm text-[#1F2933] leading-relaxed focus:outline-none focus:border-[#D96B38] focus:ring-2 focus:ring-[#D96B38]/15 resize-y"
                  />
                </div>

                {/* Thông tin nguồn báo nếu là external_link */}
                {sourceType === 'external_link' && (
                  <div className="rounded-xl bg-[#FAF8F5] border border-[#E5DFD5] p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#3A6B5C]">
                        Tên trang báo nguồn
                      </label>
                      <input
                        type="text"
                        value={sourceName}
                        onChange={(e) => setSourceName(e.target.value)}
                        placeholder="VD: Tuổi Trẻ Online, VnExpress..."
                        className="w-full h-10 px-3 rounded-lg border border-[#DFD8CE] bg-white text-xs sm:text-sm text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#3A6B5C]">
                        Đường dẫn bài gốc (URL) *
                      </label>
                      <input
                        type="url"
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full h-10 px-3 rounded-lg border border-[#DFD8CE] bg-white text-xs sm:text-sm text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Khung Nội dung bài viết * có Rich-Text Toolbar */}
              <div className="rounded-2xl bg-white border border-[#E8E2D9] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#EFECE6] bg-[#FAF8F5] flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#1F2933]">
                    Nội dung bài viết{' '}
                    {sourceType === 'original' && (
                      <span className="text-[#C84B31]">*</span>
                    )}
                  </span>
                  <span className="text-[11px] text-[#616E7C]">
                    Hỗ trợ định dạng văn bản, tiêu đề mục, trích dẫn, liên kết &amp; ảnh
                  </span>
                </div>

                {/* Thanh công cụ định dạng */}
                <div
                  role="toolbar"
                  aria-label="Thanh công cụ định dạng nội dung"
                  className="px-3 py-2 border-b border-[#EFECE6] bg-white flex flex-wrap items-center gap-1"
                >
                  <button
                    type="button"
                    title="In đậm"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runFormatCommand('bold')}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF8F5] text-[#1F2933] flex items-center justify-center transition-colors"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="In nghiêng"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runFormatCommand('italic')}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF8F5] text-[#1F2933] flex items-center justify-center transition-colors"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Gạch chân"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runFormatCommand('underline')}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF8F5] text-[#1F2933] flex items-center justify-center transition-colors"
                  >
                    <Underline className="w-4 h-4" />
                  </button>

                  <span className="w-px h-5 bg-[#E8E2D9] mx-1" />

                  <button
                    type="button"
                    title="Tiêu đề mục H2"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runFormatCommand('formatBlock', '<h2>')}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF8F5] text-[#1F2933] flex items-center justify-center transition-colors"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Tiêu đề mục H3"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runFormatCommand('formatBlock', '<h3>')}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF8F5] text-[#1F2933] flex items-center justify-center transition-colors"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Trích dẫn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runFormatCommand('formatBlock', '<blockquote>')}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF8F5] text-[#1F2933] flex items-center justify-center transition-colors"
                  >
                    <Quote className="w-4 h-4" />
                  </button>

                  <span className="w-px h-5 bg-[#E8E2D9] mx-1" />

                  <button
                    type="button"
                    title="Danh sách gạch đầu dòng"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runFormatCommand('insertUnorderedList')}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF8F5] text-[#1F2933] flex items-center justify-center transition-colors"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Danh sách đánh số"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runFormatCommand('insertOrderedList')}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF8F5] text-[#1F2933] flex items-center justify-center transition-colors"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>

                  <span className="w-px h-5 bg-[#E8E2D9] mx-1" />

                  <button
                    type="button"
                    title="Căn trái"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runFormatCommand('justifyLeft')}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF8F5] text-[#1F2933] flex items-center justify-center transition-colors"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Căn giữa"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runFormatCommand('justifyCenter')}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF8F5] text-[#1F2933] flex items-center justify-center transition-colors"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Căn phải"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runFormatCommand('justifyRight')}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF8F5] text-[#1F2933] flex items-center justify-center transition-colors"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Căn đều hai bên"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runFormatCommand('justifyFull')}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF8F5] text-[#1F2933] flex items-center justify-center transition-colors"
                  >
                    <AlignJustify className="w-4 h-4" />
                  </button>

                  <span className="w-px h-5 bg-[#E8E2D9] mx-1" />

                  <button
                    type="button"
                    title="Chèn liên kết"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={openLinkPopover}
                    className={`h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                      activePopover === 'link'
                        ? 'bg-[#D96B38] text-white'
                        : 'hover:bg-[#FAF8F5] text-[#1F2933]'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Liên kết</span>
                  </button>
                  <button
                    type="button"
                    title="Chèn ảnh bằng URL"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={openInlineImagePopover}
                    className={`h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                      activePopover === 'image'
                        ? 'bg-[#D96B38] text-white'
                        : 'hover:bg-[#FAF8F5] text-[#1F2933]'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Chèn ảnh</span>
                  </button>
                </div>

                {/* Popover Chèn liên kết / Chèn ảnh */}
                {activePopover !== 'none' && (
                  <div className="px-4 py-3 bg-[#FAF8F5] border-b border-[#E8E2D9] space-y-2.5">
                    {activePopover === 'link' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-[11px] font-semibold text-[#52606D]">
                            Chữ hiển thị
                          </label>
                          <input
                            type="text"
                            value={linkTextInput}
                            onChange={(e) => setLinkTextInput(e.target.value)}
                            placeholder="VD: Xem thêm tại đây"
                            className="w-full h-9 px-3 rounded-lg border border-[#DFD8CE] bg-white text-xs text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                          />
                        </div>
                        <div className="sm:col-span-5 space-y-1">
                          <label className="text-[11px] font-semibold text-[#52606D]">
                            Đường dẫn (https://...)
                          </label>
                          <input
                            type="url"
                            value={linkUrlInput}
                            onChange={(e) => setLinkUrlInput(e.target.value)}
                            placeholder="https://..."
                            className="w-full h-9 px-3 rounded-lg border border-[#DFD8CE] bg-white text-xs text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                          />
                        </div>
                        <div className="sm:col-span-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleInsertLink}
                            className="flex-1 h-9 px-3 rounded-lg bg-[#D96B38] hover:bg-[#C25A2B] text-white text-xs font-semibold inline-flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Chèn</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePopover('none')}
                            className="h-9 px-2.5 rounded-lg border border-[#DFD8CE] bg-white text-xs text-[#52606D]"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                        <div className="sm:col-span-5 space-y-1">
                          <label className="text-[11px] font-semibold text-[#52606D]">
                            Đường dẫn ảnh (URL)
                          </label>
                          <input
                            type="url"
                            value={inlineImgUrlInput}
                            onChange={(e) => setInlineImgUrlInput(e.target.value)}
                            placeholder="https://.../photo.jpg"
                            className="w-full h-9 px-3 rounded-lg border border-[#DFD8CE] bg-white text-xs text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                          />
                        </div>
                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-[11px] font-semibold text-[#52606D]">
                            Chú thích ảnh
                          </label>
                          <input
                            type="text"
                            value={inlineImgAltInput}
                            onChange={(e) => setInlineImgAltInput(e.target.value)}
                            placeholder="Mô tả ngắn dưới ảnh..."
                            className="w-full h-9 px-3 rounded-lg border border-[#DFD8CE] bg-white text-xs text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                          />
                        </div>
                        <div className="sm:col-span-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleInsertInlineImage}
                            className="flex-1 h-9 px-3 rounded-lg bg-[#3A6B5C] hover:bg-[#2F574A] text-white text-xs font-semibold inline-flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Chèn ảnh</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePopover('none')}
                            className="h-9 px-2.5 rounded-lg border border-[#DFD8CE] bg-white text-xs text-[#52606D]"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                    {popoverError && (
                      <p className="text-xs text-[#C84B31] font-medium">
                        {popoverError}
                      </p>
                    )}
                  </div>
                )}

                {/* Vùng soạn thảo Rich Text */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={syncEditorHtml}
                  onBlur={captureSelection}
                  onKeyUp={captureSelection}
                  onMouseUp={captureSelection}
                  aria-label="Nội dung bài viết"
                  className="min-h-[300px] max-h-[460px] overflow-y-auto thin-scrollbar p-5 text-[15px] leading-[1.8] text-[#1F2933] focus:outline-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-1.5 [&_blockquote]:my-4 [&_blockquote]:py-3 [&_blockquote]:px-4 [&_blockquote]:border-y [&_blockquote]:border-[#E5DFD5] [&_blockquote]:bg-[#FAF8F5] [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_a]:text-[#D96B38] [&_a]:underline [&_img]:rounded-xl [&_img]:my-3 [&_img]:max-h-72 [&_img]:object-cover [&_figcaption]:text-xs [&_figcaption]:text-[#616E7C] [&_figcaption]:italic [&_figcaption]:text-center"
                />

                {/* Bộ đếm số từ & số ký tự bên dưới khung soạn thảo */}
                <div className="px-4 py-2.5 border-t border-[#EFECE6] bg-[#FAF8F5] flex items-center justify-between text-xs text-[#616E7C] tabular-nums">
                  <span>
                    <strong className="text-[#1F2933]">{contentStats.words}</strong>{' '}
                    từ ·{' '}
                    <strong className="text-[#1F2933]">{contentStats.chars}</strong>{' '}
                    ký tự
                  </span>
                  <span>Ước tính {contentStats.readMinutes} phút đọc</span>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI (4/12): Thiết lập bài viết */}
            <div className="lg:col-span-4 space-y-5">
              {/* Thuộc tính bài viết */}
              <div className="rounded-2xl bg-white border border-[#E8E2D9] p-4 space-y-3">
                <h3 className="text-xs font-bold text-[#1F2933]">
                  Thuộc tính bài viết
                </h3>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#1F2933]">
                  <input
                    type="checkbox"
                    checked={isSpotlight}
                    onChange={(e) => setIsSpotlight(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#D96B38] rounded"
                  />
                  <span>
                    <strong className="block font-semibold">
                      Tin tiêu điểm (Hero spotlight)
                    </strong>
                    <span className="text-[11px] text-[#616E7C]">
                      Hiển thị lớn nổi bật ở đầu trang Bản tin
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#1F2933]">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#D96B38] rounded"
                  />
                  <span>
                    <strong className="block font-semibold">Tin nổi bật</strong>
                    <span className="text-[11px] text-[#616E7C]">
                      Đánh dấu bài viết đáng đọc trong chuyên mục
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#1F2933]">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#3A6B5C] rounded"
                  />
                  <span>
                    <strong className="block font-semibold">Ghim đầu trang</strong>
                    <span className="text-[11px] text-[#616E7C]">
                      Luôn giữ bài viết ở vị trí đầu tiên trên bảng tin
                    </span>
                  </span>
                </label>
              </div>

              {/* Ảnh đại diện bài viết */}
              <div className="rounded-2xl bg-white border border-[#E8E2D9] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-[#1F2933]">
                    Ảnh đại diện bài viết
                  </h3>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImageUrlInput('');
                      }}
                      className="text-[11px] font-semibold text-[#C84B31] hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Gỡ ảnh</span>
                    </button>
                  )}
                </div>

                {/* Xem trước ảnh */}
                <div className="aspect-[16/9] rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={imageCaption || title || 'Ảnh đại diện bài viết'}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setImageError(
                          'Không tải được ảnh từ đường dẫn này. Bạn hãy thử tải ảnh trực tiếp từ máy tính.'
                        )
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4 space-y-1 text-[#7B8794]">
                      <ImageIcon className="w-7 h-7 mx-auto opacity-60" />
                      <p className="text-[11px]">Chưa có ảnh đại diện</p>
                    </div>
                  )}
                </div>

                {/* Tải ảnh từ máy tính */}
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleUploadCoverFile}
                  className="sr-only"
                />
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => coverFileInputRef.current?.click()}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-dashed border-[#D96B38]/60 bg-[#D96B38]/6 hover:bg-[#D96B38]/12 text-xs font-semibold text-[#D96B38] inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isUploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>
                    {isUploadingImage
                      ? 'Đang nén ảnh...'
                      : 'Tải ảnh từ máy tính'}
                  </span>
                </button>

                {/* Hoặc dán link ảnh trực tiếp + nút Lấy về */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#616E7C]">
                    Hoặc dán link ảnh trực tiếp
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://.../anh-bia.jpg"
                      className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-[#DFD8CE] bg-[#FAF8F5] text-xs text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                    />
                    <button
                      type="button"
                      onClick={handleFetchCoverUrl}
                      className="h-9 px-3 rounded-lg bg-[#1F2933] hover:bg-[#323F4B] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                    >
                      Lấy về
                    </button>
                  </div>
                </div>

                {imageError && (
                  <p className="text-[11px] text-[#C84B31] font-medium leading-relaxed">
                    {imageError}
                  </p>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#52606D]">
                    Mô tả / Chú thích ảnh
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="VD: Góc bàn sửa giày sáng sớm của Chú Ba..."
                    className="w-full h-9 px-3 rounded-lg border border-[#DFD8CE] bg-[#FAF8F5] text-xs text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                  />
                </div>
              </div>

              {/* Chuyên mục, Tác giả & Gắn thẻ cô chú thợ liên quan */}
              <div className="rounded-2xl bg-white border border-[#E8E2D9] p-4 space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1F2933]">
                    Chuyên mục
                  </label>
                  <select
                    value={isCustomCategory ? '__custom__' : category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-[#DFD8CE] bg-[#FAF8F5] text-xs sm:text-sm font-medium text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                  >
                    {allCategoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Nhập chuyên mục mới...</option>
                  </select>
                  {isCustomCategory && (
                    <input
                      type="text"
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      placeholder="Nhập tên chuyên mục mới..."
                      className="w-full h-9 px-3 rounded-lg border border-[#D96B38]/60 bg-white text-xs text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1F2933]">
                    Gắn thẻ cô chú thợ liên quan
                  </label>
                  <select
                    value={relatedArtisanId}
                    onChange={(e) => setRelatedArtisanId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#DFD8CE] bg-[#FAF8F5] text-xs sm:text-sm text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                  >
                    <option value="">— Không gắn thẻ thợ —</option>
                    {artisans.map((artisan) => (
                      <option key={artisan.id} value={artisan.id}>
                        {artisan.name} ({artisan.district})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#616E7C]">
                    Khi gắn thẻ, cuối bài viết sẽ có nút chuyển thẳng tới vị trí cô
                    chú thợ trên bản đồ.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1F2933]">
                    Tên tác giả hiển thị
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder={defaultAuthorName}
                    className="w-full h-10 px-3 rounded-xl border border-[#DFD8CE] bg-[#FAF8F5] text-xs sm:text-sm text-[#1F2933] focus:outline-none focus:border-[#D96B38]"
                  />
                </div>

                <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
                  <span className="text-[#616E7C]">Loại bài viết</span>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#FAF8F5] border border-[#E5DFD5]">
                    <button
                      type="button"
                      onClick={() => setSourceType('original')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        sourceType === 'original'
                          ? 'bg-white text-[#1F2933] shadow-xs'
                          : 'text-[#616E7C]'
                      }`}
                    >
                      Tự viết
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceType('external_link')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        sourceType === 'external_link'
                          ? 'bg-white text-[#D96B38] shadow-xs'
                          : 'text-[#616E7C]'
                      }`}
                    >
                      Link báo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh hành động dưới cùng */}
        <div className="px-5 py-3.5 bg-white border-t border-[#E8E2D9] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-[#DFD8CE] bg-[#FAF8F5] hover:bg-[#F2ECE2] text-xs sm:text-sm font-semibold text-[#52606D] transition-colors"
          >
            Đóng
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[#3A6B5C]/30 bg-[#3A6B5C]/8 hover:bg-[#3A6B5C]/15 text-xs sm:text-sm font-semibold text-[#3A6B5C] inline-flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Xem trước</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSubmit('draft')}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[#DFD8CE] bg-white hover:bg-[#FAF8F5] disabled:opacity-60 text-xs sm:text-sm font-semibold text-[#1F2933] inline-flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Lưu tin nháp</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSubmit('published')}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-[#D96B38] hover:bg-[#C25A2B] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Xuất bản</span>
            </button>
          </div>
        </div>
      </div>

      {/* Popup Xem trước bài viết */}
      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem trước bài viết"
          className="fixed inset-0 z-[60] bg-[#1F2933]/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6"
        >
          <div className="w-full max-w-4xl max-h-[92dvh] rounded-2xl bg-[#FAF8F5] border border-[#E5DFD5] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-3 bg-white border-b border-[#E8E2D9] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#3A6B5C]">
                <Eye className="w-4 h-4" />
                <span>Chế độ xem trước hiển thị trên Bản tin</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#1F2933] text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Đóng xem trước</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto thin-scrollbar">
              <ArticleDetailView
                article={previewArticle}
                relatedArtisan={previewRelatedArtisan}
                isPreview
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
