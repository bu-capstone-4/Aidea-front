import type { StoryStatus, Priority, IssueType } from '@/types/backlog';

// ── Status ──────────────────────────────────────────────────────────────────

export const STATUS_OPTIONS: { value: StoryStatus; label: string }[] = [
  { value: 'OPEN', label: '할 일' },
  { value: 'IN_PROGRESS', label: '진행 중' },
  { value: 'DONE', label: '완료' },
  { value: 'CLOSED', label: '종료' },
];

export type StatusFilter = StoryStatus | 'all';

export const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: '전체', value: 'all' },
  { label: '할 일', value: 'OPEN' },
  { label: '진행 중', value: 'IN_PROGRESS' },
  { label: '완료', value: 'DONE' },
];

export const STATUS_MENU_ITEMS: { label: string; value: StoryStatus }[] = [
  { label: '할 일로 변경', value: 'OPEN' },
  { label: '진행 중으로 변경', value: 'IN_PROGRESS' },
  { label: '완료로 변경', value: 'DONE' },
];

export const STATUS_LABEL: Record<StoryStatus, string> = {
  OPEN: '할 일',
  IN_PROGRESS: '진행 중',
  DONE: '완료',
  CLOSED: '종료',
};

export const STATUS_CLASS: Record<StoryStatus, string> = {
  OPEN: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-400',
};

// ── Priority ─────────────────────────────────────────────────────────────────

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'LOW', label: '낮음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HIGH', label: '높음' },
  { value: 'URGENT', label: '긴급' },
];

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

// 텍스트 전용 색상 (NoParentSection, StoryDetailPanel)
export const PRIORITY_TEXT_CLASS: Record<Priority, string> = {
  LOW: 'text-blue-500',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-500',
};

// 뱃지 배경+텍스트 색상 (PriorityBadge)
export const PRIORITY_BADGE_CLASS: Record<Priority, string> = {
  LOW: 'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-yellow-50 text-yellow-600',
  HIGH: 'bg-orange-50 text-orange-600',
  URGENT: 'bg-red-50 text-red-600',
};

// ── IssueType ─────────────────────────────────────────────────────────────────

export const ISSUE_TYPE_OPTIONS: { value: IssueType; label: string }[] = [
  { value: 'FE', label: 'FE' },
  { value: 'BE', label: 'BE' },
];

export const ISSUE_TYPE_CLASS: Record<IssueType, string> = {
  FE: 'bg-blue-50 text-blue-600 border-blue-200',
  BE: 'bg-purple-50 text-purple-600 border-purple-200',
};

// ── Epic ──────────────────────────────────────────────────────────────────────

export const EPIC_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#06b6d4',
  '#78716c',
  '#6b7280',
];

// ── Board ─────────────────────────────────────────────────────────────────────

export const BOARD_COLUMNS: { label: string; status: StoryStatus; dotClass: string }[] = [
  { label: '할 일', status: 'OPEN', dotClass: 'bg-gray-400' },
  { label: '진행 중', status: 'IN_PROGRESS', dotClass: 'bg-primary' },
  { label: '완료', status: 'DONE', dotClass: 'bg-green-500' },
];

export const DND_KEY = 'application/backlog-task-id';

// ── List view ─────────────────────────────────────────────────────────────────

export interface ColWidths {
  assignees: string;
  status: string;
  priority: string;
  sprint: string;
  dueDate: string;
}

export const COL_WIDTHS: ColWidths = {
  assignees: 'w-15',
  status: 'w-20',
  priority: 'w-16',
  sprint: 'w-20',
  dueDate: 'w-16',
};

// ── Welcome ───────────────────────────────────────────────────────────────────

export const FEATURE_BADGES = ['이슈 관리', '담당자 배정', '스프린트', '실시간 협업'];
