import { useBacklogStore } from '@/store/backlogStore';
import { createTask, updateTask, toggleTaskComplete, deleteTask } from '@/api/backlog';
import type { IssueType, TaskResponse } from '@/types/backlog';

export function useTaskApi(teamspaceId: string) {
  const applyTaskCreated = useBacklogStore((s) => s.applyTaskCreated);
  const applyTaskUpdated = useBacklogStore((s) => s.applyTaskUpdated);
  const applyTaskCompleted = useBacklogStore((s) => s.applyTaskCompleted);
  const applyTaskDeleted = useBacklogStore((s) => s.applyTaskDeleted);

  const handleCreate = async (
    storyId: number,
    body: { title: string; issueType?: IssueType | null; assigneeId?: number | null }
  ): Promise<TaskResponse> => {
    const task = await createTask(teamspaceId, storyId, body);
    applyTaskCreated(storyId, task);
    return task;
  };

  const handleUpdate = async (
    storyId: number,
    taskId: number,
    body: { title: string; issueType?: IssueType | null; assigneeId?: number | null }
  ): Promise<TaskResponse> => {
    const task = await updateTask(teamspaceId, storyId, taskId, body);
    applyTaskUpdated(storyId, task);
    return task;
  };

  const handleToggle = async (storyId: number, taskId: number): Promise<void> => {
    const res = await toggleTaskComplete(teamspaceId, storyId, taskId);
    applyTaskCompleted(storyId, taskId, res.isCompleted);
  };

  const handleDelete = async (storyId: number, taskId: number): Promise<void> => {
    await deleteTask(teamspaceId, storyId, taskId);
    applyTaskDeleted(storyId, taskId);
  };

  return { handleCreate, handleUpdate, handleToggle, handleDelete };
}
