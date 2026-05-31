import { useState, useRef, useEffect } from 'react';
import { MdOutlineCheckBox, MdMoreVert } from 'react-icons/md';
import type { BacklogTask, BacklogConfigResponse } from '@/types/backlog';
import { updateBacklogTaskStatus } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import UserAvatar from '@/components/ui/UserAvatar';
import StatusBadge from './StatusBadge';
import IssueTypeTag from './IssueTypeTag';
import PriorityBadge from './PriorityBadge';

interface BacklogTaskRowProps {
  task: BacklogTask;
  config: BacklogConfigResponse;
  teamspaceId: string;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export default function BacklogTaskRow({
  task,
  config,
  teamspaceId,
  onEditClick,
  onDeleteClick,
}: BacklogTaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const applyBacklogtaskStatusChanged = useBacklogStore((s) => s.applyBacklogtaskStatusChanged);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const handleCheckbox = async () => {
    const nextStatus = task.status === 'DONE' ? 'OPEN' : 'DONE';
    try {
      await updateBacklogTaskStatus(teamspaceId, task.id, nextStatus);
      applyBacklogtaskStatusChanged(task.id, nextStatus);
    } catch {
      // WS로 정합성 유지
    }
  };

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface group border-b border-border last:border-b-0">
      {/* 체크박스 */}
      <input
        type="checkbox"
        checked={task.status === 'DONE'}
        onChange={handleCheckbox}
        className="shrink-0 accent-primary cursor-pointer"
        aria-label="완료 처리"
      />

      {/* 태스크 타입 아이콘 (expand 자리 대신) */}
      <span className="shrink-0 text-green-600 opacity-60">
        <MdOutlineCheckBox size={18} />
      </span>

      {/* 상태 뱃지 */}
      <div className="w-20 shrink-0">
        <StatusBadge status={task.status} />
      </div>

      {/* 제목 */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span
          className={`text-sm truncate ${task.status === 'DONE' ? 'line-through text-ink-muted' : 'text-ink'}`}
        >
          {task.title}
        </span>
      </div>

      {/* 이슈 타입 필드 */}
      {config.feBeEnabled && (
        <div className="w-24 shrink-0 flex items-center justify-center">
          {task.issueType ? (
            <IssueTypeTag issueType={task.issueType} number={task.number} />
          ) : (
            <span className="text-xs text-ink-muted">-</span>
          )}
        </div>
      )}

      {/* 담당자 */}
      <div className="w-8 shrink-0">
        {task.assignee ? (
          <UserAvatar
            name={task.assignee.name}
            imageUrl={task.assignee.profileImageUrl}
            githubLogin={task.assignee.githubLogin}
            size={28}
          />
        ) : (
          '-'
        )}
      </div>

      {/* 우선순위 */}
      {config.priorityEnabled && (
        <div className="w-16 shrink-0">
          {task.priority && <PriorityBadge priority={task.priority} />}
        </div>
      )}

      {/* 마감일 */}
      {config.dueDateEnabled && (
        <div className="w-20 shrink-0 text-xs text-ink-muted">{formattedDueDate ?? '-'}</div>
      )}

      {/* 스프린트 */}
      {config.sprintEnabled && (
        <div className="w-20 shrink-0 text-xs text-ink-muted truncate">{task.sprint ?? '-'}</div>
      )}

      {/* 더보기 메뉴 */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-ink transition-all p-0.5 rounded"
          aria-label="더보기"
        >
          <MdMoreVert size={18} />
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
  );
}
