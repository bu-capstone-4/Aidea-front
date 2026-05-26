import { useMemo } from 'react';
import { MdAdd } from 'react-icons/md';
import type { StorySummary, BacklogConfigResponse, StoryStatus } from '@/types/backlog';
import { deleteStory } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import { useToastStore } from '@/store/toastStore';
import StoryCard from './StoryCard';

interface BacklogBoardViewProps {
  teamspaceId: string;
  config: BacklogConfigResponse;
  onAddStory: (defaultStatus?: StoryStatus) => void;
  onEditStory: (story: StorySummary) => void;
}

const COLUMNS: { label: string; status: StoryStatus; headerClass: string }[] = [
  { label: '할 일', status: 'OPEN', headerClass: 'border-t-4 border-gray-300' },
  { label: '진행 중', status: 'IN_PROGRESS', headerClass: 'border-t-4 border-primary' },
  { label: '완료', status: 'DONE', headerClass: 'border-t-4 border-green-500' },
];

export default function BacklogBoardView({
  teamspaceId,
  config,
  onAddStory,
  onEditStory,
}: BacklogBoardViewProps) {
  const stories = useBacklogStore((s) => s.stories);
  const applyStoryDeleted = useBacklogStore((s) => s.applyStoryDeleted);
  const addToast = useToastStore((s) => s.addToast);

  const storiesByStatus = useMemo(() => {
    const map: Record<StoryStatus, StorySummary[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      DONE: [],
      CLOSED: [],
    };
    stories.forEach((s) => map[s.status].push(s));
    return map;
  }, [stories]);

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
    <div className="flex gap-4 h-full px-4 py-3 overflow-x-auto">
      {COLUMNS.map((col) => {
        const colStories = storiesByStatus[col.status];
        return (
          <div
            key={col.status}
            className={`flex flex-col flex-shrink-0 w-72 bg-surface rounded-lg ${col.headerClass}`}
          >
            {/* 컬럼 헤더 */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="text-sm font-semibold text-ink">{col.label}</span>
              <span className="text-xs text-ink-muted bg-white border border-border rounded-full px-1.5 py-0.5 leading-none">
                {colStories.length}
              </span>
            </div>

            {/* 카드 목록 */}
            <div className="flex flex-col gap-2 px-3 pb-2 overflow-y-auto flex-1 max-h-[calc(90vh-200px)]">
              {colStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  config={config}
                  teamspaceId={teamspaceId}
                  onEdit={() => onEditStory(story)}
                  onDelete={() => handleDelete(story)}
                />
              ))}
            </div>

            {/* 이슈 추가 버튼 */}
            <button
              className="mt-2 mx-3 mb-3 w-[calc(100%-1.5rem)] text-ink-muted text-sm hover:text-ink flex items-center gap-1 py-1"
              onClick={() => onAddStory(col.status)}
            >
              <MdAdd size={16} /> 이슈 추가
            </button>
          </div>
        );
      })}
    </div>
  );
}
