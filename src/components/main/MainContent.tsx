import { useParams } from 'react-router';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDocument } from '@/hooks/useDocument';
import CollaborativeEditor from '@/components/document/CollaborativeEditor';
import Button from '@/components/ui/Button';

const CURSOR_COLORS = ['#1971c2', '#e03131', '#2f9e44', '#f08c00', '#7048e8'];

export default function MainContent() {
  const { docId } = useParams();
  const { doc } = useDocument(docId);
  const { user } = useCurrentUser();

  if (!docId || !doc) {
    return <main className="flex-1 bg-white" />;
  }

  const collabUser = {
    name: user?.name ?? '익명',
    color: CURSOR_COLORS[(user?.id ?? 0) % CURSOR_COLORS.length],
  };

  return (
    <main className="flex-1 overflow-y-auto bg-white">
      {/*
        타이틀과 에디터를 같은 컨테이너 안에 배치 — 너비/패딩을 한 곳에서 관리해
        BlockNote 내부 CSS를 따로 맞출 필요 없이 픽셀 퍼펙트 정렬 보장
      */}
      <div className="max-w-180 mx-auto px-24 md:px-10 sm:px-5 pt-20">
        <div className="flex items-center gap-3 pb-4">
          <h1 className="text-4xl font-bold text-[#1a1a1a] tracking-tight leading-tight">
            {doc.title}
          </h1>
          <Button variant="feedback" size="sm" className="shrink-0">
            + AI 피드백
          </Button>
        </div>
        <CollaborativeEditor key={docId} docId={docId} editable={true} user={collabUser} token="" />
      </div>
    </main>
  );
}
