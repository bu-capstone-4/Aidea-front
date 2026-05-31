import { Link } from 'react-router';
import Button from '@/components/ui/Button';
import { useAuth } from '@/shared/useAuth';
import logo from '/favicon.svg';

const NAV_LINKS = [
  { label: '기능', href: '#features' },
  { label: '워크플로우', href: '#workflow' },
];

export default function LandingHeader() {
  const { login } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 no-underline">
          <img src={logo} alt="AIdea" className="h-8 w-auto" />
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
          <Button size="sm" onClick={login}>
            무료로 시작하기
          </Button>
        </div>
      </div>
    </header>
  );
}
