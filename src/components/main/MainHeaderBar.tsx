import Button from '@/components/ui/Button';
import UserAvatar from '../ui/UserAvatar';

export default function MainHeaderBar() {
  return (
    <header className="flex justify-between p-4 h-14">
      <div className="flex items-center gap-4">
        <span className="text-ink-muted">해당 위치 경로</span>
      </div>
      <div className="flex items-center gap-4">
        <UserAvatar name="멤버" />
        <Button variant="dark" size="sm">
          ↑ 내보내기
        </Button>
      </div>
    </header>
  );
}
