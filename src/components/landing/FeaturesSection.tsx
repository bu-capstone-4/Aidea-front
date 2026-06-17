import type { ComponentType } from 'react';
import { MdAutoAwesome, MdGroups, MdGridView, MdViewKanban, MdRateReview } from 'react-icons/md';
import { cn } from '@/shared/cn';

interface Feature {
  Icon: ComponentType<{ size?: number }>;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    Icon: MdAutoAwesome,
    iconBg: 'bg-ai-bg',
    iconColor: 'text-ai',
    title: 'AI 기획 문서 자동 생성',
    description:
      '핵심 아이디어만 입력하면 AI가 유저 시나리오, 기능 명세 초안을 자동으로 작성합니다. 논리적 허점까지 짚어드립니다.',
  },
  {
    Icon: MdGroups,
    iconBg: 'bg-primary-light',
    iconColor: 'text-primary-dark',
    title: '실시간 팀 협업',
    description:
      'Figma처럼 팀원들의 커서와 작업 현황을 실시간으로 확인하며 함께 문서를 완성합니다.',
  },
  {
    Icon: MdGridView,
    iconBg: 'bg-primary-light',
    iconColor: 'text-primary-dark',
    title: '커스텀 템플릿',
    description:
      '유저 스토리, API 설계, 기능 명세 등 프로젝트 유형에 맞는 기획 문서 템플릿을 선택하고 자동 생성합니다.',
  },
  {
    Icon: MdViewKanban,
    iconBg: 'bg-surface',
    iconColor: 'text-ink',
    title: 'AI 백로그 자동 생성',
    description:
      '완성된 기획 문서를 기반으로 AI가 Epic, Story, Task 단위의 백로그 초안을 자동으로 생성하고, 팀이 실시간으로 함께 관리합니다.',
  },
  {
    Icon: MdRateReview,
    iconBg: 'bg-ai-bg',
    iconColor: 'text-ai',
    title: 'AI 문서 피드백',
    description:
      'AI가 논리적 일관성, 누락된 내용, 모호한 표현을 분석해 문서의 완성도를 높이는 구체적인 개선 방안을 제안합니다.',
  },
];

function FeatureCard({ Icon, iconBg, iconColor, title, description }: Feature) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-6 transition-shadow hover:shadow-md">
      <div
        className={cn('flex h-10 w-10 items-center justify-center rounded-md', iconBg, iconColor)}
      >
        <Icon size={22} />
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="leading-relaxed text-ink-muted" style={{ fontSize: '0.8125rem' }}>
        {description}
      </p>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-sidebar px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-xl font-semibold uppercase tracking-widest text-primary">
            주요 기능
          </p>
          <h2 className="mb-4 text-4xl font-bold text-ink">기획 프로세스의 모든 것을 하나로</h2>
          <p className="mx-auto max-w-lg text-ink-muted" style={{ fontSize: '1rem' }}>
            아이디어 구체화부터 백로그 관리까지,
            <br />
            개발 팀의 기획 워크플로우를 하나의 공간에서 완성합니다.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.slice(0, 3).map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
          <div className="contents lg:col-span-3 lg:flex lg:justify-center lg:gap-4">
            {FEATURES.slice(3).map((feature) => (
              <div key={feature.title} className="sm:col-span-1 lg:w-1/3">
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
