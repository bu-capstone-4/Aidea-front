import { Link } from 'react-router';
import logo from '/favicon.svg';

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-white px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 no-underline">
          <img src={logo} alt="AIdea" className="h-8 w-auto" />
        </Link>

        {/* Copyright */}
        <p className="text-sm text-ink-muted">© 2026 Aidea. All rights reserved.</p>
      </div>
    </footer>
  );
}
