import { apiClient } from '@/shared/apiClient';
import { useFeedbackStore } from '@/store/FeedbackStore';

export default function useFeedback() {
  const { setPending, setDone, acceptFeedback } = useFeedbackStore();

  const requestFeedback = async (
    documentId: string,
    prompt: string | null,
    closeModal: () => void,
    originalText: string
  ) => {
    try {
      closeModal();
      const res = await apiClient.post(`/api/documents/${documentId}/feedback`, {
        additionalRequest: prompt,
      });
      const { feedbackId } = res.data.data;
      setPending(documentId, feedbackId);
      setDone(originalText, '서버에서 받아온 revisedText');
    } catch (error) {
      console.error(error);
    }
  };

  const chooseVersion = async (target: 'ORIGINAL' | 'AI', feedbackId?: string) => {
    if (target === 'AI' && feedbackId) {
      try {
        const res = await apiClient.post(`/api/feedbacks/${feedbackId}/accept`);
        const { yjsBinary } = res.data.data;
        console.log(yjsBinary);
        acceptFeedback();
      } catch (error) {
        console.error(error);
      }
    } else {
      acceptFeedback();
    }
  };

  return { requestFeedback, chooseVersion };
}
