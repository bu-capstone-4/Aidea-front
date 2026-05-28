import { useMemo, useState } from 'react';
import type {
  StorySummary,
  BacklogTask,
  EpicResponse,
  BacklogConfigResponse,
  StoryStatus,
} from '@/types/backlog';
import { deleteStory, deleteBacklogTask } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import { useToastStore } from '@/store/toastStore';
import StoryRow from './StoryRow';
import NoParentSection from './NoParentSection';

export interface ColWidths {
  assignees: string;
  status: string;
  priority: string;
  sprint: string;
  dueDate: string;
}

const COL_WIDTHS: ColWidths = {
  assignees: 'w-15',
  status: 'w-20',
  priority: 'w-16',
  sprint: 'w-20',
  dueDate: 'w-16',
};

interface BacklogListViewProps {
  stories: StorySummary[];
  backlogTasks: BacklogTask[];
  epics: EpicResponse[];
  config: BacklogConfigResponse;
  teamspaceId: string;
  statusFilter: StoryStatus | 'all';
  onEditStory: (story: StorySummary) => void;
  onEditTask: (task: BacklogTask) => void;
  onEditEpic: (epic: EpicResponse) => void;
  onAddTaskForStory: (storyId: number) => void;
}

export default function BacklogListView({
  stories,
  backlogTasks,
  config,
  teamspaceId,
  statusFilter,
  onEditStory,
  onEditTask,
  onAddTaskForStory,
}: BacklogListViewProps) {
  const [collapsedStoryIds, setCollapsedStoryIds] = useState<Set<number>>(new Set());
  const applyStoryDeleted = useBacklogStore((s) => s.applyStoryDeleted);
  const applyBacklogtaskDeleted = useBacklogStore((s) => s.applyBacklogtaskDeleted);
  const addToast = useToastStore((s) => s.addToast);

  const filteredStories = useMemo(() => {
    const sorted = [...stories].sort((a, b) => a.position - b.position);
    if (statusFilter === 'all') return sorted;
    return sorted.filter((s) => s.status === statusFilter);
  }, [stories, statusFilter]);

  const displayedStories = useMemo(() => {
    return [...filteredStories].sort((a, b) => {
      const aEpicId = a.epics[0]?.id ?? Infinity;
      const bEpicId = b.epics[0]?.id ?? Infinity;
      return aEpicId - bEpicId;
    });
  }, [filteredStories]);

  const filteredBacklogTasks = useMemo(() => {
    const sorted = [...backlogTasks]
      .filter((t) => t.storyId === null)
      .sort((a, b) => a.position - b.position);
    if (statusFilter === 'all') return sorted;
    return sorted.filter((t) => t.status === statusFilter);
  }, [backlogTasks, statusFilter]);

  const counts = useMemo(() => {
    const all = [...stories, ...backlogTasks];
    return {
      total: all.length,
      inProgress: all.filter((i) => i.status === 'IN_PROGRESS').length,
      open: all.filter((i) => i.status === 'OPEN').length,
      done: all.filter((i) => i.status === 'DONE').length,
    };
  }, [stories, backlogTasks]);

  const handleExpandToggle = (storyId: number) => {
    setCollapsedStoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) next.delete(storyId);
      else next.add(storyId);
      return next;
    });
  };

  const handleDeleteStory = async (story: StorySummary) => {
    if (!window.confirm(`"${story.title}" 이슈를 삭제하시겠습니까?`)) return;
    try {
      await deleteStory(teamspaceId, story.id);
      applyStoryDeleted(story.id);
    } catch {
      addToast({ type: 'error', message: '이슈 삭제에 실패했습니다.' });
    }
  };

  const handleDeleteTask = async (task: BacklogTask) => {
    if (!window.confirm(`"${task.title}" 태스크를 삭제하시겠습니까?`)) return;
    try {
      await deleteBacklogTask(teamspaceId, task.id);
      applyBacklogtaskDeleted(task.id);
    } catch {
      addToast({ type: 'error', message: '태스크 삭제에 실패했습니다.' });
    }
  };

  const isEmpty = displayedStories.length === 0 && filteredBacklogTasks.length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Table column header */}
      <div className="flex items-center border-b border-border bg-surface shrink-0 text-xs font-semibold text-ink-muted select-none">
        <div className="flex-1 px-4 py-2">Title</div>
        <div className={`${COL_WIDTHS.assignees} px-3 py-2 border-l border-border text-center`}>
          담당자
        </div>
        <div className={`${COL_WIDTHS.status} px-3 py-2 border-l border-border text-center`}>
          상태
        </div>
        {config.priorityEnabled && (
          <div className={`${COL_WIDTHS.priority} px-3 py-2 border-l border-border text-center`}>
            중요도
          </div>
        )}
        {config.sprintEnabled && (
          <div className={`${COL_WIDTHS.sprint} px-3 py-2 border-l border-border text-center`}>
            스프린트
          </div>
        )}
        {config.dueDateEnabled && (
          <div className={`${COL_WIDTHS.dueDate} px-3 py-2 border-l border-border text-center`}>
            마감일
          </div>
        )}
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex items-center justify-center h-32 text-sm text-ink-muted">
            이슈가 없습니다.
          </div>
        ) : (
          <>
            {displayedStories.map((story) => (
              <StoryRow
                key={`story-${story.id}`}
                story={story}
                config={config}
                teamspaceId={teamspaceId}
                colWidths={COL_WIDTHS}
                isExpanded={!collapsedStoryIds.has(story.id)}
                onExpandToggle={() => handleExpandToggle(story.id)}
                onEditClick={() => onEditStory(story)}
                onDeleteClick={() => handleDeleteStory(story)}
                onAddItemClick={() => onAddTaskForStory(story.id)}
                onEditLinkedTask={onEditTask}
              />
            ))}

            <NoParentSection
              tasks={filteredBacklogTasks}
              config={config}
              colWidths={COL_WIDTHS}
              onEditClick={onEditTask}
              onDeleteClick={handleDeleteTask}
            />
          </>
        )}
      </div>

      {/* 하단 요약 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface shrink-0 text-xs text-ink-muted">
        <span>
          총 {counts.total}개 이슈 · 진행 중 {counts.inProgress}개 · 할 일 {counts.open}개 · 완료{' '}
          {counts.done}개
        </span>
      </div>
    </div>
  );
}
