import { useState } from 'react';
import type { IllustrationVariant } from '../types/artisan';

interface ArtisanIllustrationProps {
  variant: IllustrationVariant;
  alt: string;
  customImageUrl?: string;
  className?: string;
}

/**
 * Hiển thị ảnh góc nghề (nếu người dùng tự tải lên) hoặc tranh minh họa đồ nghề
 * phong cách ấn phẩm thủ công Sài Gòn ấm áp, không bao giờ lỗi vỡ ảnh.
 */
export function ArtisanIllustration({
  variant,
  alt,
  customImageUrl,
  className = '',
}: ArtisanIllustrationProps) {
  const [imgError, setImgError] = useState(false);

  if (customImageUrl && !imgError) {
    return (
      <img
        src={customImageUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
    >
      {variant === 'cobbler' && <CobblerArtwork />}
      {variant === 'tailor' && <TailorArtwork />}
      {variant === 'locksmith' && <LocksmithArtwork />}
      {variant === 'bag_repair' && <BagRepairArtwork />}
      {variant === 'knit_tailor' && <KnitTailorArtwork />}
      {variant === 'leather_shoes' && <LeatherShoesArtwork />}
    </div>
  );
}

function CobblerArtwork() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="cobblerBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4E3D1" />
          <stop offset="55%" stopColor="#E9CEB3" />
          <stop offset="100%" stopColor="#D7B18E" />
        </linearGradient>
        <linearGradient id="woodDesk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A66B46" />
          <stop offset="100%" stopColor="#7C4B2E" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#cobblerBg)" />
      {/* Sunlit sidewalk dappled shadows */}
      <circle cx="340" cy="48" r="78" fill="#FFF7EB" opacity="0.55" />
      <circle cx="70" cy="40" r="52" fill="#3A6B5C" opacity="0.12" />
      <circle cx="115" cy="25" r="38" fill="#3A6B5C" opacity="0.09" />
      {/* Workbench surface */}
      <rect x="0" y="198" width="400" height="102" fill="url(#woodDesk)" />
      <line x1="0" y1="200" x2="400" y2="200" stroke="#C6895E" strokeWidth="3" opacity="0.6" />
      {/* Waxed thread spool */}
      <g transform="translate(46, 152)">
        <rect x="6" y="10" width="36" height="44" rx="4" fill="#FAF8F5" stroke="#D96B38" strokeWidth="2.5" />
        <line x1="6" y1="20" x2="42" y2="20" stroke="#D96B38" strokeWidth="1.5" opacity="0.7" />
        <line x1="6" y1="30" x2="42" y2="30" stroke="#D96B38" strokeWidth="1.5" opacity="0.7" />
        <line x1="6" y1="40" x2="42" y2="40" stroke="#D96B38" strokeWidth="1.5" opacity="0.7" />
        <rect x="0" y="4" width="48" height="8" rx="3" fill="#5D3721" />
        <rect x="0" y="50" width="48" height="8" rx="3" fill="#5D3721" />
      </g>
      {/* Sneaker being stitched */}
      <g transform="translate(115, 108)">
        <path
          d="M20 82 C20 55, 42 36, 70 36 L98 36 C110 56, 134 65, 168 68 C184 70, 195 79, 195 92 L195 102 L18 102 Z"
          fill="#FAF8F5"
          stroke="#1F2933"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M18 92 L195 92 L195 104 C195 109, 190 112, 184 112 L28 112 C21 112, 18 108, 18 102 Z" fill="#D96B38" stroke="#1F2933" strokeWidth="3" />
        {/* Stitch marks along sole */}
        <path d="M30 101 L182 101" stroke="#FAF8F5" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
        {/* Sneaker collar & laces */}
        <path d="M52 38 L78 66" stroke="#3A6B5C" strokeWidth="4" strokeLinecap="round" />
        <path d="M100 50 L114 44 M110 59 L124 53 M120 67 L134 61" stroke="#D96B38" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* Cobbler awl & glue tin */}
      <g transform="translate(318, 146)">
        <rect x="4" y="20" width="44" height="44" rx="5" fill="#E9A825" stroke="#1F2933" strokeWidth="2.5" />
        <rect x="4" y="34" width="44" height="16" fill="#FAF8F5" opacity="0.9" />
        <rect x="10" y="12" width="32" height="10" rx="2" fill="#52606D" stroke="#1F2933" strokeWidth="2" />
      </g>
      {/* Stitching needle arc */}
      <path d="M88 182 Q132 135 162 208" fill="none" stroke="#D96B38" strokeWidth="2.2" strokeDasharray="4 4" />
      <g transform="translate(268, 224) rotate(-18)">
        <rect x="0" y="0" width="52" height="14" rx="7" fill="#5D3721" stroke="#1F2933" strokeWidth="2" />
        <path d="M52 7 L96 7" stroke="#E2E8F0" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function TailorArtwork() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="tailorBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E6EFEA" />
          <stop offset="55%" stopColor="#D3E2DA" />
          <stop offset="100%" stopColor="#BACFC4" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#tailorBg)" />
      {/* Warm sunlit window glow */}
      <rect x="260" y="20" width="110" height="140" rx="14" fill="#FAF8F5" opacity="0.55" />
      {/* Wooden sewing table */}
      <rect x="0" y="204" width="400" height="96" fill="#9C6B49" />
      <rect x="0" y="204" width="400" height="8" fill="#B8835C" />
      {/* Classic black vintage sewing machine */}
      <g transform="translate(96, 86)">
        <rect x="16" y="106" width="196" height="18" rx="6" fill="#1F2933" />
        <path
          d="M174 106 L174 32 C174 18, 162 12, 146 12 L42 12 C28 12, 22 22, 22 36 L22 72 L46 72 L46 42 L134 42 C142 42, 146 48, 146 56 L146 106 Z"
          fill="#1F2933"
        />
        {/* Golden vintage scrollwork detail */}
        <path d="M62 27 L146 27" stroke="#E9A825" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="160" cy="54" r="7" fill="none" stroke="#E9A825" strokeWidth="2" />
        {/* Balance wheel */}
        <circle cx="192" cy="50" r="22" fill="#323F4B" stroke="#1F2933" strokeWidth="3" />
        <circle cx="192" cy="50" r="10" fill="#E9A825" />
        {/* Needle bar */}
        <line x1="34" y1="72" x2="34" y2="104" stroke="#CBD2D9" strokeWidth="3" strokeLinecap="round" />
        {/* Denim fabric being hemmed */}
        <path d="M-8 106 L96 106 L82 124 L-18 124 Z" fill="#3A6B5C" stroke="#1F2933" strokeWidth="2" />
        <line x1="4" y1="115" x2="78" y2="115" stroke="#FAF8F5" strokeWidth="2" strokeDasharray="5 4" />
      </g>
      {/* Colorful thread spools */}
      <g transform="translate(36, 154)">
        <rect x="0" y="12" width="22" height="38" rx="3" fill="#D96B38" stroke="#1F2933" strokeWidth="2" />
        <rect x="28" y="18" width="22" height="32" rx="3" fill="#E9A825" stroke="#1F2933" strokeWidth="2" />
      </g>
      {/* Measuring tape curve */}
      <path
        d="M274 236 C308 214, 344 252, 382 224"
        fill="none"
        stroke="#E9A825"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M274 236 C308 214, 344 252, 382 224"
        fill="none"
        stroke="#1F2933"
        strokeWidth="2"
        strokeDasharray="2 7"
      />
    </svg>
  );
}

function LocksmithArtwork() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="lockBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5ECD7" />
          <stop offset="60%" stopColor="#EADAB8" />
          <stop offset="100%" stopColor="#D9C396" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#lockBg)" />
      {/* Tree canopy shade */}
      <circle cx="52" cy="30" r="68" fill="#3A6B5C" opacity="0.16" />
      <circle cx="128" cy="18" r="46" fill="#3A6B5C" opacity="0.1" />
      {/* Key board display */}
      <rect x="40" y="56" width="142" height="148" rx="12" fill="#3A6B5C" stroke="#1F2933" strokeWidth="3" />
      <rect x="50" y="66" width="122" height="128" rx="6" fill="#2F594C" />
      {/* Hanging brass keys */}
      {[72, 102, 132].map((x) => (
        <g key={x} transform={`translate(${x}, 84)`}>
          <circle cx="10" cy="10" r="8" fill="#E9A825" stroke="#1F2933" strokeWidth="2" />
          <circle cx="10" cy="10" r="3" fill="#2F594C" />
          <rect x="7" y="18" width="6" height="28" rx="1.5" fill="#E9A825" stroke="#1F2933" strokeWidth="1.8" />
          <rect x="13" y="30" width="5" height="4" fill="#E9A825" />
          <rect x="13" y="38" width="6" height="4" fill="#E9A825" />
        </g>
      ))}
      {[84, 120].map((x) => (
        <g key={x} transform={`translate(${x}, 140)`}>
          <circle cx="10" cy="10" r="8" fill="#E2E8F0" stroke="#1F2933" strokeWidth="2" />
          <rect x="7" y="18" width="6" height="24" rx="1.5" fill="#E2E8F0" stroke="#1F2933" strokeWidth="1.8" />
        </g>
      ))}
      {/* Counter surface */}
      <rect x="0" y="204" width="400" height="96" fill="#8C6245" />
      {/* Classic wristwatch being serviced */}
      <g transform="translate(226, 86)">
        <rect x="44" y="6" width="32" height="136" rx="8" fill="#5D3721" stroke="#1F2933" strokeWidth="3" />
        <circle cx="60" cy="74" r="42" fill="#FAF8F5" stroke="#1F2933" strokeWidth="3.5" />
        <circle cx="60" cy="74" r="34" fill="#FFFDF9" stroke="#D96B38" strokeWidth="2" />
        {/* Watch hands */}
        <line x1="60" y1="74" x2="60" y2="52" stroke="#1F2933" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="60" y1="74" x2="78" y2="82" stroke="#D96B38" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="60" cy="74" r="4" fill="#1F2933" />
        {/* Crown */}
        <rect x="102" y="68" width="8" height="12" rx="2" fill="#E9A825" stroke="#1F2933" strokeWidth="2" />
      </g>
      {/* Precision screwdriver */}
      <g transform="translate(200, 238) rotate(-8)">
        <rect x="0" y="0" width="56" height="10" rx="5" fill="#D96B38" stroke="#1F2933" strokeWidth="2" />
        <line x1="56" y1="5" x2="112" y2="5" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function BagRepairArtwork() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bagBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F2E7DF" />
          <stop offset="60%" stopColor="#E4CFC0" />
          <stop offset="100%" stopColor="#D3B49E" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bagBg)" />
      <circle cx="330" cy="54" r="64" fill="#FAF8F5" opacity="0.5" />
      {/* Table */}
      <rect x="0" y="206" width="400" height="94" fill="#7D563B" />
      {/* Canvas backpack */}
      <g transform="translate(110, 62)">
        {/* Top loop */}
        <path d="M70 18 C70 0, 108 0, 108 18" fill="none" stroke="#1F2933" strokeWidth="6" strokeLinecap="round" />
        {/* Main body */}
        <rect x="24" y="18" width="130" height="148" rx="34" fill="#3A6B5C" stroke="#1F2933" strokeWidth="3.5" />
        {/* Front pocket */}
        <rect x="44" y="90" width="90" height="62" rx="14" fill="#2F594C" stroke="#1F2933" strokeWidth="2.5" />
        {/* Heavy-duty brass zipper arc */}
        <path
          d="M42 74 C42 40, 136 40, 136 74"
          fill="none"
          stroke="#E9A825"
          strokeWidth="5"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        {/* Zipper slider pull */}
        <g transform="translate(124, 54) rotate(22)">
          <rect x="0" y="0" width="16" height="24" rx="4" fill="#D96B38" stroke="#1F2933" strokeWidth="2.5" />
          <circle cx="8" cy="17" r="2.5" fill="#FAF8F5" />
        </g>
        {/* Pocket zipper */}
        <line x1="56" y1="106" x2="122" y2="106" stroke="#E9A825" strokeWidth="3.5" strokeDasharray="4 3" />
      </g>
      {/* Pliers & spare buckles on desk */}
      <g transform="translate(284, 214)">
        <rect x="0" y="10" width="54" height="32" rx="8" fill="#1F2933" />
        <rect x="10" y="18" width="14" height="16" rx="3" fill="#FAF8F5" />
        <rect x="30" y="18" width="14" height="16" rx="3" fill="#FAF8F5" />
      </g>
      <g transform="translate(40, 224)">
        <rect x="0" y="0" width="46" height="28" rx="5" fill="#D96B38" stroke="#1F2933" strokeWidth="2.5" />
        <line x1="10" y1="14" x2="36" y2="14" stroke="#FAF8F5" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function KnitTailorArtwork() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="knitBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7ECE4" />
          <stop offset="60%" stopColor="#ECD8CA" />
          <stop offset="100%" stopColor="#DFC2AE" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#knitBg)" />
      <rect x="0" y="206" width="400" height="94" fill="#9E7151" />
      {/* Folded knit cardigan swatch */}
      <g transform="translate(76, 86)">
        <rect x="0" y="20" width="166" height="114" rx="18" fill="#D96B38" stroke="#1F2933" strokeWidth="3" />
        {/* Woven knit pattern lines */}
        <path d="M18 46 H148 M18 68 H148 M18 90 H148 M18 112 H148" stroke="#FAF8F5" strokeWidth="2" strokeDasharray="8 6" opacity="0.65" />
        {/* Wooden mending mushroom / darning patch */}
        <circle cx="110" cy="76" r="24" fill="#FAF8F5" stroke="#1F2933" strokeWidth="2.5" />
        <path d="M96 76 L124 76 M110 62 L110 90" stroke="#3A6B5C" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* Button jar */}
      <g transform="translate(274, 114)">
        <rect x="8" y="16" width="66" height="82" rx="14" fill="#FAF8F5" fillOpacity="0.82" stroke="#1F2933" strokeWidth="2.5" />
        <rect x="16" y="6" width="50" height="12" rx="4" fill="#3A6B5C" stroke="#1F2933" strokeWidth="2" />
        <circle cx="30" cy="72" r="10" fill="#E9A825" stroke="#1F2933" strokeWidth="1.8" />
        <circle cx="52" cy="76" r="9" fill="#D96B38" stroke="#1F2933" strokeWidth="1.8" />
        <circle cx="42" cy="54" r="10" fill="#3A6B5C" stroke="#1F2933" strokeWidth="1.8" />
      </g>
      {/* Yarn ball */}
      <g transform="translate(226, 206)">
        <circle cx="28" cy="28" r="26" fill="#E9A825" stroke="#1F2933" strokeWidth="2.5" />
        <path d="M10 18 Q28 32 48 16 M8 34 Q28 20 48 38" fill="none" stroke="#9E7151" strokeWidth="2" />
      </g>
    </svg>
  );
}

function LeatherShoesArtwork() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="pasteurWall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5DF9F" />
          <stop offset="55%" stopColor="#E9C974" />
          <stop offset="100%" stopColor="#D7B257" />
        </linearGradient>
      </defs>
      {/* Iconic Pasteur golden yellow wall */}
      <rect width="400" height="300" fill="url(#pasteurWall)" />
      {/* Subtle colonial plaster shadow */}
      <path d="M0 0 L150 0 L90 206 L0 206 Z" fill="#C9A245" opacity="0.28" />
      {/* Low wooden cobbler stool */}
      <rect x="0" y="206" width="400" height="94" fill="#6E472D" />
      <rect x="0" y="206" width="400" height="8" fill="#8C5B3C" />
      {/* Classic brown leather derby shoe */}
      <g transform="translate(92, 108)">
        <path
          d="M22 68 C22 44, 44 30, 74 34 L106 42 C128 54, 162 62, 198 68 C214 71, 222 80, 220 92 L20 92 Z"
          fill="#7A3E1D"
          stroke="#1F2933"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        {/* Leather shine highlight */}
        <path d="M148 68 C170 72, 190 76, 202 80" stroke="#FAF8F5" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        {/* Sole & heel */}
        <path d="M20 92 L220 92 L218 102 L72 102 L72 108 L20 108 Z" fill="#1F2933" />
        {/* Laces */}
        <path d="M98 46 L112 42 M108 54 L122 50" stroke="#FAF8F5" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {/* Wax polish tin & horsehair brush */}
      <g transform="translate(310, 174)">
        <ellipse cx="32" cy="36" rx="28" ry="12" fill="#1F2933" />
        <ellipse cx="32" cy="28" rx="28" ry="12" fill="#D96B38" stroke="#1F2933" strokeWidth="2.5" />
        <ellipse cx="32" cy="28" rx="16" ry="6" fill="#FAF8F5" opacity="0.88" />
      </g>
      <g transform="translate(56, 226)">
        <rect x="0" y="0" width="96" height="18" rx="8" fill="#B87A4B" stroke="#1F2933" strokeWidth="2.5" />
        <rect x="6" y="18" width="84" height="14" rx="2" fill="#2A2421" />
      </g>
    </svg>
  );
}
