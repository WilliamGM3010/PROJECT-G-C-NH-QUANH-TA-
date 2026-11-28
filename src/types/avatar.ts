export type AvatarSlot =
  | 'skin'
  | 'face'
  | 'hair'
  | 'top'
  | 'bottom'
  | 'shoes'
  | 'headwear'
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
  | 'playful_wink'
  | 'cool_confident'
  | 'cute_surprised';

export type HairStyleId =
  | 'fluffy_curls'
  | 'neat_bangs'
  | 'soft_bob'
  | 'twin_buns'
  | 'fresh_undercut'
  | 'long_flowing';

export type AccessoryLayer =
  | 'headwear'
  | 'eyewear'
  | 'back_bag'
  | 'neck_front'
  | 'chest_front'
  | 'hand_charm';

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
  priceGp: number;
  questId?: AvatarQuestId;
  story: string;
  /** Hybrid asset: nếu team thiết kế gắn file PNG/SVG tách lớp thì render <image> trực tiếp */
  assetUrl?: string;
  modelConfig: AvatarItemModelConfig;
  comingSoon?: boolean;
  comingSoonNote?: string;
}

export interface SkinToneOption {
  id: string;
  name: string;
  hex: string;
  shadowHex: string;
  blushHex: string;
}

export interface HairColorOption {
  id: string;
  name: string;
  hex: string;
  shadowHex: string;
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
  subtitle: string;
  cssBackground: string;
  canvasStops: [string, string];
  isDark?: boolean;
  stitchColor: string;
  textColor: string;
}

export interface AvatarCollectionMeta {
  id: AvatarCollectionId;
  name: string;
  englishTag: string;
  subtitle: string;
  story: string;
  accentColor: string;
  surfaceTint: string;
}

export type AvatarQuestId =
  | 'first_avatar_save'
  | 'revive_item'
  | 'send_praise'
  | 'save_favorite'
  | 'explore_3_artisans'
  | 'suggest_artisan';

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
  /** Các phụ kiện tách lớp: nón, kính, balo lưng, máy ảnh, thước dây, cà phê, khăn, charm... */
  accessoryIds: string[];
  studioBgId: string;
}

export interface AvatarQuestProgressState {
  first_avatar_save: number;
  revive_item: number;
  send_praise: number;
  save_favorite: number;
  explore_3_artisans: number;
  suggest_artisan: number;
  viewedArtisanIds: string[];
}

export interface AvatarProfile {
  userKey: string;
  displayName: string;
  avatarConfig: AvatarConfig;
  ownedItemIds: string[];
  gpBalance: number;
  questProgress: AvatarQuestProgressState;
  claimedQuestIds: AvatarQuestId[];
  unlockedAchievementIds: string[];
  equippedTitleId: string;
  snapshotDataUrl: string | null;
  updatedAt: string;
}
