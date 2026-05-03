interface TeamSpaceAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = {
  sm: 'size-6 text-xs',
  md: 'size-8 text-sm',
  lg: 'size-10 text-base',
};

export default function TeamSpaceAvatar({
  name,
  size = 'md',
  className = '',
}: TeamSpaceAvatarProps) {
  const initial = name.trim().charAt(0);

  return (
    <div
      className={`rounded-md bg-primary flex items-center justify-center text-white font-bold shrink-0 ${sizeClass[size]} ${className}`}
    >
      {initial}
    </div>
  );
}
