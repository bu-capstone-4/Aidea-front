import UserAvatar from './UserAvatar';
import type { MemberInfo } from '@/types/api';

interface AvatarStackProps {
  members: MemberInfo[];
  max?: number;
  size?: number;
}

export default function AvatarStack({ members, max = 5, size = 32 }: AvatarStackProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;

  return (
    <div className="flex items-center">
      {visible.map((member, i) => (
        <div
          key={member.email}
          title={member.name ?? member.email}
          style={{ zIndex: visible.length - i, marginLeft: i === 0 ? 0 : -size * 0.35 }}
          className="rounded-full ring-2 ring-white"
        >
          <UserAvatar name={member.name ?? member.email} size={size} />
        </div>
      ))}

      {overflow > 0 && (
        <div
          className="rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-gray-600 font-semibold shrink-0"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.35,
            marginLeft: -size * 0.35,
            zIndex: 0,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
