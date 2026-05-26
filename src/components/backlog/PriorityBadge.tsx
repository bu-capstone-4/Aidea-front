import type { Priority } from '@/types/backlog';

const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

const PRIORITY_CLASS: Record<Priority, string> = {
  LOW: 'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-yellow-50 text-yellow-600',
  HIGH: 'bg-orange-50 text-orange-600',
  URGENT: 'bg-red-50 text-red-600',
};

interface PriorityBadgeProps {
  priority: Priority;
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${PRIORITY_CLASS[priority]}`}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
