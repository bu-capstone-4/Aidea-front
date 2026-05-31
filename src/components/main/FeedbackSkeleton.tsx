export default function FeedbackSkeleton() {
  return (
    <div className="group flex flex-col flex-1 border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm hover:border-blue-500 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 group-hover:border-blue-100 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors animate-pulse" />
          <span className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
            AI 피드백 후
          </span>
        </div>
        <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-md group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
          ✨ AI
        </span>
      </div>

      <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="h-4 w-1/3 bg-blue-100 rounded-md animate-pulse" />
          <div className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2">
            <div className="h-3 w-full bg-blue-100 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-blue-100 rounded animate-pulse" />
            <div className="h-3 w-4/6 bg-blue-100 rounded animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="h-4 w-1/4 bg-blue-100 rounded-md animate-pulse" />
          <div className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2">
            <div className="h-3 w-full bg-blue-100 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-blue-100 rounded animate-pulse" />
          </div>
          <div className="flex flex-col gap-2 pl-2">
            <div className="h-3 w-5/6 bg-blue-100 rounded animate-pulse" />
            <div className="h-3 w-4/6 bg-blue-100 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-blue-100 rounded animate-pulse" />
            <div className="h-3 w-3/6 bg-blue-100 rounded animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="h-4 w-1/4 bg-blue-100 rounded-md animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-full bg-blue-100 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-blue-100 rounded animate-pulse" />
            <div className="h-3 w-3/5 bg-blue-100 rounded animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="h-4 w-1/4 bg-blue-100 rounded-md animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-full bg-blue-100 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-blue-100 rounded animate-pulse" />
            <div className="h-3 w-3/5 bg-blue-100 rounded animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="h-4 w-1/4 bg-blue-100 rounded-md animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-full bg-blue-100 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-blue-100 rounded animate-pulse" />
            <div className="h-3 w-3/5 bg-blue-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
