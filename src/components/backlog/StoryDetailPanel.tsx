import { useState, useRef, useEffect } from 'react';
import { MdEdit, MdClose, MdCheck } from 'react-icons/md';
import type { TaskResponse, BacklogConfigResponse } from '@/types/backlog';
import { useTaskApi } from '@/hooks/useTaskApi';
import UserAvatar from '@/components/ui/UserAvatar';
import IssueTypeTag from './IssueTypeTag';

interface StoryDetailPanelProps {
  storyId: number;
  teamspaceId: string;
  tasks: TaskResponse[] | undefined;
  config: BacklogConfigResponse;
}

export default function StoryDetailPanel({
  storyId,
  teamspaceId,
  tasks,
  config,
}: StoryDetailPanelProps) {
  const { handleCreate, handleUpdate, handleToggle, handleDelete } = useTaskApi(teamspaceId);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const newTaskInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingTask) newTaskInputRef.current?.focus();
  }, [addingTask]);

  useEffect(() => {
    if (editingTaskId !== null) editInputRef.current?.focus();
  }, [editingTaskId]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await handleCreate(storyId, { title: newTaskTitle.trim() });
    setNewTaskTitle('');
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTask();
    if (e.key === 'Escape') {
      setNewTaskTitle('');
      setAddingTask(false);
    }
  };

  const startEdit = (task: TaskResponse) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const commitEdit = async (task: TaskResponse) => {
    const trimmed = editingTitle.trim();
    if (trimmed && trimmed !== task.title) {
      await handleUpdate(storyId, task.id, { title: trimmed, issueType: task.issueType });
    }
    setEditingTaskId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, task: TaskResponse) => {
    if (e.key === 'Enter') commitEdit(task);
    if (e.key === 'Escape') setEditingTaskId(null);
  };

  const confirmDelete = async (taskId: number, title: string) => {
    if (!window.confirm(`"${title}" 태스크를 삭제하시겠습니까?`)) return;
    await handleDelete(storyId, taskId);
  };

  return (
    <div className="px-4 py-2 bg-surface border-b border-border">
      {tasks === undefined ? (
        <p className="text-xs text-ink-muted py-1">태스크를 불러오는 중...</p>
      ) : (
        <>
          {tasks.length > 0 && (
            <ul className="flex flex-col">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white group"
                >
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => handleToggle(storyId, task.id)}
                    className="shrink-0 accent-primary cursor-pointer"
                  />

                  {config.feBeEnabled && task.issueType && (
                    <IssueTypeTag issueType={task.issueType} number={0} />
                  )}

                  {editingTaskId === task.id ? (
                    <input
                      ref={editInputRef}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => commitEdit(task)}
                      onKeyDown={(e) => handleEditKeyDown(e, task)}
                      className="flex-1 text-sm outline-none border-b border-primary bg-transparent"
                    />
                  ) : (
                    <span
                      className={`flex-1 text-sm ${task.isCompleted ? 'line-through text-ink-muted' : 'text-ink'}`}
                    >
                      {task.title}
                    </span>
                  )}

                  <div className="ml-auto flex items-center gap-1 shrink-0">
                    {task.assignee && (
                      <UserAvatar
                        name={task.assignee.name}
                        imageUrl={task.assignee.profileImageUrl}
                        size={20}
                      />
                    )}
                    {editingTaskId === task.id ? (
                      <button
                        onClick={() => commitEdit(task)}
                        className="text-green-500 hover:text-green-600 p-0.5 rounded"
                        aria-label="저장"
                      >
                        <MdCheck size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(task)}
                        className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-ink p-0.5 rounded transition-all"
                        aria-label="수정"
                      >
                        <MdEdit size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => confirmDelete(task.id, task.title)}
                      className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-red-500 p-0.5 rounded transition-all"
                      aria-label="삭제"
                    >
                      <MdClose size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* 태스크 추가 */}
          {addingTask ? (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-3.5 shrink-0" />
              <input
                ref={newTaskInputRef}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleAddKeyDown}
                placeholder="태스크 추가..."
                className="flex-1 text-sm outline-none border-b border-primary bg-transparent"
              />
              <button
                onClick={handleAddTask}
                className="text-xs text-primary hover:text-primary-dark font-medium shrink-0"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setNewTaskTitle('');
                  setAddingTask(false);
                }}
                className="text-ink-muted hover:text-ink shrink-0"
                aria-label="취소"
              >
                <MdClose size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingTask(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-ink-muted hover:text-ink transition-colors"
            >
              + 태스크 추가
            </button>
          )}
        </>
      )}
    </div>
  );
}
