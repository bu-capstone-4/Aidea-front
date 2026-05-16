import { create } from 'zustand';
import type { FeedbackStatus } from '@/mocks/types';
import type { Question } from '@/types/document';
import * as Y from 'yjs';

interface FeedbackState {
  isSplitView: boolean;
  documentId: string;
  feedbackId: string;
  status: FeedbackStatus;
  questions: Question[] | null;
  revisedText: Uint8Array | null;
  ydoc: Y.Doc | null;
  setPending: (docId: string, feedId: string) => void;
  setDone: (feedId: string, revised: Uint8Array) => void;
  acceptFeedback: () => void;
  setAnswering: () => void;
  setQuestioning: (questions: Question[]) => void;
  setYdoc: (doc: Y.Doc) => void;
  resetFeedback: () => void;
}

export const useFeedbackStore = create<FeedbackState>()((set) => ({
  isSplitView: false,
  documentId: '',
  feedbackId: '',
  status: 'IDLE',
  revisedText: null,
  questions: null,
  ydoc: null,

  setYdoc: (doc) => set({ ydoc: doc }),
  setPending: (docId, feedId) =>
    set({
      documentId: docId,
      feedbackId: feedId,
      status: 'PENDING',
    }),

  setDone: (feedId, revised) =>
    set({
      feedbackId: feedId,
      revisedText: revised,
      status: 'DONE',
      isSplitView: true,
    }),

  acceptFeedback: () =>
    set({
      status: 'ACCEPTED',
      isSplitView: false,
    }),

  setQuestioning: (questions) =>
    set({
      questions: questions,
      status: 'QUESTIONING',
    }),

  setAnswering: () =>
    set({
      questions: null,
      status: 'ANSWERING',
    }),

  resetFeedback: () =>
    set({
      status: 'IDLE',
      isSplitView: false,
      feedbackId: '',
      revisedText: null,
    }),
}));
