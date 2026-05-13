import { useParams } from 'react-router';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDocument } from '@/hooks/useDocument';
import CollaborativeEditor from '@/components/document/CollaborativeEditor';
import Button from '@/components/ui/Button';
import FeedbackModal from './FeedbackModal';
import { useState } from 'react';
import SplitView from './SplitView';
import { useFeedbackStore } from '@/store/FeedbackStore';
import QuestionPanel from './QuestionPanel';

const CURSOR_COLORS = ['#1971c2', '#e03131', '#2f9e44', '#f08c00', '#7048e8'];

export default function MainContent() {
  const { docId } = useParams();
  const { doc } = useDocument(docId);
  const { user } = useCurrentUser();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const isSplitView = useFeedbackStore((state) => state.isSplitView);
  const status = useFeedbackStore((state) => state.status);

  const toggleFeedbackModal = () => {
    setIsFeedbackModalOpen((prev) => !prev);
  };

  if (!docId || !doc) {
    return <main className="flex-1 bg-white" />;
  }

  const collabUser = {
    name: user?.name ?? '익명',
    color: CURSOR_COLORS[(user?.id ?? 0) % CURSOR_COLORS.length],
  };

  return (
    <main className="flex-1 overflow-y-auto bg-white">
      {isSplitView ? (
        <SplitView title={doc.title} />
      ) : (
        <div className="max-w-180 mx-auto px-24 md:px-10 sm:px-5 pt-5">
          <div className="flex items-center gap-3 pb-4">
            <h1 className="text-4xl font-bold text-[#1a1a1a] tracking-tight leading-tight">
              {doc.title}
            </h1>
            <Button variant="feedback" size="sm" className="shrink-0" onClick={toggleFeedbackModal}>
              + AI 피드백
            </Button>
          </div>
          <CollaborativeEditor
            key={docId}
            docId={docId}
            editable={true}
            user={collabUser}
            token=""
          />
        </div>
      )}

      <FeedbackModal
        isFeedbackModalOpen={isFeedbackModalOpen}
        toggleFeedbackModal={toggleFeedbackModal}
        docId={docId ?? ''}
        originalText={doc.yjsBinary}
      />

      {(status === 'PENDING' || status === 'ANSWERING') && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[999]">
          <div className="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-6 text-gray-700 font-medium">AI가 문서를 분석하고 있습니다...</p>
          </div>
        </div>
      )}

      {status === 'QUESTIONING' && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[999]">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <QuestionPanel variant="fullscreen" />
          </div>
        </div>
      )}
    </main>
  );
}
