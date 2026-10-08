import { useState } from 'react';
import YTextField from './YTextField';
import { CUSTOM_CHOICE } from '@/shared/qaDocRegistry';
import type { QaAnswers } from '@/hooks/useQaAnswers';
import type { Question } from '@/types/document';

interface QuestionListProps {
  questions: Question[];
  qa: QaAnswers;
  readOnly: boolean;
}

// feedback:questioning / draft:questioning 공용 — 질문 목록 렌더링 (id/section/text/options[] 구조)
// 답변은 qaId 전용 Y.Doc(qa)에 있어 같은 문서를 보는 팀원과 실시간으로 공유된다.
export default function QuestionList({ questions, qa, readOnly }: QuestionListProps) {
  // 내가 직접 "직접 입력"을 고른 질문만 입력창에 자동 포커스한다 (팀원의 선택으로 포커스를 뺏기지 않게)
  const [focusQuestionId, setFocusQuestionId] = useState<string | null>(null);

  const selectCustom = (questionId: string) => {
    setFocusQuestionId(questionId);
    qa.setChoice(questionId, CUSTOM_CHOICE);
  };

  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, idx) => {
        const currentChoice = qa.getChoice(q.id);
        const hasOptions = Array.isArray(q.options) && q.options.length > 0;
        const isCustomSelected = hasOptions && currentChoice === CUSTOM_CHOICE;

        return (
          <div key={q.id} className="border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 flex items-center justify-center bg-purple-100 text-[#7C3AED] rounded-full font-bold text-sm shrink-0">
                {idx + 1}
              </div>
              <h3 className="font-bold text-gray-900 text-base pt-0.5">{q.text}</h3>
            </div>

            {!hasOptions ? (
              <YTextField
                ytext={qa.getText(q.id)}
                multiline
                readOnly={readOnly}
                placeholder="직접 입력해주세요..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {q.options!.map((option) => {
                  const isSelected = currentChoice === option;
                  return (
                    <label
                      key={option}
                      className={`flex items-center gap-3 px-4 py-2.5 border-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={isSelected}
                        disabled={readOnly}
                        onChange={() => qa.setChoice(q.id, option)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
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

                <div className="flex flex-col gap-1.5 mt-0.5">
                  <label
                    className={`flex items-center gap-3 px-4 py-2.5 border-2 rounded-xl cursor-pointer transition-colors ${
                      isCustomSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={isCustomSelected}
                      disabled={readOnly}
                      onChange={() => selectCustom(q.id)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
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
                    <YTextField
                      ytext={qa.getText(q.id)}
                      multiline={false}
                      readOnly={readOnly}
                      placeholder="직접 입력해주세요..."
                      className="w-full border border-blue-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      autoFocus={focusQuestionId === q.id}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
