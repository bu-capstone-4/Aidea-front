import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDocument } from '@/hooks/useDocument';
import { getDocLabel } from '@/components/CreateTeamSpace/types';
import CollaborativeEditor from '@/components/document/CollaborativeEditor';
import Button from '@/components/ui/Button';
import FeedbackModal from './FeedbackModal';
import SplitView from './SplitView';
import { useFeedbackStore } from '@/store/FeedbackStore';
import QuestionPanel from './QuestionPanel';
import Loading from './Loading';
import useFeedback from '@/hooks/useFeedback';

const CURSOR_COLORS = ['#1971c2', '#e03131', '#2f9e44', '#f08c00', '#7048e8'];

const POLLING_TIMEOUT_MS = 30_000;

export default function MainContent() {
  const { docId } = useParams();
  const { doc } = useDocument(docId);
  const { user } = useCurrentUser();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const isSplitView = useFeedbackStore((state) => state.isSplitView);
  const status = useFeedbackStore((state) => state.status);
  const feedbackId = useFeedbackStore((state) => state.feedbackId);

  const resetFeedback = useFeedbackStore((state) => state.resetFeedback);
  const { startPolling, stopPolling } = useFeedback();

  // P3-2-12: PENDING/ANSWERING 상태가 30초 지속되면 폴링으로 전환
  useEffect(() => {
    if ((status !== 'PENDING' && status !== 'ANSWERING') || !feedbackId || !docId) {
      stopPolling();
      return;
    }

    const timeoutId = setTimeout(() => {
      startPolling(feedbackId, docId);
    }, POLLING_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, feedbackId, docId]);

  useEffect(() => {
    if (status === 'REJECTED') {
      resetFeedback();
    }
  }, [status, resetFeedback]);

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
    <main className="flex-1 overflow-y-auto bg-white relative">
      {isSplitView && <SplitView title={getDocLabel(doc.type)} />}
      <div
        className={`${isSplitView ? 'hidden' : 'block'} max-w-180 mx-auto px-24 md:px-10 sm:px-5 pt-5`}
      >
        <div className="flex items-center gap-3 pb-4">
          <h1 className="text-[2.5rem] font-bold text-[#1a1a1a] tracking-tight leading-tight">
            {getDocLabel(doc.type)}
          </h1>
          <Button variant="feedback" size="sm" className="shrink-0" onClick={toggleFeedbackModal}>
            + AI 피드백
          </Button>
        </div>

        <QuestionPanel />

        <div className={status === 'QUESTIONING' ? 'hidden' : 'block'}>
          <CollaborativeEditor
            key={docId}
            docId={docId}
            editable={true}
            user={collabUser}
            token=""
          />
        </div>
      </div>

      <FeedbackModal
        isFeedbackModalOpen={isFeedbackModalOpen}
        toggleFeedbackModal={toggleFeedbackModal}
        docId={docId ?? ''}
      />

      <Loading isLoading={status === 'PENDING' || status === 'ANSWERING'} />

      {status === 'FAILED' && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-999">
          <div className="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center gap-4">
            <p className="text-gray-700 font-medium">AI 피드백 생성에 실패했습니다.</p>
            <Button variant="feedback" size="sm" onClick={resetFeedback}>
              다시 시도
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
