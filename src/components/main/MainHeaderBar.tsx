import { useParams } from 'react-router';
import { useState } from 'react';
import { MdIosShare } from 'react-icons/md';
import Button from '@/components/ui/Button';
import OnlineMemberStack from '@/components/ui/OnlineMemberStack';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import { useTeamspaceDetail } from '@/hooks/useTeamspaceDetail';
import { useDocument } from '@/hooks/useDocument';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getDocLabel } from '@/components/CreateTeamSpace/types';
import ExportModal from './ExportModal';
import { useDocumentEditorStore } from '@/store/documentEditorStore';
import {
  exportDocumentAsMarkdown,
  exportDocumentAsPdf,
  type ExportFormat,
} from '@/shared/exportDocument';

const DESKTOP_MAX_VISIBLE_MEMBERS = 6;
const MOBILE_MAX_VISIBLE_MEMBERS = 2;

interface MainHeaderBarProps {
  onBacklogClick?: () => void;
}

export default function MainHeaderBar({ onBacklogClick }: MainHeaderBarProps) {
  const { docId } = useParams();
  const { currentTeamspaceId, onlineMembers } = useTeamspaceStore();
  const { teamspace } = useTeamspaceDetail(currentTeamspaceId);
  const { doc } = useDocument(docId);
  const { user } = useCurrentUser();
  const editor = useDocumentEditorStore((state) => state.editor);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const isMobile = useIsMobile();

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
      <header className="flex h-14 justify-between gap-3 p-4 max-md:gap-2 max-md:px-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="truncate text-sm text-ink-muted">{breadcrumb || '...'}</span>
        </div>
        <div className="flex shrink-0 items-center gap-4 max-md:gap-2">
          <div className="flex flex-col items-end gap-1">
            <OnlineMemberStack
              members={onlineMembers}
              currentDocumentId={docId ?? null}
              currentUserId={user?.id}
              max={isMobile ? MOBILE_MAX_VISIBLE_MEMBERS : DESKTOP_MAX_VISIBLE_MEMBERS}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="whitespace-nowrap"
            onClick={onBacklogClick}
          >
            백로그
          </Button>
          <Button
            variant="dark"
            size="sm"
            className="whitespace-nowrap max-md:gap-0 max-md:px-2"
            icon={<MdIosShare size={16} className="shrink-0" />}
            aria-label="내보내기"
            onClick={() => setIsExportModalOpen(true)}
          >
            <span className="max-md:hidden">내보내기</span>
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
