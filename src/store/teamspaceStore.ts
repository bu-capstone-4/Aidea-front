import { create } from 'zustand';
import type { ActiveMember, MemberRole } from '@/types/teamspaceSocket';
import type { DocumentAiStatus } from '@/types/api';
import type { Question } from '@/types/document';

interface PendingDraft {
  documentId: string;
  content: string;
}

interface DraftQA {
  documentId: string;
  draftId: string;
  status: 'QUESTIONING' | 'ANSWERING';
  questions: Question[] | null;
}

interface TeamspaceState {
  currentTeamspaceId: string | null;
  onlineMembers: ActiveMember[];
  documentAiStatuses: Record<string, DocumentAiStatus>;
  documentTitleOverrides: Record<string, string>;
  pendingDraft: PendingDraft | null;
  draftQA: DraftQA | null;
  setCurrentTeamspaceId: (id: string | null) => void;
  setOnlineMembers: (members: ActiveMember[]) => void;
  setMemberRole: (userId: number, role: MemberRole) => void;
  setDocumentAiStatus: (documentId: string, aiStatus: DocumentAiStatus) => void;
  setDocumentTitleOverride: (documentId: string, title: string) => void;
  setPendingDraft: (draft: PendingDraft | null) => void;
  setDraftQuestioning: (documentId: string, draftId: string, questions: Question[]) => void;
  setDraftAnswering: (draftId?: string) => void;
  restoreDraftQA: (
    documentId: string,
    draftId: string,
    status: 'QUESTIONING' | 'ANSWERING',
    questions?: Question[] | null
  ) => void;
  clearDraftQA: () => void;
  clearTeamspacePresence: () => void;
}

export const useTeamspaceStore = create<TeamspaceState>()((set) => ({
  currentTeamspaceId: null,
  onlineMembers: [],
  documentAiStatuses: {},
  documentTitleOverrides: {},
  pendingDraft: null,
  draftQA: null,
  setCurrentTeamspaceId: (id) => set({ currentTeamspaceId: id }),
  setOnlineMembers: (members) => set({ onlineMembers: members }),
  setMemberRole: (userId, role) =>
    set((state) => ({
      onlineMembers: state.onlineMembers.map((m) => (m.userId === userId ? { ...m, role } : m)),
    })),
  setDocumentAiStatus: (documentId, aiStatus) =>
    set((state) => ({
      documentAiStatuses: { ...state.documentAiStatuses, [documentId]: aiStatus },
    })),
  setDocumentTitleOverride: (documentId, title) =>
    set((state) => ({
      documentTitleOverrides: { ...state.documentTitleOverrides, [documentId]: title },
    })),
  setPendingDraft: (draft) => set({ pendingDraft: draft }),
  setDraftQuestioning: (documentId, draftId, questions) =>
    set({ draftQA: { documentId, draftId, status: 'QUESTIONING', questions } }),
  // draftId가 주어지면 현재 draftQA일 때만 전환한다 — 제출자는 REST 성공 후와 draft:answering 수신 시 두 번 호출하므로 멱등
  setDraftAnswering: (draftId) =>
    set((state) =>
      state.draftQA && (draftId === undefined || state.draftQA.draftId === draftId)
        ? { draftQA: { ...state.draftQA, status: 'ANSWERING', questions: null } }
        : {}
    ),
  // doc:init.activeDraft로 상태 복원 시 사용.
  // 이미 같은 문서의 draftQA가 있다면(같은 세션에서 draft:questioning을 수신해 questions를 보유 중) 덮어쓰지 않는다.
  restoreDraftQA: (documentId, draftId, status, questions = null) =>
    set((state) =>
      state.draftQA?.documentId === documentId
        ? {}
        : { draftQA: { documentId, draftId, status, questions: questions ?? null } }
    ),
  clearDraftQA: () => set({ draftQA: null }),
  clearTeamspacePresence: () =>
    set({
      onlineMembers: [],
      documentAiStatuses: {},
      documentTitleOverrides: {},
      pendingDraft: null,
      draftQA: null,
    }),
}));
