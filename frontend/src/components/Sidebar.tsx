import { LayoutDashboard, CheckSquare, Receipt, BarChart3, Plus, HelpCircle, LogOut } from 'lucide-react';
import { TabType } from '../types';
import { NavItem } from './ui';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAddEntryClick: () => void;
  onLogoutClick: () => void;
}

export default function Sidebar({ currentTab, onTabChange, onAddEntryClick, onLogoutClick }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'habits' as TabType, label: 'Habits', icon: CheckSquare },
    { id: 'expenses' as TabType, label: 'Expenses', icon: Receipt },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-[240px] fixed left-0 top-0 bg-surface-container-lowest border-r border-border-subtle z-50">
      <div className="px-4 py-6">
        <h1 className="text-sm font-semibold text-text-primary tracking-tight">TrackWise</h1>
        <p className="text-xs text-text-muted mt-0.5">Habits & expenses</p>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-3">
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

      <div className="px-3 py-4 space-y-2 border-t border-border-subtle">
        <button onClick={() => onTabChange('add-expense')} className="w-full btn-primary">
          <Plus size={14} />
          Log expense
        </button>
        <button
          onClick={() => onTabChange('add-habit')}
          className={`w-full btn-secondary ${currentTab === 'add-habit' ? 'ring-1 ring-border-subtle' : ''}`}
        >
          <Plus size={14} />
          Add habit
        </button>

        <div className="pt-3 space-y-0.5">
          <NavItem
            icon={HelpCircle}
            label="Help"
            onClick={() => console.info('[TrackWise] Help requested — contact workspace support')}
          />
          <NavItem icon={LogOut} label="Log out" variant="danger" onClick={onLogoutClick} />
        </div>
      </div>
    </aside>
  );
}
