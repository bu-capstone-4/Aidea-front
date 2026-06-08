import { useState, useRef, useEffect } from 'react';
import type { MemberInfo } from '@/types/api';
import UserAvatar from '@/components/ui/UserAvatar';

interface AssigneeSelectProps {
  value: number | null;
  members: MemberInfo[];
  onChange: (assigneeId: number | null) => void;
}

export default function AssigneeSelect({ value, members, onChange }: AssigneeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const activeMembers = members;
  const selected = activeMembers.find((m) => m.userId === value) ?? null;

  const filtered = activeMembers.filter((m) => {
    const q = search.toLowerCase();
    return (m.name ?? '').toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded border border-border px-2 py-1.5 text-sm bg-white min-w-[160px] text-left outline-none hover:border-primary transition-colors"
      >
        {selected ? (
          <>
            <UserAvatar
              name={selected.name ?? selected.email}
              imageUrl={selected.profileImageUrl}
              size={20}
            />
            <span className="truncate text-ink">{selected.name ?? selected.email}</span>
          </>
        ) : (
          <span className="text-ink-muted">미배정</span>
        )}
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
        <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-border rounded-lg shadow-lg z-20 flex flex-col overflow-hidden">
          <div className="px-2 pt-2 pb-1">
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="멤버 검색"
              className="w-full rounded border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="overflow-y-auto max-h-48 py-1">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
                setSearch('');
              }}
              className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-surface transition-colors ${value === null ? 'bg-primary/5 text-primary font-medium' : 'text-ink-muted'}`}
            >
              <span className="w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center shrink-0 text-xs text-ink-muted">
                -
              </span>
              <span>미배정</span>
            </button>
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-ink-muted">검색 결과가 없습니다.</p>
            )}
            {filtered.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => {
                  onChange(m.userId!);
                  setOpen(false);
                  setSearch('');
                }}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-surface transition-colors ${value === m.userId ? 'bg-primary/5' : ''}`}
              >
                <UserAvatar name={m.name ?? m.email} imageUrl={m.profileImageUrl} size={20} />
                <div className="flex flex-col min-w-0">
                  <span
                    className={`truncate text-xs font-medium ${value === m.userId ? 'text-primary' : 'text-ink'}`}
                  >
                    {m.name ?? m.email}
                  </span>
                  {m.name && <span className="truncate text-xs text-ink-muted">{m.email}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
