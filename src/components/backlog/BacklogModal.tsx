import { useEffect, useCallback, useState } from 'react';
import { useBacklogSocket } from '@/hooks/useBacklogSocket';
import { useBacklogStore } from '@/store/backlogStore';
import WelcomeScreen from './WelcomeScreen';
import ConfigModal from './ConfigModal';

interface BacklogModalProps {
  teamspaceId: string;
  onClose: () => void;
}

function isConfigEmpty(config: {
  feBeEnabled: boolean;
  epicEnabled: boolean;
  storyEnabled: boolean;
  priorityEnabled: boolean;
  sprintEnabled: boolean;
  dueDateEnabled: boolean;
}) {
  return (
    !config.feBeEnabled &&
    !config.epicEnabled &&
    !config.storyEnabled &&
    !config.priorityEnabled &&
    !config.sprintEnabled &&
    !config.dueDateEnabled
  );
}

export default function BacklogModal({ teamspaceId, onClose }: BacklogModalProps) {
  const { isInitialized, config, reset } = useBacklogStore((s) => ({
    isInitialized: s.isInitialized,
    config: s.config,
    reset: s.reset,
  }));

  useBacklogSocket({ teamspaceId, enabled: true });

  // 사용자 조작으로 전환되는 화면 (welcome → config)
  const [showConfig, setShowConfig] = useState(false);

  // 스토어 기반 파생 화면 계산 — useEffect 내 setState 없이 직접 파생
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
        <div className="bg-white rounded-xl shadow-xl w-240 max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-bold text-ink">백로그</h2>
            <button
              onClick={onClose}
              className="text-ink-muted hover:text-ink transition-colors text-2xl leading-none"
              aria-label="닫기"
            >
              ×
            </button>
          </div>
          {/* Task 05에서 BacklogListView로 교체 예정 */}
          <div className="flex-1 flex items-center justify-center text-ink-muted">
            목록 뷰 준비 중 (Task 05)
          </div>
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
