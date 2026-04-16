import { Link } from 'react-router';
import Button from '@/components/ui/Button';

const NAV_LINKS = [
  { label: '기능', href: '#features' },
  { label: '워크플로우', href: '#workflow' },
];

export default function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 no-underline">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="text-base font-bold text-ink">aidea</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="text-base text-ink-muted no-underline transition-colors hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            로그인
          </Button>
          <Button size="sm">무료로 시작하기</Button>
        </div>
      </div>
    </header>
  );
}
