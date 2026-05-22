import { useParams } from 'react-router';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import OnlineMemberStack from '@/components/ui/OnlineMemberStack';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import { useTeamspaceDetail } from '@/hooks/useTeamspaceDetail';
import { useDocument } from '@/hooks/useDocument';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getDocLabel } from '@/components/CreateTeamSpace/types';
import ExportModal from './ExportModal';
import { useDocumentEditorStore } from '@/store/documentEditorStore';
import {
  exportDocumentAsMarkdown,
  exportDocumentAsPdf,
  type ExportFormat,
} from '@/shared/exportDocument';

export default function MainHeaderBar() {
  const { docId } = useParams();
  const { currentTeamspaceId, onlineMembers } = useTeamspaceStore();
  const { teamspace } = useTeamspaceDetail(currentTeamspaceId);
  const { doc } = useDocument(docId);
  const { user } = useCurrentUser();
  const editor = useDocumentEditorStore((state) => state.editor);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const breadcrumb = [teamspace?.name, doc ? getDocLabel(doc.type) : undefined]
    .filter(Boolean)
    .join(' / ');

  const handleExport = (formats: ExportFormat[]) => {
    if (!editor) return;

    setIsExportModalOpen(false);

    if (formats.includes('md')) {
      exportDocumentAsMarkdown({ title: doc?.title, editor });
    }

    if (formats.includes('pdf')) {
      exportDocumentAsPdf({ title: doc?.title, editor });
    }
  };

  return (
    <>
      <header className="flex h-14 justify-between p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-muted">{breadcrumb || '...'}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1">
            <OnlineMemberStack
              members={onlineMembers}
              currentDocumentId={docId ?? null}
              currentUserId={user?.id}
            />
          </div>
          <Button variant="dark" size="sm" onClick={() => setIsExportModalOpen(true)}>
            ↑ 내보내기
          </Button>
        </div>
      </header>

      <ExportModal
        open={isExportModalOpen}
        currentDocumentTitle={doc?.title}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />
    </>
  );
}
