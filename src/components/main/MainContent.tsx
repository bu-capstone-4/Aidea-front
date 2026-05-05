import { useParams } from 'react-router';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDocument } from '@/hooks/useDocument';
import CollaborativeEditor from '@/components/document/CollaborativeEditor';

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
    <main className="flex-1 overflow-hidden flex flex-col bg-white">
      <CollaborativeEditor key={docId} docId={docId} editable={true} user={collabUser} token="" />
    </main>
  );
}
