import '@blocknote/mantine/style.css';
import { useEffect, useRef } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCollabEditor } from '@/hooks/useCollabEditor';
import { useDocumentEditorStore } from '@/store/documentEditorStore';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import { useToastStore } from '@/store/toastStore';
import DraftQuestionPanel from '@/components/main/DraftQuestionPanel';
import DocumentSkeleton from '@/components/document/DocumentSkeleton';
import Button from '@/components/ui/Button';

interface Props {
  docId: string;
  editable: boolean;
  isAiDraftGenerating?: boolean;
  isViewer?: boolean;
  user: { name: string; color: string };
  token: string;
}

// 키보드 입력 중 편집을 시도하는 키만 토스트 대상으로 간주 (방향키, 복사 등은 제외)
const NON_EDITING_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Tab',
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'Escape',
  'CapsLock',
]);

const VIEWER_EDIT_TOAST_INTERVAL_MS = 3000;

function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/75 z-10 rounded-lg">
      <svg
        className="animate-spin h-7 w-7 text-blue-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p className="text-sm font-medium text-gray-600">{message}</p>
    </div>
  );
}

function DocumentLoadError() {
  return (
    <div
      role="alert"
      className="absolute inset-x-0 top-0 flex flex-col items-center gap-4 pt-20 text-center"
    >
      <p className="text-sm font-medium text-ink">문서를 불러오지 못했어요.</p>
      <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
        새로고침
      </Button>
    </div>
  );
}

function CollaborativeEditor({
  docId,
  editable,
  isAiDraftGenerating = false,
  isViewer = false,
  user,
  token,
}: Props) {
  const { editor, syncStatus } = useCollabEditor({ docId, editable, user, token });
  const setEditor = useDocumentEditorStore((state) => state.setEditor);
  const draftQA = useTeamspaceStore((state) => state.draftQA);
  const lastViewerToastRef = useRef(0);

  useEffect(() => {
    setEditor(editor);

    return () => setEditor(null);
  }, [editor, setEditor]);

  const notifyViewerEditAttempt = () => {
    const now = Date.now();
    if (now - lastViewerToastRef.current < VIEWER_EDIT_TOAST_INTERVAL_MS) return;
    lastViewerToastRef.current = now;
    useToastStore.getState().addToast({
      type: 'error',
      message: '권한이 없어 편집할 수 없습니다.',
    });
  };

  const handleViewerKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || NON_EDITING_KEYS.has(e.key)) return;
    notifyViewerEditAttempt();
  };

  const handleViewerPaste = () => {
    notifyViewerEditAttempt();
  };

  // IDEA 초안 Q&A 흐름의 세부 단계 — 같은 문서에 대한 draftQA가 있을 때만 의미가 있다.
  const isQuestioningThisDoc = draftQA?.documentId === docId && draftQA.status === 'QUESTIONING';
  const isAnsweringThisDoc = draftQA?.documentId === docId && draftQA.status === 'ANSWERING';
  // doc:init 처리 전에는 본문이 비어 보이고, 이때의 입력은 서버로 전송되지 않아 분기하므로 숨기고 막는다.
  // BlockNoteView는 y-prosemirror 바인딩 유지를 위해 언마운트하지 않는다.
  const isSynced = syncStatus === 'ready';

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      <div
        inert={isAiDraftGenerating || !isSynced || undefined}
        className={isSynced ? undefined : 'invisible'}
        onKeyDownCapture={isViewer ? handleViewerKeyDown : undefined}
        onPasteCapture={isViewer ? handleViewerPaste : undefined}
      >
        <BlockNoteView editor={editor} theme="light" editable={editable} />
      </div>
      {syncStatus === 'loading' && (
        <div className="absolute inset-x-0 top-0">
          <DocumentSkeleton />
        </div>
      )}
      {syncStatus === 'error' && <DocumentLoadError />}
      {isSynced && isQuestioningThisDoc && <DraftQuestionPanel documentId={docId} />}
      {isSynced && !isQuestioningThisDoc && isAnsweringThisDoc && (
        <LoadingSpinner message="답변을 반영해 초안을 다시 작성하고 있어요. 시간이 조금 더 걸릴 수 있어요." />
      )}
      {isSynced && !isQuestioningThisDoc && !isAnsweringThisDoc && isAiDraftGenerating && (
        <LoadingSpinner message="AI 초안을 생성하고 있습니다. 잠시 후 자동으로 반영됩니다." />
      )}
    </div>
  );
}

export default CollaborativeEditor;
