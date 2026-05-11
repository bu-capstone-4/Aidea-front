import '@blocknote/mantine/style.css';
import { BlockNoteView } from '@blocknote/mantine';
import { useCollabEditor } from '@/hooks/useCollabEditor';

interface Props {
  docId: string;
  editable: boolean;
  user: { name: string; color: string };
  token: string;
}

function CollaborativeEditor({ docId, editable, user, token }: Props) {
  const { editor } = useCollabEditor({ docId, editable, user, token });

  return <BlockNoteView editor={editor} theme="light" />;
}

export default CollaborativeEditor;
