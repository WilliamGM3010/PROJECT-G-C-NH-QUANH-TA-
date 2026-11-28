import type { AvatarItem } from '../../types/avatar';

interface AvatarItemSwatchProps {
  item: AvatarItem;
  size?: 'sm' | 'md' | 'lg';
  overrideColor?: string;
}

/**
 * Hình minh họa vector gọn đẹp mô phỏng kiểu dáng & phối màu thật của từng món đồ Chibi 3D
 */
export function AvatarItemSwatch({
  item,
  size = 'md',
  overrideColor,
}: AvatarItemSwatchProps) {
  const primary = overrideColor ?? item.modelConfig.primaryColor;
  const secondary = item.modelConfig.secondaryColor ?? '#F7F2E8';
  const accent = item.modelConfig.accentColor ?? '#D46534';
  const variant = item.modelConfig.styleVariant;

  const dimClass =
    size === 'lg' ? 'w-24 h-24' : size === 'sm' ? 'w-11 h-11' : 'w-14 h-14';

  return (
    <div
      className={`${dimClass} rounded-2xl bg-[#FBF8F2] border border-[#EAE0D2] flex items-center justify-center shrink-0 overflow-hidden`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="w-[82%] h-[82%]">
        {item.slot === 'hair' && (
          <g>
            {variant === 'fluffy_curls' && (
              <>
                <circle cx="22" cy="27" r="11" fill={primary} />
                <circle cx="34" cy="22" r="12" fill={primary} />
                <circle cx="44" cy="29" r="10" fill={primary} />
                <circle cx="29" cy="36" r="11" fill={primary} />
                <circle cx="40" cy="37" r="10" fill={primary} />
                <ellipse cx="42" cy="13" rx="3" ry="5" transform="rotate(24 42 13)" fill={primary} />
              </>
            )}
            {variant === 'neat_bangs' && (
              <>
                <path d="M14 38 C14 18, 50 18, 50 38 L50 45 C44 45, 42 36, 42 31 L22 31 C22 36, 20 45, 14 45 Z" fill={primary} />
                <rect x="20" y="24" width="24" height="10" rx="4" fill={primary} />
              </>
            )}
            {variant === 'soft_bob' && (
              <path d="M13 42 C12 20, 52 20, 51 42 C51 49, 44 50, 42 44 C41 34, 23 34, 22 44 C20 50, 13 49, 13 42 Z" fill={primary} />
            )}
            {variant === 'twin_buns' && (
              <>
                <circle cx="17" cy="20" r="8" fill={primary} />
                <circle cx="47" cy="20" r="8" fill={primary} />
                <rect x="19" y="23" width="6" height="3" rx="1.5" transform="rotate(-35 19 23)" fill={accent} />
                <rect x="39" y="23" width="6" height="3" rx="1.5" transform="rotate(35 39 23)" fill={accent} />
                <path d="M18 39 C18 22, 46 22, 46 39 C42 35, 36 33, 32 33 C28 33, 22 35, 18 39 Z" fill={primary} />
              </>
            )}
            {variant === 'fresh_undercut' && (
              <>
                <path d="M17 38 C17 22, 47 22, 47 38 L44 34 C38 28, 26 28, 20 34 Z" fill={primary} />
                <ellipse cx="32" cy="22" rx="15" ry="9" fill={primary} />
                <ellipse cx="26" cy="19" rx="9" ry="5" fill={primary} />
              </>
            )}
            {variant === 'long_flowing' && (
              <path d="M14 52 L14 30 C14 16, 50 16, 50 30 L50 52 C44 52, 42 46, 42 36 C36 32, 28 32, 22 36 C22 46, 20 52, 14 52 Z" fill={primary} />
            )}
          </g>
        )}

        {item.slot === 'top' && (
          <g>
            {/* Sleeves */}
            <path
              d="M20 20 L10 31 L16 37 L22 31 Z"
              fill={
                variant === 'basic_tee'
                  ? accent
                  : variant === 'bomber_jacket' ||
                      variant === 'guardian_jacket' ||
                      variant === 'craft_apron'
                    ? secondary
                    : primary
              }
            />
            <path
              d="M44 20 L54 31 L48 37 L42 31 Z"
              fill={
                variant === 'basic_tee' ||
                variant === 'bomber_jacket' ||
                variant === 'guardian_jacket' ||
                variant === 'craft_apron'
                  ? secondary
                  : primary
              }
            />
            {/* Torso */}
            <path
              d="M21 19 L43 19 L46 49 C46 51, 44 52, 42 52 L22 52 C20 52, 18 51, 18 49 Z"
              fill={variant === 'craft_apron' ? secondary : primary}
            />
            {/* Neck collar */}
            <path
              d="M25 18 C27 24, 37 24, 39 18"
              fill="none"
              stroke={
                variant === 'basic_tee' ||
                variant === 'bomber_jacket' ||
                variant === 'guardian_jacket'
                  ? secondary
                  : accent
              }
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Specific top details */}
            {variant === 'warm_hoodie' && (
              <>
                <rect x="24" y="38" width="16" height="9" rx="3" fill={secondary} opacity="0.25" />
                <line x1="29" y1="23" x2="29" y2="33" stroke={secondary} strokeWidth="2" strokeLinecap="round" />
                <line x1="35" y1="23" x2="35" y2="33" stroke={secondary} strokeWidth="2" strokeLinecap="round" />
              </>
            )}
            {(variant === 'bomber_jacket' || variant === 'guardian_jacket') && (
              <>
                <line x1="32" y1="22" x2="32" y2="51" stroke={variant === 'guardian_jacket' ? accent : secondary} strokeWidth="2.5" />
                <circle cx="39" cy="30" r="3.5" fill={variant === 'guardian_jacket' ? '#E6B34B' : accent} />
              </>
            )}
            {variant === 'cropped_jacket' && (
              <>
                <rect x="28" y="22" width="8" height="29" fill={secondary} />
                <rect x="19" y="45" width="26" height="7" rx="2" fill={secondary} />
              </>
            )}
            {variant === 'craft_apron' && (
              <>
                <path d="M23 26 L41 26 L43 52 L21 52 Z" fill={primary} />
                <rect x="26" y="37" width="12" height="8" rx="2" fill="#6B3F29" />
                <rect x="28" y="34" width="3.5" height="5" rx="1" fill="#B93818" />
              </>
            )}
            {variant === 'ao_dai_modern' && (
              <>
                <circle cx="34" cy="24" r="1.8" fill={accent} />
                <circle cx="37" cy="28" r="1.8" fill={accent} />
                <circle cx="40" cy="32" r="1.8" fill={accent} />
                <path d="M22 48 L42 48 L44 56 L20 56 Z" fill={primary} />
              </>
            )}
            {variant === 'ba_ba_modern' && (
              <>
                <circle cx="32" cy="27" r="1.7" fill={secondary} />
                <circle cx="32" cy="33" r="1.7" fill={secondary} />
                <circle cx="32" cy="39" r="1.7" fill={secondary} />
              </>
            )}
            {variant === 'winter_knit' && (
              <>
                <rect x="20" y="30" width="24" height="5" fill={secondary} />
                <rect x="19" y="37" width="26" height="3" fill={accent} />
              </>
            )}
          </g>
        )}

        {item.slot === 'bottom' && (
          <g>
            {variant === 'pleated_skirt' ? (
              <>
                <path d="M21 18 L43 18 L51 47 L13 47 Z" fill={primary} />
                <line x1="15" y1="42" x2="49" y2="42" stroke={secondary} strokeWidth="2.5" />
                <line x1="27" y1="18" x2="23" y2="47" stroke="#1A2F54" strokeWidth="1.5" opacity="0.45" />
                <line x1="37" y1="18" x2="41" y2="47" stroke="#1A2F54" strokeWidth="1.5" opacity="0.45" />
              </>
            ) : variant === 'active_shorts' ? (
              <>
                <path d="M18 18 L46 18 L49 41 L35 41 L32 33 L29 41 L15 41 Z" fill={primary} />
                <rect x="18" y="18" width="28" height="4" rx="2" fill={secondary} />
              </>
            ) : (
              <>
                <path d="M19 16 L45 16 L47 50 L36 50 L32 31 L28 50 L17 50 Z" fill={primary} />
                <rect x="17" y="47" width="11" height="4" rx="1.5" fill={secondary} />
                <rect x="36" y="47" width="11" height="4" rx="1.5" fill={secondary} />
              </>
            )}
          </g>
        )}

        {item.slot === 'shoes' && (
          <g>
            <path
              d="M12 41 C12 31, 22 25, 31 27 L45 34 C51 36, 53 40, 53 44 L12 44 Z"
              fill={primary}
            />
            <rect x="11" y="42" width="43" height="6" rx="3" fill={secondary} stroke="#E4DACB" strokeWidth="1" />
            {variant === 'canvas_low' && (
              <path d="M44 35 C49 36, 53 39, 53 42 L44 42 Z" fill={secondary} />
            )}
            {variant === 'craft_boots' && (
              <rect x="16" y="19" width="14" height="14" rx="3" fill={primary} />
            )}
          </g>
        )}

        {item.slot === 'accessory' && (
          <g>
            {variant === 'beanie' && (
              <>
                <circle cx="32" cy="16" r="5" fill={secondary} />
                <path d="M15 39 C15 21, 49 21, 49 39 Z" fill={primary} />
                <rect x="13" y="37" width="38" height="9" rx="4.5" fill="#BF5629" />
              </>
            )}
            {variant === 'cap' && (
              <>
                <path d="M16 38 C16 22, 46 22, 46 38 Z" fill={primary} />
                <path d="M27 28 C33 28, 37 31, 38 37 L27 37 Z" fill={secondary} />
                <path d="M36 37 L55 41 C54 44, 44 45, 35 42 Z" fill={primary} />
              </>
            )}
            {variant === 'non_la' && (
              <>
                <path d="M32 15 L55 41 L9 41 Z" fill={primary} stroke={secondary} strokeWidth="2" strokeLinejoin="round" />
                <line x1="21" y1="29" x2="43" y2="29" stroke={secondary} strokeWidth="1.5" />
                <path d="M22 41 C24 52, 40 52, 42 41" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}
            {variant === 'round_glasses' && (
              <>
                <circle cx="21" cy="33" r="9.5" fill={secondary} fillOpacity="0.45" stroke={primary} strokeWidth="2.8" />
                <circle cx="43" cy="33" r="9.5" fill={secondary} fillOpacity="0.45" stroke={primary} strokeWidth="2.8" />
                <line x1="30.5" y1="33" x2="33.5" y2="33" stroke={primary} strokeWidth="2.8" />
              </>
            )}
            {variant === 'headphones' && (
              <>
                <path d="M17 36 C17 18, 47 18, 47 36" fill="none" stroke={primary} strokeWidth="5" strokeLinecap="round" />
                <rect x="12" y="31" width="9" height="16" rx="4.5" fill={secondary} />
                <rect x="43" y="31" width="9" height="16" rx="4.5" fill={secondary} />
              </>
            )}
            {variant === 'saigon_tote' && (
              <>
                <path d="M24 24 C24 14, 40 14, 40 24" fill="none" stroke={secondary} strokeWidth="3" />
                <rect x="18" y="24" width="28" height="27" rx="4" fill={primary} stroke="#DFD3C2" strokeWidth="1.5" />
                <rect x="18" y="31" width="28" height="5" fill={secondary} />
                <circle cx="32" cy="42" r="3" fill={accent} />
              </>
            )}
            {variant === 'craft_pouch' && (
              <>
                <rect x="12" y="25" width="40" height="7" rx="3" fill={primary} />
                <rect x="27" y="24" width="10" height="9" rx="2" fill={accent} />
                <rect x="19" y="31" width="15" height="18" rx="3" fill="#663B24" />
                <line x1="39" y1="18" x2="39" y2="44" stroke={secondary} strokeWidth="4" strokeLinecap="round" />
                <circle cx="39" cy="18" r="4.5" fill="none" stroke={secondary} strokeWidth="2.5" />
              </>
            )}
            {variant === 'red_scarf' && (
              <>
                <rect x="15" y="22" width="34" height="12" rx="6" fill={primary} />
                <rect x="33" y="30" width="11" height="22" rx="3" fill={primary} />
                <rect x="33" y="44" width="11" height="3.5" fill={secondary} />
              </>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
