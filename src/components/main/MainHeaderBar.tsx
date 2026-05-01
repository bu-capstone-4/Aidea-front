import { useParams } from 'react-router';
import Button from '@/components/ui/Button';
import AvatarStack from '@/components/ui/AvatarStack';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import { useTeamspaceDetail } from '@/hooks/useTeamspaceDetail';
import { useDocument } from '@/hooks/useDocument';

export default function MainHeaderBar() {
  const { docId } = useParams();
  const { currentTeamspaceId } = useTeamspaceStore();
  const { teamspace } = useTeamspaceDetail(currentTeamspaceId);
  const { doc } = useDocument(docId);

  const breadcrumb = [teamspace?.name, doc?.title].filter(Boolean).join(' / ');

  return (
    <header className="flex justify-between p-4 h-14">
      <div className="flex items-center gap-4">
        <span className="text-ink-muted text-sm">{breadcrumb || '...'}</span>
      </div>
      <div className="flex items-center gap-4">
        <AvatarStack members={teamspace?.members ?? []} />
        <Button variant="dark" size="sm">
          ↑ 내보내기
        </Button>
      </div>
    </header>
  );
}
