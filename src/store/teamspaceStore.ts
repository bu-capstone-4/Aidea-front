import { create } from 'zustand';
import type { ActiveMember, TeamspaceStatus } from '@/types/teamspaceSocket';

interface TeamspaceState {
  currentTeamspaceId: string | null;
  onlineMembers: ActiveMember[];
  teamspaceStatus: TeamspaceStatus | null;
  setCurrentTeamspaceId: (id: string) => void;
  setOnlineMembers: (members: ActiveMember[]) => void;
  setTeamspaceStatus: (status: TeamspaceStatus | null) => void;
  clearTeamspacePresence: () => void;
}

export const useTeamspaceStore = create<TeamspaceState>()((set) => ({
  currentTeamspaceId: null,
  onlineMembers: [],
  teamspaceStatus: null,
  setCurrentTeamspaceId: (id) => set({ currentTeamspaceId: id }),
  setOnlineMembers: (members) => set({ onlineMembers: members }),
  setTeamspaceStatus: (status) => set({ teamspaceStatus: status }),
  clearTeamspacePresence: () => set({ onlineMembers: [], teamspaceStatus: null }),
}));
