interface Props {
  isLoading: boolean;
}

export default function Loading({ isLoading }: Props) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[999]">
      <div className="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-6 text-gray-700 font-medium">AI가 문서를 분석하고 있습니다...</p>
      </div>
    </div>
  );
}
