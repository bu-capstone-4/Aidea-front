import { useState, useRef, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import type {
  StoryStatus,
  Priority,
  IssueType,
  BacklogConfigResponse,
  EpicResponse,
  StoryDetail,
  CreateStoryRequest,
} from '@/types/backlog';
import type { MemberInfo } from '@/types/api';
import UserAvatar from '@/components/ui/UserAvatar';

interface StoryFormModalProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CreateStoryRequest & { status: StoryStatus }> & { id?: number };
  defaultStatus?: StoryStatus;
  config: BacklogConfigResponse;
  epics: EpicResponse[];
  members: MemberInfo[];
  onSave: (data: CreateStoryRequest & { status?: StoryStatus }) => Promise<StoryDetail>;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: StoryStatus; label: string }[] = [
  { value: 'OPEN', label: '할 일' },
  { value: 'IN_PROGRESS', label: '진행 중' },
  { value: 'DONE', label: '완료' },
  { value: 'CLOSED', label: '종료' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'LOW', label: '낮음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HIGH', label: '높음' },
  { value: 'URGENT', label: '긴급' },
];

const ISSUE_TYPE_OPTIONS: { value: IssueType; label: string }[] = [
  { value: 'FE', label: 'FE' },
  { value: 'BE', label: 'BE' },
];

export default function StoryFormModal({
  mode,
  initialData,
  defaultStatus,
  config,
  epics,
  members,
  onSave,
  onClose,
}: StoryFormModalProps) {
  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    body: initialData?.body ?? '',
    status: initialData?.status ?? defaultStatus ?? ('OPEN' as StoryStatus),
    priority: initialData?.priority ?? (null as Priority | null),
    issueType: initialData?.issueType ?? (null as IssueType | null),
    sprint: initialData?.sprint ?? '',
    epicIds: initialData?.epicIds ?? ([] as number[]),
    assigneeId: initialData?.assigneeId ?? (null as number | null),
    dueDate: initialData?.dueDate ?? '',
  });

  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [epicPopoverOpen, setEpicPopoverOpen] = useState(false);
  const epicPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (epicPopoverRef.current && !epicPopoverRef.current.contains(e.target as Node)) {
        setEpicPopoverOpen(false);
      }
    }
    if (epicPopoverOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [epicPopoverOpen]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleEpic = (epicId: number) => {
    setForm((prev) => ({
      ...prev,
      epicIds: prev.epicIds.includes(epicId)
        ? prev.epicIds.filter((id) => id !== epicId)
        : [...prev.epicIds, epicId],
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setTitleError(true);
      return;
    }
    setLoading(true);
    try {
      const payload: CreateStoryRequest & { status?: StoryStatus } = {
        title: form.title.trim(),
        body: form.body || undefined,
        status: form.status,
        priority: form.priority,
        issueType: config.feBeEnabled ? form.issueType : undefined,
        sprint: config.sprintEnabled ? form.sprint || null : undefined,
        epicIds: config.epicEnabled ? form.epicIds : undefined,
        assigneeId: form.assigneeId,
        dueDate: config.dueDateEnabled ? form.dueDate || null : undefined,
      };
      await onSave(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const activeMembers = members.filter((m) => m.status === 'ACTIVE' && m.userId !== null);
  const selectedEpicNames = epics
    .filter((e) => form.epicIds.includes(e.id))
    .map((e) => e.name)
    .join(', ');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-[560px] max-w-[96vw] max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-ink">
            {mode === 'create' ? '이슈 추가' : '이슈 수정'}
          </h2>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors"
            aria-label="닫기"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* 폼 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {/* 제목 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-ink-muted">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value);
                if (titleError) setTitleError(false);
              }}
              placeholder="이슈 제목을 입력하세요"
              className={`w-full rounded border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary transition-colors ${
                titleError ? 'border-red-400 focus:ring-red-400' : 'border-border'
              }`}
            />
            {titleError && <p className="text-xs text-red-500">제목을 입력해주세요.</p>}
          </div>

          {/* 상태 */}
          <FormRow label="상태">
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as StoryStatus)}
              className="rounded border border-border px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary bg-white"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormRow>

          {/* 에픽 (epicEnabled) */}
          {config.epicEnabled && epics.length > 0 && (
            <FormRow label="에픽">
              <div className="relative" ref={epicPopoverRef}>
                <button
                  type="button"
                  onClick={() => setEpicPopoverOpen((v) => !v)}
                  className="rounded border border-border px-2 py-1.5 text-sm bg-white min-w-[140px] text-left truncate max-w-[220px] outline-none hover:border-primary transition-colors"
                >
                  {selectedEpicNames || '에픽 선택'}
                </button>
                {epicPopoverOpen && (
                  <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-border rounded-lg shadow-lg z-10 py-1 max-h-48 overflow-y-auto">
                    {epics.map((epic) => (
                      <label
                        key={epic.id}
                        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-surface text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.epicIds.includes(epic.id)}
                          onChange={() => toggleEpic(epic.id)}
                          className="accent-primary"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: epic.color }}
                        />
                        <span className="truncate">{epic.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </FormRow>
          )}

          {/* 이슈 유형 (feBeEnabled) */}
          {config.feBeEnabled && (
            <FormRow label="이슈 유형">
              <div className="flex items-center gap-2">
                {ISSUE_TYPE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set('issueType', form.issueType === o.value ? null : o.value)}
                    className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
                      form.issueType === o.value
                        ? o.value === 'FE'
                          ? 'bg-blue-50 border-blue-300 text-blue-600'
                          : 'bg-purple-50 border-purple-300 text-purple-600'
                        : 'border-border text-ink-muted hover:text-ink'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </FormRow>
          )}

          {/* 우선순위 (priorityEnabled) */}
          {config.priorityEnabled && (
            <FormRow label="우선순위">
              <select
                value={form.priority ?? ''}
                onChange={(e) =>
                  set('priority', e.target.value ? (e.target.value as Priority) : null)
                }
                className="rounded border border-border px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary bg-white"
              >
                <option value="">선택 안 함</option>
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FormRow>
          )}

          {/* 담당자 */}
          <FormRow label="담당자">
            <select
              value={form.assigneeId ?? ''}
              onChange={(e) => set('assigneeId', e.target.value ? Number(e.target.value) : null)}
              className="rounded border border-border px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary bg-white min-w-[140px]"
            >
              <option value="">미배정</option>
              {activeMembers.map((m) => (
                <option key={m.userId} value={m.userId!}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
            {form.assigneeId &&
              (() => {
                const member = activeMembers.find((m) => m.userId === form.assigneeId);
                return member ? (
                  <UserAvatar
                    name={member.name ?? member.email}
                    imageUrl={member.profileImageUrl}
                    size={24}
                  />
                ) : null;
              })()}
          </FormRow>

          {/* 스프린트 (sprintEnabled) */}
          {config.sprintEnabled && (
            <FormRow label="스프린트">
              <input
                value={form.sprint}
                onChange={(e) => set('sprint', e.target.value)}
                placeholder="Sprint 1"
                className="rounded border border-border px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary w-40"
              />
            </FormRow>
          )}

          {/* 마감일 (dueDateEnabled) */}
          {config.dueDateEnabled && (
            <FormRow label="마감일">
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
                className="rounded border border-border px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </FormRow>
          )}

          {/* 본문 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-ink-muted">본문</label>
            <textarea
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
              placeholder="이슈 내용을 입력하세요 (선택)"
              rows={4}
              className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-border text-ink text-sm font-medium hover:bg-surface transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="h-9 px-4 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-ink-muted w-20 shrink-0">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
