import dns from 'node:dns/promises';
import net from 'node:net';

const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const GOOGLEBOT_USER_AGENT =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 4;
const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2MB

const NAMED_HTML_ENTITIES = {
  quot: '"',
  apos: "'",
  amp: '&',
  lt: '<',
  gt: '>',
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  hellip: '…',
  bull: '•',
  copy: '©',
  reg: '®',
  trade: '™',
  laquo: '«',
  raquo: '»',
  agrave: 'à',
  aacute: 'á',
  acirc: 'â',
  atilde: 'ã',
  egrave: 'è',
  eacute: 'é',
  ecirc: 'ê',
  igrave: 'ì',
  iacute: 'í',
  ograve: 'ò',
  oacute: 'ó',
  ocirc: 'ô',
  otilde: 'õ',
  ugrave: 'ù',
  uacute: 'ú',
  yacute: 'ý',
  Agrave: 'À',
  Aacute: 'Á',
  Acirc: 'Â',
  Atilde: 'Ã',
  Egrave: 'È',
  Eacute: 'É',
  Ecirc: 'Ê',
  Igrave: 'Ì',
  Iacute: 'Í',
  Ograve: 'Ò',
  Oacute: 'Ó',
  Ocirc: 'Ô',
  Otilde: 'Õ',
  Ugrave: 'Ù',
  Uacute: 'Ú',
  Yacute: 'Ý',
};

function decodeHtmlEntities(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      const code = Number.parseInt(hex, 16);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    })
    .replace(/&#([0-9]+);/g, (match, dec) => {
      const code = Number.parseInt(dec, 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    })
    .replace(/&([a-zA-Z]+);/g, (match, name) => {
      return Object.prototype.hasOwnProperty.call(NAMED_HTML_ENTITIES, name)
        ? NAMED_HTML_ENTITIES[name]
        : match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function isPrivateOrReservedIp(ip) {
  if (!ip) return true;
  const cleaned = ip.toLowerCase().trim();

  // Handle IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
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
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a >= 224) return true; // multicast & reserved
    return false;
  }

  if (net.isIPv6(cleaned)) {
    if (cleaned === '::' || cleaned === '::1') return true;
    if (cleaned.startsWith('fc') || cleaned.startsWith('fd')) return true; // unique local fc00::/7
    if (
      cleaned.startsWith('fe8') ||
      cleaned.startsWith('fe9') ||
      cleaned.startsWith('fea') ||
      cleaned.startsWith('feb')
    ) {
      return true; // link-local fe80::/10
    }
    if (cleaned.startsWith('ff')) return true; // multicast
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

  const ipVersion = net.isIP(host);
  if (ipVersion) {
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
        return { ok: false, error: 'Tên miền trỏ tới địa chỉ mạng nội bộ không được phép.' };
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

function parseAttributes(tagString) {
  const attrs = {};
  const attrRegex =
    /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match;
  while ((match = attrRegex.exec(tagString)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[key] = value;
  }
  return attrs;
}

function extractMetaFromHtml(html, pageUrl) {
  const metaMap = new Map();
  const metaTagRegex = /<meta\b[^>]*>/gi;
  let match;
  while ((match = metaTagRegex.exec(html)) !== null) {
    const attrs = parseAttributes(match[0]);
    const key = (attrs.property || attrs.name || '').trim().toLowerCase();
    const content = attrs.content ? decodeHtmlEntities(attrs.content) : '';
    if (key && content && !metaMap.has(key)) {
      metaMap.set(key, content);
    }
  }

  const titleTagMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const titleTagText = titleTagMatch
    ? decodeHtmlEntities(titleTagMatch[1].replace(/<[^>]+>/g, ''))
    : '';

  const title =
    metaMap.get('og:title') ||
    metaMap.get('twitter:title') ||
    titleTagText ||
    '';

  const description =
    metaMap.get('og:description') ||
    metaMap.get('description') ||
    metaMap.get('twitter:description') ||
    '';

  const rawImage =
    metaMap.get('og:image:secure_url') ||
    metaMap.get('og:image') ||
    metaMap.get('twitter:image') ||
    metaMap.get('twitter:image:src') ||
    '';

  let resolvedImage = '';
  if (rawImage) {
    try {
      const resolved = new URL(rawImage, pageUrl);
      if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
        resolvedImage = resolved.toString();
      }
    } catch {
      resolvedImage = '';
    }
  }

  let fallbackHost = '';
  try {
    fallbackHost = new URL(pageUrl).hostname.replace(/^www\./i, '');
  } catch {
    fallbackHost = '';
  }

  const publisher = metaMap.get('og:site_name') || fallbackHost;

  return {
    title,
    description,
    image: resolvedImage,
    publisher,
    url: pageUrl,
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

  // Thử bằng Chrome chuẩn trước, nếu trang báo chặn (403/406) hoặc không lấy được meta thì thử lại với Googlebot
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

  let extracted = extractMetaFromHtml(fetchResult.html, fetchResult.finalUrl);

  // Nếu HTML trả về từ Chrome bị tường chống bot (không có title/description/image), thử thêm 1 lần với Googlebot nếu còn thời gian
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
      extracted = extractMetaFromHtml(botResult.html, botResult.finalUrl);
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
