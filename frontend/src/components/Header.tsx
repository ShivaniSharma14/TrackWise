import { Search, Bell, Settings, Menu } from 'lucide-react';
import { PageHeader } from './ui';

interface HeaderProps {
  title: string;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  userEmail?: string;
  onMobileMenuToggle: () => void;
  onSettingsClick: () => void;
}

export default function Header({
  title,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  userEmail = 'svshivani2k5@gmail.com',
  onMobileMenuToggle,
  onSettingsClick,
}: HeaderProps) {
  return (
    <header className="w-full h-14 sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-border-subtle flex justify-between items-center px-4 md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-md hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <Menu size={18} />
        </button>
        <div className="hidden md:block min-w-0">
          <PageHeader title={title} headingLevel={2} className="!mt-0" />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1 justify-end md:flex-initial">
        <div className="relative w-40 md:w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full input-field pl-9 py-1.5 text-sm"
          />
        </div>

        <button
          onClick={() => console.info('[TrackWise:notifications] All notifications up to date')}
          className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-container-high transition-colors cursor-pointer relative"
        >
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>

        <button
          onClick={onSettingsClick}
          className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
          aria-label="Open settings"
        >
          <Settings size={16} />
        </button>

        <div className="hidden lg:flex items-center gap-2.5 pl-3 ml-1 border-l border-border-subtle">
          <div className="text-right">
            <p className="text-xs font-medium text-text-primary leading-tight">Shivani</p>
            <p className="text-[11px] text-text-muted leading-none truncate max-w-[140px]">{userEmail}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-surface-container-high overflow-hidden shrink-0 ring-1 ring-border-subtle">
            <img
              alt="User profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2agBzVfg9m8vmOH1kWbWMwOcd7dpjOyVo7i5C4hJ3AsORb6U5cvRBP6gZjEsP40eK_yuuTsCLNkGgtpNBcfwrmsHsEDnYlcH0tN9vUQcOh130CH_1trcREBghzO4tmnZvT8sk5-vWpW7aKzocj5Clv7iuWm2GGKkvzOcA9ypHq9P5e2rhdrd029FhIIeuLADkTHxgI3hZCjuH7SFw5QSBNWaFV7Otk-SdF3v1UXeVx9UyfFFysfs9g_yNeX38M5b39zjgIJCTEfiJ"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
