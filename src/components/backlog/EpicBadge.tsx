import type { EpicSummary } from '@/types/backlog';

interface EpicBadgeProps {
  epics: EpicSummary[];
}

export default function EpicBadge({ epics }: EpicBadgeProps) {
  if (!epics.length) return null;

  const primary = epics[0];
  const overflow = epics.length - 1;

  return (
    <div className="flex items-center gap-1">
      <span
        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap"
        style={{ backgroundColor: primary.color + '33', color: primary.color }}
      >
        <span
          className="inline-block size-1.5 rounded-full shrink-0"
          style={{ backgroundColor: primary.color }}
        />
        {primary.name}
      </span>
      {overflow > 0 && <span className="text-xs text-ink-muted">+{overflow}</span>}
    </div>
  );
}
