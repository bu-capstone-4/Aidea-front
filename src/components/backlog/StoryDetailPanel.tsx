import { useState, useRef, useEffect } from 'react';
import { MdCheck, MdMoreVert } from 'react-icons/md';
import { useShallow } from 'zustand/react/shallow';
import type { TaskResponse, BacklogConfigResponse, BacklogTask } from '@/types/backlog';
import { useTaskApi } from '@/hooks/useTaskApi';
import { useBacklogTaskApi } from '@/hooks/useBacklogTaskApi';
import { useBacklogStore } from '@/store/backlogStore';
import { PRIORITY_LABEL, PRIORITY_TEXT_CLASS } from '@/constants/backlog';
import type { ColWidths } from '@/constants/backlog';
import UserAvatar from '@/components/ui/UserAvatar';
import IssueTypeTag from './IssueTypeTag';
import StatusBadge from './StatusBadge';

function formatDueDate(dueDate: string): string {
  const raw = dueDate as unknown;
  if (Array.isArray(raw)) {
    const [, month, day] = raw as [number, number, number];
    return `${month}/${day}`;
  }
  let s: string;
  if (raw instanceof Date) {
    s = raw.toISOString();
  } else if (typeof raw === 'number') {
    s = new Date(raw).toISOString();
  } else {
    s = String(raw);
  }
  const parts = s.split('T')[0].split('-');
  if (parts.length < 3) return '-';
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

interface StoryDetailPanelProps {
  storyId: number;
  teamspaceId: string;
  tasks: TaskResponse[] | undefined;
  config: BacklogConfigResponse;
  colWidths: ColWidths;
  onAddItemClick: () => void;
  onEditLinkedTask: (task: BacklogTask) => void;
}

export default function StoryDetailPanel({
  storyId,
  teamspaceId,
  tasks,
  config,
  colWidths,
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
  const [dropUp, setDropUp] = useState(false);
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

  const toggleMenu = (key: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (menuOpenKey !== key) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 80);
    }
    setMenuOpenKey((prev) => (prev === key ? null : key));
  };

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
                    className="flex items-center hover:bg-surface group border-b border-border/40 last:border-b-0"
                  >
                    {/* Title column */}
                    <div className="flex-1 flex items-center gap-2.5 pl-10 pr-3 py-2 min-w-0 overflow-hidden">
                      <span className="w-4 text-xs text-ink-muted text-right shrink-0 select-none">
                        {index + 1}
                      </span>

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
                    </div>

                    {/* Assignees column */}
                    <div
                      className={`${colWidths.assignees} px-3 flex items-center justify-center shrink-0 self-stretch`}
                    >
                      {task.assignee ? (
                        <UserAvatar
                          name={task.assignee.name}
                          imageUrl={task.assignee.profileImageUrl}
                          githubLogin={task.assignee.githubLogin}
                          size={20}
                        />
                      ) : (
                        <span className="text-xs text-ink-muted">-</span>
                      )}
                    </div>

                    {/* Status column */}
                    <div
                      className={`${colWidths.status} px-3  flex items-center justify-center shrink-0 self-stretch`}
                    >
                      {task.isCompleted ? (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                          완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                          할 일
                        </span>
                      )}
                    </div>

                    {/* IssueType column */}
                    {config.feBeEnabled && (
                      <div
                        className={`${colWidths.issueType} px-3 flex items-center justify-center shrink-0 self-stretch`}
                      >
                        {task.issueType ? (
                          <IssueTypeTag issueType={task.issueType} number={0} />
                        ) : (
                          <span className="text-xs text-ink-muted">-</span>
                        )}
                      </div>
                    )}

                    {/* Priority column - TaskResponse has no priority */}
                    {config.priorityEnabled && (
                      <div className={`${colWidths.priority} px-3  shrink-0 self-stretch`} />
                    )}

                    {/* Sprint column - TaskResponse has no sprint */}
                    {config.sprintEnabled && (
                      <div className={`${colWidths.sprint} px-3  shrink-0 self-stretch`} />
                    )}

                    {/* DueDate column - TaskResponse has no dueDate */}
                    {config.dueDateEnabled && (
                      <div className={`${colWidths.dueDate} px-3  shrink-0 self-stretch`} />
                    )}

                    {/* More menu */}
                    <div className="w-8 flex items-center justify-center shrink-0">
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
                            onClick={(e) => toggleMenu(menuKey, e)}
                            className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-ink transition-all p-0.5 rounded"
                            aria-label="더보기"
                          >
                            <MdMoreVert size={16} />
                          </button>
                          {isMenuOpen && (
                            <div
                              className={`absolute right-0 w-24 bg-white rounded-lg shadow-lg border border-border z-20 py-1 ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                            >
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
                    className="flex items-center hover:bg-surface group border-b border-border/40 last:border-b-0"
                  >
                    {/* Title column */}
                    <div className="flex-1 flex items-center gap-2.5 pl-10 pr-3 py-2 min-w-0 overflow-hidden">
                      <span className="w-4 text-xs text-ink-muted text-right shrink-0 select-none">
                        #{task.number}
                      </span>

                      <span
                        className={`flex-1 text-sm truncate ${
                          task.status === 'DONE' ? 'line-through text-ink-muted' : 'text-ink'
                        }`}
                      >
                        <span className="text-ink-muted font-medium mr-1">[Task]</span>
                        {task.title}
                      </span>
                    </div>

                    {/* Assignees column */}
                    <div
                      className={`${colWidths.assignees} px-3  flex items-center justify-center shrink-0 self-stretch`}
                    >
                      {task.assignee ? (
                        <UserAvatar
                          name={task.assignee.name}
                          imageUrl={task.assignee.profileImageUrl}
                          githubLogin={task.assignee.githubLogin}
                          size={20}
                        />
                      ) : (
                        <span className="text-xs text-ink-muted">-</span>
                      )}
                    </div>

                    {/* Status column */}
                    <div
                      className={`${colWidths.status} px-3  flex items-center justify-center shrink-0 self-stretch`}
                    >
                      <StatusBadge status={task.status} />
                    </div>

                    {/* IssueType column */}
                    {config.feBeEnabled && (
                      <div
                        className={`${colWidths.issueType} px-3 flex items-center justify-center shrink-0 self-stretch`}
                      >
                        {task.issueType ? (
                          <IssueTypeTag issueType={task.issueType} number={task.number} />
                        ) : (
                          <span className="text-xs text-ink-muted">-</span>
                        )}
                      </div>
                    )}

                    {/* Priority column */}
                    {config.priorityEnabled && (
                      <div
                        className={`${colWidths.priority} px-3  flex items-center justify-center shrink-0 self-stretch`}
                      >
                        {task.priority ? (
                          <span
                            className={`text-xs font-medium ${PRIORITY_TEXT_CLASS[task.priority]}`}
                          >
                            {PRIORITY_LABEL[task.priority]}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted">-</span>
                        )}
                      </div>
                    )}

                    {/* Sprint column */}
                    {config.sprintEnabled && (
                      <div
                        className={`${colWidths.sprint} px-3  flex items-center justify-center shrink-0 self-stretch`}
                      >
                        {task.sprint ? (
                          <span className="text-xs text-ink truncate">{task.sprint}</span>
                        ) : (
                          <span className="text-xs text-ink-muted">-</span>
                        )}
                      </div>
                    )}

                    {/* DueDate column */}
                    {config.dueDateEnabled && (
                      <div
                        className={`${colWidths.dueDate} px-3  flex items-center justify-center shrink-0 self-stretch`}
                      >
                        {task.dueDate ? (
                          <span className="text-xs text-ink">{formatDueDate(task.dueDate)}</span>
                        ) : (
                          <span className="text-xs text-ink-muted">-</span>
                        )}
                      </div>
                    )}

                    {/* More menu */}
                    <div className="w-8 flex items-center justify-center shrink-0">
                      <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
                        <button
                          onClick={(e) => toggleMenu(menuKey, e)}
                          className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-ink transition-all p-0.5 rounded"
                          aria-label="더보기"
                        >
                          <MdMoreVert size={16} />
                        </button>
                        {isMenuOpen && (
                          <div
                            className={`absolute right-0 w-24 bg-white rounded-lg shadow-lg border border-border z-20 py-1 ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                          >
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
