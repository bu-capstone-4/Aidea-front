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
    event === 'draft:questioning' ||
    event === 'draft:ready' ||
    event === 'draft:error' ||
    event === 'member:update' ||
    event === 'member:role_changed'
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
  const setMemberRole = useTeamspaceStore((state) => state.setMemberRole);
  const setDocumentAiStatus = useTeamspaceStore((state) => state.setDocumentAiStatus);
  const setPendingDraft = useTeamspaceStore((state) => state.setPendingDraft);
  const setDraftQuestioning = useTeamspaceStore((state) => state.setDraftQuestioning);
  const clearDraftQA = useTeamspaceStore((state) => state.clearDraftQA);
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

      if (message.event === 'draft:questioning') {
        setDraftQuestioning(message.data.documentId, message.data.draftId, message.data.questions);
        return;
      }

      if (message.event === 'draft:ready') {
        setDocumentAiStatus(message.data.documentId, 'IDLE');
        setPendingDraft({ documentId: message.data.documentId, content: message.data.content });
        clearDraftQA();
        return;
      }

      if (message.event === 'draft:error') {
        setDocumentAiStatus(message.data.documentId, 'IDLE');
        clearDraftQA();
        return;
      }

      if (message.event === 'member:update') {
        setOnlineMembers(message.data.onlineMembers);
        return;
      }

      if (message.event === 'member:role_changed') {
        setMemberRole(message.data.userId, message.data.role);
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
  }, [
    clearDraftQA,
    clearTeamspacePresence,
    enabled,
    setDocumentAiStatus,
    setDraftQuestioning,
    setMemberRole,
    setOnlineMembers,
    setPendingDraft,
    teamspaceId,
  ]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(buildMemberFocusMessage(documentId));
  }, [documentId]);
}
