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
    name: 'Kem sáng',
    hex: '#FBE5D2',
    shadowHex: '#EBC8AF',
    blushHex: '#F39B93',
  },
  {
    id: 'skin_warm_cream',
    name: 'Kem ấm',
    hex: '#F4D8BE',
    shadowHex: '#E2BA99',
    blushHex: '#ED9484',
  },
  {
    id: 'skin_neutral',
    name: 'Da tự nhiên',
    hex: '#EBC3A1',
    shadowHex: '#D5A37C',
    blushHex: '#E28473',
  },
  {
    id: 'skin_saigon_sun',
    name: 'Nắng Sài Gòn',
    hex: '#DCA982',
    shadowHex: '#C2895E',
    blushHex: '#D87A67',
  },
  {
    id: 'skin_honey',
    name: 'Nâu mật ong',
    hex: '#C58D65',
    shadowHex: '#A66F49',
    blushHex: '#BE6858',
  },
  {
    id: 'skin_warm_cocoa',
    name: 'Nâu ấm',
    hex: '#9B6849',
    shadowHex: '#7D4E32',
    blushHex: '#A95547',
  },
];

export const FACE_EXPRESSIONS: FaceExpressionOption[] = [
  {
    id: 'sparkle_round',
    name: 'Vui vẻ mắt long lanh',
    previewBadge: '◉‿◉',
    description: 'Đôi mắt tròn long lanh tò mò khám phá từng con hẻm nhỏ Sài Gòn.',
  },
  {
    id: 'happy_squint',
    name: 'Cười híp mắt',
    previewBadge: '^‿^',
    description: 'Nụ cười ấm áp thân thiện mỗi khi ghé thăm cô chú thợ quen.',
  },
  {
    id: 'playful_wink',
    name: 'Nháy mắt tinh nghịch',
    previewBadge: '◕‿~',
    description: 'Tinh thần trẻ trung năng động, sẵn sàng săn kho báu góc nghề.',
  },
  {
    id: 'cool_confident',
    name: 'Bình thản cool ngầu',
    previewBadge: '•‿•',
    description: 'Thần thái điềm tĩnh, chất riêng của tín đồ sống xanh bền vững.',
  },
  {
    id: 'cute_surprised',
    name: 'Hào hứng bất ngờ',
    previewBadge: '⊙o⊙',
    description: 'Thích thú bất ngờ khi món đồ cũ được cô chú hồi sinh như mới.',
  },
];

export const HAIR_COLORS: HairColorOption[] = [
  {
    id: 'hair_cream_cloud',
    name: 'Kem mây ấm',
    hex: '#F4E5D2',
    shadowHex: '#CFAF91',
    highlightHex: '#FFF8EE',
  },
  {
    id: 'hair_chestnut',
    name: 'Nâu hạt dẻ',
    hex: '#7A4E37',
    shadowHex: '#593624',
    highlightHex: '#9C684C',
  },
  {
    id: 'hair_charcoal',
    name: 'Đen mực ấm',
    hex: '#252B3B',
    shadowHex: '#161B28',
    highlightHex: '#434C63',
  },
  {
    id: 'hair_honey',
    name: 'Vàng mật ong',
    hex: '#E6A05C',
    shadowHex: '#C27A3B',
    highlightHex: '#F7C284',
  },
  {
    id: 'hair_terracotta',
    name: 'Cam đất gạch',
    hex: '#D46534',
    shadowHex: '#A74921',
    highlightHex: '#EB885B',
  },
  {
    id: 'hair_indigo',
    name: 'Xanh chàm',
    hex: '#284582',
    shadowHex: '#182E5D',
    highlightHex: '#4B6DB5',
  },
  {
    id: 'hair_pastel_pink',
    name: 'Hồng phấn',
    hex: '#EA9AB0',
    shadowHex: '#C7728B',
    highlightHex: '#F9C1D0',
  },
  {
    id: 'hair_sage',
    name: 'Xanh rêu dịu',
    hex: '#5D7D63',
    shadowHex: '#415D47',
    highlightHex: '#84A48A',
  },
];

export const STUDIO_BACKGROUNDS: StudioBackgroundOption[] = [
  {
    id: 'bg_warm_ivory',
    name: 'Giấy Kem Warm Ivory',
    subtitle: 'Nền giấy thủ công kèm đường chỉ may mờ',
    cssBackground: 'linear-gradient(180deg, #FBF8F1 0%, #F4ECDD 100%)',
    canvasStops: ['#FBF8F1', '#F4ECDD'],
    isDark: false,
    stitchColor: 'rgba(185, 56, 24, 0.22)',
    textColor: '#25292E',
  },
  {
    id: 'bg_alley_sunset',
    name: 'Nắng Chiều Hẻm Nhỏ',
    subtitle: 'Sắc cam đào ấm áp cuối chiều Sài Gòn',
    cssBackground: 'linear-gradient(180deg, #FDECE0 0%, #F7CEB4 100%)',
    canvasStops: ['#FDECE0', '#F7CEB4'],
    isDark: false,
    stitchColor: 'rgba(212, 101, 52, 0.30)',
    textColor: '#48281A',
  },
  {
    id: 'bg_indigo_awning',
    name: 'Xanh Chàm Mái Hiên',
    subtitle: 'Xanh pastel dịu lấy cảm hứng mái hiên tiệm sửa',
    cssBackground: 'linear-gradient(180deg, #EDF3FC 0%, #CEE0F7 100%)',
    canvasStops: ['#EDF3FC', '#CEE0F7'],
    isDark: false,
    stitchColor: 'rgba(27, 59, 130, 0.26)',
    textColor: '#1B3B82',
  },
  {
    id: 'bg_sage_green',
    name: 'Lá Xanh Sống Xanh',
    subtitle: 'Xanh Sage êm dịu tôn vinh lối sống bền vững',
    cssBackground: 'linear-gradient(180deg, #EFF6F0 0%, #D2E4D5 100%)',
    canvasStops: ['#EFF6F0', '#D2E4D5'],
    isDark: false,
    stitchColor: 'rgba(79, 107, 84, 0.28)',
    textColor: '#253D29',
  },
  {
    id: 'bg_saigon_yellow',
    name: 'Tường Vàng Sài Gòn',
    subtitle: 'Vàng bơ ấm như bức tường cư xá nắng sớm',
    cssBackground: 'linear-gradient(180deg, #FDF8DF 0%, #F6E6A9 100%)',
    canvasStops: ['#FDF8DF', '#F6E6A9'],
    isDark: false,
    stitchColor: 'rgba(154, 99, 16, 0.26)',
    textColor: '#4A3912',
  },
  {
    id: 'bg_craft_night',
    name: 'Đêm Phố Thủ Công',
    subtitle: 'Xanh đêm sâu nổi bật sắc màu nhân vật 2D',
    cssBackground: 'linear-gradient(180deg, #27447C 0%, #192E5A 100%)',
    canvasStops: ['#27447C', '#192E5A'],
    isDark: true,
    stitchColor: 'rgba(247, 242, 232, 0.24)',
    textColor: '#F7F2E8',
  },
];

export const AVATAR_COLLECTIONS: AvatarCollectionMeta[] = [
  {
    id: 'everyday',
    name: 'Hẻm Phố Thường Ngày',
    englishTag: 'Everyday Collection',
    subtitle: 'Trang phục khởi đầu năng động, gọn gàng, phối được mọi phong cách',
    story:
      'Lấy cảm hứng từ nhịp sống thường nhật của sinh viên Sài Gòn: áo thun sọc đỏ chỉ, giày sneaker đen dây trắng, hoodie ấm áp và chiếc túi vải đeo chéo gọn gàng.',
    accentColor: '#1B3B82',
    surfaceTint: '#EEF2FA',
  },
  {
    id: 'saigon',
    name: 'Sắc Màu Sài Gòn',
    englishTag: 'Saigon Collection',
    subtitle: 'Áo Bà Ba, Áo Dài cách tân, Nón lá mini quai chỉ đỏ và ly cà phê sữa đá',
    story:
      'Gói gọn nét duyên mộc mạc của phố thị phương Nam: tà áo mềm bay trong nắng, chiếc nón lá nhỏ nhắn và ly cà phê sữa đá buổi sáng bên đầu hẻm quen.',
    accentColor: '#D46534',
    surfaceTint: '#FDF0E9',
  },
  {
    id: 'craft',
    name: 'Góc Nghề Thủ Công',
    englishTag: 'Craft Collection',
    subtitle: 'Tạp dề vải bố đựng kéo, mũ mái hiên sọc cam–chàm, thước dây & kính thợ',
    story:
      'Tôn vinh những đôi tay cần mẫn sau mái hiên nhỏ. Từng cuộn chỉ đỏ, chiếc cờ-lê mini hay thước dây may vá đều kể câu chuyện bền bỉ hồi sinh món đồ cũ.',
    accentColor: '#4F6B54',
    surfaceTint: '#EEF4EF',
  },
  {
    id: 'seasonal',
    name: 'Mùa Lễ Hội',
    englishTag: 'Seasonal Collection',
    subtitle: 'Áo len đan ấm, khăn choàng sợi chỉ đỏ, nón Beanie cam gạch & BST Tết',
    story:
      'Thay áo mới theo từng khoảnh khắc thời tiết Sài Gòn — từ những ngày gió se lạnh cuối năm cho đến không khí rộn ràng sắc xuân đang đến gần.',
    accentColor: '#B93818',
    surfaceTint: '#FBECE8',
  },
  {
    id: 'limited',
    name: 'Dấu Ấn Cộng Đồng',
    englishTag: 'Limited Collection',
    subtitle: 'Vật phẩm độc quyền không bán bằng GP — mở khóa qua đóng góp cộng đồng thật',
    story:
      'Dành riêng cho những người bạn đồng hành cùng Góc Thợ Quanh Ta: máy ảnh phim ghi lại chuyện nghề, balo vá patch Hồi Sinh Đồ Cũ và áo khoác Người Giữ Góc Nghề.',
    accentColor: '#9A6310',
    surfaceTint: '#FDF5E2',
  },
];

export const AVATAR_ITEMS: AvatarItem[] = [
  // ===================== HAIRSTYLES (6) =====================
  {
    id: 'fluffy_curls',
    name: 'Tóc xoăn bông kiểu đám mây',
    slot: 'hair',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    priceGp: 0,
    story: 'Mái tóc xoăn phồng bồng bềnh xếp lớp mềm mại — tạo nên diện mạo thân thiện chuẩn Chibi 2D.',
    modelConfig: {
      primaryColor: '#F4E5D2',
      secondaryColor: '#CFAF91',
      styleVariant: 'fluffy_curls',
    },
  },
  {
    id: 'neat_bangs',
    name: 'Tóc mái ngố gọn gàng',
    slot: 'hair',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    priceGp: 0,
    story: 'Mái ngang gọn nhẹ tươi tắn, phối đẹp với cả áo thun lẫn nón lưỡi trai mái hiên.',
    modelConfig: {
      primaryColor: '#7A4E37',
      secondaryColor: '#593624',
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
    priceGp: 0,
    story: 'Dáng tóc bob ôm mềm gương mặt bầu bĩnh, tinh gọn và hiện đại.',
    modelConfig: {
      primaryColor: '#252B3B',
      secondaryColor: '#161B28',
      styleVariant: 'soft_bob',
    },
  },
  {
    id: 'fresh_undercut',
    name: 'Tóc undercut trẻ trung',
    slot: 'hair',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'gp',
    priceGp: 25,
    story: 'Phần mái đánh bồng khỏe khoắn, chuẩn năng lượng các bạn trẻ hay chạy khắp quận tìm góc thợ.',
    modelConfig: {
      primaryColor: '#252B3B',
      secondaryColor: '#161B28',
      styleVariant: 'fresh_undercut',
    },
  },
  {
    id: 'twin_buns',
    name: 'Tóc hai búi buộc chỉ đỏ',
    slot: 'hair',
    collection: 'saigon',
    rarity: 'rare',
    unlockType: 'gp',
    priceGp: 40,
    story: 'Hai búi tóc tròn xinh buộc dây đỏ sợi chỉ, điểm nét duyên tinh nghịch cho ngày dạo phố.',
    modelConfig: {
      primaryColor: '#7A4E37',
      secondaryColor: '#593624',
      accentColor: '#B93818',
      styleVariant: 'twin_buns',
    },
  },
  {
    id: 'long_flowing',
    name: 'Tóc dài rẽ ngôi dịu dàng',
    slot: 'hair',
    collection: 'saigon',
    rarity: 'rare',
    unlockType: 'gp',
    priceGp: 45,
    story: 'Mái tóc dài phủ qua vai mềm mại, cực hợp khi diện Áo Dài hoặc Áo Bà Ba cách tân.',
    modelConfig: {
      primaryColor: '#252B3B',
      secondaryColor: '#161B28',
      styleVariant: 'long_flowing',
    },
  },

  // ===================== TOPS =====================
  {
    id: 'striped_red_tee',
    name: 'Áo thun sọc đỏ chỉ – kem',
    slot: 'top',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    priceGp: 0,
    story: 'Chiếc áo phông sọc đứng đỏ chỉ – kem ấm nổi bật, mang tinh thần trẻ trung của Hẻm Phố Thường Ngày.',
    modelConfig: {
      primaryColor: '#C84B45',
      secondaryColor: '#F6E8D3',
      accentColor: '#A93631',
      styleVariant: 'striped_red_tee',
    },
  },
  {
    id: 'basic_tee',
    name: 'Áo thun kem nắng cơ bản',
    slot: 'top',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    priceGp: 0,
    story: 'Áo thun trơn màu vàng kem dịu mắt phối viền cổ xanh chàm, dễ kết hợp mọi phụ kiện.',
    modelConfig: {
      primaryColor: '#F5DF7D',
      secondaryColor: '#1B3B82',
      accentColor: '#D46534',
      styleVariant: 'basic_tee',
    },
  },
  {
    id: 'warm_hoodie',
    name: 'Áo Hoodie xanh chàm dây rút',
    slot: 'top',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'gp',
    priceGp: 30,
    story: 'Hoodie nỉ dày có túi trước và dây rút kem ấm — người bạn quen thuộc của sinh viên Sài Gòn.',
    modelConfig: {
      primaryColor: '#2E4C8C',
      secondaryColor: '#F7F2E8',
      accentColor: '#D46534',
      styleVariant: 'warm_hoodie',
    },
  },
  {
    id: 'ba_ba_modern',
    name: 'Áo Bà Ba cách tân xanh rêu',
    slot: 'top',
    collection: 'saigon',
    rarity: 'rare',
    unlockType: 'gp',
    priceGp: 55,
    story: 'Hàng nút thẳng đều tinh tế cùng hai túi nhỏ hai bên — nét duyên mộc mạc đậm chất Nam Bộ.',
    modelConfig: {
      primaryColor: '#678A6E',
      secondaryColor: '#F7F2E8',
      accentColor: '#4E6E54',
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
    priceGp: 75,
    story: 'Tà áo dài ngắn gọn màu cam san hô điểm nút thắt vàng ấm, rực rỡ trong nắng sáng Sài Gòn.',
    modelConfig: {
      primaryColor: '#DE6E4B',
      secondaryColor: '#F8E7CE',
      accentColor: '#E5B245',
      styleVariant: 'ao_dai_modern',
    },
  },
  {
    id: 'craft_apron',
    name: 'Tạp dề thợ thủ công đựng kéo',
    slot: 'top',
    collection: 'craft',
    rarity: 'epic',
    unlockType: 'gp',
    priceGp: 85,
    story: 'Áo sơ mi kem kết hợp tạp dề vải bố nâu có túi trước đựng sẵn kéo cắt chỉ, thước nhỏ và cuộn chỉ đỏ.',
    modelConfig: {
      primaryColor: '#8B5A3C',
      secondaryColor: '#F7F0E3',
      accentColor: '#B93818',
      styleVariant: 'craft_apron',
    },
  },
  {
    id: 'winter_knit',
    name: 'Áo len đan ấm mùa lễ hội',
    slot: 'top',
    collection: 'seasonal',
    rarity: 'rare',
    unlockType: 'gp',
    priceGp: 60,
    story: 'Áo len họa tiết sọc đan thủ công ấm áp cho những buổi tối gió mát cuối năm.',
    modelConfig: {
      primaryColor: '#C44530',
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
    priceGp: 0,
    questId: 'suggest_artisan',
    story:
      'Áo khoác phiên bản giới hạn phối xanh chàm di sản & tay cam cờ-lê kèm huy hiệu thêu tay — chỉ mở khi bạn đề xuất cô chú thợ mới lên bản đồ.',
    modelConfig: {
      primaryColor: '#1B3B82',
      secondaryColor: '#D46534',
      accentColor: '#F5C451',
      styleVariant: 'guardian_jacket',
    },
  },
  {
    id: 'tet_silk_teaser',
    name: 'Áo gấm Hoa Mai · BST Tết Sài Gòn',
    slot: 'top',
    collection: 'seasonal',
    rarity: 'limited',
    unlockType: 'quest',
    priceGp: 0,
    story: 'Thiết kế lụa gấm đỏ son thêu hoa mai vàng đang được hoàn thiện cho dịp Tết Nguyên Đán sắp tới.',
    modelConfig: {
      primaryColor: '#B93818',
      secondaryColor: '#F5C451',
      accentColor: '#F7F2E8',
      styleVariant: 'ao_dai_modern',
    },
    comingSoon: true,
    comingSoonNote: 'Sắp ra mắt · BST Tết Sài Gòn',
  },

  // ===================== BOTTOMS =====================
  {
    id: 'floral_indigo_shorts',
    name: 'Quần short xanh chàm hoa nắng',
    slot: 'bottom',
    collection: 'saigon',
    rarity: 'common',
    unlockType: 'free',
    priceGp: 0,
    story: 'Quần short xanh chàm in hoa vàng và lá xanh dịu mát — phóng khoáng đúng điệu nắng gió Sài Gòn.',
    modelConfig: {
      primaryColor: '#27466E',
      secondaryColor: '#E8A534',
      accentColor: '#5DA3A1',
      styleVariant: 'floral_indigo_shorts',
    },
  },
  {
    id: 'cuffed_jeans',
    name: 'Quần Jeans xắn gấu cổ điển',
    slot: 'bottom',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    priceGp: 0,
    story: 'Quần denim xanh xắn gấu bền bỉ — món đồ ai cũng từng ghé cô thợ may cắt lai hoặc thay khóa kéo.',
    modelConfig: {
      primaryColor: '#416391',
      secondaryColor: '#7C9CC4',
      accentColor: '#D9A54C',
      styleVariant: 'cuffed_jeans',
    },
  },
  {
    id: 'jogger_cuff',
    name: 'Quần Jogger nỉ kem bo gấu',
    slot: 'bottom',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'gp',
    priceGp: 25,
    story: 'Quần jogger mềm mại dễ vận động, phối cực chuẩn với hoodie và sneaker vải.',
    modelConfig: {
      primaryColor: '#D8CCBA',
      secondaryColor: '#B8A890',
      styleVariant: 'jogger_cuff',
    },
  },
  {
    id: 'pleated_skirt',
    name: 'Chân váy xếp ly học đường',
    slot: 'bottom',
    collection: 'everyday',
    rarity: 'rare',
    unlockType: 'gp',
    priceGp: 35,
    story: 'Chân váy xếp ly gọn gàng gam xanh navy điểm đường viền kem thanh lịch.',
    modelConfig: {
      primaryColor: '#264275',
      secondaryColor: '#F7F2E8',
      accentColor: '#1B315B',
      styleVariant: 'pleated_skirt',
    },
  },
  {
    id: 'wide_traditional',
    name: 'Quần ống rộng Bà Ba lụa kem',
    slot: 'bottom',
    collection: 'saigon',
    rarity: 'rare',
    unlockType: 'gp',
    priceGp: 45,
    story: 'Quần ống suông mềm mại màu kem ngà tôn trọn vẻ thanh thoát của Áo Bà Ba và Áo Dài.',
    modelConfig: {
      primaryColor: '#F3EBDC',
      secondaryColor: '#DCD0BC',
      styleVariant: 'wide_traditional',
    },
  },

  // ===================== SHOES =====================
  {
    id: 'black_canvas_sneakers',
    name: 'Giày Sneaker đen dây trắng',
    slot: 'shoes',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    priceGp: 0,
    story: 'Đôi sneaker vải đen đế trắng có dây buộc và khoen kim loại sắc nét — bền bỉ trên mọi con hẻm.',
    modelConfig: {
      primaryColor: '#22262C',
      secondaryColor: '#FFFFFF',
      accentColor: '#9AA3B0',
      styleVariant: 'black_canvas_sneakers',
    },
  },
  {
    id: 'cream_canvas_shoes',
    name: 'Giày vải kem chỉ đỏ',
    slot: 'shoes',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    priceGp: 0,
    story: 'Giày vải cổ thấp màu kem dịu nhẹ điểm đường viền chỉ đỏ tinh tế.',
    modelConfig: {
      primaryColor: '#EFE6D5',
      secondaryColor: '#FFFFFF',
      accentColor: '#B93818',
      styleVariant: 'cream_canvas_shoes',
    },
  },
  {
    id: 'pastel_slides',
    name: 'Dép pastel Sài Gòn',
    slot: 'shoes',
    collection: 'saigon',
    rarity: 'rare',
    unlockType: 'gp',
    priceGp: 40,
    story: 'Đôi dép quai ngang xanh bạc hà mát mẻ — đúng tinh thần phóng khoáng dạo đầu hẻm uống cà phê.',
    modelConfig: {
      primaryColor: '#77B8AD',
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
    priceGp: 65,
    story: 'Đôi bốt da nâu khâu đế chắc chắn — tôn vinh bàn tay khéo léo của các chú thợ sửa giày lâu năm.',
    modelConfig: {
      primaryColor: '#7A472B',
      secondaryColor: '#3A261C',
      accentColor: '#D9A54C',
      styleVariant: 'craft_boots',
    },
  },

  // ===================== HEADWEAR & EYEWEAR (Slot: headwear) =====================
  {
    id: 'head_awning_cap',
    name: 'Mũ lưỡi trai mái hiên sọc cam – chàm',
    slot: 'headwear',
    collection: 'craft',
    rarity: 'epic',
    unlockType: 'gp',
    priceGp: 55,
    story: 'Lấy cảm hứng từ tấm bạt mái hiên sọc cam – xanh chàm quen thuộc của tiệm sửa xe đầu hẻm Sài Gòn.',
    modelConfig: {
      primaryColor: '#1B3B82',
      secondaryColor: '#D46534',
      accentColor: '#F7F2E8',
      styleVariant: 'awning_cap',
      layer: 'headwear',
    },
  },
  {
    id: 'head_beanie',
    name: 'Nón len Beanie cam gạch',
    slot: 'headwear',
    collection: 'seasonal',
    rarity: 'common',
    unlockType: 'free',
    priceGp: 0,
    story: 'Chiếc nón len gân mềm màu cam gạch ấm áp đội gọn trên đỉnh tóc.',
    modelConfig: {
      primaryColor: '#D46534',
      secondaryColor: '#B54E22',
      accentColor: '#F7F2E8',
      styleVariant: 'beanie',
      layer: 'headwear',
    },
  },
  {
    id: 'head_non_la',
    name: 'Nón lá mini quai chỉ đỏ',
    slot: 'headwear',
    collection: 'saigon',
    rarity: 'epic',
    unlockType: 'gp',
    priceGp: 60,
    story: 'Chiếc nón lá chóp thanh thoát với quai lụa đỏ thắm — dấu ấn Việt mềm mại giữa bộ Chibi 2D.',
    modelConfig: {
      primaryColor: '#ECD8A9',
      secondaryColor: '#CBAF74',
      accentColor: '#B93818',
      styleVariant: 'non_la',
      layer: 'headwear',
    },
  },
  {
    id: 'eye_round_glasses',
    name: 'Kính gọng tròn thợ đồng hồ',
    slot: 'headwear',
    collection: 'craft',
    rarity: 'rare',
    unlockType: 'gp',
    priceGp: 50,
    story: 'Gọng kính tròn ánh đồng thanh mảnh gắn liền với hình ảnh tỉ mỉ của các chú thợ sửa đồng hồ.',
    modelConfig: {
      primaryColor: '#C58F32',
      secondaryColor: '#E2F2FB',
      styleVariant: 'round_glasses',
      layer: 'eyewear',
    },
  },

  // ===================== ACCESSORIES (Back & Front multi-layer) =====================
  {
    id: 'acc_crossbody_mini',
    name: 'Túi đeo chéo vải mộc',
    slot: 'accessory',
    collection: 'everyday',
    rarity: 'common',
    unlockType: 'free',
    priceGp: 0,
    story: 'Chiếc túi đeo chéo nhỏ gọn đựng ví, chìa khóa và sổ tay mỗi khi dạo quanh khu phố.',
    modelConfig: {
      primaryColor: '#EBDCC6',
      secondaryColor: '#1B3B82',
      accentColor: '#B93818',
      styleVariant: 'crossbody_mini',
      layer: 'chest_front',
    },
  },
  {
    id: 'acc_coffee_cup',
    name: 'Ly cà phê sữa đá Sài Gòn',
    slot: 'accessory',
    collection: 'saigon',
    rarity: 'rare',
    unlockType: 'gp',
    priceGp: 45,
    story: 'Ly cà phê sữa đá có ống hút đỏ — năng lượng quen thuộc buổi sáng trước khi đi sửa đồ.',
    modelConfig: {
      primaryColor: '#B6784B',
      secondaryColor: '#F8F2E7',
      accentColor: '#B93818',
      styleVariant: 'coffee_cup',
      layer: 'hand_charm',
    },
  },
  {
    id: 'acc_tape_measure',
    name: 'Thước dây may vá quàng cổ',
    slot: 'accessory',
    collection: 'craft',
    rarity: 'rare',
    unlockType: 'gp',
    priceGp: 55,
    story: 'Dải thước dây vàng chia vạch tỉ mỉ vắt ngang cổ — biểu tượng thân quen của các cô thợ may vá.',
    modelConfig: {
      primaryColor: '#F3C74D',
      secondaryColor: '#25292E',
      accentColor: '#B93818',
      styleVariant: 'tape_measure',
      layer: 'neck_front',
    },
  },
  {
    id: 'acc_thread_wrench_charm',
    name: 'Charm cuộn chỉ đỏ & cờ-lê mini',
    slot: 'accessory',
    collection: 'craft',
    rarity: 'epic',
    unlockType: 'gp',
    priceGp: 70,
    story: 'Phụ kiện mang biểu tượng chính thức của Góc Thợ Quanh Ta: cuộn chỉ đỏ gắn kết cùng chiếc cờ-lê cam.',
    modelConfig: {
      primaryColor: '#D46534',
      secondaryColor: '#B93818',
      accentColor: '#1B3B82',
      styleVariant: 'thread_wrench_charm',
      layer: 'hand_charm',
    },
  },
  {
    id: 'acc_craft_toolpack',
    name: 'Túi đồ nghề đeo lưng',
    slot: 'accessory',
    collection: 'craft',
    rarity: 'epic',
    unlockType: 'gp',
    priceGp: 90,
    story: 'Chiếc túi đồ nghề vải dày đeo sau lưng nhô nhẹ tay cầm búa nhỏ và thước gỗ thủ công.',
    modelConfig: {
      primaryColor: '#6E503B',
      secondaryColor: '#D46534',
      accentColor: '#C5CFD9',
      styleVariant: 'craft_toolpack',
      layer: 'back_bag',
    },
  },
  {
    id: 'acc_red_scarf',
    name: 'Khăn choàng sợi chỉ đỏ',
    slot: 'accessory',
    collection: 'seasonal',
    rarity: 'rare',
    unlockType: 'gp',
    priceGp: 45,
    story: 'Chiếc khăn len mềm màu đỏ chỉ dệt tay ấm áp cho mùa gió se lạnh.',
    modelConfig: {
      primaryColor: '#B93818',
      secondaryColor: '#F7F2E8',
      styleVariant: 'red_scarf',
      layer: 'neck_front',
    },
  },
  {
    id: 'acc_film_camera',
    name: 'Máy ảnh phim chụp chuyện nghề',
    slot: 'accessory',
    collection: 'limited',
    rarity: 'limited',
    unlockType: 'quest',
    priceGp: 0,
    questId: 'explore_3_artisans',
    story:
      'Chiếc máy ảnh phim cổ điển tím xanh đeo dây chéo trước ngực — phần thưởng khi bạn khám phá 3 hồ sơ cô chú thợ trên bản đồ.',
    modelConfig: {
      primaryColor: '#6966B3',
      secondaryColor: '#423E85',
      accentColor: '#F4B83A',
      styleVariant: 'film_camera',
      layer: 'chest_front',
    },
  },
  {
    id: 'acc_revive_backpack',
    name: 'Balo vải vá patch "Hồi Sinh Đồ Cũ"',
    slot: 'accessory',
    collection: 'limited',
    rarity: 'limited',
    unlockType: 'quest',
    priceGp: 0,
    questId: 'revive_item',
    story:
      'Balo vải canvas xanh lá đính những miếng vá sắc vàng năng lượng — phần thưởng khi bạn xác nhận đã hồi sinh 1 món đồ cũ.',
    modelConfig: {
      primaryColor: '#5CA45D',
      secondaryColor: '#F1B945',
      accentColor: '#3E7A40',
      styleVariant: 'revive_backpack',
      layer: 'back_bag',
    },
  },
];

export const AVATAR_QUESTS: AvatarQuestDefinition[] = [
  {
    id: 'first_avatar_save',
    title: 'Lưu Avatar đầu tiên của bạn',
    description: 'Tùy chỉnh phong cách riêng cho Mascot 2D và bấm lưu hồ sơ nhân vật lần đầu.',
    target: 1,
    gpReward: 30,
    actionLabel: 'Tùy chỉnh ngay',
    actionRoute: 'avatar_creator',
    categoryLabel: 'Khởi đầu',
  },
  {
    id: 'revive_item',
    title: 'Bấm "Tôi đã sửa xong" để hồi sinh đồ cũ',
    description: 'Xác nhận sửa đồ thành công tại trang hồ sơ cô chú thợ để nhận GP & mở khóa Balo Hồi Sinh Đồ Cũ.',
    target: 1,
    gpReward: 50,
    unlockItemId: 'acc_revive_backpack',
    actionLabel: 'Tìm thợ gần nhà',
    actionRoute: 'explore',
    categoryLabel: 'Sống xanh',
  },
  {
    id: 'send_praise',
    title: 'Gửi 1 lời khen cho cô chú thợ',
    description: 'Viết lời khen hoặc gửi lời cảm ơn ấm áp tới cô chú thợ bạn từng ghé sửa đồ.',
    target: 1,
    gpReward: 20,
    actionLabel: 'Đến bản đồ thợ',
    actionRoute: 'explore',
    categoryLabel: 'Cộng đồng',
  },
  {
    id: 'save_favorite',
    title: 'Lưu 1 góc thợ quen yêu thích',
    description: 'Đánh dấu lưu một cô chú thợ vào sổ tay cá nhân để tiện tìm lại khi cần.',
    target: 1,
    gpReward: 15,
    actionLabel: 'Khám phá trang chủ',
    actionRoute: 'home',
    categoryLabel: 'Sổ tay',
  },
  {
    id: 'explore_3_artisans',
    title: 'Xem 3 hồ sơ thợ khác nhau',
    description: 'Mở đọc câu chuyện nghề của 3 cô chú thợ khác nhau để nhận GP & mở khóa Máy ảnh phim chuyện nghề.',
    target: 3,
    gpReward: 25,
    unlockItemId: 'acc_film_camera',
    actionLabel: 'Đi khám phá ngay',
    actionRoute: 'explore',
    categoryLabel: 'Khám phá',
  },
  {
    id: 'suggest_artisan',
    title: 'Đề xuất 1 góc thợ mới lên bản đồ',
    description: 'Giới thiệu thêm cô chú thợ uy tín ở khu phố bạn để nhận +120 GP & mở khóa Áo khoác Người Giữ Góc Nghề.',
    target: 1,
    gpReward: 120,
    unlockItemId: 'guardian_jacket',
    actionLabel: 'Đề xuất góc thợ',
    actionRoute: 'suggest',
    categoryLabel: 'Đặc biệt',
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
    description: 'Bạn chọn sửa chữa để nối dài vòng đời món đồ thay vì vội vàng vứt bỏ.',
    badgeCode: 'ECO',
    accentHex: '#4F6B54',
    requirementText: 'Hoàn thành nhiệm vụ "Tôi đã sửa xong"',
  },
  {
    id: 'title_alley_friend',
    title: 'Người Bạn Góc Hẻm',
    description: 'Luôn lan tỏa sự trân trọng bằng lời khen và lưu giữ các góc thợ thân quen.',
    badgeCode: 'ALLY',
    accentHex: '#D46534',
    requirementText: 'Hoàn thành nhiệm vụ Gửi lời khen hoặc Lưu 1 góc thợ quen',
  },
  {
    id: 'title_story_reporter',
    title: 'Phóng Viên Chuyện Nghề',
    description: 'Người ghi chép lặng lẽ những câu chuyện đẹp đẽ sau từng mái hiên Sài Gòn.',
    badgeCode: 'FILM',
    accentHex: '#5F5BA8',
    requirementText: 'Hoàn thành nhiệm vụ Xem 3 hồ sơ thợ khác nhau',
  },
  {
    id: 'title_craft_keeper',
    title: 'Người Giữ Góc Nghề',
    description: 'Danh hiệu danh dự dành cho bạn trẻ trực tiếp đóng góp thêm góc thợ mới lên bản đồ.',
    badgeCode: 'GOLD',
    accentHex: '#9A6310',
    requirementText: 'Hoàn thành nhiệm vụ Đề xuất 1 góc thợ mới',
  },
];

export const FREE_STARTER_ITEM_IDS: string[] = AVATAR_ITEMS.filter(
  (item) => item.unlockType === 'free' && !item.comingSoon
).map((item) => item.id);

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinId: 'skin_warm_cream',
  faceId: 'sparkle_round',
  hairId: 'fluffy_curls',
  hairColorId: 'hair_cream_cloud',
  topId: 'striped_red_tee',
  bottomId: 'floral_indigo_shorts',
  shoesId: 'black_canvas_sneakers',
  accessoryIds: [],
  studioBgId: 'bg_warm_ivory',
};

export const DEFAULT_QUEST_PROGRESS: AvatarQuestProgressState = {
  first_avatar_save: 0,
  revive_item: 0,
  send_praise: 0,
  save_favorite: 0,
  explore_3_artisans: 0,
  suggest_artisan: 0,
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
  color: string;
} {
  switch (rarity) {
    case 'limited':
      return { label: 'Giới hạn', color: '#9A6310' };
    case 'epic':
      return { label: 'Đặc sắc', color: '#B93818' };
    case 'rare':
      return { label: 'Hiếm', color: '#1B3B82' };
    case 'common':
    default:
      return { label: 'Cơ bản', color: '#615D57' };
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
