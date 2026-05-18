import { useState } from 'react';
import Button from '@/components/ui/Button';

const DOC_OPTIONS = [
  { label: '아이디어', value: 'IDEA', title: '아이디어' },
  { label: '기획서', value: 'PLAN', title: '기획서' },
  { label: '유저 시나리오', value: 'USER_SCENARIO', title: '유저 시나리오' },
  { label: 'API 명세서', value: 'API_SPEC', title: 'API 명세서' },
  { label: 'ERD', value: 'ERD', title: 'ERD' },
] as const;

type DocType = (typeof DOC_OPTIONS)[number]['value'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: DocType) => Promise<void>;
}

export default function CreateDocumentModal({ isOpen, onClose, onConfirm }: Props) {
  const [selectedType, setSelectedType] = useState<DocType | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const selectedOption = DOC_OPTIONS.find((o) => o.value === selectedType);

  const handleTypeSelect = (type: DocType) => {
    setSelectedType((prev) => (prev === type ? null : type));
  };

  const handleConfirm = async () => {
    if (!selectedType) return;
    setIsLoading(true);
    try {
      await onConfirm(selectedType);
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setPrompt('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-140 p-6 flex flex-col gap-5">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-gray-900">새 문서 추가</span>
          <Button variant="secondary" size="sm" onClick={handleClose}>
            ✕
          </Button>
        </div>

        {/* 문서 타입 선택 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            문서 타입
            <span className="ml-1 text-red-400">*</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DOC_OPTIONS.map((doc) => {
              const isSelected = selectedType === doc.value;
              return (
                <button
                  key={doc.value}
                  type="button"
                  onClick={() => handleTypeSelect(doc.value)}
                  className={
                    'flex justify-between items-center px-3 py-2 text-sm rounded-lg border transition-colors ' +
                    (isSelected
                      ? 'border-green-300 bg-green-50 text-gray-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50')
                  }
                >
                  <span>{doc.label}</span>
                  {isSelected && <span className="text-green-500 text-sm leading-none">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 문서 제목 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">문서 제목</p>
          <div
            className={
              'w-full px-4 py-2.5 text-sm border rounded-lg select-none ' +
              (selectedOption
                ? 'border-gray-200 bg-gray-50 text-gray-500'
                : 'border-gray-200 bg-gray-50 text-gray-300')
            }
          >
            {selectedOption ? selectedOption.title : '문서 타입을 선택하면 자동으로 설정됩니다'}
          </div>
        </div>

        {/* AI 초안 생성 프롬프트 (UI 껍데기) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-gray-700">AI 초안 생성</p>
            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-md">
              준비 중
            </span>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="문서 초안을 어떻게 작성할지 AI에게 알려주세요... (준비 중인 기능입니다)"
            disabled
            className="w-full h-24 px-4 py-2.5 text-sm border border-gray-200 rounded-lg resize-none text-gray-400 placeholder-gray-300 bg-gray-50 cursor-not-allowed outline-none"
          />
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={!selectedType || isLoading}
          >
            {isLoading ? '생성 중...' : '문서 생성'}
          </Button>
        </div>
      </div>
    </div>
  );
}
