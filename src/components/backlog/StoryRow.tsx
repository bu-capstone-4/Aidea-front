import { useState, useRef, useEffect } from 'react';
import { MdExpandMore, MdExpandLess, MdMoreVert } from 'react-icons/md';
import type { StorySummary, BacklogConfigResponse } from '@/types/backlog';
import { updateStoryStatus, getStoryDetail } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import UserAvatar from '@/components/ui/UserAvatar';
import StatusBadge from './StatusBadge';
import IssueTypeTag from './IssueTypeTag';
import EpicBadge from './EpicBadge';
import PriorityBadge from './PriorityBadge';
import StoryDetailPanel from './StoryDetailPanel';

interface StoryRowProps {
  story: StorySummary;
  config: BacklogConfigResponse;
  teamspaceId: string;
  isExpanded: boolean;
  onExpandToggle: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export default function StoryRow({
  story,
  config,
  teamspaceId,
  isExpanded,
  onExpandToggle,
  onEditClick,
  onDeleteClick,
}: StoryRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tasks = useBacklogStore((s) => s.tasksByStoryId[story.id]);
  const setTasksForStory = useBacklogStore((s) => s.setTasksForStory);
  const applyStoryStatusChanged = useBacklogStore((s) => s.applyStoryStatusChanged);

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

  const handleCheckbox = async () => {
    const nextStatus = story.status === 'DONE' ? 'OPEN' : 'DONE';
    try {
      await updateStoryStatus(teamspaceId, story.id, nextStatus);
      applyStoryStatusChanged(story.id, nextStatus, null);
    } catch {
      // 실패 시 무시 (WS로 정합성 유지)
    }
  };

  const handleDelete = () => {
    setMenuOpen(false);
    onDeleteClick();
  };

  const formattedDueDate = story.dueDate
    ? new Date(story.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : null;

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface group border-b border-border last:border-b-0">
        {/* 체크박스 */}
        <input
          type="checkbox"
          checked={story.status === 'DONE'}
          onChange={handleCheckbox}
          className="shrink-0 accent-primary cursor-pointer"
          aria-label="완료 처리"
        />

        {/* 펼치기 토글 */}
        <button
          onClick={handleExpand}
          className="shrink-0 text-ink-muted hover:text-ink transition-colors"
          aria-label={isExpanded ? '접기' : '펼치기'}
        >
          {isExpanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
        </button>

        {/* 상태 뱃지 */}
        <div className="w-20 shrink-0">
          <StatusBadge status={story.status} />
        </div>

        {/* 이슈 타입 태그 */}
        {config.feBeEnabled && story.issueType && (
          <div className="shrink-0">
            <IssueTypeTag issueType={story.issueType} number={story.number} />
          </div>
        )}

        {/* 제목 + 에픽 뱃지 */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm text-ink truncate">{story.title}</span>
          {config.epicEnabled && story.epics.length > 0 && <EpicBadge epics={story.epics} />}
          {story.taskCount > 0 && (
            <span className="shrink-0 text-xs text-ink-muted">
              {story.completedTaskCount}/{story.taskCount}
            </span>
          )}
        </div>

        {/* 담당자 */}
        <div className="w-8 shrink-0">
          {story.assignee && (
            <UserAvatar
              name={story.assignee.name}
              imageUrl={story.assignee.profileImageUrl}
              size={28}
            />
          )}
        </div>

        {/* 우선순위 */}
        {config.priorityEnabled && (
          <div className="w-16 shrink-0">
            {story.priority && <PriorityBadge priority={story.priority} />}
          </div>
        )}

        {/* 마감일 */}
        {config.dueDateEnabled && (
          <div className="w-20 shrink-0 text-xs text-ink-muted">{formattedDueDate ?? '—'}</div>
        )}

        {/* 스프린트 */}
        {config.sprintEnabled && (
          <div className="w-20 shrink-0 text-xs text-ink-muted truncate">{story.sprint ?? '—'}</div>
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
                onClick={handleDelete}
                className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 펼쳐진 태스크 패널 */}
      {isExpanded && (
        <StoryDetailPanel
          storyId={story.id}
          teamspaceId={teamspaceId}
          tasks={loadingTasks ? undefined : tasks}
          config={config}
        />
      )}
    </>
  );
}
