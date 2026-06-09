import { useState } from 'react';
import Button from '../ui/Button';
import QuestionList from './QuestionList';
import { useFeedbackStore } from '@/store/FeedbackStore';
import useFeedback from '@/hooks/useFeedback';
import type { Question } from '@/types/document';

export default function QuestionPanel() {
  const status = useFeedbackStore((state) => state.status);
  const questions = useFeedbackStore((state) => state.questions) as Question[] | null;
  const feedbackId = useFeedbackStore((state) => state.feedbackId);
  const setAnswering = useFeedbackStore((state) => state.setAnswering);
  const { submitAnswers } = useFeedback();

  const [prevQuestions, setPrevQuestions] = useState(questions);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (prevQuestions !== questions) {
    setPrevQuestions(questions);
    setAnswers({});
  }

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!feedbackId || !questions) return;
    const answerList = questions.map((q) => ({ questionId: q.id, value: answers[q.id] ?? '' }));
    await submitAnswers(feedbackId, answerList);
    setAnswering();
  };

  if (status !== 'QUESTIONING' || !questions) return null;

  return (
    <div className="flex-1 h-full overflow-y-auto flex flex-col gap-4 bg-white">
      <div className="bg-[#F4F0FF] rounded-xl p-4 border border-purple-50">
        <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-base mb-1.5">
          <span className="text-xl">✦</span> Aidea
        </div>
        <div className="text-gray-800 text-sm leading-relaxed">
          <p>
            기획 내용을 검토했어요. 피드백을 드리기 전에 방향을 조금 더 명확하게 파악하고 싶어서요.
          </p>
          <p className="font-medium text-[#7C3AED] mt-1">
            몇 가지만 여쭤봐도 될까요? 선택하거나 직접 입력하실 수 있어요.
          </p>
        </div>
      </div>

      <QuestionList questions={questions} answers={answers} onSelect={handleSelect} />

      <div className="mt-4 flex flex-col items-center gap-3 pb-8">
        <Button
          onClick={handleSubmit}
          className="w-full max-w-lg py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 transition-colors shadow-md"
        >
          AI 피드백 받기
        </Button>
        <p className="text-gray-400 text-xs text-center font-medium">
          모든 질문에 답하지 않아도 피드백을 받을 수 있어요.
          <br />
          답변할수록 더 정확한 피드백을 드릴 수 있습니다.
        </p>
      </div>
    </div>
  );
}
