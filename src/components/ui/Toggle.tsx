import { cn } from '@/shared/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'w-10 h-6 rounded-full transition-colors shrink-0',
        checked ? 'bg-primary' : 'bg-border',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'block w-4 h-4 rounded-full bg-white shadow transition-transform mx-1',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  );
}
