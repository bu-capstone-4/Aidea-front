import '@blocknote/mantine/style.css';
import { useEffect } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCollabEditor } from '@/hooks/useCollabEditor';
import { useDocumentEditorStore } from '@/store/documentEditorStore';

interface Props {
  docId: string;
  editable: boolean;
  user: { name: string; color: string };
  token: string;
}

function CollaborativeEditor({ docId, editable, user, token }: Props) {
  const { editor } = useCollabEditor({ docId, editable, user, token });
  const setEditor = useDocumentEditorStore((state) => state.setEditor);

  useEffect(() => {
    setEditor(editor);

    return () => setEditor(null);
  }, [editor, setEditor]);

  return <BlockNoteView editor={editor} theme="light" />;
}

export default CollaborativeEditor;
