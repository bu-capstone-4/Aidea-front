import { useState } from 'react';
import Button from '../ui/Button';
import QuestionList from './QuestionList';
import ViewerAnswerNotice from './ViewerAnswerNotice';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import useDraft from '@/hooks/useDraft';
import { useQaAnswers } from '@/hooks/useQaAnswers';
import { useIsViewer } from '@/hooks/useIsViewer';

interface DraftQuestionPanelProps {
  documentId: string;
}

// IDEA 초안 생성 1차 호출 후 받는 "구체화 질문" 화면.
// 구조(id/section/text/options[])는 feedback:questioning과 동일하므로 QuestionList를 공용으로 사용한다.
export default function DraftQuestionPanel({ documentId }: DraftQuestionPanelProps) {
  const draftQA = useTeamspaceStore((state) => state.draftQA);
  const setDraftAnswering = useTeamspaceStore((state) => state.setDraftAnswering);
  const { submitDraftAnswers, skipDraftQuestions } = useDraft();

  const isViewer = useIsViewer();
  const [submitting, setSubmitting] = useState(false);

  const isQuestioningForThisDoc =
    draftQA?.status === 'QUESTIONING' && draftQA.documentId === documentId;
  const qa = useQaAnswers(isQuestioningForThisDoc && draftQA.questions ? draftQA.draftId : null);

  const runSubmit = async (submit: (draftId: string) => Promise<unknown>) => {
    if (!draftQA || submitting || isViewer) return;
    setSubmitting(true);
    try {
      await submit(draftQA.draftId);
      setDraftAnswering(draftQA.draftId);
    } catch {
      // 에러 토스트는 apiClient 인터셉터가 표시한다 (동시 제출 경합 포함)
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    const questions = draftQA?.questions;
    if (!qa || !questions) return;
    return runSubmit((draftId) => submitDraftAnswers(draftId, qa.buildAnswers(questions)));
  };

  const handleSkip = () => runSubmit(skipDraftQuestions);

  if (!isQuestioningForThisDoc) return null;

  const { questions } = draftQA;

  if (!questions || !qa) {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white p-6 text-center">
        <div className="bg-[#F4F0FF] rounded-xl p-4 border border-purple-50 max-w-md">
          <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-base mb-1.5 justify-center">
            <span className="text-xl">✦</span> Aidea
          </div>
          <p className="text-gray-800 text-sm leading-relaxed">
            질문 내용을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
          </p>
        </div>
        {isViewer && <ViewerAnswerNotice />}
        <button
          type="button"
          onClick={handleSkip}
          disabled={submitting || isViewer}
          className="text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors disabled:opacity-60"
        >
          질문 건너뛰고 바로 초안 만들기
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        <div className="bg-[#F4F0FF] rounded-xl p-4 border border-purple-50">
          <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-base mb-1.5">
            <span className="text-xl">✦</span> Aidea
          </div>
          <div className="text-gray-800 text-sm leading-relaxed">
            <p>더 좋은 초안을 만들기 위해 아이디어를 조금 더 구체화하고 싶어요.</p>
            <p className="font-medium text-[#7C3AED] mt-1">
              몇 가지만 여쭤봐도 될까요? 선택하거나 직접 입력하실 수 있어요.
            </p>
          </div>
        </div>

        <QuestionList key={draftQA.draftId} questions={questions} qa={qa} readOnly={isViewer} />
      </div>

      <div className="shrink-0 flex flex-col items-center gap-3 px-6 py-5 border-t border-gray-100 bg-white">
        {isViewer && <ViewerAnswerNotice />}
        <Button
          onClick={handleSubmit}
          disabled={submitting || isViewer}
          className="w-full max-w-lg py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60"
        >
          답변하고 초안 만들기
        </Button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={submitting || isViewer}
          className="text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors disabled:opacity-60"
        >
          건너뛰고 바로 초안 만들기
        </button>
        <p className="text-gray-400 text-xs text-center font-medium">
          모든 질문에 답하지 않아도 초안을 받을 수 있어요.
          <br />
          답변할수록 더 정확한 초안을 드릴 수 있습니다.
        </p>
      </div>
    </div>
  );
}
