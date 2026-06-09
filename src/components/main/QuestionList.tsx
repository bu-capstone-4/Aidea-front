import type { Question } from '@/types/document';

interface QuestionListProps {
  questions: Question[];
  answers: Record<string, string>;
  onSelect: (questionId: string, value: string) => void;
}

// feedback:questioning / draft:questioning 공용 — 질문 목록 렌더링 (id/section/text/options[] 구조)
export default function QuestionList({ questions, answers, onSelect }: QuestionListProps) {
  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, idx) => {
        const currentAnswer = answers[q.id];
        const hasOptions = Array.isArray(q.options) && q.options.length > 0;
        const isCustomSelected =
          hasOptions && currentAnswer !== undefined && !q.options!.includes(currentAnswer);

        return (
          <div key={q.id} className="border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 flex items-center justify-center bg-purple-100 text-[#7C3AED] rounded-full font-bold text-sm shrink-0">
                {idx + 1}
              </div>
              <h3 className="font-bold text-gray-900 text-base pt-0.5">{q.text}</h3>
            </div>

            {!hasOptions ? (
              <textarea
                placeholder="직접 입력해주세요..."
                value={currentAnswer || ''}
                onChange={(e) => onSelect(q.id, e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {q.options!.map((option) => {
                  const isSelected = currentAnswer === option;
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
                        onChange={() => onSelect(q.id, option)}
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
                      onChange={() => onSelect(q.id, '')}
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
                    <input
                      type="text"
                      placeholder="직접 입력해주세요..."
                      value={currentAnswer || ''}
                      onChange={(e) => onSelect(q.id, e.target.value)}
                      className="w-full border border-blue-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
  );
}
