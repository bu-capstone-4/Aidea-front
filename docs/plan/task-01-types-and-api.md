# Task 01 — 타입 정의 및 API 레이어

> 상태: ⬜ 미완료  
> 의존성: 없음 (첫 번째 작업)

---

## 목표

백로그 기능 전반에 쓰이는 TypeScript 타입과, REST API를 호출하는 함수 모음을 만든다.  
기존 `src/types/api.ts`의 `UserResponse`와 충돌하지 않도록 백로그 전용 네임스페이스를 분리한다.

---

## 1. `src/types/backlog.ts`

### Enum 타입

```ts
export type StoryStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type IssueType = 'FE' | 'BE';
```

### 공통 DTO 타입

스펙의 `UserResponse`와 기존 `src/types/api.ts`의 `UserResponse`는 필드가 다르다.

- 기존: `id, email, name, profileImageUrl, provider`
- 백로그 스펙: `id, name, githubLogin, profileImageUrl`

백로그 전용 타입으로 분리:

```ts
export interface BacklogUser {
  id: number;
  name: string;
  githubLogin: string;
  profileImageUrl: string | null;
}

export interface BacklogConfigResponse {
  teamspaceId: string;
  feBeEnabled: boolean;
  epicEnabled: boolean;
  storyEnabled: boolean;
  priorityEnabled: boolean;
  sprintEnabled: boolean;
  dueDateEnabled: boolean;
}

export interface EpicSummary {
  id: number;
  name: string;
  color: string;
}

export interface EpicResponse {
  id: number;
  name: string;
  color: string;
  description: string | null;
  createdAt: string;
  createdBy: BacklogUser;
}

export interface StorySummary {
  id: number;
  number: number;
  title: string;
  status: StoryStatus;
  priority: Priority | null;
  issueType: IssueType | null;
  sprint: string | null;
  epics: EpicSummary[];
  assignee: BacklogUser | null;
  reporter: BacklogUser;
  taskCount: number;
  completedTaskCount: number;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskResponse {
  id: number;
  title: string;
  issueType: IssueType | null;
  isCompleted: boolean;
  assignee: BacklogUser | null;
  position: number;
  createdAt: string;
}

export interface StoryDetail extends StorySummary {
  body: string | null;
  closedAt: string | null;
  tasks: TaskResponse[];
}

export interface StoryStatusResponse {
  id: number;
  status: StoryStatus;
  closedAt: string | null;
}

export interface ReorderResponse {
  orderedIds: number[];
}
```

### WebSocket 이벤트 타입

```ts
// backlog:init (직접 수신자에게만 전송)
export interface BacklogInitEvent {
  type: 'backlog:init';
  config: BacklogConfigResponse;
  epics: EpicResponse[];
  stories: StorySummary[];
}

// 브로드캐스트 이벤트 (직접 수행한 사람은 수신 안 함)
export interface BacklogConfigUpdatedEvent {
  type: 'backlog:config_updated';
  actorId: string;
  config: BacklogConfigResponse;
}
export interface EpicCreatedEvent {
  type: 'epic:created';
  actorId: string;
  epic: EpicResponse;
}
export interface EpicUpdatedEvent {
  type: 'epic:updated';
  actorId: string;
  epic: EpicResponse;
}
export interface EpicDeletedEvent {
  type: 'epic:deleted';
  actorId: string;
  epicId: number;
}
export interface StoryCreatedEvent {
  type: 'story:created';
  actorId: string;
  story: StorySummary;
}
export interface StoryUpdatedEvent {
  type: 'story:updated';
  actorId: string;
  story: StorySummary;
}
export interface StoryStatusChangedEvent {
  type: 'story:status_changed';
  actorId: string;
  storyId: number;
  status: StoryStatus;
  closedAt: string | null;
}
export interface StoryReorderedEvent {
  type: 'story:reordered';
  actorId: string;
  orderedIds: number[];
}
export interface StoryDeletedEvent {
  type: 'story:deleted';
  actorId: string;
  storyId: number;
}
export interface TaskCreatedEvent {
  type: 'task:created';
  actorId: string;
  storyId: number;
  task: TaskResponse;
}
export interface TaskUpdatedEvent {
  type: 'task:updated';
  actorId: string;
  storyId: number;
  task: TaskResponse;
}
export interface TaskCompletedEvent {
  type: 'task:completed';
  actorId: string;
  storyId: number;
  taskId: number;
  isCompleted: boolean;
}
export interface TaskReorderedEvent {
  type: 'task:reordered';
  actorId: string;
  storyId: number;
  orderedIds: number[];
}
export interface TaskDeletedEvent {
  type: 'task:deleted';
  actorId: string;
  storyId: number;
  taskId: number;
}

export interface BacklogSocketErrorEvent {
  event: 'error';
  code: string;
  message: string;
}

export type BacklogServerMessage =
  | BacklogInitEvent
  | BacklogConfigUpdatedEvent
  | EpicCreatedEvent
  | EpicUpdatedEvent
  | EpicDeletedEvent
  | StoryCreatedEvent
  | StoryUpdatedEvent
  | StoryStatusChangedEvent
  | StoryReorderedEvent
  | StoryDeletedEvent
  | TaskCreatedEvent
  | TaskUpdatedEvent
  | TaskCompletedEvent
  | TaskReorderedEvent
  | TaskDeletedEvent
  | BacklogSocketErrorEvent;
```

### 유틸 함수 (타입 파일 내 또는 별도 `src/utils/backlog.ts`)

```ts
// issueType + number → "FE-001" 또는 숫자 문자열
export function formatIssueId(
  issueType: IssueType | null,
  number: number,
  feBeEnabled: boolean
): string {
  if (!feBeEnabled || !issueType) return String(number);
  return `${issueType}-${String(number).padStart(3, '0')}`;
}
```

---

## 2. `src/api/backlog.ts`

`apiClient`를 그대로 사용. 응답은 `GlobalResponse<T>` 구조이므로 `.data.data`로 접근.

### Config API

```ts
getBacklogConfig(teamspaceId: string): Promise<BacklogConfigResponse>
  → GET /api/teamspaces/{teamspaceId}/backlog/config

saveBacklogConfig(
  teamspaceId: string,
  config: Omit<BacklogConfigResponse, 'teamspaceId'>
): Promise<BacklogConfigResponse>
  → PUT /api/teamspaces/{teamspaceId}/backlog/config
```

### Epic API

```ts
getEpics(teamspaceId: string): Promise<EpicResponse[]>
  → GET /api/teamspaces/{teamspaceId}/epics

createEpic(teamspaceId: string, body: { name: string; color: string; description?: string }): Promise<EpicResponse>
  → POST /api/teamspaces/{teamspaceId}/epics

updateEpic(teamspaceId: string, epicId: number, body: { name: string; color: string; description?: string }): Promise<EpicResponse>
  → PUT /api/teamspaces/{teamspaceId}/epics/{epicId}

deleteEpic(teamspaceId: string, epicId: number): Promise<void>
  → DELETE /api/teamspaces/{teamspaceId}/epics/{epicId}
```

### Story API

```ts
getStories(teamspaceId: string, params?: {
  status?: StoryStatus[];
  epicId?: number;
  assigneeId?: number;
  priority?: Priority;
}): Promise<StorySummary[]>
  → GET /api/teamspaces/{teamspaceId}/stories

getStoryDetail(teamspaceId: string, storyId: number): Promise<StoryDetail>
  → GET /api/teamspaces/{teamspaceId}/stories/{storyId}

createStory(teamspaceId: string, body: CreateStoryRequest): Promise<StoryDetail>
  → POST /api/teamspaces/{teamspaceId}/stories

updateStory(teamspaceId: string, storyId: number, body: CreateStoryRequest): Promise<StoryDetail>
  → PUT /api/teamspaces/{teamspaceId}/stories/{storyId}

updateStoryStatus(teamspaceId: string, storyId: number, status: StoryStatus): Promise<StoryStatusResponse>
  → PATCH /api/teamspaces/{teamspaceId}/stories/{storyId}/status

reorderStories(teamspaceId: string, orderedIds: number[]): Promise<ReorderResponse>
  → PATCH /api/teamspaces/{teamspaceId}/stories/reorder

deleteStory(teamspaceId: string, storyId: number): Promise<void>
  → DELETE /api/teamspaces/{teamspaceId}/stories/{storyId}
```

`CreateStoryRequest` 타입도 `src/types/backlog.ts`에 정의:

```ts
export interface CreateStoryRequest {
  title: string;
  body?: string;
  priority?: Priority | null;
  issueType?: IssueType | null;
  sprint?: string | null;
  epicIds?: number[];
  assigneeId?: number | null;
  dueDate?: string | null;
}
```

### Task API

```ts
createTask(teamspaceId: string, storyId: number, body: {
  title: string;
  issueType?: IssueType | null;
  assigneeId?: number | null;
}): Promise<TaskResponse>
  → POST /api/teamspaces/{teamspaceId}/stories/{storyId}/tasks

updateTask(teamspaceId: string, storyId: number, taskId: number, body: {
  title: string;
  issueType?: IssueType | null;
  assigneeId?: number | null;
}): Promise<TaskResponse>
  → PUT /api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/{taskId}

toggleTaskComplete(teamspaceId: string, storyId: number, taskId: number): Promise<{ id: number; isCompleted: boolean }>
  → PATCH /api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/{taskId}/complete

reorderTasks(teamspaceId: string, storyId: number, orderedIds: number[]): Promise<ReorderResponse>
  → PATCH /api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/reorder

deleteTask(teamspaceId: string, storyId: number, taskId: number): Promise<void>
  → DELETE /api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/{taskId}
```

---

## 구현 주의사항

- `getStories`에서 `status` 파라미터는 반복 가능한 쿼리 파라미터임.  
  axios에서는 `params: { status: ['OPEN', 'IN_PROGRESS'] }` + `paramsSerializer` 설정 또는 `URLSearchParams` 직접 사용 필요.  
  `apiClient`에 `paramsSerializer`가 없으므로 `URLSearchParams`로 직접 구성 권장.
- 모든 함수는 `try/catch` 없이 에러를 그대로 throw — apiClient의 response interceptor가 toast를 표시하고, 호출 컴포넌트에서 필요 시 catch.

- 날짜 필드(`dueDate`, `createdAt`, `updatedAt` 등)는 서버가 문자열로 주므로 string 그대로 유지. 파싱은 표시 시점에만.

---

## 작업 로그

| 날짜       | 내용                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-05-26 | 작업 시작 및 완료. `src/types/backlog.ts`, `src/api/backlog.ts`, `src/utils/backlog.ts` 생성. `src/api/`, `src/utils/` 디렉토리 신규 생성. |
