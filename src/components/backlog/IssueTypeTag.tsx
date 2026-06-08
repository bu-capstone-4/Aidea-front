import type { IssueType } from '@/types/backlog';
import { ISSUE_TYPE_CLASS } from '@/constants/backlog';

interface IssueTypeTagProps {
  issueType: IssueType;
  number: number;
}

export default function IssueTypeTag({ issueType, number }: IssueTypeTagProps) {
  const label = `${issueType}-${String(number).padStart(3, '0')}`;
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-mono font-medium whitespace-nowrap ${ISSUE_TYPE_CLASS[issueType]}`}
    >
      {label}
    </span>
  );
}
