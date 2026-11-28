import type { AvatarItem } from '../../types/avatar';

interface AvatarItemSwatchProps {
  item: AvatarItem;
  size?: 'sm' | 'md' | 'lg';
  overrideColor?: string;
}

/**
 * Hình minh họa mini Lineless Flat Vector cho từng vật phẩm trong Creator, Tủ đồ, Bộ sưu tập & Modal Chi tiết
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

  if (item.assetUrl) {
    return (
      <div
        className={`${dimClass} rounded-2xl bg-[#FBF8F2] border border-[#EAE0D2] flex items-center justify-center shrink-0 overflow-hidden p-1.5`}
        aria-hidden="true"
      >
        <img
          src={item.assetUrl}
          alt=""
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

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
                <circle cx="22" cy="28" r="11" fill={primary} />
                <circle cx="34" cy="22" r="12" fill={primary} />
                <circle cx="44" cy="29" r="10" fill={primary} />
                <circle cx="29" cy="37" r="10" fill={primary} />
                <circle cx="40" cy="37" r="10" fill={primary} />
                <path d="M36 12 C39 6, 45 9, 42 16 Z" fill={primary} />
              </>
            )}
            {variant === 'neat_bangs' && (
              <path
                d="M14 40 C14 18, 50 18, 50 40 L46 40 C44 33, 40 31, 38 31 L26 31 C24 31, 20 33, 18 40 Z"
                fill={primary}
              />
            )}
            {variant === 'soft_bob' && (
              <path
                d="M13 43 C12 20, 52 20, 51 43 C51 50, 44 51, 42 44 C41 34, 23 34, 22 44 C20 51, 13 50, 13 43 Z"
                fill={primary}
              />
            )}
            {variant === 'twin_buns' && (
              <>
                <circle cx="16" cy="20" r="8" fill={primary} />
                <circle cx="48" cy="20" r="8" fill={primary} />
                <rect x="19" y="23" width="6" height="3" rx="1.5" transform="rotate(-35 19 23)" fill="#B93818" />
                <rect x="39" y="23" width="6" height="3" rx="1.5" transform="rotate(35 39 23)" fill="#B93818" />
                <path d="M18 41 C18 22, 46 22, 46 41 C42 36, 36 34, 32 34 C28 34, 22 36, 18 41 Z" fill={primary} />
              </>
            )}
            {variant === 'fresh_undercut' && (
              <>
                <path d="M17 40 C17 22, 47 22, 47 40 L44 35 C38 29, 26 29, 20 35 Z" fill={secondary} />
                <ellipse cx="32" cy="22" rx="16" ry="9" fill={primary} />
              </>
            )}
            {variant === 'long_flowing' && (
              <path
                d="M14 53 L14 30 C14 16, 50 16, 50 30 L50 53 C44 53, 42 46, 42 36 C36 32, 28 32, 22 36 C22 46, 20 53, 14 53 Z"
                fill={primary}
              />
            )}
          </g>
        )}

        {item.slot === 'top' && (
          <g>
            {/* Tay áo */}
            <path
              d="M20 20 L9 32 L16 38 L22 31 Z"
              fill={
                variant === 'guardian_jacket' || variant === 'craft_apron'
                  ? secondary
                  : primary
              }
            />
            <path
              d="M44 20 L55 32 L48 38 L42 31 Z"
              fill={
                variant === 'guardian_jacket' || variant === 'craft_apron'
                  ? secondary
                  : primary
              }
            />
            {/* Thân áo */}
            <path
              d="M21 19 L43 19 L46 50 C46 52, 44 53, 42 53 L22 53 C20 53, 18 52, 18 50 Z"
              fill={
                variant === 'striped_red_tee' || variant === 'craft_apron'
                  ? secondary
                  : primary
              }
            />

            {variant === 'striped_red_tee' && (
              <>
                <rect x="20" y="19" width="5" height="34" fill={primary} />
                <rect x="29" y="19" width="6" height="34" fill={primary} />
                <rect x="39" y="19" width="5" height="34" fill={primary} />
              </>
            )}

            {variant === 'basic_tee' && (
              <>
                <path d="M25 18 C27 24, 37 24, 39 18" fill="none" stroke={secondary} strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="38" cy="30" r="3" fill={accent} />
              </>
            )}

            {variant === 'warm_hoodie' && (
              <>
                <rect x="24" y="38" width="16" height="10" rx="3" fill="#233C73" />
                <line x1="29" y1="22" x2="29" y2="33" stroke={secondary} strokeWidth="2.2" strokeLinecap="round" />
                <line x1="35" y1="22" x2="35" y2="33" stroke={secondary} strokeWidth="2.2" strokeLinecap="round" />
              </>
            )}

            {variant === 'ba_ba_modern' && (
              <>
                <line x1="32" y1="22" x2="32" y2="52" stroke={accent} strokeWidth="1.5" />
                <circle cx="32" cy="27" r="1.8" fill={secondary} />
                <circle cx="32" cy="34" r="1.8" fill={secondary} />
                <circle cx="32" cy="41" r="1.8" fill={secondary} />
              </>
            )}

            {variant === 'ao_dai_modern' && (
              <>
                <rect x="27" y="15" width="10" height="5" rx="2" fill={primary} />
                <circle cx="34" cy="24" r="1.8" fill={accent} />
                <circle cx="37" cy="28" r="1.8" fill={accent} />
                <circle cx="40" cy="32" r="1.8" fill={accent} />
                <path d="M21 48 L43 48 L45 57 L19 57 Z" fill={primary} />
              </>
            )}

            {variant === 'craft_apron' && (
              <>
                <path d="M23 25 L41 25 L43 53 L21 53 Z" fill={primary} />
                <rect x="25" y="34" width="3.5" height="8" rx="1" fill="#F1C34E" />
                <rect x="30" y="35" width="4.5" height="7" rx="1" fill={accent} />
                <rect x="25" y="39" width="14" height="9" rx="2.5" fill="#70452C" />
              </>
            )}

            {variant === 'winter_knit' && (
              <>
                <rect x="19" y="29" width="26" height="5" fill={secondary} />
                <rect x="19" y="36" width="26" height="3" fill={accent} />
              </>
            )}

            {variant === 'guardian_jacket' && (
              <>
                <rect x="30.5" y="20" width="3" height="32" fill="#142C63" />
                <circle cx="39" cy="30" r="4" fill="#F7F2E8" />
                <circle cx="39" cy="30" r="2.6" fill={secondary} />
                <rect x="19" y="48" width="26" height="4" fill={secondary} />
              </>
            )}
          </g>
        )}

        {item.slot === 'bottom' && (
          <g>
            {variant === 'floral_indigo_shorts' ? (
              <>
                <path d="M17 18 L47 18 L50 43 L35 43 L32 34 L29 43 L14 43 Z" fill={primary} />
                <circle cx="32" cy="27" r="4" fill={secondary} />
                <circle cx="20" cy="37" r="3.5" fill={secondary} />
                <circle cx="44" cy="37" r="3.5" fill={secondary} />
                <ellipse cx="22" cy="25" rx="4" ry="2" transform="rotate(-24 22 25)" fill={accent} />
                <ellipse cx="42" cy="26" rx="4" ry="2" transform="rotate(24 42 26)" fill={accent} />
              </>
            ) : variant === 'pleated_skirt' ? (
              <>
                <path d="M21 18 L43 18 L51 47 L13 47 Z" fill={primary} />
                <line x1="15" y1="42" x2="49" y2="42" stroke={secondary} strokeWidth="2.5" />
                <line x1="27" y1="18" x2="23" y2="47" stroke={accent} strokeWidth="1.5" />
                <line x1="37" y1="18" x2="41" y2="47" stroke={accent} strokeWidth="1.5" />
              </>
            ) : (
              <>
                <path d="M19 16 L45 16 L47 50 L36 50 L32 31 L28 50 L17 50 Z" fill={primary} />
                <rect x="17" y="46" width="11" height="5" rx="2" fill={secondary} />
                <rect x="36" y="46" width="11" height="5" rx="2" fill={secondary} />
              </>
            )}
          </g>
        )}

        {item.slot === 'shoes' && (
          <g>
            {variant === 'pastel_slides' ? (
              <>
                <rect x="12" y="38" width="40" height="8" rx="4" fill={secondary} stroke="#E4DACB" strokeWidth="1" />
                <path d="M19 38 C22 26, 40 26, 43 38 Z" fill={primary} />
              </>
            ) : (
              <>
                <path
                  d="M12 41 C12 31, 21 25, 31 27 L45 34 C51 36, 53 40, 53 43 L12 43 Z"
                  fill={primary}
                />
                {variant === 'black_canvas_sneakers' && (
                  <>
                    <path d="M44 35 C49 36, 53 39, 53 42 L44 42 Z" fill="#FFFFFF" />
                    <rect x="27" y="30" width="8" height="2.2" rx="1" fill="#FFFFFF" />
                    <rect x="30" y="34" width="8" height="2.2" rx="1" fill="#FFFFFF" />
                  </>
                )}
                {variant === 'craft_boots' && (
                  <rect x="15" y="19" width="14" height="14" rx="3" fill={primary} />
                )}
                <rect x="11" y="42" width="43" height="6" rx="3" fill={secondary} stroke="#DFD6C7" strokeWidth="1" />
                {variant === 'cream_canvas_shoes' && (
                  <rect x="13" y="44.5" width="39" height="1.8" fill={accent} />
                )}
              </>
            )}
          </g>
        )}

        {item.slot === 'headwear' && (
          <g>
            {variant === 'awning_cap' && (
              <>
                <path d="M14 39 C15 21, 46 21, 47 39 Z" fill={primary} />
                <path d="M22 39 C23 26, 28 22, 32 22 L33 39 Z" fill={secondary} />
                <path d="M39 39 L40 24 C44 27, 46 32, 47 39 Z" fill={secondary} />
                <path d="M12 38 C28 34, 46 35, 56 41 C54 44, 38 45, 13 42 Z" fill="#142C63" />
              </>
            )}
            {variant === 'beanie' && (
              <>
                <circle cx="32" cy="16" r="5" fill={accent} />
                <path d="M15 39 C15 21, 49 21, 49 39 Z" fill={primary} />
                <rect x="13" y="36" width="38" height="9" rx="4.5" fill={secondary} />
              </>
            )}
            {variant === 'non_la' && (
              <>
                <path d="M32 14 L56 41 C42 44, 22 44, 8 41 Z" fill={primary} />
                <line x1="20" y1="29" x2="44" y2="29" stroke={secondary} strokeWidth="1.8" />
                <path d="M21 42 C24 53, 40 53, 43 42" fill="none" stroke={accent} strokeWidth="2.8" strokeLinecap="round" />
              </>
            )}
            {variant === 'round_glasses' && (
              <>
                <circle cx="21" cy="33" r="9.5" fill={secondary} fillOpacity="0.45" stroke={primary} strokeWidth="2.8" />
                <circle cx="43" cy="33" r="9.5" fill={secondary} fillOpacity="0.45" stroke={primary} strokeWidth="2.8" />
                <line x1="30.5" y1="33" x2="33.5" y2="33" stroke={primary} strokeWidth="2.8" />
              </>
            )}
          </g>
        )}

        {item.slot === 'accessory' && (
          <g>
            {variant === 'film_camera' && (
              <>
                <line x1="14" y1="14" x2="22" y2="26" stroke="#4B515C" strokeWidth="3.2" strokeLinecap="round" />
                <line x1="50" y1="14" x2="42" y2="26" stroke="#3A3F49" strokeWidth="3.2" strokeLinecap="round" />
                <rect x="14" y="23" width="36" height="24" rx="5" fill={primary} />
                <rect x="20" y="19" width="8" height="4" rx="2" fill="#B8C2D6" />
                <circle cx="28" cy="36" r="8" fill={secondary} />
                <circle cx="28" cy="36" r="5.2" fill="#182138" />
                <circle cx="26.5" cy="34.5" r="1.6" fill="#FFFFFF" />
                <circle cx="42" cy="28" r="2.2" fill={accent} />
              </>
            )}
            {variant === 'revive_backpack' && (
              <>
                <rect x="17" y="16" width="30" height="34" rx="12" fill={primary} />
                <ellipse cx="26" cy="26" rx="5" ry="6" transform="rotate(-15 26 26)" fill={secondary} />
                <ellipse cx="39" cy="34" rx="5" ry="6" transform="rotate(15 39 34)" fill={secondary} />
                <ellipse cx="28" cy="42" rx="6" ry="4" fill={secondary} />
              </>
            )}
            {variant === 'craft_toolpack' && (
              <>
                <rect x="38" y="12" width="6" height="16" rx="2.5" transform="rotate(16 41 20)" fill="#D9A163" />
                <rect x="17" y="21" width="30" height="30" rx="9" fill={primary} />
                <rect x="24" y="31" width="16" height="5" rx="2.5" fill={secondary} />
              </>
            )}
            {variant === 'tape_measure' && (
              <>
                <path d="M22 16 C18 24, 18 36, 20 49" fill="none" stroke={primary} strokeWidth="7" strokeLinecap="round" />
                <path d="M42 16 C46 24, 46 36, 44 49" fill="none" stroke={primary} strokeWidth="7" strokeLinecap="round" />
                <path d="M22 16 C28 20, 36 20, 42 16" fill="none" stroke="#E5B238" strokeWidth="6" strokeLinecap="round" />
                <line x1="17" y1="30" x2="21" y2="30" stroke={secondary} strokeWidth="1.8" />
                <line x1="17" y1="38" x2="21" y2="38" stroke={secondary} strokeWidth="1.8" />
                <line x1="43" y1="30" x2="47" y2="30" stroke={secondary} strokeWidth="1.8" />
                <line x1="43" y1="38" x2="47" y2="38" stroke={secondary} strokeWidth="1.8" />
              </>
            )}
            {variant === 'coffee_cup' && (
              <>
                <line x1="34" y1="10" x2="38" y2="23" stroke={accent} strokeWidth="3" strokeLinecap="round" />
                <path d="M21 22 C21 14, 43 14, 43 22 Z" fill="#FFFFFF" stroke="#E6DEC9" strokeWidth="1" />
                <path d="M21 22 L43 22 L40 48 C39 51, 25 51, 24 48 Z" fill={primary} />
                <path d="M23 39 L41 39 L40 48 C39 51, 25 51, 24 48 Z" fill={secondary} />
              </>
            )}
            {variant === 'crossbody_mini' && (
              <>
                <path d="M23 23 C23 13, 41 13, 41 23" fill="none" stroke={secondary} strokeWidth="3" />
                <rect x="18" y="23" width="28" height="27" rx="5" fill={primary} />
                <rect x="18" y="29" width="28" height="6" fill={secondary} />
                <circle cx="32" cy="39" r="3" fill={accent} />
              </>
            )}
            {variant === 'thread_wrench_charm' && (
              <>
                <rect x="17" y="22" width="16" height="22" rx="4" fill={secondary} />
                <rect x="15" y="19" width="20" height="4" rx="2" fill="#D9A163" />
                <rect x="15" y="42" width="20" height="4" rx="2" fill="#D9A163" />
                <g transform="rotate(-30 42 32)">
                  <rect x="38" y="18" width="7" height="28" rx="3.5" fill={primary} />
                  <circle cx="41.5" cy="18" r="6.5" fill={primary} />
                  <circle cx="41.5" cy="15.5" r="3" fill="#FBF8F2" />
                </g>
              </>
            )}
            {variant === 'red_scarf' && (
              <>
                <rect x="14" y="22" width="36" height="12" rx="6" fill={primary} />
                <rect x="34" y="30" width="11" height="22" rx="4" fill={primary} />
                <rect x="34" y="44" width="11" height="3.5" fill={secondary} />
              </>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
