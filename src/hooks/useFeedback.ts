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
      const { message } = res.data;
      alert(message);
    } catch (error) {
      console.error(error);
      alert('피드백 요청 실패');
    }
  };

  const chooseVersion = async (target: 'ORIGINAL' | 'AI', feedbackId?: string) => {
    if (target === 'AI' && feedbackId) {
      try {
        const res = await apiClient.post(`/api/feedbacks/${feedbackId}/accept`);
        const { yjsBinary } = res.data.data;
        console.log(yjsBinary);
        acceptFeedback();
        const { message } = res.data;
        alert(message);
      } catch (error) {
        console.error(error);
        alert('버전 선택 실패');
      }
    } else {
      acceptFeedback();
    }
  };

  return { requestFeedback, chooseVersion };
}
