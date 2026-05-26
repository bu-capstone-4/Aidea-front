import { useParams } from 'react-router';
import Button from '@/components/ui/Button';
import OnlineMemberStack from '@/components/ui/OnlineMemberStack';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import { useTeamspaceDetail } from '@/hooks/useTeamspaceDetail';
import { useDocument } from '@/hooks/useDocument';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getDocLabel } from '@/components/CreateTeamSpace/types';

interface MainHeaderBarProps {
  onBacklogClick?: () => void;
}

export default function MainHeaderBar({ onBacklogClick }: MainHeaderBarProps) {
  const { docId } = useParams();
  const { currentTeamspaceId, onlineMembers } = useTeamspaceStore();
  const { teamspace } = useTeamspaceDetail(currentTeamspaceId);
  const { doc } = useDocument(docId);
  const { user } = useCurrentUser();

  const breadcrumb = [teamspace?.name, doc ? getDocLabel(doc.type) : undefined]
    .filter(Boolean)
    .join(' / ');

  return (
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
        <Button variant="secondary" size="sm" onClick={onBacklogClick}>
          백로그
        </Button>
        <Button variant="dark" size="sm">
          ↑ 내보내기
        </Button>
      </div>
    </header>
  );
}
