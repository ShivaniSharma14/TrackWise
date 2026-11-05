import { LayoutDashboard, CheckSquare, Receipt, BarChart3, LogOut } from 'lucide-react';
import { TabType } from '../types';
import { NavItem } from './ui';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogoutClick: () => void;
  isDemo?: boolean;
}

export default function Sidebar({ currentTab, onTabChange, onLogoutClick, isDemo = false }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'habits' as TabType, label: 'Habits', icon: CheckSquare },
    { id: 'expenses' as TabType, label: 'Expenses', icon: Receipt },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="app-sidebar fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-border-subtle bg-surface-container-lowest/90 backdrop-blur-xl md:flex">
      <div className="px-6 pt-7 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-base font-bold text-primary ring-1 ring-primary/20">
            T
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-text-primary">TrackWise</h1>
            <p className="mt-0.5 text-[11px] text-text-muted">{isDemo ? 'Sample workspace' : 'Your daily rhythm'}</p>
          </div>
        </div>
      </div>

      <p className="px-6 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">Workspace</p>
      <nav className="flex-1 flex flex-col gap-1 px-4">
        {menuItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={currentTab === item.id}
            onClick={() => onTabChange(item.id)}
          />
        ))}
      </nav>

      <div className="px-4 py-5 space-y-2 border-t border-border-subtle">
        {isDemo && (
          <p className="px-3 py-3 mb-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] text-xs leading-relaxed text-amber-100/80">
            Changes stay in this temporary sample workspace.
          </p>
        )}
        <div className="pt-3">
          <NavItem icon={LogOut} label={isDemo ? 'Exit demo' : 'Log out'} variant="danger" onClick={onLogoutClick} />
        </div>
      </div>
    </aside>
  );
}
