import { useState, useRef, useEffect } from 'react';
import { MdOutlineBookmarks, MdMoreVert } from 'react-icons/md';
import type { EpicResponse, BacklogConfigResponse } from '@/types/backlog';
import { updateEpicStatus } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import UserAvatar from '@/components/ui/UserAvatar';
import StatusBadge from './StatusBadge';
import IssueTypeTag from './IssueTypeTag';
import PriorityBadge from './PriorityBadge';

interface EpicRowProps {
  epic: EpicResponse;
  config: BacklogConfigResponse;
  teamspaceId: string;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export default function EpicRow({
  epic,
  config,
  teamspaceId,
  onEditClick,
  onDeleteClick,
}: EpicRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const applyEpicStatusChanged = useBacklogStore((s) => s.applyEpicStatusChanged);

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
    const nextStatus = epic.status === 'DONE' ? 'OPEN' : 'DONE';
    try {
      await updateEpicStatus(teamspaceId, epic.id, nextStatus);
      applyEpicStatusChanged(epic.id, nextStatus);
    } catch {
      // WS로 정합성 유지
    }
  };

  const formattedDueDate = epic.dueDate
    ? new Date(epic.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : null;

  const storyProgress =
    epic.storyCount > 0 ? `${epic.completedStoryCount}/${epic.storyCount}` : null;

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface group border-b border-border last:border-b-0">
      {/* 체크박스 */}
      <input
        type="checkbox"
        checked={epic.status === 'DONE'}
        onChange={handleCheckbox}
        className="shrink-0 accent-primary cursor-pointer"
        aria-label="완료 처리"
      />

      {/* 에픽 아이콘 + 컬러 도트 */}
      <div className="shrink-0 flex items-center gap-1">
        <span className="text-purple-500 opacity-70">
          <MdOutlineBookmarks size={18} />
        </span>
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: epic.color }}
        />
      </div>

      {/* 상태 뱃지 */}
      <div className="w-20 shrink-0">
        <StatusBadge status={epic.status} />
      </div>

      {/* 이슈 타입 태그 */}
      {config.feBeEnabled && epic.issueType && (
        <div className="shrink-0">
          <IssueTypeTag issueType={epic.issueType} number={epic.number} />
        </div>
      )}

      {/* 에픽 이름 + 스토리 진행 */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span
          className={`text-sm font-medium truncate ${epic.status === 'DONE' ? 'line-through text-ink-muted' : 'text-ink'}`}
        >
          {epic.name}
        </span>
        {storyProgress && (
          <span className="shrink-0 text-xs text-ink-muted">{storyProgress} 스토리</span>
        )}
      </div>

      {/* 담당자 */}
      <div className="w-8 shrink-0">
        {epic.assignee && (
          <UserAvatar
            name={epic.assignee.name}
            imageUrl={epic.assignee.profileImageUrl}
            githubLogin={epic.assignee.githubLogin}
            size={28}
          />
        )}
      </div>

      {/* 우선순위 */}
      {config.priorityEnabled && (
        <div className="w-16 shrink-0">
          {epic.priority && <PriorityBadge priority={epic.priority} />}
        </div>
      )}

      {/* 마감일 */}
      {config.dueDateEnabled && (
        <div className="w-20 shrink-0 text-xs text-ink-muted">{formattedDueDate ?? '—'}</div>
      )}

      {/* 스프린트 자리 (에픽은 스프린트 없음, 컬럼 정렬 유지용) */}
      {config.sprintEnabled && <div className="w-20 shrink-0" />}

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
