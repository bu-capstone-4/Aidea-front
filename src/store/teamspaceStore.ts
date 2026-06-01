import { create } from 'zustand';
import type { ActiveMember } from '@/types/teamspaceSocket';
import type { DocumentAiStatus } from '@/types/api';

interface TeamspaceState {
  currentTeamspaceId: string | null;
  onlineMembers: ActiveMember[];
  documentAiStatuses: Record<string, DocumentAiStatus>;
  setCurrentTeamspaceId: (id: string) => void;
  setOnlineMembers: (members: ActiveMember[]) => void;
  setDocumentAiStatus: (documentId: string, aiStatus: DocumentAiStatus) => void;
  clearTeamspacePresence: () => void;
}

export const useTeamspaceStore = create<TeamspaceState>()((set) => ({
  currentTeamspaceId: null,
  onlineMembers: [],
  documentAiStatuses: {},
  setCurrentTeamspaceId: (id) => set({ currentTeamspaceId: id }),
  setOnlineMembers: (members) => set({ onlineMembers: members }),
  setDocumentAiStatus: (documentId, aiStatus) =>
    set((state) => ({
      documentAiStatuses: { ...state.documentAiStatuses, [documentId]: aiStatus },
    })),
  clearTeamspacePresence: () => set({ onlineMembers: [], documentAiStatuses: {} }),
}));
