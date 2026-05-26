import { useMemo } from 'react';
import { MdAdd, MdOutlineCheckBox } from 'react-icons/md';
import type {
  StorySummary,
  BacklogTask,
  BacklogConfigResponse,
  StoryStatus,
} from '@/types/backlog';
import { deleteStory, deleteBacklogTask } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import { useToastStore } from '@/store/toastStore';
import StoryCard from './StoryCard';
import type { IssueKind } from './IssueTypeDropdown';

interface BacklogBoardViewProps {
  teamspaceId: string;
  config: BacklogConfigResponse;
  onAddIssue: (kind: IssueKind, defaultStatus?: StoryStatus) => void;
  onEditStory: (story: StorySummary) => void;
  onEditTask: (task: BacklogTask) => void;
}

const COLUMNS: { label: string; status: StoryStatus; headerClass: string }[] = [
  { label: '할 일', status: 'OPEN', headerClass: 'border-t-4 border-gray-300' },
  { label: '진행 중', status: 'IN_PROGRESS', headerClass: 'border-t-4 border-primary' },
  { label: '완료', status: 'DONE', headerClass: 'border-t-4 border-green-500' },
];

function BacklogTaskCard({
  task,
  config,
  onEdit,
  onDelete,
}: {
  task: BacklogTask;
  config: BacklogConfigResponse;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="bg-white rounded-lg border border-border p-3 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onEdit}
    >
      <div className="flex items-start gap-2">
        <MdOutlineCheckBox size={14} className="text-green-600 mt-0.5 shrink-0" />
        <span className="text-sm text-ink leading-snug line-clamp-2 flex-1">{task.title}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-red-500 transition-all text-xs shrink-0"
          aria-label="삭제"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {config.feBeEnabled && task.issueType && (
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                task.issueType === 'FE'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-purple-50 text-purple-600'
              }`}
            >
              {task.issueType}
            </span>
          )}
        </div>
        {task.assignee && (
          <img
            src={task.assignee.profileImageUrl ?? undefined}
            alt={task.assignee.name}
            className="w-5 h-5 rounded-full object-cover border border-border"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function BacklogBoardView({
  teamspaceId,
  config,
  onAddIssue,
  onEditStory,
  onEditTask,
}: BacklogBoardViewProps) {
  const stories = useBacklogStore((s) => s.stories);
  const backlogTasks = useBacklogStore((s) => s.backlogTasks);
  const applyStoryDeleted = useBacklogStore((s) => s.applyStoryDeleted);
  const applyBacklogtaskDeleted = useBacklogStore((s) => s.applyBacklogtaskDeleted);
  const addToast = useToastStore((s) => s.addToast);

  const storiesByStatus = useMemo(() => {
    const map: Record<StoryStatus, StorySummary[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      DONE: [],
      CLOSED: [],
    };
    stories.forEach((s) => map[s.status].push(s));
    return map;
  }, [stories]);

  const tasksByStatus = useMemo(() => {
    const map: Record<StoryStatus, BacklogTask[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      DONE: [],
      CLOSED: [],
    };
    backlogTasks.forEach((t) => map[t.status].push(t));
    return map;
  }, [backlogTasks]);

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

  return (
    <div className="flex gap-4 h-full px-4 py-3 overflow-x-auto">
      {COLUMNS.map((col) => {
        const colStories = storiesByStatus[col.status];
        const colTasks = tasksByStatus[col.status];
        const totalCount = colStories.length + colTasks.length;
        return (
          <div
            key={col.status}
            className={`flex flex-col flex-shrink-0 w-72 bg-surface rounded-lg ${col.headerClass}`}
          >
            {/* 컬럼 헤더 */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="text-sm font-semibold text-ink">{col.label}</span>
              <span className="text-xs text-ink-muted bg-white border border-border rounded-full px-1.5 py-0.5 leading-none">
                {totalCount}
              </span>
            </div>

            {/* 카드 목록 */}
            <div className="flex flex-col gap-2 px-3 pb-2 overflow-y-auto flex-1 max-h-[calc(90vh-200px)]">
              {colStories.map((story) => (
                <StoryCard
                  key={`story-${story.id}`}
                  story={story}
                  config={config}
                  teamspaceId={teamspaceId}
                  onEdit={() => onEditStory(story)}
                  onDelete={() => handleDeleteStory(story)}
                />
              ))}
              {colTasks.map((task) => (
                <BacklogTaskCard
                  key={`task-${task.id}`}
                  task={task}
                  config={config}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => handleDeleteTask(task)}
                />
              ))}
            </div>

            {/* 이슈 추가 버튼 */}
            <button
              className="mt-2 mx-3 mb-3 w-[calc(100%-1.5rem)] text-ink-muted text-sm hover:text-ink flex items-center gap-1 py-1"
              onClick={() => onAddIssue('task', col.status)}
            >
              <MdAdd size={16} /> 이슈 추가
            </button>
          </div>
        );
      })}
    </div>
  );
}
