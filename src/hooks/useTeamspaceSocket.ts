import { useEffect, useRef } from 'react';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import type { MemberFocusRequest, TeamspaceServerMessage } from '@/types/teamspaceSocket';

interface UseTeamspaceSocketOptions {
  teamspaceId: string | null;
  documentId: string | null;
  enabled?: boolean;
}

function buildMemberFocusMessage(documentId: string | null): string {
  const message: MemberFocusRequest = {
    event: 'member:focus',
    data: { documentId },
  };

  return JSON.stringify(message);
}

function isTeamspaceServerMessage(message: unknown): message is TeamspaceServerMessage {
  if (!message || typeof message !== 'object') return false;
  const event = (message as { event?: unknown }).event;
  return (
    event === 'teamspace:init' ||
    event === 'draft:ready' ||
    event === 'draft:error' ||
    event === 'member:update'
  );
}

export function useTeamspaceSocket({
  teamspaceId,
  documentId,
  enabled = true,
}: UseTeamspaceSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const documentIdRef = useRef<string | null>(documentId);
  const setOnlineMembers = useTeamspaceStore((state) => state.setOnlineMembers);
  const setDocumentAiStatus = useTeamspaceStore((state) => state.setDocumentAiStatus);
  const setPendingDraft = useTeamspaceStore((state) => state.setPendingDraft);
  const clearTeamspacePresence = useTeamspaceStore((state) => state.clearTeamspacePresence);

  useEffect(() => {
    documentIdRef.current = documentId;
  }, [documentId]);

  useEffect(() => {
    if (!enabled || !teamspaceId) return;

    const ws = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/ws/teamspace/${teamspaceId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(buildMemberFocusMessage(documentIdRef.current));
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as unknown;
      if (!isTeamspaceServerMessage(message)) return;

      if (message.event === 'teamspace:init') {
        setOnlineMembers(message.data.onlineMembers);
        return;
      }

      if (message.event === 'draft:ready') {
        setDocumentAiStatus(message.data.documentId, 'IDLE');
        setPendingDraft({ documentId: message.data.documentId, content: message.data.content });
        return;
      }

      if (message.event === 'draft:error') {
        setDocumentAiStatus(message.data.documentId, 'IDLE');
        return;
      }

      if (message.event === 'member:update') {
        setOnlineMembers(message.data.onlineMembers);
      }
    };

    ws.onclose = () => {
      clearTeamspacePresence();
      wsRef.current = null;
    };

    return () => {
      ws.close(1000);
      clearTeamspacePresence();
      wsRef.current = null;
    };
  }, [clearTeamspacePresence, enabled, setDocumentAiStatus, setOnlineMembers, teamspaceId]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(buildMemberFocusMessage(documentId));
  }, [documentId]);
}
