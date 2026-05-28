import { useState, useRef, useEffect } from 'react';
import { MdChevronRight, MdExpandMore, MdMoreVert } from 'react-icons/md';
import type { BacklogTask, BacklogConfigResponse, Priority } from '@/types/backlog';
import UserAvatar from '@/components/ui/UserAvatar';
import IssueTypeTag from './IssueTypeTag';
import StatusBadge from './StatusBadge';
import type { ColWidths } from './BacklogListView';

const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};
const PRIORITY_CLASS: Record<Priority, string> = {
  LOW: 'text-blue-500',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-500',
};

function formatDueDate(dueDate: string): string {
  const raw = dueDate as unknown;
  if (Array.isArray(raw)) {
    const [, month, day] = raw as [number, number, number];
    return `${month}/${day}`;
  }
  let s: string;
  if (raw instanceof Date) {
    s = raw.toISOString();
  } else if (typeof raw === 'number') {
    s = new Date(raw).toISOString();
  } else {
    s = String(raw);
  }
  const parts = s.split('T')[0].split('-');
  if (parts.length < 3) return '-';
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

interface NoParentSectionProps {
  tasks: BacklogTask[];
  config: BacklogConfigResponse;
  colWidths: ColWidths;
  onEditClick: (task: BacklogTask) => void;
  onDeleteClick: (task: BacklogTask) => void;
}

interface TaskRowProps {
  task: BacklogTask;
  index: number;
  config: BacklogConfigResponse;
  colWidths: ColWidths;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

function TaskRow({ task, index, config, colWidths, onEditClick, onDeleteClick }: TaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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
    <div className="flex items-center hover:bg-surface group border-b border-border/40 last:border-b-0">
      {/* Title column */}
      <div className="flex-1 flex items-center gap-2.5 pl-10 pr-3 py-2 min-w-0 overflow-hidden">
        <span className="w-4 text-xs text-ink-muted text-right shrink-0 select-none">
          {index + 1}
        </span>

        {config.feBeEnabled && task.issueType && (
          <IssueTypeTag issueType={task.issueType} number={task.number} />
        )}

        <span
          className={`flex-1 text-sm truncate ${
            task.status === 'DONE' ? 'line-through text-ink-muted' : 'text-ink'
          }`}
        >
          <span className="text-ink-muted font-medium mr-1">[Task]</span>
          {task.title}
        </span>
      </div>

      {/* Assignees column */}
      <div
        className={`${colWidths.assignees} px-3 border-l border-border/60 flex items-center justify-center shrink-0 self-stretch`}
      >
        {task.assignee && (
          <UserAvatar
            name={task.assignee.name}
            imageUrl={task.assignee.profileImageUrl}
            size={20}
          />
        )}
      </div>

      {/* Status column */}
      <div
        className={`${colWidths.status} px-3 border-l border-border/60 flex items-center justify-center shrink-0 self-stretch`}
      >
        <StatusBadge status={task.status} />
      </div>

      {/* Priority column */}
      {config.priorityEnabled && (
        <div
          className={`${colWidths.priority} px-3 border-l border-border/60 flex items-center justify-center shrink-0 self-stretch`}
        >
          {task.priority ? (
            <span className={`text-xs font-medium ${PRIORITY_CLASS[task.priority]}`}>
              {PRIORITY_LABEL[task.priority]}
            </span>
          ) : (
            <span className="text-xs text-ink-muted">-</span>
          )}
        </div>
      )}

      {/* Sprint column */}
      {config.sprintEnabled && (
        <div
          className={`${colWidths.sprint} px-3 border-l border-border/60 flex items-center justify-center shrink-0 self-stretch`}
        >
          {task.sprint ? (
            <span className="text-xs text-ink truncate">{task.sprint}</span>
          ) : (
            <span className="text-xs text-ink-muted">-</span>
          )}
        </div>
      )}

      {/* DueDate column */}
      {config.dueDateEnabled && (
        <div
          className={`${colWidths.dueDate} px-3 border-l border-border/60 flex items-center justify-center shrink-0 self-stretch`}
        >
          {task.dueDate ? (
            <span className="text-xs text-ink">{formatDueDate(task.dueDate)}</span>
          ) : (
            <span className="text-xs text-ink-muted">-</span>
          )}
        </div>
      )}

      {/* More menu */}
      <div className="w-8 flex items-center justify-center shrink-0">
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
            <MdMoreVert size={14} />
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
  );
}

export default function NoParentSection({
  tasks,
  config,
  colWidths,
  onEditClick,
  onDeleteClick,
}: NoParentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (tasks.length === 0) return null;

  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const progressPct = Math.round((doneCount / tasks.length) * 100);

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Section header row */}
      <div
        className="flex items-center hover:bg-surface group cursor-pointer select-none"
        onClick={() => setIsExpanded((v) => !v)}
      >
        {/* Title column */}
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 min-w-0 overflow-hidden">
          <span className="shrink-0 text-ink-muted">
            {isExpanded ? <MdExpandMore size={16} /> : <MdChevronRight size={16} />}
          </span>

          <span className="font-medium text-sm text-ink">No Parent Issue</span>

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
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
        </div>

        <div className="w-8 shrink-0" />
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
              colWidths={colWidths}
              onEditClick={() => onEditClick(task)}
              onDeleteClick={() => onDeleteClick(task)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
