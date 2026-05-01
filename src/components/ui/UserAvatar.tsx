const AVATAR_COLORS = [
  '#4F86F7', // blue
  '#52B788', // green
  '#9B72CF', // purple
  '#F4845F', // orange
  '#E07BAA', // pink
  '#2EC4B6', // teal
  '#E63946', // red
  '#F9C74F', // yellow
];

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface UserAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export default function UserAvatar({ name, size = 32, className = '' }: UserAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase();
  const bg = nameToColor(name);

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: bg }}
    >
      {initial}
    </div>
  );
}
