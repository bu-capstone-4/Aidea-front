import Button from '../ui/Button';

interface VersionPanelProps {
  panelTitle: string;
  content: string | Uint8Array;
  aiMark?: boolean;
  onSelect: () => void;
}

export default function VersionPanel({ panelTitle, content, aiMark, onSelect }: VersionPanelProps) {
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
          {content}
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
