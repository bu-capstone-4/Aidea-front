import { useBacklogStore } from '@/store/backlogStore';
import { createStory, updateStory, updateStoryStatus, deleteStory } from '@/api/backlog';
import type { CreateStoryRequest, StoryDetail, StoryStatus } from '@/types/backlog';
import { toStorySummary } from '@/utils/backlog';

export function useStoryApi(teamspaceId: string) {
  const applyStoryCreated = useBacklogStore((s) => s.applyStoryCreated);
  const applyStoryUpdated = useBacklogStore((s) => s.applyStoryUpdated);
  const applyStoryStatusChanged = useBacklogStore((s) => s.applyStoryStatusChanged);
  const applyStoryDeleted = useBacklogStore((s) => s.applyStoryDeleted);

  const handleCreate = async (
    data: CreateStoryRequest & { status?: StoryStatus }
  ): Promise<StoryDetail> => {
    const { status, ...rest } = data;
    const story = await createStory(teamspaceId, rest);
    applyStoryCreated(toStorySummary(story));
    if (status && status !== 'OPEN') {
      const statusRes = await updateStoryStatus(teamspaceId, story.id, status);
      applyStoryStatusChanged(story.id, statusRes.status, statusRes.closedAt);
    }
    return story;
  };

  const handleUpdate = async (id: number, data: CreateStoryRequest): Promise<StoryDetail> => {
    const story = await updateStory(teamspaceId, id, data);
    applyStoryUpdated(toStorySummary(story));
    return story;
  };

  const handleDelete = async (id: number): Promise<void> => {
    await deleteStory(teamspaceId, id);
    applyStoryDeleted(id);
  };

  return { handleCreate, handleUpdate, handleDelete };
}
