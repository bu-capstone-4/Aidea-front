import { useState } from 'react';
import { MdClose } from 'react-icons/md';
import type {
  StoryStatus,
  Priority,
  IssueType,
  BacklogConfigResponse,
  EpicResponse,
  CreateEpicRequest,
} from '@/types/backlog';
import type { MemberInfo } from '@/types/api';
import UserAvatar from '@/components/ui/UserAvatar';

interface EpicFormModalProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CreateEpicRequest & { status: StoryStatus }> & { id?: number };
  defaultStatus?: StoryStatus;
  config: BacklogConfigResponse;
  members: MemberInfo[];
  onSave: (data: CreateEpicRequest & { status?: StoryStatus }) => Promise<EpicResponse>;
  onClose: () => void;
}

const EPIC_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#06b6d4',
  '#64748b',
  '#ef4444',
  '#84cc16',
];

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

export default function EpicFormModal({
  mode,
  initialData,
  defaultStatus,
  config,
  members,
  onSave,
  onClose,
}: EpicFormModalProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    color: initialData?.color ?? EPIC_COLORS[0],
    description: initialData?.description ?? '',
    status: initialData?.status ?? defaultStatus ?? ('OPEN' as StoryStatus),
    priority: initialData?.priority ?? (null as Priority | null),
    issueType: initialData?.issueType ?? (null as IssueType | null),
    assigneeId: initialData?.assigneeId ?? (null as number | null),
    dueDate: initialData?.dueDate ?? '',
  });

  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      setNameError(true);
      return;
    }
    setLoading(true);
    try {
      const payload: CreateEpicRequest & { status?: StoryStatus } = {
        name: form.name.trim(),
        color: form.color,
        description: form.description || undefined,
        status: form.status,
        priority: config.priorityEnabled ? form.priority : undefined,
        issueType: config.feBeEnabled ? form.issueType : undefined,
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-[520px] max-w-[96vw] max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: form.color }}
            />
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
              에픽
            </span>
            <h2 className="text-base font-bold text-ink">
              {mode === 'create' ? '에픽 추가' : '에픽 수정'}
            </h2>
          </div>
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
          {/* 에픽 이름 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-ink-muted">
              에픽 이름 <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => {
                set('name', e.target.value);
                if (nameError) setNameError(false);
              }}
              placeholder="에픽 이름을 입력하세요"
              className={`w-full rounded border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary transition-colors ${
                nameError ? 'border-red-400 focus:ring-red-400' : 'border-border'
              }`}
            />
            {nameError && <p className="text-xs text-red-500">에픽 이름을 입력해주세요.</p>}
          </div>

          {/* 색상 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-ink-muted">색상</label>
            <div className="flex flex-wrap gap-2">
              {EPIC_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                    form.color === c ? 'ring-2 ring-offset-1 ring-ink' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* 설명 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-ink-muted">설명</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="에픽에 대한 설명을 입력하세요 (선택)"
              rows={3}
              className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
            />
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
