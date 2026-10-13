import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDocument } from '@/hooks/useDocument';
import { getDocLabel } from '@/components/CreateTeamSpace/types';
import CollaborativeEditor from '@/components/document/CollaborativeEditor';
import DocumentSkeleton, { DocumentTitleSkeleton } from '@/components/document/DocumentSkeleton';
import Button from '@/components/ui/Button';
import FeedbackModal from './FeedbackModal';
import SplitView from './SplitView';
import AiFeedbackButton from './AiFeedbackButton';
import { useFeedbackStore } from '@/store/FeedbackStore';
import useFeedback from '@/hooks/useFeedback';
import { Helmet } from 'react-helmet-async';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import { useTeamspaceDetail } from '@/hooks/useTeamspaceDetail';
import { useIsViewer } from '@/hooks/useIsViewer';
import { apiClient } from '@/shared/apiClient';
import { debounce } from '@/shared/debounce';

const CURSOR_COLORS = ['#1971c2', '#e03131', '#2f9e44', '#f08c00', '#7048e8'];

const POLLING_TIMEOUT_MS = 30_000;

const DOC_BODY_LAYOUT_CLASS = 'max-w-180 mx-auto px-5 md:px-10 pt-5';

export default function MainContent() {
  const { docId } = useParams();
  const { doc } = useDocument(docId);
  const { user } = useCurrentUser();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const isSplitView = useFeedbackStore((state) => state.isSplitView);
  const status = useFeedbackStore((state) => state.status);
  const feedbackId = useFeedbackStore((state) => state.feedbackId);
  const { currentTeamspaceId, documentAiStatuses, setDocumentTitleOverride } = useTeamspaceStore();
  const { teamspace, refetch: refetchTeamspace } = useTeamspaceDetail(currentTeamspaceId);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const debouncedSaveTitle = useMemo(
    () =>
      debounce(async (id: string, title: string, onDone: () => void) => {
        await apiClient.patch(`/api/documents/${id}`, { title });
        onDone();
      }, 600),
    []
  );
  const isAiDraftGenerating =
    docId && doc?.type !== 'FREE' ? documentAiStatuses[docId] === 'DRAFT' : false;
  const isViewer = useIsViewer();

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

  // docId 변경 / 언마운트 시 대기 중인 디바운스 취소
  useEffect(() => {
    return () => debouncedSaveTitle.cancel();
  }, [docId, debouncedSaveTitle]);

  const handleTitleInput = (e: React.FormEvent<HTMLHeadingElement>) => {
    const text = e.currentTarget.textContent ?? '';
    if (docId) setDocumentTitleOverride(docId, text);
    debouncedSaveTitle(docId ?? '', text.trim() || '새 문서', refetchTeamspace);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const handleTitleBlur = async (e: React.FocusEvent<HTMLHeadingElement>) => {
    debouncedSaveTitle.cancel();
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

  if (!docId) {
    return <main className="flex-1 bg-white" />;
  }

  if (!doc) {
    return (
      <main className="flex-1 overflow-y-auto bg-white">
        <div className={DOC_BODY_LAYOUT_CLASS}>
          <div className="pb-4">
            <DocumentTitleSkeleton />
          </div>
          <DocumentSkeleton />
        </div>
      </main>
    );
  }

  // useDocument는 docId가 바뀌어도 응답 전까지 이전 문서를 유지하므로, 그동안 이전 제목을 보여 주지 않는다
  const isDocStale = doc.id !== docId;

  const collabUser = {
    name: user?.name ?? '익명',
    color: CURSOR_COLORS[(user?.id ?? 0) % CURSOR_COLORS.length],
  };

  const docTitle = doc.type === 'FREE' ? doc.title : getDocLabel(doc.type);
  const canRequestFeedback = status === 'IDLE' || status === 'ACCEPTED';

  return (
    <main className="flex-1 overflow-y-auto bg-white relative">
      <Helmet>
        <title>{`${docTitle} - ${teamspace?.name ?? 'Aidea'}`}</title>
      </Helmet>
      {isSplitView && <SplitView title={docTitle} />}
      <div className={`${isSplitView ? 'hidden' : 'block'} ${DOC_BODY_LAYOUT_CLASS}`}>
        <div className="flex items-center gap-3 pb-4">
          {isDocStale ? (
            <DocumentTitleSkeleton />
          ) : doc.type === 'FREE' && !isViewer ? (
            <h1
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleTitleInput}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleTitleBlur}
              onPaste={handleTitlePaste}
              className="text-[2.5rem] max-md:text-[1.75rem] font-bold text-[#1a1a1a] tracking-tight leading-tight outline-none cursor-text"
            />
          ) : (
            <h1 className="text-[2.5rem] max-md:text-[1.75rem] font-bold text-[#1a1a1a] tracking-tight leading-tight">
              {docTitle}
            </h1>
          )}
          {canRequestFeedback && (
            <AiFeedbackButton variant="inline" onClick={toggleFeedbackModal} />
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

      {canRequestFeedback && !isSplitView && (
        <AiFeedbackButton variant="floating" onClick={toggleFeedbackModal} />
      )}

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
