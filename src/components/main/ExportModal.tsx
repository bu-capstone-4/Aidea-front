import { useState } from 'react';
import Button from '@/components/ui/Button';
import type { ExportFormat } from '@/shared/exportDocument';

interface ExportModalProps {
  open: boolean;
  currentDocumentTitle?: string;
  onClose: () => void;
  onExport: (formats: ExportFormat[]) => void;
}

export default function ExportModal({
  open,
  currentDocumentTitle,
  onClose,
  onExport,
}: ExportModalProps) {
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(['md']);

  if (!open) return null;

  const canExport = selectedFormats.length > 0;
  const documentTitle = currentDocumentTitle?.trim() || '현재 문서';

  const toggleFormat = (format: ExportFormat) => {
    setSelectedFormats((prev) =>
      prev.includes(format) ? prev.filter((item) => item !== format) : [...prev, format]
    );
  };

  const handleExport = () => {
    if (!canExport) return;
    onExport(selectedFormats);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <section className="w-full max-w-sm rounded-xl border border-border bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink">문서 내보내기</h2>
            <p className="mt-1 text-sm text-ink-muted">
              현재 열려 있는 문서를 선택한 형식으로 다운로드합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xl leading-none text-ink-muted hover:bg-surface hover:text-ink"
            aria-label="내보내기 닫기"
          >
            ×
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-surface/60 px-3 py-2">
          <div className="text-xs font-semibold text-ink-muted">현재 문서</div>
          <div className="mt-1 truncate text-sm font-bold text-ink">{documentTitle}</div>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-bold text-ink">형식</legend>
          <div className="grid gap-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 hover:bg-surface">
              <input
                type="checkbox"
                checked={selectedFormats.includes('md')}
                onChange={() => toggleFormat('md')}
                className="size-4 accent-primary"
              />
              <span className="text-sm font-semibold text-ink">Markdown</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 hover:bg-surface">
              <input
                type="checkbox"
                checked={selectedFormats.includes('pdf')}
                onChange={() => toggleFormat('pdf')}
                className="size-4 accent-primary"
              />
              <span className="text-sm font-semibold text-ink">PDF</span>
            </label>
          </div>
        </fieldset>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button
            type="button"
            variant="dark"
            size="sm"
            onClick={handleExport}
            disabled={!canExport}
          >
            선택한 문서 내보내기
          </Button>
        </div>
      </section>
    </div>
  );
}
