import { DOC_OPTIONS, type TeamSpaceForm, type DocType } from './types';

interface Props {
  form: TeamSpaceForm;
  onChange: (patch: Partial<TeamSpaceForm>) => void;
  onNext: () => void;
}

export default function Step1({ form, onChange, onNext }: Props) {
  const toggleDoc = (doc: DocType) => {
    if (doc === 'IDEA') return;

    const next = form.selectedDocs.includes(doc)
      ? form.selectedDocs.filter((d) => d !== doc)
      : [...form.selectedDocs, doc];

    onChange({ selectedDocs: next });
  };

  return (
    <div className="flex flex-col min-h-[440px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <span className="text-lg font-medium text-gray-900">팀 스페이스 생성</span>
        <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">1 / 2</span>
      </div>

      {/* 팀 이름 */}
      <input
        type="text"
        placeholder="팀 스페이스 이름을 입력해주세요"
        value={form.teamName}
        onChange={(e) => onChange({ teamName: e.target.value })}
        className="w-full px-4 py-2.5 text-sm border-2 border-blue-400 rounded-lg outline-none text-gray-900 placeholder-gray-400 mb-5 focus:border-blue-500 transition-colors"
      />

      {/* Body */}
      <div className="grid grid-cols-2 gap-5 flex-1">
        {/* 아이디어 작성 */}
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 mb-2">아이디어 작성</p>
          <textarea
            placeholder="아이디어를 최대한 자세하게 작성해주세요..."
            value={form.idea}
            onChange={(e) => onChange({ idea: e.target.value })}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg resize-none text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        {/* Doc selector */}
        <div>
          <p className="text-xs text-gray-500 mb-2">필요한 기획 문서 선택</p>
          <div className="grid grid-cols-2 gap-2">
            {DOC_OPTIONS.filter((doc) => doc.value !== 'FREE').map((doc) => {
              const isSelected = form.selectedDocs.includes(doc.value);
              const isRequired = doc.value === 'IDEA';
              return (
                <button
                  key={doc.value}
                  type="button"
                  onClick={() => toggleDoc(doc.value)}
                  className={
                    'flex justify-between items-center px-3 py-2 text-sm rounded-lg border transition-colors ' +
                    (isSelected
                      ? 'border-green-200 bg-green-50 text-gray-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50')
                  }
                >
                  <span className="flex items-center gap-1.5">
                    {doc.label}
                    {isRequired && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-blue-500">
                        <span className="h-1 w-1 rounded-full bg-blue-500" />
                        필수
                      </span>
                    )}
                  </span>

                  {isSelected && <span className="text-green-500 text-sm leading-none">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
