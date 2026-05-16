import UserAvatar from './UserAvatar';
import { cn } from '@/shared/cn';
import type { ActiveMember } from '@/types/teamspaceSocket';

interface OnlineMemberStackProps {
  members: ActiveMember[];
  currentDocumentId: string | null;
  currentUserId?: number;
  max?: number;
}

function sortMembers(
  members: ActiveMember[],
  currentDocumentId: string | null,
  currentUserId?: number
) {
  return [...members].sort((a, b) => {
    const aIsMe = currentUserId !== undefined && a.userId === currentUserId;
    const bIsMe = currentUserId !== undefined && b.userId === currentUserId;
    if (aIsMe !== bIsMe) return aIsMe ? -1 : 1;

    const aIsSameDocument = aIsMe || a.currentDocumentId === currentDocumentId;
    const bIsSameDocument = bIsMe || b.currentDocumentId === currentDocumentId;
    if (aIsSameDocument !== bIsSameDocument) return aIsSameDocument ? -1 : 1;

    return a.userId - b.userId;
  });
}

export default function OnlineMemberStack({
  members,
  currentDocumentId,
  currentUserId,
  max = 6,
}: OnlineMemberStackProps) {
  const orderedMembers = sortMembers(members, currentDocumentId, currentUserId);
  const visibleMembers = orderedMembers.slice(0, max);
  const overflow = orderedMembers.length - visibleMembers.length;

  if (!visibleMembers.length) return null;

  return (
    <div className="flex items-center">
      {visibleMembers.map((member, index) => {
        const isMe = currentUserId !== undefined && member.userId === currentUserId;
        const isSameDocument = isMe || member.currentDocumentId === currentDocumentId;

        return (
          <div
            key={member.userId}
            title={isSameDocument ? `${member.name} - 현재 문서` : `${member.name} - 다른 문서`}
            className={cn(
              'rounded-full ring-2 ring-white',
              !isSameDocument && 'grayscale opacity-45'
            )}
            style={{
              marginLeft: index === 0 ? 0 : -10,
              zIndex: visibleMembers.length - index,
            }}
          >
            <UserAvatar name={member.name} imageUrl={member.profileImageUrl} size={32} />
          </div>
        );
      })}

      {overflow > 0 && (
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-bold text-gray-600 shadow-sm"
          style={{ marginLeft: -10, zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
