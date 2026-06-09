import { apiClient } from '@/shared/apiClient';
import type { Answer } from '@/types/document';

interface SubmitDraftAnswersResult {
  draftId: string;
  status: 'ANSWERING';
}

// IDEA 초안 질문에 대한 답변을 제출한다.
// answer를 빈 배열로 보내면 백엔드가 "건너뛰기"로 해석한다 (피드백 답변과 달리 @NotEmpty 제약이 없음).
async function submitDraftAnswersRaw(draftId: string, answer: Answer[]) {
  // questionId/value가 비어있는 항목은 @NotBlank 위반(400)이므로 제외하고 전송한다.
  // "이 질문은 건너뛴다"는 의도는 항목 자체를 배열에서 제외하는 방식으로 표현한다.
  const filtered = answer.filter((a) => a.questionId.trim() !== '' && a.value.trim() !== '');
  const res = await apiClient.post(`/api/drafts/${draftId}/answers`, { answer: filtered });
  return res.data.data as SubmitDraftAnswersResult;
}

async function skipDraftQuestionsRaw(draftId: string) {
  const res = await apiClient.post(`/api/drafts/${draftId}/answers`, { answer: [] });
  return res.data.data as SubmitDraftAnswersResult;
}

export default function useDraft() {
  const submitDraftAnswers = (draftId: string, answer: Answer[]) =>
    submitDraftAnswersRaw(draftId, answer);

  const skipDraftQuestions = (draftId: string) => skipDraftQuestionsRaw(draftId);

  return {
    submitDraftAnswers,
    skipDraftQuestions,
  };
}
