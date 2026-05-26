import { useEffect, useRef, useState } from 'react';
import { MdOutlineLibraryBooks, MdOutlineCheckBox, MdOutlineBookmarks } from 'react-icons/md';
import type { BacklogConfigResponse } from '@/types/backlog';

export type IssueKind = 'story' | 'task' | 'epic';

interface IssueTypeDropdownProps {
  config: BacklogConfigResponse;
  onSelect: (kind: IssueKind) => void;
}

interface IssueOption {
  kind: IssueKind;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export default function IssueTypeDropdown({ config, onSelect }: IssueTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const options: IssueOption[] = [];

  if (config.storyEnabled) {
    options.push({
      kind: 'story',
      label: '스토리',
      description: '세부 태스크를 포함하는 기능 단위',
      icon: <MdOutlineLibraryBooks size={16} />,
      color: 'text-blue-600',
    });
  }

  options.push({
    kind: 'task',
    label: '태스크',
    description: '단독으로 처리되는 작업 단위',
    icon: <MdOutlineCheckBox size={16} />,
    color: 'text-green-600',
  });

  if (config.epicEnabled) {
    options.push({
      kind: 'epic',
      label: '에픽',
      description: '여러 스토리를 묶는 큰 작업 단위',
      icon: <MdOutlineBookmarks size={16} />,
      color: 'text-purple-600',
    });
  }

  const handleSelect = (kind: IssueKind) => {
    setOpen(false);
    onSelect(kind);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-3 py-1 rounded bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
      >
        + 이슈 추가
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-border rounded-lg shadow-lg z-20 py-1 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.kind}
              onClick={() => handleSelect(opt.kind)}
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-surface transition-colors text-left"
            >
              <span className={`mt-0.5 shrink-0 ${opt.color}`}>{opt.icon}</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink">{opt.label}</span>
                <span className="text-xs text-ink-muted">{opt.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
