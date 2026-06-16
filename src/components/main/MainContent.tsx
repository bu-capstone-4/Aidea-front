import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { MdAutoAwesome } from 'react-icons/md';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDocument } from '@/hooks/useDocument';
import { getDocLabel } from '@/components/CreateTeamSpace/types';
import CollaborativeEditor from '@/components/document/CollaborativeEditor';
import Button from '@/components/ui/Button';
import FeedbackModal from './FeedbackModal';
import SplitView from './SplitView';
import { useFeedbackStore } from '@/store/FeedbackStore';
import useFeedback from '@/hooks/useFeedback';
import { Helmet } from 'react-helmet-async';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import { useTeamspaceDetail } from '@/hooks/useTeamspaceDetail';
import { apiClient } from '@/shared/apiClient';

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
  const { currentTeamspaceId, documentAiStatuses, onlineMembers, setDocumentTitleOverride } =
    useTeamspaceStore();
  const { teamspace, refetch: refetchTeamspace } = useTeamspaceDetail(currentTeamspaceId);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAiDraftGenerating =
    docId && doc?.type !== 'FREE' ? documentAiStatuses[docId] === 'DRAFT' : false;
  const isViewer = onlineMembers.find((m) => m.userId === user?.id)?.role === 'VIEWER';

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
    resetFeedback();
    stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  // FREE 문서 제목: doc이 로드되거나 docId가 바뀔 때 contentEditable DOM에 동기화
  useEffect(() => {
    if (doc?.type === 'FREE' && titleRef.current) {
      titleRef.current.textContent = doc.title;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id, doc?.title]);

  // docId 변경 / 언마운트 시 디바운스 타이머 정리
  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    };
  }, [docId]);

  const handleTitleInput = (e: React.FormEvent<HTMLHeadingElement>) => {
    const text = e.currentTarget.textContent ?? '';
    if (docId) setDocumentTitleOverride(docId, text);
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(async () => {
      await apiClient.patch(`/api/documents/${docId}`, { title: text.trim() || '새 문서' });
      refetchTeamspace();
    }, 600);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const handleTitleBlur = async (e: React.FocusEvent<HTMLHeadingElement>) => {
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = null;
    }
    const text = (e.currentTarget.textContent ?? '').trim();
    const titleToSave = text || '새 문서';
    if (!text) e.currentTarget.textContent = '새 문서';
    if (docId) setDocumentTitleOverride(docId, titleToSave);
    await apiClient.patch(`/api/documents/${docId}`, { title: titleToSave });
    refetchTeamspace();
  };

  const handleTitlePaste = (e: React.ClipboardEvent<HTMLHeadingElement>) => {
    e.preventDefault();
    const text = e.clipboardData
      .getData('text/plain')
      .replace(/[\n\r]+/g, ' ')
      .trim();
    document.execCommand('insertText', false, text);
  };

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

  const docTitle = doc.type === 'FREE' ? doc.title : getDocLabel(doc.type);

  return (
    <main className="flex-1 overflow-y-auto bg-white relative">
      <Helmet>
        <title>{`${docTitle} - ${teamspace?.name ?? 'Aidea'}`}</title>
      </Helmet>
      {isSplitView && <SplitView title={docTitle} />}
      <div
        className={`${isSplitView ? 'hidden' : 'block'} max-w-180 mx-auto px-24 md:px-10 sm:px-5 pt-5`}
      >
        <div className="flex items-center gap-3 pb-4">
          {doc.type === 'FREE' && !isViewer ? (
            <h1
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleTitleInput}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleTitleBlur}
              onPaste={handleTitlePaste}
              className="text-[2.5rem] font-bold text-[#1a1a1a] tracking-tight leading-tight outline-none cursor-text"
            />
          ) : (
            <h1 className="text-[2.5rem] font-bold text-[#1a1a1a] tracking-tight leading-tight">
              {docTitle}
            </h1>
          )}
          {(status === 'IDLE' || status === 'ACCEPTED') && (
            <button
              onClick={toggleFeedbackModal}
              className="group flex shrink-0 items-center gap-1.5 rounded-full border border-ai/15 bg-ai-bg px-3.5 py-1.5 text-sm font-semibold text-ai transition-colors hover:bg-ai hover:text-white"
            >
              <MdAutoAwesome
                size={15}
                className="transition-transform duration-300 group-hover:rotate-45"
              />
              AI 피드백
            </button>
          )}
        </div>

        <div className={isSplitView === true ? 'hidden' : 'block'}>
          <CollaborativeEditor
            key={docId}
            docId={docId}
            editable={!isAiDraftGenerating && !isViewer}
            isAiDraftGenerating={isAiDraftGenerating}
            isViewer={isViewer}
            user={collabUser}
            token=""
          />
        </div>
      </div>

      <FeedbackModal
        isFeedbackModalOpen={isFeedbackModalOpen}
        toggleFeedbackModal={toggleFeedbackModal}
        docId={docId ?? ''}
        isFreeDoc={doc.type === 'FREE'}
      />

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
