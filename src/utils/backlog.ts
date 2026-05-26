import type { IssueType, StorySummary, StoryDetail, EpicResponse } from '@/types/backlog';

export function toStorySummary(detail: StoryDetail): StorySummary {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { body, closedAt, tasks, ...summary } = detail;
  return summary;
}

export function formatIssueId(
  issueType: IssueType | null,
  number: number,
  feBeEnabled: boolean
): string {
  if (!feBeEnabled || !issueType) return String(number);
  return `${issueType}-${String(number).padStart(3, '0')}`;
}

export function sortStoriesByEpic(stories: StorySummary[], epics: EpicResponse[]): StorySummary[] {
  const epicOrder = new Map(epics.map((e, i) => [e.id, i]));
  return [...stories].sort((a, b) => {
    const ai = a.epics[0] ? (epicOrder.get(a.epics[0].id) ?? Infinity) : Infinity;
    const bi = b.epics[0] ? (epicOrder.get(b.epics[0].id) ?? Infinity) : Infinity;
    if (ai !== bi) return ai - bi;
    return a.position - b.position;
  });
}
