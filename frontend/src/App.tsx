import { useState, useEffect, useMemo, useCallback } from 'react';
import { Habit, Expense, ExpenseDashboardStats, ExpenseCreatePayload, TabType } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import HabitsView from './components/HabitsView';
import ExpensesView from './components/ExpensesView';
import AnalyticsView from './components/AnalyticsView';
import AddEntryModal from './components/AddEntryModal';
import AddExpenseView from './components/AddExpenseView';
import AddHabitView from './components/AddHabitView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import { api } from './api/client';
import { LayoutDashboard, CheckSquare, Receipt, BarChart3, Plus, LogOut, HelpCircle } from 'lucide-react';
import { Alert, NavItem } from './components/ui';

const MOBILE_NAV_ITEMS: Array<{ id: TabType; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
  { id: 'habits', label: 'Habits', icon: CheckSquare },
  { id: 'expenses', label: 'Ledger', icon: Receipt },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [searchValue, setSearchValue] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [authBootstrapError, setAuthBootstrapError] = useState<string | null>(null);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseStats, setExpenseStats] = useState<ExpenseDashboardStats | null>(null);

  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAuthenticated = authStatus === 'authenticated';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      console.info('[TrackWise:auth] App mount — validating session with backend');
      setAuthBootstrapError(null);
      const result = await api.initializeAuth();
      if (cancelled) return;
      setAuthStatus(result.ok ? 'authenticated' : 'unauthenticated');
      if (result.error) setAuthBootstrapError(result.error);
      console.info('[TrackWise:auth] App mount — authStatus:', result.ok ? 'authenticated' : 'unauthenticated');
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return api.onSessionInvalidated(() => {
      console.warn('[TrackWise:auth] Session invalidated — returning to login');
      setAuthStatus('unauthenticated');
      setHabits([]);
      setExpenses([]);
      setAuthBootstrapError('Your session expired. Please sign in again.');
    });
  }, []);

  const refreshAllData = useCallback(async () => {
    if (authStatus !== 'authenticated') {
      console.info('[TrackWise:auth] refreshAllData skipped — not authenticated');
      return;
    }

    console.info('[TrackWise:api] refreshAllData — fetching habits and expenses');
    try {
      const dbHabits = await api.getHabits();
      const dbExpenses = await api.getExpenses();
      setHabits(dbHabits);
      setExpenses(dbExpenses);
      console.info('[TrackWise:api] refreshAllData — success', {
        habits: dbHabits.length,
        expenses: dbExpenses.length,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown sync error';
      console.error('[TrackWise:api] refreshAllData — failed:', message);
    }
  }, [authStatus]);

  const fetchExpenseStats = useCallback(async () => {
    if (authStatus !== 'authenticated') {
      return;
    }
    try {
      const stats = await api.getExpenseDashboardStats();
      setExpenseStats(stats);
      console.info('[TrackWise:api] fetchExpenseStats — success');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      console.error('[TrackWise:api] fetchExpenseStats — failed:', message);
    }
  }, [authStatus]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      refreshAllData();
      fetchExpenseStats();
    }
  }, [currentTab, authStatus, refreshAllData, fetchExpenseStats]);

  const handleToggleHabit = useCallback(async (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const target = habits.find((h) => h.id === id);
    if (!target) return;

    try {
      await api.logHabit(id, todayStr, target.isCompletedToday ? 0 : 1, 'Toggle Completion via App Dashboard');
      await refreshAllData();
    } catch (e: any) {
      console.error('[TrackWise:api] logHabit failed:', e.message);
    }
  }, [habits, refreshAllData]);

  const handleSaveExpense = useCallback(async (payload: ExpenseCreatePayload) => {
    try {
      await api.createExpense(payload);
      await refreshAllData();
      await fetchExpenseStats();
    } catch (e: any) {
      throw new Error(e?.message || 'Failed to save expense');
    }
  }, [refreshAllData, fetchExpenseStats]);

  const handleSaveHabit = useCallback(async (newHabit: Omit<Habit, 'id' | 'history7d' | 'history' | 'streak'>) => {
    try {
      await api.createHabit(newHabit);
      await refreshAllData();
    } catch (e: any) {
      console.error('[TrackWise:api] createHabit failed:', e.message);
    }
  }, [refreshAllData]);

  const handleLogout = useCallback(() => {
    api.logout();
    setAuthStatus('unauthenticated');
    setHabits([]);
    setExpenses([]);
    setCurrentTab('dashboard');
  }, []);

  const handleNavigate = useCallback((tab: TabType) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  }, []);

  const headerTitle = useMemo(() => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'habits':
        return 'My Habits';
      case 'expenses':
        return 'Expenses';
      case 'analytics':
        return 'Habit Analytics';
      case 'add-expense':
        return 'Log expense';
      case 'add-habit':
        return 'Create Habit';
      // case 'settings':
      //   return 'Developer Integration Panel';
      // case 'auth':
      //   return 'Secure Authorization';
      default:
        return 'TrackWise';
    }
  }, [currentTab]);

  const pageContent = useMemo(() => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            habits={habits}
            expenses={expenses}
            onToggleHabit={handleToggleHabit}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            expenseStats={expenseStats}
          />
        );
      case 'habits':
        return (
          <HabitsView
            habits={habits}
            onToggleHabit={handleToggleHabit}
            onAddHabitClick={() => setCurrentTab('add-habit')}
            onRefresh={refreshAllData}
          />
        );
      case 'expenses':
        return (
          <ExpensesView
            expenses={expenses}
            stats={expenseStats}
            onAddExpenseClick={() => setCurrentTab('add-expense')}
            searchValue={searchValue}
          />
        );
      case 'analytics':
        return <AnalyticsView habits={habits} />;
      case 'add-expense':
        return (
          <AddExpenseView
            onSaveExpense={handleSaveExpense}
            onSuccessNavigate={() => setCurrentTab('expenses')}
          />
        );
      case 'add-habit':
        return (
          <AddHabitView
            onSaveHabit={handleSaveHabit}
            onSuccessNavigate={() => setCurrentTab('habits')}
          />
        );
      case 'settings':
        return <SettingsView />;
      case 'auth':
        return <AuthView />;
      default:
        return <DashboardView habits={habits} expenses={expenses} onToggleHabit={handleToggleHabit} onNavigateTab={(tab) => setCurrentTab(tab)} expenseStats={expenseStats} />;
    }
  }, [currentTab, habits, expenses, expenseStats, searchValue, handleSaveExpense, handleSaveHabit, handleToggleHabit, refreshAllData]);

  if (authStatus === 'checking') {
    return (
      <div className="bg-background min-h-screen flex flex-col justify-center items-center p-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-container text-primary text-lg">
            TW
          </div>
          <p className="text-sm text-text-muted">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-background min-h-screen flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1 mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-container text-sm font-semibold text-primary">
              TW
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-text-primary mt-3">TrackWise</h1>
            <p className="text-sm text-text-muted">Habits and expense tracking</p>
          </div>
          {authBootstrapError && (
            <Alert variant="error" className="text-center mx-auto max-w-sm">{authBootstrapError}</Alert>
          )}
          <AuthView
            onAuthSuccess={() => {
              if (!api.getAuth().isAuthenticated) {
                console.warn('[TrackWise:auth] onAuthSuccess fired but client is not authenticated');
                return;
              }
              setAuthStatus('authenticated');
              setCurrentTab('dashboard');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen relative flex antialiased">
      <Sidebar
        currentTab={currentTab}
        onTabChange={handleNavigate}
        onAddEntryClick={() => setIsAddEntryOpen(true)}
        onLogoutClick={handleLogout}
      />

      <main className="flex-1 md:ml-[240px] min-h-screen flex flex-col w-full relative">
        <Header
          title={headerTitle}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onMobileMenuToggle={() => setIsMobileMenuOpen((value) => !value)}
        />

        <div className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto w-full pb-24 md:pb-8">
          {pageContent}
        </div>

        <button
          onClick={() => setCurrentTab('add-expense')}
          className="md:hidden fixed bottom-[4.5rem] right-5 w-11 h-11 bg-primary text-on-primary rounded-full flex items-center justify-center cursor-pointer active:opacity-90 z-40"
        >
          <Plus size={20} />
        </button>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-surface-container-lowest/95 backdrop-blur-md border-t border-border-subtle flex justify-around items-center px-2 z-50">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-md cursor-pointer transition-colors ${
                  isActive ? 'text-primary' : 'text-text-muted'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </main>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <aside
            className="w-[240px] h-full bg-surface-container-lowest p-4 flex flex-col justify-between border-r border-border-subtle"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="mb-6 px-2">
                <h1 className="text-sm font-semibold text-text-primary">TrackWise</h1>
                <p className="text-xs text-text-muted mt-0.5">Menu</p>
              </div>
              <nav className="space-y-0.5">
                {MOBILE_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <NavItem
                      key={item.id}
                      icon={Icon}
                      label={item.label}
                      active={isActive}
                      onClick={() => handleNavigate(item.id)}
                    />
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 divider space-y-0.5">
              <NavItem
                icon={HelpCircle}
                label="Help"
                onClick={() => console.info('[TrackWise] Help requested — contact workspace support')}
              />
              <NavItem icon={LogOut} label="Log out" variant="danger" onClick={handleLogout} />
            </div>
          </aside>
        </div>
      )}

      <AddEntryModal
        isOpen={isAddEntryOpen}
        onClose={() => setIsAddEntryOpen(false)}
        onSaveExpense={handleSaveExpense}
        onSaveHabit={handleSaveHabit}
      />
    </div>
  );
}
