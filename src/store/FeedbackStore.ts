import { create } from 'zustand';
import type { FeedbackStatus } from '@/mocks/types';

interface FeedbackState {
  isSplitView: boolean;
  documentId: string;
  feedbackId: string;
  status: FeedbackStatus;
  originalText: string;
  revisedText: string;
  setPending: (docId: string, feedId: string) => void;
  setDone: (original: string, revised: string) => void;
  acceptFeedback: () => void;
}

export const useFeedbackStore = create<FeedbackState>()((set) => ({
  isSplitView: true,
  documentId: '',
  feedbackId: '',
  status: 'PENDING', //초깃값 pending?
  originalText: 'aaa',
  revisedText: 'ddddd',

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
}));
