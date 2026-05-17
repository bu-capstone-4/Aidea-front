import { useState } from 'react';
import Button from '../ui/Button';
import { useFeedbackStore } from '@/store/FeedbackStore';

interface Question {
  id: string;
  text: string;
  options?: string[];
}

const DUMMY_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: '이 서비스의 주요 타깃 사용자는 누구인가요?',
    options: [
      '소규모 개발팀 (2~6인) / 사이드 프로젝트',
      '대학교 팀 프로젝트 참여자',
      '스타트업 초기 팀',
      '비개발자 포함 혼합 팀',
    ],
  },
  {
    id: 'q2',
    text: 'AI 피드백에서 가장 중점적으로 봐줬으면 하는 부분은?',
    options: [
      '기획 구조의 논리적 완성도',
      '사용자 경험(UX) 관점의 개선점',
      '기술 실현 가능성 검토',
    ],
  },
  {
    id: 'q3',
    text: '저녁 뭐 먹어?',
    options: ['치킨', '명태조림', '족발'],
  },
];

export default function QuestionPanel() {
  const status = useFeedbackStore((state) => state.status);
  const [answers, setAnswers] = useState<Record<string, string>>({
    q1: '소규모 개발팀 (2~6인) / 사이드 프로젝트',
  });

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };
  if (status !== 'QUESTIONING') return null;

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
        {DUMMY_QUESTIONS.map((q, idx) => {
          const currentAnswer = answers[q.id];
          const isCustomSelected =
            currentAnswer !== undefined && !q.options?.includes(currentAnswer);

          return (
            <div key={q.id} className="border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-8 h-8 flex items-center justify-center bg-purple-100 text-[#7C3AED] rounded-full font-bold text-sm shrink-0">
                  {idx + 1}
                </div>
                <h3 className="font-bold text-gray-900 text-lg pt-1">{q.text}</h3>
              </div>

              <div className="flex flex-col gap-3">
                {q.options?.map((option) => {
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

                {q.options && (
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
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 pb-10">
        <Button
          onClick={() => console.log('제출된 데이터:', answers)}
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
