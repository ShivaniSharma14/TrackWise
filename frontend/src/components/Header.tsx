import { Menu, Search, Sparkles } from 'lucide-react';

interface HeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  userEmail?: string;
  userName?: string;
  isDemo?: boolean;
  showSearch?: boolean;
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export default function Header({
  searchValue,
  onSearchChange,
  userEmail = '',
  userName = '',
  isDemo = false,
  showSearch = false,
  onMobileMenuToggle,
  isMobileMenuOpen,
}: HeaderProps) {
  const displayName = userName || (isDemo ? 'Demo workspace' : 'TrackWise user');
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <header className="app-topbar sticky top-0 z-40 flex w-full items-center justify-between border-b border-border-subtle bg-background/85 px-4 backdrop-blur-xl md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="icon-button -ml-2 md:hidden"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          <Menu size={19} />
        </button>
        <div className="flex min-w-0 items-center gap-2.5 md:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold text-primary ring-1 ring-primary/20">
            T
          </span>
          <span className="truncate text-sm font-semibold tracking-tight text-text-primary">TrackWise</span>
        </div>
        <p className="eyebrow hidden md:block">TRACKWISE / WORKSPACE</p>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2 md:gap-3">
        {showSearch && (
          <div className="relative w-36 sm:w-52 lg:w-64">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              placeholder="Search expenses"
              aria-label="Search expenses"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              className="input-field py-2 pl-9 pr-3"
            />
          </div>
        )}

        <div className="hidden min-w-0 items-center gap-2.5 border-l border-border-subtle pl-3 sm:flex">
          <div className="min-w-0 text-right">
            <p className="max-w-[140px] truncate text-xs font-medium leading-tight text-text-primary">{displayName}</p>
            <p className="mt-1 max-w-[170px] truncate text-[11px] leading-none text-text-muted">{isDemo ? 'Sample data' : userEmail}</p>
          </div>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-border-subtle ${
              isDemo ? 'bg-amber-400/15 text-amber-200' : 'bg-surface-container-high text-text-secondary'
            }`}
            aria-hidden="true"
          >
            {initials || <Sparkles size={14} />}
          </div>
        </div>
      </div>
    </header>
  );
}
