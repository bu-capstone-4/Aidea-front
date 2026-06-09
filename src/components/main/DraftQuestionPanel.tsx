import { useState } from 'react';
import Button from '../ui/Button';
import QuestionList from './QuestionList';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import useDraft from '@/hooks/useDraft';

interface DraftQuestionPanelProps {
  documentId: string;
}

// IDEA 초안 생성 1차 호출 후 받는 "구체화 질문" 화면.
// 구조(id/section/text/options[])는 feedback:questioning과 동일하므로 QuestionList를 공용으로 사용한다.
export default function DraftQuestionPanel({ documentId }: DraftQuestionPanelProps) {
  const draftQA = useTeamspaceStore((state) => state.draftQA);
  const setDraftAnswering = useTeamspaceStore((state) => state.setDraftAnswering);
  const { submitDraftAnswers, skipDraftQuestions } = useDraft();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isQuestioningForThisDoc =
    draftQA?.status === 'QUESTIONING' && draftQA.documentId === documentId;

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!draftQA?.questions || submitting) return;
    setSubmitting(true);
    try {
      const answerList = draftQA.questions.map((q) => ({
        questionId: q.id,
        value: answers[q.id] ?? '',
      }));
      await submitDraftAnswers(draftQA.draftId, answerList);
      setDraftAnswering();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!draftQA || submitting) return;
    setSubmitting(true);
    try {
      await skipDraftQuestions(draftQA.draftId);
      setDraftAnswering();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isQuestioningForThisDoc) return null;

  const { questions } = draftQA;

  // 새로고침/재접속 시: doc:init.activeDraft에는 questions가 포함되지 않으므로(알려진 백엔드 갭)
  // 질문 화면을 정상적으로 그릴 수 없다 — 안내와 건너뛰기 옵션을 제공한다.
  if (!questions) {
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
        <button
          type="button"
          onClick={handleSkip}
          disabled={submitting}
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

        <QuestionList questions={questions} answers={answers} onSelect={handleSelect} />
      </div>

      <div className="shrink-0 flex flex-col items-center gap-3 px-6 py-5 border-t border-gray-100 bg-white">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full max-w-lg py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60"
        >
          답변하고 초안 만들기
        </Button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={submitting}
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
