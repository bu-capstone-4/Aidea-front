export const DOC_OPTIONS = [
  '아이디어',
  '기획서',
  '유저 시나리오',
  'API 명세서',
  'ERD',
  '기술 스택',
] as const;

export type DocType = (typeof DOC_OPTIONS)[number];

export interface TeamSpaceForm {
  teamName: string;
  idea: string;
  emails: { id: string; value: string }[];
  selectedDocs: DocType[];
}
