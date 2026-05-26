import { useMemo, useState } from 'react';
import type {
  StorySummary,
  BacklogTask,
  EpicResponse,
  BacklogConfigResponse,
  StoryStatus,
} from '@/types/backlog';
import { deleteStory, deleteBacklogTask, deleteEpic } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import { useToastStore } from '@/store/toastStore';
import StoryRow from './StoryRow';
import BacklogTaskRow from './BacklogTaskRow';
import EpicRow from './EpicRow';

type BacklogListItem =
  | { itemType: 'story'; data: StorySummary }
  | { itemType: 'task'; data: BacklogTask }
  | { itemType: 'epic'; data: EpicResponse };

interface BacklogListViewProps {
  stories: StorySummary[];
  backlogTasks: BacklogTask[];
  epics: EpicResponse[];
  config: BacklogConfigResponse;
  teamspaceId: string;
  statusFilter: StoryStatus | 'all';
  groupByEpic: boolean;
  onEditStory: (story: StorySummary) => void;
  onEditTask: (task: BacklogTask) => void;
  onEditEpic: (epic: EpicResponse) => void;
}

export default function BacklogListView({
  stories,
  backlogTasks,
  epics,
  config,
  teamspaceId,
  statusFilter,
  groupByEpic,
  onEditStory,
  onEditTask,
  onEditEpic,
}: BacklogListViewProps) {
  const [expandedStoryId, setExpandedStoryId] = useState<number | null>(null);
  const applyStoryDeleted = useBacklogStore((s) => s.applyStoryDeleted);
  const applyBacklogtaskDeleted = useBacklogStore((s) => s.applyBacklogtaskDeleted);
  const applyEpicDeleted = useBacklogStore((s) => s.applyEpicDeleted);
  const addToast = useToastStore((s) => s.addToast);

  const allItems = useMemo<BacklogListItem[]>(() => {
    const storyItems: BacklogListItem[] = stories.map((s) => ({ itemType: 'story', data: s }));
    const taskItems: BacklogListItem[] = backlogTasks.map((t) => ({ itemType: 'task', data: t }));
    const epicItems: BacklogListItem[] = epics.map((e) => ({ itemType: 'epic', data: e }));
    return [...storyItems, ...taskItems, ...epicItems].sort(
      (a, b) => a.data.position - b.data.position
    );
  }, [stories, backlogTasks, epics]);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return allItems;
    return allItems.filter((item) => item.data.status === statusFilter);
  }, [allItems, statusFilter]);

  const displayedItems = useMemo(() => {
    if (!groupByEpic) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      const aEpicId = a.itemType === 'story' ? (a.data.epics[0]?.id ?? Infinity) : Infinity;
      const bEpicId = b.itemType === 'story' ? (b.data.epics[0]?.id ?? Infinity) : Infinity;
      return aEpicId - bEpicId;
    });
  }, [filteredItems, groupByEpic]);

  const counts = useMemo(
    () => ({
      total: allItems.length,
      inProgress: allItems.filter((i) => i.data.status === 'IN_PROGRESS').length,
      open: allItems.filter((i) => i.data.status === 'OPEN').length,
      done: allItems.filter((i) => i.data.status === 'DONE').length,
    }),
    [allItems]
  );

  const handleExpandToggle = (storyId: number) => {
    setExpandedStoryId((prev) => (prev === storyId ? null : storyId));
  };

  const handleDeleteStory = async (story: StorySummary) => {
    if (!window.confirm(`"${story.title}" 이슈를 삭제하시겠습니까?`)) return;
    try {
      await deleteStory(teamspaceId, story.id);
      applyStoryDeleted(story.id);
    } catch {
      addToast({ type: 'error', message: '이슈 삭제에 실패했습니다.' });
    }
  };

  const handleDeleteTask = async (task: BacklogTask) => {
    if (!window.confirm(`"${task.title}" 태스크를 삭제하시겠습니까?`)) return;
    try {
      await deleteBacklogTask(teamspaceId, task.id);
      applyBacklogtaskDeleted(task.id);
    } catch {
      addToast({ type: 'error', message: '태스크 삭제에 실패했습니다.' });
    }
  };

  const handleDeleteEpic = async (epic: EpicResponse) => {
    if (
      !window.confirm(
        `"${epic.name}" 에픽을 삭제하시겠습니까?\n연결된 스토리의 에픽 관계도 해제됩니다.`
      )
    )
      return;
    try {
      await deleteEpic(teamspaceId, epic.id);
      applyEpicDeleted(epic.id);
    } catch {
      addToast({ type: 'error', message: '에픽 삭제에 실패했습니다.' });
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

      {/* 아이템 목록 */}
      <div className="flex-1 overflow-y-auto">
        {displayedItems.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-ink-muted">
            이슈가 없습니다.
          </div>
        ) : (
          displayedItems.map((item) => {
            if (item.itemType === 'story') {
              return (
                <StoryRow
                  key={`story-${item.data.id}`}
                  story={item.data}
                  config={config}
                  teamspaceId={teamspaceId}
                  isExpanded={expandedStoryId === item.data.id}
                  onExpandToggle={() => handleExpandToggle(item.data.id)}
                  onEditClick={() => onEditStory(item.data)}
                  onDeleteClick={() => handleDeleteStory(item.data)}
                />
              );
            }
            if (item.itemType === 'task') {
              return (
                <BacklogTaskRow
                  key={`task-${item.data.id}`}
                  task={item.data}
                  config={config}
                  teamspaceId={teamspaceId}
                  onEditClick={() => onEditTask(item.data)}
                  onDeleteClick={() => handleDeleteTask(item.data)}
                />
              );
            }
            return (
              <EpicRow
                key={`epic-${item.data.id}`}
                epic={item.data}
                config={config}
                teamspaceId={teamspaceId}
                onEditClick={() => onEditEpic(item.data)}
                onDeleteClick={() => handleDeleteEpic(item.data)}
              />
            );
          })
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
