import { useEffect, useRef, useState } from 'react';
import { useBacklogStore } from '@/store/backlogStore';
import { handleSocketError } from '@/shared/socketErrorHandler';
import type { BacklogServerMessage, BacklogOnlineEditor } from '@/types/backlog';

interface UseBacklogSocketOptions {
  teamspaceId: string | null;
  enabled?: boolean;
}

interface UseBacklogSocketResult {
  connected: boolean;
  onlineEditors: BacklogOnlineEditor[];
}

const VALID_BACKLOG_TYPES = new Set([
  'backlog:init',
  'backlog:presence',
  'backlog:config_updated',
  'epic:created',
  'epic:updated',
  'epic:deleted',
  'epic:status_changed',
  'epic:reordered',
  'story:created',
  'story:updated',
  'story:status_changed',
  'story:reordered',
  'story:deleted',
  'task:created',
  'task:updated',
  'task:completed',
  'task:reordered',
  'task:deleted',
  'backlogtask:created',
  'backlogtask:updated',
  'backlogtask:status_changed',
  'backlogtask:reordered',
  'backlogtask:deleted',
  'backlogtask:story_changed',
]);

function isBacklogServerMessage(msg: unknown): msg is BacklogServerMessage {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  if (m.event === 'error') return true;
  return typeof m.type === 'string' && VALID_BACKLOG_TYPES.has(m.type);
}

export function useBacklogSocket({
  teamspaceId,
  enabled = true,
}: UseBacklogSocketOptions): UseBacklogSocketResult {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineEditors, setOnlineEditors] = useState<BacklogOnlineEditor[]>([]);

  const applyInit = useBacklogStore((s) => s.applyInit);
  const applyConfigUpdated = useBacklogStore((s) => s.applyConfigUpdated);
  const applyEpicCreated = useBacklogStore((s) => s.applyEpicCreated);
  const applyEpicUpdated = useBacklogStore((s) => s.applyEpicUpdated);
  const applyEpicDeleted = useBacklogStore((s) => s.applyEpicDeleted);
  const applyEpicStatusChanged = useBacklogStore((s) => s.applyEpicStatusChanged);
  const applyEpicReordered = useBacklogStore((s) => s.applyEpicReordered);
  const applyStoryCreated = useBacklogStore((s) => s.applyStoryCreated);
  const applyStoryUpdated = useBacklogStore((s) => s.applyStoryUpdated);
  const applyStoryStatusChanged = useBacklogStore((s) => s.applyStoryStatusChanged);
  const applyStoryReordered = useBacklogStore((s) => s.applyStoryReordered);
  const applyStoryDeleted = useBacklogStore((s) => s.applyStoryDeleted);
  const applyTaskCreated = useBacklogStore((s) => s.applyTaskCreated);
  const applyTaskUpdated = useBacklogStore((s) => s.applyTaskUpdated);
  const applyTaskCompleted = useBacklogStore((s) => s.applyTaskCompleted);
  const applyTaskReordered = useBacklogStore((s) => s.applyTaskReordered);
  const applyTaskDeleted = useBacklogStore((s) => s.applyTaskDeleted);
  const applyBacklogtaskCreated = useBacklogStore((s) => s.applyBacklogtaskCreated);
  const applyBacklogtaskUpdated = useBacklogStore((s) => s.applyBacklogtaskUpdated);
  const applyBacklogtaskStatusChanged = useBacklogStore((s) => s.applyBacklogtaskStatusChanged);
  const applyBacklogtaskReordered = useBacklogStore((s) => s.applyBacklogtaskReordered);
  const applyBacklogtaskDeleted = useBacklogStore((s) => s.applyBacklogtaskDeleted);
  const applyBacklogtaskStoryChanged = useBacklogStore((s) => s.applyBacklogtaskStoryChanged);

  useEffect(() => {
    if (!enabled || !teamspaceId) return;

    const ws = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/ws/backlog/${teamspaceId}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event: MessageEvent<string>) => {
      const raw = JSON.parse(event.data) as unknown;
      if (!isBacklogServerMessage(raw)) return;

      if ('event' in raw) {
        handleSocketError({ code: raw.code, message: raw.message });
        return;
      }

      switch (raw.type) {
        case 'backlog:init':
          applyInit(raw.config, raw.epics, raw.stories, raw.tasks ?? []);
          setOnlineEditors(raw.onlineEditors ?? []);
          break;
        case 'backlog:presence':
          setOnlineEditors(raw.onlineEditors);
          break;
        case 'backlog:config_updated':
          applyConfigUpdated(raw.config);
          break;
        case 'epic:created':
          applyEpicCreated(raw.epic);
          break;
        case 'epic:updated':
          applyEpicUpdated(raw.epic);
          break;
        case 'epic:deleted':
          applyEpicDeleted(raw.epicId);
          break;
        case 'epic:status_changed':
          applyEpicStatusChanged(raw.epicId, raw.status);
          break;
        case 'epic:reordered':
          applyEpicReordered(raw.orderedIds);
          break;
        case 'story:created':
          applyStoryCreated(raw.story);
          break;
        case 'story:updated':
          applyStoryUpdated(raw.story);
          break;
        case 'story:status_changed':
          applyStoryStatusChanged(raw.storyId, raw.status, raw.closedAt);
          break;
        case 'story:reordered':
          applyStoryReordered(raw.orderedIds);
          break;
        case 'story:deleted':
          applyStoryDeleted(raw.storyId);
          break;
        case 'task:created':
          applyTaskCreated(raw.storyId, raw.task);
          break;
        case 'task:updated':
          applyTaskUpdated(raw.storyId, raw.task);
          break;
        case 'task:completed':
          applyTaskCompleted(raw.storyId, raw.taskId, raw.isCompleted);
          break;
        case 'task:reordered':
          applyTaskReordered(raw.storyId, raw.orderedIds);
          break;
        case 'task:deleted':
          applyTaskDeleted(raw.storyId, raw.taskId);
          break;
        case 'backlogtask:created':
          applyBacklogtaskCreated(raw.task);
          break;
        case 'backlogtask:updated':
          applyBacklogtaskUpdated(raw.task);
          break;
        case 'backlogtask:status_changed':
          applyBacklogtaskStatusChanged(raw.taskId, raw.status);
          break;
        case 'backlogtask:reordered':
          applyBacklogtaskReordered(raw.orderedIds);
          break;
        case 'backlogtask:deleted':
          applyBacklogtaskDeleted(raw.taskId);
          break;
        case 'backlogtask:story_changed':
          applyBacklogtaskStoryChanged(raw.taskId, raw.storyId);
          break;
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setOnlineEditors([]);
      wsRef.current = null;
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      ws.close(1000);
      wsRef.current = null;
    };
  }, [
    enabled,
    teamspaceId,
    applyInit,
    applyConfigUpdated,
    applyEpicCreated,
    applyEpicUpdated,
    applyEpicDeleted,
    applyEpicStatusChanged,
    applyEpicReordered,
    applyStoryCreated,
    applyStoryUpdated,
    applyStoryStatusChanged,
    applyStoryReordered,
    applyStoryDeleted,
    applyTaskCreated,
    applyTaskUpdated,
    applyTaskCompleted,
    applyTaskReordered,
    applyTaskDeleted,
    applyBacklogtaskCreated,
    applyBacklogtaskUpdated,
    applyBacklogtaskStatusChanged,
    applyBacklogtaskReordered,
    applyBacklogtaskDeleted,
    applyBacklogtaskStoryChanged,
  ]);

  return { connected, onlineEditors };
}
