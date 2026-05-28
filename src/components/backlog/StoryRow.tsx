import { useState, useRef, useEffect } from 'react';
import { MdChevronRight, MdExpandMore, MdMoreVert } from 'react-icons/md';
import type { StorySummary, BacklogConfigResponse, BacklogTask } from '@/types/backlog';
import { getStoryDetail } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import UserAvatar from '@/components/ui/UserAvatar';
import EpicBadge from './EpicBadge';
import StoryDetailPanel from './StoryDetailPanel';

interface StoryRowProps {
  story: StorySummary;
  config: BacklogConfigResponse;
  teamspaceId: string;
  isExpanded: boolean;
  onExpandToggle: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onAddItemClick: () => void;
  onEditLinkedTask: (task: BacklogTask) => void;
}

export default function StoryRow({
  story,
  config,
  teamspaceId,
  isExpanded,
  onExpandToggle,
  onEditClick,
  onDeleteClick,
  onAddItemClick,
  onEditLinkedTask,
}: StoryRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tasks = useBacklogStore((s) => s.tasksByStoryId[story.id]);
  const setTasksForStory = useBacklogStore((s) => s.setTasksForStory);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const handleExpand = async () => {
    onExpandToggle();
    if (!isExpanded && tasks === undefined) {
      setLoadingTasks(true);
      try {
        const detail = await getStoryDetail(teamspaceId, story.id);
        setTasksForStory(story.id, detail.tasks);
      } finally {
        setLoadingTasks(false);
      }
    }
  };

  const progressPct =
    story.taskCount > 0 ? Math.round((story.completedTaskCount / story.taskCount) * 100) : 0;

  const isDone = story.status === 'DONE';

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Story section header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface group cursor-pointer select-none"
        onClick={handleExpand}
      >
        {/* Expand toggle */}
        <span className="shrink-0 text-ink-muted">
          {isExpanded ? <MdExpandMore size={16} /> : <MdChevronRight size={16} />}
        </span>

        {/* Title + number */}
        <span
          className={`font-medium text-sm truncate ${isDone ? 'line-through text-ink-muted' : 'text-ink'}`}
        >
          <span className="text-ink-muted font-medium mr-1">[Story]</span>
          {story.title}
        </span>
        <span className="text-xs text-ink-muted shrink-0">#{story.number}</span>

        {/* Epic badges */}
        {config.epicEnabled && story.epics.length > 0 && (
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            <EpicBadge epics={story.epics} />
          </div>
        )}

        {/* Task progress */}
        {story.taskCount > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <span className="text-xs font-medium text-ink-muted">{story.taskCount}</span>
            <span className="text-xs text-ink-muted">
              {story.completedTaskCount}/{story.taskCount}
            </span>
            <div className="w-20 h-1.5 bg-border rounded-full">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-ink-muted">{progressPct}%</span>
          </div>
        )}

        <div className="flex-1 min-w-0" />

        {/* Assignee */}
        {story.assignee && (
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            <UserAvatar
              name={story.assignee.name}
              imageUrl={story.assignee.profileImageUrl}
              size={24}
            />
          </div>
        )}

        {/* More menu */}
        <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-ink transition-all p-0.5 rounded"
            aria-label="더보기"
          >
            <MdMoreVert size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-24 bg-white rounded-lg shadow-lg border border-border z-10 py-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEditClick();
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-surface"
              >
                수정
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteClick();
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded tasks */}
      {isExpanded && (
        <StoryDetailPanel
          storyId={story.id}
          teamspaceId={teamspaceId}
          tasks={loadingTasks ? undefined : tasks}
          config={config}
          onAddItemClick={onAddItemClick}
          onEditLinkedTask={onEditLinkedTask}
        />
      )}
    </div>
  );
}
