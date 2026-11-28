import {
  AVATAR_ACHIEVEMENTS,
  AVATAR_ITEMS,
  AVATAR_QUESTS,
  DEFAULT_AVATAR_CONFIG,
  DEFAULT_QUEST_PROGRESS,
  FREE_STARTER_ITEM_IDS,
  getAvatarItemById,
} from '../data/avatarCatalog';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import type {
  AvatarConfig,
  AvatarProfile,
  AvatarQuestId,
  AvatarQuestProgressState,
} from '../types/avatar';

const GUEST_STORAGE_KEY = 'gtqt_avatar_profile_guest_v1';
const USER_STORAGE_PREFIX = 'gtqt_avatar_profile_user_v1_';

function getLocalKeyForUser(userKey: string): string {
  if (!userKey || userKey === 'guest') return GUEST_STORAGE_KEY;
  return `${USER_STORAGE_PREFIX}${encodeURIComponent(userKey)}`;
}

export function createDefaultAvatarProfile(userKey = 'guest'): AvatarProfile {
  return {
    userKey,
    avatarConfig: { ...DEFAULT_AVATAR_CONFIG, accessoryIds: [] },
    ownedItemIds: [...FREE_STARTER_ITEM_IDS],
    gpBalance: 50, // Quà chào mừng tân binh để trải nghiệm mở khóa ngay
    questProgress: {
      ...DEFAULT_QUEST_PROGRESS,
      viewedArtisanIds: [],
    },
    claimedQuestIds: [],
    equippedTitleId: 'title_rookie',
    snapshotDataUrl: null,
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeConfig(raw: Partial<AvatarConfig> | null | undefined): AvatarConfig {
  const base = { ...DEFAULT_AVATAR_CONFIG };
  if (!raw || typeof raw !== 'object') return base;
  return {
    skinId: typeof raw.skinId === 'string' ? raw.skinId : base.skinId,
    faceId: (raw.faceId ?? base.faceId) as AvatarConfig['faceId'],
    hairId: (raw.hairId ?? base.hairId) as AvatarConfig['hairId'],
    hairColorId:
      typeof raw.hairColorId === 'string' ? raw.hairColorId : base.hairColorId,
    topId: typeof raw.topId === 'string' ? raw.topId : base.topId,
    bottomId: typeof raw.bottomId === 'string' ? raw.bottomId : base.bottomId,
    shoesId: typeof raw.shoesId === 'string' ? raw.shoesId : base.shoesId,
    accessoryIds: Array.isArray(raw.accessoryIds)
      ? raw.accessoryIds.filter((id): id is string => typeof id === 'string')
      : [],
    studioBgId:
      typeof raw.studioBgId === 'string' ? raw.studioBgId : base.studioBgId,
  };
}

function sanitizeQuestProgress(
  raw: Partial<AvatarQuestProgressState> | null | undefined
): AvatarQuestProgressState {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_QUEST_PROGRESS, viewedArtisanIds: [] };
  }
  return {
    explore_3_artisans: Number(raw.explore_3_artisans) || 0,
    revive_item: Number(raw.revive_item) || 0,
    send_praise: Number(raw.send_praise) || 0,
    save_favorite: Number(raw.save_favorite) || 0,
    suggest_artisan: Number(raw.suggest_artisan) || 0,
    first_avatar_save: Number(raw.first_avatar_save) || 0,
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
  userKey: string
): AvatarProfile {
  const fallback = createDefaultAvatarProfile(userKey);
  if (!raw || typeof raw !== 'object') return fallback;

  const ownedSet = new Set<string>([
    ...FREE_STARTER_ITEM_IDS,
    ...(Array.isArray(raw.ownedItemIds)
      ? raw.ownedItemIds.filter((id): id is string => typeof id === 'string')
      : []),
  ]);

  const claimed = Array.isArray(raw.claimedQuestIds)
    ? raw.claimedQuestIds.filter(
        (id): id is AvatarQuestId =>
          typeof id === 'string' && AVATAR_QUESTS.some((q) => q.id === id)
      )
    : [];

  return {
    userKey,
    avatarConfig: sanitizeConfig(raw.avatarConfig),
    ownedItemIds: Array.from(ownedSet),
    gpBalance:
      typeof raw.gpBalance === 'number' && Number.isFinite(raw.gpBalance)
        ? Math.max(0, Math.floor(raw.gpBalance))
        : fallback.gpBalance,
    questProgress: sanitizeQuestProgress(raw.questProgress),
    claimedQuestIds: Array.from(new Set(claimed)),
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
}

export function loadLocalAvatarProfile(userKey = 'guest'): AvatarProfile | null {
  try {
    const raw = window.localStorage.getItem(getLocalKeyForUser(userKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AvatarProfile>;
    return sanitizeProfile(parsed, userKey);
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
    // Nếu quota đầy (do snapshot lớn), lưu bản không kèm snapshot
    try {
      window.localStorage.setItem(
        getLocalKeyForUser(profile.userKey),
        JSON.stringify({ ...profile, snapshotDataUrl: null })
      );
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage
    }
  }
}

/**
 * Tải hồ sơ Góc Thợ Avatar từ Supabase `user_avatar_profiles` (nếu đã đăng nhập),
 * tự động dự phòng (fallback) sang localStorage nếu bảng chưa tồn tại hoặc lỗi mạng.
 */
export async function loadAvatarProfile(
  userKey: string | null
): Promise<{ profile: AvatarProfile; syncedFromDb: boolean }> {
  const effectiveKey = userKey?.trim() || 'guest';
  const localGuest = loadLocalAvatarProfile('guest');
  const localUser =
    effectiveKey !== 'guest' ? loadLocalAvatarProfile(effectiveKey) : null;

  if (effectiveKey === 'guest') {
    return {
      profile: localGuest ?? createDefaultAvatarProfile('guest'),
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
        const dbProfile = sanitizeProfile(
          {
            userKey: effectiveKey,
            avatarConfig: data.avatar_config as Partial<AvatarConfig>,
            ownedItemIds: data.owned_item_ids as string[],
            gpBalance: Number(data.gp_balance ?? 0),
            questProgress: data.quest_progress as Partial<AvatarQuestProgressState>,
            claimedQuestIds: data.claimed_quest_ids as AvatarQuestId[],
            equippedTitleId: (data.equipped_title_id as string) ?? 'title_rookie',
            snapshotDataUrl: (data.snapshot_data_url as string | null) ?? null,
            updatedAt: (data.updated_at as string) ?? new Date().toISOString(),
          },
          effectiveKey
        );
        saveLocalAvatarProfile(dbProfile);
        return { profile: dbProfile, syncedFromDb: true };
      }
    } catch {
      // Bảng chưa được tạo trên Supabase hoặc mất mạng -> rơi về localStorage an toàn
    }
  }

  if (localUser) {
    return { profile: localUser, syncedFromDb: false };
  }

  // Nếu người dùng vừa đăng nhập từ phiên khách -> thừa kế tiến trình khách sang tài khoản
  if (localGuest) {
    const migrated: AvatarProfile = {
      ...localGuest,
      userKey: effectiveKey,
      updatedAt: new Date().toISOString(),
    };
    saveLocalAvatarProfile(migrated);
    return { profile: migrated, syncedFromDb: false };
  }

  return {
    profile: createDefaultAvatarProfile(effectiveKey),
    syncedFromDb: false,
  };
}

/**
 * Lưu hồ sơ Avatar về localStorage (luôn thành công) + upsert lên Supabase `user_avatar_profiles` (nếu có tài khoản).
 */
export async function saveAvatarProfile(
  profile: AvatarProfile
): Promise<{ savedToDb: boolean }> {
  const stamped: AvatarProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  saveLocalAvatarProfile(stamped);

  if (
    stamped.userKey === 'guest' ||
    !isSupabaseConfigured ||
    !supabase
  ) {
    return { savedToDb: false };
  }

  try {
    const { error } = await supabase.from('user_avatar_profiles').upsert(
      {
        user_key: stamped.userKey,
        avatar_config: stamped.avatarConfig,
        owned_item_ids: stamped.ownedItemIds,
        gp_balance: stamped.gpBalance,
        quest_progress: stamped.questProgress,
        claimed_quest_ids: stamped.claimedQuestIds,
        equipped_title_id: stamped.equippedTitleId,
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

  const isNowCompleted = isQuestCompleted(nextProfile, questId);
  const justCompletedQuest = !wasCompleted && isNowCompleted;

  return { nextProfile, justCompletedQuest };
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
  if (item.unlockType !== 'gp' || !item.gpCost) {
    return { ok: false, reason: 'not_gp_item', nextProfile: profile };
  }
  if (profile.gpBalance < item.gpCost) {
    return { ok: false, reason: 'insufficient_gp', nextProfile: profile };
  }

  const nextProfile: AvatarProfile = {
    ...profile,
    gpBalance: profile.gpBalance - item.gpCost,
    ownedItemIds: [...profile.ownedItemIds, itemId],
    updatedAt: new Date().toISOString(),
  };

  return { ok: true, nextProfile };
}

export function evaluateUnlockedAchievements(
  profile: AvatarProfile
): Record<string, boolean> {
  const saigonOwnedCount = AVATAR_ITEMS.filter(
    (item) =>
      item.collection === 'saigon' &&
      !item.comingSoon &&
      profile.ownedItemIds.includes(item.id)
  ).length;

  return {
    title_rookie: true,
    title_green_soul: isQuestCompleted(profile, 'revive_item'),
    title_alley_friend:
      isQuestCompleted(profile, 'explore_3_artisans') ||
      isQuestCompleted(profile, 'send_praise'),
    title_saigon_collector: saigonOwnedCount >= 2,
    title_craft_keeper: isQuestCompleted(profile, 'suggest_artisan'),
    title_style_artisan: profile.ownedItemIds.length >= 14,
  };
}
