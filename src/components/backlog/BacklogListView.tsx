import { useMemo, useState } from 'react';
import type { StorySummary, BacklogConfigResponse, StoryStatus } from '@/types/backlog';
import { deleteStory } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import { useToastStore } from '@/store/toastStore';
import StoryRow from './StoryRow';

interface BacklogListViewProps {
  stories: StorySummary[];
  config: BacklogConfigResponse;
  teamspaceId: string;
  statusFilter: StoryStatus | 'all';
  groupByEpic: boolean;
  onEditStory: (story: StorySummary) => void;
}

function sortStoriesByEpic(stories: StorySummary[]): StorySummary[] {
  return [...stories].sort((a, b) => {
    const aEpicId = a.epics[0]?.id ?? Infinity;
    const bEpicId = b.epics[0]?.id ?? Infinity;
    return aEpicId - bEpicId;
  });
}

export default function BacklogListView({
  stories,
  config,
  teamspaceId,
  statusFilter,
  groupByEpic,
  onEditStory,
}: BacklogListViewProps) {
  const [expandedStoryId, setExpandedStoryId] = useState<number | null>(null);
  const applyStoryDeleted = useBacklogStore((s) => s.applyStoryDeleted);
  const addToast = useToastStore((s) => s.addToast);

  const filteredStories = useMemo(() => {
    if (statusFilter === 'all') return stories;
    return stories.filter((s) => s.status === statusFilter);
  }, [stories, statusFilter]);

  const displayedStories = useMemo(
    () => (groupByEpic ? sortStoriesByEpic(filteredStories) : filteredStories),
    [filteredStories, groupByEpic]
  );

  const counts = useMemo(
    () => ({
      total: stories.length,
      inProgress: stories.filter((s) => s.status === 'IN_PROGRESS').length,
      open: stories.filter((s) => s.status === 'OPEN').length,
      done: stories.filter((s) => s.status === 'DONE').length,
    }),
    [stories]
  );

  const handleExpandToggle = (storyId: number) => {
    setExpandedStoryId((prev) => (prev === storyId ? null : storyId));
  };

  const handleDelete = async (story: StorySummary) => {
    if (!window.confirm(`"${story.title}" 이슈를 삭제하시겠습니까?`)) return;
    try {
      await deleteStory(teamspaceId, story.id);
      applyStoryDeleted(story.id);
    } catch {
      addToast({ type: 'error', message: '이슈 삭제에 실패했습니다.' });
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 컬럼 헤더 */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-border text-xs font-medium text-ink-muted shrink-0">
        <div className="w-4 shrink-0" />
        <div className="w-4 shrink-0" />
        <div className="w-20 shrink-0">상태</div>
        {config.feBeEnabled && <div className="w-16 shrink-0">유형</div>}
        <div className="flex-1 min-w-0">제목</div>
        <div className="w-8 shrink-0">담당자</div>
        {config.priorityEnabled && <div className="w-16 shrink-0">우선순위</div>}
        {config.dueDateEnabled && <div className="w-20 shrink-0">마감일</div>}
        {config.sprintEnabled && <div className="w-20 shrink-0">스프린트</div>}
        <div className="w-6 shrink-0" />
      </div>

      {/* 스토리 목록 */}
      <div className="flex-1 overflow-y-auto">
        {displayedStories.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-ink-muted">
            이슈가 없습니다.
          </div>
        ) : (
          displayedStories.map((story) => (
            <StoryRow
              key={story.id}
              story={story}
              config={config}
              teamspaceId={teamspaceId}
              isExpanded={expandedStoryId === story.id}
              onExpandToggle={() => handleExpandToggle(story.id)}
              onEditClick={() => onEditStory(story)}
              onDeleteClick={() => handleDelete(story)}
            />
          ))
        )}
      </div>

      {/* 하단 요약 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface shrink-0 text-xs text-ink-muted">
        <span>
          총 {counts.total}개 이슈 · 진행 중 {counts.inProgress}개 · 할 일 {counts.open}개 · 완료{' '}
          {counts.done}개
        </span>
        <button
          onClick={() => addToast({ type: 'info', message: '준비 중입니다.' })}
          className="text-xs text-ink-muted hover:text-ink transition-colors"
        >
          ↑ GitHub 이슈로 내보내기
        </button>
      </div>
    </div>
  );
}
