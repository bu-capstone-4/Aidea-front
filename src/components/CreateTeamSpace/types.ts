export const DOC_OPTIONS = [
  { label: '아이디어', value: 'IDEA' },
  { label: '기획서', value: 'PLAN' },
  { label: '유저 시나리오', value: 'USER_SCENARIO' },
  { label: 'API 명세서', value: 'API_SPEC' },
  { label: 'ERD', value: 'ERD' },
] as const;

export type DocType = (typeof DOC_OPTIONS)[number]['value'];

export const getDocLabel = (type: DocType | string): string =>
  DOC_OPTIONS.find((o) => o.value === type)?.label ?? type;

export interface EmailField {
  id: string;
  value: string;
  error: string | null;
}

export interface TeamSpaceForm {
  teamName: string;
  idea: string;
  emails: EmailField[];
  selectedDocs: DocType[];
}
