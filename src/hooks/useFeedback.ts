import { apiClient } from '@/shared/apiClient';
import type { Answer } from '@/types/document';

export default function useFeedback() {
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
      localStorage.setItem(`feedback:${documentId}`, feedbackId);
    } catch (error) {
      console.error(error);
    }
  };

  const acceptFeedback = async (feedbackId: string) => {
    await apiClient.post(`/api/feedbacks/${feedbackId}/accept`);
  };

  const rejectFeedback = async (feedbackId: string) => {
    await apiClient.post(`/api/feedbacks/${feedbackId}/reject`);
  };

  const submitAnswers = async (feedbackId: string, answers: Answer[]) => {
    await apiClient.post(`/api/feedbacks/${feedbackId}/answers`, { answer: answers });
  };

  const getFeedbackStatus = async (feedbackId: string) => {
    const res = await apiClient.get(`/api/feedbacks/${feedbackId}`);
    return res.data;
  };

  return { requestFeedback, acceptFeedback, rejectFeedback, submitAnswers, getFeedbackStatus };
}
