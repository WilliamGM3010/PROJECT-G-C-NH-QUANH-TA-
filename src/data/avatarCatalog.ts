import type {
  AvatarAchievementDefinition,
  AvatarCollectionMeta,
  AvatarConfig,
  AvatarItem,
  AvatarQuestDefinition,
  AvatarQuestProgressState,
  FaceExpressionOption,
  HairColorOption,
  SkinToneOption,
  StudioBackgroundOption,
} from '../types/avatar';

export const SKIN_TONES: SkinToneOption[] = [
  {
    id: 'skin_porcelain',
    name: 'Sáng hồng',
    hex: '#FCE5D8',
    blushHex: '#F39C8E',
    shadowHex: '#EBC2AE',
  },
  {
    id: 'skin_warm_cream',
    name: 'Kem ấm',
    hex: '#F9DEC9',
    blushHex: '#F09A84',
    shadowHex: '#E5B99A',
  },
  {
    id: 'skin_neutral',
    name: 'Da trung tính',
    hex: '#F0CBB0',
    blushHex: '#E68A76',
    shadowHex: '#D8A382',
  },
  {
    id: 'skin_saigon_sun',
    name: 'Nắng Sài Gòn',
    hex: '#DFB08C',
    blushHex: '#D87E68',
    shadowHex: '#C48A62',
  },
  {
    id: 'skin_honey',
    name: 'Nâu mật',
    hex: '#C68F68',
    blushHex: '#BE6C58',
    shadowHex: '#A66F4B',
  },
  {
    id: 'skin_warm_cocoa',
    name: 'Nâu ấm',
    hex: '#9D6949',
    blushHex: '#A85746',
    shadowHex: '#7D4F35',
  },
];

export const FACE_EXPRESSIONS: FaceExpressionOption[] = [
  {
    id: 'sparkle_round',
    name: 'Mắt tròn long lanh',
    previewBadge: '◉‿◉',
    description: 'Đôi mắt to lấp lánh tò mò khám phá từng con hẻm nhỏ Sài Gòn.',
  },
  {
    id: 'happy_squint',
    name: 'Cười híp mắt',
    previewBadge: '^‿^',
    description: 'Nụ cười ấm áp thân thiện mỗi khi ghé thăm góc thợ quen.',
  },
  {
    id: 'cool_confident',
    name: 'Tự tin cá tính',
    previewBadge: '•‿•',
    description: 'Ánh nhìn điềm tĩnh, chất riêng của tín đồ sống xanh bền vững.',
  },
  {
    id: 'playful_wink',
    name: 'Nháy mắt tinh nghịch',
    previewBadge: '◕‿~',
    description: 'Tinh thần trẻ trung năng động, sẵn sàng săn kho báu góc nghề.',
  },
  {
    id: 'cute_surprised',
    name: 'Ngạc nhiên dễ thương',
    previewBadge: '⊙o⊙',
    description: 'Thích thú bất ngờ khi món đồ cũ được cô chú hồi sinh như mới.',
  },
];

export const HAIR_COLORS: HairColorOption[] = [
  {
    id: 'hair_honey',
    name: 'Vàng mật ong',
    hex: '#E6A163',
    highlightHex: '#F3BC84',
  },
  {
    id: 'hair_chestnut',
    name: 'Nâu hạt dẻ',
    hex: '#6D4532',
    highlightHex: '#8C5B44',
  },
  {
    id: 'hair_charcoal',
    name: 'Đen than',
    hex: '#2C2F36',
    highlightHex: '#464B55',
  },
  {
    id: 'hair_terracotta',
    name: 'Cam đất',
    hex: '#D46534',
    highlightHex: '#E58255',
  },
  {
    id: 'hair_pastel_pink',
    name: 'Hồng pastel',
    hex: '#EC9CB0',
    highlightHex: '#F7B8C8',
  },
  {
    id: 'hair_lavender',
    name: 'Tím oải hương',
    hex: '#A996D8',
    highlightHex: '#C2B3EA',
  },
  {
    id: 'hair_indigo',
    name: 'Xanh chàm',
    hex: '#2F4D8C',
    highlightHex: '#4C6EB5',
  },
  {
    id: 'hair_platinum',
    name: 'Bạch kim kem',
    hex: '#E5DFD5',
    highlightHex: '#F7F3EC',
  },
];

export const STUDIO_BACKGROUNDS: StudioBackgroundOption[] = [
  {
    id: 'bg_mint_sky',
    name: 'Bạc hà sáng',
    cssGradient: 'radial-gradient(circle at 50% 35%, #E7F7F2 0%, #BCE5DC 65%, #9ED5CA 100%)',
    canvasStops: ['#E7F7F2', '#BCE5DC', '#9ED5CA'],
    floorTint: '#7AB8AC',
    textColor: '#1F3A36',
  },
  {
    id: 'bg_warm_ivory',
    name: 'Kem Warm Ivory',
    cssGradient: 'radial-gradient(circle at 50% 35%, #FFFBF2 0%, #F7F2E8 62%, #EADEC9 100%)',
    canvasStops: ['#FFFBF2', '#F7F2E8', '#EADEC9'],
    floorTint: '#C8B8A2',
    textColor: '#25292E',
  },
  {
    id: 'bg_pastel_peach',
    name: 'Đào pastel',
    cssGradient: 'radial-gradient(circle at 50% 35%, #FFF2EA 0%, #FAD9C6 65%, #F2BFA4 100%)',
    canvasStops: ['#FFF2EA', '#FAD9C6', '#F2BFA4'],
    floorTint: '#D89B7C',
    textColor: '#4A2B1D',
  },
  {
    id: 'bg_butter_yellow',
    name: 'Vàng bơ',
    cssGradient: 'radial-gradient(circle at 50% 35%, #FFFCE8 0%, #F9ECC0 65%, #F1DC97 100%)',
    canvasStops: ['#FFFCE8', '#F9ECC0', '#F1DC97'],
    floorTint: '#CEB66B',
    textColor: '#463812',
  },
  {
    id: 'bg_soft_sky',
    name: 'Xanh trời dịu',
    cssGradient: 'radial-gradient(circle at 50% 35%, #F0F6FF 0%, #D3E4FB 65%, #B4CEF5 100%)',
    canvasStops: ['#F0F6FF', '#D3E4FB', '#B4CEF5'],
    floorTint: '#8EAEDB',
    textColor: '#1B3B82',
  },
  {
    id: 'bg_candy_pink',
    name: 'Hồng kẹo bông',
    cssGradient: 'radial-gradient(circle at 50% 35%, #FFF1F5 0%, #FAD4DF 65%, #F2B8C9 100%)',
    canvasStops: ['#FFF1F5', '#FAD4DF', '#F2B8C9'],
    floorTint: '#D695A8',
    textColor: '#4E2231',
  },
];

export const AVATAR_COLLECTIONS: AvatarCollectionMeta[] = [
  {
    id: 'everyday',
    name: 'Đời Thường Năng Động',
    vietnameseTag: 'EVERYDAY COLLECTION',
    subtitle: 'Phong cách sinh viên Sài Gòn trẻ trung, gọn gàng và dễ phối đồ',
    story:
      'Lấy cảm hứng từ những buổi sáng chạy vội ra lớp với áo thun phối màu, hoodie ấm, sneaker đế dày và tai nghe chụp tai — bộ trang phục khởi đầu dành cho mọi bạn trẻ.',
    accentColor: '#1B3B82',
    surfaceTint: '#EEF2FA',
    badgeText: 'Khởi đầu',
  },
  {
    id: 'saigon',
    name: 'Dấu Ấn Sài Gòn',
    vietnameseTag: 'SAIGON HERITAGE',
    subtitle: 'Áo Bà Ba cách tân, Áo Dài hiện đại, Nón lá mini và túi tote hẻm nhỏ',
    story:
      'Tôn vinh nét duyên dáng thân thương của phố thị phương Nam: tà áo mềm mại, chiếc nón lá nhỏ nhắn và chiếc túi vải mang theo hương nắng gió những con hẻm Sài Gòn.',
    accentColor: '#D46534',
    surfaceTint: '#FDF0E9',
    badgeText: 'Bản sắc phố',
  },
  {
    id: 'craft',
    name: 'Cảm Hứng Nghề Thủ Công',
    vietnameseTag: 'THE NEIGHBORHOOD CRAFT',
    subtitle: 'Tạp dề thợ khâu, kính thợ đồng hồ, bốt da bền bỉ và túi đồ nghề mini',
    story:
      'Dành riêng cho những tâm hồn trân quý đôi tay cần mẫn. Mỗi đường kim mũi chỉ, chiếc cờ-lê nhỏ hay chiếc tạp dề vải bố đều kể câu chuyện hồi sinh đồ cũ đầy tự hào.',
    accentColor: '#4F6B54',
    surfaceTint: '#EEF4EF',
    badgeText: 'Góc nghề',
  },
  {
    id: 'seasonal',
    name: 'Mùa Lễ Hội & Thời Tiết',
    vietnameseTag: 'SEASONAL CAPSULE',
    subtitle: 'Áo len Đông ấm áp, khăn choàng chỉ đỏ và phiên bản Tết sắp ra mắt',
    story:
      'Góc Thợ thay áo mới theo từng nhịp mùa Sài Gòn — từ gió se lạnh cuối năm với chiếc khăn len đỏ sợi chỉ tới bộ lụa gấm Tết rộn ràng đang được đội ngũ chăm chút.',
    accentColor: '#B93818',
    surfaceTint: '#FBECE8',
    badgeText: 'Theo mùa',
  },
  {
    id: 'limited',
    name: 'Phiên Bản Giới Hạn',
    vietnameseTag: 'LIMITED EDITION',
    subtitle: 'Trang phục đặc biệt không bán bằng GP — chỉ trao cho người đóng góp thật',
    story:
      'Chiếc áo khoác "Người Giữ Góc Nghề" với huy hiệu chỉ đỏ thêu ngực là phần thưởng danh dự dành riêng cho những bạn đã đóng góp thêm cô chú thợ mới lên bản đồ cộng đồng.',
    accentColor: '#9A6310',
    surfaceTint: '#FDF5E2',
    badgeText: 'Độc quyền',
  },
];

export const AVATAR_ITEMS: AvatarItem[] = [
  // ===================== HAIRSTYLES (6) =====================
  {
    id: 'fluffy_curls',
    name: 'Tóc xoăn mây bồng bềnh',
    slot: 'hair',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    story: 'Mái tóc xoăn phồng như đám mây ngọt ngào — phong cách đặc trưng của bộ sưu tập Chibi Góc Thợ.',
    modelConfig: {
      primaryColor: '#E6A163',
      styleVariant: 'fluffy_curls',
    },
  },
  {
    id: 'neat_bangs',
    name: 'Tóc mái ngang gọn gàng',
    slot: 'hair',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    story: 'Kiểu tóc mái bằng thân thiện, sáng sủa, hợp với cả áo thun lẫn áo dài cách tân.',
    modelConfig: {
      primaryColor: '#6D4532',
      styleVariant: 'neat_bangs',
    },
  },
  {
    id: 'soft_bob',
    name: 'Tóc bob uốn nhẹ',
    slot: 'hair',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    story: 'Tóc bob bo tròn ôm lấy gương mặt tròn xoe, thanh lịch mà vẫn rất đáng yêu.',
    modelConfig: {
      primaryColor: '#2C2F36',
      styleVariant: 'soft_bob',
    },
  },
  {
    id: 'twin_buns',
    name: 'Tóc hai búi tròn nhỏ',
    slot: 'hair',
    collection: 'saigon',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 35,
    story: 'Hai búi tóc nhỏ hai bên tạo điểm nhấn tinh nghịch, rất hợp khi dạo chơi cuối tuần.',
    modelConfig: {
      primaryColor: '#6D4532',
      accentColor: '#D46534',
      styleVariant: 'twin_buns',
    },
  },
  {
    id: 'fresh_undercut',
    name: 'Tóc undercut trẻ trung',
    slot: 'hair',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    story: 'Phần mái vuốt bồng năng động, mang lại diện mạo gọn gàng khỏe khoắn.',
    modelConfig: {
      primaryColor: '#2C2F36',
      styleVariant: 'fresh_undercut',
    },
  },
  {
    id: 'long_flowing',
    name: 'Tóc dài xõa dịu dàng',
    slot: 'hair',
    collection: 'saigon',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 45,
    story: 'Mái tóc dài mượt phủ vai mang nét dịu dàng cổ điển khi diện cùng Áo Dài hoặc Áo Bà Ba.',
    modelConfig: {
      primaryColor: '#2C2F36',
      styleVariant: 'long_flowing',
    },
  },

  // ===================== TOPS (10) =====================
  {
    id: 'basic_tee',
    name: 'Áo thun Raglan nắng mai',
    slot: 'top',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    story: 'Chiếc áo thun vàng bơ phối cổ xanh bạc hà và tay pastel — mang năng lượng tươi sáng mỗi ngày.',
    modelConfig: {
      primaryColor: '#F6DF6C',
      secondaryColor: '#8BC9D1',
      accentColor: '#F3B465',
      styleVariant: 'basic_tee',
    },
  },
  {
    id: 'warm_hoodie',
    name: 'Áo Hoodie xanh chàm ấm',
    slot: 'top',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    story: 'Hoodie nỉ dày dặn có túi kangaroo và dây rút kem ấm — chuẩn gu sinh viên Ngoại Thương.',
    modelConfig: {
      primaryColor: '#3B5998',
      secondaryColor: '#F7F2E8',
      accentColor: '#D46534',
      styleVariant: 'warm_hoodie',
    },
  },
  {
    id: 'bomber_jacket',
    name: 'Áo khoác Bomber phố thị',
    slot: 'top',
    collection: 'everyday',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 45,
    story: 'Bomber phối tay kem trẻ trung, bo cổ sọc thể thao cho những chuyến dạo khắp quận.',
    modelConfig: {
      primaryColor: '#4F6B54',
      secondaryColor: '#F7F2E8',
      accentColor: '#D46534',
      styleVariant: 'bomber_jacket',
    },
  },
  {
    id: 'cropped_jacket',
    name: 'Áo khoác Cropped cam đất',
    slot: 'top',
    collection: 'everyday',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 55,
    story: 'Áo khoác dáng ngắn màu cam đất Terracotta phối áo trong kem, năng động và nổi bật.',
    modelConfig: {
      primaryColor: '#D46534',
      secondaryColor: '#FFF9F0',
      accentColor: '#1B3B82',
      styleVariant: 'cropped_jacket',
    },
  },
  {
    id: 'ba_ba_modern',
    name: 'Áo Bà Ba cách tân xanh rêu',
    slot: 'top',
    collection: 'saigon',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 60,
    story: 'Thiết kế cổ tròn hàng cúc giữa duyên dáng kết hợp túi nhỏ hai bên — mộc mạc mà hiện đại.',
    modelConfig: {
      primaryColor: '#6D8C72',
      secondaryColor: '#F7F2E8',
      accentColor: '#D46534',
      styleVariant: 'ba_ba_modern',
    },
  },
  {
    id: 'ao_dai_modern',
    name: 'Áo Dài cách tân sắc nắng',
    slot: 'top',
    collection: 'saigon',
    rarity: 'epic',
    unlockType: 'gp',
    gpCost: 90,
    story: 'Tà áo dài ngắn gọn thanh thoát mang sắc cam san hô ấm áp điểm nút thắt cổ truyền thống.',
    modelConfig: {
      primaryColor: '#E07A5F',
      secondaryColor: '#F7E7CE',
      accentColor: '#D4A034',
      styleVariant: 'ao_dai_modern',
    },
  },
  {
    id: 'craft_apron',
    name: 'Tạp dề thợ thủ công vải bố',
    slot: 'top',
    collection: 'craft',
    rarity: 'epic',
    unlockType: 'gp',
    gpCost: 80,
    story: 'Áo sơ mi xắn tay mặc cùng tạp dề vải bố nâu da có túi đựng kim chỉ, kéo và thước dây.',
    modelConfig: {
      primaryColor: '#8D5B42',
      secondaryColor: '#F4EDE1',
      accentColor: '#1B3B82',
      styleVariant: 'craft_apron',
    },
  },
  {
    id: 'winter_knit',
    name: 'Áo len đan gió se lạnh',
    slot: 'top',
    collection: 'seasonal',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 65,
    story: 'Áo len dệt cổ tròn họa tiết sọc ngang ấm áp cho mùa cuối năm Sài Gòn.',
    modelConfig: {
      primaryColor: '#C84B31',
      secondaryColor: '#F7F2E8',
      accentColor: '#4F6B54',
      styleVariant: 'winter_knit',
    },
  },
  {
    id: 'guardian_jacket',
    name: 'Áo khoác "Người Giữ Góc Nghề"',
    slot: 'top',
    collection: 'limited',
    rarity: 'limited',
    unlockType: 'quest',
    questId: 'suggest_artisan',
    story:
      'Phiên bản giới hạn độc quyền với sắc xanh chàm di sản, viền chỉ đỏ thêu tay và huy hiệu cộng đồng — chỉ mở khi bạn giới thiệu một cô chú thợ mới lên bản đồ.',
    modelConfig: {
      primaryColor: '#1B3B82',
      secondaryColor: '#F7F2E8',
      accentColor: '#B93818',
      styleVariant: 'guardian_jacket',
    },
  },
  {
    id: 'tet_silk_teaser',
    name: 'Áo gấm Lân Sư Mùa Tết',
    slot: 'top',
    collection: 'seasonal',
    rarity: 'limited',
    unlockType: 'quest',
    story: 'Thiết kế lụa gấm đỏ son thêu hoa mai vàng dành riêng cho sự kiện Tết Nguyên Đán sắp tới.',
    modelConfig: {
      primaryColor: '#B93818',
      secondaryColor: '#F5C451',
      accentColor: '#F7F2E8',
      styleVariant: 'ao_dai_modern',
    },
    comingSoon: true,
    comingSoonNote: 'Sắp ra mắt mùa Tết',
  },

  // ===================== BOTTOMS (5) =====================
  {
    id: 'active_shorts',
    name: 'Quần short san hô năng động',
    slot: 'bottom',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    story: 'Quần short dáng gọn thoải mái, phối màu rực rỡ tạo cảm giác hoạt bát trẻ trung.',
    modelConfig: {
      primaryColor: '#EA766C',
      secondaryColor: '#D65E54',
      styleVariant: 'active_shorts',
    },
  },
  {
    id: 'jogger_cuff',
    name: 'Quần Jogger bo gấu kem',
    slot: 'bottom',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    story: 'Quần jogger nỉ mềm bo gấu gọn gàng, phối cực ăn ý với hoodie và sneaker.',
    modelConfig: {
      primaryColor: '#D9CEBE',
      secondaryColor: '#B8AA96',
      styleVariant: 'jogger_cuff',
    },
  },
  {
    id: 'straight_jeans',
    name: 'Quần Jeans denim ống đứng',
    slot: 'bottom',
    collection: 'craft',
    rarity: 'common',
    unlockType: 'free',
    story: 'Quần jeans xanh cổ điển bền bỉ — món đồ ai cũng từng mang đi cắt lai hoặc thay khóa kéo.',
    modelConfig: {
      primaryColor: '#456696',
      secondaryColor: '#314C73',
      accentColor: '#D4A034',
      styleVariant: 'straight_jeans',
    },
  },
  {
    id: 'pleated_skirt',
    name: 'Chân váy xếp ly học đường',
    slot: 'bottom',
    collection: 'everyday',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 35,
    story: 'Chân váy xếp ly nhẹ nhàng gam xanh navy kết hợp đường viền kem thanh lịch.',
    modelConfig: {
      primaryColor: '#29467A',
      secondaryColor: '#F7F2E8',
      styleVariant: 'pleated_skirt',
    },
  },
  {
    id: 'wide_traditional',
    name: 'Quần ống rộng lụa truyền thống',
    slot: 'bottom',
    collection: 'saigon',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 45,
    story: 'Quần ống suông mềm mại màu kem ngà giúp tôn trọn vẻ duyên dáng của Áo Dài và Áo Bà Ba.',
    modelConfig: {
      primaryColor: '#F4ECDE',
      secondaryColor: '#DFD2BC',
      styleVariant: 'wide_traditional',
    },
  },

  // ===================== SHOES (4) =====================
  {
    id: 'chunky_sneakers',
    name: 'Sneaker đế dày phối màu',
    slot: 'shoes',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    story: 'Đôi sneaker bầu bĩnh đệm dày êm chân cho hành trình rong ruổi khám phá góc hẻm.',
    modelConfig: {
      primaryColor: '#E59449',
      secondaryColor: '#F7F2E8',
      accentColor: '#D46534',
      styleVariant: 'chunky_sneakers',
    },
  },
  {
    id: 'canvas_low',
    name: 'Giày vải cổ thấp cổ điển',
    slot: 'shoes',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    story: 'Giày vải xanh chàm mũi trắng tối giản, mang lại cảm giác nhẹ nhàng bền bỉ.',
    modelConfig: {
      primaryColor: '#2D4D8A',
      secondaryColor: '#FFFDF8',
      accentColor: '#B93818',
      styleVariant: 'canvas_low',
    },
  },
  {
    id: 'pastel_slides',
    name: 'Dép quai ngang pastel Sài Gòn',
    slot: 'shoes',
    collection: 'saigon',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 30,
    story: 'Đôi dép quai ngang màu bạc hà mát mẻ — đúng tinh thần phóng khoáng dạo đầu hẻm uống cà phê sữa đá.',
    modelConfig: {
      primaryColor: '#78B9AE',
      secondaryColor: '#F7F2E8',
      styleVariant: 'pastel_slides',
    },
  },
  {
    id: 'craft_boots',
    name: 'Bốt da thợ thủ công',
    slot: 'shoes',
    collection: 'craft',
    rarity: 'epic',
    unlockType: 'gp',
    gpCost: 55,
    story: 'Đôi bốt da nâu khâu đế tỉ mỉ — biểu tượng cho tay nghề sửa giày bền đẹp qua năm tháng.',
    modelConfig: {
      primaryColor: '#7A492E',
      secondaryColor: '#3B281E',
      accentColor: '#D4A034',
      styleVariant: 'craft_boots',
    },
  },

  // ===================== ACCESSORIES (8 multi-layer) =====================
  {
    id: 'acc_beanie',
    name: 'Nón len Beanie cam đất',
    slot: 'accessory',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    story: 'Chiếc nón len gân mềm ôm đỉnh đầu, thêm điểm nhấn ấm áp cho diện mạo Chibi.',
    modelConfig: {
      primaryColor: '#D46534',
      secondaryColor: '#F7F2E8',
      styleVariant: 'beanie',
      layer: 'headwear',
    },
  },
  {
    id: 'acc_cap',
    name: 'Nón lưỡi trai xanh chàm',
    slot: 'accessory',
    collection: 'everyday',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 30,
    story: 'Nón lưỡi trai năng động che nắng trưa Sài Gòn khi đi tìm góc thợ quanh khu phố.',
    modelConfig: {
      primaryColor: '#1B3B82',
      secondaryColor: '#F7F2E8',
      accentColor: '#D46534',
      styleVariant: 'cap',
      layer: 'headwear',
    },
  },
  {
    id: 'acc_non_la',
    name: 'Nón lá mini cách điệu',
    slot: 'accessory',
    collection: 'saigon',
    rarity: 'epic',
    unlockType: 'gp',
    gpCost: 55,
    story: 'Chiếc nón lá chóp thanh thoát với quai lụa đỏ thắm — linh hồn Việt giữa phiên bản đồ chơi vinyl.',
    modelConfig: {
      primaryColor: '#EBD7A7',
      secondaryColor: '#C9AD74',
      accentColor: '#B93818',
      styleVariant: 'non_la',
      layer: 'headwear',
    },
  },
  {
    id: 'acc_round_glasses',
    name: 'Kính gọng tròn thợ đồng hồ',
    slot: 'accessory',
    collection: 'craft',
    rarity: 'common',
    unlockType: 'free',
    story: 'Gọng kính tròn kim loại thanh mảnh gợi nhớ đôi mắt tinh tường của các chú thợ sửa đồng hồ.',
    modelConfig: {
      primaryColor: '#C5923A',
      secondaryColor: '#E5F2FA',
      styleVariant: 'round_glasses',
      layer: 'eyewear',
    },
  },
  {
    id: 'acc_headphones',
    name: 'Tai nghe chụp tai Pastel',
    slot: 'accessory',
    collection: 'everyday',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 40,
    story: 'Tai nghe chụp tai tròn mũm mĩm màu kem phối cam, vừa đi dạo vừa nghe nhạc chill.',
    modelConfig: {
      primaryColor: '#F5ECE0',
      secondaryColor: '#D46534',
      accentColor: '#25292E',
      styleVariant: 'headphones',
      layer: 'audio',
    },
  },
  {
    id: 'acc_saigon_tote',
    name: 'Túi tote hẻm Sài Gòn',
    slot: 'accessory',
    collection: 'saigon',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 35,
    story: 'Chiếc túi vải canvas đeo chéo in điểm nhấn chỉ đỏ — đựng vừa đôi giày mang ra chú thợ dán đế.',
    modelConfig: {
      primaryColor: '#F5ECDC',
      secondaryColor: '#1B3B82',
      accentColor: '#B93818',
      styleVariant: 'saigon_tote',
      layer: 'bag',
    },
  },
  {
    id: 'acc_craft_pouch',
    name: 'Túi đồ nghề & cờ-lê mini',
    slot: 'accessory',
    collection: 'craft',
    rarity: 'epic',
    unlockType: 'gp',
    gpCost: 60,
    story: 'Đai túi da đeo hông kèm cờ-lê kim loại nhỏ xinh — phụ kiện nhận diện tín đồ yêu đồ thủ công.',
    modelConfig: {
      primaryColor: '#7A492E',
      secondaryColor: '#BCC6D1',
      accentColor: '#D4A034',
      styleVariant: 'craft_pouch',
      layer: 'waist',
    },
  },
  {
    id: 'acc_red_scarf',
    name: 'Khăn choàng len chỉ đỏ',
    slot: 'accessory',
    collection: 'seasonal',
    rarity: 'rare',
    unlockType: 'gp',
    gpCost: 45,
    story: 'Chiếc khăn len đan tay màu đỏ sợi chỉ gắn kết cộng đồng — ấm áp cho những ngày cuối năm.',
    modelConfig: {
      primaryColor: '#B93818',
      secondaryColor: '#F7F2E8',
      styleVariant: 'red_scarf',
      layer: 'neck',
    },
  },
];

export const AVATAR_QUESTS: AvatarQuestDefinition[] = [
  {
    id: 'explore_3_artisans',
    title: 'Khám phá 3 góc thợ trên bản đồ',
    description: 'Mở xem hồ sơ chi tiết của 3 cô chú thợ khác nhau để tìm hiểu nghề thủ công quanh bạn.',
    target: 3,
    gpReward: 25,
    actionLabel: 'Đi khám phá ngay',
    actionRoute: 'explore',
    categoryLabel: 'Khám phá',
  },
  {
    id: 'revive_item',
    title: 'Hồi sinh 1 món đồ cũ',
    description: 'Bấm xác nhận "Tôi đã sửa xong" tại trang hồ sơ cô chú thợ sau khi sửa đồ thành công.',
    target: 1,
    gpReward: 50,
    actionLabel: 'Tìm thợ gần nhà',
    actionRoute: 'explore',
    categoryLabel: 'Sống xanh',
  },
  {
    id: 'send_praise',
    title: 'Gửi lời khen cho cô chú thợ',
    description: 'Viết một lời khen hoặc lời cảm ơn ấm áp gửi tới cô chú thợ bạn từng trải nghiệm.',
    target: 1,
    gpReward: 20,
    actionLabel: 'Đến bản đồ thợ',
    actionRoute: 'explore',
    categoryLabel: 'Cộng đồng',
  },
  {
    id: 'save_favorite',
    title: 'Lưu 1 góc thợ yêu thích',
    description: 'Đánh dấu lưu một cô chú thợ vào sổ tay cá nhân để tiện tìm lại khi cần.',
    target: 1,
    gpReward: 15,
    actionLabel: 'Xem góc thợ',
    actionRoute: 'home',
    categoryLabel: 'Sổ tay',
  },
  {
    id: 'suggest_artisan',
    title: 'Gợi ý 1 cô chú thợ mới',
    description: 'Giới thiệu thêm một góc thợ uy tín ở khu phố bạn lên bản đồ cộng đồng để nhận thưởng lớn & mở khóa Áo khoác Giới hạn.',
    target: 1,
    gpReward: 120,
    unlockItemId: 'guardian_jacket',
    actionLabel: 'Gợi ý thợ mới',
    actionRoute: 'suggest',
    categoryLabel: 'Đặc biệt',
  },
  {
    id: 'first_avatar_save',
    title: 'Lưu nhân vật Avatar đầu tiên',
    description: 'Tùy chỉnh phong cách riêng cho Chibi 3D của bạn và bấm lưu hồ sơ nhân vật lần đầu.',
    target: 1,
    gpReward: 30,
    actionLabel: 'Tùy chỉnh ngay',
    actionRoute: 'avatar_creator',
    categoryLabel: 'Khởi đầu',
  },
];

export const AVATAR_ACHIEVEMENTS: AvatarAchievementDefinition[] = [
  {
    id: 'title_rookie',
    title: 'Tân Binh Góc Thợ',
    description: 'Chào mừng bạn gia nhập cộng đồng yêu nghề thủ công và sống xanh Sài Gòn.',
    badgeCode: 'LV.01',
    accentHex: '#1B3B82',
    requirementText: 'Mở khóa mặc định cho mọi thành viên',
  },
  {
    id: 'title_green_soul',
    title: 'Tín Đồ Sống Xanh',
    description: 'Bạn chọn sửa chữa để kéo dài vòng đời món đồ thay vì vội vàng thay mới.',
    badgeCode: 'ECO',
    accentHex: '#4F6B54',
    requirementText: 'Hoàn thành nhiệm vụ "Hồi sinh 1 món đồ cũ"',
  },
  {
    id: 'title_alley_friend',
    title: 'Người Bạn Góc Hẻm',
    description: 'Luôn lan tỏa năng lượng tích cực bằng những lời khen và khám phá các con hẻm Sài Gòn.',
    badgeCode: 'ALLY',
    accentHex: '#D46534',
    requirementText: 'Hoàn thành nhiệm vụ Khám phá 3 góc thợ hoặc Gửi lời khen',
  },
  {
    id: 'title_saigon_collector',
    title: 'Nhà Sưu Tầm Sài Gòn',
    description: 'Sở hữu ít nhất 2 vật phẩm trong bộ sưu tập Dấu Ấn Sài Gòn.',
    badgeCode: 'SG',
    accentHex: '#C84B31',
    requirementText: 'Sở hữu tối thiểu 2 món thuộc BST Dấu Ấn Sài Gòn',
  },
  {
    id: 'title_craft_keeper',
    title: 'Người Giữ Góc Nghề',
    description: 'Danh hiệu danh dự dành cho bạn trẻ trực tiếp đóng góp thêm góc thợ mới lên bản đồ.',
    badgeCode: 'GOLD',
    accentHex: '#9A6310',
    requirementText: 'Hoàn thành nhiệm vụ "Gợi ý 1 cô chú thợ mới"',
  },
  {
    id: 'title_style_artisan',
    title: 'Nghệ Nhân Phối Đồ',
    description: 'Sưu tầm và sở hữu từ 14 vật phẩm trở lên trong tủ đồ Góc Thợ Avatar.',
    badgeCode: 'MAX',
    accentHex: '#6B4E9B',
    requirementText: 'Sở hữu tối thiểu 14 vật phẩm trong Tủ đồ',
  },
];

export const FREE_STARTER_ITEM_IDS: string[] = AVATAR_ITEMS.filter(
  (item) => item.unlockType === 'free' && !item.comingSoon
).map((item) => item.id);

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinId: 'skin_warm_cream',
  faceId: 'sparkle_round',
  hairId: 'fluffy_curls',
  hairColorId: 'hair_honey',
  topId: 'basic_tee',
  bottomId: 'active_shorts',
  shoesId: 'chunky_sneakers',
  accessoryIds: [],
  studioBgId: 'bg_mint_sky',
};

export const DEFAULT_QUEST_PROGRESS: AvatarQuestProgressState = {
  explore_3_artisans: 0,
  revive_item: 0,
  send_praise: 0,
  save_favorite: 0,
  suggest_artisan: 0,
  first_avatar_save: 0,
  viewedArtisanIds: [],
};

export function getAvatarItemById(id: string): AvatarItem | undefined {
  return AVATAR_ITEMS.find((item) => item.id === id);
}

export function getSkinToneById(id: string): SkinToneOption {
  return SKIN_TONES.find((s) => s.id === id) ?? SKIN_TONES[1];
}

export function getHairColorById(id: string): HairColorOption {
  return HAIR_COLORS.find((c) => c.id === id) ?? HAIR_COLORS[0];
}

export function getStudioBackgroundById(id: string): StudioBackgroundOption {
  return STUDIO_BACKGROUNDS.find((bg) => bg.id === id) ?? STUDIO_BACKGROUNDS[0];
}

export function getCollectionMetaById(id: string): AvatarCollectionMeta {
  return (
    AVATAR_COLLECTIONS.find((col) => col.id === id) ?? AVATAR_COLLECTIONS[0]
  );
}

export function getAchievementById(id: string): AvatarAchievementDefinition {
  return (
    AVATAR_ACHIEVEMENTS.find((ach) => ach.id === id) ?? AVATAR_ACHIEVEMENTS[0]
  );
}

export function getRarityLabel(rarity: AvatarItem['rarity']): {
  label: string;
  className: string;
} {
  switch (rarity) {
    case 'limited':
      return {
        label: 'Giới hạn',
        className: 'bg-[#FDF5E2] text-[#9A6310] border-[#E6C77A]',
      };
    case 'epic':
      return {
        label: 'Đặc sắc',
        className: 'bg-[#FDF0E9] text-[#B93818] border-[#E8B7A2]',
      };
    case 'rare':
      return {
        label: 'Hiếm',
        className: 'bg-[#EEF2FA] text-[#1B3B82] border-[#C5D3EE]',
      };
    case 'common':
    default:
      return {
        label: 'Cơ bản',
        className: 'bg-[#F3EFE6] text-[#615D57] border-[#DFD3C2]',
      };
  }
}

export function getEquippedItemIds(config: AvatarConfig): string[] {
  return [
    config.hairId,
    config.topId,
    config.bottomId,
    config.shoesId,
    ...config.accessoryIds,
  ];
}
