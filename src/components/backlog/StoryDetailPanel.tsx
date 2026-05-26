import type { TaskResponse, BacklogConfigResponse } from '@/types/backlog';

interface StoryDetailPanelProps {
  storyId: number;
  teamspaceId: string;
  tasks: TaskResponse[] | undefined;
  config: BacklogConfigResponse;
}

export default function StoryDetailPanel({ tasks }: StoryDetailPanelProps) {
  return (
    <div className="px-6 py-3 bg-surface border-t border-border">
      {tasks === undefined ? (
        <p className="text-xs text-ink-muted">태스크를 불러오는 중...</p>
      ) : tasks.length === 0 ? (
        <p className="text-xs text-ink-muted">등록된 태스크가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                readOnly
                checked={task.isCompleted}
                className="accent-primary"
              />
              <span className={task.isCompleted ? 'line-through text-ink-muted' : ''}>
                {task.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
