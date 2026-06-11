import { useState } from 'react';
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

interface StoryFormModalProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CreateStoryRequest> & { id?: number };
  defaultStatus?: StoryStatus;
  config: BacklogConfigResponse;
  epics: EpicResponse[];
  members: MemberInfo[];
  onSave: (data: CreateStoryRequest) => Promise<StoryDetail>;
  onClose: () => void;
  onManageEpics?: () => void;
}

export default function StoryFormModal({
  mode,
  initialData,
  defaultStatus,
  config,
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

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      setTitleError(true);
      return;
    }
    setLoading(true);
    try {
      const payload: CreateStoryRequest = {
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
