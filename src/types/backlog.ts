export type StoryStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type IssueType = 'FE' | 'BE';

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
  number: number;
  name: string;
  color: string;
  description: string | null;
  status: StoryStatus;
  priority: Priority | null;
  issueType: IssueType | null;
  assignee: BacklogUser | null;
  reporter: BacklogUser;
  dueDate: string | null;
  position: number;
  storyCount: number;
  completedStoryCount: number;
  createdAt: string;
  updatedAt: string;
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
  linkedTasks: BacklogTask[];
}

export interface StoryStatusResponse {
  id: number;
  status: StoryStatus;
  closedAt: string | null;
}

export interface ReorderResponse {
  orderedIds: number[];
}

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

// ── 최상위 태스크 (백로그 직접 항목) ─────────────────────────────

export interface BacklogTask {
  id: number;
  number: number;
  title: string;
  status: StoryStatus;
  priority: Priority | null;
  issueType: IssueType | null;
  sprint: string | null;
  assignee: BacklogUser | null;
  reporter: BacklogUser;
  dueDate: string | null;
  position: number;
  storyId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBacklogTaskRequest {
  title: string;
  priority?: Priority | null;
  issueType?: IssueType | null;
  sprint?: string | null;
  assigneeId?: number | null;
  dueDate?: string | null;
  storyId?: number | null;
}

export interface CreateEpicRequest {
  name: string;
  color: string;
  description?: string;
  priority?: Priority | null;
  issueType?: IssueType | null;
  assigneeId?: number | null;
  dueDate?: string | null;
}

// ── WebSocket 이벤트 타입 ──────────────────────────────────────

export interface BacklogOnlineEditor {
  id: string;
  name: string;
  profileImageUrl: string | null;
}

export interface BacklogInitEvent {
  type: 'backlog:init';
  config: BacklogConfigResponse;
  epics: EpicResponse[];
  stories: StorySummary[];
  tasks: BacklogTask[];
  onlineEditors?: BacklogOnlineEditor[];
}

export interface BacklogPresenceEvent {
  type: 'backlog:presence';
  onlineEditors: BacklogOnlineEditor[];
}

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
export interface EpicStatusChangedEvent {
  type: 'epic:status_changed';
  actorId: string;
  epicId: number;
  status: StoryStatus;
}
export interface EpicReorderedEvent {
  type: 'epic:reordered';
  actorId: string;
  orderedIds: number[];
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

// ── 최상위 태스크 WS 이벤트 ───────────────────────────────────

export interface BacklogtaskCreatedEvent {
  type: 'backlogtask:created';
  actorId: string;
  task: BacklogTask;
}
export interface BacklogtaskUpdatedEvent {
  type: 'backlogtask:updated';
  actorId: string;
  task: BacklogTask;
}
export interface BacklogtaskStatusChangedEvent {
  type: 'backlogtask:status_changed';
  actorId: string;
  taskId: number;
  status: StoryStatus;
}
export interface BacklogtaskReorderedEvent {
  type: 'backlogtask:reordered';
  actorId: string;
  orderedIds: number[];
}
export interface BacklogtaskDeletedEvent {
  type: 'backlogtask:deleted';
  actorId: string;
  taskId: number;
}
export interface BacklogtaskStoryChangedEvent {
  type: 'backlogtask:story_changed';
  actorId: string;
  taskId: number;
  storyId: number | null;
}

export type BacklogSocketErrorCode =
  | 'INSUFFICIENT_PERMISSION'
  | 'DOCUMENT_NOT_FOUND'
  | 'INVALID_MESSAGE'
  | 'INTERNAL_SERVER_ERROR'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED';

export interface BacklogSocketErrorEvent {
  event: 'error';
  code: BacklogSocketErrorCode | string;
  message: string;
}

export type BacklogServerMessage =
  | BacklogInitEvent
  | BacklogPresenceEvent
  | BacklogConfigUpdatedEvent
  | EpicCreatedEvent
  | EpicUpdatedEvent
  | EpicDeletedEvent
  | EpicStatusChangedEvent
  | EpicReorderedEvent
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
  | BacklogtaskCreatedEvent
  | BacklogtaskUpdatedEvent
  | BacklogtaskStatusChangedEvent
  | BacklogtaskReorderedEvent
  | BacklogtaskDeletedEvent
  | BacklogtaskStoryChangedEvent
  | BacklogSocketErrorEvent;
