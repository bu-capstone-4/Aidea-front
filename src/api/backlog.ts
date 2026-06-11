import { apiClient } from '@/shared/apiClient';
import type {
  BacklogConfigResponse,
  SaveBacklogConfigRequest,
  EpicResponse,
  StorySummary,
  StoryDetail,
  StoryStatusResponse,
  ReorderResponse,
  TaskResponse,
  CreateStoryRequest,
  StoryStatus,
  Priority,
  IssueType,
  BacklogTask,
  CreateBacklogTaskRequest,
  CreateEpicRequest,
} from '@/types/backlog';

type GlobalResponse<T> = { data: T };

// ── Config ────────────────────────────────────────────────────

export async function getBacklogConfig(teamspaceId: string): Promise<BacklogConfigResponse> {
  const res = await apiClient.get<GlobalResponse<BacklogConfigResponse>>(
    `/api/teamspaces/${teamspaceId}/backlog/config`
  );
  return res.data.data;
}

export async function saveBacklogConfig(
  teamspaceId: string,
  config: SaveBacklogConfigRequest
): Promise<BacklogConfigResponse> {
  const res = await apiClient.put<GlobalResponse<BacklogConfigResponse>>(
    `/api/teamspaces/${teamspaceId}/backlog/config`,
    config
  );
  return res.data.data;
}

// ── Epic ──────────────────────────────────────────────────────

export async function getEpics(teamspaceId: string): Promise<EpicResponse[]> {
  const res = await apiClient.get<GlobalResponse<EpicResponse[]>>(
    `/api/teamspaces/${teamspaceId}/epics`
  );
  return res.data.data;
}

export async function createEpic(
  teamspaceId: string,
  body: CreateEpicRequest
): Promise<EpicResponse> {
  const res = await apiClient.post<GlobalResponse<EpicResponse>>(
    `/api/teamspaces/${teamspaceId}/epics`,
    body
  );
  return res.data.data;
}

export async function updateEpic(
  teamspaceId: string,
  epicId: number,
  body: CreateEpicRequest
): Promise<EpicResponse> {
  const res = await apiClient.put<GlobalResponse<EpicResponse>>(
    `/api/teamspaces/${teamspaceId}/epics/${epicId}`,
    body
  );
  return res.data.data;
}

export async function updateEpicStatus(
  teamspaceId: string,
  epicId: number,
  status: StoryStatus
): Promise<EpicResponse> {
  const res = await apiClient.patch<GlobalResponse<EpicResponse>>(
    `/api/teamspaces/${teamspaceId}/epics/${epicId}/status`,
    { status }
  );
  return res.data.data;
}

export async function reorderEpics(
  teamspaceId: string,
  orderedIds: number[]
): Promise<ReorderResponse> {
  const res = await apiClient.patch<GlobalResponse<ReorderResponse>>(
    `/api/teamspaces/${teamspaceId}/epics/reorder`,
    { orderedIds }
  );
  return res.data.data;
}

export async function deleteEpic(teamspaceId: string, epicId: number): Promise<void> {
  await apiClient.delete(`/api/teamspaces/${teamspaceId}/epics/${epicId}`);
}

// ── Story ─────────────────────────────────────────────────────

export async function getStories(
  teamspaceId: string,
  params?: {
    status?: StoryStatus[];
    epicId?: number;
    assigneeId?: number;
    priority?: Priority;
  }
): Promise<StorySummary[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) {
    params.status.forEach((s) => searchParams.append('status', s));
  }
  if (params?.epicId !== undefined) searchParams.set('epicId', String(params.epicId));
  if (params?.assigneeId !== undefined) searchParams.set('assigneeId', String(params.assigneeId));
  if (params?.priority) searchParams.set('priority', params.priority);

  const query = searchParams.toString();
  const url = `/api/teamspaces/${teamspaceId}/stories${query ? `?${query}` : ''}`;
  const res = await apiClient.get<GlobalResponse<StorySummary[]>>(url);
  return res.data.data;
}

export async function getStoryDetail(teamspaceId: string, storyId: number): Promise<StoryDetail> {
  const res = await apiClient.get<GlobalResponse<StoryDetail>>(
    `/api/teamspaces/${teamspaceId}/stories/${storyId}`
  );
  return res.data.data;
}

export async function createStory(
  teamspaceId: string,
  body: CreateStoryRequest
): Promise<StoryDetail> {
  const res = await apiClient.post<GlobalResponse<StoryDetail>>(
    `/api/teamspaces/${teamspaceId}/stories`,
    body
  );
  return res.data.data;
}

export async function updateStory(
  teamspaceId: string,
  storyId: number,
  body: CreateStoryRequest
): Promise<StoryDetail> {
  const res = await apiClient.put<GlobalResponse<StoryDetail>>(
    `/api/teamspaces/${teamspaceId}/stories/${storyId}`,
    body
  );
  return res.data.data;
}

export async function updateStoryStatus(
  teamspaceId: string,
  storyId: number,
  status: StoryStatus
): Promise<StoryStatusResponse> {
  const res = await apiClient.patch<GlobalResponse<StoryStatusResponse>>(
    `/api/teamspaces/${teamspaceId}/stories/${storyId}/status`,
    { status }
  );
  return res.data.data;
}

export async function reorderStories(
  teamspaceId: string,
  orderedIds: number[]
): Promise<ReorderResponse> {
  const res = await apiClient.patch<GlobalResponse<ReorderResponse>>(
    `/api/teamspaces/${teamspaceId}/stories/reorder`,
    { orderedIds }
  );
  return res.data.data;
}

export async function deleteStory(teamspaceId: string, storyId: number): Promise<void> {
  await apiClient.delete(`/api/teamspaces/${teamspaceId}/stories/${storyId}`);
}

// ── Story-level Task ──────────────────────────────────────────

export async function createTask(
  teamspaceId: string,
  storyId: number,
  body: { title: string; issueType?: IssueType | null; assigneeId?: number | null }
): Promise<TaskResponse> {
  const res = await apiClient.post<GlobalResponse<TaskResponse>>(
    `/api/teamspaces/${teamspaceId}/stories/${storyId}/tasks`,
    body
  );
  return res.data.data;
}

export async function updateTask(
  teamspaceId: string,
  storyId: number,
  taskId: number,
  body: { title: string; issueType?: IssueType | null; assigneeId?: number | null }
): Promise<TaskResponse> {
  const res = await apiClient.put<GlobalResponse<TaskResponse>>(
    `/api/teamspaces/${teamspaceId}/stories/${storyId}/tasks/${taskId}`,
    body
  );
  return res.data.data;
}

export async function toggleTaskComplete(
  teamspaceId: string,
  storyId: number,
  taskId: number
): Promise<{ id: number; isCompleted: boolean }> {
  const res = await apiClient.patch<GlobalResponse<{ id: number; isCompleted: boolean }>>(
    `/api/teamspaces/${teamspaceId}/stories/${storyId}/tasks/${taskId}/complete`
  );
  return res.data.data;
}

export async function reorderTasks(
  teamspaceId: string,
  storyId: number,
  orderedIds: number[]
): Promise<ReorderResponse> {
  const res = await apiClient.patch<GlobalResponse<ReorderResponse>>(
    `/api/teamspaces/${teamspaceId}/stories/${storyId}/tasks/reorder`,
    { orderedIds }
  );
  return res.data.data;
}

export async function deleteTask(
  teamspaceId: string,
  storyId: number,
  taskId: number
): Promise<void> {
  await apiClient.delete(`/api/teamspaces/${teamspaceId}/stories/${storyId}/tasks/${taskId}`);
}

// ── Backlog-level Task (최상위 태스크) ────────────────────────

export async function createBacklogTask(
  teamspaceId: string,
  body: CreateBacklogTaskRequest
): Promise<BacklogTask> {
  const res = await apiClient.post<GlobalResponse<BacklogTask>>(
    `/api/teamspaces/${teamspaceId}/tasks`,
    body
  );
  return res.data.data;
}

export async function updateBacklogTask(
  teamspaceId: string,
  taskId: number,
  body: CreateBacklogTaskRequest
): Promise<BacklogTask> {
  const res = await apiClient.put<GlobalResponse<BacklogTask>>(
    `/api/teamspaces/${teamspaceId}/tasks/${taskId}`,
    body
  );
  return res.data.data;
}

export async function updateBacklogTaskStatus(
  teamspaceId: string,
  taskId: number,
  status: StoryStatus
): Promise<BacklogTask> {
  const res = await apiClient.patch<GlobalResponse<BacklogTask>>(
    `/api/teamspaces/${teamspaceId}/tasks/${taskId}/status`,
    { status }
  );
  return res.data.data;
}

export async function reorderBacklogTasks(
  teamspaceId: string,
  orderedIds: number[]
): Promise<ReorderResponse> {
  const res = await apiClient.patch<GlobalResponse<ReorderResponse>>(
    `/api/teamspaces/${teamspaceId}/tasks/reorder`,
    { orderedIds }
  );
  return res.data.data;
}

export async function deleteBacklogTask(teamspaceId: string, taskId: number): Promise<void> {
  await apiClient.delete(`/api/teamspaces/${teamspaceId}/tasks/${taskId}`);
}

export async function updateBacklogTaskStory(
  teamspaceId: string,
  taskId: number,
  storyId: number | null
): Promise<BacklogTask> {
  const res = await apiClient.patch<GlobalResponse<BacklogTask>>(
    `/api/teamspaces/${teamspaceId}/tasks/${taskId}/story`,
    { storyId }
  );
  return res.data.data;
}
