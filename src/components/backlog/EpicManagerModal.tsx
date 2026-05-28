import { useState } from 'react';
import { MdClose, MdEdit, MdDelete, MdCheck } from 'react-icons/md';
import { useShallow } from 'zustand/react/shallow';
import type { EpicResponse, BacklogConfigResponse } from '@/types/backlog';
import { createEpic, updateEpic, deleteEpic } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import { useToastStore } from '@/store/toastStore';
import type { MemberInfo } from '@/types/api';
import StatusBadge from './StatusBadge';

const EPIC_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#06b6d4',
  '#78716c',
  '#6b7280',
];

export interface EpicManagerModalProps {
  teamspaceId: string;
  epics: EpicResponse[];
  config: BacklogConfigResponse;
  members: MemberInfo[];
  onClose: () => void;
}

interface EpicFormState {
  name: string;
  color: string;
  description: string;
}

const defaultForm = (): EpicFormState => ({
  name: '',
  color: EPIC_COLORS[0],
  description: '',
});

export default function EpicManagerModal({ teamspaceId, epics, onClose }: EpicManagerModalProps) {
  const { applyEpicCreated, applyEpicUpdated, applyEpicDeleted } = useBacklogStore(
    useShallow((s) => ({
      applyEpicCreated: s.applyEpicCreated,
      applyEpicUpdated: s.applyEpicUpdated,
      applyEpicDeleted: s.applyEpicDeleted,
    }))
  );
  const addToast = useToastStore((s) => s.addToast);

  const [creatingForm, setCreatingForm] = useState<EpicFormState | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EpicFormState>(defaultForm());
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingId(null);
    setCreatingForm(defaultForm());
  };

  const handleCreate = async () => {
    if (!creatingForm || !creatingForm.name.trim()) return;
    setSaving(true);
    try {
      const epic = await createEpic(teamspaceId, {
        name: creatingForm.name.trim(),
        color: creatingForm.color,
        description: creatingForm.description.trim() || undefined,
      });
      applyEpicCreated(epic);
      setCreatingForm(null);
    } catch {
      addToast({ type: 'error', message: '에픽 생성에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (epic: EpicResponse) => {
    setCreatingForm(null);
    setEditingId(epic.id);
    setEditForm({
      name: epic.name,
      color: epic.color,
      description: epic.description ?? '',
    });
  };

  const handleUpdate = async () => {
    if (editingId === null || !editForm.name.trim()) return;
    setSaving(true);
    try {
      const epic = await updateEpic(teamspaceId, editingId, {
        name: editForm.name.trim(),
        color: editForm.color,
        description: editForm.description.trim() || undefined,
      });
      applyEpicUpdated(epic);
      setEditingId(null);
    } catch {
      addToast({ type: 'error', message: '에픽 수정에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (epic: EpicResponse) => {
    if (
      !window.confirm(
        `"${epic.name}" 에픽을 삭제하면 연결된 스토리에서 에픽이 제거됩니다. 삭제할까요?`
      )
    )
      return;
    try {
      await deleteEpic(teamspaceId, epic.id);
      applyEpicDeleted(epic.id);
      if (editingId === epic.id) setEditingId(null);
    } catch {
      addToast({ type: 'error', message: '에픽 삭제에 실패했습니다.' });
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-[520px] max-w-[96vw] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-ink">에픽 관리</h2>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors"
            aria-label="닫기"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {/* 에픽 추가 버튼 */}
          {!creatingForm && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary-dark transition-colors w-fit"
            >
              + 에픽 추가
            </button>
          )}

          {/* 생성 인라인 폼 */}
          {creatingForm && (
            <EpicInlineForm
              form={creatingForm}
              onChange={setCreatingForm}
              onSave={handleCreate}
              onCancel={() => setCreatingForm(null)}
              saving={saving}
            />
          )}

          {/* 에픽 목록 */}
          {epics.length === 0 && !creatingForm && (
            <p className="text-sm text-ink-muted py-2">아직 에픽이 없습니다.</p>
          )}

          {epics.map((epic) => (
            <div key={epic.id}>
              {editingId === epic.id ? (
                <EpicInlineForm
                  form={editForm}
                  onChange={setEditForm}
                  onSave={handleUpdate}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              ) : (
                <div className="flex items-center gap-3 py-2 group">
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: epic.color }}
                  />
                  <span className="text-sm text-ink font-medium truncate min-w-0 flex-1">
                    {epic.name}
                  </span>
                  {/* 상태 배지 */}
                  <div className="shrink-0">
                    <StatusBadge status={epic.status} />
                  </div>
                  {/* 스토리 진행 */}
                  {epic.storyCount > 0 && (
                    <span className="text-xs text-ink-muted shrink-0">
                      {epic.completedStoryCount}/{epic.storyCount}
                    </span>
                  )}
                  {epic.description && (
                    <span className="text-xs text-ink-muted truncate max-w-[100px] shrink-0">
                      {epic.description}
                    </span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleOpenEdit(epic)}
                      className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface transition-colors"
                      aria-label="수정"
                    >
                      <MdEdit size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(epic)}
                      className="p-1 rounded text-ink-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label="삭제"
                    >
                      <MdDelete size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end px-5 py-3 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-border text-ink text-sm font-medium hover:bg-surface transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

interface EpicInlineFormProps {
  form: EpicFormState;
  onChange: (form: EpicFormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function EpicInlineForm({ form, onChange, onSave, onCancel, saving }: EpicInlineFormProps) {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-surface">
      {/* 이름 + 설명 */}
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="에픽 이름"
          className="flex-1 rounded border border-border px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="설명 (선택)"
          className="w-32 rounded border border-border px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* 색상 팔레트 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {EPIC_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange({ ...form, color })}
            className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: form.color === color ? '#1a1a1a' : 'transparent',
            }}
            aria-label={color}
          />
        ))}
      </div>

      {/* 버튼 */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="h-7 px-3 rounded border border-border text-xs text-ink-muted hover:text-ink transition-colors"
        >
          취소
        </button>
        <button
          onClick={onSave}
          disabled={saving || !form.name.trim()}
          className="h-7 px-3 rounded bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-1"
        >
          <MdCheck size={13} />
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
