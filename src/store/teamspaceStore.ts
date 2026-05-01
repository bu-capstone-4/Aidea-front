import { create } from 'zustand';

interface TeamspaceState {
  currentTeamspaceId: string | null;
  setCurrentTeamspaceId: (id: string) => void;
}

export const useTeamspaceStore = create<TeamspaceState>()((set) => ({
  currentTeamspaceId: null,
  setCurrentTeamspaceId: (id) => set({ currentTeamspaceId: id }),
}));
