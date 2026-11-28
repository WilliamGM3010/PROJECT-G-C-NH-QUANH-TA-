import {
  AVATAR_ACHIEVEMENTS,
  AVATAR_ITEMS,
  AVATAR_QUESTS,
  DEFAULT_AVATAR_CONFIG,
  DEFAULT_QUEST_PROGRESS,
  FREE_STARTER_ITEM_IDS,
  getAvatarItemById,
  HAIR_COLORS,
  SKIN_TONES,
  STUDIO_BACKGROUNDS,
} from '../data/avatarCatalog';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import type {
  AvatarConfig,
  AvatarProfile,
  AvatarQuestId,
  AvatarQuestProgressState,
} from '../types/avatar';

const GUEST_STORAGE_KEY = 'gtqt_avatar_profile_2d_guest_v2';
const USER_STORAGE_PREFIX = 'gtqt_avatar_profile_2d_user_v2_';

function getLocalKeyForUser(userKey: string): string {
  if (!userKey || userKey === 'guest') return GUEST_STORAGE_KEY;
  return `${USER_STORAGE_PREFIX}${encodeURIComponent(userKey)}`;
}

export function createDefaultAvatarProfile(
  userKey = 'guest',
  displayName = 'Bạn trẻ Sài Gòn'
): AvatarProfile {
  return {
    userKey,
    displayName,
    avatarConfig: { ...DEFAULT_AVATAR_CONFIG, accessoryIds: [] },
    ownedItemIds: [...FREE_STARTER_ITEM_IDS],
    gpBalance: 50,
    questProgress: {
      ...DEFAULT_QUEST_PROGRESS,
      viewedArtisanIds: [],
    },
    claimedQuestIds: [],
    unlockedAchievementIds: ['title_rookie'],
    equippedTitleId: 'title_rookie',
    snapshotDataUrl: null,
    updatedAt: new Date().toISOString(),
  };
}

function validItemOrDefault(
  candidate: unknown,
  slot: string,
  fallbackId: string
): string {
  if (typeof candidate !== 'string') return fallbackId;
  const found = getAvatarItemById(candidate);
  if (found && found.slot === slot && !found.comingSoon) return found.id;
  return fallbackId;
}

function sanitizeConfig(
  raw: Partial<AvatarConfig> | null | undefined
): AvatarConfig {
  const base = { ...DEFAULT_AVATAR_CONFIG };
  if (!raw || typeof raw !== 'object') return base;

  const skinId = SKIN_TONES.some((s) => s.id === raw.skinId)
    ? (raw.skinId as string)
    : base.skinId;
  const hairColorId = HAIR_COLORS.some((c) => c.id === raw.hairColorId)
    ? (raw.hairColorId as string)
    : base.hairColorId;
  const studioBgId = STUDIO_BACKGROUNDS.some((b) => b.id === raw.studioBgId)
    ? (raw.studioBgId as string)
    : base.studioBgId;

  const validAccessoryIds = Array.isArray(raw.accessoryIds)
    ? raw.accessoryIds.filter((id): id is string => {
        if (typeof id !== 'string') return false;
        const item = getAvatarItemById(id);
        return Boolean(
          item &&
            (item.slot === 'headwear' || item.slot === 'accessory') &&
            !item.comingSoon
        );
      })
    : [];

  return {
    skinId,
    faceId: (raw.faceId ?? base.faceId) as AvatarConfig['faceId'],
    hairId: validItemOrDefault(
      raw.hairId,
      'hair',
      base.hairId
    ) as AvatarConfig['hairId'],
    hairColorId,
    topId: validItemOrDefault(raw.topId, 'top', base.topId),
    bottomId: validItemOrDefault(raw.bottomId, 'bottom', base.bottomId),
    shoesId: validItemOrDefault(raw.shoesId, 'shoes', base.shoesId),
    accessoryIds: Array.from(new Set(validAccessoryIds)),
    studioBgId,
  };
}

function sanitizeQuestProgress(
  raw: Partial<AvatarQuestProgressState> | null | undefined
): AvatarQuestProgressState {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_QUEST_PROGRESS, viewedArtisanIds: [] };
  }
  return {
    first_avatar_save: Number(raw.first_avatar_save) || 0,
    revive_item: Number(raw.revive_item) || 0,
    send_praise: Number(raw.send_praise) || 0,
    save_favorite: Number(raw.save_favorite) || 0,
    explore_3_artisans: Number(raw.explore_3_artisans) || 0,
    suggest_artisan: Number(raw.suggest_artisan) || 0,
    viewedArtisanIds: Array.isArray(raw.viewedArtisanIds)
      ? raw.viewedArtisanIds.filter((v): v is string => typeof v === 'string')
      : [],
  };
}

interface RawAvatarProfileInput
  extends Omit<Partial<AvatarProfile>, 'avatarConfig' | 'questProgress'> {
  avatarConfig?: Partial<AvatarConfig> | null;
  questProgress?: Partial<AvatarQuestProgressState> | null;
}

function sanitizeProfile(
  raw: RawAvatarProfileInput | null | undefined,
  userKey: string,
  fallbackDisplayName = 'Bạn trẻ Sài Gòn'
): AvatarProfile {
  const fallback = createDefaultAvatarProfile(userKey, fallbackDisplayName);
  if (!raw || typeof raw !== 'object') return fallback;

  const validItemIds = new Set(
    AVATAR_ITEMS.filter((i) => !i.comingSoon).map((i) => i.id)
  );
  const ownedSet = new Set<string>([
    ...FREE_STARTER_ITEM_IDS,
    ...(Array.isArray(raw.ownedItemIds)
      ? raw.ownedItemIds.filter(
          (id): id is string => typeof id === 'string' && validItemIds.has(id)
        )
      : []),
  ]);

  const claimed = Array.isArray(raw.claimedQuestIds)
    ? raw.claimedQuestIds.filter(
        (id): id is AvatarQuestId =>
          typeof id === 'string' && AVATAR_QUESTS.some((q) => q.id === id)
      )
    : [];

  const nextProfile: AvatarProfile = {
    userKey,
    displayName:
      typeof raw.displayName === 'string' && raw.displayName.trim()
        ? raw.displayName.trim()
        : fallbackDisplayName,
    avatarConfig: sanitizeConfig(raw.avatarConfig),
    ownedItemIds: Array.from(ownedSet),
    gpBalance:
      typeof raw.gpBalance === 'number' && Number.isFinite(raw.gpBalance)
        ? Math.max(0, Math.floor(raw.gpBalance))
        : fallback.gpBalance,
    questProgress: sanitizeQuestProgress(raw.questProgress),
    claimedQuestIds: Array.from(new Set(claimed)),
    unlockedAchievementIds: Array.isArray(raw.unlockedAchievementIds)
      ? raw.unlockedAchievementIds.filter(
          (id): id is string => typeof id === 'string'
        )
      : ['title_rookie'],
    equippedTitleId:
      typeof raw.equippedTitleId === 'string' &&
      AVATAR_ACHIEVEMENTS.some((a) => a.id === raw.equippedTitleId)
        ? raw.equippedTitleId
        : fallback.equippedTitleId,
    snapshotDataUrl:
      typeof raw.snapshotDataUrl === 'string' &&
      raw.snapshotDataUrl.startsWith('data:image/')
        ? raw.snapshotDataUrl
        : null,
    updatedAt:
      typeof raw.updatedAt === 'string' ? raw.updatedAt : fallback.updatedAt,
  };

  nextProfile.unlockedAchievementIds = getUnlockedAchievementIds(nextProfile);
  return nextProfile;
}

export function loadLocalAvatarProfile(
  userKey = 'guest',
  displayName = 'Bạn trẻ Sài Gòn'
): AvatarProfile | null {
  try {
    const raw = window.localStorage.getItem(getLocalKeyForUser(userKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RawAvatarProfileInput;
    return sanitizeProfile(parsed, userKey, displayName);
  } catch {
    return null;
  }
}

export function saveLocalAvatarProfile(profile: AvatarProfile): void {
  try {
    window.localStorage.setItem(
      getLocalKeyForUser(profile.userKey),
      JSON.stringify(profile)
    );
  } catch {
    try {
      window.localStorage.setItem(
        getLocalKeyForUser(profile.userKey),
        JSON.stringify({ ...profile, snapshotDataUrl: null })
      );
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }
}

/**
 * Đọc hồ sơ từ bảng Supabase `user_avatar_profiles` (hỗ trợ đúng 10 cột chuẩn),
 * tự động fallback mượt mà sang localStorage nếu là khách hoặc bảng chưa tạo.
 */
export async function loadAvatarProfile(
  userKey: string | null,
  displayName = 'Bạn trẻ Sài Gòn'
): Promise<{ profile: AvatarProfile; syncedFromDb: boolean }> {
  const effectiveKey = userKey?.trim() || 'guest';
  const localGuest = loadLocalAvatarProfile('guest', displayName);
  const localUser =
    effectiveKey !== 'guest'
      ? loadLocalAvatarProfile(effectiveKey, displayName)
      : null;

  if (effectiveKey === 'guest') {
    return {
      profile: localGuest ?? createDefaultAvatarProfile('guest', displayName),
      syncedFromDb: false,
    };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_avatar_profiles')
        .select('*')
        .eq('user_key', effectiveKey)
        .maybeSingle();

      if (!error && data) {
        const record = data as Record<string, unknown>;
        const dbProfile = sanitizeProfile(
          {
            userKey: effectiveKey,
            displayName:
              (record.display_name as string | undefined) ?? displayName,
            avatarConfig: record.avatar_config as Partial<AvatarConfig>,
            ownedItemIds:
              (record.owned_items as string[] | undefined) ??
              (record.owned_item_ids as string[] | undefined),
            gpBalance: Number(record.gp_balance ?? 0),
            questProgress:
              record.quest_progress as Partial<AvatarQuestProgressState>,
            claimedQuestIds:
              (record.claimed_quests as AvatarQuestId[] | undefined) ??
              (record.claimed_quest_ids as AvatarQuestId[] | undefined),
            unlockedAchievementIds: record.unlocked_achievements as
              | string[]
              | undefined,
            equippedTitleId:
              (record.active_title as string | undefined) ??
              (record.equipped_title_id as string | undefined) ??
              'title_rookie',
            snapshotDataUrl:
              (record.snapshot_data_url as string | null | undefined) ?? null,
            updatedAt:
              (record.updated_at as string | undefined) ??
              new Date().toISOString(),
          },
          effectiveKey,
          displayName
        );
        saveLocalAvatarProfile(dbProfile);
        return { profile: dbProfile, syncedFromDb: true };
      }
    } catch {
      // Fallback safely to localStorage
    }
  }

  if (localUser) {
    return { profile: localUser, syncedFromDb: false };
  }

  if (localGuest) {
    const migrated: AvatarProfile = {
      ...localGuest,
      userKey: effectiveKey,
      displayName,
      updatedAt: new Date().toISOString(),
    };
    saveLocalAvatarProfile(migrated);
    return { profile: migrated, syncedFromDb: false };
  }

  return {
    profile: createDefaultAvatarProfile(effectiveKey, displayName),
    syncedFromDb: false,
  };
}

/**
 * Lưu hồ sơ về localStorage + upsert lên bảng Supabase `user_avatar_profiles` với đúng schema cột.
 */
export async function saveAvatarProfile(
  profile: AvatarProfile
): Promise<{ savedToDb: boolean }> {
  const unlockedIds = getUnlockedAchievementIds(profile);
  const stamped: AvatarProfile = {
    ...profile,
    unlockedAchievementIds: unlockedIds,
    updatedAt: new Date().toISOString(),
  };

  saveLocalAvatarProfile(stamped);

  if (stamped.userKey === 'guest' || !isSupabaseConfigured || !supabase) {
    return { savedToDb: false };
  }

  try {
    const { error } = await supabase.from('user_avatar_profiles').upsert(
      {
        user_key: stamped.userKey,
        display_name: stamped.displayName,
        gp_balance: stamped.gpBalance,
        active_title: stamped.equippedTitleId,
        avatar_config: stamped.avatarConfig,
        owned_items: stamped.ownedItemIds,
        quest_progress: stamped.questProgress,
        claimed_quests: stamped.claimedQuestIds,
        unlocked_achievements: stamped.unlockedAchievementIds,
        snapshot_data_url: stamped.snapshotDataUrl,
        updated_at: stamped.updatedAt,
      },
      { onConflict: 'user_key' }
    );
    if (error) {
      return { savedToDb: false };
    }
    return { savedToDb: true };
  } catch {
    return { savedToDb: false };
  }
}

export function getQuestCurrentValue(
  profile: AvatarProfile,
  questId: AvatarQuestId
): number {
  if (questId === 'explore_3_artisans') {
    return Math.max(
      profile.questProgress.explore_3_artisans,
      profile.questProgress.viewedArtisanIds.length
    );
  }
  return profile.questProgress[questId] ?? 0;
}

export function isQuestCompleted(
  profile: AvatarProfile,
  questId: AvatarQuestId
): boolean {
  const quest = AVATAR_QUESTS.find((q) => q.id === questId);
  if (!quest) return false;
  return getQuestCurrentValue(profile, questId) >= quest.target;
}

export function isQuestClaimed(
  profile: AvatarProfile,
  questId: AvatarQuestId
): boolean {
  return profile.claimedQuestIds.includes(questId);
}

export function countClaimableQuests(profile: AvatarProfile): number {
  return AVATAR_QUESTS.filter(
    (q) => isQuestCompleted(profile, q.id) && !isQuestClaimed(profile, q.id)
  ).length;
}

export function incrementQuestProgressInProfile(
  profile: AvatarProfile,
  questId: AvatarQuestId,
  options?: { artisanId?: string }
): { nextProfile: AvatarProfile; justCompletedQuest: boolean } {
  const wasCompleted = isQuestCompleted(profile, questId);
  const prevProgress = profile.questProgress;
  let nextProgress: AvatarQuestProgressState = { ...prevProgress };

  if (questId === 'explore_3_artisans') {
    const existingIds = prevProgress.viewedArtisanIds ?? [];
    if (options?.artisanId) {
      if (existingIds.includes(options.artisanId)) {
        return { nextProfile: profile, justCompletedQuest: false };
      }
      const nextViewed = [...existingIds, options.artisanId].slice(-50);
      nextProgress = {
        ...prevProgress,
        viewedArtisanIds: nextViewed,
        explore_3_artisans: Math.max(
          prevProgress.explore_3_artisans,
          nextViewed.length
        ),
      };
    } else {
      nextProgress = {
        ...prevProgress,
        explore_3_artisans: prevProgress.explore_3_artisans + 1,
      };
    }
  } else {
    nextProgress = {
      ...prevProgress,
      [questId]: (prevProgress[questId] ?? 0) + 1,
    };
  }

  const nextProfile: AvatarProfile = {
    ...profile,
    questProgress: nextProgress,
    updatedAt: new Date().toISOString(),
  };
  nextProfile.unlockedAchievementIds = getUnlockedAchievementIds(nextProfile);

  const isNowCompleted = isQuestCompleted(nextProfile, questId);
  return {
    nextProfile,
    justCompletedQuest: !wasCompleted && isNowCompleted,
  };
}

export function claimQuestRewardInProfile(
  profile: AvatarProfile,
  questId: AvatarQuestId
): {
  ok: boolean;
  nextProfile: AvatarProfile;
  gpAwarded: number;
  unlockedItemName?: string;
} {
  const quest = AVATAR_QUESTS.find((q) => q.id === questId);
  if (!quest) {
    return { ok: false, nextProfile: profile, gpAwarded: 0 };
  }
  if (!isQuestCompleted(profile, questId) || isQuestClaimed(profile, questId)) {
    return { ok: false, nextProfile: profile, gpAwarded: 0 };
  }

  const nextOwned = new Set(profile.ownedItemIds);
  let unlockedItemName: string | undefined;
  if (quest.unlockItemId) {
    nextOwned.add(quest.unlockItemId);
    unlockedItemName = getAvatarItemById(quest.unlockItemId)?.name;
  }

  const nextProfile: AvatarProfile = {
    ...profile,
    gpBalance: profile.gpBalance + quest.gpReward,
    ownedItemIds: Array.from(nextOwned),
    claimedQuestIds: [...profile.claimedQuestIds, questId],
    updatedAt: new Date().toISOString(),
  };
  nextProfile.unlockedAchievementIds = getUnlockedAchievementIds(nextProfile);

  return {
    ok: true,
    nextProfile,
    gpAwarded: quest.gpReward,
    unlockedItemName,
  };
}

export function unlockItemWithGpInProfile(
  profile: AvatarProfile,
  itemId: string
): {
  ok: boolean;
  reason?: 'already_owned' | 'not_gp_item' | 'insufficient_gp' | 'not_found';
  nextProfile: AvatarProfile;
} {
  const item = getAvatarItemById(itemId);
  if (!item || item.comingSoon) {
    return { ok: false, reason: 'not_found', nextProfile: profile };
  }
  if (profile.ownedItemIds.includes(itemId)) {
    return { ok: false, reason: 'already_owned', nextProfile: profile };
  }
  if (item.unlockType !== 'gp' || item.priceGp <= 0) {
    return { ok: false, reason: 'not_gp_item', nextProfile: profile };
  }
  if (profile.gpBalance < item.priceGp) {
    return { ok: false, reason: 'insufficient_gp', nextProfile: profile };
  }

  const nextProfile: AvatarProfile = {
    ...profile,
    gpBalance: profile.gpBalance - item.priceGp,
    ownedItemIds: [...profile.ownedItemIds, itemId],
    updatedAt: new Date().toISOString(),
  };
  nextProfile.unlockedAchievementIds = getUnlockedAchievementIds(nextProfile);

  return { ok: true, nextProfile };
}

export function evaluateUnlockedAchievements(
  profile: AvatarProfile
): Record<string, boolean> {
  return {
    title_rookie: true,
    title_green_soul: isQuestCompleted(profile, 'revive_item'),
    title_alley_friend:
      isQuestCompleted(profile, 'send_praise') ||
      isQuestCompleted(profile, 'save_favorite'),
    title_story_reporter: isQuestCompleted(profile, 'explore_3_artisans'),
    title_craft_keeper: isQuestCompleted(profile, 'suggest_artisan'),
  };
}

export function getUnlockedAchievementIds(profile: AvatarProfile): string[] {
  const evalMap = evaluateUnlockedAchievements(profile);
  return Object.entries(evalMap)
    .filter(([, unlocked]) => unlocked)
    .map(([id]) => id);
}
