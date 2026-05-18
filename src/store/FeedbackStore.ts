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
  ydoc: Y.Doc | null;
  setPending: (docId: string, feedId: string) => void;
  setDone: (feedId: string, revisedMarkdown: string) => void;
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
  revisedMarkdown: null,
  questions: null,
  ydoc: null,

  setYdoc: (doc) => set({ ydoc: doc }),
  setPending: (docId, feedId) =>
    set({
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
      revisedMarkdown: null,
    }),
}));
