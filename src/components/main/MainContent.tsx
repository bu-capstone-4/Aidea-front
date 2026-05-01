import { useParams } from 'react-router';
import { documents } from '@/mocks/db';
import Button from '@/components/ui/Button';

export default function MainContent() {
  const { docId } = useParams();
  const doc = documents.find((d) => d.id === docId) ?? documents[0];

  return (
    <main className="flex-1 bg-white overflow-auto">
      <div className="max-w-4xl mx-auto px-8 py-12 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">{doc.title}</h1>
          <Button variant="feedback" size="sm">
            AI 피드백
          </Button>
        </div>
        <article className="text-lg text-gray-700 leading-relaxed">
          {doc.yjsBinary || '아직 내용이 없습니다.'}
        </article>
      </div>
    </main>
  );
}
