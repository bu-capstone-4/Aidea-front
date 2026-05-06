import { useParams } from 'react-router';
import { useDocument } from '@/hooks/useDocument';
import Button from '@/components/ui/Button';
import FeedbackModal from './FeedbackModal';
import { useState } from 'react';
import SplitView from './SplitView';
import { useFeedbackStore } from '@/store/FeedbackStore';

export default function MainContent() {
  const { docId } = useParams();
  const { doc } = useDocument(docId);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const isSplitView = useFeedbackStore((state) => state.isSplitView);

  const toggleFeedbackModal = () => {
    setIsFeedbackModalOpen((prev) => !prev);
  };

  if (!doc) {
    return <main className="flex-1 bg-white overflow-auto" />;
  }

  return (
    <main className="flex-1 bg-white overflow-auto">
      {isSplitView ? (
        <SplitView title={doc.title} />
      ) : (
        <div className="max-w-4xl mx-auto px-8 py-12 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight">{doc.title}</h1>
            <Button
              variant="feedback"
              size="sm"
              onClick={() => {
                toggleFeedbackModal();
              }}
            >
              AI 피드백
            </Button>
          </div>
          <article className="text-lg text-gray-700 leading-relaxed">
            {doc.yjsBinary || '아직 내용이 없습니다.'}
          </article>
        </div>
      )}

      <FeedbackModal
        isFeedbackModalOpen={isFeedbackModalOpen}
        toggleFeedbackModal={toggleFeedbackModal}
        docId={docId ?? ''}
        originalText={doc.yjsBinary}
      />
    </main>
  );
}
