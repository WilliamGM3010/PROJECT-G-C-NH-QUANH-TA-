import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Coins,
  Compass,
  Grid,
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
  HAIR_COLORS,
  SKIN_TONES,
  STUDIO_BACKGROUNDS,
} from '../../data/avatarCatalog';
import {
  countClaimableQuests,
  evaluateUnlockedAchievements,
  getQuestCurrentValue,
  isQuestClaimed,
  isQuestCompleted,
} from '../../services/avatarService';
import type { AdminAccount, AppTab } from '../../types/artisan';
import type {
  AvatarCollectionId,
  AvatarConfig,
  AvatarItem,
  AvatarProfile,
  AvatarQuestId,
  AvatarSlot,
  AvatarSubTab,
} from '../../types/avatar';
import { AvatarItemSwatch } from './AvatarItemSwatch';
import { ChibiAvatar3D, type ChibiAvatar3DHandle } from './ChibiAvatar3D';
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
  { id: 'skin', label: 'Màu da' },
  { id: 'face', label: 'Biểu cảm' },
  { id: 'hair', label: 'Kiểu tóc' },
  { id: 'top', label: 'Áo' },
  { id: 'bottom', label: 'Quần / Váy' },
  { id: 'shoes', label: 'Giày dép' },
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
  const [creatorSlot, setCreatorSlot] = useState<AvatarSlot>('hair');
  const [wardrobeSlotFilter, setWardrobeSlotFilter] = useState<
    AvatarSlot | 'all'
  >('all');
  const [wardrobeOwnershipFilter, setWardrobeOwnershipFilter] = useState<
    'owned' | 'all'
  >('owned');
  const [activeCollectionFilter, setActiveCollectionFilter] = useState<
    AvatarCollectionId | 'all'
  >('all');
  const [detailItem, setDetailItem] = useState<AvatarItem | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareSnapshot, setShareSnapshot] = useState<string | null>(
    profile.snapshotDataUrl
  );
  const [isSaving, setIsSaving] = useState(false);
  const [recentCelebration, setRecentCelebration] = useState<string | null>(
    null
  );

  const stageRef = useRef<ChibiAvatar3DHandle | null>(null);

  // Sync draft when saved profile changes (e.g. login switches profile)
  const prevProfileKeyRef = useRef<string>(profile.userKey);
  if (prevProfileKeyRef.current !== profile.userKey) {
    prevProfileKeyRef.current = profile.userKey;
    setDraftConfig(profile.avatarConfig);
  }

  const ownedSet = useMemo(
    () => new Set(profile.ownedItemIds),
    [profile.ownedItemIds]
  );

  const unlockedAchievements = useMemo(
    () => evaluateUnlockedAchievements(profile),
    [profile]
  );

  const claimableCount = useMemo(
    () => countClaimableQuests(profile),
    [profile]
  );

  const totalUnlockableItems = useMemo(
    () => AVATAR_ITEMS.filter((i) => !i.comingSoon).length,
    []
  );

  const displayName =
    currentUser?.displayName || currentUser?.name || 'Bạn trẻ Sài Gòn';
  const equippedTitle = getAchievementById(profile.equippedTitleId);

  // Check if draft currently tries on any locked items
  const lockedTryOnItems = useMemo(() => {
    const equippedIds = getEquippedItemIds(draftConfig);
    return equippedIds
      .filter((id) => !ownedSet.has(id))
      .map((id) => getAvatarItemById(id))
      .filter((item): item is AvatarItem => Boolean(item));
  }, [draftConfig, ownedSet]);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(draftConfig) !== JSON.stringify(profile.avatarConfig),
    [draftConfig, profile.avatarConfig]
  );

  const applyItemToDraft = useCallback((item: AvatarItem) => {
    if (item.comingSoon) return;
    setDraftConfig((prev) => {
      if (item.slot === 'hair') {
        return { ...prev, hairId: item.id as AvatarConfig['hairId'] };
      }
      if (item.slot === 'top') {
        return { ...prev, topId: item.id };
      }
      if (item.slot === 'bottom') {
        return { ...prev, bottomId: item.id };
      }
      if (item.slot === 'shoes') {
        return { ...prev, shoesId: item.id };
      }
      if (item.slot === 'accessory') {
        const exists = prev.accessoryIds.includes(item.id);
        if (exists) {
          return {
            ...prev,
            accessoryIds: prev.accessoryIds.filter((id) => id !== item.id),
          };
        }
        // Only replace accessories in the same physical layer (e.g., headwear: beanie vs cap vs non la)
        const targetLayer = item.modelConfig.layer;
        const filtered = prev.accessoryIds.filter((existingId) => {
          const existingItem = getAvatarItemById(existingId);
          return !targetLayer || existingItem?.modelConfig.layer !== targetLayer;
        });
        return {
          ...prev,
          accessoryIds: [...filtered, item.id],
        };
      }
      return prev;
    });
  }, []);

  const handleRevertLockedTryOns = useCallback(() => {
    setDraftConfig((prev) => ({
      ...prev,
      hairId: ownedSet.has(prev.hairId)
        ? prev.hairId
        : profile.avatarConfig.hairId,
      topId: ownedSet.has(prev.topId) ? prev.topId : profile.avatarConfig.topId,
      bottomId: ownedSet.has(prev.bottomId)
        ? prev.bottomId
        : profile.avatarConfig.bottomId,
      shoesId: ownedSet.has(prev.shoesId)
        ? prev.shoesId
        : profile.avatarConfig.shoesId,
      accessoryIds: prev.accessoryIds.filter((id) => ownedSet.has(id)),
    }));
    onShowToast('Đã hoàn tác các món đang mặc thử về đồ đã sở hữu.');
  }, [ownedSet, profile.avatarConfig, onShowToast]);

  const handleRandomizeOwned = useCallback(() => {
    const pick = <T,>(arr: T[]): T =>
      arr[Math.floor(Math.random() * arr.length)];
    const ownedHairs = AVATAR_ITEMS.filter(
      (i) => i.slot === 'hair' && ownedSet.has(i.id)
    );
    const ownedTops = AVATAR_ITEMS.filter(
      (i) => i.slot === 'top' && ownedSet.has(i.id)
    );
    const ownedBottoms = AVATAR_ITEMS.filter(
      (i) => i.slot === 'bottom' && ownedSet.has(i.id)
    );
    const ownedShoes = AVATAR_ITEMS.filter(
      (i) => i.slot === 'shoes' && ownedSet.has(i.id)
    );
    const ownedAccs = AVATAR_ITEMS.filter(
      (i) => i.slot === 'accessory' && ownedSet.has(i.id)
    );

    const pickedAccs: string[] = [];
    if (ownedAccs.length > 0 && Math.random() > 0.25) {
      const a1 = pick(ownedAccs);
      pickedAccs.push(a1.id);
      if (ownedAccs.length > 1 && Math.random() > 0.5) {
        const diffLayer = ownedAccs.filter(
          (a) => a.modelConfig.layer !== a1.modelConfig.layer
        );
        if (diffLayer.length > 0) {
          pickedAccs.push(pick(diffLayer).id);
        }
      }
    }

    setDraftConfig({
      skinId: pick(SKIN_TONES).id,
      faceId: pick(FACE_EXPRESSIONS).id,
      hairId: (ownedHairs.length > 0
        ? pick(ownedHairs).id
        : 'fluffy_curls') as AvatarConfig['hairId'],
      hairColorId: pick(HAIR_COLORS).id,
      topId: ownedTops.length > 0 ? pick(ownedTops).id : 'basic_tee',
      bottomId:
        ownedBottoms.length > 0 ? pick(ownedBottoms).id : 'active_shorts',
      shoesId:
        ownedShoes.length > 0 ? pick(ownedShoes).id : 'chunky_sneakers',
      accessoryIds: pickedAccs,
      studioBgId: pick(STUDIO_BACKGROUNDS).id,
    });
  }, [ownedSet]);

  const handleSaveNow = useCallback(
    async (requireAccountSync = false) => {
      if (lockedTryOnItems.length > 0) {
        setDetailItem(lockedTryOnItems[0]);
        onShowToast(
          `Hãy mở khóa "${lockedTryOnItems[0].name}" hoặc bỏ mặc thử trước khi lưu nhé!`
        );
        return;
      }

      if (requireAccountSync && !currentUser) {
        onRequestLogin(
          'Đăng nhập nhanh trong 5 giây để lưu Góc Thợ Avatar, điểm GP và Tủ đồ lên tài khoản của bạn nhé!'
        );
        return;
      }

      setIsSaving(true);
      try {
        const snapshot =
          stageRef.current?.captureSnapshot({
            transparent: false,
            width: 320,
            height: 320,
          }) ?? profile.snapshotDataUrl;
        await onSaveAvatarConfig(draftConfig, snapshot, requireAccountSync);
      } finally {
        setIsSaving(false);
      }
    },
    [
      lockedTryOnItems,
      currentUser,
      onRequestLogin,
      onSaveAvatarConfig,
      draftConfig,
      profile.snapshotDataUrl,
      onShowToast,
    ]
  );

  const handleOpenShareModal = useCallback(() => {
    const freshSnap = stageRef.current?.captureSnapshot({
      transparent: true,
      width: 900,
      height: 900,
    });
    setShareSnapshot(freshSnap ?? profile.snapshotDataUrl);
    setShareModalOpen(true);
  }, [profile.snapshotDataUrl]);

  const handleEquipDirectlyFromWardrobe = useCallback(
    async (item: AvatarItem) => {
      if (!ownedSet.has(item.id)) {
        setDetailItem(item);
        return;
      }
      applyItemToDraft(item);
      setSubTab('creator');
      setCreatorSlot(item.slot);
      onShowToast(`Đã mặc "${item.name}" lên nhân vật — bấm Lưu để cập nhật!`);
    },
    [ownedSet, applyItemToDraft, onShowToast]
  );

  const handleTryOnFromModal = useCallback(
    (item: AvatarItem) => {
      applyItemToDraft(item);
      setSubTab('creator');
      setCreatorSlot(item.slot);
      if (!ownedSet.has(item.id)) {
        onShowToast(`Đang mặc thử "${item.name}" lên nhân vật 3D!`);
      }
    },
    [applyItemToDraft, ownedSet, onShowToast]
  );

  const handleClaimQuestWithCelebration = useCallback(
    (questId: AvatarQuestId) => {
      const quest = AVATAR_QUESTS.find((q) => q.id === questId);
      onClaimQuest(questId);
      if (quest) {
        setRecentCelebration(
          `+${quest.gpReward} GP từ "${quest.title}"${
            quest.unlockItemId
              ? ` + Mở khóa "${getAvatarItemById(quest.unlockItemId)?.name}"!`
              : '!'
          }`
        );
        window.setTimeout(() => {
          setRecentCelebration((prev) =>
            prev?.includes(quest.title) ? null : prev
          );
        }, 4500);
      }
    },
    [onClaimQuest]
  );

  const handleUnlockWithCelebration = useCallback(
    (item: AvatarItem) => {
      onUnlockItemWithGp(item.id);
      applyItemToDraft(item);
      setRecentCelebration(`Đã mở khóa "${item.name}" vào Tủ đồ của bạn!`);
      window.setTimeout(() => {
        setRecentCelebration((prev) =>
          prev?.includes(item.name) ? null : prev
        );
      }, 4200);
    },
    [onUnlockItemWithGp, applyItemToDraft]
  );

  const slotItems = useMemo(
    () =>
      AVATAR_ITEMS.filter(
        (item) => item.slot === creatorSlot && !item.comingSoon
      ),
    [creatorSlot]
  );

  const wardrobeItems = useMemo(() => {
    return AVATAR_ITEMS.filter((item) => {
      if (item.comingSoon) return false;
      if (wardrobeOwnershipFilter === 'owned' && !ownedSet.has(item.id)) {
        return false;
      }
      if (wardrobeSlotFilter !== 'all' && item.slot !== wardrobeSlotFilter) {
        return false;
      }
      return true;
    });
  }, [wardrobeOwnershipFilter, wardrobeSlotFilter, ownedSet]);

  const isItemEquippedInDraft = (item: AvatarItem): boolean => {
    if (item.slot === 'hair') return draftConfig.hairId === item.id;
    if (item.slot === 'top') return draftConfig.topId === item.id;
    if (item.slot === 'bottom') return draftConfig.bottomId === item.id;
    if (item.slot === 'shoes') return draftConfig.shoesId === item.id;
    if (item.slot === 'accessory')
      return draftConfig.accessoryIds.includes(item.id);
    return false;
  };

  const activeHairColorHex = getHairColorById(draftConfig.hairColorId).hex;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-16 space-y-6">
      {/* Top Studio Header & Sub-Navigation */}
      <section className="rounded-3xl bg-white border border-[#E8DFD1] p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#D46534]">
              THE NEIGHBORHOOD CRAFT · CHIBI 3D STUDIO
            </p>
            <h1 className="font-display text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#25292E]">
              Góc Thợ Avatar
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* GP Balance pill */}
            <button
              type="button"
              onClick={() => setSubTab('quests')}
              className="inline-flex items-center gap-2 h-10 px-3.5 rounded-2xl bg-[#FDF5E2] hover:bg-[#F9EBC8] border border-[#E6C77A] text-[#7A4E0A] transition-colors"
              title="Xem bảng nhiệm vụ kiếm thêm Điểm Góc (GP)"
            >
              <Coins className="w-4 h-4 text-[#C28114]" />
              <span className="font-mono text-sm font-extrabold tabular-nums">
                {profile.gpBalance} GP
              </span>
              <span className="text-[11px] font-semibold text-[#8C6423] hidden sm:inline">
                Điểm Góc
              </span>
            </button>

            <button
              type="button"
              onClick={handleOpenShareModal}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-[#1B3B82] hover:bg-[#142D66] text-[#F7F2E8] text-xs sm:text-sm font-bold transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Xuất thẻ PNG</span>
            </button>
          </div>
        </div>

        {/* Sub-tab bar */}
        <div
          role="tablist"
          aria-label="Khu vực Góc Thợ Avatar"
          className="flex items-center gap-1.5 overflow-x-auto pb-0.5 thin-scrollbar border-t border-dashed border-[#E8DFD1] pt-3.5"
        >
          {SUB_TABS.map(({ id, label, Icon }) => {
            const active = subTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSubTab(id)}
                className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? 'bg-[#25292E] text-[#F7F2E8] shadow-2xs'
                    : 'bg-[#F7F2E8] text-[#615D57] hover:text-[#25292E] hover:bg-[#EFE8DA]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {id === 'quests' && claimableCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[#D46534] text-white font-mono text-[10px] leading-none font-extrabold">
                    {claimableCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Celebration banner when unlocking item or claiming quest */}
      {recentCelebration && (
        <div className="rounded-2xl bg-[#EEF4EF] border border-[#4F6B54]/30 px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-[#2D4A33]">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D46534] shrink-0" />
            <span>{recentCelebration}</span>
          </span>
          <button
            type="button"
            onClick={() => setRecentCelebration(null)}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Đóng
          </button>
        </div>
      )}

      {/* =======================================================
          SCREEN 1: AVATAR HOME (TỔNG QUAN)
          ======================================================= */}
      {subTab === 'home' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: 3D Interactive Showcase */}
          <div className="lg:col-span-7 rounded-3xl bg-white border border-[#E8DFD1] p-2.5 shadow-xs">
            <div className="relative h-[380px] sm:h-[460px] rounded-[20px] overflow-hidden">
              <ChibiAvatar3D
                ref={stageRef}
                config={draftConfig}
                interactive
                autoRotate
              />
            </div>

            <div className="mt-2.5 px-2 pb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[#615D57]">
              <span>Kéo xoay 360° hoặc phóng to để ngắm nhân vật của bạn</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stageRef.current?.resetCamera()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F7F2E8] hover:bg-[#EFE7D7] text-[#25292E] font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Góc chuẩn</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenShareModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FDF0E9] hover:bg-[#F9E1D3] text-[#B93818] font-semibold transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Tạo thẻ chia sẻ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Editorial Profile & Actions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-white border border-[#E8DFD1] p-6 space-y-5 shadow-2xs">
              <div className="space-y-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border"
                  style={{
                    color: equippedTitle.accentHex,
                    backgroundColor: '#FBF8F2',
                    borderColor: `${equippedTitle.accentHex}44`,
                  }}
                >
                  <Award className="w-3.5 h-3.5" />
                  {equippedTitle.badgeCode} · {equippedTitle.title}
                </span>

                <h2 className="font-display text-2xl font-extrabold text-[#25292E]">
                  {displayName}
                </h2>
                <p className="text-xs sm:text-sm text-[#615D57] leading-relaxed">
                  Nhân vật Chibi 3D đại diện cho hành trình khám phá các góc thợ
                  thủ công và lối sống xanh bền vững tại TP.HCM.
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl bg-[#F7F2E8] border border-[#E8DFD1] p-3 text-center">
                  <p className="font-mono text-lg font-extrabold text-[#9A6310] tabular-nums">
                    {profile.gpBalance}
                  </p>
                  <p className="text-[11px] font-semibold text-[#615D57]">
                    Điểm GP
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F7F2E8] border border-[#E8DFD1] p-3 text-center">
                  <p className="font-mono text-lg font-extrabold text-[#1B3B82] tabular-nums">
                    {profile.ownedItemIds.length}/{totalUnlockableItems}
                  </p>
                  <p className="text-[11px] font-semibold text-[#615D57]">
                    Tủ đồ
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F7F2E8] border border-[#E8DFD1] p-3 text-center">
                  <p className="font-mono text-lg font-extrabold text-[#4F6B54] tabular-nums">
                    {profile.claimedQuestIds.length}/{AVATAR_QUESTS.length}
                  </p>
                  <p className="text-[11px] font-semibold text-[#615D57]">
                    Nhiệm vụ
                  </p>
                </div>
              </div>

              {/* Main CTAs */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setSubTab('creator')}
                  className="w-full min-h-[46px] px-5 py-3 rounded-2xl bg-[#D46534] hover:bg-[#BC5326] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Tùy chỉnh nhân vật 3D</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSubTab('wardrobe')}
                    className="min-h-[42px] px-3 py-2.5 rounded-2xl bg-[#F7F2E8] hover:bg-[#EFE7D7] border border-[#E8DFD1] text-xs sm:text-sm font-bold text-[#25292E] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Shirt className="w-4 h-4 text-[#1B3B82]" />
                    <span>Mở Tủ đồ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab('collections')}
                    className="min-h-[42px] px-3 py-2.5 rounded-2xl bg-[#F7F2E8] hover:bg-[#EFE7D7] border border-[#E8DFD1] text-xs sm:text-sm font-bold text-[#25292E] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Layers className="w-4 h-4 text-[#D46534]" />
                    <span>5 Bộ sưu tập</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quest Highlight Card */}
            <div className="rounded-3xl bg-[#FBF8F2] border border-[#E8DFD1] p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#1B3B82]">
                  {claimableCount > 0
                    ? `CÓ ${claimableCount} PHẦN THƯỞNG CHỜ NHẬN`
                    : 'KIẾM THÊM ĐIỂM GÓC (GP)'}
                </p>
                <button
                  type="button"
                  onClick={() => setSubTab('quests')}
                  className="text-xs font-bold text-[#D46534] hover:underline inline-flex items-center gap-1"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-[#615D57] leading-relaxed">
                Khám phá góc thợ, gửi lời khen hoặc hồi sinh món đồ cũ trên bản
                đồ để nhận GP mở khóa Áo Dài, Nón Lá, Tạp Dề Thợ và Áo Khoác
                Giới Hạn.
              </p>
            </div>

            {/* Soft Auth sync invitation for guests */}
            {!currentUser && (
              <div className="rounded-2xl bg-[#EEF2FA] border border-[#1B3B82]/20 p-4 flex items-center justify-between gap-3">
                <div className="text-xs text-[#2B3D61] leading-snug">
                  <strong className="font-bold text-[#1B3B82]">
                    Chế độ khách:
                  </strong>{' '}
                  Tiến trình đang được lưu trên máy này. Đăng nhập để đồng bộ
                  tài khoản mọi nơi.
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onRequestLogin(
                      'Đăng nhập nhanh để đồng bộ nhân vật Chibi 3D, điểm GP và Tủ đồ lên tài khoản cá nhân nhé!'
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-[#1B3B82] hover:bg-[#142D66] text-white text-xs font-bold whitespace-nowrap shrink-0 transition-colors"
                >
                  Đăng nhập
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          SCREEN 2: AVATAR CREATOR (52/48 DESKTOP · STICKY 44VH MOBILE)
          ======================================================= */}
      {subTab === 'creator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 52% (~6.2 cols -> 6 cols) Sticky 3D Stage */}
          <div className="lg:col-span-6 lg:sticky lg:top-4 space-y-3 z-10">
            <div className="rounded-3xl bg-white border border-[#E8DFD1] p-2.5 shadow-xs space-y-2.5">
              {/* Top Stage Controls Bar (placed outside canvas to keep WebGL clean) */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#615D57]" />
                  {STUDIO_BACKGROUNDS.map((bg) => {
                    const active = draftConfig.studioBgId === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            studioBgId: bg.id,
                          }))
                        }
                        title={`Nền: ${bg.name}`}
                        aria-label={`Chọn phông nền ${bg.name}`}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          active
                            ? 'border-[#1B3B82] scale-110'
                            : 'border-white shadow-2xs hover:scale-105'
                        }`}
                        style={{ background: bg.cssGradient }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRandomizeOwned}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F7F2E8] hover:bg-[#EFE7D7] text-[#25292E] text-xs font-semibold transition-colors"
                    title="Phối ngẫu nhiên đồ đã sở hữu"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-[#D46534]" />
                    <span>Ngẫu nhiên</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => stageRef.current?.resetCamera()}
                    className="w-8 h-8 rounded-xl bg-[#F7F2E8] hover:bg-[#EFE7D7] text-[#25292E] flex items-center justify-center transition-colors"
                    title="Đặt lại góc nhìn"
                    aria-label="Đặt lại góc nhìn"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenShareModal}
                    className="w-8 h-8 rounded-xl bg-[#EEF2FA] hover:bg-[#DCE6F7] text-[#1B3B82] flex items-center justify-center transition-colors"
                    title="Xuất thẻ chia sẻ PNG"
                    aria-label="Xuất thẻ chia sẻ PNG"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3D Canvas Container */}
              <div className="h-[42vh] min-h-[300px] lg:h-[500px] rounded-[20px] overflow-hidden">
                <ChibiAvatar3D
                  ref={stageRef}
                  config={draftConfig}
                  interactive
                  autoRotate={false}
                />
              </div>

              {/* Locked Try-On Alert Bar */}
              {lockedTryOnItems.length > 0 && (
                <div className="rounded-2xl bg-[#FDF5E2] border border-[#E6C77A] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#7A4E0A] inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Đang mặc thử{' '}
                      <strong>{lockedTryOnItems.length} món</strong> chưa mở
                      khóa
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDetailItem(lockedTryOnItems[0])}
                      className="px-2.5 py-1 rounded-lg bg-[#D46534] text-white font-bold hover:bg-[#BC5326] transition-colors"
                    >
                      Mở khóa
                    </button>
                    <button
                      type="button"
                      onClick={handleRevertLockedTryOns}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E6C77A] text-[#7A4E0A] font-semibold hover:bg-[#FBF6E8] transition-colors"
                    >
                      Bỏ mặc thử
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right 48% (~6 cols) Customization Panel */}
          <div className="lg:col-span-6 rounded-3xl bg-white border border-[#E8DFD1] p-4 sm:p-5 shadow-xs space-y-5">
            {/* 7 Slot Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 thin-scrollbar">
              {CREATOR_TABS.map(({ id, label }) => {
                const active = creatorSlot === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCreatorSlot(id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
                      active
                        ? 'bg-[#1B3B82] text-[#F7F2E8]'
                        : 'bg-[#F7F2E8] text-[#615D57] hover:text-[#25292E]'
                    }`}
                  >
                    {label}
                    {id === 'accessory' && draftConfig.accessoryIds.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#D46534] text-white font-mono text-[10px]">
                        {draftConfig.accessoryIds.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Slot Content */}
            <div className="min-h-[340px] space-y-4">
              {/* SKIN TONES */}
              {creatorSlot === 'skin' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#615D57]">
                    Chọn tông da vinyl mịn màng cho nhân vật của bạn:
                  </p>
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
                          className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                            selected
                              ? 'border-[#1B3B82] bg-[#EEF2FA] ring-2 ring-[#1B3B82]/15'
                              : 'border-[#E8DFD1] bg-[#FBF8F2] hover:border-[#CBBFA9]'
                          }`}
                        >
                          <span
                            className="w-9 h-9 rounded-full border-2 border-white shadow-sm shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: tone.hex }}
                          >
                            {selected && (
                              <Check className="w-4 h-4 text-[#1B3B82]" />
                            )}
                          </span>
                          <span className="text-xs font-bold text-[#25292E]">
                            {tone.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FACE EXPRESSIONS */}
              {creatorSlot === 'face' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#615D57]">
                    Chọn thần thái gương mặt Chibi 3D:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FACE_EXPRESSIONS.map((expr) => {
                      const selected = draftConfig.faceId === expr.id;
                      return (
                        <button
                          key={expr.id}
                          type="button"
                          onClick={() =>
                            setDraftConfig((prev) => ({
                              ...prev,
                              faceId: expr.id,
                            }))
                          }
                          className={`p-3.5 rounded-2xl border text-left transition-all space-y-1.5 ${
                            selected
                              ? 'border-[#1B3B82] bg-[#EEF2FA] ring-2 ring-[#1B3B82]/15'
                              : 'border-[#E8DFD1] bg-[#FBF8F2] hover:border-[#CBBFA9]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-base font-bold text-[#D46534]">
                              {expr.previewBadge}
                            </span>
                            {selected && (
                              <span className="w-5 h-5 rounded-full bg-[#1B3B82] text-white flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-[#25292E]">
                            {expr.name}
                          </p>
                          <p className="text-[11px] text-[#615D57] leading-snug">
                            {expr.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* HAIR COLORS (shown above hair styles) */}
              {creatorSlot === 'hair' && (
                <div className="p-3.5 rounded-2xl bg-[#FBF8F2] border border-[#EAE0D2] space-y-2.5">
                  <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#615D57]">
                    Màu tóc (8 sắc độ)
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {HAIR_COLORS.map((hc) => {
                      const selected = draftConfig.hairColorId === hc.id;
                      return (
                        <button
                          key={hc.id}
                          type="button"
                          onClick={() =>
                            setDraftConfig((prev) => ({
                              ...prev,
                              hairColorId: hc.id,
                            }))
                          }
                          title={hc.name}
                          className={`inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all ${
                            selected
                              ? 'border-[#1B3B82] bg-white text-[#1B3B82] shadow-2xs'
                              : 'border-[#E5DAC8] bg-white/70 text-[#615D57] hover:border-[#CBBFA9]'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: hc.hex }}
                          />
                          <span>{hc.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ACCESSORY MULTI-LAYER HINT */}
              {creatorSlot === 'accessory' && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F7F2E8] border border-[#E8DFD1] text-[11.5px] text-[#615D57]">
                  <span>
                    Có thể phối cùng lúc nhiều lớp (Nón + Kính + Tai nghe + Túi
                    + Khăn choàng).
                  </span>
                  {draftConfig.accessoryIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          accessoryIds: [],
                        }))
                      }
                      className="text-[#B93818] font-bold whitespace-nowrap hover:underline"
                    >
                      Tháo hết
                    </button>
                  )}
                </div>
              )}

              {/* ITEM GRID (Hair / Top / Bottom / Shoes / Accessory) */}
              {creatorSlot !== 'skin' && creatorSlot !== 'face' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {slotItems.map((item) => {
                    const owned = ownedSet.has(item.id);
                    const equipped = isItemEquippedInDraft(item);
                    const rarity = getRarityLabel(item.rarity);

                    return (
                      <div
                        key={item.id}
                        className={`group rounded-2xl border p-3 transition-all flex items-center gap-3 ${
                          equipped
                            ? 'border-[#1B3B82] bg-[#EEF2FA] ring-2 ring-[#1B3B82]/15'
                            : 'border-[#E8DFD1] bg-[#FBF8F2] hover:border-[#CBBFA9] hover:bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => applyItemToDraft(item)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <AvatarItemSwatch
                            item={item}
                            size="md"
                            overrideColor={
                              item.slot === 'hair'
                                ? activeHairColorHex
                                : undefined
                            }
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-xs font-bold text-[#25292E] leading-snug line-clamp-2">
                              {item.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-1">
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${rarity.className}`}
                              >
                                {rarity.label}
                              </span>
                              {owned ? (
                                equipped && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#1B3B82]">
                                    <Check className="w-3 h-3" />
                                    Đang mặc
                                  </span>
                                )
                              ) : item.unlockType === 'gp' && item.gpCost ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FDF5E2] text-[#9A6310] font-mono text-[10px] font-bold">
                                  <Lock className="w-2.5 h-2.5" />
                                  {item.gpCost} GP
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#EEF2FA] text-[#1B3B82] text-[10px] font-bold">
                                  <Lock className="w-2.5 h-2.5" />
                                  Nhiệm vụ
                                </span>
                              )}
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          aria-label={`Xem chi tiết ${item.name}`}
                          className="w-8 h-8 rounded-xl bg-white border border-[#E8DFD1] text-[#615D57] hover:text-[#1B3B82] hover:border-[#1B3B82]/40 flex items-center justify-center shrink-0 transition-colors"
                          title="Xem chi tiết & mở khóa"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="pt-4 border-t border-dashed border-[#DFD3C2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {lockedTryOnItems.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDetailItem(lockedTryOnItems[0])}
                    className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#D46534] hover:bg-[#BC5326] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Mở khóa món đang mặc thử</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRevertLockedTryOns}
                    className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#F7F2E8] hover:bg-[#EFE7D7] border border-[#E8DFD1] text-xs font-bold text-[#25292E]"
                  >
                    Hoàn tác
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleSaveNow(false)}
                    className="flex-1 min-h-[46px] px-5 py-2.5 rounded-2xl bg-[#D46534] hover:bg-[#BC5326] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {isSaving
                        ? 'Đang lưu...'
                        : currentUser
                          ? hasUnsavedChanges
                            ? 'Lưu nhân vật lên tài khoản'
                            : 'Cập nhật ảnh đại diện 3D'
                          : 'Lưu nhân vật trên máy'}
                    </span>
                  </button>

                  {!currentUser && (
                    <button
                      type="button"
                      onClick={() => void handleSaveNow(true)}
                      className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#1B3B82] hover:bg-[#142D66] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Lưu vào tài khoản</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          SCREEN 3: MY WARDROBE (TỦ ĐỒ)
          ======================================================= */}
      {subTab === 'wardrobe' && (
        <section className="rounded-3xl bg-white border border-[#E8DFD1] p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-extrabold text-[#25292E]">
                Tủ đồ của bạn ({profile.ownedItemIds.length}/
                {totalUnlockableItems})
              </h2>
              <p className="text-xs sm:text-sm text-[#615D57] mt-0.5">
                Quản lý tất cả kiểu tóc, trang phục và phụ kiện bạn đã sưu tầm.
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-[#F7F2E8] p-1 border border-[#E8DFD1] self-start">
              <button
                type="button"
                onClick={() => setWardrobeOwnershipFilter('owned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  wardrobeOwnershipFilter === 'owned'
                    ? 'bg-white text-[#1B3B82] shadow-2xs'
                    : 'text-[#615D57]'
                }`}
              >
                Đã sở hữu ({profile.ownedItemIds.length})
              </button>
              <button
                type="button"
                onClick={() => setWardrobeOwnershipFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  wardrobeOwnershipFilter === 'all'
                    ? 'bg-white text-[#1B3B82] shadow-2xs'
                    : 'text-[#615D57]'
                }`}
              >
                Tất cả ({totalUnlockableItems})
              </button>
            </div>
          </div>

          {/* Slot filter bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 thin-scrollbar">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'hair', label: 'Kiểu tóc' },
              { id: 'top', label: 'Áo' },
              { id: 'bottom', label: 'Quần / Váy' },
              { id: 'shoes', label: 'Giày dép' },
              { id: 'accessory', label: 'Phụ kiện' },
            ].map((tab) => {
              const active = wardrobeSlotFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setWardrobeSlotFilter(tab.id as AvatarSlot | 'all')
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-[#25292E] text-[#F7F2E8]'
                      : 'bg-[#F7F2E8] text-[#615D57] hover:text-[#25292E]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {wardrobeItems.map((item) => {
              const owned = ownedSet.has(item.id);
              const equipped = isItemEquippedInDraft(item);
              const rarity = getRarityLabel(item.rarity);

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                    equipped
                      ? 'border-[#1B3B82] bg-[#EEF2FA]/60'
                      : 'border-[#E8DFD1] bg-[#FBF8F2] hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AvatarItemSwatch item={item} size="md" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${rarity.className}`}
                        >
                          {rarity.label}
                        </span>
                        {owned ? (
                          equipped && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#1B3B82] text-white text-[10px] font-bold">
                              Đang mặc
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white border border-[#DFD3C2] text-[#615D57] text-[10px] font-bold">
                            <Lock className="w-2.5 h-2.5" />
                            {item.unlockType === 'gp' && item.gpCost
                              ? `${item.gpCost} GP`
                              : 'Nhiệm vụ'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#25292E] leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-[11.5px] text-[#615D57] line-clamp-2">
                        {item.story}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {owned ? (
                      <button
                        type="button"
                        onClick={() => void handleEquipDirectlyFromWardrobe(item)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                          equipped
                            ? 'bg-white border border-[#1B3B82]/30 text-[#1B3B82]'
                            : 'bg-[#1B3B82] hover:bg-[#142D66] text-white'
                        }`}
                      >
                        {equipped
                          ? item.slot === 'accessory'
                            ? 'Tháo ra'
                            : 'Đang mặc'
                          : 'Mặc ngay'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDetailItem(item)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#D46534] hover:bg-[#BC5326] text-white text-xs font-bold transition-colors"
                      >
                        Xem cách mở khóa
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="py-2 px-3 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#CBBFA9] text-xs font-semibold text-[#25292E] transition-colors"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =======================================================
          SCREEN 4: FASHION COLLECTIONS (5 BỘ SƯU TẬP EDITORIAL)
          ======================================================= */}
      {subTab === 'collections' && (
        <section className="space-y-5">
          {/* Quick filter bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 thin-scrollbar">
            <button
              type="button"
              onClick={() => setActiveCollectionFilter('all')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors ${
                activeCollectionFilter === 'all'
                  ? 'bg-[#25292E] text-white border-[#25292E]'
                  : 'bg-white text-[#615D57] border-[#E8DFD1] hover:text-[#25292E]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Tất cả 5 bộ sưu tập</span>
            </button>
            {AVATAR_COLLECTIONS.map((col) => {
              const active = activeCollectionFilter === col.id;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setActiveCollectionFilter(col.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors ${
                    active
                      ? 'bg-[#1B3B82] text-white border-[#1B3B82]'
                      : 'bg-white text-[#615D57] border-[#E8DFD1] hover:text-[#25292E]'
                  }`}
                >
                  {col.name}
                </button>
              );
            })}
          </div>

          {/* Magazine Collection Sections */}
          {AVATAR_COLLECTIONS.filter(
            (col) =>
              activeCollectionFilter === 'all' ||
              col.id === activeCollectionFilter
          ).map((col) => {
            const colItems = AVATAR_ITEMS.filter(
              (i) => i.collection === col.id
            );
            const unlockableInCol = colItems.filter((i) => !i.comingSoon);
            const ownedInCol = unlockableInCol.filter((i) =>
              ownedSet.has(i.id)
            ).length;
            const progressPct =
              unlockableInCol.length > 0
                ? Math.round((ownedInCol / unlockableInCol.length) * 100)
                : 0;

            return (
              <article
                key={col.id}
                className="rounded-3xl bg-white border border-[#E8DFD1] overflow-hidden shadow-2xs"
              >
                <div
                  className="p-5 sm:p-6 border-b border-dashed border-[#E5DAC8] flex flex-col md:flex-row md:items-end justify-between gap-4"
                  style={{ backgroundColor: col.surfaceTint }}
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full font-mono text-[10.5px] font-bold uppercase tracking-wider bg-white border"
                        style={{
                          color: col.accentColor,
                          borderColor: `${col.accentColor}44`,
                        }}
                      >
                        {col.vietnameseTag}
                      </span>
                      <span className="text-[11px] font-bold text-[#615D57]">
                        · {col.badgeText}
                      </span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-extrabold text-[#25292E]">
                      {col.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4A4E55] leading-relaxed">
                      {col.story}
                    </p>
                  </div>

                  {/* Completion meter */}
                  <div className="min-w-[180px] rounded-2xl bg-white/90 border border-[#E8DFD1] p-3 space-y-1.5 shrink-0">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#615D57]">Tiến độ sưu tầm</span>
                      <span
                        className="font-mono tabular-nums"
                        style={{ color: col.accentColor }}
                      >
                        {ownedInCol}/{unlockableInCol.length}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EFE9DD] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: col.accentColor,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Items in this collection */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {colItems.map((item) => {
                    const owned = ownedSet.has(item.id);
                    const rarity = getRarityLabel(item.rarity);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDetailItem(item)}
                        className="group text-left rounded-2xl border border-[#E8DFD1] bg-[#FBF8F2] hover:bg-white hover:border-[#1B3B82]/40 p-3.5 flex items-center gap-3.5 transition-all"
                      >
                        <AvatarItemSwatch item={item} size="md" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${rarity.className}`}
                            >
                              {rarity.label}
                            </span>
                            {item.comingSoon ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#FBECE8] text-[#B93818] text-[10px] font-bold">
                                {item.comingSoonNote || 'Sắp ra mắt'}
                              </span>
                            ) : owned ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#4F6B54]">
                                <CheckCircle2 className="w-3 h-3" />
                                Đã có
                              </span>
                            ) : item.unlockType === 'gp' && item.gpCost ? (
                              <span className="inline-flex items-center gap-0.5 font-mono text-[10.5px] font-bold text-[#9A6310]">
                                <Coins className="w-3 h-3" />
                                {item.gpCost} GP
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#1B3B82]">
                                <Lock className="w-3 h-3" />
                                Độc quyền nhiệm vụ
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-[13px] font-bold text-[#25292E] group-hover:text-[#1B3B82] transition-colors line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-[#615D57] line-clamp-1">
                            {item.story}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* =======================================================
          SCREEN 5: QUEST BOARD (NHIỆM VỤ & ĐIỂM GÓC GP)
          ======================================================= */}
      {subTab === 'quests' && (
        <section className="space-y-5">
          <div className="rounded-3xl bg-[#1B3B82] text-[#F7F2E8] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#F5C451]">
                BẢNG NHIỆM VỤ CỘNG ĐỒNG · GÓC POINTS (GP)
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold">
                Hành động thật trên bản đồ — Mở khóa tủ đồ 3D
              </h2>
              <p className="text-xs sm:text-sm text-[#D6E0F5] leading-relaxed">
                Mỗi lần bạn ghé xem hồ sơ cô chú thợ, xác nhận hồi sinh món đồ
                cũ, gửi lời khen hay giới thiệu góc thợ mới, tiến độ nhiệm vụ tự
                động cập nhật theo thời gian thực.
              </p>
            </div>

            <div className="rounded-2xl bg-white/12 border border-white/20 px-5 py-3.5 text-center shrink-0">
              <p className="font-mono text-2xl font-extrabold text-[#F5C451] tabular-nums">
                {profile.gpBalance} GP
              </p>
              <p className="text-[11px] text-[#E6ECF9] font-medium">
                Số dư hiện tại
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVATAR_QUESTS.map((quest) => {
              const currentVal = Math.min(
                quest.target,
                getQuestCurrentValue(profile, quest.id)
              );
              const completed = isQuestCompleted(profile, quest.id);
              const claimed = isQuestClaimed(profile, quest.id);
              const pct = Math.min(
                100,
                Math.round((currentVal / quest.target) * 100)
              );
              const rewardItem = quest.unlockItemId
                ? getAvatarItemById(quest.unlockItemId)
                : null;

              return (
                <div
                  key={quest.id}
                  className={`rounded-3xl border p-5 flex flex-col justify-between gap-4 transition-all ${
                    completed && !claimed
                      ? 'bg-[#FFFDF7] border-[#D46534] ring-2 ring-[#D46534]/15 shadow-xs'
                      : claimed
                        ? 'bg-[#F5F9F6] border-[#4F6B54]/30'
                        : 'bg-white border-[#E8DFD1]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F7F2E8] border border-[#E8DFD1] font-mono text-[10.5px] font-bold text-[#615D57]">
                        {quest.categoryLabel}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FDF5E2] border border-[#E6C77A] font-mono text-xs font-extrabold text-[#9A6310]">
                        <Coins className="w-3.5 h-3.5" />+{quest.gpReward} GP
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-base font-extrabold text-[#25292E]">
                        {quest.title}
                      </h3>
                      <p className="text-xs text-[#615D57] mt-1 leading-relaxed">
                        {quest.description}
                      </p>
                    </div>

                    {rewardItem && (
                      <div className="p-2.5 rounded-2xl bg-[#FDF5E2]/80 border border-[#E6C77A]/60 flex items-center gap-2.5">
                        <AvatarItemSwatch item={rewardItem} size="sm" />
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] font-bold uppercase text-[#9A6310]">
                            Thưởng độc quyền kèm theo
                          </p>
                          <p className="text-xs font-bold text-[#25292E] truncate">
                            {rewardItem.name}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11.5px] font-semibold">
                        <span className="text-[#615D57]">Tiến độ</span>
                        <span className="font-mono font-bold text-[#1B3B82] tabular-nums">
                          {currentVal} / {quest.target}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[#EFE9DD] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            claimed
                              ? 'bg-[#4F6B54]'
                              : completed
                                ? 'bg-[#D46534]'
                                : 'bg-[#1B3B82]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="pt-1">
                    {claimed ? (
                      <div className="w-full min-h-[42px] px-4 py-2 rounded-2xl bg-[#EEF4EF] border border-[#4F6B54]/25 text-[#4F6B54] text-xs font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã nhận thưởng</span>
                      </div>
                    ) : completed ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleClaimQuestWithCelebration(quest.id)
                        }
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#D46534] hover:bg-[#BC5326] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Nhận +{quest.gpReward} GP ngay</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (quest.actionRoute === 'avatar_creator') {
                            setSubTab('creator');
                          } else {
                            onNavigateAppTab(quest.actionRoute);
                          }
                        }}
                        className="w-full min-h-[42px] px-4 py-2 rounded-2xl bg-[#F7F2E8] hover:bg-[#1B3B82] text-[#25292E] hover:text-white border border-[#E8DFD1] hover:border-[#1B3B82] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
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
        </section>
      )}

      {/* =======================================================
          SCREEN 7: ACHIEVEMENTS & TITLES (THÀNH TÍCH & DANH HIỆU)
          ======================================================= */}
      {subTab === 'achievements' && (
        <section className="rounded-3xl bg-white border border-[#E8DFD1] p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-extrabold text-[#25292E]">
                Thành tích &amp; Danh hiệu cộng đồng
              </h2>
              <p className="text-xs sm:text-sm text-[#615D57] mt-0.5">
                Đeo danh hiệu đã mở khóa để hiển thị trên hồ sơ Góc Thợ Avatar
                và thẻ chia sẻ PNG của bạn.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F2E8] border border-[#E8DFD1] font-mono text-xs font-bold text-[#1B3B82] self-start">
              <Award className="w-4 h-4 text-[#D46534]" />
              {
                Object.values(unlockedAchievements).filter(Boolean).length
              }/{AVATAR_ACHIEVEMENTS.length} danh hiệu
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVATAR_ACHIEVEMENTS.map((ach) => {
              const unlocked = Boolean(unlockedAchievements[ach.id]);
              const equipped = profile.equippedTitleId === ach.id;

              return (
                <div
                  key={ach.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-4 transition-all ${
                    equipped
                      ? 'border-[#1B3B82] bg-[#EEF2FA]/65 ring-2 ring-[#1B3B82]/15'
                      : unlocked
                        ? 'border-[#E8DFD1] bg-[#FBF8F2]'
                        : 'border-[#EAE2D6] bg-[#F8F6F1] opacity-80'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="px-2.5 py-1 rounded-lg font-mono text-[11px] font-extrabold tracking-wider text-white"
                        style={{
                          backgroundColor: unlocked ? ach.accentHex : '#9A948C',
                        }}
                      >
                        {ach.badgeCode}
                      </span>
                      {unlocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4F6B54]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã mở khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8A8278]">
                          <Lock className="w-3 h-3" />
                          Chưa mở
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-display text-base font-extrabold text-[#25292E]">
                        {ach.title}
                      </h3>
                      <p className="text-xs text-[#615D57] mt-1 leading-relaxed">
                        {ach.description}
                      </p>
                    </div>

                    <p className="text-[11px] font-medium text-[#7A746C] pt-1 border-t border-dashed border-[#E2D8C8]">
                      Điều kiện: {ach.requirementText}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!unlocked || equipped}
                    onClick={() => onEquipTitle(ach.id)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-colors ${
                      equipped
                        ? 'bg-[#1B3B82] text-white cursor-default'
                        : unlocked
                          ? 'bg-white hover:bg-[#1B3B82] text-[#25292E] hover:text-white border border-[#DFD3C2]'
                          : 'bg-[#ECE7DD] text-[#9A948C] cursor-not-allowed'
                    }`}
                  >
                    {equipped
                      ? 'Đang đeo danh hiệu này'
                      : unlocked
                        ? 'Đeo danh hiệu này'
                        : 'Chưa đủ điều kiện'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SCREEN 6: REWARD & ITEM DETAIL MODAL */}
      <RewardDetailModal
        item={detailItem}
        owned={detailItem ? ownedSet.has(detailItem.id) : false}
        equipped={detailItem ? isItemEquippedInDraft(detailItem) : false}
        gpBalance={profile.gpBalance}
        onClose={() => setDetailItem(null)}
        onTryOn={handleTryOnFromModal}
        onUnlockWithGp={handleUnlockWithCelebration}
        onGoToQuests={() => setSubTab('quests')}
      />

      {/* SCREEN 8: SHARE AVATAR CARD MODAL */}
      <ShareAvatarModal
        isOpen={shareModalOpen}
        avatarSnapshotUrl={shareSnapshot}
        displayName={displayName}
        equippedTitleId={profile.equippedTitleId}
        initialBgId={draftConfig.studioBgId}
        gpBalance={profile.gpBalance}
        ownedCount={profile.ownedItemIds.length}
        onClose={() => setShareModalOpen(false)}
        onDownloaded={() =>
          onShowToast('Đã tải thẻ Góc Thợ Avatar PNG về máy!')
        }
      />
    </div>
  );
}
