import { useEffect, useCallback } from 'react';

interface BacklogModalProps {
  teamspaceId: string;
  onClose: () => void;
}

// Task 04에서 실제 구현으로 교체 예정
export default function BacklogModal({ onClose }: BacklogModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-[900px] max-h-[80vh] flex flex-col p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">백로그</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400">
          백로그 기능을 준비 중입니다.
        </div>
      </div>
    </div>
  );
}
