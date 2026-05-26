import type { IssueType } from '@/types/backlog';

const TYPE_CLASS: Record<IssueType, string> = {
  FE: 'bg-blue-50 text-blue-600 border-blue-200',
  BE: 'bg-purple-50 text-purple-600 border-purple-200',
};

interface IssueTypeTagProps {
  issueType: IssueType;
  number: number;
}

export default function IssueTypeTag({ issueType, number }: IssueTypeTagProps) {
  const label = `${issueType}-${String(number).padStart(3, '0')}`;
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-mono font-medium whitespace-nowrap ${TYPE_CLASS[issueType]}`}
    >
      {label}
    </span>
  );
}
