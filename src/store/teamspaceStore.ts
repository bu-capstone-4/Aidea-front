import { create } from 'zustand';
import type { ActiveMember } from '@/types/teamspaceSocket';
import type { DocumentAiStatus } from '@/types/api';

interface PendingDraft {
  documentId: string;
  content: string;
}

interface TeamspaceState {
  currentTeamspaceId: string | null;
  onlineMembers: ActiveMember[];
  documentAiStatuses: Record<string, DocumentAiStatus>;
  pendingDraft: PendingDraft | null;
  setCurrentTeamspaceId: (id: string | null) => void;
  setOnlineMembers: (members: ActiveMember[]) => void;
  setDocumentAiStatus: (documentId: string, aiStatus: DocumentAiStatus) => void;
  setPendingDraft: (draft: PendingDraft | null) => void;
  clearTeamspacePresence: () => void;
}

export const useTeamspaceStore = create<TeamspaceState>()((set) => ({
  currentTeamspaceId: null,
  onlineMembers: [],
  documentAiStatuses: {},
  pendingDraft: null,
  setCurrentTeamspaceId: (id) => set({ currentTeamspaceId: id }),
  setOnlineMembers: (members) => set({ onlineMembers: members }),
  setDocumentAiStatus: (documentId, aiStatus) =>
    set((state) => ({
      documentAiStatuses: { ...state.documentAiStatuses, [documentId]: aiStatus },
    })),
  setPendingDraft: (draft) => set({ pendingDraft: draft }),
  clearTeamspacePresence: () =>
    set({ onlineMembers: [], documentAiStatuses: {}, pendingDraft: null }),
}));
