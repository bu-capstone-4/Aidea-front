import { useEffect } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import Button from '../ui/Button';
import * as Y from 'yjs';

interface VersionPanelProps {
  panelTitle: string;
  content?: Y.Doc | null;
  markdownContent?: string | null;
  aiMark?: boolean;
  onSelect: () => void;
}

export default function VersionPanel({
  panelTitle,
  content,
  markdownContent,
  aiMark,
  onSelect,
}: VersionPanelProps) {
  const docEditor = useCreateBlockNote({
    collaboration: {
      fragment: (content ?? new Y.Doc()).getXmlFragment('document-store'),
      user: { name: '', color: '' },
    },
    editable: false,
  });

  const mdEditor = useCreateBlockNote({ editable: false });

  useEffect(() => {
    if (!markdownContent) return;
    mdEditor.tryParseMarkdownToBlocks(markdownContent).then((blocks) => {
      mdEditor.replaceBlocks(mdEditor.document, blocks);
    });
  }, [markdownContent]);

  const activeEditor = markdownContent !== undefined ? mdEditor : docEditor;

  return (
    <div className="group flex flex-col flex-1 border border-gray-200 rounded-xl bg-white overflow-hidden hover:border-blue-500 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 group-hover:border-blue-100 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors"></div>
          <span className="font-semibold group-hover:text-blue-600 transition-colors">
            {panelTitle}
          </span>
        </div>
        {aiMark && (
          <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-md group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            ✨ AI
          </span>
        )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="whitespace-pre-wrap leading-relaxed group-hover:text-gray-800 transition-colors">
          <BlockNoteView editor={activeEditor} editable={false} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 group-hover:border-blue-100 bg-white transition-colors">
        <Button
          variant="primary"
          onClick={onSelect}
          className="w-full py-3.5 rounded-lg bg-gray-100 text-gray-500 font-semibold shadow-sm hover:bg-blue-500 hover:text-white transition-all cursor-pointer group-hover:bg-blue-50 group-hover:text-blue-600"
        >
          이 버전 선택
        </Button>
      </div>
    </div>
  );
}
