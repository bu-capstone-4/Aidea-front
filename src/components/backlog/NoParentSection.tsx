import { useState, useRef, useEffect } from 'react';
import { MdChevronRight, MdExpandMore, MdMoreVert } from 'react-icons/md';
import type { BacklogTask, BacklogConfigResponse } from '@/types/backlog';
import UserAvatar from '@/components/ui/UserAvatar';
import IssueTypeTag from './IssueTypeTag';

interface NoParentSectionProps {
  tasks: BacklogTask[];
  config: BacklogConfigResponse;
  onEditClick: (task: BacklogTask) => void;
  onDeleteClick: (task: BacklogTask) => void;
}

interface TaskRowProps {
  task: BacklogTask;
  index: number;
  config: BacklogConfigResponse;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

function TaskRow({ task, index, config, onEditClick, onDeleteClick }: TaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-2.5 pl-10 pr-4 py-2 hover:bg-surface group border-b border-border/40 last:border-b-0">
      {/* Sequential index */}
      <span className="w-4 text-xs text-ink-muted text-right shrink-0 select-none">
        {index + 1}
      </span>

      {/* FE/BE issue type tag */}
      {config.feBeEnabled && task.issueType && (
        <IssueTypeTag issueType={task.issueType} number={task.number} />
      )}

      {/* [Task] prefix + title */}
      <span
        className={`flex-1 text-sm truncate ${
          task.status === 'DONE' ? 'line-through text-ink-muted' : 'text-ink'
        }`}
      >
        <span className="text-ink-muted font-medium mr-1">[Task]</span>
        {task.title}
      </span>

      {/* Right side: assignee + more menu */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {task.assignee && (
          <UserAvatar
            name={task.assignee.name}
            imageUrl={task.assignee.profileImageUrl}
            size={20}
          />
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-ink transition-all p-0.5 rounded"
            aria-label="더보기"
          >
            <MdMoreVert size={14} />
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
    </div>
  );
}

export default function NoParentSection({
  tasks,
  config,
  onEditClick,
  onDeleteClick,
}: NoParentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (tasks.length === 0) return null;

  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const progressPct = Math.round((doneCount / tasks.length) * 100);

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Section header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface group cursor-pointer select-none"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <span className="shrink-0 text-ink-muted">
          {isExpanded ? <MdExpandMore size={16} /> : <MdChevronRight size={16} />}
        </span>

        <span className="font-medium text-sm text-ink">No Parent Issue</span>

        {/* Task count + progress */}
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          <span className="text-xs font-medium text-ink-muted">{tasks.length}</span>
          <span className="text-xs text-ink-muted">
            {doneCount}/{tasks.length}
          </span>
          <div className="w-20 h-1.5 bg-border rounded-full">
            <div
              className="h-full bg-gray-400 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-ink-muted">{progressPct}%</span>
        </div>

        <div className="flex-1 min-w-0" />
      </div>

      {/* Expanded task rows */}
      {isExpanded && (
        <div className="border-t border-border/60 bg-surface/30">
          {tasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              index={index}
              config={config}
              onEditClick={() => onEditClick(task)}
              onDeleteClick={() => onDeleteClick(task)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
