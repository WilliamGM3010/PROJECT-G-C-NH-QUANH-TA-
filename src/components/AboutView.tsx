import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  EyeOff,
  Heart,
  Mail,
  PlusCircle,
  Scale,
} from 'lucide-react';
import cobblerHeroImg from '../assets/images/news_cobbler_story_1795758945711.jpg';
import {
  FTU_LOGO_SRC,
  PROJECT_CONTACT_EMAIL,
  TEAM_DEPARTMENTS,
  TEAM_WHO_MEMBERS,
  TEAM_WHO_PHOTO_SRC,
  type TeamDepartment,
  type TeamMember,
} from '../data/team';
import type { AppTab } from '../types/artisan';

interface AboutViewProps {
  totalArtisans: number;
  revivedCount: number;
  totalArticles: number;
  districtsCount: number;
  onNavigate: (tab: AppTab) => void;
}

type ChapterId = 've-du-an' | 've-chung-minh' | 'dong-hanh';

const CORE_VALUES = [
  {
    number: '01',
    title: 'Kết nối thực tế',
    description:
      'Chiếc cầu nối giữa người làm nghề sửa chữa nhỏ lẻ với cộng đồng người dùng trẻ, giúp dễ dàng tìm đúng thợ gần nhà.',
  },
  {
    number: '02',
    title: 'Trao nhau giá trị',
    description:
      'Mối quan hệ win-win bền vững — cô chú thợ và tiệm nhỏ có thêm khách hàng, còn sinh viên sửa được đồ tiện lợi với chi phí hợp lý.',
  },
  {
    number: '03',
    title: 'Sống xanh bền vững',
    description:
      'Kéo dài vòng đời của từng món đồ quen thuộc, hạn chế rác thải và chung tay bảo vệ môi trường.',
  },
] as const;

const TIMELINE_MILESTONES = [
  {
    date: '10/2026',
    title: 'Khởi sinh ý tưởng',
    description:
      'Nhận diện khoảng trống giữa nhu cầu sửa đồ giá mềm của sinh viên và sự "vô hình" của các góc thợ nhỏ trên bản đồ số.',
    status: 'done' as const,
  },
  {
    date: '11/2026',
    title: 'Khảo sát thực địa',
    description:
      'Đi từng con hẻm tại TP.HCM, trò chuyện, xin phép và ghi nhận mốc địa chỉ, bảng giá thật từ cô chú thợ.',
    status: 'done' as const,
  },
  {
    date: '11/2026',
    title: 'Ra mắt nền tảng web',
    description:
      'Hoàn thiện Góc Thợ Quanh Ta với tìm kiếm theo lỗi, định vị GPS, bản đồ tương tác và chuyên trang Bản tin.',
    status: 'current' as const,
  },
  {
    date: 'Sắp tới',
    title: 'Mở rộng cộng đồng',
    description:
      'Phủ dày thêm nhiều khu vực quanh các cụm trường đại học và kết nối mạng lưới cộng tác viên góp điểm.',
    status: 'upcoming' as const,
  },
] as const;

const ETHICS_COMMITMENTS = [
  {
    title: 'Hoàn toàn phi lợi nhuận',
    description:
      'Cam kết không thu bất kỳ chi phí nào từ cô chú thợ cũng như người dùng web.',
    Icon: Heart,
  },
  {
    title: 'Tôn trọng quyền riêng tư',
    description:
      'Luôn xin phép rõ ràng trước khi đăng tải, sẵn sàng ẩn hình ảnh chân dung và thông tin cá nhân khi cô chú yêu cầu.',
    Icon: EyeOff,
  },
  {
    title: 'Trung thực & Minh bạch',
    description:
      'Mọi thông tin địa chỉ, bảng giá và trạng thái đều được kiểm chứng khách quan, cập nhật thường xuyên.',
    Icon: Scale,
  },
] as const;

function useRevealOnScroll(threshold = 0.14) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin: '0px 0px -36px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function useCountUp(target: number, active: boolean, duration = 1050): number {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const safeTarget = Math.max(0, Math.round(target));
    if (safeTarget === 0) {
      setDisplayValue(0);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * safeTarget));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(safeTarget);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [target, active, duration]);

  return displayValue;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M13.5 21v-7.6h2.55l.38-2.96H13.5V8.55c0-.86.24-1.44 1.47-1.44h1.57V4.46c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.81 1.38-3.81 3.91v2.19H7.88v2.96h2.57V21h3.05Z" />
    </svg>
  );
}

function getPortraitFallbackClasses(tone: TeamMember['accentTone']): string {
  switch (tone) {
    case 'terracotta':
      return 'bg-gradient-to-br from-[#F9EFE8] via-[#F3E2D6] to-[#EBD4C4] text-[#9E4720]';
    case 'forest':
      return 'bg-gradient-to-br from-[#EDF3F0] via-[#E2ECE7] to-[#D6E4DD] text-[#285043]';
    default:
      return 'bg-gradient-to-br from-[#F4EFE7] via-[#ECE5D9] to-[#E3DACC] text-[#5C5346]';
  }
}

function MemberPortrait({
  member,
  large = false,
}: {
  member: TeamMember;
  large?: boolean;
}) {
  const [hasError, setHasError] = useState(false);

  if (member.avatarUrl && !hasError) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.name}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`w-full h-full flex items-center justify-center relative overflow-hidden transition-transform duration-500 ease-out group-hover:scale-105 ${getPortraitFallbackClasses(
        member.accentTone
      )}`}
    >
      <span className="absolute inset-4 rounded-full border border-current opacity-[0.07]" />
      <span
        className={`font-semibold tracking-wider opacity-40 select-none ${
          large ? 'text-5xl md:text-6xl' : 'text-4xl'
        }`}
      >
        {member.initials}
      </span>
    </div>
  );
}

export function AboutView({
  totalArtisans,
  revivedCount,
  totalArticles,
  districtsCount,
  onNavigate,
}: AboutViewProps) {
  const [activeChapter, setActiveChapter] = useState<ChapterId>('ve-du-an');
  const [selectedDepartment, setSelectedDepartment] = useState<
    TeamDepartment | 'Tất cả'
  >('Tất cả');

  const chapterProjectRef = useRef<HTMLElement | null>(null);
  const chapterTeamRef = useRef<HTMLElement | null>(null);
  const chapterJoinRef = useRef<HTMLElement | null>(null);

  const heroReveal = useRevealOnScroll(0.05);
  const valuesReveal = useRevealOnScroll(0.14);
  const statsReveal = useRevealOnScroll(0.2);
  const timelineReveal = useRevealOnScroll(0.15);
  const ethicsReveal = useRevealOnScroll(0.15);
  const teamHeaderReveal = useRevealOnScroll(0.12);
  const teamGridReveal = useRevealOnScroll(0.08);
  const ctaReveal = useRevealOnScroll(0.15);

  // Tự động highlight mục đang xem trong thanh Sticky Mini-Pill
  useEffect(() => {
    const sections: { id: ChapterId; el: HTMLElement | null }[] = [
      { id: 've-du-an', el: chapterProjectRef.current },
      { id: 've-chung-minh', el: chapterTeamRef.current },
      { id: 'dong-hanh', el: chapterJoinRef.current },
    ];

    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          const matchedId = visibleEntries[0].target.getAttribute(
            'data-chapter'
          ) as ChapterId | null;
          if (matchedId) {
            setActiveChapter(matchedId);
          }
        }
      },
      {
        threshold: [0.15, 0.35, 0.6],
        rootMargin: '-18% 0px -55% 0px',
      }
    );

    for (const s of sections) {
      if (s.el) observer.observe(s.el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollToChapter = (id: ChapterId) => {
    setActiveChapter(id);
    const target =
      id === 've-du-an'
        ? chapterProjectRef.current
        : id === 've-chung-minh'
          ? chapterTeamRef.current
          : chapterJoinRef.current;

    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Số liệu Count-Up mượt từ 0 khi cuộn vào khung nhìn
  const animatedArtisans = useCountUp(totalArtisans, statsReveal.visible, 1000);
  const animatedRevived = useCountUp(revivedCount, statsReveal.visible, 1200);
  const animatedArticles = useCountUp(totalArticles, statsReveal.visible, 900);
  const animatedTeam = useCountUp(TEAM_WHO_MEMBERS.length, statsReveal.visible, 800);

  const projectLeader = useMemo(
    () => TEAM_WHO_MEMBERS.find((m) => m.tier === 'pl') ?? null,
    []
  );
  const departmentLeaders = useMemo(
    () => TEAM_WHO_MEMBERS.filter((m) => m.tier === 'leader'),
    []
  );
  const regularMembers = useMemo(
    () => TEAM_WHO_MEMBERS.filter((m) => m.tier === 'member'),
    []
  );

  const filteredDepartmentMembers = useMemo(() => {
    if (selectedDepartment === 'Tất cả') return [];
    const tierRank: Record<TeamMember['tier'], number> = {
      pl: 0,
      leader: 1,
      member: 2,
    };
    return TEAM_WHO_MEMBERS.filter((m) =>
      m.departments.includes(selectedDepartment)
    ).sort((a, b) => tierRank[a.tier] - tierRank[b.tier]);
  }, [selectedDepartment]);

  const departmentCounts = useMemo(() => {
    const counts: Record<TeamDepartment, number> = {
      'Nội dung - Phát triển': 0,
      'Truyền thông Chiến lược': 0,
      'Nhân sự - Vận hành': 0,
    };
    for (const member of TEAM_WHO_MEMBERS) {
      for (const dept of member.departments) {
        counts[dept] += 1;
      }
    }
    return counts;
  }, []);

  const navChapters: { id: ChapterId; label: string }[] = [
    { id: 've-du-an', label: 'Về dự án' },
    { id: 've-chung-minh', label: 'Về chúng mình' },
    { id: 'dong-hanh', label: 'Đồng hành' },
  ];

  const renderPortraitMemberCard = (
    member: TeamMember,
    idx: number,
    extraClassName = ''
  ) => {
    const isPl = member.tier === 'pl';
    const isLeader = member.tier === 'leader';

    return (
      <article
        key={member.id}
        style={{
          transitionDelay: teamGridReveal.visible
            ? `${Math.min(idx, 8) * 65}ms`
            : '0ms',
        }}
        className={`group rounded-3xl bg-white overflow-hidden flex flex-col transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg ${
          isPl
            ? 'border border-emerald-900/20 hover:border-emerald-900/35 shadow-xs'
            : 'border border-stone-200/80 hover:border-emerald-900/25'
        } ${
          teamGridReveal.visible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-5'
        } ${extraClassName}`}
      >
        {/* Phần ảnh chân dung cỡ lớn lồng khung gọn gàng */}
        <div className="p-2.5 pb-0">
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-stone-100 relative">
            <MemberPortrait member={member} />
          </div>
        </div>

        {/* Phần thông tin thành viên phía dưới */}
        <div className="p-5 flex-1 flex flex-col">
          <span
            className={`inline-block text-[11px] font-bold uppercase tracking-wider ${
              isPl
                ? 'text-emerald-800'
                : isLeader
                  ? 'text-[#D96B38]'
                  : 'text-[#64748B]'
            }`}
          >
            {member.role}
          </span>

          <div className="flex items-center justify-between gap-2 mt-1">
            <h3 className="text-lg font-bold text-stone-900 leading-snug">
              {member.name}
            </h3>

            <a
              href={member.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Facebook của ${member.name}`}
              title={`Facebook của ${member.name}`}
              className="w-8 h-8 rounded-full text-stone-400 hover:bg-emerald-900 hover:text-white flex items-center justify-center shrink-0 transition-colors"
            >
              <FacebookIcon className="w-4 h-4" />
            </a>
          </div>

          {isPl || isLeader ? (
            <p className="mt-1 text-xs font-medium text-emerald-800/90 leading-snug">
              {member.departmentDisplayLabel || member.departments.join(' · ')}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {member.departments.map((dept) => (
                <span
                  key={dept}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F4EFE6] text-[#52606D] text-[11px] font-medium"
                >
                  {dept}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto pt-3.5">
            <p className="text-[13px] leading-relaxed text-stone-500 italic pt-3 border-t border-stone-100">
              &ldquo;{member.quote}&rdquo;
            </p>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="bg-[#FAF8F5] text-[#1F2933]">
      {/* 1. THANH ĐIỀU HƯỚNG NHANH STICKY MINI-PILL */}
      <div className="sticky top-3 z-30 flex justify-center px-4 pt-4 pointer-events-none">
        <nav
          aria-label="Điều hướng chương trang Về dự án"
          className="pointer-events-auto inline-flex items-center gap-1 p-1 rounded-full bg-white/85 backdrop-blur-md border border-stone-200/90 shadow-[0_6px_22px_rgba(31,41,51,0.06)]"
        >
          {navChapters.map(({ id, label }) => {
            const isActive = activeChapter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => scrollToChapter(id)}
                className={`min-h-[34px] px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#3A6B5C] text-white shadow-2xs'
                    : 'text-[#52606D] hover:text-[#1F2933] hover:bg-stone-100/80'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-16 sm:pb-24 space-y-24 sm:space-y-32">
        {/* =======================================================
            CHƯƠNG 1 — VỀ DỰ ÁN
           ======================================================= */}
        <section
          ref={chapterProjectRef}
          id="chuong-ve-du-an"
          data-chapter="ve-du-an"
          className="scroll-mt-20 space-y-16 sm:space-y-24"
        >
          {/* Hero mở đầu tối giản */}
          <div
            ref={heroReveal.ref}
            className={`space-y-8 sm:space-y-10 transition-all duration-700 ease-out ${
              heroReveal.visible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-5'
            }`}
          >
            <header className="max-w-3xl space-y-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#3A6B5C]">
                VỀ DỰ ÁN · GÓC THỢ QUANH TA
              </p>
              <h1
                className="text-3xl sm:text-5xl font-bold text-[#1F2933] tracking-tight leading-[1.14]"
                style={{ textWrap: 'balance' }}
              >
                Hỏng đâu sửa liền — Thợ giỏi gần bên.
              </h1>
            </header>

            {/* Khung ảnh ngang 16:9 bo góc mềm + zoom nhẹ khi hover */}
            <figure className="group relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-[#EDE6DC] border border-stone-200/80 shadow-[0_8px_30px_rgba(31,41,51,0.05)]">
              <img
                src={cobblerHeroImg}
                alt="Góc bàn làm việc mộc mạc của cô chú thợ sửa đồ tại TP.HCM"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1F2933]/65 via-[#1F2933]/20 to-transparent pointer-events-none" />
              <figcaption className="absolute bottom-3.5 left-4 sm:bottom-5 sm:left-6 right-4 text-[11.5px] sm:text-xs text-white/90 font-medium">
                Góc đồ nghề bình dị nhưng bền bỉ — nơi những món đồ quen được
                hồi sinh mỗi ngày.
              </figcaption>
            </figure>

            {/* Khối Câu chuyện khởi nguồn (2 đoạn gọn gàng, khoảng trắng thở) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-10 pt-2">
              <div className="lg:col-span-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#D96B38]">
                  Câu chuyện khởi nguồn
                </p>
                <p className="mt-2 text-sm text-[#616E7C] leading-relaxed">
                  Từ một bất tiện rất quen của đời sống sinh viên đến bản đồ số
                  cho những đôi tay lành nghề.
                </p>
              </div>
              <div className="lg:col-span-8 space-y-4 text-sm sm:text-[15.5px] text-[#3E4C59] leading-[1.82]">
                <p>
                  Nhiều người, đặc biệt là sinh viên, khi gặp sự cố hư hỏng đồ
                  dùng như giày dép bung keo, quần áo sứt chỉ, balo gãy dây kéo,
                  laptop hay xe cộ thường phải vứt bỏ hoặc tốn chi phí lớn chỉ
                  vì không biết địa chỉ sửa chữa uy tín, giá mềm quanh nơi mình
                  sống.
                </p>
                <p>
                  Trong khi đó, ngay ở những góc phố và con hẻm quen lại có rất
                  nhiều cô chú thợ lành nghề và tiệm sửa chữa nhỏ lẻ vẫn chưa
                  hiện diện trên Google Maps.{' '}
                  <strong className="font-semibold text-[#1F2933]">
                    Góc Thợ Quanh Ta
                  </strong>{' '}
                  ra đời như một nền tảng định vị cộng đồng giúp bạn trẻ tìm
                  đúng thợ giỏi gần nhà với giá bình dân, đồng thời tăng độ nhận
                  diện và thu hút thêm khách hàng cho người làm nghề.
                </p>
              </div>
            </div>
          </div>

          {/* 3 Giá trị cốt lõi (Bento Grid 3 cột, Stagger Fade-Up + Hover Lift nhẹ) */}
          <div ref={valuesReveal.ref} className="space-y-6">
            <div className="flex items-end justify-between gap-4 border-b border-stone-200/80 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1F2933] tracking-tight">
                Ba giá trị cốt lõi
              </h2>
              <span className="text-xs text-[#7B8794] hidden sm:inline">
                Nhẹ ví tiền · Ấm tình người · Xanh thành phố
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {CORE_VALUES.map((item, idx) => (
                <article
                  key={item.number}
                  style={{
                    transitionDelay: valuesReveal.visible
                      ? `${idx * 100}ms`
                      : '0ms',
                  }}
                  className={`rounded-2xl bg-white border border-stone-200/85 p-6 sm:p-7 space-y-3.5 transition-all duration-700 ease-out hover:-translate-y-1 hover:border-[#3A6B5C]/45 hover:shadow-[0_12px_28px_rgba(31,41,51,0.05)] ${
                    valuesReveal.visible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-6'
                  }`}
                >
                  <p className="text-[11px] font-bold tracking-[0.14em] text-[#D96B38] uppercase tabular-nums">
                    {item.number} · {item.title}
                  </p>
                  <p className="text-sm text-[#52606D] leading-[1.75]">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          {/* Dải số liệu ấn tượng (LIVE Supabase + Count-Up mượt từ 0) */}
          <div
            ref={statsReveal.ref}
            className={`rounded-3xl bg-white border border-stone-200/85 px-6 sm:px-8 py-8 sm:py-10 transition-all duration-700 ease-out ${
              statsReveal.visible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-5'
            }`}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y-0 lg:divide-x divide-stone-200/75">
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-bold text-[#1F2933] tabular-nums tracking-tight">
                  {animatedArtisans}
                </p>
                <p className="text-xs sm:text-[13px] font-medium text-[#52606D]">
                  Cô chú thợ đã xác minh
                </p>
                <p className="text-[11px] text-[#829AB1]">
                  Đồng bộ trực tiếp trên bản đồ
                </p>
              </div>

              <div className="space-y-1 lg:pl-7">
                <p className="text-3xl sm:text-4xl font-bold text-[#3A6B5C] tabular-nums tracking-tight">
                  {animatedRevived}
                </p>
                <p className="text-xs sm:text-[13px] font-medium text-[#52606D]">
                  Món đồ đã được hồi sinh
                </p>
                <p className="text-[11px] text-[#829AB1]">
                  Sửa bền thay vì vứt bỏ
                </p>
              </div>

              <div className="space-y-1 lg:pl-7">
                <p className="text-3xl sm:text-4xl font-bold text-[#D96B38] tabular-nums tracking-tight">
                  {animatedArticles}
                </p>
                <p className="text-xs sm:text-[13px] font-medium text-[#52606D]">
                  Bài viết trên Bản tin
                </p>
                <p className="text-[11px] text-[#829AB1]">
                  Chuyện nghề &amp; mẹo sống xanh
                </p>
              </div>

              <div className="space-y-1 lg:pl-7">
                <p className="text-3xl sm:text-4xl font-bold text-[#1F2933] tabular-nums tracking-tight">
                  {animatedTeam}
                </p>
                <p className="text-xs sm:text-[13px] font-medium text-[#52606D]">
                  Thành viên &amp; CTV thực địa
                </p>
                <p className="text-[11px] text-[#829AB1]">
                  Phủ {Math.max(1, districtsCount)} khu vực tại TP.HCM
                </p>
              </div>
            </div>
          </div>

          {/* Hành trình dự án (Timeline tối giản 4 mốc + đường kẻ tiến độ sáng dần) */}
          <div ref={timelineReveal.ref} className="space-y-8">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3A6B5C]">
                Hành trình dự án
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1F2933] tracking-tight">
                Từng bước đi từ ý tưởng đến góc phố
              </h2>
            </div>

            <div className="relative pl-7 sm:pl-9 space-y-8">
              {/* Đường kẻ nền */}
              <div
                aria-hidden="true"
                className="absolute left-[11px] sm:left-[13px] top-2 bottom-2 w-px bg-stone-200"
              />
              {/* Đường kẻ tiến độ sáng dần mượt mà */}
              <div
                aria-hidden="true"
                className={`absolute left-[11px] sm:left-[13px] top-2 w-px bg-[#3A6B5C] transition-all duration-1000 ease-out ${
                  timelineReveal.visible ? 'h-[72%]' : 'h-0'
                }`}
              />

              {TIMELINE_MILESTONES.map((milestone, idx) => (
                <div
                  key={milestone.title}
                  style={{
                    transitionDelay: timelineReveal.visible
                      ? `${idx * 130}ms`
                      : '0ms',
                  }}
                  className={`relative transition-all duration-700 ease-out ${
                    timelineReveal.visible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4'
                  }`}
                >
                  {/* Chấm mốc */}
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[22px] sm:-left-[28px] top-1.5 w-3 h-3 rounded-full ring-4 ring-[#FAF8F5] transition-colors ${
                      milestone.status === 'current'
                        ? 'bg-[#D96B38]'
                        : milestone.status === 'done'
                          ? 'bg-[#3A6B5C]'
                          : 'bg-stone-300'
                    }`}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-5">
                    <span
                      className={`text-xs font-bold tabular-nums uppercase tracking-wider shrink-0 sm:w-20 ${
                        milestone.status === 'current'
                          ? 'text-[#D96B38]'
                          : milestone.status === 'done'
                            ? 'text-[#3A6B5C]'
                            : 'text-[#829AB1]'
                      }`}
                    >
                      {milestone.date}
                    </span>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[#1F2933]">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-[#52606D] leading-relaxed max-w-2xl">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3 Cam kết đạo đức cộng đồng (Thẻ ngang viền mảnh, icon tối giản) */}
          <div ref={ethicsReveal.ref} className="space-y-5">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D96B38]">
                Nguyên tắc hoạt động
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1F2933] tracking-tight">
                Ba cam kết đạo đức cộng đồng
              </h2>
            </div>

            <div className="divide-y divide-stone-200/80 rounded-2xl bg-white border border-stone-200/85 overflow-hidden">
              {ETHICS_COMMITMENTS.map(({ title, description, Icon }, idx) => (
                <div
                  key={title}
                  style={{
                    transitionDelay: ethicsReveal.visible
                      ? `${idx * 90}ms`
                      : '0ms',
                  }}
                  className={`p-5 sm:px-7 sm:py-6 flex items-start gap-4 transition-all duration-700 ease-out hover:bg-[#FAF8F5]/60 ${
                    ethicsReveal.visible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4'
                  }`}
                >
                  <span className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-stone-200/90 text-[#3A6B5C] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-[15px] font-bold text-[#1F2933]">
                      {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#52606D] leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Đường phân tách chương nhẹ nhàng */}
        <div className="border-t border-stone-200/80" />

        {/* =======================================================
            CHƯƠNG 2 — VỀ CHÚNG MÌNH (TEAM WHO)
           ======================================================= */}
        <section
          ref={chapterTeamRef}
          id="chuong-ve-chung-minh"
          data-chapter="ve-chung-minh"
          className="scroll-mt-20 space-y-12 sm:space-y-14"
        >
          <div
            ref={teamHeaderReveal.ref}
            className={`transition-all duration-700 ease-out ${
              teamHeaderReveal.visible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-5'
            }`}
          >
            {/* Khối tiêu đề mở đầu Chương 2 căn giữa, nổi bật Logo FTU + TEAM WHO */}
            <header className="flex flex-col items-center text-center mb-8 md:mb-10">
              {/* Hàng 1: Cụm nhận diện chính (Logo FTU lớn + gạch dọc mảnh + TEAM WHO) */}
              <div className="inline-flex items-center justify-center gap-4 md:gap-5">
                <span className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-white ring-2 ring-white shadow-md shrink-0 transition-transform duration-300 hover:scale-105">
                  <img
                    src={FTU_LOGO_SRC}
                    alt="Logo Trường Đại học Ngoại thương (FTU)"
                    className="w-full h-full object-cover scale-[1.03]"
                  />
                </span>

                <span
                  aria-hidden="true"
                  className="h-9 md:h-11 w-px bg-stone-300/80 shrink-0"
                />

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-950 leading-none">
                  TEAM <span className="text-[#D96B38]">WHO</span>
                </h2>
              </div>

              {/* Hàng 2: Dòng Lớp & Trường tách riêng gọn gàng */}
              <p className="mt-3.5 md:mt-4 text-sm md:text-base text-stone-600 font-medium leading-relaxed max-w-2xl">
                <span className="font-semibold text-emerald-900">Lớp Học phần KDO441</span>
                <span className="mx-1.5 text-stone-400" aria-hidden="true">
                  ·
                </span>
                Phân hiệu Trường Đại học Ngoại thương tại TP. Hồ Chí Minh
              </p>

              {/* Hàng 3: Slogan nhóm bổ trợ tinh tế */}
              <p
                className="mt-5 md:mt-6 text-xl sm:text-2xl md:text-[26px] font-semibold text-stone-800 tracking-tight leading-snug"
                style={{ textWrap: 'balance' }}
              >
                &ldquo;Who are we, we are who,{' '}
                <span className="text-[#D96B38] italic">we help other!</span>
                &rdquo;
              </p>
            </header>

            {/* Ảnh tập thể nhóm 16:9 */}
            <figure className="space-y-3">
              <div className="group aspect-[16/9] w-full rounded-3xl overflow-hidden bg-[#EAE3D8] border border-stone-200/80 shadow-[0_8px_30px_rgba(31,41,51,0.05)]">
                <img
                  src={TEAM_WHO_PHOTO_SRC}
                  alt="Ảnh tập thể 9 thành viên Team WHO — Lớp Học phần KDO441 FTU HCMC"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <figcaption className="text-center text-xs text-[#616E7C] font-medium">
                9 mảnh ghép của Team WHO — LỚP HỌC PHẦN KDO441 FTU HCMC
              </figcaption>
            </figure>
          </div>

          {/* 4 Nút lọc phân ban tối giản căn giữa */}
          <div className="space-y-10">
            <div
              role="tablist"
              aria-label="Lọc thành viên theo phân ban"
              className="flex flex-wrap items-center justify-center gap-2"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedDepartment === 'Tất cả'}
                onClick={() => setSelectedDepartment('Tất cả')}
                className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedDepartment === 'Tất cả'
                    ? 'bg-[#3A6B5C] text-white shadow-2xs'
                    : 'bg-white border border-stone-200 text-[#52606D] hover:border-stone-300 hover:text-[#1F2933]'
                }`}
              >
                Tất cả ({TEAM_WHO_MEMBERS.length})
              </button>

              {TEAM_DEPARTMENTS.map((dept) => {
                const isActive = selectedDepartment === dept;
                return (
                  <button
                    key={dept}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-[#3A6B5C] text-white shadow-2xs'
                        : 'bg-white border border-stone-200 text-[#52606D] hover:border-stone-300 hover:text-[#1F2933]'
                    }`}
                  >
                    {dept} ({departmentCounts[dept]})
                  </button>
                );
              })}
            </div>

            {/* Khu vực hiển thị đội ngũ */}
            <div ref={teamGridReveal.ref}>
              {selectedDepartment === 'Tất cả' ? (
                /* BỐ CỤC PHÂN CẤP 3 TẦNG SẠCH SẼ — KHÔNG TIÊU ĐỀ PHÂN TÁCH */
                <div className="space-y-8 md:space-y-10">
                  {/* Tầng 1: Project Leader — Thẻ chia đôi ngang Spotlight cỡ lớn */}
                  {projectLeader && (
                    <article
                      className={`group max-w-3xl mx-auto rounded-3xl bg-white border border-emerald-900/15 overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out grid grid-cols-1 md:grid-cols-12 ${
                        teamGridReveal.visible
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-5'
                      }`}
                    >
                      {/* Khối ảnh chân dung cỡ lớn bên trái */}
                      <div className="md:col-span-5 p-3 pb-0 md:p-3 md:pr-0">
                        <div className="aspect-square md:aspect-auto md:h-full min-h-[260px] w-full rounded-2xl overflow-hidden bg-stone-100 relative">
                          <MemberPortrait member={projectLeader} large />
                        </div>
                      </div>

                      {/* Khối nội dung bên phải căn giữa dọc */}
                      <div className="md:col-span-7 flex flex-col justify-center p-6 md:p-8">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-900/10 text-emerald-900 text-[11px] font-bold tracking-wider uppercase">
                            {projectLeader.role}
                          </span>

                          <a
                            href={projectLeader.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Facebook của ${projectLeader.name}`}
                            title={`Facebook của ${projectLeader.name}`}
                            className="w-8 h-8 rounded-full text-stone-400 hover:bg-emerald-900 hover:text-white flex items-center justify-center shrink-0 transition-colors"
                          >
                            <FacebookIcon className="w-4 h-4" />
                          </a>
                        </div>

                        <h3 className="mt-4 text-2xl font-bold text-stone-900 tracking-tight leading-snug">
                          {projectLeader.name}
                        </h3>

                        <p className="mt-1 text-sm font-medium text-emerald-800">
                          {projectLeader.departmentDisplayLabel}
                        </p>

                        <div
                          aria-hidden="true"
                          className="w-10 h-px bg-stone-200 my-4"
                        />

                        <p className="text-sm text-stone-600 italic leading-relaxed">
                          &ldquo;{projectLeader.quote}&rdquo;
                        </p>
                      </div>
                    </article>
                  )}

                  {/* Tầng 2: 3 Trưởng ban — 1 hàng 3 cột đều nhau */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {departmentLeaders.map((leader, idx) =>
                      renderPortraitMemberCard(leader, idx + 1, 'h-full')
                    )}
                  </div>

                  {/* Tầng 3: 5 Thành viên — 3 thẻ hàng trên + 2 thẻ căn giữa hàng dưới */}
                  <div className="flex flex-wrap justify-center gap-6">
                    {regularMembers.map((member, idx) =>
                      renderPortraitMemberCard(
                        member,
                        idx + 4,
                        'w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]'
                      )
                    )}
                  </div>
                </div>
              ) : (
                /* BỐ CỤC KHI LỌC THEO TỪNG BAN (4 NGƯỜI/BAN — LƯỚI 2x2 CĂN GIỮA, PL/TRƯỞNG BAN ĐỨNG ĐẦU) */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
                  {filteredDepartmentMembers.map((member, idx) =>
                    renderPortraitMemberCard(member, idx, 'h-full')
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =======================================================
            CHƯƠNG 3 — KÊU GỌI ĐỒNG HÀNH (CTA CARD TỐI GIẢN)
           ======================================================= */}
        <section
          ref={chapterJoinRef}
          id="chuong-dong-hanh"
          data-chapter="dong-hanh"
          className="scroll-mt-20"
        >
          <div
            ref={ctaReveal.ref}
            className={`rounded-3xl bg-[#3A6B5C] text-[#FAF8F5] px-6 sm:px-10 lg:px-12 py-10 sm:py-12 transition-all duration-700 ease-out ${
              ctaReveal.visible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-5'
            }`}
          >
            <div className="max-w-2xl space-y-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F2C9A8]">
                ĐỒNG HÀNH CÙNG CHÚNG MÌNH
              </p>

              <h2
                className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Biết một cô chú thợ lành nghề gần nhà? Cùng chúng mình nối dài
                bản đồ nhé.
              </h2>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('suggest')}
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#FAF8F5] hover:bg-white text-[#1F2933] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-[#D96B38]" />
                  <span>Gợi ý cô chú thợ mới</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <a
                  href={`mailto:${PROJECT_CONTACT_EMAIL}`}
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/18 border border-white/25 text-[#FAF8F5] text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Liên hệ hợp tác / CTV</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
