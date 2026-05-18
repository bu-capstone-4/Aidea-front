import { useState } from 'react';
import Button from '../ui/Button';
import { useFeedbackStore } from '@/store/FeedbackStore';
import useFeedback from '@/hooks/useFeedback';
import type { Question } from '@/types/document';

export default function QuestionPanel() {
  const status = useFeedbackStore((state) => state.status);
  const questions = useFeedbackStore((state) => state.questions) as Question[] | null;
  const feedbackId = useFeedbackStore((state) => state.feedbackId);
  const setAnswering = useFeedbackStore((state) => state.setAnswering);
  const { submitAnswers } = useFeedback();

  const [answers, setAnswers] = useState<Record<string, string>>({});

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
    <div className="w-full flex flex-col gap-6 bg-white">
      <div className="bg-[#F4F0FF] rounded-xl p-6 border border-purple-50">
        <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-base mb-2">
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

      <div className="flex flex-col gap-6">
        {questions.map((q, idx) => {
          const currentAnswer = answers[q.id];
          const hasOptions = Array.isArray(q.options) && q.options.length > 0;
          const isCustomSelected =
            hasOptions && currentAnswer !== undefined && !q.options!.includes(currentAnswer);

          return (
            <div key={q.id} className="border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-8 h-8 flex items-center justify-center bg-purple-100 text-[#7C3AED] rounded-full font-bold text-sm shrink-0">
                  {idx + 1}
                </div>
                <h3 className="font-bold text-gray-900 text-lg pt-1">{q.text}</h3>
              </div>

              {!hasOptions ? (
                /* options === null or undefined: 자유 입력 textarea 단독 */
                <textarea
                  placeholder="직접 입력해주세요..."
                  value={currentAnswer || ''}
                  onChange={(e) => handleSelect(q.id, e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                />
              ) : (
                /* options 배열: 라디오 + 직접 입력 옵션 */
                <div className="flex flex-col gap-3">
                  {q.options!.map((option) => {
                    const isSelected = currentAnswer === option;
                    return (
                      <label
                        key={option}
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={isSelected}
                          onChange={() => handleSelect(q.id, option)}
                          className="w-5 h-5 accent-blue-600 cursor-pointer"
                        />
                        <span
                          className={`text-sm ${
                            isSelected ? 'text-blue-700 font-semibold' : 'text-gray-700 font-medium'
                          }`}
                        >
                          {option}
                        </span>
                      </label>
                    );
                  })}

                  <div className="flex flex-col gap-2 mt-1">
                    <label
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        isCustomSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={isCustomSelected}
                        onChange={() => handleSelect(q.id, '')}
                        className="w-5 h-5 accent-blue-600 cursor-pointer"
                      />
                      <span
                        className={`text-sm ${
                          isCustomSelected
                            ? 'text-blue-700 font-semibold'
                            : 'text-gray-700 font-medium'
                        }`}
                      >
                        ✏️ 직접 입력
                      </span>
                    </label>

                    {isCustomSelected && (
                      <input
                        type="text"
                        placeholder="직접 입력해주세요..."
                        value={currentAnswer || ''}
                        onChange={(e) => handleSelect(q.id, e.target.value)}
                        className="w-full border border-blue-300 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        autoFocus
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 pb-10">
        <Button
          onClick={handleSubmit}
          className="w-full max-w-lg py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-md"
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
