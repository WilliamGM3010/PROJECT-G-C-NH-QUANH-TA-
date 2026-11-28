export type AvatarSlot =
  | 'skin'
  | 'face'
  | 'hair'
  | 'top'
  | 'bottom'
  | 'shoes'
  | 'accessory';

export type AvatarCollectionId =
  | 'everyday'
  | 'saigon'
  | 'craft'
  | 'seasonal'
  | 'limited';

export type AvatarRarity = 'common' | 'rare' | 'epic' | 'limited';

export type AvatarUnlockType = 'free' | 'gp' | 'quest';

export type AvatarSubTab =
  | 'home'
  | 'creator'
  | 'wardrobe'
  | 'collections'
  | 'quests'
  | 'achievements';

export type FaceExpressionId =
  | 'sparkle_round'
  | 'happy_squint'
  | 'cool_confident'
  | 'playful_wink'
  | 'cute_surprised';

export type HairStyleId =
  | 'fluffy_curls'
  | 'neat_bangs'
  | 'soft_bob'
  | 'twin_buns'
  | 'fresh_undercut'
  | 'long_flowing';

export type TopStyleId =
  | 'basic_tee'
  | 'warm_hoodie'
  | 'bomber_jacket'
  | 'cropped_jacket'
  | 'ba_ba_modern'
  | 'ao_dai_modern'
  | 'craft_apron'
  | 'guardian_jacket'
  | 'winter_knit'
  | 'tet_silk_teaser';

export type BottomStyleId =
  | 'jogger_cuff'
  | 'active_shorts'
  | 'straight_jeans'
  | 'pleated_skirt'
  | 'wide_traditional';

export type ShoesStyleId =
  | 'chunky_sneakers'
  | 'canvas_low'
  | 'pastel_slides'
  | 'craft_boots';

export type AccessoryId =
  | 'acc_beanie'
  | 'acc_cap'
  | 'acc_non_la'
  | 'acc_round_glasses'
  | 'acc_headphones'
  | 'acc_saigon_tote'
  | 'acc_craft_pouch'
  | 'acc_red_scarf';

export type AccessoryLayer =
  | 'headwear'
  | 'eyewear'
  | 'audio'
  | 'bag'
  | 'waist'
  | 'neck';

export interface AvatarItemModelConfig {
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  styleVariant: string;
  layer?: AccessoryLayer;
}

export interface AvatarItem {
  id: string;
  name: string;
  slot: AvatarSlot;
  collection: AvatarCollectionId;
  rarity: AvatarRarity;
  unlockType: AvatarUnlockType;
  gpCost?: number;
  questId?: string;
  story: string;
  /** Sẵn sàng mở rộng gắn file .glb thật trong tương lai */
  glbUrl?: string;
  modelConfig: AvatarItemModelConfig;
  comingSoon?: boolean;
  comingSoonNote?: string;
}

export interface SkinToneOption {
  id: string;
  name: string;
  hex: string;
  blushHex: string;
  shadowHex: string;
}

export interface HairColorOption {
  id: string;
  name: string;
  hex: string;
  highlightHex: string;
}

export interface FaceExpressionOption {
  id: FaceExpressionId;
  name: string;
  previewBadge: string;
  description: string;
}

export interface StudioBackgroundOption {
  id: string;
  name: string;
  cssGradient: string;
  canvasStops: [string, string, string];
  floorTint: string;
  textColor: string;
}

export interface AvatarCollectionMeta {
  id: AvatarCollectionId;
  name: string;
  vietnameseTag: string;
  subtitle: string;
  story: string;
  accentColor: string;
  surfaceTint: string;
  badgeText: string;
}

export type AvatarQuestId =
  | 'explore_3_artisans'
  | 'revive_item'
  | 'send_praise'
  | 'save_favorite'
  | 'suggest_artisan'
  | 'first_avatar_save';

export interface AvatarQuestDefinition {
  id: AvatarQuestId;
  title: string;
  description: string;
  target: number;
  gpReward: number;
  unlockItemId?: string;
  actionLabel: string;
  actionRoute: 'explore' | 'home' | 'suggest' | 'avatar_creator';
  categoryLabel: string;
}

export interface AvatarAchievementDefinition {
  id: string;
  title: string;
  description: string;
  badgeCode: string;
  accentHex: string;
  requirementText: string;
}

export interface AvatarConfig {
  skinId: string;
  faceId: FaceExpressionId;
  hairId: HairStyleId;
  hairColorId: string;
  topId: string;
  bottomId: string;
  shoesId: string;
  accessoryIds: string[];
  studioBgId: string;
}

export interface AvatarQuestProgressState {
  explore_3_artisans: number;
  revive_item: number;
  send_praise: number;
  save_favorite: number;
  suggest_artisan: number;
  first_avatar_save: number;
  viewedArtisanIds: string[];
}

export interface AvatarProfile {
  userKey: string;
  avatarConfig: AvatarConfig;
  ownedItemIds: string[];
  gpBalance: number;
  questProgress: AvatarQuestProgressState;
  claimedQuestIds: AvatarQuestId[];
  equippedTitleId: string;
  snapshotDataUrl: string | null;
  updatedAt: string;
}
