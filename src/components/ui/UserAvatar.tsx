interface UserAvatarProps {
  name: string;
  className?: string;
}

export default function UserAvatar({ name, className = '' }: UserAvatarProps) {
  const initial = name.trim().charAt(0);

  return (
    <div
      className={`rounded-full bg-primary size-8 flex items-center justify-center text-white font-semibold text-sm shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
}
