import { useFeedbackStore } from '@/store/FeedbackStore';

interface SplitViewProps {
  doc: string;
}

export default function FeedbackSplitView({ doc }: SplitViewProps) {
  const { originalText, revisedText, acceptFeedback } = useFeedbackStore();

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-6 gap-4 bg-white">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{doc.title}</h1>

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
        {/* 왼쪽(원본) */}
        <div className="group flex flex-col flex-1 border border-gray-200 rounded-xl bg-white overflow-hidden hover:border-blue-500 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 group-hover:border-blue-100 transition-colors">
            <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors"></div>
            <span className="font-semibold group-hover:text-blue-600 transition-colors">
              수정 전
            </span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="whitespace-pre-wrap leading-relaxed group-hover:text-gray-800 transition-colors">
              {originalText}
            </div>
          </div>
          <div className="p-4 border-t border-gray-100 group-hover:border-blue-100 bg-white transition-colors">
            <button className="w-full py-3.5 rounded-lg bg-gray-100 text-gray-500 font-semibold shadow-sm hover:bg-blue-500 hover:text-white transition-all cursor-pointer group-hover:bg-blue-50 group-hover:text-blue-600">
              이 버전 선택
            </button>
          </div>
        </div>

        {/* 오른쪽(AI 피드백 후) */}
        <div className="group flex flex-col flex-1 border border-gray-200 rounded-xl bg-white overflow-hidden hover:border-blue-500 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 group-hover:border-blue-100 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors"></div>
              <span className="font-semibold group-hover:text-blue-600 transition-colors">
                AI 피드백 후
              </span>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-md group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
              ✨ AI
            </span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="whitespace-pre-wrap leading-relaxed group-hover:text-gray-800 transition-colors">
              {revisedText}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 group-hover:border-blue-100 bg-white transition-colors">
            <button
              onClick={acceptFeedback}
              className="w-full py-3.5 rounded-lg bg-gray-100 text-gray-500 font-semibold shadow-sm hover:bg-blue-500 hover:text-white transition-all cursor-pointer group-hover:bg-blue-50 group-hover:text-blue-600"
            >
              이 버전 선택
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
