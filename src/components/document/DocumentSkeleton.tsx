const PARAGRAPH_LINE_WIDTHS = [
  ['w-full', 'w-5/6', 'w-4/6'],
  ['w-full', 'w-11/12', 'w-3/4', 'w-2/3'],
  ['w-full', 'w-4/5', 'w-3/5'],
];

export default function DocumentSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-8 pt-1">
      <span className="sr-only">문서를 불러오는 중…</span>
      <div className="h-6 w-1/2 rounded-md bg-surface animate-pulse" />
      {PARAGRAPH_LINE_WIDTHS.map((lineWidths, paragraphIndex) => (
        <div key={paragraphIndex} className="flex flex-col gap-3">
          {lineWidths.map((width, lineIndex) => (
            <div key={lineIndex} className={`h-4 ${width} rounded bg-surface animate-pulse`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DocumentTitleSkeleton() {
  return <div className="h-10 max-md:h-8 w-1/3 rounded-md bg-surface animate-pulse" />;
}
