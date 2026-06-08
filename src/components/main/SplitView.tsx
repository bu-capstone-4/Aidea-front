import useFeedback from '@/hooks/useFeedback';
import { useFeedbackStore } from '@/store/FeedbackStore';
import VersionPanel from './VersionPanel';
import QuestionPanel from './QuestionPanel';
import FeedbackSkeleton from './FeedbackSkeleton';

interface SplitViewProps {
  title: string;
}

export default function FeedbackSplitView({ title }: SplitViewProps) {
  const { revisedMarkdown, feedbackId, ydoc, resetFeedback, acceptFeedback, status } =
    useFeedbackStore();
  const { acceptFeedback: acceptFeedbackApi, rejectFeedback } = useFeedback();

  const handleAccept = async () => {
    await acceptFeedbackApi(feedbackId);
    acceptFeedback();
  };

  const handleReject = async () => {
    await rejectFeedback(feedbackId);
    resetFeedback();
  };

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-6 gap-4 bg-white">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
      {status === 'DONE' && (
        <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
          <div className="flex items-center gap-2">
            <span>✨</span>
            <span>AI가 피드백을 반영하여 내용을 수정했습니다. 두 버전을 비교해 보세요.</span>
          </div>
          <button className="text-purple-400 hover:text-purple-600" onClick={handleReject}>
            ✕
          </button>
        </div>
      )}

      {/* 스플릿 뷰 */}
      <div className="flex gap-6 h-full min-h-0">
        <VersionPanel
          panelTitle="수정 전"
          content={ydoc}
          aiMark={false}
          onSelect={handleReject}
          editable={true}
        />

        {status === 'QUESTIONING' && (
          <div className="group flex flex-col flex-1 border border-gray-200 rounded-xl bg-white overflow-hidden hover:border-blue-500 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 group-hover:border-blue-100 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors" />
                <span className="font-semibold group-hover:text-blue-600 transition-colors">
                  AI 피드백 후
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-md group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                ✨ AI
              </span>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <QuestionPanel />
            </div>
          </div>
        )}
        {(status === 'PENDING' || status === 'ANSWERING') && <FeedbackSkeleton />}
        {status === 'DONE' && (
          <VersionPanel
            panelTitle="AI 피드백 후"
            markdownContent={revisedMarkdown}
            aiMark={true}
            onSelect={handleAccept}
            editable={false}
          />
        )}
      </div>
    </div>
  );
}
