import { useCallback, useMemo, useState } from 'react';
import { MdAdd, MdExpandMore, MdChevronRight, MdMoreVert } from 'react-icons/md';
import type {
  StorySummary,
  BacklogTask,
  BacklogConfigResponse,
  StoryStatus,
} from '@/types/backlog';
import { deleteStory, deleteBacklogTask, updateBacklogTaskStatus } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import { useToastStore } from '@/store/toastStore';
import type { IssueKind } from './IssueTypeDropdown';

interface BacklogBoardViewProps {
  teamspaceId: string;
  config: BacklogConfigResponse;
  onAddIssue: (kind: IssueKind, defaultStatus?: StoryStatus) => void;
  onEditStory: (story: StorySummary) => void;
  onEditTask: (task: BacklogTask) => void;
}

const COLUMNS: { label: string; status: StoryStatus; dotClass: string }[] = [
  { label: '할 일', status: 'OPEN', dotClass: 'bg-gray-400' },
  { label: '진행 중', status: 'IN_PROGRESS', dotClass: 'bg-primary' },
  { label: '완료', status: 'DONE', dotClass: 'bg-green-500' },
];

const DND_KEY = 'application/backlog-task-id';

function TaskCard({
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
  const [dragging, setDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DND_KEY, String(task.id));
        e.dataTransfer.effectAllowed = 'move';
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={`bg-white rounded-md border border-border p-2.5 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition-shadow cursor-grab group ${
        dragging ? 'opacity-40' : ''
      }`}
      onClick={onEdit}
    >
      <div className="flex items-start gap-1.5">
        <span className="text-xs text-ink leading-snug line-clamp-2 flex-1">
          <span className="text-ink-muted">[Task] </span>
          {task.title}
        </span>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
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

function DropColumn({
  tasks,
  config,
  isOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onEditTask,
  onDeleteTask,
  onAddIssue,
}: {
  tasks: BacklogTask[];
  config: BacklogConfigResponse;
  isOver: boolean;
  onDragEnter: () => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onEditTask: (task: BacklogTask) => void;
  onDeleteTask: (task: BacklogTask) => void;
  onAddIssue: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-2 p-3 min-h-18 transition-colors ${
        isOver ? 'bg-primary/5 ring-1 ring-inset ring-primary/30' : ''
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          config={config}
          onEdit={() => onEditTask(task)}
          onDelete={() => onDeleteTask(task)}
        />
      ))}
      <button
        className="text-xs text-ink-muted hover:text-ink flex items-center gap-0.5 mt-auto pt-1"
        onClick={onAddIssue}
      >
        <MdAdd size={14} /> 추가
      </button>
    </div>
  );
}

function StorySection({
  story,
  tasks,
  config,
  onEditStory,
  onDeleteStory,
  onEditTask,
  onDeleteTask,
  onAddIssue,
  onDropTask,
}: {
  story: StorySummary;
  tasks: BacklogTask[];
  config: BacklogConfigResponse;
  onEditStory: () => void;
  onDeleteStory: () => void;
  onEditTask: (task: BacklogTask) => void;
  onDeleteTask: (task: BacklogTask) => void;
  onAddIssue: (status: StoryStatus) => void;
  onDropTask: (taskId: number, newStatus: StoryStatus) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragOverStatus, setDragOverStatus] = useState<StoryStatus | null>(null);

  const progress =
    story.taskCount > 0 ? Math.round((story.completedTaskCount / story.taskCount) * 100) : 0;

  const tasksByStatus = useMemo(() => {
    const map: Record<StoryStatus, BacklogTask[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      DONE: [],
      CLOSED: [],
    };
    tasks.forEach((t) => map[t.status].push(t));
    return map;
  }, [tasks]);

  const handleDrop = (e: React.DragEvent, status: StoryStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const taskId = parseInt(e.dataTransfer.getData(DND_KEY));
    if (!isNaN(taskId)) onDropTask(taskId, status);
  };

  const handleDragLeave = (e: React.DragEvent, status: StoryStatus) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStatus((prev) => (prev === status ? null : prev));
    }
  };

  return (
    <div className="border-b border-border">
      <div
        className="flex items-center gap-2 px-4 py-2.5 bg-surface hover:bg-surface-raised cursor-pointer select-none"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="text-ink-muted shrink-0">
          {collapsed ? <MdChevronRight size={16} /> : <MdExpandMore size={16} />}
        </span>

        <span className="text-sm font-semibold text-ink truncate flex-1 min-w-0">
          <span className="text-ink-muted font-normal">[Story] </span>
          {story.title}
          <span className="text-ink-muted font-normal ml-1.5">#{story.number}</span>
        </span>

        <span className="text-xs text-ink-muted bg-white border border-border rounded-full px-1.5 py-0.5 leading-none shrink-0">
          {tasks.length}
        </span>

        {story.taskCount > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-ink-muted">
              {story.completedTaskCount}/{story.taskCount}
            </span>
            <div className="w-24 bg-border rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-ink-muted w-8 text-right">{progress}%</span>
          </div>
        )}

        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="text-ink-muted hover:text-ink p-0.5 rounded transition-colors"
          >
            <MdMoreVert size={16} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-border z-20 py-1"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEditStory();
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-ink hover:bg-surface"
              >
                수정
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteStory();
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-3 divide-x divide-border bg-white">
          {COLUMNS.map((col) => (
            <DropColumn
              key={col.status}
              tasks={tasksByStatus[col.status]}
              config={config}
              isOver={dragOverStatus === col.status}
              onDragEnter={() => setDragOverStatus(col.status)}
              onDragLeave={(e) => handleDragLeave(e, col.status)}
              onDrop={(e) => handleDrop(e, col.status)}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onAddIssue={() => onAddIssue(col.status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoParentSection({
  tasks,
  config,
  onEditTask,
  onDeleteTask,
  onAddIssue,
  onDropTask,
}: {
  tasks: BacklogTask[];
  config: BacklogConfigResponse;
  onEditTask: (task: BacklogTask) => void;
  onDeleteTask: (task: BacklogTask) => void;
  onAddIssue: (status: StoryStatus) => void;
  onDropTask: (taskId: number, newStatus: StoryStatus) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [dragOverStatus, setDragOverStatus] = useState<StoryStatus | null>(null);

  const tasksByStatus = useMemo(() => {
    const map: Record<StoryStatus, BacklogTask[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      DONE: [],
      CLOSED: [],
    };
    tasks.forEach((t) => map[t.status].push(t));
    return map;
  }, [tasks]);

  const handleDrop = (e: React.DragEvent, status: StoryStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const taskId = parseInt(e.dataTransfer.getData(DND_KEY));
    if (!isNaN(taskId)) onDropTask(taskId, status);
  };

  const handleDragLeave = (e: React.DragEvent, status: StoryStatus) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStatus((prev) => (prev === status ? null : prev));
    }
  };

  return (
    <div className="border-b border-border">
      <div
        className="flex items-center gap-2 px-4 py-2.5 bg-surface hover:bg-surface-raised cursor-pointer select-none"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="text-ink-muted shrink-0">
          {collapsed ? <MdChevronRight size={16} /> : <MdExpandMore size={16} />}
        </span>
        <span className="text-sm font-semibold text-ink flex-1">No Parent Issue</span>
        <span className="text-xs text-ink-muted bg-white border border-border rounded-full px-1.5 py-0.5 leading-none shrink-0">
          {tasks.length}
        </span>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-3 divide-x divide-border bg-white">
          {COLUMNS.map((col) => (
            <DropColumn
              key={col.status}
              tasks={tasksByStatus[col.status]}
              config={config}
              isOver={dragOverStatus === col.status}
              onDragEnter={() => setDragOverStatus(col.status)}
              onDragLeave={(e) => handleDragLeave(e, col.status)}
              onDrop={(e) => handleDrop(e, col.status)}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onAddIssue={() => onAddIssue(col.status)}
            />
          ))}
        </div>
      )}
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
  const applyBacklogtaskStatusChanged = useBacklogStore((s) => s.applyBacklogtaskStatusChanged);
  const addToast = useToastStore((s) => s.addToast);

  const tasksByStoryId = useMemo(() => {
    const map: Record<number, BacklogTask[]> = {};
    for (const task of backlogTasks) {
      if (task.storyId != null) {
        if (!map[task.storyId]) map[task.storyId] = [];
        map[task.storyId].push(task);
      }
    }
    return map;
  }, [backlogTasks]);

  const standaloneTasks = useMemo(
    () => backlogTasks.filter((t) => t.storyId == null),
    [backlogTasks]
  );

  const columnCounts = useMemo(() => {
    const counts: Record<StoryStatus, number> = { OPEN: 0, IN_PROGRESS: 0, DONE: 0, CLOSED: 0 };
    backlogTasks.forEach((t) => counts[t.status]++);
    return counts;
  }, [backlogTasks]);

  const handleDropTask = useCallback(
    async (taskId: number, newStatus: StoryStatus) => {
      const task = backlogTasks.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) return;
      applyBacklogtaskStatusChanged(taskId, newStatus);
      try {
        await updateBacklogTaskStatus(teamspaceId, taskId, newStatus);
      } catch {
        applyBacklogtaskStatusChanged(taskId, task.status);
        addToast({ type: 'error', message: '상태 변경에 실패했습니다.' });
      }
    },
    [backlogTasks, teamspaceId, applyBacklogtaskStatusChanged, addToast]
  );

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

  const sortedStories = useMemo(
    () => [...stories].sort((a, b) => a.position - b.position),
    [stories]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 컬럼 헤더 */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-surface shrink-0">
        {COLUMNS.map((col) => (
          <div key={col.status} className="flex items-center gap-2 px-4 py-3">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dotClass}`} />
            <span className="text-sm font-semibold text-ink">{col.label}</span>
            <span className="text-xs text-ink-muted bg-white border border-border rounded-full px-1.5 py-0.5 leading-none">
              {columnCounts[col.status]}
            </span>
            <button
              className="ml-auto text-ink-muted hover:text-ink transition-colors"
              onClick={() => onAddIssue('task', col.status)}
              title="이슈 추가"
            >
              <MdAdd size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* 섹션 목록 */}
      <div className="flex-1 overflow-y-auto">
        {sortedStories.map((story) => (
          <StorySection
            key={story.id}
            story={story}
            tasks={tasksByStoryId[story.id] ?? []}
            config={config}
            onEditStory={() => onEditStory(story)}
            onDeleteStory={() => handleDeleteStory(story)}
            onEditTask={onEditTask}
            onDeleteTask={handleDeleteTask}
            onAddIssue={(status) => onAddIssue('task', status)}
            onDropTask={handleDropTask}
          />
        ))}

        {standaloneTasks.length > 0 && (
          <NoParentSection
            tasks={standaloneTasks}
            config={config}
            onEditTask={onEditTask}
            onDeleteTask={handleDeleteTask}
            onAddIssue={(status) => onAddIssue('task', status)}
            onDropTask={handleDropTask}
          />
        )}
      </div>
    </div>
  );
}
