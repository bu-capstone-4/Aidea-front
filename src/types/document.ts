export type DocumentType = 'IDEA' | 'PLAN' | 'USER_SCENARIO' | 'API_SPEC' | 'ERD';
export type FeedbackStatus =
  | 'IDLE'
  | 'PENDING'
  | 'QUESTIONING'
  | 'ANSWERING'
  | 'DONE'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'FAILED';
export type TeamRole = 'OWNER' | 'MEMBER' | 'VIEWER';

export interface DocumentMeta {
  id: string;
  teamspaceId: string;
  type: DocumentType;
  title: string;
  snapshotClock: number | null;
}

export interface Question {
  id: string;
  section: string;
  text: string;
  options?: string[] | null;
}

export interface Answer {
  questionId: string;
  value: string;
}

export interface Feedback {
  id: string;
  documentId: string;
  status: FeedbackStatus;
  questions: Question[] | null;
  revisedMarkdown: string | null;
  originalMarkdown: string | null;
}
