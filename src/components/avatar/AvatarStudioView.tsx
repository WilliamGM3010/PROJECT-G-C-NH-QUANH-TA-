import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Coins,
  Compass,
  Info,
  Layers,
  Lock,
  Palette,
  RotateCcw,
  Save,
  Share2,
  Shirt,
  Shuffle,
  Sliders,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import {
  AVATAR_ACHIEVEMENTS,
  AVATAR_COLLECTIONS,
  AVATAR_ITEMS,
  AVATAR_QUESTS,
  FACE_EXPRESSIONS,
  getAchievementById,
  getAvatarItemById,
  getEquippedItemIds,
  getHairColorById,
  getRarityLabel,
  getStudioBackgroundById,
  HAIR_COLORS,
  SKIN_TONES,
  STUDIO_BACKGROUNDS,
} from '../../data/avatarCatalog';
import {
  countClaimableQuests,
  getQuestCurrentValue,
  getUnlockedAchievementIds,
  isQuestClaimed,
  isQuestCompleted,
} from '../../services/avatarService';
import type { AdminAccount, AppTab } from '../../types/artisan';
import type {
  AvatarConfig,
  AvatarItem,
  AvatarProfile,
  AvatarQuestId,
  AvatarSlot,
  AvatarSubTab,
  HairStyleId,
} from '../../types/avatar';
import { captureCompactAvatarSnapshot } from '../../utils/avatarSvgExport';
import { AvatarItemSwatch } from './AvatarItemSwatch';
import { ChibiAvatar2D } from './ChibiAvatar2D';
import { RewardDetailModal } from './RewardDetailModal';
import { ShareAvatarModal } from './ShareAvatarModal';

interface AvatarStudioViewProps {
  profile: AvatarProfile;
  currentUser: AdminAccount | null;
  onSaveAvatarConfig: (
    nextConfig: AvatarConfig,
    snapshotDataUrl: string | null,
    requireAccountSync?: boolean
  ) => Promise<void>;
  onUnlockItemWithGp: (itemId: string) => void;
  onClaimQuest: (questId: AvatarQuestId) => void;
  onEquipTitle: (titleId: string) => void;
  onNavigateAppTab: (tab: AppTab) => void;
  onRequestLogin: (prompt: string) => void;
  onShowToast: (message: string) => void;
}

const CREATOR_TABS: { id: AvatarSlot; label: string }[] = [
  { id: 'skin', label: 'Da' },
  { id: 'face', label: 'Mặt' },
  { id: 'hair', label: 'Tóc' },
  { id: 'top', label: 'Áo' },
  { id: 'bottom', label: 'Quần/Váy' },
  { id: 'shoes', label: 'Giày' },
  { id: 'headwear', label: 'Nón/Kính' },
  { id: 'accessory', label: 'Phụ kiện' },
];

const WARDROBE_SLOTS: { id: AvatarSlot | 'all'; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'hair', label: 'Tóc' },
  { id: 'top', label: 'Áo' },
  { id: 'bottom', label: 'Quần/Váy' },
  { id: 'shoes', label: 'Giày' },
  { id: 'headwear', label: 'Nón/Kính' },
  { id: 'accessory', label: 'Phụ kiện' },
];

const SUB_TABS: {
  id: AvatarSubTab;
  label: string;
  Icon: typeof Sparkles;
}[] = [
  { id: 'home', label: 'Tổng quan', Icon: Sparkles },
  { id: 'creator', label: 'Tùy chỉnh', Icon: Sliders },
  { id: 'wardrobe', label: 'Tủ đồ', Icon: Shirt },
  { id: 'collections', label: 'Bộ sưu tập', Icon: Layers },
  { id: 'quests', label: 'Nhiệm vụ', Icon: Compass },
  { id: 'achievements', label: 'Thành tích', Icon: Award },
];

const ACCESSORY_LAYER_LABELS: Record<string, string> = {
  headwear: 'Đội đầu',
  eyewear: 'Mắt kính',
  back_bag: 'Đeo lưng',
  chest_front: 'Đeo chéo',
  neck_front: 'Quàng cổ',
  hand_charm: 'Cầm tay',
};

function configsEqual(a: AvatarConfig, b: AvatarConfig): boolean {
  if (
    a.skinId !== b.skinId ||
    a.faceId !== b.faceId ||
    a.hairId !== b.hairId ||
    a.hairColorId !== b.hairColorId ||
    a.topId !== b.topId ||
    a.bottomId !== b.bottomId ||
    a.shoesId !== b.shoesId ||
    a.studioBgId !== b.studioBgId
  ) {
    return false;
  }
  if (a.accessoryIds.length !== b.accessoryIds.length) return false;
  const sortedA = [...a.accessoryIds].sort();
  const sortedB = [...b.accessoryIds].sort();
  return sortedA.every((id, idx) => id === sortedB[idx]);
}

export function AvatarStudioView({
  profile,
  currentUser,
  onSaveAvatarConfig,
  onUnlockItemWithGp,
  onClaimQuest,
  onEquipTitle,
  onNavigateAppTab,
  onRequestLogin,
  onShowToast,
}: AvatarStudioViewProps) {
  const [subTab, setSubTab] = useState<AvatarSubTab>('home');
  const [draftConfig, setDraftConfig] = useState<AvatarConfig>(
    profile.avatarConfig
  );
  const [creatorSlot, setCreatorSlot] = useState<AvatarSlot>('top');
  const [wardrobeSlotFilter, setWardrobeSlotFilter] = useState<
    AvatarSlot | 'all'
  >('all');
  const [wardrobeOwnershipFilter, setWardrobeOwnershipFilter] = useState<
    'owned' | 'all'
  >('owned');
  const [selectedDetailItem, setSelectedDetailItem] =
    useState<AvatarItem | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recentClaimedQuestId, setRecentClaimedQuestId] =
    useState<AvatarQuestId | null>(null);

  const staticCaptureRef = useRef<SVGSVGElement | null>(null);
  const prevUserKeyRef = useRef<string>(profile.userKey);

  // Đồng bộ lại bản nháp khi người dùng đổi tài khoản (Guest -> Đăng nhập)
  useEffect(() => {
    if (prevUserKeyRef.current !== profile.userKey) {
      prevUserKeyRef.current = profile.userKey;
      setDraftConfig(profile.avatarConfig);
    }
  }, [profile.userKey, profile.avatarConfig]);

  const displayName =
    currentUser?.displayName ||
    currentUser?.name ||
    profile.displayName ||
    'Bạn trẻ Sài Gòn';

  const ownedSet = useMemo(
    () => new Set(profile.ownedItemIds),
    [profile.ownedItemIds]
  );

  const collectibleItems = useMemo(
    () => AVATAR_ITEMS.filter((item) => !item.comingSoon),
    []
  );

  const ownedCollectibleCount = useMemo(
    () => collectibleItems.filter((item) => ownedSet.has(item.id)).length,
    [collectibleItems, ownedSet]
  );

  const collectionPercent = useMemo(() => {
    if (collectibleItems.length === 0) return 0;
    return Math.round((ownedCollectibleCount / collectibleItems.length) * 100);
  }, [ownedCollectibleCount, collectibleItems.length]);

  const claimableQuestsCount = useMemo(
    () => countClaimableQuests(profile),
    [profile]
  );

  const unlockedAchievementIds = useMemo(
    () => getUnlockedAchievementIds(profile),
    [profile]
  );

  const activeTitle = useMemo(
    () => getAchievementById(profile.equippedTitleId),
    [profile.equippedTitleId]
  );

  const activeBg = useMemo(
    () => getStudioBackgroundById(draftConfig.studioBgId),
    [draftConfig.studioBgId]
  );

  const equippedIds = useMemo(
    () => getEquippedItemIds(draftConfig),
    [draftConfig]
  );

  const lockedDraftItems = useMemo(
    () =>
      equippedIds
        .filter((id) => !ownedSet.has(id))
        .map((id) => getAvatarItemById(id))
        .filter((item): item is AvatarItem => Boolean(item)),
    [equippedIds, ownedSet]
  );

  const hasUnsavedChanges = useMemo(
    () => !configsEqual(draftConfig, profile.avatarConfig),
    [draftConfig, profile.avatarConfig]
  );

  const activeHairColor = useMemo(
    () => getHairColorById(draftConfig.hairColorId),
    [draftConfig.hairColorId]
  );

  const applyItemToDraft = useCallback(
    (item: AvatarItem, toggleOffIfEquipped = true) => {
      if (item.comingSoon) {
        setSelectedDetailItem(item);
        return;
      }

      setDraftConfig((prev) => {
        switch (item.slot) {
          case 'hair':
            return { ...prev, hairId: item.id as HairStyleId };
          case 'top':
            return { ...prev, topId: item.id };
          case 'bottom':
            return { ...prev, bottomId: item.id };
          case 'shoes':
            return { ...prev, shoesId: item.id };
          case 'headwear':
          case 'accessory': {
            const exists = prev.accessoryIds.includes(item.id);
            if (exists) {
              if (!toggleOffIfEquipped) return prev;
              return {
                ...prev,
                accessoryIds: prev.accessoryIds.filter((id) => id !== item.id),
              };
            }
            // Thay thế riêng món cùng layer (headwear, eyewear, back_bag, chest_front, neck_front, hand_charm)
            const targetLayer = item.modelConfig.layer;
            const filtered = targetLayer
              ? prev.accessoryIds.filter((existingId) => {
                  const existingItem = getAvatarItemById(existingId);
                  return existingItem?.modelConfig.layer !== targetLayer;
                })
              : prev.accessoryIds;
            return {
              ...prev,
              accessoryIds: [...filtered, item.id],
            };
          }
          default:
            return prev;
        }
      });
    },
    []
  );

  const clearSlotAccessories = useCallback((slot: 'headwear' | 'accessory') => {
    setDraftConfig((prev) => ({
      ...prev,
      accessoryIds: prev.accessoryIds.filter((id) => {
        const item = getAvatarItemById(id);
        return item?.slot !== slot;
      }),
    }));
  }, []);

  const handleRandomize = useCallback(() => {
    const ownedBySlot = (slot: AvatarSlot) =>
      AVATAR_ITEMS.filter(
        (item) =>
          item.slot === slot && !item.comingSoon && ownedSet.has(item.id)
      );

    const pick = <T,>(arr: T[]): T | undefined =>
      arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;

    const skin = pick(SKIN_TONES) ?? SKIN_TONES[1];
    const face = pick(FACE_EXPRESSIONS) ?? FACE_EXPRESSIONS[0];
    const hairColor = pick(HAIR_COLORS) ?? HAIR_COLORS[0];
    const hair = pick(ownedBySlot('hair'));
    const top = pick(ownedBySlot('top'));
    const bottom = pick(ownedBySlot('bottom'));
    const shoes = pick(ownedBySlot('shoes'));
    const ownedHeadwear = ownedBySlot('headwear');
    const ownedAcc = ownedBySlot('accessory');

    const chosenAccessories: string[] = [];
    const usedLayers = new Set<string>();
    const maybeAdd = (pool: AvatarItem[], chance: number) => {
      if (pool.length === 0 || Math.random() > chance) return;
      const item = pick(pool);
      if (!item) return;
      const layer = item.modelConfig.layer ?? item.id;
      if (usedLayers.has(layer)) return;
      usedLayers.add(layer);
      chosenAccessories.push(item.id);
    };

    maybeAdd(ownedHeadwear, 0.55);
    maybeAdd(ownedAcc, 0.7);
    maybeAdd(ownedAcc, 0.4);

    setDraftConfig((prev) => ({
      ...prev,
      skinId: skin.id,
      faceId: face.id,
      hairColorId: hairColor.id,
      hairId: (hair?.id as HairStyleId) ?? prev.hairId,
      topId: top?.id ?? prev.topId,
      bottomId: bottom?.id ?? prev.bottomId,
      shoesId: shoes?.id ?? prev.shoesId,
      accessoryIds: chosenAccessories,
    }));
    onShowToast('Đã phối ngẫu nhiên một diện mạo mới từ tủ đồ của bạn!');
  }, [ownedSet, onShowToast]);

  const handleResetToSaved = useCallback(() => {
    setDraftConfig(profile.avatarConfig);
    onShowToast('Đã khôi phục về tạo hình đã lưu gần nhất.');
  }, [profile.avatarConfig, onShowToast]);

  const handleSave = useCallback(
    async (requireAccountSync = false) => {
      if (lockedDraftItems.length > 0) {
        setSelectedDetailItem(lockedDraftItems[0]);
        onShowToast(
          `Bạn đang mặc thử "${lockedDraftItems[0].name}" chưa sở hữu. Hãy mở khóa bằng GP/Nhiệm vụ hoặc đổi sang món đã có để lưu nhé!`
        );
        return;
      }

      if (requireAccountSync && !currentUser) {
        onRequestLogin(
          'Đăng nhập để đồng bộ nhân vật Góc Thợ Avatar, điểm GP và tủ đồ sang tài khoản cá nhân trên mọi thiết bị.'
        );
        return;
      }

      setIsSaving(true);
      try {
        let snapshotDataUrl: string | null = null;
        if (staticCaptureRef.current) {
          snapshotDataUrl = await captureCompactAvatarSnapshot(
            staticCaptureRef.current,
            draftConfig.studioBgId
          );
        }
        await onSaveAvatarConfig(
          draftConfig,
          snapshotDataUrl,
          requireAccountSync
        );
      } finally {
        setIsSaving(false);
      }
    },
    [
      currentUser,
      draftConfig,
      lockedDraftItems,
      onRequestLogin,
      onSaveAvatarConfig,
      onShowToast,
    ]
  );

  const handleQuestAction = useCallback(
    (route: 'explore' | 'home' | 'suggest' | 'avatar_creator') => {
      if (route === 'avatar_creator') {
        setSubTab('creator');
        return;
      }
      onNavigateAppTab(route);
    },
    [onNavigateAppTab]
  );

  const handleClaimQuestWithFeedback = useCallback(
    (questId: AvatarQuestId) => {
      setRecentClaimedQuestId(questId);
      onClaimQuest(questId);
      window.setTimeout(() => {
        setRecentClaimedQuestId((curr) => (curr === questId ? null : curr));
      }, 2200);
    },
    [onClaimQuest]
  );

  const itemsForCreatorSlot = useMemo(
    () => AVATAR_ITEMS.filter((item) => item.slot === creatorSlot),
    [creatorSlot]
  );

  const filteredWardrobeItems = useMemo(() => {
    return AVATAR_ITEMS.filter((item) => {
      if (item.comingSoon) return false;
      if (wardrobeSlotFilter !== 'all' && item.slot !== wardrobeSlotFilter) {
        return false;
      }
      if (wardrobeOwnershipFilter === 'owned' && !ownedSet.has(item.id)) {
        return false;
      }
      return true;
    });
  }, [ownedSet, wardrobeOwnershipFilter, wardrobeSlotFilter]);

  const countEquippedInSlot = useCallback(
    (slot: 'headwear' | 'accessory') =>
      draftConfig.accessoryIds.filter(
        (id) => getAvatarItemById(id)?.slot === slot
      ).length,
    [draftConfig.accessoryIds]
  );

  return (
    <div className="min-h-screen bg-[#F7F2E8] text-[#25292E] pb-24 lg:pb-14">
      {/* Off-screen static SVG (không animation) để chụp ảnh đại diện 256x256 sắc nét ngay khi bấm Lưu */}
      <div
        aria-hidden="true"
        className="fixed -left-[9999px] -top-[9999px] w-[400px] h-[480px] pointer-events-none opacity-0"
      >
        <ChibiAvatar2D
          ref={staticCaptureRef}
          config={draftConfig}
          disableAnimation
          showGroundShadow={false}
          isDarkBackdrop={Boolean(activeBg.isDark)}
        />
      </div>

      {/* Thanh tiêu đề Studio + điều hướng 6 màn hình */}
      <div className="bg-[#FBF8F1]/95 backdrop-blur-md border-b border-dashed border-[#DFD3C2] sticky top-14 lg:top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 pb-2.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#D46534]">
                <span>GÓC THỢ AVATAR</span>
                <span className="text-[#C7B9A5]">·</span>
                <span className="text-[#615D57] hidden sm:inline">
                  THE NEIGHBORHOOD CRAFT
                </span>
              </div>
              <h1 className="font-display text-lg sm:text-xl font-extrabold text-[#25292E] tracking-tight truncate">
                Xưởng tạo nhân vật Chibi 2D
              </h1>
            </div>

            {/* Chỉ số GP & Tiến độ gọn gàng không nhồi nhét pill */}
            <div className="flex items-center gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#D46534]" />
                <span className="font-mono font-bold tabular-nums text-[#25292E]">
                  {profile.gpBalance} GP
                </span>
              </div>
              <span
                aria-hidden="true"
                className="h-4 w-px bg-[#DFD3C2] hidden sm:block"
              />
              <div className="hidden sm:flex items-center gap-1.5 text-[#615D57]">
                <span className="font-mono font-semibold tabular-nums text-[#1B3B82]">
                  {ownedCollectibleCount}/{collectibleItems.length}
                </span>
                <span>món đồ</span>
              </div>
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#1B3B82] text-xs font-bold text-[#1B3B82] transition-colors shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chia sẻ</span>
              </button>
            </div>
          </div>

          {/* 6 Sub-tabs điều hướng */}
          <nav
            aria-label="Điều hướng Góc Thợ Avatar"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1"
          >
            {SUB_TABS.map(({ id, label, Icon }) => {
              const active = subTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSubTab(id)}
                  className={`relative shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#1B3B82] text-[#F7F2E8] shadow-xs'
                      : 'text-[#615D57] hover:bg-[#EFE7D7] hover:text-[#25292E]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  {id === 'quests' && claimableQuestsCount > 0 && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full font-mono text-[10px] font-extrabold tabular-nums ${
                        active
                          ? 'bg-[#D46534] text-white'
                          : 'bg-[#D46534] text-white'
                      }`}
                    >
                      {claimableQuestsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Nội dung chính theo từng màn hình */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ================= MÀN HÌNH 1: TỔNG QUAN (AVATAR HOME) ================= */}
        {subTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cột trái: Sân khấu Mascot 2D bay lơ lửng */}
            <div className="lg:col-span-6 space-y-3">
              <div
                className="relative rounded-[28px] overflow-hidden border border-[#E8DFD1] shadow-[0_14px_36px_rgba(37,41,46,0.08)]"
                style={{ background: activeBg.cssBackground }}
              >
                {/* Viền chỉ khâu thủ công tinh tế */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-3 rounded-[22px] border border-dashed"
                  style={{ borderColor: activeBg.stitchColor }}
                />

                {/* Góc trên sân khấu: Tên phông nền & nút chia sẻ */}
                <div className="relative z-10 flex items-center justify-between px-5 pt-5">
                  <div className="text-[11px] font-mono uppercase tracking-[0.1em]">
                    <span
                      className="font-bold"
                      style={{ color: activeBg.textColor }}
                    >
                      {activeBg.name}
                    </span>
                    <span
                      className="mx-1.5 opacity-45"
                      style={{ color: activeBg.textColor }}
                    >
                      ·
                    </span>
                    <span
                      className="opacity-70 hidden sm:inline"
                      style={{ color: activeBg.textColor }}
                    >
                      {activeBg.subtitle}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSubTab('creator')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#1B3B82] text-xs font-bold shadow-xs transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Thay đồ</span>
                  </button>
                </div>

                {/* Mascot Chibi 2D bay lơ lửng */}
                <div className="relative z-10 h-[340px] sm:h-[400px] flex items-center justify-center px-6 pb-2">
                  <div className="w-[270px] sm:w-[310px] h-[324px] sm:h-[372px]">
                    <ChibiAvatar2D
                      config={draftConfig}
                      isDarkBackdrop={Boolean(activeBg.isDark)}
                    />
                  </div>
                </div>

                {/* Bộ chọn nhanh 6 phông nền Studio */}
                <div className="relative z-10 px-5 pb-5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Palette
                      className="w-3.5 h-3.5 opacity-70"
                      style={{ color: activeBg.textColor }}
                    />
                    <div className="flex items-center gap-1.5">
                      {STUDIO_BACKGROUNDS.map((bg) => {
                        const isSelected = draftConfig.studioBgId === bg.id;
                        return (
                          <button
                            key={bg.id}
                            type="button"
                            title={bg.name}
                            aria-label={`Chọn phông nền ${bg.name}`}
                            onClick={() =>
                              setDraftConfig((prev) => ({
                                ...prev,
                                studioBgId: bg.id,
                              }))
                            }
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              isSelected
                                ? 'scale-115 border-[#1B3B82] ring-2 ring-white/80'
                                : 'border-white/75 hover:scale-105'
                            }`}
                            style={{ background: bg.cssBackground }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {hasUnsavedChanges && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void handleSave(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B3B82] text-[#F7F2E8] text-xs font-bold shadow-sm hover:bg-[#152F68] transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu nền mới</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cột phải: Hồ sơ công dân Góc Thợ & 4 lối tắt */}
            <div className="lg:col-span-6 space-y-5">
              {/* Thẻ hồ sơ nhân vật */}
              <div className="bg-white rounded-[24px] border border-[#E8DFD1] p-5 sm:p-6 shadow-[0_8px_24px_rgba(37,41,46,0.04)] space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#615D57]">
                      Hồ sơ công dân góc nghề
                    </p>
                    <h2 className="font-display text-2xl font-extrabold text-[#25292E] truncate">
                      {displayName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <span
                        className="font-bold"
                        style={{ color: activeTitle.accentHex }}
                      >
                        {activeTitle.title}
                      </span>
                      <span className="text-[#C7B9A5]">·</span>
                      <span className="font-mono text-[#615D57]">
                        {activeTitle.badgeCode}
                      </span>
                      <span className="text-[#C7B9A5]">·</span>
                      <span className="text-[#4F6B54] font-semibold">
                        {unlockedAchievementIds.length}/
                        {AVATAR_ACHIEVEMENTS.length} danh hiệu
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 bg-[#F7F2E8] border border-dashed border-[#DFD3C2] rounded-2xl px-3.5 py-2.5">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#615D57]">
                      Điểm thưởng
                    </p>
                    <p className="font-mono text-xl font-extrabold tabular-nums text-[#D46534] leading-tight">
                      {profile.gpBalance}{' '}
                      <span className="text-xs font-bold">GP</span>
                    </p>
                  </div>
                </div>

                {/* Thanh tiến độ bộ sưu tập */}
                <div className="pt-2 border-t border-dashed border-[#DFD3C2] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#25292E]">
                      Tiến độ tủ đồ Góc Thợ
                    </span>
                    <span className="font-mono font-bold tabular-nums text-[#1B3B82]">
                      {ownedCollectibleCount}/{collectibleItems.length} món (
                      {collectionPercent}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#EFE7D7] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#4F6B54] transition-all duration-500"
                      style={{ width: `${collectionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Thông báo nhiệm vụ sẵn sàng nhận */}
                {claimableQuestsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSubTab('quests')}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#FDF2E9] border border-[#D46534]/30 hover:border-[#D46534] text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                      <Sparkles className="w-4 h-4 text-[#D46534] shrink-0" />
                      <span className="font-bold text-[#25292E]">
                        Bạn có{' '}
                        <span className="font-mono text-[#D46534]">
                          {claimableQuestsCount}
                        </span>{' '}
                        nhiệm vụ đã xong — vào nhận GP &amp; quà giới hạn ngay!
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#D46534] shrink-0" />
                  </button>
                )}
              </div>

              {/* 4 Lối tắt chính */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setSubTab('creator')}
                  className="group text-left bg-[#1B3B82] hover:bg-[#16316D] text-[#F7F2E8] rounded-2xl p-4 sm:p-5 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <Sliders className="w-5 h-5 text-[#F6C86E]" />
                    <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="mt-3 font-display text-base font-extrabold">
                    Tùy chỉnh nhân vật
                  </p>
                  <p className="mt-0.5 text-xs text-[#E4ECF9]/80">
                    Phối 8 nhóm: da, mặt, tóc, áo quần, giày, nón kính &amp; phụ
                    kiện
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTab('wardrobe')}
                  className="group text-left bg-white hover:bg-[#FBF8F1] border border-[#E8DFD1] hover:border-[#1B3B82]/50 rounded-2xl p-4 sm:p-5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <Shirt className="w-5 h-5 text-[#4F6B54]" />
                    <ArrowRight className="w-4 h-4 text-[#615D57] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="mt-3 font-display text-base font-extrabold text-[#25292E]">
                    Tủ đồ của tôi
                  </p>
                  <p className="mt-0.5 text-xs text-[#615D57]">
                    Thay nhanh {ownedCollectibleCount} món đã sở hữu &amp; xem
                    vật phẩm mới
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTab('quests')}
                  className="group text-left bg-white hover:bg-[#FBF8F1] border border-[#E8DFD1] hover:border-[#D46534]/50 rounded-2xl p-4 sm:p-5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <Compass className="w-5 h-5 text-[#D46534]" />
                    <ArrowRight className="w-4 h-4 text-[#615D57] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="mt-3 font-display text-base font-extrabold text-[#25292E]">
                    Bảng nhiệm vụ +GP
                  </p>
                  <p className="mt-0.5 text-xs text-[#615D57]">
                    Sửa đồ, khen thợ &amp; khám phá bản đồ để nhận đồ thủ công
                    giới hạn
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="group text-left bg-white hover:bg-[#FBF8F1] border border-[#E8DFD1] hover:border-[#1B3B82]/50 rounded-2xl p-4 sm:p-5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <Share2 className="w-5 h-5 text-[#1B3B82]" />
                    <ArrowRight className="w-4 h-4 text-[#615D57] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="mt-3 font-display text-base font-extrabold text-[#25292E]">
                    Chia sẻ Avatar
                  </p>
                  <p className="mt-0.5 text-xs text-[#615D57]">
                    Xuất ảnh PNG sắc nét tỉ lệ 1:1 hoặc Story 9:16 kèm dấu mộc
                    Góc Thợ
                  </p>
                </button>
              </div>

              {/* Khối đồng bộ tài khoản cho khách (Guest) */}
              {!currentUser && (
                <div className="rounded-2xl bg-[#EEF2FA] border border-[#1B3B82]/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#1B3B82]">
                      Đang lưu tạm trên thiết bị này
                    </p>
                    <p className="text-xs text-[#615D57]">
                      Đăng nhập để đồng bộ nhân vật, điểm GP và ảnh đại diện lên
                      tài khoản cá nhân.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onRequestLogin(
                        'Đăng nhập để lưu Góc Thợ Avatar, tủ đồ và điểm thưởng GP vào tài khoản của bạn.'
                      )
                    }
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B3B82] hover:bg-[#152F68] text-[#F7F2E8] text-xs font-bold transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Lưu vào tài khoản</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MÀN HÌNH 2: TÙY CHỈNH NHÂN VẬT (CREATOR) ================= */}
        {subTab === 'creator' && (
          <div className="grid grid-cols-1 lg:grid-cols-[48%_52%] gap-5 lg:gap-6 items-start">
            {/* Cột trái (Desktop 48% sticky) / Đầu trang (Mobile 42vh sticky): Sân khấu Mascot 2D */}
            <div className="sticky top-[132px] lg:top-[152px] z-20 space-y-3">
              <div
                className="relative rounded-[26px] overflow-hidden border border-[#E8DFD1] shadow-[0_12px_32px_rgba(37,41,46,0.08)]"
                style={{ background: activeBg.cssBackground }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2.5 sm:inset-3 rounded-[20px] border border-dashed"
                  style={{ borderColor: activeBg.stitchColor }}
                />

                {/* Thanh hành động nhỏ góc trên sân khấu */}
                <div className="relative z-10 flex items-center justify-between px-4 pt-3.5 sm:pt-4">
                  <div className="flex items-center gap-1.5">
                    {STUDIO_BACKGROUNDS.map((bg) => {
                      const isSelected = draftConfig.studioBgId === bg.id;
                      return (
                        <button
                          key={bg.id}
                          type="button"
                          title={bg.name}
                          aria-label={`Đổi nền ${bg.name}`}
                          onClick={() =>
                            setDraftConfig((prev) => ({
                              ...prev,
                              studioBgId: bg.id,
                            }))
                          }
                          className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full border-2 transition-transform ${
                            isSelected
                              ? 'scale-115 border-[#1B3B82] ring-2 ring-white/80'
                              : 'border-white/75 hover:scale-105'
                          }`}
                          style={{ background: bg.cssBackground }}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleRandomize}
                      title="Phối ngẫu nhiên từ tủ đồ"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#25292E] text-[11px] font-bold shadow-2xs transition-colors"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-[#D46534]" />
                      <span className="hidden sm:inline">Ngẫu nhiên</span>
                    </button>

                    {hasUnsavedChanges && (
                      <button
                        type="button"
                        onClick={handleResetToSaved}
                        title="Khôi phục bản đã lưu"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#615D57] text-[11px] font-bold shadow-2xs transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hoàn tác</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Vùng hiển thị Mascot Chibi 2D (Mobile 42vh gọn gàng / Desktop rộng thoáng) */}
                <div className="relative z-10 h-[34vh] min-h-[230px] max-h-[300px] lg:h-[395px] lg:max-h-[410px] flex items-center justify-center px-4 pb-2">
                  <div className="h-full aspect-[400/480] max-w-full">
                    <ChibiAvatar2D
                      config={draftConfig}
                      isDarkBackdrop={Boolean(activeBg.isDark)}
                    />
                  </div>
                </div>
              </div>

              {/* Dải cảnh báo khi đang mặc thử món đồ chưa sở hữu */}
              {lockedDraftItems.length > 0 && (
                <div className="rounded-2xl bg-[#FFF6EB] border border-[#D46534]/35 px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2 text-xs">
                    <Lock className="w-4 h-4 text-[#D46534] shrink-0" />
                    <span className="text-[#25292E] truncate">
                      Đang mặc thử{' '}
                      <strong className="text-[#B93818]">
                        {lockedDraftItems.length} món
                      </strong>{' '}
                      chưa mở khóa ({lockedDraftItems[0].name})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDetailItem(lockedDraftItems[0])}
                    className="shrink-0 text-xs font-bold text-[#D46534] hover:underline"
                  >
                    Mở khóa →
                  </button>
                </div>
              )}

              {/* Thanh nút Lưu nhân vật (xanh chàm #1B3B82) & Lưu vào tài khoản */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleSave(false)}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#1B3B82] hover:bg-[#152F68] disabled:opacity-60 text-[#F7F2E8] font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSaving
                      ? 'Đang lưu...'
                      : hasUnsavedChanges
                        ? 'Lưu nhân vật'
                        : 'Đã lưu nhân vật'}
                  </span>
                </button>

                {!currentUser && (
                  <button
                    type="button"
                    onClick={() => void handleSave(true)}
                    className="min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-white hover:bg-[#FBF8F1] border border-[#1B3B82]/35 text-[#1B3B82] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Lưu vào tài khoản</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  aria-label="Chia sẻ Avatar"
                  className="min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-white hover:bg-[#FBF8F1] border border-[#E8DFD1] text-[#25292E] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-[#D46534]" />
                  <span className="hidden sm:inline">Chia sẻ</span>
                </button>
              </div>
            </div>

            {/* Cột phải (Desktop 52%): Khay tùy biến 8 nhóm vật phẩm */}
            <div className="bg-white rounded-[26px] border border-[#E8DFD1] shadow-[0_8px_24px_rgba(37,41,46,0.04)] overflow-hidden">
              {/* 8 Tab danh mục */}
              <div className="px-4 pt-4 pb-3 border-b border-dashed border-[#DFD3C2] bg-[#FBF8F1]">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {CREATOR_TABS.map((tab) => {
                    const active = creatorSlot === tab.id;
                    const countBadge =
                      tab.id === 'headwear' || tab.id === 'accessory'
                        ? countEquippedInSlot(tab.id)
                        : 0;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCreatorSlot(tab.id)}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                          active
                            ? 'bg-[#D46534] text-white shadow-2xs'
                            : 'bg-white border border-[#E8DFD1] text-[#615D57] hover:text-[#25292E] hover:border-[#D46534]/50'
                        }`}
                      >
                        <span>{tab.label}</span>
                        {countBadge > 0 && (
                          <span
                            className={`font-mono text-[10px] px-1.5 rounded-full ${
                              active
                                ? 'bg-white/25 text-white'
                                : 'bg-[#EEF2FA] text-[#1B3B82]'
                            }`}
                          >
                            {countBadge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-5">
                {/* 1. Nhóm MÀU DA */}
                {creatorSlot === 'skin' && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-display text-sm font-extrabold text-[#25292E]">
                        Chọn sắc da ấm tự nhiên
                      </h3>
                      <p className="text-xs text-[#615D57] mt-0.5">
                        Bảng màu da phẳng không viền hài hòa cùng ánh má hồng
                        nhẹ nhàng.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {SKIN_TONES.map((tone) => {
                        const selected = draftConfig.skinId === tone.id;
                        return (
                          <button
                            key={tone.id}
                            type="button"
                            onClick={() =>
                              setDraftConfig((prev) => ({
                                ...prev,
                                skinId: tone.id,
                              }))
                            }
                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                              selected
                                ? 'border-[#1B3B82] bg-[#F4F7FC] ring-2 ring-[#1B3B82]/15'
                                : 'border-[#E8DFD1] bg-[#FBF8F1] hover:border-[#D46534]/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="w-10 h-10 rounded-full border border-black/10 relative overflow-hidden"
                                style={{ backgroundColor: tone.hex }}
                              >
                                <span
                                  className="absolute bottom-1 right-1 w-3.5 h-2 rounded-full opacity-75"
                                  style={{ backgroundColor: tone.blushHex }}
                                />
                              </span>
                              {selected && (
                                <CheckCircle2 className="w-4 h-4 text-[#1B3B82]" />
                              )}
                            </div>
                            <p className="mt-2.5 text-xs font-bold text-[#25292E]">
                              {tone.name}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Nhóm BIỂU CẢM MẶT */}
                {creatorSlot === 'face' && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-display text-sm font-extrabold text-[#25292E]">
                        Biểu cảm khuôn mặt
                      </h3>
                      <p className="text-xs text-[#615D57] mt-0.5">
                        Đôi mắt chấm tròn long lanh tự động chớp nhẹ đầy sức
                        sống.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {FACE_EXPRESSIONS.map((exp) => {
                        const selected = draftConfig.faceId === exp.id;
                        return (
                          <button
                            key={exp.id}
                            type="button"
                            onClick={() =>
                              setDraftConfig((prev) => ({
                                ...prev,
                                faceId: exp.id,
                              }))
                            }
                            className={`p-4 rounded-2xl border text-left transition-all ${
                              selected
                                ? 'border-[#1B3B82] bg-[#F4F7FC] ring-2 ring-[#1B3B82]/15'
                                : 'border-[#E8DFD1] bg-[#FBF8F1] hover:border-[#D46534]/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-base font-extrabold text-[#1B3B82]">
                                {exp.previewBadge}
                              </span>
                              {selected && (
                                <CheckCircle2 className="w-4 h-4 text-[#1B3B82]" />
                              )}
                            </div>
                            <p className="mt-2 text-xs font-bold text-[#25292E]">
                              {exp.name}
                            </p>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#615D57]">
                              {exp.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Nhóm TÓC (Màu tóc + Kiểu tóc) */}
                {creatorSlot === 'hair' && (
                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-sm font-extrabold text-[#25292E]">
                          Màu tóc
                        </h3>
                        <span className="text-xs font-semibold text-[#615D57]">
                          {activeHairColor.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {HAIR_COLORS.map((hc) => {
                          const selected = draftConfig.hairColorId === hc.id;
                          return (
                            <button
                              key={hc.id}
                              type="button"
                              title={hc.name}
                              aria-label={`Chọn màu tóc ${hc.name}`}
                              onClick={() =>
                                setDraftConfig((prev) => ({
                                  ...prev,
                                  hairColorId: hc.id,
                                }))
                              }
                              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-transform ${
                                selected
                                  ? 'scale-110 border-[#1B3B82] ring-2 ring-[#1B3B82]/25'
                                  : 'border-white shadow-xs hover:scale-105'
                              }`}
                              style={{ backgroundColor: hc.hex }}
                            >
                              {selected && (
                                <Check
                                  className={`w-4 h-4 ${
                                    hc.id === 'hair_cream_cloud' ||
                                    hc.id === 'hair_honey'
                                      ? 'text-[#25292E]'
                                      : 'text-white'
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-dashed border-[#DFD3C2]">
                      <h3 className="font-display text-sm font-extrabold text-[#25292E] mb-3">
                        Kiểu tóc ({itemsForCreatorSlot.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {itemsForCreatorSlot.map((item) => {
                          const owned = ownedSet.has(item.id);
                          const equipped = draftConfig.hairId === item.id;
                          const rarity = getRarityLabel(item.rarity);
                          return (
                            <div
                              key={item.id}
                              className={`relative rounded-2xl border p-3 transition-all ${
                                equipped
                                  ? 'border-[#1B3B82] bg-[#F4F7FC] ring-2 ring-[#1B3B82]/15'
                                  : 'border-[#E8DFD1] bg-[#FBF8F1] hover:border-[#D46534]/50'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => applyItemToDraft(item, false)}
                                className="w-full text-left"
                              >
                                <div className="h-20 rounded-xl bg-white border border-[#EFE7D7] flex items-center justify-center relative overflow-hidden">
                                  <AvatarItemSwatch
                                    item={item}
                                    overrideColor={activeHairColor.hex}
                                    size="md"
                                  />
                                  {!owned && (
                                    <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#25292E]/85 text-white flex items-center justify-center">
                                      <Lock className="w-3 h-3" />
                                    </span>
                                  )}
                                  {equipped && (
                                    <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-[#4F6B54] text-white flex items-center justify-center">
                                      <Check className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 text-xs font-bold text-[#25292E] line-clamp-1">
                                  {item.name}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[#615D57] flex items-center gap-1">
                                  <span style={{ color: rarity.color }}>
                                    {rarity.label}
                                  </span>
                                  <span>·</span>
                                  {owned ? (
                                    <span className="text-[#4F6B54] font-semibold">
                                      Đã có
                                    </span>
                                  ) : (
                                    <span className="font-mono font-bold text-[#D46534]">
                                      {item.priceGp} GP
                                    </span>
                                  )}
                                </p>
                              </button>
                              <button
                                type="button"
                                aria-label={`Xem chi tiết ${item.name}`}
                                onClick={() => setSelectedDetailItem(item)}
                                className="absolute bottom-2.5 right-2.5 p-1 rounded-lg text-[#615D57] hover:text-[#1B3B82] hover:bg-white transition-colors"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4–8. Nhóm ÁO, QUẦN/VÁY, GIÀY, NÓN/KÍNH, PHỤ KIỆN */}
                {creatorSlot !== 'skin' &&
                  creatorSlot !== 'face' &&
                  creatorSlot !== 'hair' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-display text-sm font-extrabold text-[#25292E]">
                            {
                              CREATOR_TABS.find((t) => t.id === creatorSlot)
                                ?.label
                            }{' '}
                            ({itemsForCreatorSlot.length})
                          </h3>
                          {(creatorSlot === 'headwear' ||
                            creatorSlot === 'accessory') && (
                            <p className="text-[11px] text-[#615D57] mt-0.5">
                              Có thể đeo kết hợp nhiều lớp khác nhau (nón + kính
                              + balo + máy ảnh + cầm tay). Bấm lại để tháo.
                            </p>
                          )}
                        </div>

                        {(creatorSlot === 'headwear' ||
                          creatorSlot === 'accessory') &&
                          countEquippedInSlot(creatorSlot) > 0 && (
                            <button
                              type="button"
                              onClick={() => clearSlotAccessories(creatorSlot)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F7F2E8] hover:bg-[#EFE7D7] text-[11px] font-bold text-[#615D57] transition-colors"
                            >
                              <X className="w-3 h-3" />
                              <span>Tháo hết nhóm này</span>
                            </button>
                          )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {itemsForCreatorSlot.map((item) => {
                          const owned = ownedSet.has(item.id);
                          const equipped = equippedIds.includes(item.id);
                          const rarity = getRarityLabel(item.rarity);
                          const layerLabel = item.modelConfig.layer
                            ? ACCESSORY_LAYER_LABELS[item.modelConfig.layer]
                            : null;

                          return (
                            <div
                              key={item.id}
                              className={`relative rounded-2xl border p-3 transition-all ${
                                item.comingSoon
                                  ? 'border-dashed border-[#DFD3C2] bg-[#FAF6EE] opacity-85'
                                  : equipped
                                    ? 'border-[#1B3B82] bg-[#F4F7FC] ring-2 ring-[#1B3B82]/15'
                                    : 'border-[#E8DFD1] bg-[#FBF8F1] hover:border-[#D46534]/50'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => applyItemToDraft(item, true)}
                                className="w-full text-left"
                              >
                                <div className="h-24 rounded-xl bg-white border border-[#EFE7D7] flex items-center justify-center relative overflow-hidden">
                                  <AvatarItemSwatch item={item} size="md" />
                                  {item.comingSoon ? (
                                    <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-[#B93818] text-white font-mono text-[9px] font-bold uppercase">
                                      Sắp ra mắt
                                    </span>
                                  ) : !owned ? (
                                    <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#25292E]/85 text-white flex items-center justify-center">
                                      <Lock className="w-3 h-3" />
                                    </span>
                                  ) : null}

                                  {equipped && !item.comingSoon && (
                                    <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-[#4F6B54] text-white flex items-center justify-center">
                                      <Check className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 text-xs font-bold text-[#25292E] line-clamp-1 pr-5">
                                  {item.name}
                                </p>

                                <div className="mt-0.5 text-[11px] text-[#615D57] flex items-center gap-1 flex-wrap">
                                  {layerLabel ? (
                                    <span>{layerLabel}</span>
                                  ) : (
                                    <span style={{ color: rarity.color }}>
                                      {rarity.label}
                                    </span>
                                  )}
                                  <span>·</span>
                                  {item.comingSoon ? (
                                    <span className="text-[#B93818] font-semibold">
                                      Mùa Tết
                                    </span>
                                  ) : owned ? (
                                    <span className="text-[#4F6B54] font-semibold">
                                      {equipped ? 'Đang mặc' : 'Đã có'}
                                    </span>
                                  ) : item.unlockType === 'quest' ? (
                                    <span className="text-[#9A6310] font-semibold">
                                      Nhiệm vụ
                                    </span>
                                  ) : (
                                    <span className="font-mono font-bold text-[#D46534]">
                                      {item.priceGp} GP
                                    </span>
                                  )}
                                </div>
                              </button>

                              <button
                                type="button"
                                aria-label={`Xem chi tiết ${item.name}`}
                                onClick={() => setSelectedDetailItem(item)}
                                className="absolute bottom-2.5 right-2.5 p-1 rounded-lg text-[#615D57] hover:text-[#1B3B82] hover:bg-white transition-colors"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* ================= MÀN HÌNH 3: TỦ ĐỒ CỦA TÔI (WARDROBE) ================= */}
        {subTab === 'wardrobe' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Trái: Live 2D Mascot preview card */}
            <div className="lg:col-span-4 lg:sticky lg:top-[152px] space-y-3">
              <div
                className="relative rounded-[26px] overflow-hidden border border-[#E8DFD1] shadow-sm"
                style={{ background: activeBg.cssBackground }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2.5 rounded-[20px] border border-dashed"
                  style={{ borderColor: activeBg.stitchColor }}
                />
                <div className="relative z-10 h-[280px] sm:h-[320px] flex items-center justify-center p-4">
                  <div className="h-full aspect-[400/480]">
                    <ChibiAvatar2D
                      config={draftConfig}
                      isDarkBackdrop={Boolean(activeBg.isDark)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8DFD1] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#615D57]">Đã mở khóa</span>
                  <span className="font-mono font-bold tabular-nums text-[#1B3B82]">
                    {ownedCollectibleCount}/{collectibleItems.length} món
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSaving || !hasUnsavedChanges}
                    onClick={() => void handleSave(false)}
                    className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-[#1B3B82] hover:bg-[#152F68] disabled:opacity-45 text-[#F7F2E8] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {hasUnsavedChanges ? 'Lưu trang phục' : 'Đã đồng bộ'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab('creator')}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-[#F7F2E8] hover:bg-[#EFE7D7] text-[#25292E] text-xs font-bold transition-colors"
                  >
                    Sửa chi tiết
                  </button>
                </div>
              </div>
            </div>

            {/* Phải: Bộ lọc & Lưới vật phẩm trong tủ */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E8DFD1] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-base font-extrabold text-[#25292E]">
                    Tủ đồ cá nhân
                  </h2>
                  <div className="inline-flex rounded-xl bg-[#F7F2E8] p-1 border border-[#E8DFD1] text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setWardrobeOwnershipFilter('owned')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        wardrobeOwnershipFilter === 'owned'
                          ? 'bg-white text-[#1B3B82] shadow-2xs'
                          : 'text-[#615D57]'
                      }`}
                    >
                      Đang sở hữu ({ownedCollectibleCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setWardrobeOwnershipFilter('all')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        wardrobeOwnershipFilter === 'all'
                          ? 'bg-white text-[#1B3B82] shadow-2xs'
                          : 'text-[#615D57]'
                      }`}
                    >
                      Tất cả ({collectibleItems.length})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {WARDROBE_SLOTS.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setWardrobeSlotFilter(slot.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        wardrobeSlotFilter === slot.id
                          ? 'bg-[#1B3B82] text-[#F7F2E8]'
                          : 'bg-[#F7F2E8] text-[#615D57] hover:text-[#25292E]'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredWardrobeItems.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-[#DFD3C2] p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-[#25292E]">
                    Chưa có món đồ nào trong mục này
                  </p>
                  <p className="text-xs text-[#615D57]">
                    Hãy chuyển sang chế độ &ldquo;Tất cả&rdquo; hoặc làm nhiệm
                    vụ để mở khóa thêm đồ thủ công nhé!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {filteredWardrobeItems.map((item) => {
                    const owned = ownedSet.has(item.id);
                    const equipped = equippedIds.includes(item.id);
                    const rarity = getRarityLabel(item.rarity);
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-3.5 bg-white transition-all flex flex-col justify-between gap-3 ${
                          equipped
                            ? 'border-[#4F6B54] ring-2 ring-[#4F6B54]/15'
                            : 'border-[#E8DFD1] hover:border-[#D46534]/50'
                        }`}
                      >
                        <div>
                          <div className="h-24 rounded-xl bg-[#FBF8F1] border border-[#EFE7D7] flex items-center justify-center relative">
                            <AvatarItemSwatch
                              item={item}
                              overrideColor={
                                item.slot === 'hair'
                                  ? activeHairColor.hex
                                  : undefined
                              }
                              size="md"
                            />
                            {equipped && (
                              <span className="absolute top-2 left-2 text-[10px] font-bold text-[#4F6B54] bg-[#ECF3ED] px-2 py-0.5 rounded-md">
                                Đang mặc
                              </span>
                            )}
                            {!owned && (
                              <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#25292E]/85 text-white flex items-center justify-center">
                                <Lock className="w-3 h-3" />
                              </span>
                            )}
                          </div>

                          <p className="mt-2.5 text-xs font-bold text-[#25292E] line-clamp-1">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#615D57] flex items-center gap-1">
                            <span style={{ color: rarity.color }}>
                              {rarity.label}
                            </span>
                            <span>·</span>
                            {owned ? (
                              <span>Sở hữu</span>
                            ) : item.unlockType === 'quest' ? (
                              <span className="text-[#9A6310] font-semibold">
                                Qua nhiệm vụ
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-[#D46534]">
                                {item.priceGp} GP
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {owned ? (
                            <button
                              type="button"
                              onClick={() => applyItemToDraft(item, true)}
                              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-colors ${
                                equipped
                                  ? 'bg-[#ECF3ED] text-[#4F6B54] hover:bg-[#DCE9DE]'
                                  : 'bg-[#1B3B82] text-[#F7F2E8] hover:bg-[#152F68]'
                              }`}
                            >
                              {equipped
                                ? item.slot === 'headwear' ||
                                  item.slot === 'accessory'
                                  ? 'Tháo ra'
                                  : 'Đang mặc'
                                : 'Mặc ngay'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedDetailItem(item)}
                              className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-[#FDF2E9] text-[#D46534] hover:bg-[#F9E5D5] transition-colors"
                            >
                              Xem cách mở
                            </button>
                          )}

                          <button
                            type="button"
                            aria-label={`Chi tiết ${item.name}`}
                            onClick={() => setSelectedDetailItem(item)}
                            className="p-1.5 rounded-xl bg-[#F7F2E8] hover:bg-[#EFE7D7] text-[#615D57] transition-colors"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MÀN HÌNH 4: BỘ SƯU TẬP (COLLECTIONS) ================= */}
        {subTab === 'collections' && (
          <div className="space-y-6">
            <div className="max-w-2xl space-y-1.5">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#D46534]">
                CURATED COLLECTIONS · 5 CHỦ ĐỀ
              </p>
              <h2 className="font-display text-2xl font-extrabold text-[#25292E]">
                Bộ sưu tập thời trang &amp; vật phẩm Góc Nghề
              </h2>
              <p className="font-serif-editorial italic text-sm text-[#615D57] leading-relaxed">
                Mỗi món đồ trong Góc Thợ Avatar đều lấy cảm hứng từ nhịp sống
                hẻm nhỏ Sài Gòn và đôi tay tỉ mỉ của các cô chú thợ quanh ta.
              </p>
            </div>

            <div className="space-y-5">
              {AVATAR_COLLECTIONS.map((col) => {
                const items = AVATAR_ITEMS.filter(
                  (item) => item.collection === col.id
                );
                const availableItems = items.filter((item) => !item.comingSoon);
                const ownedInCol = availableItems.filter((item) =>
                  ownedSet.has(item.id)
                ).length;
                const colPercent =
                  availableItems.length > 0
                    ? Math.round((ownedInCol / availableItems.length) * 100)
                    : 0;

                return (
                  <section
                    key={col.id}
                    className="rounded-[26px] bg-white border border-[#E8DFD1] overflow-hidden shadow-[0_8px_24px_rgba(37,41,46,0.04)]"
                  >
                    <div
                      className="p-5 sm:p-6 border-b border-dashed border-[#DFD3C2]"
                      style={{ backgroundColor: col.surfaceTint }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.1em]">
                            <span style={{ color: col.accentColor }}>
                              {col.englishTag}
                            </span>
                            <span className="text-[#C7B9A5]">·</span>
                            <span className="text-[#615D57]">
                              {col.subtitle}
                            </span>
                          </div>
                          <h3 className="font-display text-xl font-extrabold text-[#25292E]">
                            {col.name}
                          </h3>
                          <p className="font-serif-editorial italic text-sm text-[#4A4641] leading-relaxed">
                            &ldquo;{col.story}&rdquo;
                          </p>
                        </div>

                        <div className="sm:text-right shrink-0 space-y-1.5 min-w-[150px]">
                          <p className="font-mono text-xs font-bold tabular-nums text-[#25292E]">
                            {ownedInCol}/{availableItems.length} món ·{' '}
                            <span style={{ color: col.accentColor }}>
                              {colPercent}%
                            </span>
                          </p>
                          <div className="h-2 rounded-full bg-white/90 overflow-hidden border border-[#E8DFD1]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${colPercent}%`,
                                backgroundColor: col.accentColor,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                      {items.map((item) => {
                        const owned = ownedSet.has(item.id);
                        const equipped = equippedIds.includes(item.id);
                        const rarity = getRarityLabel(item.rarity);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedDetailItem(item)}
                            className={`text-left rounded-2xl border p-3 transition-all hover:-translate-y-0.5 ${
                              item.comingSoon
                                ? 'border-dashed border-[#DFD3C2] bg-[#FAF6EE]'
                                : equipped
                                  ? 'border-[#1B3B82] bg-[#F4F7FC]'
                                  : 'border-[#E8DFD1] bg-[#FBF8F1] hover:border-[#D46534]/60'
                            }`}
                          >
                            <div className="h-24 rounded-xl bg-white border border-[#EFE7D7] flex items-center justify-center relative">
                              <AvatarItemSwatch
                                item={item}
                                overrideColor={
                                  item.slot === 'hair'
                                    ? activeHairColor.hex
                                    : undefined
                                }
                                size="md"
                              />
                              {item.comingSoon ? (
                                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#B93818] text-white font-mono text-[9px] font-bold uppercase">
                                  Teaser
                                </span>
                              ) : owned ? (
                                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#4F6B54] text-white flex items-center justify-center">
                                  <Check className="w-3 h-3" />
                                </span>
                              ) : (
                                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#25292E]/80 text-white flex items-center justify-center">
                                  <Lock className="w-3 h-3" />
                                </span>
                              )}
                            </div>

                            <p className="mt-2.5 text-xs font-bold text-[#25292E] line-clamp-1">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#615D57] flex items-center gap-1">
                              <span style={{ color: rarity.color }}>
                                {rarity.label}
                              </span>
                              <span>·</span>
                              {item.comingSoon ? (
                                <span className="text-[#B93818] font-semibold">
                                  Sắp ra mắt
                                </span>
                              ) : owned ? (
                                <span className="text-[#4F6B54] font-semibold">
                                  Đã mở
                                </span>
                              ) : item.unlockType === 'quest' ? (
                                <span className="text-[#9A6310] font-semibold">
                                  Nhiệm vụ
                                </span>
                              ) : (
                                <span className="font-mono font-bold text-[#D46534]">
                                  {item.priceGp} GP
                                </span>
                              )}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= MÀN HÌNH 5: BẢNG NHIỆM VỤ +GP (QUESTS) ================= */}
        {subTab === 'quests' && (
          <div className="space-y-5">
            <div className="bg-white rounded-[24px] border border-[#E8DFD1] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#D46534]">
                  NHIỆM VỤ CỘNG ĐỒNG · TÍCH ĐIỂM GP
                </p>
                <h2 className="font-display text-2xl font-extrabold text-[#25292E]">
                  Đồng hành cùng cô chú thợ — Mở khóa quà giới hạn
                </h2>
                <p className="text-xs sm:text-sm text-[#615D57]">
                  Mỗi hành động sửa đồ, gửi lời khen hay khám phá góc nghề trên
                  web đều tự động cộng tiến độ nhiệm vụ.
                </p>
              </div>

              <div className="shrink-0 bg-[#F7F2E8] border border-dashed border-[#DFD3C2] rounded-2xl px-4 py-3 text-right">
                <p className="font-mono text-[10px] font-bold uppercase text-[#615D57]">
                  Số dư hiện tại
                </p>
                <p className="font-mono text-2xl font-extrabold tabular-nums text-[#D46534]">
                  {profile.gpBalance}{' '}
                  <span className="text-xs font-bold">GP</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVATAR_QUESTS.map((quest) => {
                const current = getQuestCurrentValue(profile, quest.id);
                const completed = isQuestCompleted(profile, quest.id);
                const claimed = isQuestClaimed(profile, quest.id);
                const canClaim = completed && !claimed;
                const percent = Math.min(
                  100,
                  Math.round((current / quest.target) * 100)
                );
                const bonusItem = quest.unlockItemId
                  ? getAvatarItemById(quest.unlockItemId)
                  : undefined;
                const justClaimed = recentClaimedQuestId === quest.id;

                return (
                  <div
                    key={quest.id}
                    className={`rounded-[22px] border p-5 bg-white flex flex-col justify-between gap-4 transition-all ${
                      canClaim
                        ? 'border-[#D46534] ring-2 ring-[#D46534]/15 shadow-sm'
                        : claimed
                          ? 'border-[#4F6B54]/35 bg-[#FAFCF9]'
                          : 'border-[#E8DFD1]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider">
                            <span className="text-[#1B3B82]">
                              {quest.categoryLabel}
                            </span>
                            <span className="text-[#C7B9A5]">·</span>
                            <span className="text-[#D46534]">
                              +{quest.gpReward} GP
                            </span>
                          </div>
                          <h3 className="font-display text-base font-extrabold text-[#25292E]">
                            {quest.title}
                          </h3>
                        </div>

                        {bonusItem && (
                          <button
                            type="button"
                            onClick={() => setSelectedDetailItem(bonusItem)}
                            title={`Xem vật phẩm tặng kèm: ${bonusItem.name}`}
                            className="shrink-0 w-14 h-14 rounded-2xl bg-[#FBF8F1] border border-[#E8DFD1] hover:border-[#D46534] flex items-center justify-center transition-colors"
                          >
                            <AvatarItemSwatch item={bonusItem} size="sm" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-[#615D57] leading-relaxed">
                        {quest.description}
                      </p>

                      {bonusItem && (
                        <button
                          type="button"
                          onClick={() => setSelectedDetailItem(bonusItem)}
                          className="text-[11px] font-semibold text-[#9A6310] hover:underline inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Tặng kèm đồ giới hạn: {bonusItem.name}</span>
                        </button>
                      )}

                      {/* Tiến độ */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#615D57]">Tiến độ</span>
                          <span className="font-mono font-bold tabular-nums text-[#25292E]">
                            {current}/{quest.target}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#EFE7D7] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: claimed
                                ? '#4F6B54'
                                : canClaim
                                  ? '#D46534'
                                  : '#1B3B82',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-dashed border-[#DFD3C2] flex items-center justify-between gap-3">
                      {claimed ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F6B54]">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {justClaimed
                              ? 'Đã nhận thưởng thành công!'
                              : 'Đã hoàn thành & nhận thưởng'}
                          </span>
                        </span>
                      ) : canClaim ? (
                        <button
                          type="button"
                          onClick={() => handleClaimQuestWithFeedback(quest.id)}
                          className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#D46534] hover:bg-[#B93818] text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
                        >
                          <Coins className="w-4 h-4" />
                          <span>
                            Nhận thưởng +{quest.gpReward} GP
                            {bonusItem ? ` & ${bonusItem.name}` : ''}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuestAction(quest.actionRoute)}
                          className="w-full min-h-[40px] px-4 py-2 rounded-xl bg-[#F7F2E8] hover:bg-[#EFE7D7] text-[#1B3B82] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span>{quest.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= MÀN HÌNH 7: THÀNH TÍCH & DANH HIỆU ================= */}
        {subTab === 'achievements' && (
          <div className="space-y-5">
            <div className="bg-white rounded-[24px] border border-[#E8DFD1] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#D46534]">
                  DANH HIỆU ĐANG ĐEO TRÊN THẺ AVATAR
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2
                    className="font-display text-2xl font-extrabold"
                    style={{ color: activeTitle.accentHex }}
                  >
                    {activeTitle.title}
                  </h2>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#F7F2E8] border border-[#E8DFD1] text-[#25292E]">
                    {activeTitle.badgeCode}
                  </span>
                </div>
                <p className="font-serif-editorial italic text-sm text-[#615D57]">
                  {activeTitle.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B3B82] hover:bg-[#152F68] text-[#F7F2E8] text-xs font-bold transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>In lên thẻ chia sẻ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVATAR_ACHIEVEMENTS.map((ach) => {
                const unlocked = unlockedAchievementIds.includes(ach.id);
                const equipped = profile.equippedTitleId === ach.id;

                return (
                  <div
                    key={ach.id}
                    className={`rounded-[22px] border p-5 flex flex-col justify-between gap-4 transition-all ${
                      equipped
                        ? 'bg-white border-[#1B3B82] ring-2 ring-[#1B3B82]/15'
                        : unlocked
                          ? 'bg-white border-[#E8DFD1]'
                          : 'bg-[#FAF6EE] border-dashed border-[#DFD3C2] opacity-80'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="font-mono text-[11px] font-extrabold tracking-widest px-2.5 py-1 rounded-lg text-white"
                          style={{
                            backgroundColor: unlocked
                              ? ach.accentHex
                              : '#9E9689',
                          }}
                        >
                          {ach.badgeCode}
                        </span>
                        {unlocked ? (
                          <span className="text-[11px] font-bold text-[#4F6B54] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã mở</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#615D57] inline-flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Chưa mở</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-lg font-extrabold text-[#25292E]">
                        {ach.title}
                      </h3>
                      <p className="text-xs text-[#615D57] leading-relaxed">
                        {ach.description}
                      </p>
                      <p className="text-[11px] font-semibold text-[#615D57] pt-1 border-t border-dashed border-[#DFD3C2]">
                        Điều kiện: {ach.requirementText}
                      </p>
                    </div>

                    <div>
                      {unlocked ? (
                        <button
                          type="button"
                          disabled={equipped}
                          onClick={() => onEquipTitle(ach.id)}
                          className={`w-full min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                            equipped
                              ? 'bg-[#ECF3ED] text-[#4F6B54] cursor-default'
                              : 'bg-[#1B3B82] hover:bg-[#152F68] text-[#F7F2E8]'
                          }`}
                        >
                          {equipped ? 'Đang đeo danh hiệu này' : 'Đeo danh hiệu'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSubTab('quests')}
                          className="w-full min-h-[40px] px-4 py-2 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#D46534] text-[#D46534] text-xs font-bold transition-colors"
                        >
                          Đi làm nhiệm vụ →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================= MÀN HÌNH 6: CHI TIẾT VẬT PHẨM & MỞ KHÓA ================= */}
      <RewardDetailModal
        item={selectedDetailItem}
        owned={
          selectedDetailItem ? ownedSet.has(selectedDetailItem.id) : false
        }
        equipped={
          selectedDetailItem
            ? equippedIds.includes(selectedDetailItem.id)
            : false
        }
        gpBalance={profile.gpBalance}
        onClose={() => setSelectedDetailItem(null)}
        onTryOn={(item) => {
          applyItemToDraft(item, false);
          setSelectedDetailItem(null);
          setSubTab('creator');
          setCreatorSlot(item.slot);
          onShowToast(`Đang mặc thử "${item.name}" trên nhân vật của bạn!`);
        }}
        onUnlockWithGp={(item) => {
          onUnlockItemWithGp(item.id);
          applyItemToDraft(item, false);
          setSelectedDetailItem(null);
        }}
        onGoToQuests={() => {
          setSelectedDetailItem(null);
          setSubTab('quests');
        }}
      />

      {/* ================= MÀN HÌNH 8: CHIA SẺ AVATAR PNG SẮC NÉT ================= */}
      <ShareAvatarModal
        isOpen={isShareOpen}
        config={draftConfig}
        displayName={displayName}
        equippedTitleId={profile.equippedTitleId}
        gpBalance={profile.gpBalance}
        ownedCount={ownedCollectibleCount}
        onClose={() => setIsShareOpen(false)}
        onDownloaded={() =>
          onShowToast('Đã tải ảnh thẻ Góc Thợ Avatar PNG sắc nét!')
        }
      />
    </div>
  );
}
