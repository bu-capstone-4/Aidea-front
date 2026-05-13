import { useState } from 'react';
import type { Question, Answer } from '@/types/document';
import { useFeedbackStore } from '@/store/FeedbackStore';
import { apiClient } from '@/shared/apiClient';

interface Props {
  variant: 'fullscreen' | 'side-panel';
}

export default function QuestionPanel({ variant }: Props) {
  const { questions, feedbackId, setAnswering } = useFeedbackStore();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!feedbackId) return;

    const result: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));

    try {
      await apiClient.post(`/api/feedbacks/${feedbackId}/answer`, { answers: result });

      if (setAnswering) {
        setAnswering();
      }
      console.log('답변 제출 완료! 다시 피드백 대기 상태로 들어갑니다.');
    } catch (error) {
      console.error('답변 제출 실패:', error);
    }
  };

  if (!questions) return null;

  const containerClass =
    variant === 'fullscreen'
      ? 'fixed inset-0 bg-gray-50 z-40 overflow-auto p-8 flex flex-col items-center'
      : 'w-[420px] h-full overflow-auto p-6 bg-white border-l';

  return (
    <div className={containerClass}>
      <div className={variant === 'fullscreen' ? 'w-full max-w-2xl' : 'w-full'}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-purple-600 font-medium">+ Aldea</span>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          기획 내용을 검토했어요. 피드백을 드리기 전에 방향을 조금 더 명확하게 파악하고 싶어서요.
        </p>
        <p className="text-sm text-purple-600 mb-6">
          몇 가지만 여쭤봐도 될까요? 선택하거나 직접 입력하실 수 있어요.
        </p>

        {/* 🚨 TS 에러 해결: 매개변수에 명시적 타입 지정 */}
        {questions.map((q: Question, idx: number) => (
          <div key={q.id} className="mb-4 p-4 border rounded-lg bg-white">
            <p className="font-medium text-sm mb-3">
              {idx + 1}. {q.text}
            </p>

            {/* 🚨 TS 에러 해결: option 타입 지정 */}
            {q.options?.map((option: string) => (
              <label key={option} className="flex items-center gap-2 mb-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name={q.id}
                  value={option}
                  checked={answers[q.id] === option}
                  onChange={() => handleSelect(q.id, option)}
                  className="accent-blue-600"
                />
                {option}
              </label>
            ))}

            {q.options && (
              <>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name={q.id}
                    value="__custom__"
                    checked={!!answers[q.id] && !q.options.includes(answers[q.id])}
                    onChange={() => handleSelect(q.id, '')}
                    className="accent-blue-600"
                  />
                  ✏️ 직접 입력
                </label>
                {!!answers[q.id] && !q.options.includes(answers[q.id]) && (
                  <input
                    className="mt-2 w-full border rounded px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="직접 입력해주세요..."
                    value={answers[q.id]}
                    onChange={(e) => handleSelect(q.id, e.target.value)}
                  />
                )}
              </>
            )}

            {!q.options && (
              <input
                className="w-full border rounded px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="직접 입력해주세요..."
                value={answers[q.id] ?? ''}
                onChange={(e) => handleSelect(q.id, e.target.value)}
              />
            )}
          </div>
        ))}

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium
                     hover:bg-blue-700 transition-colors"
        >
          답변 완료 — AI 피드백 받기 →
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">
          모든 질문에 답하지 않아도 피드백을 받을 수 있어요. 답변할수록 더 정확한 피드백을 드립니다.
        </p>
      </div>
    </div>
  );
}
