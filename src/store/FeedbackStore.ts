import { create } from 'zustand';
import type { FeedbackStatus } from '@/mocks/types';
import type { Question } from '@/types/document';
import * as Y from 'yjs';

interface FeedbackState {
  isSplitView: boolean;
  documentId: string;
  feedbackId: string;
  status: FeedbackStatus;
  originalText: string;
  questions: Question[] | null;
  revisedText: string | Uint8Array;
  ydoc: Y.Doc | null;
  setPending: (docId: string, feedId: string) => void;
  setDone: (original: string, revised: string | Uint8Array) => void;
  acceptFeedback: () => void;
  setAnswering: () => void;
  setQuestioning: (questions: Question[]) => void;
  setYdoc: (doc: Y.Doc) => void;
}

export const useFeedbackStore = create<FeedbackState>()((set) => ({
  isSplitView: false,
  documentId: '',
  feedbackId: '',
  status: 'DONE',
  originalText: '',
  revisedText: '',
  questions: null,
  ydoc: null,

  setYdoc: (doc) => set({ ydoc: doc }),
  setPending: (docId, feedId) =>
    set({
      documentId: docId,
      feedbackId: feedId,
      status: 'PENDING',
    }),

  setDone: (original, revised) =>
    set({
      originalText: original,
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
}));
