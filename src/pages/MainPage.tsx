import { useParams } from 'react-router';

const Data = {
  idea: {
    title: '아이디어',
    content: '아이디어 내용',
  },
  plan: {
    title: '기획서',
    content: '기획서 내용',
  },
};

export default function MainPage() {
  const { docId } = useParams();
  return (
    <main className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-8 py-12 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">{Data[docId].title}</h1>
          <button className="w-fit bg-purple-50 text-purple-600 text-xs font-bold px-2 py-1 rounded border border-purple-100">
            AI분석
          </button>
        </div>
        <article className="text-lg text-gray-700 leading-relaxed">{Data[docId].content}</article>
      </div>
    </main>
  );
}
