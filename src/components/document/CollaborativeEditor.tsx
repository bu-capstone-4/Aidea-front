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
  const { editor, connected } = useCollabEditor({ docId, editable, user, token });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-green-500' : 'bg-red-400'}`}
        />
        <span className="text-sm text-gray-500">
          {connected ? `${user.name} 으로 연결됨` : '서버에 연결 중...'}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <BlockNoteView editor={editor} />
      </div>
    </div>
  );
}

export default CollaborativeEditor;
