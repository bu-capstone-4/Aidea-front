import type { StoryStatus } from '@/types/backlog';

const STATUS_LABEL: Record<StoryStatus, string> = {
  OPEN: '할 일',
  IN_PROGRESS: '진행 중',
  DONE: '완료',
  CLOSED: '종료',
};

const STATUS_CLASS: Record<StoryStatus, string> = {
  OPEN: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-400',
};

interface StatusBadgeProps {
  status: StoryStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
