import { useState, useRef, useEffect } from 'react';
import { MdCheck, MdMoreVert } from 'react-icons/md';
import { useShallow } from 'zustand/react/shallow';
import type { TaskResponse, BacklogConfigResponse, BacklogTask } from '@/types/backlog';
import { useTaskApi } from '@/hooks/useTaskApi';
import { useBacklogTaskApi } from '@/hooks/useBacklogTaskApi';
import { useBacklogStore } from '@/store/backlogStore';
import UserAvatar from '@/components/ui/UserAvatar';
import IssueTypeTag from './IssueTypeTag';
import StatusBadge from './StatusBadge';

interface StoryDetailPanelProps {
  storyId: number;
  teamspaceId: string;
  tasks: TaskResponse[] | undefined;
  config: BacklogConfigResponse;
  onAddItemClick: () => void;
  onEditLinkedTask: (task: BacklogTask) => void;
}

export default function StoryDetailPanel({
  storyId,
  teamspaceId,
  tasks,
  config,
  onAddItemClick,
  onEditLinkedTask,
}: StoryDetailPanelProps) {
  const { handleUpdate, handleDelete } = useTaskApi(teamspaceId);
  const { handleDelete: handleDeleteBacklogTask } = useBacklogTaskApi(teamspaceId);

  const linkedTasks = useBacklogStore(
    useShallow((s) => s.backlogTasks.filter((t) => t.storyId === storyId))
  );

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [menuOpenKey, setMenuOpenKey] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingTaskId !== null) editInputRef.current?.focus();
  }, [editingTaskId]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenKey(null);
      }
    }
    if (menuOpenKey !== null) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpenKey]);

  const startEdit = (task: TaskResponse) => {
    setMenuOpenKey(null);
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
    setMenuOpenKey(null);
    if (!window.confirm(`"${title}" 태스크를 삭제하시겠습니까?`)) return;
    await handleDelete(storyId, taskId);
  };

  const confirmDeleteBacklogTask = async (task: BacklogTask) => {
    setMenuOpenKey(null);
    if (!window.confirm(`"${task.title}" 태스크를 삭제하시겠습니까?`)) return;
    await handleDeleteBacklogTask(task.id);
  };

  const toggleMenu = (key: string) => setMenuOpenKey((prev) => (prev === key ? null : key));

  return (
    <div className="border-t border-border/60 bg-surface/30">
      {tasks === undefined ? (
        <p className="text-xs text-ink-muted py-2 pl-14">태스크를 불러오는 중...</p>
      ) : (
        <>
          {tasks.length > 0 && (
            <ul className="flex flex-col">
              {tasks.map((task, index) => {
                const menuKey = `task-${task.id}`;
                const isMenuOpen = menuOpenKey === menuKey;
                return (
                  <li
                    key={task.id}
                    className="flex items-center gap-2.5 pl-10 pr-4 py-2 hover:bg-surface group border-b border-border/40 last:border-b-0"
                  >
                    <span className="w-4 text-xs text-ink-muted text-right shrink-0 select-none">
                      {index + 1}
                    </span>

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
                        className={`flex-1 text-sm truncate cursor-default ${
                          task.isCompleted ? 'line-through text-ink-muted' : 'text-ink'
                        }`}
                      >
                        <span className="text-ink-muted font-medium mr-1">[Task]</span>
                        {task.title}
                      </span>
                    )}

                    <div className="flex items-center gap-2 shrink-0 ml-auto">
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
                        <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
                          <button
                            onClick={() => toggleMenu(menuKey)}
                            className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-ink transition-all p-0.5 rounded"
                            aria-label="더보기"
                          >
                            <MdMoreVert size={16} />
                          </button>
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-24 bg-white rounded-lg shadow-lg border border-border z-20 py-1">
                              <button
                                onClick={() => startEdit(task)}
                                className="w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-surface"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => confirmDelete(task.id, task.title)}
                                className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {linkedTasks.length > 0 && (
            <ul className="flex flex-col border-t border-border/40">
              {linkedTasks.map((task: BacklogTask) => {
                const menuKey = `bt-${task.id}`;
                const isMenuOpen = menuOpenKey === menuKey;
                return (
                  <li
                    key={menuKey}
                    className="flex items-center gap-2.5 pl-10 pr-4 py-2 hover:bg-surface group border-b border-border/40 last:border-b-0"
                  >
                    {config.feBeEnabled && task.issueType ? (
                      <IssueTypeTag issueType={task.issueType} number={task.number} />
                    ) : (
                      <span className="w-4 text-xs text-ink-muted text-right shrink-0 select-none">
                        #{task.number}
                      </span>
                    )}

                    <span
                      className={`flex-1 text-sm truncate ${
                        task.status === 'DONE' ? 'line-through text-ink-muted' : 'text-ink'
                      }`}
                    >
                      <span className="text-ink-muted font-medium mr-1">[Task]</span>
                      {task.title}
                    </span>

                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      <StatusBadge status={task.status} />
                      {task.assignee && (
                        <UserAvatar
                          name={task.assignee.name}
                          imageUrl={task.assignee.profileImageUrl}
                          size={20}
                        />
                      )}
                      <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
                        <button
                          onClick={() => toggleMenu(menuKey)}
                          className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-ink transition-all p-0.5 rounded"
                          aria-label="더보기"
                        >
                          <MdMoreVert size={16} />
                        </button>
                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 w-24 bg-white rounded-lg shadow-lg border border-border z-20 py-1">
                            <button
                              onClick={() => {
                                setMenuOpenKey(null);
                                onEditLinkedTask(task);
                              }}
                              className="w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-surface"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => confirmDeleteBacklogTask(task)}
                              className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            onClick={onAddItemClick}
            className="flex items-center gap-2 pl-14 pr-4 py-2 w-full text-left text-xs text-ink-muted hover:text-primary hover:bg-surface/50 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            <span>Add item</span>
          </button>
        </>
      )}
    </div>
  );
}
