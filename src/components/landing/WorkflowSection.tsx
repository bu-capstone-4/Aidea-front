import { MdAutoAwesome } from 'react-icons/md';

interface Step {
  number: string;
  title: string;
  description: string;
  aiBadge?: boolean;
}

const STEPS: Step[] = [
  {
    number: '01',
    title: '아이디어 입력',
    description:
      '만들고 싶은 서비스의 핵심 아이디어를 자유롭게 입력합니다. 단 한 줄이어도 괜찮습니다.',
  },
  {
    number: '02',
    title: 'AI가 기획 문서 생성',
    description:
      'AI가 유저 시나리오, 기능 명세, API 설계 등 필요한 문서 초안을 자동으로 작성하고 논리적 허점을 짚어줍니다.',
  },
  {
    number: '03',
    title: '팀과 실시간 협업',
    description:
      '팀원을 초대하여 실시간으로 문서를 함께 완성합니다. 커서 위치와 수정 이력이 모두 기록됩니다.',
  },
  {
    number: '04',
    title: 'GitHub 이슈로 연동',
    description:
      '완성된 기획을 바탕으로 Epic, Story, Task 단위의 GitHub 이슈를 자동 생성하여 개발을 바로 시작합니다.',
  },
];

function StepCard({ number, title, description, aiBadge }: Step) {
  return (
    <div className="flex flex-col gap-3">
      {/* Step number */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-primary">{number}</span>
        {aiBadge && (
          <span className="inline-flex items-center gap-1 rounded-md bg-ai-bg px-2 py-0.5 text-xs font-semibold text-ai">
            <MdAutoAwesome />
            AI
          </span>
        )}
      </div>

      {/* Connector line */}
      <div className="h-px w-full bg-border" />

      {/* Content */}
      <div className="pt-1">
        <h3 className="mb-2 font-semibold text-ink" style={{ fontSize: '1rem' }}>
          {title}
        </h3>
        <p className="leading-relaxed text-ink-muted" style={{ fontSize: '0.8125rem' }}>
          {description}
        </p>
      </div>
    </div>
  );
}

export default function WorkflowSection() {
  return (
    <section id="workflow" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <p className="mb-2 text-xl font-semibold uppercase tracking-widest text-primary">
            워크플로우
          </p>
          <h2 className="mb-4 text-4xl font-bold text-ink">어떻게 시작하나요?</h2>
          <p className="mx-auto max-w-md text-ink-muted" style={{ fontSize: '1rem' }}>
            4단계만으로 아이디어를 실제 개발 이슈로 연결합니다.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <StepCard key={step.number} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}
