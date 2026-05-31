import { useState, useRef, useEffect } from 'react';
import { MdMoreVert } from 'react-icons/md';
import type { StorySummary, BacklogConfigResponse, StoryStatus } from '@/types/backlog';
import { updateStoryStatus } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import UserAvatar from '@/components/ui/UserAvatar';
import IssueTypeTag from './IssueTypeTag';
import EpicBadge from './EpicBadge';
import { STATUS_MENU_ITEMS } from '@/constants/backlog';
import PriorityBadge from './PriorityBadge';

interface StoryCardProps {
  story: StorySummary;
  config: BacklogConfigResponse;
  teamspaceId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function StoryCard({
  story,
  config,
  teamspaceId,
  onEdit,
  onDelete,
}: StoryCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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

  const handleStatusChange = async (status: StoryStatus) => {
    setMenuOpen(false);
    if (story.status === status) return;
    try {
      await updateStoryStatus(teamspaceId, story.id, status);
      applyStoryStatusChanged(story.id, status, null);
    } catch {
      // WS로 정합성 유지
    }
  };

  return (
    <div className="bg-white rounded-md border border-border shadow-sm p-3 flex flex-col gap-2 hover:shadow-md transition-shadow cursor-pointer">
      {/* 상단 행: IssueTypeTag + 우선순위 뱃지 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {config.feBeEnabled && story.issueType && (
            <IssueTypeTag issueType={story.issueType} number={story.number} />
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {config.priorityEnabled && story.priority && <PriorityBadge priority={story.priority} />}
          {/* 더보기 메뉴 */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="text-ink-muted hover:text-ink transition-colors p-0.5 rounded"
              aria-label="더보기"
            >
              <MdMoreVert size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-border z-20 py-1">
                {STATUS_MENU_ITEMS.filter((item) => item.value !== story.status).map((item) => (
                  <button
                    key={item.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(item.value);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-surface"
                  >
                    {item.label}
                  </button>
                ))}
                <hr className="my-1 border-border" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-surface"
                >
                  수정
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete();
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

      {/* 제목 */}
      <p className="text-sm font-medium text-ink line-clamp-2">{story.title}</p>

      {/* 에픽 뱃지 */}
      {config.epicEnabled && story.epics.length > 0 && <EpicBadge epics={story.epics} />}

      {/* 하단 행: 담당자 아바타 */}
      <div className="flex items-center justify-between mt-auto">
        {story.assignee ? (
          <UserAvatar
            name={story.assignee.name}
            imageUrl={story.assignee.profileImageUrl}
            size={24}
          />
        ) : (
          <span className="text-xs text-ink-muted">미배정</span>
        )}
        {story.taskCount > 0 && (
          <span className="text-xs text-ink-muted">
            {story.completedTaskCount}/{story.taskCount}
          </span>
        )}
      </div>
    </div>
  );
}
