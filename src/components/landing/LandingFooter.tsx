import { Link } from 'react-router';

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-white px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 no-underline">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
            <span className="text-xs font-bold text-white">A</span>
          </div>
          <span className="text-sm font-bold text-ink">aidea</span>
        </Link>

        {/* Copyright */}
        <p className="text-sm text-ink-muted">© 2025 Aidea. All rights reserved.</p>
      </div>
    </footer>
  );
}
