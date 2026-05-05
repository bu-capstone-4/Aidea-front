import React from 'react';
import Button from '@/components/ui/Button';

interface FeedbackModalProps {
  isFeedbackModalOpen: boolean;
  toggleFeedbackModal: () => void;
}

export default function FeedbackModal({
  isFeedbackModalOpen,
  toggleFeedbackModal,
}: FeedbackModalProps) {
  if (!isFeedbackModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-999">
      <div className="bg-white rounded-2xl shadow-2xl w-125 p-6 flex flex-col gap-4 relative">
        <div className="flex justify-between">
          <span className="text-2xl font-bold text-gray-900">AI 피드백</span>
          <Button variant="secondary" size="sm" onClick={toggleFeedbackModal}>
            x
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-gray-800">추가 요청 사항</span>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md">선택사항</span>
        </div>
        <textarea
          name=""
          id=""
          placeholder="선택사항입니다. 입력하지 않으면 아이디어와 비교해서 피드백을 해드립니다."
          className="w-full h-32 border border-gray-300 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 transition-all leading-relaxed"
        ></textarea>
        <Button variant="primary">피드백 요청</Button>
      </div>
    </div>
  );
}
