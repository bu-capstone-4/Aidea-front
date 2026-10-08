import { create } from 'zustand';
import type { FeedbackStatus, Question } from '@/types/document';
import * as Y from 'yjs';

interface FeedbackState {
  isSplitView: boolean;
  documentId: string;
  feedbackId: string;
  status: FeedbackStatus;
  questions: Question[] | null;
  revisedMarkdown: string | null;
  // 이 클라이언트가 '이 버전 선택'으로 수락 요청한 피드백 — 수락 결과를 문서에 반영할 주체를 가리는 데 사용
  acceptingFeedbackId: string | null;
  ydoc: Y.Doc | null;
  setPending: (docId: string, feedId: string) => void;
  setDone: (feedId: string, revisedMarkdown: string) => void;
  setAccepting: (feedbackId: string | null) => void;
  acceptFeedback: () => void;
  setRejected: () => void;
  setFailed: () => void;
  setAnswering: (feedbackId?: string) => void;
  setQuestioning: (questions: Question[]) => void;
  setYdoc: (doc: Y.Doc) => void;
  resetFeedback: () => void;
}

export const useFeedbackStore = create<FeedbackState>()((set) => ({
  isSplitView: false,
  documentId: '',
  feedbackId: '',
  status: 'IDLE',
  revisedMarkdown: null,
  acceptingFeedbackId: null,
  questions: null,
  ydoc: null,

  setYdoc: (doc) => set({ ydoc: doc }),
  setPending: (docId, feedId) =>
    set({
      isSplitView: true,
      documentId: docId,
      feedbackId: feedId,
      status: 'PENDING',
    }),

  setDone: (feedId, revisedMarkdown) =>
    set({
      feedbackId: feedId,
      revisedMarkdown,
      status: 'DONE',
      isSplitView: true,
    }),

  setAccepting: (feedbackId) => set({ acceptingFeedbackId: feedbackId }),

  acceptFeedback: () =>
    set({
      status: 'ACCEPTED',
      isSplitView: false,
    }),

  setRejected: () =>
    set({
      status: 'IDLE',
      isSplitView: false,
      feedbackId: '',
      revisedMarkdown: null,
      acceptingFeedbackId: null,
    }),

  setFailed: () =>
    set({
      status: 'FAILED',
      isSplitView: false,
    }),

  setQuestioning: (questions) =>
    set({
      isSplitView: true,
      questions: questions,
      status: 'QUESTIONING',
    }),

  // feedbackId가 주어지면 현재 피드백일 때만 전환한다 — 제출자는 REST 성공 후와 feedback:answering 수신 시 두 번 호출하므로 멱등
  setAnswering: (feedbackId) =>
    set((state) =>
      feedbackId !== undefined && feedbackId !== state.feedbackId
        ? {}
        : { questions: null, status: 'ANSWERING' }
    ),

  resetFeedback: () =>
    set({
      status: 'IDLE',
      isSplitView: false,
      feedbackId: '',
      revisedMarkdown: null,
      acceptingFeedbackId: null,
    }),
}));
