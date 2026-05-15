import useFeedback from '@/hooks/useFeedback';
import { useFeedbackStore } from '@/store/FeedbackStore';
import VersionPanel from './VersionPanel';

interface SplitViewProps {
  title: string;
}

export default function FeedbackSplitView({ title }: SplitViewProps) {
  const { originalText, revisedText, feedbackId, documentId, ydoc } = useFeedbackStore();
  const { chooseVersion } = useFeedback();

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-6 gap-4 bg-white">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>

      {/* 상단 배너 */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
        <div className="flex items-center gap-2">
          <span>✨</span>
          <span>AI가 피드백을 반영하여 내용을 수정했습니다. 두 버전을 비교해 보세요.</span>
        </div>
        <button className="text-purple-400 hover:text-purple-600">✕</button>
      </div>

      {/* 스플릿 뷰 */}
      <div className="flex gap-6 h-full min-h-0">
        <VersionPanel
          panelTitle="수정 전"
          content={originalText}
          aiMark={false}
          onSelect={() => {
            if (ydoc) {
              chooseVersion('ORIGINAL', documentId, feedbackId, ydoc);
            }
          }}
        />

        <VersionPanel
          panelTitle="AI 피드백 후"
          content={revisedText}
          aiMark={true}
          onSelect={() => {
            if (ydoc) {
              chooseVersion('AI', documentId, feedbackId, ydoc);
            }
          }}
        />
      </div>
    </div>
  );
}
