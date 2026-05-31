import type { StoryStatus } from '@/types/backlog';
import { STATUS_LABEL, STATUS_CLASS } from '@/constants/backlog';

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
