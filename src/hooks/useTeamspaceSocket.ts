import { useEffect, useRef } from 'react';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import type {
  ActiveMember,
  MemberFocusRequest,
  TeamspaceServerMessage,
} from '@/types/teamspaceSocket';

interface UseTeamspaceSocketOptions {
  teamspaceId: string | null;
  documentId: string | null;
  enabled?: boolean;
  mock?: boolean;
}

const MOCK_ONLINE_MEMBERS: ActiveMember[] = [
  {
    userId: 1,
    name: '김민석',
    profileImageUrl: null,
    role: 'OWNER',
    currentDocumentId: null,
  },
  {
    userId: 2,
    name: 'Chul',
    profileImageUrl: null,
    role: 'MEMBER',
    currentDocumentId: 'doc_003',
  },
  {
    userId: 3,
    name: 'Jihyun',
    profileImageUrl: null,
    role: 'MEMBER',
    currentDocumentId: 'doc_001',
  },
  {
    userId: 4,
    name: 'Soo',
    profileImageUrl: null,
    role: 'VIEWER',
    currentDocumentId: 'doc_002',
  },
  {
    userId: 5,
    name: 'Doyeon',
    profileImageUrl: null,
    role: 'MEMBER',
    currentDocumentId: 'doc_001',
  },
  {
    userId: 6,
    name: 'Hyun',
    profileImageUrl: null,
    role: 'MEMBER',
    currentDocumentId: 'doc_001',
  },
];

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
  return event === 'teamspace:init' || event === 'teamspace:ready' || event === 'member:update';
}

export function useTeamspaceSocket({
  teamspaceId,
  documentId,
  enabled = true,
  mock = false,
}: UseTeamspaceSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const documentIdRef = useRef<string | null>(documentId);
  const setOnlineMembers = useTeamspaceStore((state) => state.setOnlineMembers);
  const setTeamspaceStatus = useTeamspaceStore((state) => state.setTeamspaceStatus);
  const clearTeamspacePresence = useTeamspaceStore((state) => state.clearTeamspacePresence);

  useEffect(() => {
    documentIdRef.current = documentId;
  }, [documentId]);

  useEffect(() => {
    if (!enabled || !teamspaceId || !mock) return;

    setTeamspaceStatus('CREATED');
    setOnlineMembers(MOCK_ONLINE_MEMBERS);

    return () => clearTeamspacePresence();
  }, [clearTeamspacePresence, enabled, mock, setOnlineMembers, setTeamspaceStatus, teamspaceId]);

  useEffect(() => {
    if (!enabled || !teamspaceId || mock) return;

    const ws = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/ws/teamspace/${teamspaceId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(buildMemberFocusMessage(documentIdRef.current));
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as unknown;
      if (!isTeamspaceServerMessage(message)) return;

      if (message.event === 'teamspace:init') {
        setTeamspaceStatus(message.data.teamspace.status);
        setOnlineMembers(message.data.onlineMembers);
        return;
      }

      if (message.event === 'teamspace:ready') {
        setTeamspaceStatus(message.data.status);
        return;
      }

      setOnlineMembers(message.data.onlineMembers);
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
  }, [clearTeamspacePresence, enabled, mock, setOnlineMembers, setTeamspaceStatus, teamspaceId]);

  useEffect(() => {
    if (mock) return;

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(buildMemberFocusMessage(documentId));
  }, [documentId, mock]);
}
