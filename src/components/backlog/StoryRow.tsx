import { useState, useRef, useEffect } from 'react';
import { MdChevronRight, MdExpandMore, MdMoreVert } from 'react-icons/md';
import { useShallow } from 'zustand/react/shallow';
import type { StorySummary, BacklogConfigResponse, BacklogTask } from '@/types/backlog';
import { getStoryDetail } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import EpicBadge from './EpicBadge';
import StoryDetailPanel from './StoryDetailPanel';
import type { ColWidths } from '@/constants/backlog';

interface StoryRowProps {
  story: StorySummary;
  config: BacklogConfigResponse;
  teamspaceId: string;
  colWidths: ColWidths;
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
  colWidths,
  isExpanded,
  onExpandToggle,
  onEditClick,
  onDeleteClick,
  onAddItemClick,
  onEditLinkedTask,
}: StoryRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const tasks = useBacklogStore((s) => s.tasksByStoryId[story.id]);
  const setTasksForStory = useBacklogStore((s) => s.setTasksForStory);
  const linkedBacklogTasks = useBacklogStore(
    useShallow((s) => s.backlogTasks.filter((t) => t.storyId === story.id))
  );

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (isExpanded && tasks === undefined) {
      setLoadingTasks(true);
      getStoryDetail(teamspaceId, story.id)
        .then((detail) => setTasksForStory(story.id, detail.tasks))
        .finally(() => setLoadingTasks(false));
    }
  }, [isExpanded, tasks, teamspaceId, story.id, setTasksForStory]);

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

  const subTaskTotal = tasks !== undefined ? tasks.length : story.taskCount;
  const subTaskCompleted =
    tasks !== undefined ? tasks.filter((t) => t.isCompleted).length : story.completedTaskCount;
  const linkedCompleted = linkedBacklogTasks.filter((t) => t.status === 'DONE').length;
  const totalCount = subTaskTotal + linkedBacklogTasks.length;
  const completedCount = subTaskCompleted + linkedCompleted;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isDone = story.status === 'DONE';

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Story row */}
      <div
        className="flex items-center hover:bg-surface group cursor-pointer select-none"
        onClick={handleExpand}
      >
        {/* Title column */}
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 min-w-0 overflow-hidden">
          <span className="shrink-0 text-ink-muted">
            {isExpanded ? <MdExpandMore size={16} /> : <MdChevronRight size={16} />}
          </span>

          <span
            className={`font-medium text-sm truncate ${isDone ? 'line-through text-ink-muted' : 'text-ink'}`}
          >
            <span className="text-ink-muted font-medium mr-1">[Story]</span>
            {story.title}
          </span>
          <span className="text-xs text-ink-muted shrink-0">#{story.number}</span>

          {config.epicEnabled && story.epics.length > 0 && (
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <EpicBadge epics={story.epics} />
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <span className="text-xs text-ink-muted">
              {completedCount}/{totalCount}
            </span>
            <div className="w-20 h-1.5 bg-border rounded-full">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-ink-muted">{progressPct}%</span>
          </div>
        </div>

        {/* Assignees column - empty placeholder */}
        <div className={`${colWidths.assignees} px-3 py-2.5 shrink-0`} />

        {/* Status column - empty placeholder */}
        <div className={`${colWidths.status} px-3 py-2.5 shrink-0`} />

        {/* IssueType column - empty placeholder */}
        {config.feBeEnabled && <div className={`${colWidths.issueType} px-3 py-2.5 shrink-0`} />}

        {/* Priority column - empty placeholder */}
        {config.priorityEnabled && <div className={`${colWidths.priority} px-3 py-2.5 shrink-0`} />}

        {/* Sprint column - empty placeholder */}
        {config.sprintEnabled && <div className={`${colWidths.sprint} px-3 py-2.5 shrink-0`} />}

        {/* DueDate column - empty placeholder */}
        {config.dueDateEnabled && <div className={`${colWidths.dueDate} px-3 py-2.5 shrink-0`} />}

        {/* More menu */}
        <div
          className="w-8 flex items-center justify-center shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative" ref={menuRef}>
            <button
              ref={menuButtonRef}
              onClick={() => {
                if (!menuOpen && menuButtonRef.current) {
                  const rect = menuButtonRef.current.getBoundingClientRect();
                  setDropUp(window.innerHeight - rect.bottom < 80);
                }
                setMenuOpen((v) => !v);
              }}
              className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-ink transition-all p-0.5 rounded"
              aria-label="더보기"
            >
              <MdMoreVert size={16} />
            </button>
            {menuOpen && (
              <div
                className={`absolute right-0 w-24 bg-white rounded-lg shadow-lg border border-border z-10 py-1 ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
              >
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
      </div>

      {/* Expanded tasks */}
      {isExpanded && (
        <StoryDetailPanel
          storyId={story.id}
          teamspaceId={teamspaceId}
          tasks={loadingTasks ? undefined : tasks}
          config={config}
          colWidths={colWidths}
          onAddItemClick={onAddItemClick}
          onEditLinkedTask={onEditLinkedTask}
        />
      )}
    </div>
  );
}
