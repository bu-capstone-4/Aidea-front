import { create } from 'zustand';
import type {
  BacklogConfigResponse,
  EpicResponse,
  StorySummary,
  TaskResponse,
  StoryStatus,
} from '@/types/backlog';

interface BacklogState {
  isInitialized: boolean;
  config: BacklogConfigResponse | null;
  epics: EpicResponse[];
  stories: StorySummary[];
  tasksByStoryId: Record<number, TaskResponse[]>;
  expandedStoryId: number | null;
}

interface BacklogActions {
  applyInit: (
    config: BacklogConfigResponse,
    epics: EpicResponse[],
    stories: StorySummary[]
  ) => void;
  reset: () => void;

  applyConfigUpdated: (config: BacklogConfigResponse) => void;

  applyEpicCreated: (epic: EpicResponse) => void;
  applyEpicUpdated: (epic: EpicResponse) => void;
  applyEpicDeleted: (epicId: number) => void;

  applyStoryCreated: (story: StorySummary) => void;
  applyStoryUpdated: (story: StorySummary) => void;
  applyStoryStatusChanged: (storyId: number, status: StoryStatus, closedAt: string | null) => void;
  applyStoryReordered: (orderedIds: number[]) => void;
  applyStoryDeleted: (storyId: number) => void;

  setTasksForStory: (storyId: number, tasks: TaskResponse[]) => void;
  applyTaskCreated: (storyId: number, task: TaskResponse) => void;
  applyTaskUpdated: (storyId: number, task: TaskResponse) => void;
  applyTaskCompleted: (storyId: number, taskId: number, isCompleted: boolean) => void;
  applyTaskReordered: (storyId: number, orderedIds: number[]) => void;
  applyTaskDeleted: (storyId: number, taskId: number) => void;

  setExpandedStoryId: (id: number | null) => void;
}

const initialState: BacklogState = {
  isInitialized: false,
  config: null,
  epics: [],
  stories: [],
  tasksByStoryId: {},
  expandedStoryId: null,
};

export const useBacklogStore = create<BacklogState & BacklogActions>()((set) => ({
  ...initialState,

  applyInit: (config, epics, stories) => set({ config, epics, stories, isInitialized: true }),

  reset: () => set(initialState),

  applyConfigUpdated: (config) => set({ config }),

  applyEpicCreated: (epic) => set((state) => ({ epics: [...state.epics, epic] })),

  applyEpicUpdated: (epic) =>
    set((state) => ({
      epics: state.epics.map((e) => (e.id === epic.id ? epic : e)),
    })),

  applyEpicDeleted: (epicId) =>
    set((state) => ({
      epics: state.epics.filter((e) => e.id !== epicId),
      stories: state.stories.map((s) => ({
        ...s,
        epics: s.epics.filter((e) => e.id !== epicId),
      })),
    })),

  applyStoryCreated: (story) => set((state) => ({ stories: [...state.stories, story] })),

  applyStoryUpdated: (story) =>
    set((state) => ({
      stories: state.stories.map((s) => (s.id === story.id ? story : s)),
    })),

  applyStoryStatusChanged: (storyId, status) =>
    set((state) => ({
      stories: state.stories.map((s) => (s.id === storyId ? { ...s, status } : s)),
    })),

  applyStoryReordered: (orderedIds) =>
    set((state) => {
      const map = new Map(state.stories.map((s) => [s.id, s]));
      const reordered = orderedIds.flatMap((id) => {
        const s = map.get(id);
        return s ? [s] : [];
      });
      return { stories: reordered };
    }),

  applyStoryDeleted: (storyId) =>
    set((state) => ({
      stories: state.stories.filter((s) => s.id !== storyId),
    })),

  setTasksForStory: (storyId, tasks) =>
    set((state) => ({
      tasksByStoryId: { ...state.tasksByStoryId, [storyId]: tasks },
    })),

  applyTaskCreated: (storyId, task) =>
    set((state) => {
      const existing = state.tasksByStoryId[storyId];
      return {
        tasksByStoryId: {
          ...state.tasksByStoryId,
          [storyId]: existing ? [...existing, task] : [task],
        },
        stories: state.stories.map((s) =>
          s.id === storyId ? { ...s, taskCount: s.taskCount + 1 } : s
        ),
      };
    }),

  applyTaskUpdated: (storyId, task) =>
    set((state) => {
      const existing = state.tasksByStoryId[storyId];
      if (!existing) return state;
      return {
        tasksByStoryId: {
          ...state.tasksByStoryId,
          [storyId]: existing.map((t) => (t.id === task.id ? task : t)),
        },
      };
    }),

  applyTaskCompleted: (storyId, taskId, isCompleted) =>
    set((state) => {
      const tasks = state.tasksByStoryId[storyId];
      const updatedTasks = tasks
        ? tasks.map((t) => (t.id === taskId ? { ...t, isCompleted } : t))
        : undefined;

      const completedTaskCount = updatedTasks
        ? updatedTasks.filter((t) => t.isCompleted).length
        : null;

      return {
        tasksByStoryId: updatedTasks
          ? { ...state.tasksByStoryId, [storyId]: updatedTasks }
          : state.tasksByStoryId,
        stories:
          completedTaskCount !== null
            ? state.stories.map((s) => (s.id === storyId ? { ...s, completedTaskCount } : s))
            : state.stories,
      };
    }),

  applyTaskReordered: (storyId, orderedIds) =>
    set((state) => {
      const tasks = state.tasksByStoryId[storyId];
      if (!tasks) return state;
      const map = new Map(tasks.map((t) => [t.id, t]));
      const reordered = orderedIds.flatMap((id) => {
        const t = map.get(id);
        return t ? [t] : [];
      });
      return { tasksByStoryId: { ...state.tasksByStoryId, [storyId]: reordered } };
    }),

  applyTaskDeleted: (storyId, taskId) =>
    set((state) => {
      const existing = state.tasksByStoryId[storyId];
      return {
        tasksByStoryId: existing
          ? { ...state.tasksByStoryId, [storyId]: existing.filter((t) => t.id !== taskId) }
          : state.tasksByStoryId,
        stories: state.stories.map((s) =>
          s.id === storyId ? { ...s, taskCount: Math.max(0, s.taskCount - 1) } : s
        ),
      };
    }),

  setExpandedStoryId: (id) => set({ expandedStoryId: id }),
}));
