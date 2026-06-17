import { useState, type ComponentType } from 'react';
import {
  MdArrowForward,
  MdAutoAwesome,
  MdDescription,
  MdGroups,
  MdViewKanban,
} from 'react-icons/md';
import { cn } from '@/shared/cn';
import UserAvatar from '@/components/ui/UserAvatar';
import IssueTypeTag from '@/components/backlog/IssueTypeTag';
import PriorityBadge from '@/components/backlog/PriorityBadge';
import { BOARD_COLUMNS } from '@/constants/backlog';

interface ProblemSolution {
  id: string;
  title: string;
  problemBullets: string[];
  solutionLabel: string;
  solutionText: string;
  Icon: ComponentType<{ size?: number }>;
  iconBg: string;
  iconColor: string;
  Visual: ComponentType;
}

/* 실제 화면을 캡처한 듯한 느낌을 주기 위한 미니 브라우저 프레임 (AppMockup.tsx와 동일한 톤) */
function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-1.5">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-[#ff5f57]" />
          <div className="h-2 w-2 rounded-full bg-[#febc2e]" />
          <div className="h-2 w-2 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto rounded border border-border bg-white px-3 py-0.5 text-2xs text-ink-muted">
          {url}
        </div>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

const TEAM_OPINIONS = [
  { name: '현우', opinion: '로그인 먼저', tilt: '-rotate-3' },
  { name: '민석', opinion: '결제 먼저', tilt: 'rotate-2' },
  { name: '지은', opinion: '디자인 먼저', tilt: '-rotate-1' },
];

function MisalignmentVisual() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-lg bg-sidebar p-6 sm:gap-5">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-end gap-2">
          {TEAM_OPINIONS.map((member) => (
            <div
              key={member.name}
              className={cn('flex flex-col items-center gap-1.5', member.tilt)}
            >
              <UserAvatar name={member.name} size={32} />
              <span className="whitespace-nowrap rounded-md border border-border bg-white px-1.5 py-0.5 text-2xs font-medium text-ink-muted shadow-sm">
                {member.opinion}
              </span>
            </div>
          ))}
        </div>
        <span className="text-2xs text-ink-muted">팀원마다 다른 생각</span>
      </div>

      <MdArrowForward className="shrink-0 text-ink-muted" />

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ai-bg text-ai">
        <MdAutoAwesome size={20} />
      </div>

      <MdArrowForward className="shrink-0 text-ink-muted" />

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-md border-2 border-primary bg-primary-light px-3 py-2.5 text-primary-dark">
          <MdDescription size={18} />
          <span className="whitespace-nowrap text-xs font-semibold">합의된 기획</span>
        </div>
        <span className="text-2xs text-ink-muted">하나의 방향</span>
      </div>
    </div>
  );
}

/* 텍스트 흐름 안에 박혀 폭에 관계없이 항상 글자 위에 얹히는 협업 캐럿 */
function CursorCaret({ name, color }: { name: string; color: string }) {
  return (
    <span className="relative inline-block w-0 align-bottom">
      <span className={cn('absolute bottom-0 left-0 h-4 w-0.5 animate-pulse', color)} />
      <span
        className={cn(
          'absolute left-0 whitespace-nowrap rounded px-1 py-0.5 text-2xs font-semibold text-white',
          color
        )}
        style={{ bottom: '1rem' }}
      >
        {name}
      </span>
    </span>
  );
}

interface DocumentLine {
  label: string;
  text: string;
  cursorAfter?: string;
  cursorName?: string;
  cursorColor?: string;
}

const DOCUMENT_LINES: DocumentLine[] = [
  { label: '아이디어 입력', text: '사용자는 메인 화면에서 핵심 아이디어를 한 줄로 입력합니다.' },
  {
    label: 'AI 질문 · 초안 생성',
    text: 'AI가 빈틈을 짚어 질문을 던지고, 답변을 바탕으로 초안을 작성합니다.',
    cursorAfter: '초안을',
    cursorName: '현우',
    cursorColor: 'bg-primary',
  },
  { label: '실시간 협업', text: '팀원들은 같은 문서를 동시에 보며 함께 편집합니다.' },
  {
    label: '백로그 전환',
    text: '완성된 문서는 곧바로 백로그로 이어집니다.',
    cursorAfter: '백로그로',
    cursorName: '민석',
    cursorColor: 'bg-green',
  },
];

function renderLineText(line: DocumentLine) {
  if (!line.cursorAfter || !line.cursorName || !line.cursorColor) return line.text;
  const splitIndex = line.text.indexOf(line.cursorAfter) + line.cursorAfter.length;
  return (
    <>
      {line.text.slice(0, splitIndex)}
      <CursorCaret name={line.cursorName} color={line.cursorColor} />
      {line.text.slice(splitIndex)}
    </>
  );
}

function RealtimeCollabVisual() {
  return (
    <BrowserFrame url="aidea.app/workspace">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="text-2xs font-semibold text-ink">유저 시나리오</span>
        <div className="ml-auto flex items-center -space-x-2">
          <div className="rounded-full ring-2 ring-white">
            <UserAvatar name="현우" size={20} />
          </div>
          <div className="rounded-full ring-2 ring-white">
            <UserAvatar name="민석" size={20} />
          </div>
        </div>
        <span className="text-2xs text-ink-muted">2명 편집 중</span>
      </div>

      <ol className="flex list-decimal flex-col gap-3 p-5 pl-9">
        {DOCUMENT_LINES.map((line) => (
          <li key={line.label} className="text-2xs leading-relaxed text-ink marker:text-ink-muted">
            <strong className="font-semibold text-ink">{line.label}</strong>: {renderLineText(line)}
          </li>
        ))}
      </ol>
    </BrowserFrame>
  );
}

const BACKLOG_CARDS: Record<
  string,
  {
    title: string;
    issueType: 'FE' | 'BE';
    number: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    assignee: string;
  }
> = {
  OPEN: {
    title: '회원가입 폼 UI',
    issueType: 'FE',
    number: 12,
    priority: 'MEDIUM',
    assignee: '지은',
  },
  IN_PROGRESS: {
    title: '로그인 API 연동',
    issueType: 'BE',
    number: 7,
    priority: 'HIGH',
    assignee: '현우',
  },
  DONE: { title: 'DB 스키마 설계', issueType: 'BE', number: 3, priority: 'LOW', assignee: '민석' },
};

function BacklogVisual() {
  return (
    <BrowserFrame url="aidea.app/backlog">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <MdDescription size={14} className="text-ink-muted" />
        <span className="text-2xs font-semibold text-ink">기획 문서 기반 자동 생성</span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border">
        {BOARD_COLUMNS.map((col) => {
          const card = BACKLOG_CARDS[col.status];
          return (
            <div key={col.status} className="flex flex-col gap-2 p-2.5">
              <div className="flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', col.dotClass)} />
                <span className="text-2xs font-semibold text-ink">{col.label}</span>
              </div>
              {card && (
                <div className="flex flex-col gap-1.5 rounded-md border border-border bg-white p-2 shadow-sm">
                  <span className="text-2xs leading-snug text-ink">{card.title}</span>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <IssueTypeTag issueType={card.issueType} number={card.number} />
                      <PriorityBadge priority={card.priority} />
                    </div>
                    <UserAvatar name={card.assignee} size={16} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </BrowserFrame>
  );
}

const PROBLEM_SOLUTIONS: ProblemSolution[] = [
  {
    id: 'misalignment',
    title: 'AI의 발전으로 구현은 쉬워졌지만 기획은…?',
    problemBullets: [
      'AI 발전에 따라 구현 속도가 정말 빨라졌습니다.',
      '그러나 명확한 기획이 없다면 팀원들 간 생각 차이가 생기고, 결과물이 산으로 갑니다.',
    ],
    solutionLabel: 'AI 기획 지원',
    solutionText: '이를 잡아주기 위해 AI가 아주 빠른 속도로 기획을 잡아주어 문제를 해결합니다.',
    Icon: MdAutoAwesome,
    iconBg: 'bg-ai-bg',
    iconColor: 'text-ai',
    Visual: MisalignmentVisual,
  },
  {
    id: 'collab',
    title: '협업 과정의 혼선 감소',
    problemBullets: [
      '누가 언제 어디를 어떻게 수정했는지 모른다면 팀원 간 의견 충돌 가능성이 있습니다.',
    ],
    solutionLabel: '실시간 협업 에디터',
    solutionText: '실시간으로 누가 어디를 편집하고 있는지 볼 수 있게 하여 충돌을 해결합니다.',
    Icon: MdGroups,
    iconBg: 'bg-primary-light',
    iconColor: 'text-primary-dark',
    Visual: RealtimeCollabVisual,
  },
  {
    id: 'backlog',
    title: '기획과 구현 사이의 간극',
    problemBullets: ['기획을 해도 그에 맞게 개발은 어떻게 해야 할지 할 일 관리가 막막합니다.'],
    solutionLabel: '백로그 관리',
    solutionText:
      '기획 문서를 기반으로 할 일을 초안으로 잡아주고, 실시간으로 편집 가능하게 하여 문제를 해결합니다.',
    Icon: MdViewKanban,
    iconBg: 'bg-surface',
    iconColor: 'text-ink',
    Visual: BacklogVisual,
  },
];

export default function ValuePropSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const active = PROBLEM_SOLUTIONS[activeIndex];

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-xl font-semibold uppercase tracking-widest text-primary">
            왜 Aidea인가요
          </p>
          <h2 className="mb-4 text-4xl font-bold text-ink">구현은 빨라졌는데, 기획은 제자리</h2>
          <p className="mx-auto max-w-lg text-ink-muted" style={{ fontSize: '1rem' }}>
            AI 코딩 도구가 구현 장벽을 낮춘 사이, 파편화된 문서와 끊어진 협업이
            <br />
            새로운 병목이 되었습니다. Aidea는 그 지점을 정확히 풀어냅니다.
          </p>
        </div>

        {/* Problem tabs + solution detail */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Tab buttons */}
          <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {PROBLEM_SOLUTIONS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'min-w-55 shrink-0 rounded-lg border px-4 py-3 text-left transition-colors lg:w-full lg:min-w-0',
                  index === activeIndex
                    ? 'border-primary bg-primary-light'
                    : 'border-border bg-white hover:border-primary/40'
                )}
              >
                <span
                  className={cn(
                    'mb-1 block text-xs font-semibold uppercase tracking-wide',
                    index === activeIndex ? 'text-primary-dark' : 'text-ink-muted'
                  )}
                >
                  문제 0{index + 1}
                </span>
                <span
                  className={cn(
                    'block font-semibold',
                    index === activeIndex ? 'text-ink' : 'text-ink-muted'
                  )}
                  style={{ fontSize: '0.875rem' }}
                >
                  {item.title}
                </span>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div
            key={activeIndex}
            className="animate-fade-in-up rounded-xl border border-border bg-white p-8"
          >
            {/* Visual */}
            <active.Visual />

            {/* Problem */}
            <div className="mt-6 mb-6">
              <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-ink-muted">
                문제
              </span>
              <ul className="flex flex-col gap-1.5">
                {active.problemBullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-2 leading-relaxed text-ink"
                    style={{ fontSize: '0.9375rem' }}
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            {/* Connector */}
            <div className="mb-6 flex items-center gap-2 text-primary">
              <MdArrowForward />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Aidea가 해결합니다
              </span>
            </div>

            {/* Solution */}
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
                  active.iconBg,
                  active.iconColor
                )}
              >
                <active.Icon size={22} />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {active.solutionLabel}
                </p>
                <p className="leading-relaxed text-ink" style={{ fontSize: '0.9375rem' }}>
                  {active.solutionText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
