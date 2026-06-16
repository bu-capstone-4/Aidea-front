import { useState } from 'react';
import { MdClose } from 'react-icons/md';
import Button from '@/components/ui/Button';
import { DOC_OPTIONS, type DocType } from '@/components/CreateTeamSpace/types';
import type { DocumentType } from '@/types/document';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: DocType, title?: string) => Promise<void>;
  existingDocTypes: DocumentType[];
}

const FIXED_TYPES: DocumentType[] = ['IDEA', 'PLAN', 'USER_SCENARIO', 'API_SPEC', 'ERD'];

export default function CreateDocumentModal({
  isOpen,
  onClose,
  onConfirm,
  existingDocTypes,
}: Props) {
  const [selectedType, setSelectedType] = useState<DocType | null>('FREE');
  const [freeTitle, setFreeTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleTypeSelect = (type: DocType) => {
    const isDisabled =
      FIXED_TYPES.includes(type as DocumentType) && existingDocTypes.includes(type as DocumentType);
    if (isDisabled) return;
    setSelectedType((prev) => (prev === type ? null : type));
  };

  const handleConfirm = async () => {
    if (!selectedType) return;
    if (selectedType === 'FREE' && !freeTitle.trim()) return;
    setIsLoading(true);
    try {
      await onConfirm(selectedType, selectedType === 'FREE' ? freeTitle.trim() : undefined);
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedType('FREE');
    setFreeTitle('');
    onClose();
  };

  const isConfirmDisabled =
    !selectedType || isLoading || (selectedType === 'FREE' && !freeTitle.trim());

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-140 p-6 flex flex-col gap-5">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-gray-900">새 문서 추가</span>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* 문서 제목 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            문서 제목
            {selectedType === 'FREE' && <span className="ml-1 text-red-400">*</span>}
          </p>
          {selectedType === 'FREE' ? (
            <input
              type="text"
              value={freeTitle}
              onChange={(e) => setFreeTitle(e.target.value)}
              placeholder="문서 제목을 입력하세요"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-900 placeholder-gray-400"
            />
          ) : (
            <div
              className={
                'w-full px-4 py-2.5 text-sm border rounded-lg select-none ' +
                (selectedType
                  ? 'border-gray-200 bg-gray-50 text-gray-500'
                  : 'border-gray-200 bg-gray-50 text-gray-300')
              }
            >
              {selectedType
                ? DOC_OPTIONS.find((o) => o.value === selectedType)?.label
                : '문서 타입을 선택하면 자동으로 설정됩니다'}
            </div>
          )}
        </div>

        {/* 문서 타입 선택 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            문서 타입
            <span className="ml-1 text-red-400">*</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DOC_OPTIONS.map((doc) => {
              const isFixed = FIXED_TYPES.includes(doc.value as DocumentType);
              const alreadyExists = isFixed && existingDocTypes.includes(doc.value as DocumentType);
              const isSelected = selectedType === doc.value;

              return (
                <button
                  key={doc.value}
                  type="button"
                  onClick={() => handleTypeSelect(doc.value)}
                  disabled={alreadyExists}
                  className={
                    'flex justify-between items-center px-3 py-2 text-sm rounded-lg border transition-colors ' +
                    (alreadyExists
                      ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      : isSelected
                        ? 'border-green-300 bg-green-50 text-gray-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50')
                  }
                >
                  <span>{doc.label}</span>
                  {alreadyExists && (
                    <span className="text-gray-300 text-xs leading-none">완료</span>
                  )}
                  {!alreadyExists && isSelected && (
                    <span className="text-green-500 text-sm leading-none">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm} disabled={isConfirmDisabled}>
            {isLoading ? '생성 중...' : '문서 생성'}
          </Button>
        </div>
      </div>
    </div>
  );
}
