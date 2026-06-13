import { useState, useRef, useEffect } from 'react';
import type { TeamRole } from '@/types/document';
import { ROLE_LABELS } from '@/constants/teamRole';

interface MemberRoleSelectProps {
  value: TeamRole;
  onChange: (role: TeamRole) => void;
  disabled?: boolean;
}

const ROLE_OPTIONS: TeamRole[] = ['OWNER', 'MEMBER', 'VIEWER'];

export default function MemberRoleSelect({ value, onChange, disabled }: MemberRoleSelectProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded border border-border px-2 py-1 text-sm bg-white text-left outline-none hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-ink">{ROLE_LABELS[value]}</span>
        <svg
          className="ml-auto shrink-0 text-ink-muted"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-border rounded-lg shadow-lg z-20 flex flex-col overflow-hidden py-1">
          {ROLE_OPTIONS.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => {
                setOpen(false);
                if (role !== value) onChange(role);
              }}
              className={`w-full px-3 py-1.5 text-sm text-left hover:bg-surface transition-colors ${
                role === value ? 'text-primary font-medium' : 'text-ink'
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
