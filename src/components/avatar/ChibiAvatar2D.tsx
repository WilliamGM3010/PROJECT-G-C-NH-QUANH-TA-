import { forwardRef, useEffect, useRef, useState } from 'react';
import {
  getAvatarItemById,
  getHairColorById,
  getSkinToneById,
} from '../../data/avatarCatalog';
import type { AvatarConfig, AvatarItem } from '../../types/avatar';

interface ChibiAvatar2DProps {
  config: AvatarConfig;
  className?: string;
  /** Tắt toàn bộ chuyển động bay / chớp mắt (dùng cho ảnh tĩnh xuất PNG & thumbnail) */
  disableAnimation?: boolean;
  /** Hiển thị bóng mặt đất tách lớp phía dưới */
  showGroundShadow?: boolean;
  /** Bật màu nền tối để bóng mặt đất tự cân chỉnh độ tương phản */
  isDarkBackdrop?: boolean;
}

function HybridLayer({
  item,
  children,
}: {
  item: AvatarItem | undefined;
  children: React.ReactNode;
}) {
  if (item?.assetUrl) {
    return (
      <image
        href={item.assetUrl}
        x="0"
        y="0"
        width="400"
        height="480"
        preserveAspectRatio="xMidYMid meet"
      />
    );
  }
  return <>{children}</>;
}

/**
 * Mascot Chibi 2D phong cách Lineless Flat Vector xếp 9 lớp tách biệt
 * Khung chuẩn viewBox="0 0 400 480" (dành sẵn ~36px thoáng trên đỉnh để bay không bị cắt tóc/nón)
 */
export const ChibiAvatar2D = forwardRef<SVGSVGElement, ChibiAvatar2DProps>(
  function ChibiAvatar2D(
    {
      config,
      className = 'w-full h-full',
      disableAnimation = false,
      showGroundShadow = true,
      isDarkBackdrop = false,
    },
    ref
  ) {
    const [popKey, setPopKey] = useState(0);
    const [showSparkles, setShowSparkles] = useState(false);
    const prevConfigSigRef = useRef<string>('');

    const configSig = JSON.stringify(config);
    useEffect(() => {
      if (disableAnimation) return;
      if (!prevConfigSigRef.current) {
        prevConfigSigRef.current = configSig;
        return;
      }
      if (prevConfigSigRef.current !== configSig) {
        prevConfigSigRef.current = configSig;
        setPopKey((k) => k + 1);
        setShowSparkles(true);
        const timer = window.setTimeout(() => setShowSparkles(false), 540);
        return () => window.clearTimeout(timer);
      }
    }, [configSig, disableAnimation]);

    const skin = getSkinToneById(config.skinId);
    const hairColor = getHairColorById(config.hairColorId);
    const hairItem = getAvatarItemById(config.hairId);
    const topItem = getAvatarItemById(config.topId);
    const bottomItem = getAvatarItemById(config.bottomId);
    const shoesItem = getAvatarItemById(config.shoesId);

    const activeAccessories = config.accessoryIds
      .map((id) => getAvatarItemById(id))
      .filter((i): i is AvatarItem => Boolean(i));

    const hasAcc = (id: string) => config.accessoryIds.includes(id);
    const backBagItem = activeAccessories.find(
      (a) => a.modelConfig.layer === 'back_bag'
    );
    const headwearItem = activeAccessories.find(
      (a) => a.modelConfig.layer === 'headwear'
    );
    const eyewearItem = activeAccessories.find(
      (a) => a.modelConfig.layer === 'eyewear'
    );

    const topVariant = topItem?.modelConfig.styleVariant ?? 'striped_red_tee';
    const bottomVariant =
      bottomItem?.modelConfig.styleVariant ?? 'floral_indigo_shorts';
    const shoesVariant =
      shoesItem?.modelConfig.styleVariant ?? 'black_canvas_sneakers';

    const topPrimary = topItem?.modelConfig.primaryColor ?? '#C84B45';
    const topSecondary = topItem?.modelConfig.secondaryColor ?? '#F6E8D3';
    const topAccent = topItem?.modelConfig.accentColor ?? '#A93631';

    const isLongSleeve =
      topVariant === 'warm_hoodie' ||
      topVariant === 'winter_knit' ||
      topVariant === 'guardian_jacket' ||
      topVariant === 'ao_dai_modern';

    const sleeveFillLeft =
      topVariant === 'guardian_jacket'
        ? topSecondary
        : topVariant === 'craft_apron'
          ? topSecondary
          : topPrimary;
    const sleeveFillRight = sleeveFillLeft;

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 480"
        className={className}
        role="img"
        aria-label="Nhân vật Chibi 2D Góc Thợ Avatar"
      >
        <defs>
          <clipPath id="gtqt-torso-clip">
            <path d="M138 250 C138 240, 152 234, 200 234 C248 234, 262 240, 262 250 L269 332 C269 341, 260 346, 200 346 C140 346, 131 341, 131 332 Z" />
          </clipPath>
          <clipPath id="gtqt-shorts-clip">
            <path d="M136 334 L264 334 L273 392 C273 398, 267 401, 260 401 L211 401 C206 401, 204 396, 200 383 C196 396, 194 401, 189 401 L140 401 C133 401, 127 398, 127 392 Z" />
          </clipPath>
        </defs>

        {/* =======================================================
            GROUND SHADOW (Tách hoàn toàn khỏi thân để thu nhỏ khi bay)
           ======================================================= */}
        {showGroundShadow && (
          <ellipse
            cx="200"
            cy="448"
            rx="78"
            ry="13"
            fill={isDarkBackdrop ? '#0B1630' : '#25292E'}
            opacity={disableAnimation ? 0.18 : 0.22}
            className={disableAnimation ? undefined : 'mascot-ground-shadow'}
          />
        )}

        {/* =======================================================
            OUTER FLOAT GROUP (Bay lơ lửng êm dịu 3.2s liên tục)
           ======================================================= */}
        <g className={disableAnimation ? undefined : 'mascot-float'}>
          {/* INNER POP GROUP (Nảy đàn hồi 320ms khi đổi đồ, không làm giật nhịp bay) */}
          <g
            key={disableAnimation ? 'static' : popKey}
            className={
              !disableAnimation && popKey > 0 ? 'mascot-pop' : undefined
            }
          >
            {/* ---------------------------------------------------
                LAYER 1: BACK ACCESSORY (Balo Hồi Sinh / Túi đồ nghề)
               --------------------------------------------------- */}
            <g data-layer="back_accessory">
              <HybridLayer item={backBagItem}>
                {hasAcc('acc_revive_backpack') && (
                  <g>
                    {/* Balo xanh lá bo tròn nhô sau lưng kèm miếng vá vàng năng lượng (cảm hứng ảnh mẫu) */}
                    <path
                      d="M238 228 C288 228, 316 270, 312 325 C308 366, 282 390, 244 388 L232 346 Z"
                      fill="#5CA45D"
                    />
                    <path
                      d="M242 238 C274 242, 294 274, 292 324 C290 356, 272 376, 246 378 Z"
                      fill="#4B8E4D"
                      opacity="0.45"
                    />
                    {/* Các miếng vá vải vàng ấm */}
                    <ellipse
                      cx="286"
                      cy="264"
                      rx="14"
                      ry="18"
                      transform="rotate(-24 286 264)"
                      fill="#F1B945"
                    />
                    <ellipse
                      cx="299"
                      cy="306"
                      rx="10"
                      ry="14"
                      transform="rotate(-6 299 306)"
                      fill="#F1B945"
                    />
                    <ellipse
                      cx="289"
                      cy="348"
                      rx="15"
                      ry="12"
                      transform="rotate(24 289 348)"
                      fill="#F1B945"
                    />
                    {/* Viền chỉ khâu đỏ nhỏ trên balo */}
                    <path
                      d="M262 292 L276 292"
                      stroke="#F7F2E8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="4 4"
                    />
                    {/* Quai đeo nhẹ phía trái */}
                    <path
                      d="M140 246 C116 254, 108 290, 114 334 C122 332, 134 328, 142 324 Z"
                      fill="#4B8E4D"
                    />
                  </g>
                )}

                {hasAcc('acc_craft_toolpack') && (
                  <g>
                    {/* Cán búa gỗ & thước nhô sau vai */}
                    <rect
                      x="252"
                      y="206"
                      width="14"
                      height="52"
                      rx="6"
                      transform="rotate(22 259 232)"
                      fill="#D9A163"
                    />
                    <rect
                      x="255"
                      y="198"
                      width="34"
                      height="15"
                      rx="5"
                      transform="rotate(22 272 205)"
                      fill="#95A4B5"
                    />
                    <rect
                      x="128"
                      y="214"
                      width="14"
                      height="54"
                      rx="4"
                      transform="rotate(-18 135 241)"
                      fill="#F1C34E"
                    />
                    {/* Thân túi đồ nghề da nâu */}
                    <rect
                      x="124"
                      y="246"
                      width="162"
                      height="116"
                      rx="34"
                      fill="#6E503B"
                    />
                    <rect
                      x="256"
                      y="264"
                      width="32"
                      height="76"
                      rx="14"
                      fill="#856147"
                    />
                    <rect
                      x="262"
                      y="286"
                      width="20"
                      height="8"
                      rx="4"
                      fill="#D46534"
                    />
                  </g>
                )}
              </HybridLayer>
            </g>

            {/* ---------------------------------------------------
                LAYER 2: HAIR BACK (Tóc phía sau cổ / vai)
               --------------------------------------------------- */}
            <g data-layer="hair_back">
              <HybridLayer item={hairItem}>
                {config.hairId === 'long_flowing' && (
                  <g>
                    <path
                      d="M98 158 C92 225, 96 294, 118 320 C138 334, 262 334, 282 320 C304 294, 308 225, 302 158 Z"
                      fill={hairColor.shadowHex}
                    />
                    <path
                      d="M108 164 C104 222, 108 286, 128 310 C150 322, 250 322, 272 310 C292 286, 296 222, 292 164 Z"
                      fill={hairColor.hex}
                    />
                  </g>
                )}

                {config.hairId === 'soft_bob' && (
                  <path
                    d="M96 154 C90 210, 102 254, 134 260 L266 260 C298 254, 310 210, 304 154 Z"
                    fill={hairColor.shadowHex}
                  />
                )}

                {config.hairId === 'fluffy_curls' && (
                  <g fill={hairColor.shadowHex}>
                    <circle cx="116" cy="184" r="30" />
                    <circle cx="284" cy="184" r="30" />
                    <circle cx="128" cy="222" r="24" />
                    <circle cx="272" cy="222" r="24" />
                  </g>
                )}

                {config.hairId === 'twin_buns' && (
                  <g>
                    {/* Hai búi tròn phía trên hai bên kèm dây buộc đỏ chỉ */}
                    <circle cx="112" cy="96" r="30" fill={hairColor.shadowHex} />
                    <circle cx="114" cy="92" r="27" fill={hairColor.hex} />
                    <circle cx="288" cy="96" r="30" fill={hairColor.shadowHex} />
                    <circle cx="286" cy="92" r="27" fill={hairColor.hex} />
                    <rect
                      x="118"
                      y="104"
                      width="24"
                      height="9"
                      rx="4.5"
                      transform="rotate(-38 130 108)"
                      fill="#B93818"
                    />
                    <rect
                      x="258"
                      y="104"
                      width="24"
                      height="9"
                      rx="4.5"
                      transform="rotate(38 270 108)"
                      fill="#B93818"
                    />
                  </g>
                )}
              </HybridLayer>
            </g>

            {/* ---------------------------------------------------
                LAYER 3: BASE BODY (Chân, Tay, Cổ, Tai, Đầu Chibi)
               --------------------------------------------------- */}
            <g data-layer="base_body">
              {/* Hai chân bo tròn */}
              <rect
                x="150"
                y="370"
                width="34"
                height="48"
                rx="16"
                fill={skin.hex}
              />
              <rect
                x="216"
                y="370"
                width="34"
                height="48"
                rx="16"
                fill={skin.hex}
              />
              {/* Bóng mờ nhẹ dưới gấu quần */}
              <rect
                x="150"
                y="378"
                width="34"
                height="12"
                fill={skin.shadowHex}
                opacity="0.45"
              />
              <rect
                x="216"
                y="378"
                width="34"
                height="12"
                fill={skin.shadowHex}
                opacity="0.45"
              />

              {/* Tay trái & Tay phải mềm mại */}
              <g transform="rotate(14 134 264)">
                <rect
                  x="104"
                  y="258"
                  width="34"
                  height="88"
                  rx="17"
                  fill={isLongSleeve ? sleeveFillLeft : skin.hex}
                />
                {/* Bàn tay bo tròn */}
                <circle cx="121" cy="340" r="16" fill={skin.hex} />
              </g>
              <g transform="rotate(-14 266 264)">
                <rect
                  x="262"
                  y="258"
                  width="34"
                  height="88"
                  rx="17"
                  fill={isLongSleeve ? sleeveFillRight : skin.hex}
                />
                <circle cx="279" cy="340" r="16" fill={skin.hex} />
              </g>

              {/* Thân trụ mũm mĩm nền */}
              <path
                d="M142 252 C142 242, 156 236, 200 236 C244 236, 258 242, 258 252 L264 342 C264 352, 250 358, 200 358 C150 358, 136 352, 136 342 Z"
                fill={skin.hex}
              />

              {/* Cổ nhỏ gọn + bóng đổ cằm */}
              <rect
                x="182"
                y="222"
                width="36"
                height="26"
                rx="12"
                fill={skin.shadowHex}
              />

              {/* Hai tai tròn hai bên */}
              <circle cx="102" cy="176" r="22" fill={skin.hex} />
              <circle
                cx="105"
                cy="178"
                r="11"
                fill={skin.shadowHex}
                opacity="0.65"
              />
              <circle cx="298" cy="176" r="22" fill={skin.hex} />
              <circle
                cx="295"
                cy="178"
                r="11"
                fill={skin.shadowHex}
                opacity="0.65"
              />

              {/* Đầu tròn bầu lớn (~45% chiều cao nhân vật) */}
              <rect
                x="104"
                y="84"
                width="192"
                height="164"
                rx="82"
                fill={skin.hex}
              />
              {/* Mảng bóng mịn phần cằm dưới tạo chiều sâu Lineless */}
              <path
                d="M126 218 C146 244, 254 244, 274 218 C256 236, 144 236, 126 218 Z"
                fill={skin.shadowHex}
                opacity="0.55"
              />
            </g>

            {/* ---------------------------------------------------
                LAYER 4: SHOES (Giày Sneaker đen dây trắng / Vải / Dép / Bốt)
               --------------------------------------------------- */}
            <g data-layer="shoes">
              <HybridLayer item={shoesItem}>
                {shoesVariant === 'black_canvas_sneakers' && (
                  <g>
                    {/* Chiếc trái */}
                    <g>
                      <path
                        d="M148 398 L185 398 L185 426 L133 426 C133 414, 140 407, 148 405 Z"
                        fill="#22262C"
                      />
                      {/* Mũi giày cao su trắng */}
                      <path
                        d="M133 426 C133 417, 141 413, 152 414 L152 426 Z"
                        fill="#FFFFFF"
                      />
                      {/* Đế giày trắng sắc nét */}
                      <rect
                        x="131"
                        y="426"
                        width="56"
                        height="11"
                        rx="5"
                        fill="#FFFFFF"
                      />
                      <rect
                        x="133"
                        y="431"
                        width="52"
                        height="2.2"
                        rx="1"
                        fill="#25292E"
                        opacity="0.7"
                      />
                      {/* Dây buộc trắng & khoen kim loại */}
                      <rect x="145" y="401" width="16" height="3.2" rx="1.6" fill="#FFFFFF" />
                      <rect x="143" y="407" width="16" height="3.2" rx="1.6" fill="#FFFFFF" />
                      <rect x="141" y="413" width="14" height="3.2" rx="1.6" fill="#FFFFFF" />
                      <circle cx="167" cy="420" r="2.4" fill="none" stroke="#DCE2EA" strokeWidth="1.5" />
                      <circle cx="176" cy="420" r="2.4" fill="none" stroke="#DCE2EA" strokeWidth="1.5" />
                      <path
                        d="M161 404 L158 424"
                        stroke="#FFFFFF"
                        strokeWidth="1.3"
                        strokeDasharray="2.5 2.5"
                        opacity="0.8"
                      />
                    </g>
                    {/* Chiếc phải */}
                    <g>
                      <path
                        d="M215 398 L252 398 L252 405 C260 407, 267 414, 267 426 L215 426 Z"
                        fill="#22262C"
                      />
                      <path
                        d="M267 426 C267 417, 259 413, 248 414 L248 426 Z"
                        fill="#FFFFFF"
                      />
                      <rect
                        x="213"
                        y="426"
                        width="56"
                        height="11"
                        rx="5"
                        fill="#FFFFFF"
                      />
                      <rect
                        x="215"
                        y="431"
                        width="52"
                        height="2.2"
                        rx="1"
                        fill="#25292E"
                        opacity="0.7"
                      />
                      <rect x="239" y="401" width="16" height="3.2" rx="1.6" fill="#FFFFFF" />
                      <rect x="241" y="407" width="16" height="3.2" rx="1.6" fill="#FFFFFF" />
                      <rect x="245" y="413" width="14" height="3.2" rx="1.6" fill="#FFFFFF" />
                      <circle cx="224" cy="420" r="2.4" fill="none" stroke="#DCE2EA" strokeWidth="1.5" />
                      <circle cx="233" cy="420" r="2.4" fill="none" stroke="#DCE2EA" strokeWidth="1.5" />
                      <path
                        d="M239 404 L242 424"
                        stroke="#FFFFFF"
                        strokeWidth="1.3"
                        strokeDasharray="2.5 2.5"
                        opacity="0.8"
                      />
                    </g>
                  </g>
                )}

                {shoesVariant === 'cream_canvas_shoes' && (
                  <g>
                    {/* Trái */}
                    <path d="M148 404 L185 404 L185 426 L133 426 C133 414, 140 408, 148 404 Z" fill="#EFE6D5" />
                    <rect x="131" y="425" width="56" height="12" rx="5.5" fill="#FFFFFF" />
                    <rect x="134" y="430" width="50" height="2.4" rx="1" fill="#B93818" />
                    <rect x="145" y="409" width="14" height="3" rx="1.5" fill="#FFFFFF" />
                    <rect x="142" y="415" width="14" height="3" rx="1.5" fill="#FFFFFF" />
                    {/* Phải */}
                    <path d="M215 404 L252 404 C260 408, 267 414, 267 426 L215 426 Z" fill="#EFE6D5" />
                    <rect x="213" y="425" width="56" height="12" rx="5.5" fill="#FFFFFF" />
                    <rect x="216" y="430" width="50" height="2.4" rx="1" fill="#B93818" />
                    <rect x="241" y="409" width="14" height="3" rx="1.5" fill="#FFFFFF" />
                    <rect x="244" y="415" width="14" height="3" rx="1.5" fill="#FFFFFF" />
                  </g>
                )}

                {shoesVariant === 'pastel_slides' && (
                  <g>
                    {/* Bàn chân trần bo tròn + dép quai ngang pastel */}
                    <path d="M137 424 C137 414, 148 410, 184 410 L184 426 L137 426 Z" fill={skin.hex} />
                    <rect x="132" y="426" width="55" height="10" rx="5" fill="#F7F2E8" />
                    <path d="M148 411 C156 406, 170 406, 178 411 L176 426 L146 426 Z" fill="#77B8AD" />

                    <path d="M216 410 C252 410, 263 414, 263 424 L263 426 L216 426 Z" fill={skin.hex} />
                    <rect x="213" y="426" width="55" height="10" rx="5" fill="#F7F2E8" />
                    <path d="M222 411 C230 406, 244 406, 252 411 L254 426 L224 426 Z" fill="#77B8AD" />
                  </g>
                )}

                {shoesVariant === 'craft_boots' && (
                  <g>
                    {/* Bốt da nâu khâu đế */}
                    <path d="M147 390 L186 390 L186 425 L132 425 C132 413, 139 406, 147 404 Z" fill="#7A472B" />
                    <rect x="130" y="425" width="58" height="12" rx="5" fill="#3A261C" />
                    <rect x="133" y="425" width="52" height="2.4" fill="#D9A54C" />
                    <circle cx="151" cy="399" r="2.2" fill="#D9A54C" />
                    <circle cx="151" cy="407" r="2.2" fill="#D9A54C" />

                    <path d="M214 390 L253 390 L253 404 C261 406, 268 413, 268 425 L214 425 Z" fill="#7A472B" />
                    <rect x="212" y="425" width="58" height="12" rx="5" fill="#3A261C" />
                    <rect x="215" y="425" width="52" height="2.4" fill="#D9A54C" />
                    <circle cx="249" cy="399" r="2.2" fill="#D9A54C" />
                    <circle cx="249" cy="407" r="2.2" fill="#D9A54C" />
                  </g>
                )}
              </HybridLayer>
            </g>

            {/* ---------------------------------------------------
                LAYER 5: BOTTOM (Quần short hoa nắng / Jeans / Jogger / Váy / Bà Ba)
               --------------------------------------------------- */}
            <g data-layer="bottom">
              <HybridLayer item={bottomItem}>
                {bottomVariant === 'floral_indigo_shorts' && (
                  <g>
                    <g clipPath="url(#gtqt-shorts-clip)">
                      <rect x="122" y="330" width="156" height="76" fill="#27466E" />
                      {/* Mảng bóng ống quần phải tạo độ nổi nhẹ */}
                      <rect x="200" y="330" width="80" height="76" fill="#1F395C" opacity="0.45" />
                      {/* Họa tiết lá xanh dịu */}
                      <ellipse cx="144" cy="356" rx="16" ry="8" transform="rotate(-24 144 356)" fill="#5DA3A1" />
                      <ellipse cx="256" cy="358" rx="16" ry="8" transform="rotate(26 256 358)" fill="#5DA3A1" />
                      <ellipse cx="182" cy="388" rx="14" ry="7" transform="rotate(-16 182 388)" fill="#5DA3A1" />
                      <ellipse cx="222" cy="368" rx="12" ry="6" transform="rotate(42 222 368)" fill="#4D8B8E" />
                      {/* Hoa vàng nắng Sài Gòn */}
                      {[
                        [200, 355],
                        [146, 392],
                        [248, 392],
                      ].map(([fx, fy], idx) => (
                        <g key={idx} transform={`translate(${fx}, ${fy})`}>
                          <ellipse cx="0" cy="-9" rx="5" ry="9" fill="#E8A534" />
                          <ellipse cx="9" cy="-2" rx="5" ry="9" transform="rotate(72)" fill="#E8A534" />
                          <ellipse cx="6" cy="8" rx="5" ry="9" transform="rotate(144)" fill="#E8A534" />
                          <ellipse cx="-6" cy="8" rx="5" ry="9" transform="rotate(216)" fill="#E8A534" />
                          <ellipse cx="-9" cy="-2" rx="5" ry="9" transform="rotate(288)" fill="#E8A534" />
                          <circle cx="0" cy="0" r="4" fill="#F8E2A1" />
                        </g>
                      ))}
                    </g>
                    {/* Dây rút quần kem nhỏ */}
                    <path d="M196 336 L194 352" stroke="#F7F2E8" strokeWidth="3.2" strokeLinecap="round" />
                    <path d="M204 336 L207 351" stroke="#F7F2E8" strokeWidth="3.2" strokeLinecap="round" />
                  </g>
                )}

                {bottomVariant === 'cuffed_jeans' && (
                  <g>
                    <path
                      d="M138 334 L262 334 L266 406 L212 406 L200 374 L188 406 L134 406 Z"
                      fill="#416391"
                    />
                    <path d="M200 334 L200 374" stroke="#2D4A73" strokeWidth="2.5" />
                    {/* Xắn gấu màu denim sáng */}
                    <rect x="133" y="396" width="56" height="13" rx="5" fill="#7C9CC4" />
                    <rect x="211" y="396" width="56" height="13" rx="5" fill="#7C9CC4" />
                    <circle cx="200" cy="343" r="3.5" fill="#D9A54C" />
                  </g>
                )}

                {bottomVariant === 'jogger_cuff' && (
                  <g>
                    <path
                      d="M138 334 L262 334 L260 404 L214 404 L200 372 L186 404 L140 404 Z"
                      fill="#D8CCBA"
                    />
                    <rect x="142" y="396" width="44" height="11" rx="5" fill="#B8A890" />
                    <rect x="214" y="396" width="44" height="11" rx="5" fill="#B8A890" />
                  </g>
                )}

                {bottomVariant === 'pleated_skirt' && (
                  <g>
                    <path
                      d="M138 334 L262 334 L278 394 C278 398, 272 400, 266 400 L134 400 C128 400, 122 398, 122 394 Z"
                      fill="#264275"
                    />
                    {/* Các đường ly váy phẳng dịu */}
                    <path d="M164 336 L154 399" stroke="#1B315B" strokeWidth="3" />
                    <path d="M188 336 L184 399" stroke="#1B315B" strokeWidth="3" />
                    <path d="M212 336 L216 399" stroke="#1B315B" strokeWidth="3" />
                    <path d="M236 336 L246 399" stroke="#1B315B" strokeWidth="3" />
                    {/* Đường viền gấu kem */}
                    <path
                      d="M126 388 L274 388"
                      stroke="#F7F2E8"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {bottomVariant === 'wide_traditional' && (
                  <g>
                    <path
                      d="M136 334 L264 334 L274 414 L208 414 L200 378 L192 414 L126 414 Z"
                      fill="#F3EBDC"
                    />
                    <path d="M160 342 L154 412" stroke="#DCD0BC" strokeWidth="3" strokeLinecap="round" />
                    <path d="M240 342 L246 412" stroke="#DCD0BC" strokeWidth="3" strokeLinecap="round" />
                  </g>
                )}
              </HybridLayer>
            </g>

            {/* ---------------------------------------------------
                LAYER 6: TOP (Áo thun sọc đỏ / Hoodie / Bà Ba / Áo Dài / Tạp dề / Khoác)
               --------------------------------------------------- */}
            <g data-layer="top">
              <HybridLayer item={topItem}>
                {/* Tay áo ngắn (với các áo không dài tay) */}
                {!isLongSleeve && (
                  <g>
                    <path
                      d="M144 246 L104 288 C102 291, 105 296, 110 298 L136 306 L154 274 Z"
                      fill={sleeveFillLeft}
                    />
                    <path
                      d="M256 246 L296 288 C298 291, 295 296, 290 298 L264 306 L246 274 Z"
                      fill={sleeveFillRight}
                    />
                  </g>
                )}

                {/* Thân áo chính */}
                {topVariant === 'striped_red_tee' && (
                  <g clipPath="url(#gtqt-torso-clip)">
                    <rect x="128" y="232" width="144" height="118" fill="#F6E8D3" />
                    <rect x="132" y="232" width="24" height="118" fill="#C84B45" />
                    <rect x="184" y="232" width="32" height="118" fill="#C84B45" />
                    <rect x="244" y="232" width="28" height="118" fill="#C84B45" />
                    {/* Cổ áo viền đỏ mềm */}
                    <path
                      d="M174 236 C182 252, 218 252, 226 236"
                      fill="none"
                      stroke="#A93631"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {topVariant === 'basic_tee' && (
                  <g clipPath="url(#gtqt-torso-clip)">
                    <rect x="128" y="232" width="144" height="118" fill="#F5DF7D" />
                    <path
                      d="M174 236 C182 254, 218 254, 226 236"
                      fill="none"
                      stroke="#1B3B82"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    {/* Huy hiệu mini góc ngực */}
                    <circle cx="228" cy="276" r="8" fill="#D46534" />
                    <circle cx="228" cy="276" r="3" fill="#F7F2E8" />
                  </g>
                )}

                {topVariant === 'warm_hoodie' && (
                  <g>
                    <g clipPath="url(#gtqt-torso-clip)">
                      <rect x="128" y="232" width="144" height="118" fill="#2E4C8C" />
                      {/* Túi kangaroo */}
                      <path
                        d="M162 298 L238 298 L244 334 C244 338, 240 341, 234 341 L166 341 C160 341, 156 338, 156 334 Z"
                        fill="#233C73"
                      />
                    </g>
                    {/* Viền nón trùm cổ */}
                    <path
                      d="M158 242 C172 260, 228 260, 242 242 C232 234, 168 234, 158 242 Z"
                      fill="#233C73"
                    />
                    {/* Dây rút kem + đầu cam */}
                    <line x1="186" y1="252" x2="184" y2="286" stroke="#F7F2E8" strokeWidth="4" strokeLinecap="round" />
                    <line x1="214" y1="252" x2="216" y2="286" stroke="#F7F2E8" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="184" cy="288" r="3.5" fill="#D46534" />
                    <circle cx="216" cy="288" r="3.5" fill="#D46534" />
                  </g>
                )}

                {topVariant === 'ba_ba_modern' && (
                  <g>
                    <path
                      d="M138 250 C138 240, 152 234, 200 234 C248 234, 262 240, 262 250 L272 350 C272 358, 256 364, 200 364 C144 364, 128 358, 128 350 Z"
                      fill="#678A6E"
                    />
                    <line x1="200" y1="244" x2="200" y2="362" stroke="#4E6E54" strokeWidth="3" />
                    {[264, 284, 304, 324].map((cy) => (
                      <circle key={cy} cx="200" cy={cy} r="3.8" fill="#F7F2E8" />
                    ))}
                    <rect x="148" y="318" width="32" height="26" rx="7" fill="#56765C" />
                    <rect x="220" y="318" width="32" height="26" rx="7" fill="#56765C" />
                  </g>
                )}

                {topVariant === 'ao_dai_modern' && (
                  <g>
                    {/* Cổ trụ thanh thoát */}
                    <rect x="176" y="228" width="48" height="18" rx="7" fill="#DE6E4B" />
                    {/* Thân & tà áo dài duyên dáng */}
                    <path
                      d="M140 250 C140 240, 154 236, 200 236 C246 236, 260 240, 260 250 L272 384 C272 392, 244 398, 200 398 C156 398, 128 392, 128 384 Z"
                      fill="#DE6E4B"
                    />
                    <path
                      d="M200 244 C224 252, 238 266, 246 290"
                      fill="none"
                      stroke="#C25636"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Hàng nút thắt vàng */}
                    <circle cx="212" cy="252" r="3.6" fill="#E5B245" />
                    <circle cx="224" cy="264" r="3.6" fill="#E5B245" />
                    <circle cx="234" cy="278" r="3.6" fill="#E5B245" />
                    {/* Đường viền họa tiết gấu tà */}
                    <path d="M138 380 L262 380" stroke="#F8E7CE" strokeWidth="4" strokeDasharray="8 6" />
                  </g>
                )}

                {topVariant === 'craft_apron' && (
                  <g>
                    {/* Áo sơ mi vải kem bên trong */}
                    <g clipPath="url(#gtqt-torso-clip)">
                      <rect x="128" y="232" width="144" height="118" fill="#F7F0E3" />
                      {/* Tạp dề thợ thủ công màu nâu da/vải bố */}
                      <path
                        d="M158 258 L242 258 L254 348 L146 348 Z"
                        fill="#8B5A3C"
                      />
                    </g>
                    {/* Dây đeo vai tạp dề + đinh tán đồng */}
                    <rect x="160" y="236" width="12" height="28" rx="5" fill="#70452C" />
                    <rect x="228" y="236" width="12" height="28" rx="5" fill="#70452C" />
                    <circle cx="166" cy="262" r="3.2" fill="#E6B34B" />
                    <circle cx="234" cy="262" r="3.2" fill="#E6B34B" />
                    {/* Túi trước đựng kéo + thước + cuộn chỉ đỏ */}
                    <rect x="172" y="282" width="11" height="28" rx="3" fill="#F1C34E" />
                    <rect x="188" y="284" width="14" height="22" rx="4" fill="#B93818" />
                    {/* Tay cầm kéo bạc */}
                    <circle cx="214" cy="285" r="6" fill="none" stroke="#DCE2EA" strokeWidth="3" />
                    <circle cx="225" cy="287" r="6" fill="none" stroke="#DCE2EA" strokeWidth="3" />
                    {/* Mặt túi tạp dề */}
                    <rect x="164" y="298" width="72" height="36" rx="10" fill="#70452C" />
                    <path
                      d="M170 304 L230 304"
                      stroke="#E6C7A3"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  </g>
                )}

                {topVariant === 'winter_knit' && (
                  <g clipPath="url(#gtqt-torso-clip)">
                    <rect x="128" y="232" width="144" height="118" fill="#C44530" />
                    <rect x="128" y="264" width="144" height="16" fill="#F7F2E8" />
                    <rect x="128" y="284" width="144" height="9" fill="#4F6B54" />
                    <path
                      d="M138 272 L262 272"
                      stroke="#C44530"
                      strokeWidth="4"
                      strokeDasharray="6 8"
                    />
                  </g>
                )}

                {topVariant === 'guardian_jacket' && (
                  <g>
                    <g clipPath="url(#gtqt-torso-clip)">
                      {/* Thân xanh chàm di sản */}
                      <rect x="128" y="232" width="144" height="118" fill="#1B3B82" />
                      {/* Nẹp cúc giữa kem + hàng nút vàng */}
                      <rect x="194" y="236" width="12" height="114" fill="#142C63" />
                      {[258, 280, 302, 324].map((cy) => (
                        <circle key={cy} cx="200" cy={cy} r="3.4" fill="#F5C451" />
                      ))}
                      {/* Bo gấu sọc cam–kem */}
                      <rect x="128" y="334" width="144" height="14" fill="#D46534" />
                      <rect x="128" y="338" width="144" height="4" fill="#F7F2E8" />
                    </g>
                    {/* Huy hiệu tròn Góc Nghề thêu trên ngực phải */}
                    <circle cx="230" cy="274" r="13" fill="#F7F2E8" />
                    <circle cx="230" cy="274" r="9.5" fill="#D46534" />
                    <path
                      d="M225 278 L235 270"
                      stroke="#F7F2E8"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </HybridLayer>
            </g>

            {/* ---------------------------------------------------
                LAYER 7: FACE (Mắt long lanh + Chớp mắt + Má hồng + 5 biểu cảm)
               --------------------------------------------------- */}
            <g data-layer="face">
              {/* Má hồng pastel mềm */}
              <ellipse
                cx="144"
                cy="192"
                rx="16"
                ry="9.5"
                fill={skin.blushHex}
                opacity="0.45"
              />
              <ellipse
                cx="256"
                cy="192"
                rx="16"
                ry="9.5"
                fill={skin.blushHex}
                opacity="0.45"
              />

              {/* Mũi tròn nhỏ xinh */}
              <ellipse
                cx="200"
                cy="183"
                rx="6.5"
                ry="4.8"
                fill={skin.shadowHex}
              />

              {/* Mắt (có chớp mắt tự nhiên) */}
              <g className={disableAnimation ? undefined : 'mascot-blink'}>
                {config.faceId === 'sparkle_round' && (
                  <g>
                    {/* Mắt trái */}
                    <circle cx="164" cy="170" r="13.5" fill="#162442" />
                    <circle cx="159" cy="165" r="4.3" fill="#FFFFFF" />
                    <circle cx="169" cy="175" r="2.1" fill="#FFFFFF" />
                    {/* Mắt phải */}
                    <circle cx="236" cy="170" r="13.5" fill="#162442" />
                    <circle cx="231" cy="165" r="4.3" fill="#FFFFFF" />
                    <circle cx="241" cy="175" r="2.1" fill="#FFFFFF" />
                  </g>
                )}

                {config.faceId === 'happy_squint' && (
                  <g
                    fill="none"
                    stroke="#162442"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                  >
                    <path d="M150 174 C156 160, 172 160, 178 174" />
                    <path d="M222 174 C228 160, 244 160, 250 174" />
                  </g>
                )}

                {config.faceId === 'playful_wink' && (
                  <g>
                    <circle cx="164" cy="170" r="13.5" fill="#162442" />
                    <circle cx="159" cy="165" r="4.3" fill="#FFFFFF" />
                    <circle cx="169" cy="175" r="2.1" fill="#FFFFFF" />
                    <path
                      d="M222 172 C228 160, 244 160, 250 172"
                      fill="none"
                      stroke="#162442"
                      strokeWidth="6.2"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {config.faceId === 'cool_confident' && (
                  <g>
                    <ellipse cx="164" cy="171" rx="12" ry="9.5" fill="#162442" />
                    <circle cx="160" cy="168" r="3.4" fill="#FFFFFF" />
                    <ellipse cx="236" cy="171" rx="12" ry="9.5" fill="#162442" />
                    <circle cx="232" cy="168" r="3.4" fill="#FFFFFF" />
                    {/* Hàng lông mày điềm tĩnh */}
                    <path d="M148 153 L178 155" stroke="#593624" strokeWidth="4.8" strokeLinecap="round" />
                    <path d="M222 155 L252 153" stroke="#593624" strokeWidth="4.8" strokeLinecap="round" />
                  </g>
                )}

                {config.faceId === 'cute_surprised' && (
                  <g>
                    <circle cx="164" cy="168" r="14.5" fill="#162442" />
                    <circle cx="159" cy="162" r="4.8" fill="#FFFFFF" />
                    <circle cx="170" cy="173" r="2.2" fill="#FFFFFF" />
                    <circle cx="236" cy="168" r="14.5" fill="#162442" />
                    <circle cx="231" cy="162" r="4.8" fill="#FFFFFF" />
                    <circle cx="242" cy="173" r="2.2" fill="#FFFFFF" />
                  </g>
                )}
              </g>

              {/* Miệng theo từng biểu cảm */}
              {config.faceId === 'cute_surprised' ? (
                <ellipse cx="200" cy="204" rx="9" ry="11" fill="#A6433E" />
              ) : config.faceId === 'cool_confident' ? (
                <path
                  d="M188 202 C198 207, 209 205, 215 198"
                  fill="none"
                  stroke="#162442"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              ) : (
                <g>
                  <path
                    d="M182 197 C188 214, 212 214, 218 197 Z"
                    fill="#A6433E"
                  />
                  <ellipse cx="200" cy="208" rx="9" ry="4.5" fill="#EB8580" />
                  <path
                    d="M181 197 C190 201, 210 201, 219 197"
                    fill="none"
                    stroke="#162442"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </g>
              )}
            </g>

            {/* ---------------------------------------------------
                LAYER 8: HAIR FRONT + HEADWEAR + EYEWEAR
               --------------------------------------------------- */}
            <g data-layer="hair_front">
              <HybridLayer item={hairItem}>
                {config.hairId === 'fluffy_curls' && (
                  <g>
                    {/* Lớp tóc nền đậm phía dưới tạo khối đám mây chuẩn ảnh mẫu */}
                    <path
                      d="M98 158 C88 128, 108 86, 152 78 C172 60, 224 58, 250 78 C292 84, 312 126, 302 158 C286 144, 266 138, 248 148 C230 132, 204 128, 184 142 C164 128, 134 132, 118 148 C110 144, 102 150, 98 158 Z"
                      fill={hairColor.shadowHex}
                    />
                    {/* Đám mây xoăn phồng lớp trên */}
                    <circle cx="132" cy="112" r="34" fill={hairColor.hex} />
                    <circle cx="176" cy="92" r="42" fill={hairColor.hex} />
                    <circle cx="228" cy="94" r="40" fill={hairColor.hex} />
                    <circle cx="270" cy="114" r="32" fill={hairColor.hex} />
                    <circle cx="162" cy="120" r="24" fill={hairColor.hex} />
                    <circle cx="212" cy="120" r="25" fill={hairColor.hex} />
                    <circle cx="250" cy="126" r="21" fill={hairColor.hex} />
                    {/* Chỏm tóc tinh nghịch đỉnh đầu */}
                    <path
                      d="M196 58 C206 42, 222 50, 214 68 Z"
                      fill={hairColor.hex}
                    />
                    {/* Mảng sáng mềm lineless */}
                    <ellipse
                      cx="166"
                      cy="80"
                      rx="20"
                      ry="10"
                      transform="rotate(-18 166 80)"
                      fill={hairColor.highlightHex}
                      opacity="0.72"
                    />
                    <ellipse
                      cx="236"
                      cy="84"
                      rx="16"
                      ry="8"
                      transform="rotate(14 236 84)"
                      fill={hairColor.highlightHex}
                      opacity="0.65"
                    />
                  </g>
                )}

                {config.hairId === 'neat_bangs' && (
                  <g>
                    <path
                      d="M98 154 C98 88, 142 62, 200 62 C258 62, 302 88, 302 154 L288 154 C284 134, 272 132, 268 132 L132 132 C128 132, 116 134, 112 154 Z"
                      fill={hairColor.hex}
                    />
                    {/* Nếp cắt mái ngang gọn */}
                    <path d="M162 110 L162 132" stroke={hairColor.shadowHex} strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M236 112 L236 132" stroke={hairColor.shadowHex} strokeWidth="3.5" strokeLinecap="round" />
                    <ellipse cx="168" cy="84" rx="22" ry="7" fill={hairColor.highlightHex} opacity="0.5" />
                  </g>
                )}

                {config.hairId === 'soft_bob' && (
                  <g>
                    <path
                      d="M96 176 C94 94, 138 62, 200 62 C262 62, 306 94, 304 176 C304 206, 294 226, 282 232 C284 188, 280 146, 266 128 C236 138, 164 138, 134 128 C120 146, 116 188, 118 232 C106 226, 96 206, 96 176 Z"
                      fill={hairColor.hex}
                    />
                    <ellipse cx="164" cy="86" rx="24" ry="8" transform="rotate(-10 164 86)" fill={hairColor.highlightHex} opacity="0.5" />
                  </g>
                )}

                {config.hairId === 'twin_buns' && (
                  <g>
                    <path
                      d="M100 156 C100 92, 144 66, 200 66 C256 66, 300 92, 300 156 L284 152 C276 130, 246 120, 200 124 C154 120, 124 130, 116 152 Z"
                      fill={hairColor.hex}
                    />
                    <path d="M200 72 L200 124" stroke={hairColor.shadowHex} strokeWidth="3" strokeLinecap="round" />
                    <ellipse cx="166" cy="88" rx="18" ry="7" fill={hairColor.highlightHex} opacity="0.48" />
                  </g>
                )}

                {config.hairId === 'fresh_undercut' && (
                  <g>
                    <path
                      d="M104 144 C104 92, 144 64, 200 62 C256 60, 296 86, 296 144 L282 140 C272 118, 240 110, 200 112 C160 110, 128 118, 118 140 Z"
                      fill={hairColor.shadowHex}
                    />
                    {/* Mái đánh bồng năng động */}
                    <path
                      d="M118 118 C126 68, 178 48, 236 60 C272 68, 286 92, 282 118 C252 104, 178 102, 118 118 Z"
                      fill={hairColor.hex}
                    />
                    <ellipse cx="186" cy="74" rx="26" ry="8" transform="rotate(-8 186 74)" fill={hairColor.highlightHex} opacity="0.55" />
                  </g>
                )}

                {config.hairId === 'long_flowing' && (
                  <g>
                    <path
                      d="M98 164 C98 92, 142 62, 200 62 C258 62, 302 92, 302 164 L286 164 C282 132, 250 118, 200 124 C150 118, 118 132, 114 164 Z"
                      fill={hairColor.hex}
                    />
                    <path d="M200 68 L200 124" stroke={hairColor.shadowHex} strokeWidth="3" strokeLinecap="round" />
                    <ellipse cx="168" cy="84" rx="22" ry="7" fill={hairColor.highlightHex} opacity="0.5" />
                  </g>
                )}
              </HybridLayer>
            </g>

            {/* EYEWEAR (Kính tròn thợ đồng hồ) */}
            <g data-layer="eyewear">
              <HybridLayer item={eyewearItem}>
                {hasAcc('eye_round_glasses') && (
                  <g>
                    <circle
                      cx="164"
                      cy="170"
                      r="25"
                      fill="#E2F2FB"
                      fillOpacity="0.28"
                      stroke="#C58F32"
                      strokeWidth="4.5"
                    />
                    <circle
                      cx="236"
                      cy="170"
                      r="25"
                      fill="#E2F2FB"
                      fillOpacity="0.28"
                      stroke="#C58F32"
                      strokeWidth="4.5"
                    />
                    <path
                      d="M189 170 C194 165, 206 165, 211 170"
                      fill="none"
                      stroke="#C58F32"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                    <line x1="112" y1="168" x2="139" y2="170" stroke="#C58F32" strokeWidth="4" strokeLinecap="round" />
                    <line x1="261" y1="170" x2="288" y2="168" stroke="#C58F32" strokeWidth="4" strokeLinecap="round" />
                    {/* Đốm phản chiếu nhẹ trên tròng kính */}
                    <path d="M150 156 L158 164" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
                    <path d="M222 156 L230 164" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
                  </g>
                )}
              </HybridLayer>
            </g>

            {/* HEADWEAR (Mũ mái hiên sọc cam-chàm / Beanie / Nón lá mini) */}
            <g data-layer="headwear">
              <HybridLayer item={headwearItem}>
                {hasAcc('head_awning_cap') && (
                  <g>
                    {/* Mũ lưỡi trai lấy cảm hứng mái hiên tiệm sửa xe sọc cam – xanh chàm */}
                    <path
                      d="M114 106 C116 58, 152 44, 200 44 C248 44, 284 58, 286 106 Z"
                      fill="#1B3B82"
                    />
                    {/* Các sọc cam mái hiên */}
                    <path d="M142 106 C144 68, 158 50, 174 46 L178 106 Z" fill="#D46534" />
                    <path d="M222 106 L226 46 C242 50, 256 68, 258 106 Z" fill="#D46534" />
                    {/* Nút đỉnh mũ kem */}
                    <circle cx="200" cy="44" r="7" fill="#F7F2E8" />
                    {/* Lưỡi trai cong về phía trước */}
                    <path
                      d="M110 104 C156 90, 256 90, 314 108 C306 122, 246 120, 114 114 Z"
                      fill="#142C63"
                    />
                    <path
                      d="M126 108 C184 99, 256 100, 304 110"
                      fill="none"
                      stroke="#D46534"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {hasAcc('head_beanie') && (
                  <g>
                    <circle cx="200" cy="40" r="14" fill="#F7F2E8" />
                    <path
                      d="M116 108 C118 56, 154 44, 200 44 C246 44, 282 56, 284 108 Z"
                      fill="#D46534"
                    />
                    <rect
                      x="110"
                      y="94"
                      width="180"
                      height="24"
                      rx="12"
                      fill="#B54E22"
                    />
                    {[138, 168, 200, 232, 262].map((lx) => (
                      <line
                        key={lx}
                        x1={lx}
                        y1="98"
                        x2={lx}
                        y2="114"
                        stroke="#963D17"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    ))}
                  </g>
                )}

                {hasAcc('head_non_la') && (
                  <g>
                    {/* Quai lụa đỏ sợi chỉ vắt dưới cằm */}
                    <path
                      d="M124 128 C126 248, 274 248, 276 128"
                      fill="none"
                      stroke="#B93818"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                    />
                    {/* Hình chóp nón lá thanh thoát */}
                    <path
                      d="M200 32 L322 126 C268 136, 132 136, 78 126 Z"
                      fill="#ECD8A9"
                    />
                    {/* Mảng bóng nhẹ bên phải chóp nón */}
                    <path
                      d="M200 32 L322 126 C284 132, 238 134, 200 134 Z"
                      fill="#DFC68E"
                      opacity="0.55"
                    />
                    {/* Các vòng nan tre đồng tâm */}
                    <path d="M114 102 C164 110, 236 110, 286 102" fill="none" stroke="#C5A668" strokeWidth="3" />
                    <path d="M148 76 C178 82, 222 82, 252 76" fill="none" stroke="#C5A668" strokeWidth="3" />
                    <path d="M84 124 C144 134, 256 134, 316 124" fill="none" stroke="#C5A668" strokeWidth="4" strokeLinecap="round" />
                  </g>
                )}
              </HybridLayer>
            </g>

            {/* ---------------------------------------------------
                LAYER 9: FRONT ACCESSORY (Máy ảnh phim, Thước dây, Khăn chỉ đỏ, Túi chéo, Cà phê, Charm)
               --------------------------------------------------- */}
            <g data-layer="front_accessory">
              {/* Khăn choàng sợi chỉ đỏ */}
              {hasAcc('acc_red_scarf') && (
                <g>
                  <rect x="148" y="232" width="104" height="28" rx="14" fill="#B93818" />
                  <rect x="218" y="246" width="26" height="58" rx="10" fill="#B93818" />
                  <rect x="218" y="286" width="26" height="7" fill="#F7F2E8" />
                  <path d="M164 246 L234 246" stroke="#962B10" strokeWidth="3" strokeDasharray="6 6" />
                </g>
              )}

              {/* Thước dây may vá quàng cổ */}
              {hasAcc('acc_tape_measure') && (
                <g>
                  <path
                    d="M174 236 C164 252, 162 284, 166 322"
                    fill="none"
                    stroke="#F3C74D"
                    strokeWidth="15"
                    strokeLinecap="round"
                  />
                  <path
                    d="M226 236 C236 252, 238 284, 234 326"
                    fill="none"
                    stroke="#F3C74D"
                    strokeWidth="15"
                    strokeLinecap="round"
                  />
                  <path
                    d="M174 236 C188 244, 212 244, 226 236"
                    fill="none"
                    stroke="#E5B238"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {[264, 276, 288, 300, 312].map((ty) => (
                    <g key={ty}>
                      <line x1="160" y1={ty} x2="167" y2={ty} stroke="#25292E" strokeWidth="2.2" />
                      <line x1="233" y1={ty} x2="240" y2={ty} stroke="#25292E" strokeWidth="2.2" />
                    </g>
                  ))}
                  <rect x="158.5" y="318" width="15" height="6" rx="2" fill="#B93818" />
                  <rect x="226.5" y="322" width="15" height="6" rx="2" fill="#B93818" />
                </g>
              )}

              {/* Túi đeo chéo vải mộc */}
              {hasAcc('acc_crossbody_mini') && (
                <g>
                  <line
                    x1="154"
                    y1="242"
                    x2="254"
                    y2="328"
                    stroke="#1B3B82"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <rect x="234" y="316" width="44" height="46" rx="12" fill="#EBDCC6" />
                  <path d="M234 328 L278 328 L278 338 C278 342, 274 344, 268 344 L244 344 C238 344, 234 342, 234 338 Z" fill="#1B3B82" />
                  <circle cx="256" cy="336" r="4" fill="#B93818" />
                </g>
              )}

              {/* Máy ảnh phim cổ điển đeo dây chéo (cảm hứng trực tiếp từ ảnh mẫu 2D!) */}
              {hasAcc('acc_film_camera') && (
                <g>
                  {/* Dây đeo chéo màu xám đậm */}
                  <line
                    x1="154"
                    y1="240"
                    x2="152"
                    y2="294"
                    stroke="#4B515C"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <line
                    x1="258"
                    y1="240"
                    x2="210"
                    y2="298"
                    stroke="#3A3F49"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Thân máy ảnh phim tím xanh Lineless */}
                  <rect x="136" y="278" width="78" height="50" rx="10" fill="#6966B3" />
                  <path d="M136 286 C136 280, 141 278, 146 278 L204 278 C209 278, 214 280, 214 286 L214 293 L136 293 Z" fill="#7F7CC9" />
                  {/* Cạnh bên 3D giả phẳng */}
                  <path d="M206 278 L214 282 L214 324 L206 328 Z" fill="#423E85" />
                  {/* Nút chụp & đèn flash màu nổi */}
                  <rect x="148" y="272" width="16" height="6" rx="3" fill="#B8C2D6" />
                  <circle cx="187" cy="286" r="3.4" fill="#E84A5F" />
                  <rect x="194" y="283" width="9" height="6" rx="3" fill="#F4B83A" />
                  {/* Ống kính máy ảnh nổi bật */}
                  <circle cx="164" cy="306" r="18" fill="#423E85" />
                  <circle cx="164" cy="306" r="12.5" fill="#182138" />
                  <circle cx="160" cy="302" r="3.6" fill="#FFFFFF" opacity="0.85" />
                  <circle cx="192" cy="305" r="3" fill="#FFFFFF" opacity="0.7" />
                </g>
              )}

              {/* Charm cuộn chỉ đỏ & cờ-lê mini */}
              {hasAcc('acc_thread_wrench_charm') && (
                <g transform="translate(106, 336)">
                  {/* Cuộn chỉ đỏ */}
                  <rect x="-10" y="-12" width="20" height="24" rx="5" fill="#B93818" />
                  <rect x="-13" y="-15" width="26" height="5" rx="2.5" fill="#D9A163" />
                  <rect x="-13" y="10" width="26" height="5" rx="2.5" fill="#D9A163" />
                  {/* Cờ-lê cam mini bắt chéo */}
                  <g transform="rotate(-32 10 2)">
                    <rect x="4" y="-18" width="9" height="34" rx="4.5" fill="#D46534" />
                    <circle cx="8.5" cy="-18" r="8" fill="#D46534" />
                    <circle cx="8.5" cy="-21" r="4" fill="#F7F2E8" />
                  </g>
                </g>
              )}

              {/* Ly cà phê sữa đá Sài Gòn bên tay phải */}
              {hasAcc('acc_coffee_cup') && (
                <g transform="translate(292, 332)">
                  {/* Ống hút đỏ */}
                  <line x1="3" y1="-34" x2="10" y2="-10" stroke="#B93818" strokeWidth="4.5" strokeLinecap="round" />
                  {/* Nắp vòm trong nhẹ */}
                  <path d="M-16 -14 C-16 -28, 16 -28, 16 -14 Z" fill="#FFFFFF" opacity="0.72" />
                  {/* Thân ly */}
                  <path d="M-16 -14 L16 -14 L12 22 C11 26, -11 26, -12 22 Z" fill="#B6784B" />
                  {/* Lớp sữa đặc đáy ly */}
                  <path d="M-13 10 L13 10 L12 22 C11 26, -11 26, -12 22 Z" fill="#F8F2E7" />
                  {/* Viên đá trong ly */}
                  <rect x="-9" y="-9" width="9" height="9" rx="2.5" fill="#FFFFFF" opacity="0.45" />
                  <rect x="2" y="-6" width="8" height="8" rx="2" fill="#FFFFFF" opacity="0.4" />
                  {/* Vành nắp ly */}
                  <rect x="-18" y="-16" width="36" height="4.5" rx="2.2" fill="#FFFFFF" />
                </g>
              )}
            </g>

            {/* Sparkle burst ngắn khi vừa đổi đồ (không cản trở nhịp bay) */}
            {!disableAnimation && showSparkles && (
              <g className="mascot-sparkle" pointerEvents="none">
                {[
                  [92, 92, '#F5C451'],
                  [312, 108, '#D46534'],
                  [84, 290, '#4F6B54'],
                  [320, 276, '#F5C451'],
                ].map(([sx, sy, color], idx) => (
                  <path
                    key={idx}
                    d={`M ${sx} ${Number(sy) - 9} L ${Number(sx) + 2.5} ${Number(sy) - 2.5} L ${Number(sx) + 9} ${sy} L ${Number(sx) + 2.5} ${Number(sy) + 2.5} L ${sx} ${Number(sy) + 9} L ${Number(sx) - 2.5} ${Number(sy) + 2.5} L ${Number(sx) - 9} ${sy} L ${Number(sx) - 2.5} ${Number(sy) - 2.5} Z`}
                    fill={String(color)}
                  />
                ))}
              </g>
            )}
          </g>
        </g>
      </svg>
    );
  }
);
