import { useBacklogStore } from '@/store/backlogStore';
import {
  createBacklogTask,
  updateBacklogTask,
  updateBacklogTaskStatus,
  updateBacklogTaskStory,
  deleteBacklogTask,
} from '@/api/backlog';
import type { BacklogTask, CreateBacklogTaskRequest, StoryStatus } from '@/types/backlog';

export function useBacklogTaskApi(teamspaceId: string) {
  const applyBacklogtaskCreated = useBacklogStore((s) => s.applyBacklogtaskCreated);
  const applyBacklogtaskUpdated = useBacklogStore((s) => s.applyBacklogtaskUpdated);
  const applyBacklogtaskStatusChanged = useBacklogStore((s) => s.applyBacklogtaskStatusChanged);
  const applyBacklogtaskDeleted = useBacklogStore((s) => s.applyBacklogtaskDeleted);
  const applyBacklogtaskStoryChanged = useBacklogStore((s) => s.applyBacklogtaskStoryChanged);

  const handleCreate = async (data: CreateBacklogTaskRequest): Promise<BacklogTask> => {
    const task = await createBacklogTask(teamspaceId, data);
    applyBacklogtaskCreated(task);
    return task;
  };

  const handleUpdate = async (
    taskId: number,
    data: CreateBacklogTaskRequest
  ): Promise<BacklogTask> => {
    const task = await updateBacklogTask(teamspaceId, taskId, data);
    applyBacklogtaskUpdated(task);
    return task;
  };

  const handleStatusChange = async (taskId: number, status: StoryStatus): Promise<void> => {
    await updateBacklogTaskStatus(teamspaceId, taskId, status);
    applyBacklogtaskStatusChanged(taskId, status);
  };

  const handleDelete = async (taskId: number): Promise<void> => {
    await deleteBacklogTask(teamspaceId, taskId);
    applyBacklogtaskDeleted(taskId);
  };

  const handleStoryLink = async (taskId: number, storyId: number | null): Promise<BacklogTask> => {
    const task = await updateBacklogTaskStory(teamspaceId, taskId, storyId);
    applyBacklogtaskStoryChanged(taskId, storyId);
    return task;
  };

  return { handleCreate, handleUpdate, handleStatusChange, handleDelete, handleStoryLink };
}
