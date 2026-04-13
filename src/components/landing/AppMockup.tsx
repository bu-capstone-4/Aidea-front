const NAV_ITEMS = ['아이디어', '기획서', '유저 시나리오', 'API 명세서'];

const SKELETON_ROWS = [
  { opacity: 'opacity-40', width: 'w-full' },
  { opacity: 'opacity-30', width: 'w-4/5' },
  { opacity: 'opacity-30', width: 'w-5/6' },
  { opacity: 'opacity-20', width: 'w-2/3' },
  { opacity: 'opacity-20', width: 'w-3/4' },
];

export default function AppMockup() {
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-border text-left shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <div className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto max-w-48 flex-1 rounded border border-border bg-white px-3 py-1 text-center text-xs text-ink-muted">
          aidea.app/workspace
        </div>
      </div>

      {/* App shell */}
      <div className="flex h-72 bg-white">
        {/* Sidebar */}
        <aside className="flex w-40 flex-col gap-0.5 border-r border-border bg-sidebar p-3">
          {/* Workspace */}
          <div className="mb-2 flex items-center gap-2 px-2 py-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary">
              <span className="text-xs font-bold text-white">G</span>
            </div>
            <span className="text-sm font-semibold text-ink">팀 스페이스</span>
          </div>

          {/* Nav items */}
          {NAV_ITEMS.map((item, i) => (
            <div
              key={item}
              className={`rounded-md px-2 py-1.5 ${i === 0 ? 'bg-primary-light' : ''}`}
            >
              <span
                className={`text-xs font-semibold ${i === 0 ? 'text-primary-dark' : 'text-ink'}`}
              >
                {item}
              </span>
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden p-8">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <h3 className="text-2xl font-bold text-ink">아이디어</h3>
            <span className="rounded-md bg-ai-bg px-2 py-1 text-xs font-semibold text-ai">
              ✦ AI 피드백
            </span>
          </div>

          {/* Skeleton content */}
          <div className="flex flex-col gap-2.5">
            {SKELETON_ROWS.map(({ opacity, width }, i) => (
              <div key={i} className={`h-3 rounded bg-border ${opacity} ${width}`} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
