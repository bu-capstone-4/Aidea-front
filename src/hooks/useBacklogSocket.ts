import { useEffect, useRef, useState } from 'react';
import { useBacklogStore } from '@/store/backlogStore';
import { handleSocketError } from '@/shared/socketErrorHandler';
import type { BacklogServerMessage } from '@/types/backlog';

interface UseBacklogSocketOptions {
  teamspaceId: string | null;
  enabled?: boolean;
}

interface UseBacklogSocketResult {
  connected: boolean;
  onlineEditorCount: number;
}

const VALID_BACKLOG_TYPES = new Set([
  'backlog:init',
  'backlog:config_updated',
  'epic:created',
  'epic:updated',
  'epic:deleted',
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

  const applyInit = useBacklogStore((s) => s.applyInit);
  const applyConfigUpdated = useBacklogStore((s) => s.applyConfigUpdated);
  const applyEpicCreated = useBacklogStore((s) => s.applyEpicCreated);
  const applyEpicUpdated = useBacklogStore((s) => s.applyEpicUpdated);
  const applyEpicDeleted = useBacklogStore((s) => s.applyEpicDeleted);
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
          applyInit(raw.config, raw.epics, raw.stories);
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
      }
    };

    ws.onclose = () => {
      setConnected(false);
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
  ]);

  return { connected, onlineEditorCount: 0 };
}
