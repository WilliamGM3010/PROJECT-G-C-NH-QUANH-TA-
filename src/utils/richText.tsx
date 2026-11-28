import { createElement, Fragment, useState, type ReactNode } from 'react';
import { ImageOff } from 'lucide-react';

const ALLOWED_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'h2',
  'h3',
  'h4',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'figure',
  'figcaption',
  'hr',
  'div',
  'span',
]);

const DROPPED_SUBTREE_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'noscript',
  'template',
  'link',
  'meta',
]);

/**
 * Xác thực đường dẫn liên kết ngoài — chỉ cho phép http:// hoặc https://
 */
export function sanitizeExternalUrl(raw?: string | null): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Xác thực đường dẫn ảnh an toàn:
 * - https:// hoặc http://
 * - Ảnh tĩnh đã đóng gói (/assets/... hoặc /src/assets/...)
 * - Ảnh raster base64 data:image/(jpeg|jpg|png|webp|gif);base64,... (chặn SVG có thể chứa script)
 */
export function sanitizeImageSrc(raw?: string | null): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  if (
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('/src/assets/') ||
    trimmed.startsWith('./assets/')
  ) {
    return trimmed;
  }

  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Kiểm tra URL bài báo trước khi gửi qua Microlink API (chặn localhost & dải mạng nội bộ)
 */
export function validatePublicArticleUrl(raw: string): {
  ok: boolean;
  normalized?: string;
  error?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: 'Vui lòng dán đường dẫn bài báo (https://...).' };
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: 'Đường dẫn URL không hợp lệ. Vui lòng kiểm tra lại.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Chỉ hỗ trợ đường dẫn trang web http:// hoặc https://.' };
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return {
      ok: false,
      error: 'Không hỗ trợ đường dẫn mạng nội bộ. Vui lòng dán link bài báo công khai.',
    };
  }

  if (!host.includes('.')) {
    return { ok: false, error: 'Tên miền trang báo chưa đầy đủ. Vui lòng kiểm tra lại.' };
  }

  return { ok: true, normalized: parsed.toString() };
}

function extractSafeAlignment(el: Element): string | undefined {
  const inlineAlign = el.getAttribute('style') ?? '';
  const match = inlineAlign.match(/text-align\s*:\s*(left|center|right|justify)/i);
  if (match && ALLOWED_ALIGNMENTS.has(match[1].toLowerCase())) {
    return match[1].toLowerCase();
  }
  const attrAlign = (el.getAttribute('align') ?? '').toLowerCase();
  if (ALLOWED_ALIGNMENTS.has(attrAlign)) {
    return attrAlign;
  }
  return undefined;
}

/**
 * Làm sạch chuỗi HTML soạn thảo thành tập thẻ ngữ nghĩa an toàn (dùng DOMParser nội bộ,
 * không thực thi script, chỉ giữ thẻ & thuộc tính cho phép).
 */
export function sanitizeRichHtmlString(rawHtml: string): string {
  if (!rawHtml || !rawHtml.trim()) return '';
  if (typeof DOMParser === 'undefined') {
    return rawHtml.replace(/[<>]/g, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const outDoc = document.implementation.createHTMLDocument('');

  function cloneCleanNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return outDoc.createTextNode(node.textContent ?? '');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (DROPPED_SUBTREE_TAGS.has(tag)) {
      return null;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      const frag = outDoc.createDocumentFragment();
      el.childNodes.forEach((child) => {
        const cleaned = cloneCleanNode(child);
        if (cleaned) frag.appendChild(cleaned);
      });
      return frag;
    }

    const cleanTag = tag === 'b' ? 'strong' : tag === 'i' ? 'em' : tag === 'strike' ? 's' : tag;
    const cleanEl = outDoc.createElement(cleanTag);

    if (cleanTag === 'a') {
      const safeHref = sanitizeExternalUrl(el.getAttribute('href'));
      if (!safeHref) {
        const frag = outDoc.createDocumentFragment();
        el.childNodes.forEach((child) => {
          const cleaned = cloneCleanNode(child);
          if (cleaned) frag.appendChild(cleaned);
        });
        return frag;
      }
      cleanEl.setAttribute('href', safeHref);
      cleanEl.setAttribute('target', '_blank');
      cleanEl.setAttribute('rel', 'noopener noreferrer');
    }

    if (cleanTag === 'img') {
      const safeSrc = sanitizeImageSrc(el.getAttribute('src'));
      if (!safeSrc) return null;
      cleanEl.setAttribute('src', safeSrc);
      const alt = (el.getAttribute('alt') ?? '').trim().slice(0, 240);
      if (alt) cleanEl.setAttribute('alt', alt);
      return cleanEl;
    }

    const align = extractSafeAlignment(el);
    if (align && ['p', 'h2', 'h3', 'h4', 'blockquote', 'div', 'figcaption'].includes(cleanTag)) {
      cleanEl.setAttribute('style', `text-align: ${align}`);
    }

    el.childNodes.forEach((child) => {
      const cleaned = cloneCleanNode(child);
      if (cleaned) cleanEl.appendChild(cleaned);
    });

    return cleanEl;
  }

  const container = outDoc.createElement('div');
  doc.body.childNodes.forEach((child) => {
    const cleaned = cloneCleanNode(child);
    if (cleaned) container.appendChild(cleaned);
  });

  return container.innerHTML.trim();
}

/**
 * Tạo DocumentFragment sạch để nạp vào vùng contentEditable mà không gán raw innerHTML không kiểm duyệt.
 */
export function buildSanitizedFragment(
  rawHtml: string,
  targetDoc: Document = document
): DocumentFragment {
  const fragment = targetDoc.createDocumentFragment();
  if (!rawHtml || !rawHtml.trim() || typeof DOMParser === 'undefined') {
    return fragment;
  }

  const safeHtml = sanitizeRichHtmlString(rawHtml);
  const parsed = new DOMParser().parseFromString(safeHtml, 'text/html');
  Array.from(parsed.body.childNodes).forEach((child) => {
    fragment.appendChild(targetDoc.importNode(child, true));
  });
  return fragment;
}

/**
 * Đếm số từ, số ký tự và ước tính thời gian đọc từ nội dung bài viết HTML.
 */
export function getRichTextStats(html: string): {
  words: number;
  chars: number;
  readMinutes: number;
  plainText: string;
} {
  if (!html || !html.trim()) {
    return { words: 0, chars: 0, readMinutes: 1, plainText: '' };
  }
  let plain = html;
  if (typeof DOMParser !== 'undefined') {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    plain = (parsed.body.textContent ?? '').replace(/\s+/g, ' ').trim();
  } else {
    plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const words = plain ? plain.split(' ').filter(Boolean).length : 0;
  const chars = plain.length;
  const readMinutes = Math.max(1, Math.ceil(words / 200));
  return { words, chars, readMinutes, plainText: plain };
}

/**
 * Nén ảnh tải lên từ thiết bị sang JPEG Data URL dung lượng nhẹ (< ~180KB) để lưu ổn định trên Supabase.
 */
export function compressImageFileToDataUrl(
  file: File,
  maxWidth = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      reject(new Error('Vui lòng chọn tệp ảnh định dạng JPG, PNG hoặc WebP.'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Ảnh vượt quá 10MB. Vui lòng chọn ảnh nhẹ hơn.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh này.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Tệp ảnh không hợp lệ hoặc bị hỏng.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Trình duyệt không hỗ trợ xử lý ảnh.'));
          return;
        }
        ctx.fillStyle = '#FDF8F2';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.src = String(reader.result ?? '');
    };
    reader.readAsDataURL(file);
  });
}

function ArticleInlineImage({
  src,
  alt,
  inFigure = false,
}: {
  src: string;
  alt: string;
  inFigure?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    const fallback = (
      <div className="my-4 rounded-xl bg-[#F4EFE6] border border-[#DFCBB5] p-8 flex flex-col items-center justify-center gap-2 text-[#8A8177]">
        <ImageOff className="w-6 h-6" />
        <span className="text-xs">{alt || 'Không thể tải hình ảnh minh họa'}</span>
      </div>
    );
    return inFigure ? fallback : <figure className="my-6">{fallback}</figure>;
  }

  const imageEl = (
    <img
      src={src}
      alt={alt || 'Ảnh minh họa bài viết'}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className="max-w-full w-auto h-auto mx-auto block rounded-xl my-4 border border-[#E8E2D9] bg-[#F4EFE6]"
    />
  );

  if (inFigure) {
    return imageEl;
  }

  return (
    <figure className="my-6 space-y-2">
      {imageEl}
      {alt && (
        <figcaption className="text-xs text-[#616E7C] italic text-center px-2">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Hiển thị nội dung bài viết Rich Text an toàn bằng React AST (không dùng dangerouslySetInnerHTML).
 */
export function RichTextRenderer({ html }: { html: string }) {
  if (!html || !html.trim()) return null;

  if (typeof DOMParser === 'undefined') {
    return <p className="text-base leading-relaxed text-[#2D3748]">{html}</p>;
  }

  const parsed = new DOMParser().parseFromString(html, 'text/html');

  function renderNode(node: Node, key: string, inFigure = false): ReactNode {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (DROPPED_SUBTREE_TAGS.has(tag)) {
      return null;
    }

    const childInFigure = inFigure || tag === 'figure';
    const children = Array.from(el.childNodes).map((child, idx) =>
      renderNode(child, `${key}-${idx}`, childInFigure)
    );

    if (!ALLOWED_TAGS.has(tag)) {
      return createElement(Fragment, { key }, children);
    }

    const align = extractSafeAlignment(el);
    const alignClass =
      align === 'center'
        ? 'text-center'
        : align === 'right'
          ? 'text-right'
          : align === 'justify'
            ? 'text-justify'
            : '';

    switch (tag) {
      case 'br':
        return <br key={key} />;
      case 'hr':
        return <hr key={key} className="my-8 border-t border-[#E8E2D9]" />;
      case 'strong':
      case 'b':
        return (
          <strong key={key} className="font-bold text-[#162442]">
            {children}
          </strong>
        );
      case 'em':
      case 'i':
        return (
          <em key={key} className="italic">
            {children}
          </em>
        );
      case 'u':
        return (
          <u key={key} className="underline underline-offset-4 decoration-[#E86F2C]/65">
            {children}
          </u>
        );
      case 's':
      case 'strike':
        return (
          <s key={key} className="line-through text-[#5C564E]">
            {children}
          </s>
        );
      case 'h2':
        return (
          <h2
            key={key}
            className={`font-display text-xl sm:text-2xl font-bold text-[#162442] tracking-tight mt-9 mb-3.5 leading-snug ${alignClass}`}
          >
            {children}
          </h2>
        );
      case 'h3':
        return (
          <h3
            key={key}
            className={`font-display text-lg sm:text-xl font-bold text-[#162442] mt-7 mb-2.5 leading-snug ${alignClass}`}
          >
            {children}
          </h3>
        );
      case 'h4':
        return (
          <h4
            key={key}
            className={`font-display text-base font-bold text-[#162442] mt-5 mb-2 ${alignClass}`}
          >
            {children}
          </h4>
        );
      case 'blockquote':
        return (
          <blockquote
            key={key}
            className={`my-7 py-5 px-6 border-y border-dashed border-[#D8C3AE] border-l-4 border-l-[#B93818] bg-[#FDF8F2] text-lg sm:text-xl italic text-[#162442] leading-relaxed rounded-r-xl ${alignClass}`}
          >
            {children}
          </blockquote>
        );
      case 'ul':
        return (
          <ul
            key={key}
            className="my-4 pl-6 list-disc space-y-2 text-[#162442] marker:text-[#E86F2C]"
          >
            {children}
          </ul>
        );
      case 'ol':
        return (
          <ol
            key={key}
            className="my-4 pl-6 list-decimal space-y-2 text-[#162442] marker:text-[#1B3B82] marker:font-mono marker:font-bold"
          >
            {children}
          </ol>
        );
      case 'li':
        return (
          <li key={key} className="leading-[1.8] pl-1">
            {children}
          </li>
        );
      case 'a': {
        const safeHref = sanitizeExternalUrl(el.getAttribute('href'));
        if (!safeHref) {
          return createElement(Fragment, { key }, children);
        }
        return (
          <a
            key={key}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1B3B82] hover:text-[#E86F2C] underline underline-offset-4 decoration-[#1B3B82]/40 hover:decoration-[#E86F2C] font-semibold transition-colors"
          >
            {children}
          </a>
        );
      }
      case 'img': {
        const safeSrc = sanitizeImageSrc(el.getAttribute('src'));
        if (!safeSrc) return null;
        return (
          <ArticleInlineImage
            key={key}
            src={safeSrc}
            alt={(el.getAttribute('alt') ?? '').trim()}
            inFigure={inFigure}
          />
        );
      }
      case 'figure':
        return (
          <figure key={key} className="my-6 space-y-2">
            {children}
          </figure>
        );
      case 'figcaption':
        return (
          <figcaption
            key={key}
            className={`text-xs text-[#616E7C] italic text-center px-2 leading-relaxed ${alignClass}`}
          >
            {children}
          </figcaption>
        );
      case 'p':
        return (
          <p key={key} className={`my-4 leading-[1.85] text-[#2D3748] ${alignClass}`}>
            {children}
          </p>
        );
      case 'div':
        return (
          <div key={key} className={`my-3 leading-[1.85] text-[#2D3748] ${alignClass}`}>
            {children}
          </div>
        );
      case 'span':
        return (
          <span key={key} className={alignClass}>
            {children}
          </span>
        );
      default:
        return createElement(Fragment, { key }, children);
    }
  }

  return (
    <div className="text-[15.5px] sm:text-[16.5px] text-[#2D3748] break-words">
      {Array.from(parsed.body.childNodes).map((child, idx) =>
        renderNode(child, `root-${idx}`, false)
      )}
    </div>
  );
}
