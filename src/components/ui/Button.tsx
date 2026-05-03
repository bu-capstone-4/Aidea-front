import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'feedback';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'bg-white text-ink border border-border hover:bg-surface',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface',
  dark: 'bg-ink text-white hover:opacity-90',
  feedback: 'bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
  icon: 'size-8 p-0 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-semibold transition-colors',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    >
      {icon}
      {size !== 'icon' && children}
    </button>
  );
}
