import { useEffect, useCallback, useState } from 'react';
import { MdClose, MdSettings, MdList, MdGridView, MdTune } from 'react-icons/md';
import { useBacklogSocket } from '@/hooks/useBacklogSocket';
import { useBacklogStore } from '@/store/backlogStore';
import { useTeamspaceDetail } from '@/hooks/useTeamspaceDetail';
import { useStoryApi } from '@/hooks/useStoryApi';
import type {
  StoryStatus,
  BacklogConfigResponse,
  StorySummary,
  CreateStoryRequest,
  StoryDetail,
} from '@/types/backlog';
import WelcomeScreen from './WelcomeScreen';
import ConfigModal from './ConfigModal';
import BacklogListView from './BacklogListView';
import BacklogBoardView from './BacklogBoardView';
import StoryFormModal from './StoryFormModal';
import EpicManagerModal from './EpicManagerModal';

interface BacklogModalProps {
  teamspaceId: string;
  onClose: () => void;
}

function isConfigEmpty(config: BacklogConfigResponse) {
  return (
    !config.feBeEnabled &&
    !config.epicEnabled &&
    !config.storyEnabled &&
    !config.priorityEnabled &&
    !config.sprintEnabled &&
    !config.dueDateEnabled
  );
}

// ── 메인 뷰 ──────────────────────────────────────────────────────

type ViewMode = 'list' | 'board';
type StatusFilter = StoryStatus | 'all';

interface StoryFormState {
  mode: 'create' | 'edit';
  defaultStatus?: StoryStatus;
  story?: StorySummary;
}

interface BacklogMainViewProps {
  teamspaceId: string;
  config: BacklogConfigResponse;
  onConfigOpen: () => void;
  onClose: () => void;
}

function BacklogMainView({ teamspaceId, config, onConfigOpen, onClose }: BacklogMainViewProps) {
  const stories = useBacklogStore((s) => s.stories);
  const epics = useBacklogStore((s) => s.epics);
  const { handleCreate, handleUpdate } = useStoryApi(teamspaceId);
  const { teamspace } = useTeamspaceDetail(teamspaceId);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [groupByEpic, setGroupByEpic] = useState(false);
  const [storyForm, setStoryForm] = useState<StoryFormState | null>(null);
  const [epicManagerOpen, setEpicManagerOpen] = useState(false);

  const STATUS_TABS: { label: string; value: StatusFilter }[] = [
    { label: '전체', value: 'all' },
    { label: '할 일', value: 'OPEN' },
    { label: '진행 중', value: 'IN_PROGRESS' },
    { label: '완료', value: 'DONE' },
  ];

  const handleAddStory = (defaultStatus?: StoryStatus) => {
    setStoryForm({ mode: 'create', defaultStatus });
  };

  const handleEditStory = (story: StorySummary) => {
    setStoryForm({ mode: 'edit', story });
  };

  const handleFormSave = async (
    data: CreateStoryRequest & { status?: StoryStatus }
  ): Promise<StoryDetail> => {
    if (storyForm?.mode === 'edit' && storyForm.story) {
      return handleUpdate(storyForm.story.id, data);
    }
    return handleCreate(data);
  };

  const members = teamspace?.members ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h2 className="text-xl font-bold text-ink">백로그</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onConfigOpen}
            className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface transition-colors"
            aria-label="설정"
          >
            <MdSettings size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface transition-colors"
            aria-label="닫기"
          >
            <MdClose size={20} />
          </button>
        </div>
      </div>

      {/* 필터 툴바 */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border shrink-0 flex-wrap">
        {/* 상태 탭 */}
        <div className="flex items-center gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* 에픽 관련 버튼 */}
        {config.epicEnabled && (
          <>
            <button
              onClick={() => setGroupByEpic((v) => !v)}
              className={`flex items-center gap-1 px-3 py-1 rounded border text-sm transition-colors ${
                groupByEpic
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-border text-ink-muted hover:text-ink'
              }`}
            >
              그룹: 에픽 {groupByEpic ? '▲' : '▼'}
            </button>
            <button
              onClick={() => setEpicManagerOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded border border-border text-sm text-ink-muted hover:text-ink transition-colors"
              aria-label="에픽 관리"
              title="에픽 관리"
            >
              <MdTune size={16} />
              <span>에픽 관리</span>
            </button>
          </>
        )}

        {/* 뷰 전환 */}
        <div className="flex items-center border border-border rounded overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-2.5 py-1 text-sm transition-colors ${
              viewMode === 'list' ? 'bg-primary text-white' : 'text-ink-muted hover:bg-surface'
            }`}
            aria-label="목록 뷰"
          >
            <MdList size={16} />
            <span>목록</span>
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1 px-2.5 py-1 text-sm transition-colors ${
              viewMode === 'board' ? 'bg-primary text-white' : 'text-ink-muted hover:bg-surface'
            }`}
            aria-label="보드 뷰"
          >
            <MdGridView size={16} />
            <span>보드</span>
          </button>
        </div>

        {/* 이슈 추가 버튼 */}
        <button
          onClick={() => handleAddStory()}
          className="flex items-center gap-1 px-3 py-1 rounded bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          + 이슈 추가
        </button>
      </div>

      {/* 뷰 본문 */}
      <div className="flex-1 min-h-0">
        {viewMode === 'list' ? (
          <BacklogListView
            stories={stories}
            config={config}
            teamspaceId={teamspaceId}
            statusFilter={statusFilter}
            groupByEpic={groupByEpic}
            onEditStory={handleEditStory}
          />
        ) : (
          <BacklogBoardView
            teamspaceId={teamspaceId}
            config={config}
            onAddStory={handleAddStory}
            onEditStory={handleEditStory}
          />
        )}
      </div>

      {/* 스토리 생성/수정 폼 모달 */}
      {storyForm && (
        <StoryFormModal
          mode={storyForm.mode}
          defaultStatus={storyForm.defaultStatus}
          initialData={
            storyForm.story
              ? {
                  id: storyForm.story.id,
                  title: storyForm.story.title,
                  priority: storyForm.story.priority,
                  issueType: storyForm.story.issueType,
                  sprint: storyForm.story.sprint,
                  epicIds: storyForm.story.epics.map((e) => e.id),
                  assigneeId: storyForm.story.assignee?.id ?? null,
                  dueDate: storyForm.story.dueDate ?? undefined,
                  status: storyForm.story.status,
                }
              : undefined
          }
          config={config}
          epics={epics}
          members={members}
          onSave={handleFormSave}
          onClose={() => setStoryForm(null)}
          onManageEpics={() => setEpicManagerOpen(true)}
        />
      )}

      {/* 에픽 관리 모달 */}
      {epicManagerOpen && (
        <EpicManagerModal
          teamspaceId={teamspaceId}
          epics={epics}
          onClose={() => setEpicManagerOpen(false)}
        />
      )}
    </div>
  );
}

// ── 모달 컨테이너 ─────────────────────────────────────────────────

export default function BacklogModal({ teamspaceId, onClose }: BacklogModalProps) {
  const { isInitialized, config, reset } = useBacklogStore((s) => ({
    isInitialized: s.isInitialized,
    config: s.config,
    reset: s.reset,
  }));

  useBacklogSocket({ teamspaceId, enabled: true });

  const [showConfig, setShowConfig] = useState(false);

  const storeScreen =
    !isInitialized || !config ? 'loading' : isConfigEmpty(config) ? 'welcome' : 'main';

  const screen = showConfig ? 'config' : storeScreen;

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (screen === 'welcome') {
    return <WelcomeScreen onStart={() => setShowConfig(true)} onClose={onClose} />;
  }

  if (screen === 'config') {
    return (
      <ConfigModal
        initialConfig={config ?? undefined}
        teamspaceId={teamspaceId}
        onSaved={() => setShowConfig(false)}
        onClose={onClose}
        onBack={() => setShowConfig(false)}
      />
    );
  }

  if (screen === 'main') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl w-250 max-w-[96vw] h-[80vh] flex flex-col overflow-hidden">
          <BacklogMainView
            teamspaceId={teamspaceId}
            config={config!}
            onConfigOpen={() => setShowConfig(true)}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  // loading
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-120 p-10 flex items-center justify-center">
        <span className="text-ink-muted text-sm">백로그 데이터를 불러오는 중...</span>
      </div>
    </div>
  );
}
