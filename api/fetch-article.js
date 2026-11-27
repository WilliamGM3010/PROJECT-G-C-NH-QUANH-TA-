import dns from 'node:dns/promises';
import net from 'node:net';
import * as cheerio from 'cheerio';

const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const GOOGLEBOT_USER_AGENT =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 4;
const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2MB

const JUNK_SELECTORS = [
  'script',
  'style',
  'iframe',
  'noscript',
  'button',
  'form',
  'input',
  'select',
  'textarea',
  'svg',
  'canvas',
  '.ads',
  '[class*="ads-"]',
  '[class*="-ads"]',
  '[class*="ad-box"]',
  '[id*="ads"]',
  '[class*="related"]',
  '[class*="tinlienquan"]',
  '[type="RelatedNewsBox"]',
  '[type="RelatedOneNews"]',
  '.box-tinlienquan',
  '.tags',
  '.social-share',
  '[class*="social-share"]',
  '[class*="share-box"]',
  '.box-comment',
  '.comment-box',
  '.newsletter-box',
].join(', ');

const DOMAIN_CONTENT_SELECTORS = [
  {
    match: 'tuoitre.vn',
    selectors: [
      '.detail-content',
      '[data-role="content"]',
      '#main-detail-body',
      '.afcbc-body',
    ],
  },
  {
    match: 'vnexpress.net',
    selectors: ['article.fck_detail', '.fck_detail'],
  },
  {
    match: 'thanhnien.vn',
    selectors: ['.detail-content', '[data-role="content"]'],
  },
  {
    match: 'dantri.com.vn',
    selectors: ['.singular-content'],
  },
  {
    match: 'vietnamnet.vn',
    selectors: ['.maincontent', '.main-content'],
  },
];

const FALLBACK_CONTENT_SELECTORS = [
  '[itemprop="articleBody"]',
  '.detail-content',
  '[data-role="content"]',
  '#main-detail-body',
  '.afcbc-body',
  'article.fck_detail',
  '.fck_detail',
  '.singular-content',
  '.maincontent',
  '.main-content',
  '.article-content',
  '.post-content',
  '.entry-content',
  'article',
];

function escapeHtmlText(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlAttr(str) {
  return escapeHtmlText(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function normalizeWhitespace(str) {
  return String(str ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPrivateOrReservedIp(ip) {
  if (!ip) return true;
  const cleaned = ip.toLowerCase().trim();

  if (cleaned.startsWith('::ffff:')) {
    const mappedV4 = cleaned.slice(7);
    if (net.isIPv4(mappedV4)) {
      return isPrivateOrReservedIp(mappedV4);
    }
  }

  if (net.isIPv4(cleaned)) {
    const parts = cleaned.split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }

  if (net.isIPv6(cleaned)) {
    if (cleaned === '::' || cleaned === '::1') return true;
    if (cleaned.startsWith('fc') || cleaned.startsWith('fd')) return true;
    if (
      cleaned.startsWith('fe8') ||
      cleaned.startsWith('fe9') ||
      cleaned.startsWith('fea') ||
      cleaned.startsWith('feb')
    ) {
      return true;
    }
    if (cleaned.startsWith('ff')) return true;
    return false;
  }

  return true;
}

async function validatePublicUrlAndDns(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: 'Đường dẫn URL không hợp lệ.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Chỉ hỗ trợ giao thức http:// hoặc https://.' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: 'URL không hợp lệ.' };
  }

  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === 'metadata.google.internal'
  ) {
    return { ok: false, error: 'Không hỗ trợ truy cập địa chỉ mạng nội bộ.' };
  }

  if (net.isIP(host)) {
    if (isPrivateOrReservedIp(host)) {
      return { ok: false, error: 'Không hỗ trợ truy cập địa chỉ IP nội bộ.' };
    }
    return { ok: true, parsed };
  }

  if (!host.includes('.')) {
    return { ok: false, error: 'Tên miền bài báo không hợp lệ.' };
  }

  try {
    const records = await dns.lookup(host, { all: true, verbatim: true });
    if (!records || records.length === 0) {
      return { ok: false, error: 'Không thể phân giải tên miền trang báo.' };
    }
    for (const rec of records) {
      if (isPrivateOrReservedIp(rec.address)) {
        return {
          ok: false,
          error: 'Tên miền trỏ tới địa chỉ mạng nội bộ không được phép.',
        };
      }
    }
  } catch {
    return { ok: false, error: 'Không thể kết nối tới tên miền trang báo.' };
  }

  return { ok: true, parsed };
}

async function readLimitedText(response) {
  const contentType = response.headers.get('content-type') || '';
  const charsetMatch = contentType.match(/charset=([\w-]+)/i);
  const rawCharset = (charsetMatch ? charsetMatch[1] : 'utf-8').toLowerCase();

  const reader = response.body?.getReader?.();
  let buffer;

  if (reader) {
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_HTML_BYTES) {
        const overflow = total - MAX_HTML_BYTES;
        const keep = value.byteLength - overflow;
        if (keep > 0) chunks.push(value.subarray(0, keep));
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        break;
      }
      chunks.push(value);
    }
    const merged = new Uint8Array(Math.min(total, MAX_HTML_BYTES));
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    buffer = merged;
  } else {
    const ab = await response.arrayBuffer();
    buffer = new Uint8Array(ab.slice(0, MAX_HTML_BYTES));
  }

  try {
    return new TextDecoder(rawCharset).decode(buffer);
  } catch {
    return new TextDecoder('utf-8').decode(buffer);
  }
}

async function fetchHtmlSafely(initialUrl, userAgent, deadlineMs) {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const check = await validatePublicUrlAndDns(currentUrl);
    if (!check.ok) {
      return { ok: false, error: check.error };
    }

    const remainingMs = deadlineMs - Date.now();
    if (remainingMs <= 300) {
      return { ok: false, error: 'Quá thời gian phản hồi từ trang báo.' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remainingMs);

    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': userAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
        },
      });
      clearTimeout(timer);

      if (
        response.status >= 300 &&
        response.status < 400 &&
        response.headers.get('location')
      ) {
        if (hop === MAX_REDIRECTS) {
          return { ok: false, error: 'Trang báo chuyển hướng quá nhiều lần.' };
        }
        try {
          currentUrl = new URL(
            response.headers.get('location'),
            currentUrl
          ).toString();
        } catch {
          return { ok: false, error: 'Liên kết chuyển hướng không hợp lệ.' };
        }
        continue;
      }

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: `Trang báo trả về mã lỗi ${response.status}.`,
        };
      }

      const html = await readLimitedText(response);
      return { ok: true, html, finalUrl: currentUrl };
    } catch (err) {
      clearTimeout(timer);
      const isAbort = err && err.name === 'AbortError';
      return {
        ok: false,
        error: isAbort
          ? 'Quá thời gian kết nối tới trang báo.'
          : 'Không thể tải nội dung từ trang báo.',
      };
    }
  }

  return { ok: false, error: 'Không thể tải bài báo.' };
}

function resolveHttpUrl(rawUrl, pageUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^(data:|blob:|javascript:|about:|#)/i.test(trimmed)) return '';
  try {
    const resolved = new URL(trimmed, pageUrl);
    if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
      return resolved.toString();
    }
    return '';
  } catch {
    return '';
  }
}

function pickFirstFromSrcset(srcset, pageUrl) {
  if (!srcset || typeof srcset !== 'string') return '';
  const candidates = srcset
    .split(',')
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
  // Ưu tiên phiên bản ảnh cuối (thường là độ phân giải cao nhất)
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const resolved = resolveHttpUrl(candidates[i], pageUrl);
    if (resolved) return resolved;
  }
  return '';
}

function isPlaceholderImageUrl(url) {
  const lower = url.toLowerCase();
  return (
    lower.includes('blank.gif') ||
    lower.includes('spacer.gif') ||
    lower.includes('transparent.png') ||
    lower.includes('placeholder') ||
    lower.includes('loading.gif') ||
    lower.includes('1x1.')
  );
}

function extractRealImageUrl($, $img, pageUrl) {
  const widthAttr = Number.parseInt($img.attr('width') || '', 10);
  const heightAttr = Number.parseInt($img.attr('height') || '', 10);
  if (
    (Number.isFinite(widthAttr) && widthAttr > 0 && widthAttr <= 16) ||
    (Number.isFinite(heightAttr) && heightAttr > 0 && heightAttr <= 16)
  ) {
    return '';
  }

  const priorityAttrs = [
    'data-original',
    'data-src',
    'data-lazy-src',
    'data-actualsrc',
    'data-large-src',
    'data-url',
  ];

  for (const attr of priorityAttrs) {
    const candidate = resolveHttpUrl($img.attr(attr), pageUrl);
    if (candidate && !isPlaceholderImageUrl(candidate)) {
      return candidate;
    }
  }

  const dataSrcset = pickFirstFromSrcset($img.attr('data-srcset'), pageUrl);
  if (dataSrcset && !isPlaceholderImageUrl(dataSrcset)) {
    return dataSrcset;
  }

  // Nếu ảnh nằm trong <picture>, kiểm tra thẻ <source>
  const $picture = $img.closest('picture');
  if ($picture.length > 0) {
    let fromPicture = '';
    $picture.find('source').each((_, srcEl) => {
      if (fromPicture) return;
      const $src = $(srcEl);
      const url =
        pickFirstFromSrcset($src.attr('data-srcset'), pageUrl) ||
        pickFirstFromSrcset($src.attr('srcset'), pageUrl);
      if (url && !isPlaceholderImageUrl(url)) {
        fromPicture = url;
      }
    });
    if (fromPicture) return fromPicture;
  }

  const directSrc = resolveHttpUrl($img.attr('src'), pageUrl);
  if (directSrc && !isPlaceholderImageUrl(directSrc)) {
    return directSrc;
  }

  const srcsetFallback = pickFirstFromSrcset($img.attr('srcset'), pageUrl);
  if (srcsetFallback && !isPlaceholderImageUrl(srcsetFallback)) {
    return srcsetFallback;
  }

  return '';
}

function findArticleContainer($, pageUrl) {
  let host = '';
  try {
    host = new URL(pageUrl).hostname.toLowerCase();
  } catch {
    host = '';
  }

  const orderedSelectors = [];
  for (const rule of DOMAIN_CONTENT_SELECTORS) {
    if (host.includes(rule.match)) {
      orderedSelectors.push(...rule.selectors);
    }
  }
  for (const sel of FALLBACK_CONTENT_SELECTORS) {
    if (!orderedSelectors.includes(sel)) {
      orderedSelectors.push(sel);
    }
  }

  for (const selector of orderedSelectors) {
    const $candidates = $(selector);
    if ($candidates.length === 0) continue;

    let bestEl = null;
    let bestLen = 0;
    $candidates.each((_, el) => {
      const textLen = normalizeWhitespace($(el).text()).length;
      if (textLen > bestLen) {
        bestLen = textLen;
        bestEl = el;
      }
    });

    if (bestEl && bestLen >= 80) {
      return $(bestEl).clone();
    }
  }

  // Dự phòng cuối: tìm thẻ container có tổng độ dài các thẻ <p> lớn nhất
  let bestNode = null;
  let bestScore = 0;

  $('article, main, section, div').each((_, el) => {
    const $el = $(el);
    // Bỏ qua các thẻ gốc bao toàn trang nếu có thẻ con đặc hiệu hơn
    const pNodes = $el.find('p');
    if (pNodes.length < 2) return;

    let pTextLen = 0;
    pNodes.each((__, pEl) => {
      const len = normalizeWhitespace($(pEl).text()).length;
      if (len >= 20) pTextLen += len;
    });

    const totalLen = normalizeWhitespace($el.text()).length;
    if (totalLen === 0) return;

    // Ưu tiên khối có tỷ lệ văn bản <p> cao và độ dài đủ lớn
    const density = pTextLen / Math.max(totalLen, 1);
    const score = pTextLen * (0.6 + 0.4 * density);

    if (pTextLen >= 120 && score > bestScore) {
      // Nếu container mới bao bọc bestNode nhưng nội dung <p> hầu như giống hệt, giữ bestNode cụ thể hơn
      if (bestNode && $el.find(bestNode).length > 0 && pTextLen <= bestScore * 1.15) {
        return;
      }
      bestScore = score;
      bestNode = el;
    }
  });

  return bestNode ? $(bestNode).clone() : null;
}

function serializeInline($, node, pageUrl) {
  if (!node) return '';
  if (node.type === 'text') {
    return escapeHtmlText(node.data || '');
  }
  if (node.type !== 'tag') return '';

  const tag = node.name.toLowerCase();
  const $node = $(node);

  if (tag === 'br') return '<br />';

  if (tag === 'img') {
    const imgSrc = extractRealImageUrl($, $node, pageUrl);
    if (!imgSrc) return '';
    const alt = normalizeWhitespace($node.attr('alt') || '');
    return `<img src="${escapeHtmlAttr(imgSrc)}" alt="${escapeHtmlAttr(alt)}" />`;
  }

  const inner = ($node.contents().toArray() || [])
    .map((child) => serializeInline($, child, pageUrl))
    .join('');

  if (tag === 'strong' || tag === 'b') {
    return inner.trim() ? `<strong>${inner}</strong>` : '';
  }
  if (tag === 'em' || tag === 'i') {
    return inner.trim() ? `<em>${inner}</em>` : '';
  }

  return inner;
}

function buildPhotoFigureHtml($, $container, pageUrl) {
  const $imgs = $container.find('img');
  if ($imgs.length === 0) return '';

  const imgParts = [];
  let fallbackAlt = '';

  $imgs.each((_, imgEl) => {
    const $img = $(imgEl);
    const src = extractRealImageUrl($, $img, pageUrl);
    if (!src) return;
    const alt = normalizeWhitespace($img.attr('alt') || '');
    if (!fallbackAlt && alt) fallbackAlt = alt;
    imgParts.push(
      `<img src="${escapeHtmlAttr(src)}" alt="${escapeHtmlAttr(alt)}" />`
    );
  });

  if (imgParts.length === 0) return '';

  const captionSelectors = [
    'figcaption',
    '.PhotoCMS_Caption',
    '.Image',
    '.image-caption',
    '.caption',
    '.expEdit',
    'p.Image',
    'p',
  ];

  let captionText = '';
  for (const sel of captionSelectors) {
    const found = normalizeWhitespace($container.find(sel).first().text());
    if (found) {
      captionText = found;
      break;
    }
  }

  const finalCaption = captionText || fallbackAlt;
  const figcaptionHtml = finalCaption
    ? `<figcaption>${escapeHtmlText(finalCaption)}</figcaption>`
    : '';

  return `<figure>${imgParts.join('')}${figcaptionHtml}</figure>`;
}

function serializeBlocks($, node, pageUrl, outBlocks) {
  if (!node) return;

  if (node.type === 'text') {
    const text = normalizeWhitespace(node.data || '');
    if (text.length >= 2) {
      outBlocks.push(`<p>${escapeHtmlText(text)}</p>`);
    }
    return;
  }

  if (node.type !== 'tag') return;

  const tag = node.name.toLowerCase();
  const $node = $(node);

  // Nhận diện khối ảnh + chú thích của báo Việt Nam (figure, VCSortableInPreviewMode[type="Photo"], table.tplCaption...)
  const isVnPhotoBlock =
    tag === 'figure' ||
    ($node.attr('type') || '').toLowerCase() === 'photo' ||
    ($node.attr('class') || '').toLowerCase().includes('tplcaption') ||
    ($node.attr('class') || '').toLowerCase().includes('photo-box') ||
    ($node.attr('class') || '').toLowerCase().includes('image-box');

  if (isVnPhotoBlock && $node.find('img').length > 0) {
    const figHtml = buildPhotoFigureHtml($, $node, pageUrl);
    if (figHtml) {
      outBlocks.push(figHtml);
      return;
    }
  }

  if (tag === 'img') {
    const src = extractRealImageUrl($, $node, pageUrl);
    if (src) {
      const alt = normalizeWhitespace($node.attr('alt') || '');
      const caption = alt ? `<figcaption>${escapeHtmlText(alt)}</figcaption>` : '';
      outBlocks.push(
        `<figure><img src="${escapeHtmlAttr(src)}" alt="${escapeHtmlAttr(alt)}" />${caption}</figure>`
      );
    }
    return;
  }

  if (tag === 'picture') {
    const figHtml = buildPhotoFigureHtml($, $node, pageUrl);
    if (figHtml) outBlocks.push(figHtml);
    return;
  }

  if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
    const cleanTag = tag === 'h4' ? 'h3' : tag;
    const text = normalizeWhitespace($node.text());
    if (text) {
      outBlocks.push(`<${cleanTag}>${escapeHtmlText(text)}</${cleanTag}>`);
    }
    return;
  }

  if (tag === 'blockquote') {
    const innerText = normalizeWhitespace($node.text());
    if (innerText) {
      outBlocks.push(`<blockquote><p>${escapeHtmlText(innerText)}</p></blockquote>`);
    }
    return;
  }

  if (tag === 'ul' || tag === 'ol') {
    const items = [];
    $node.children('li').each((_, liEl) => {
      const inner = ($(liEl).contents().toArray() || [])
        .map((c) => serializeInline($, c, pageUrl))
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      if (inner) items.push(`<li>${inner}</li>`);
    });
    if (items.length > 0) {
      outBlocks.push(`<${tag}>${items.join('')}</${tag}>`);
    }
    return;
  }

  if (tag === 'p') {
    // Nếu thẻ <p> chỉ bọc ảnh minh họa, tách thành <figure> sạch
    const $imgs = $node.find('img');
    const plainText = normalizeWhitespace($node.text());
    if ($imgs.length > 0 && plainText.length === 0) {
      const figHtml = buildPhotoFigureHtml($, $node, pageUrl);
      if (figHtml) outBlocks.push(figHtml);
      return;
    }

    const inner = ($node.contents().toArray() || [])
      .map((c) => serializeInline($, c, pageUrl))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();

    if (inner && (plainText.length > 0 || inner.includes('<img'))) {
      outBlocks.push(`<p>${inner}</p>`);
    }
    return;
  }

  if (tag === 'figcaption') {
    const text = normalizeWhitespace($node.text());
    if (text) {
      outBlocks.push(`<figcaption>${escapeHtmlText(text)}</figcaption>`);
    }
    return;
  }

  // Các thẻ bọc (div, section, article, main, span, table...) -> duyệt tiếp các con
  const children = $node.contents().toArray();
  const hasBlockChildren = children.some(
    (c) =>
      c.type === 'tag' &&
      [
        'p',
        'div',
        'section',
        'article',
        'figure',
        'h2',
        'h3',
        'h4',
        'blockquote',
        'ul',
        'ol',
        'table',
        'picture',
      ].includes(c.name.toLowerCase())
  );

  if (!hasBlockChildren) {
    const plainText = normalizeWhitespace($node.text());
    const hasImg = $node.find('img').length > 0;
    if (hasImg && plainText.length === 0) {
      const figHtml = buildPhotoFigureHtml($, $node, pageUrl);
      if (figHtml) outBlocks.push(figHtml);
      return;
    }
    if (plainText.length >= 2) {
      const inner = children
        .map((c) => serializeInline($, c, pageUrl))
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      if (inner) outBlocks.push(`<p>${inner}</p>`);
    }
    return;
  }

  for (const child of children) {
    serializeBlocks($, child, pageUrl, outBlocks);
  }
}

function extractArticleContentHtml($, pageUrl) {
  const $container = findArticleContainer($, pageUrl);
  if (!$container || $container.length === 0) return '';

  // Xóa các thành phần rác bên trong thân bài
  $container.find(JUNK_SELECTORS).remove();

  const blocks = [];
  for (const child of $container.contents().toArray()) {
    serializeBlocks($, child, pageUrl, blocks);
  }

  return blocks.join('\n').trim();
}

function extractArticleFromHtml(html, pageUrl) {
  const $ = cheerio.load(html);

  const getMeta = (selector) =>
    normalizeWhitespace($(selector).first().attr('content') || '');

  const title =
    getMeta('meta[property="og:title"]') ||
    getMeta('meta[name="twitter:title"]') ||
    normalizeWhitespace($('title').first().text());

  const description =
    getMeta('meta[property="og:description"]') ||
    getMeta('meta[name="description"]') ||
    getMeta('meta[name="twitter:description"]');

  const rawImage =
    getMeta('meta[property="og:image:secure_url"]') ||
    getMeta('meta[property="og:image"]') ||
    getMeta('meta[name="twitter:image"]') ||
    getMeta('meta[name="twitter:image:src"]');

  const image = resolveHttpUrl(rawImage, pageUrl);

  let fallbackHost = '';
  try {
    fallbackHost = new URL(pageUrl).hostname.replace(/^www\./i, '');
  } catch {
    fallbackHost = '';
  }

  const publisher = getMeta('meta[property="og:site_name"]') || fallbackHost;
  const contentHtml = extractArticleContentHtml($, pageUrl);

  return {
    title,
    description,
    image,
    publisher,
    url: pageUrl,
    contentHtml,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const rawParam = Array.isArray(req.query?.url)
    ? req.query.url[0]
    : req.query?.url;
  const trimmedUrl = typeof rawParam === 'string' ? rawParam.trim() : '';

  if (!trimmedUrl) {
    return res
      .status(400)
      .json({ ok: false, error: 'Thiếu tham số url bài báo.' });
  }

  const deadlineMs = Date.now() + FETCH_TIMEOUT_MS;

  let fetchResult = await fetchHtmlSafely(
    trimmedUrl,
    CHROME_USER_AGENT,
    deadlineMs
  );

  if (!fetchResult.ok && Date.now() + 1200 < deadlineMs) {
    const retryResult = await fetchHtmlSafely(
      trimmedUrl,
      GOOGLEBOT_USER_AGENT,
      deadlineMs
    );
    if (retryResult.ok) {
      fetchResult = retryResult;
    }
  }

  if (!fetchResult.ok) {
    return res.status(502).json({
      ok: false,
      error: fetchResult.error || 'Không thể tải dữ liệu từ bài báo.',
    });
  }

  let extracted = extractArticleFromHtml(fetchResult.html, fetchResult.finalUrl);

  if (
    !extracted.title &&
    !extracted.description &&
    !extracted.image &&
    Date.now() + 1200 < deadlineMs
  ) {
    const botResult = await fetchHtmlSafely(
      trimmedUrl,
      GOOGLEBOT_USER_AGENT,
      deadlineMs
    );
    if (botResult.ok) {
      extracted = extractArticleFromHtml(botResult.html, botResult.finalUrl);
    }
  }

  if (!extracted.title && !extracted.description && !extracted.image) {
    return res.status(422).json({
      ok: false,
      error: 'Không tìm thấy thẻ tiêu đề hoặc mô tả trên trang báo này.',
    });
  }

  return res.status(200).json({
    ok: true,
    data: extracted,
  });
}
