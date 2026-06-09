import '@blocknote/mantine/style.css';
import { useEffect } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCollabEditor } from '@/hooks/useCollabEditor';
import { useDocumentEditorStore } from '@/store/documentEditorStore';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import DraftQuestionPanel from '@/components/main/DraftQuestionPanel';

interface Props {
  docId: string;
  editable: boolean;
  isAiDraftGenerating?: boolean;
  user: { name: string; color: string };
  token: string;
}

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

function CollaborativeEditor({ docId, editable, isAiDraftGenerating = false, user, token }: Props) {
  const { editor } = useCollabEditor({ docId, editable, user, token });
  const setEditor = useDocumentEditorStore((state) => state.setEditor);
  const draftQA = useTeamspaceStore((state) => state.draftQA);

  useEffect(() => {
    setEditor(editor);

    return () => setEditor(null);
  }, [editor, setEditor]);

  // IDEA 초안 Q&A 흐름의 세부 단계 — 같은 문서에 대한 draftQA가 있을 때만 의미가 있다.
  const isQuestioningThisDoc = draftQA?.documentId === docId && draftQA.status === 'QUESTIONING';
  const isAnsweringThisDoc = draftQA?.documentId === docId && draftQA.status === 'ANSWERING';

  return (
    <div className="relative">
      <div inert={isAiDraftGenerating || undefined}>
        <BlockNoteView editor={editor} theme="light" />
      </div>
      {isQuestioningThisDoc && <DraftQuestionPanel documentId={docId} />}
      {!isQuestioningThisDoc && isAnsweringThisDoc && (
        <LoadingSpinner message="답변을 반영해 초안을 다시 작성하고 있어요. 시간이 조금 더 걸릴 수 있어요." />
      )}
      {!isQuestioningThisDoc && !isAnsweringThisDoc && isAiDraftGenerating && (
        <LoadingSpinner message="AI 초안을 생성하고 있습니다. 잠시 후 자동으로 반영됩니다." />
      )}
    </div>
  );
}

export default CollaborativeEditor;
