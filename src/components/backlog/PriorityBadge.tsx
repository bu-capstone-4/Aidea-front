import type { Priority } from '@/types/backlog';
import { PRIORITY_LABEL, PRIORITY_BADGE_CLASS } from '@/constants/backlog';

interface PriorityBadgeProps {
  priority: Priority;
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${PRIORITY_BADGE_CLASS[priority]}`}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
