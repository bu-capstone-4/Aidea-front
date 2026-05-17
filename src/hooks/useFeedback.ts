import { apiClient } from '@/shared/apiClient';
import { useFeedbackStore } from '@/store/FeedbackStore';
import * as Y from 'yjs';

export default function useFeedback() {
  const { setPending, acceptFeedback } = useFeedbackStore();

  const requestFeedback = async (
    documentId: string,
    prompt: string | null,
    closeModal: () => void
  ) => {
    try {
      closeModal();
      const res = await apiClient.post(`/api/documents/${documentId}/feedback`, {
        additionalRequest: prompt,
      });
      const { feedbackId } = res.data.data;
      setPending(documentId, feedbackId);
    } catch (error) {
      console.error(error);
    }
  };

  const chooseVersion = async (
    target: 'ORIGINAL' | 'AI',
    feedbackId: string,
    documentId: string,
    ydoc: Y.Doc
  ) => {
    try {
      const res = await apiClient.post(
        `/api/documents/${documentId}/feedback/${feedbackId}/accept`,
        {
          selectedVersion: target,
        }
      );
      if (target === 'AI' && feedbackId) {
        const { yjsBinary } = res.data.data;
        const binaryUpdate = Uint8Array.from(atob(yjsBinary), (c) => c.charCodeAt(0));
        Y.applyUpdate(ydoc, binaryUpdate);
        acceptFeedback();
      } else {
        acceptFeedback();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return { requestFeedback, chooseVersion };
}
