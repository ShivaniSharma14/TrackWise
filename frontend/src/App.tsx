import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Habit, Expense, ExpenseAnalytics, ExpenseCreatePayload, ExpenseUpdatePayload, HabitCreatePayload, HabitUpdatePayload, CombinedDashboardSummary, TabType } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import HabitsView from './components/HabitsView';
import ExpensesView from './components/ExpensesView';
import AnalyticsView from './components/AnalyticsView';
import AddEntryModal from './components/AddEntryModal';
import AddExpenseView from './components/AddExpenseView';
import AddHabitView from './components/AddHabitView';
import EntryEditorModal from './components/EntryEditorModal';
import AuthView from './components/AuthView';
import LandingPage from './components/LandingPage';
import './styles/landing.css';
import { api } from './api/client';
import { LayoutDashboard, CheckSquare, Receipt, BarChart3, Plus, LogOut, X } from 'lucide-react';
import { Alert, NavItem } from './components/ui';

const MOBILE_NAV_ITEMS: Array<{ id: TabType; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'habits', label: 'Habits', icon: CheckSquare },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';
type PublicRoute = 'landing' | 'login' | 'signup' | 'demo' | 'app';

function readPublicRoute(): PublicRoute {
  const route = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return route === 'login' || route === 'signup' || route === 'demo' || route === 'app' ? route : 'landing';
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [searchValue, setSearchValue] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [currentUser, setCurrentUser] = useState(api.getAuth().user);
  const [authBootstrapError, setAuthBootstrapError] = useState<string | null>(null);
  const [publicRoute, setPublicRoute] = useState<PublicRoute>(() => readPublicRoute());
  const [appDataError, setAppDataError] = useState<string | null>(null);
  const [appDataLoading, setAppDataLoading] = useState(false);
  const [authGeneration, setAuthGeneration] = useState(0);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [demoNotice, setDemoNotice] = useState('');
  const [editingEntry, setEditingEntry] = useState<
    { type: 'habit'; value: Habit } | { type: 'expense'; value: Expense } | null
  >(null);
  const dataRequestSequence = useRef(0);
  const summaryRequestSequence = useRef(0);
  const analyticsRequestSequence = useRef(0);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<CombinedDashboardSummary | null>(null);
  const [dashboardSummaryLoading, setDashboardSummaryLoading] = useState(false);
  const [dashboardSummaryError, setDashboardSummaryError] = useState<string | null>(null);
  const [expenseAnalytics, setExpenseAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [expenseAnalyticsLoading, setExpenseAnalyticsLoading] = useState(false);
  const [expenseAnalyticsError, setExpenseAnalyticsError] = useState<string | null>(null);

  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAuthenticated = authStatus === 'authenticated';
  const isDemo = isAuthenticated && currentUser?.isDemo === true;

  useEffect(() => {
    const syncRoute = () => setPublicRoute(readPublicRoute());
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMobileMenuOpen]);

  const navigatePublic = useCallback((route: PublicRoute) => {
    setAuthBootstrapError(null);
    window.location.hash = route === 'landing' ? '#/' : `#/${route}`;
    setPublicRoute(route);
  }, []);

  const handleStartDemo = useCallback(async () => {
    setAuthBootstrapError(null);
    try {
      await api.demoLogin();
      if (!api.getAuth().isAuthenticated) throw new Error('Demo session could not be started.');
      setCurrentUser(api.getAuth().user);
      setAuthStatus('authenticated');
      setHabits([]);
      setExpenses([]);
      setDashboardSummary(null);
      setExpenseAnalytics(null);
      setDashboardSummaryError(null);
      setExpenseAnalyticsError(null);
      setAppDataError(null);
      setAuthGeneration((generation) => generation + 1);
      setCurrentTab('dashboard');
      navigatePublic('app');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start the demo right now.';
      setCurrentUser(api.getAuth().user);
      setAuthStatus(api.getAuth().isAuthenticated ? 'authenticated' : 'unauthenticated');
      navigatePublic('login');
      setAuthBootstrapError(message);
    }
  }, [navigatePublic]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      console.info('[TrackWise:auth] App mount — validating session with backend');
      setAuthBootstrapError(null);
      const result = await api.initializeAuth();
      if (cancelled) return;
      setAuthStatus(result.ok ? 'authenticated' : 'unauthenticated');
      setCurrentUser(result.ok ? api.getAuth().user : null);
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
      setCurrentUser(null);
      setHabits([]);
      setExpenses([]);
      setDashboardSummary(null);
      setExpenseAnalytics(null);
      setDashboardSummaryError(null);
      setExpenseAnalyticsError(null);
      setAuthBootstrapError('Your session expired. Please sign in again.');
    });
  }, []);

  const refreshAllData = useCallback(async () => {
    if (authStatus !== 'authenticated') {
      console.info('[TrackWise:auth] refreshAllData skipped — not authenticated');
      return;
    }

    const requestId = ++dataRequestSequence.current;
    const requestToken = api.getAuth().accessToken;
    setAppDataLoading(true);
    console.info('[TrackWise:api] refreshAllData — fetching habits and expenses');
    try {
      const [dbHabits, dbExpenses] = await Promise.all([
        api.getHabits(),
        api.getExpenses(),
      ]);
      if (
        requestId !== dataRequestSequence.current ||
        requestToken !== api.getAuth().accessToken
      ) return;
      setHabits(dbHabits);
      setExpenses(dbExpenses);
      setAppDataError(null);
      console.info('[TrackWise:api] refreshAllData — success', {
        habits: dbHabits.length,
        expenses: dbExpenses.length,
      });
    } catch (e) {
      if (
        requestId !== dataRequestSequence.current ||
        requestToken !== api.getAuth().accessToken
      ) return;
      const message = e instanceof Error ? e.message : 'Unknown sync error';
      console.error('[TrackWise:api] refreshAllData — failed:', message);
      setAppDataError(`Could not load your habits and expenses: ${message}`);
    } finally {
      if (requestId === dataRequestSequence.current) setAppDataLoading(false);
    }
  }, [authStatus]);

  const fetchDashboardSummary = useCallback(async () => {
    if (authStatus !== 'authenticated') return;
    const requestId = ++summaryRequestSequence.current;
    const requestToken = api.getAuth().accessToken;
    setDashboardSummaryLoading(true);
    setDashboardSummaryError(null);
    try {
      const summary = await api.getCombinedDashboardSummary();
      if (requestId !== summaryRequestSequence.current || requestToken !== api.getAuth().accessToken) return;
      setDashboardSummary(summary);
    } catch (e) {
      if (requestId !== summaryRequestSequence.current || requestToken !== api.getAuth().accessToken) return;
      const message = e instanceof Error ? e.message : 'Unknown error';
      console.error('[TrackWise:api] fetchDashboardSummary — failed:', message);
      setDashboardSummaryError(message);
      setDashboardSummary(null);
    } finally {
      if (requestId === summaryRequestSequence.current) setDashboardSummaryLoading(false);
    }
  }, [authStatus]);

  const fetchExpenseAnalytics = useCallback(async () => {
    if (authStatus !== 'authenticated') return;
    const requestId = ++analyticsRequestSequence.current;
    const requestToken = api.getAuth().accessToken;
    setExpenseAnalyticsLoading(true);
    setExpenseAnalyticsError(null);
    try {
      const analytics = await api.getExpenseAnalytics();
      if (requestId !== analyticsRequestSequence.current || requestToken !== api.getAuth().accessToken) return;
      setExpenseAnalytics(analytics);
    } catch (e) {
      if (requestId !== analyticsRequestSequence.current || requestToken !== api.getAuth().accessToken) return;
      const message = e instanceof Error ? e.message : 'Unknown error';
      console.error('[TrackWise:api] fetchExpenseAnalytics — failed:', message);
      setExpenseAnalyticsError(message);
      setExpenseAnalytics(null);
    } finally {
      if (requestId === analyticsRequestSequence.current) setExpenseAnalyticsLoading(false);
    }
  }, [authStatus]);

  useEffect(() => {
    if (authStatus === 'authenticated') void refreshAllData();
  }, [authStatus, authGeneration, refreshAllData]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    if (currentTab === 'dashboard' || currentTab === 'analytics') void fetchDashboardSummary();
    if (currentTab === 'analytics') void fetchExpenseAnalytics();
  }, [currentTab, authStatus, authGeneration, fetchDashboardSummary, fetchExpenseAnalytics]);

  const handleToggleHabit = useCallback(async (id: string) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const target = habits.find((h) => h.id === id);
    if (!target) return;

    try {
      await api.logHabit(
        id,
        todayStr,
        target.isCompletedToday ? 0 : target.targetValue ?? 1,
        'Toggle Completion via App Dashboard',
      );
      await refreshAllData();
      if (currentTab === 'dashboard' || currentTab === 'analytics') await fetchDashboardSummary();
    } catch (e: any) {
      console.error('[TrackWise:api] logHabit failed:', e.message);
      setAppDataError(`Could not update this habit: ${e.message || 'Please try again.'}`);
    }
  }, [currentTab, habits, refreshAllData, fetchDashboardSummary]);

  const handleSaveExpense = useCallback(async (payload: ExpenseCreatePayload) => {
    try {
      await api.createExpense(payload);
      await Promise.all([
        refreshAllData(),
        currentTab === 'analytics' ? fetchExpenseAnalytics() : Promise.resolve(),
      ]);
    } catch (e: any) {
      throw new Error(e?.message || 'Failed to save expense');
    }
  }, [currentTab, refreshAllData, fetchExpenseAnalytics]);

  const handleSaveHabit = useCallback(async (newHabit: HabitCreatePayload) => {
    await api.createHabit(newHabit);
    await refreshAllData();
  }, [refreshAllData]);

  const handleUpdateHabit = useCallback(async (id: string, value: HabitUpdatePayload) => {
    await api.updateHabit(id, value);
    await refreshAllData();
  }, [refreshAllData]);

  const handleUpdateExpense = useCallback(async (id: string, value: ExpenseUpdatePayload) => {
    await api.updateExpense(id, value);
    await Promise.all([
      refreshAllData(),
      currentTab === 'analytics' ? fetchExpenseAnalytics() : Promise.resolve(),
    ]);
  }, [currentTab, refreshAllData, fetchExpenseAnalytics]);

  const handleDeleteHabit = useCallback(async (habit: Habit) => {
    if (!window.confirm(`Delete "${habit.name}" and its completion history?`)) return;
    try {
      await api.deleteHabit(habit.id);
      await refreshAllData();
    } catch (error) {
      setAppDataError(error instanceof Error ? error.message : 'Unable to delete habit.');
    }
  }, [refreshAllData]);

  const handleDeleteExpense = useCallback(async (expense: Expense) => {
    if (!window.confirm(`Delete the ${expense.category} expense of ₹${expense.amount.toFixed(2)}?`)) return;
    try {
      await api.deleteExpense(expense.id);
      await Promise.all([
        refreshAllData(),
        currentTab === 'analytics' ? fetchExpenseAnalytics() : Promise.resolve(),
      ]);
    } catch (error) {
      setAppDataError(error instanceof Error ? error.message : 'Unable to delete expense.');
    }
  }, [currentTab, refreshAllData, fetchExpenseAnalytics]);

  const handleResetDemo = useCallback(async () => {
    if (!isDemo || resettingDemo) return;
    if (!window.confirm('Reset this demo workspace to its original sample data? Your changes will be removed.')) return;
    setResettingDemo(true);
    setDemoNotice('');
    try {
      await api.resetDemoWorkspace();
      await Promise.all([
        refreshAllData(),
        fetchDashboardSummary(),
        currentTab === 'analytics' ? fetchExpenseAnalytics() : Promise.resolve(),
      ]);
      setDemoNotice('Demo workspace restored to its original sample data.');
    } catch (error) {
      setAppDataError(error instanceof Error ? error.message : 'Unable to reset the demo workspace.');
    } finally {
      setResettingDemo(false);
    }
  }, [isDemo, resettingDemo, currentTab, refreshAllData, fetchDashboardSummary, fetchExpenseAnalytics]);

  const handleExitDemo = useCallback(async () => {
    try {
      const result = await api.exitDemo();
      setAuthStatus(result.ok ? 'authenticated' : 'unauthenticated');
      setCurrentUser(result.ok ? api.getAuth().user : null);
      setHabits([]);
      setExpenses([]);
      setDashboardSummary(null);
      setExpenseAnalytics(null);
      setDashboardSummaryError(null);
      setExpenseAnalyticsError(null);
      setAppDataError(null);
      setDemoNotice('');
      setEditingEntry(null);
      setCurrentTab('dashboard');
      setAuthGeneration((generation) => generation + 1);
      navigatePublic('landing');
    } catch (error) {
      setAppDataError(error instanceof Error ? error.message : 'Unable to exit the demo safely.');
    }
  }, [navigatePublic]);

  const handleLogout = useCallback(() => {
    api.logout();
    setAuthStatus('unauthenticated');
    setCurrentUser(null);
    setHabits([]);
    setExpenses([]);
    setDashboardSummary(null);
    setExpenseAnalytics(null);
    setDashboardSummaryError(null);
    setExpenseAnalyticsError(null);
    setAppDataError(null);
    setCurrentTab('dashboard');
    navigatePublic('landing');
  }, [navigatePublic]);

  const handleNavigate = useCallback((tab: TabType) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  }, []);

  const pageContent = useMemo(() => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            habits={habits}
            expenses={expenses}
            onToggleHabit={handleToggleHabit}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            summary={dashboardSummary}
            isLoading={dashboardSummaryLoading || appDataLoading}
            error={dashboardSummaryError}
            onRetry={() => void fetchDashboardSummary()}
            isDemo={isDemo}
          />
        );
      case 'habits':
        return (
          <HabitsView
            habits={habits}
            onToggleHabit={handleToggleHabit}
            onAddHabitClick={() => setCurrentTab('add-habit')}
            onEditHabit={(habit) => setEditingEntry({ type: 'habit', value: habit })}
            onDeleteHabit={handleDeleteHabit}
            isLoading={appDataLoading}
          />
        );
      case 'expenses':
        return (
          <ExpensesView
            expenses={expenses}
            onAddExpenseClick={() => setCurrentTab('add-expense')}
            onEditExpense={(expense) => setEditingEntry({ type: 'expense', value: expense })}
            onDeleteExpense={handleDeleteExpense}
            searchValue={searchValue}
            isDemo={isDemo}
            isLoading={appDataLoading}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            habits={habits}
            summary={dashboardSummary}
            expenseAnalytics={expenseAnalytics}
            isLoading={dashboardSummaryLoading || expenseAnalyticsLoading}
            summaryError={dashboardSummaryError}
            expenseError={expenseAnalyticsError}
            onRetrySummary={() => void fetchDashboardSummary()}
            onRetryExpenses={() => void fetchExpenseAnalytics()}
          />
        );
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
      case 'auth':
        return <AuthView />;
      default:
        return (
          <DashboardView
            habits={habits}
            expenses={expenses}
            onToggleHabit={handleToggleHabit}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            summary={dashboardSummary}
            isLoading={dashboardSummaryLoading || appDataLoading}
            error={dashboardSummaryError}
            onRetry={() => void fetchDashboardSummary()}
          />
        );
    }
  }, [currentTab, habits, expenses, dashboardSummary, dashboardSummaryLoading, dashboardSummaryError, expenseAnalytics, expenseAnalyticsLoading, expenseAnalyticsError, appDataLoading, searchValue, isDemo, handleSaveExpense, handleSaveHabit, handleToggleHabit, handleDeleteHabit, handleDeleteExpense, fetchDashboardSummary, fetchExpenseAnalytics]);

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

  if (publicRoute === 'landing') {
    return (
      <LandingPage
        onSignIn={() => navigatePublic('login')}
        onSignUp={() => navigatePublic('signup')}
        onDemo={handleStartDemo}
      />
    );
  }

  if (!isAuthenticated || publicRoute === 'login' || publicRoute === 'signup') {
    return (
      <div className="bg-background min-h-screen flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1 mb-2">
            <a href="#/" aria-label="Back to TrackWise home" className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container text-sm font-semibold text-primary">T</a>
            <h1 className="text-lg font-semibold tracking-tight text-text-primary mt-3">TrackWise</h1>
            <p className="text-sm text-text-muted">Habits and expense tracking</p>
            <button type="button" onClick={() => navigatePublic('landing')} className="text-xs text-primary hover:underline mt-2">← Back to home</button>
          </div>
          {authBootstrapError && (
            <Alert variant="error" className="text-center mx-auto max-w-sm">{authBootstrapError}</Alert>
          )}
          <AuthView
            initialMode={publicRoute === 'signup' ? 'signup' : 'login'}
            showFormWhenAuthenticated={isAuthenticated}
            onAuthSuccess={() => {
              if (!api.getAuth().isAuthenticated) {
                console.warn('[TrackWise:auth] onAuthSuccess fired but client is not authenticated');
                return;
              }
              setCurrentUser(api.getAuth().user);
              setAuthStatus('authenticated');
              setHabits([]);
              setExpenses([]);
              setDashboardSummary(null);
              setExpenseAnalytics(null);
              setDashboardSummaryError(null);
              setExpenseAnalyticsError(null);
              setAppDataError(null);
              setAuthGeneration((generation) => generation + 1);
              setCurrentTab('dashboard');
              navigatePublic('app');
            }}
          />
        </div>
      </div>
    );
  }

  // Authenticated users see the product landing page at the root URL too.
  // The private application is explicitly available at #/app.
  if (publicRoute !== 'app') {
    return (
      <LandingPage
        onSignIn={() => navigatePublic('login')}
        onSignUp={() => navigatePublic('signup')}
        onDemo={handleStartDemo}
      />
    );
  }

  return (
    <div className="bg-background min-h-screen relative flex antialiased">
      <Sidebar
        currentTab={currentTab}
        onTabChange={handleNavigate}
        onLogoutClick={isDemo ? handleExitDemo : handleLogout}
        isDemo={isDemo}
      />

      <main className="app-main relative flex min-h-screen w-full flex-1 flex-col">
        <Header
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          showSearch={currentTab === 'expenses'}
          onMobileMenuToggle={() => setIsMobileMenuOpen((value) => !value)}
          isMobileMenuOpen={isMobileMenuOpen}
          userEmail={currentUser?.email ?? ''}
          userName={`${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim()}
          isDemo={isDemo}
        />

        <div className="app-content flex-1">
          {isDemo && (
            <div id="demo-workspace-banner" className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <strong className="text-sm font-semibold uppercase tracking-wide text-amber-200">Interactive Demo · Sample Data</strong>
                  <p className="mt-1 text-xs text-amber-100/80">Changes are isolated to this temporary workspace and never touch a personal account.</p>
                  {currentUser?.demoExpiresAt && (
                    <p className="mt-1 text-[11px] text-amber-100/70">
                      Expires {new Date(currentUser.demoExpiresAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleResetDemo} disabled={resettingDemo} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50">
                    {resettingDemo ? 'Resetting…' : 'Reset demo'}
                  </button>
                  <button type="button" onClick={handleExitDemo} className="btn-secondary px-3 py-1.5 text-xs">
                    Exit demo
                  </button>
                </div>
              </div>
            </div>
          )}
          {demoNotice && <Alert variant="success" className="mb-5">{demoNotice}</Alert>}
          {appDataError && (
            <Alert variant="error" className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span>{appDataError}</span>
              <button
                type="button"
                onClick={() => {
                  void refreshAllData();
                  if (currentTab === 'dashboard' || currentTab === 'analytics') void fetchDashboardSummary();
                  if (currentTab === 'analytics') void fetchExpenseAnalytics();
                }}
                className="btn-secondary py-1 px-2 text-xs"
              >
                Retry
              </button>
            </Alert>
          )}
          {pageContent}
        </div>

        <button
          onClick={() => setCurrentTab('add-expense')}
          title="Add expense"
          className="md:hidden fixed bottom-[4.5rem] right-5 w-11 h-11 bg-primary text-on-primary rounded-full flex items-center justify-center cursor-pointer active:opacity-90 z-40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
        </button>

        <nav aria-label="Primary navigation" className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border-subtle bg-surface-container-lowest/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors ${
                  isActive ? 'text-primary' : 'text-text-muted'
                }`}
              >
                <Icon size={19} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[11px] font-medium leading-none">{item.label}</span>
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
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Workspace navigation"
            className="app-sidebar flex h-full flex-col justify-between border-r border-border-subtle bg-surface-container-lowest p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="mb-6 flex items-center justify-between px-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold text-primary ring-1 ring-primary/20">T</span>
                  <div>
                    <h1 className="text-sm font-semibold text-text-primary">TrackWise</h1>
                    <p className="mt-0.5 text-xs text-text-muted">Workspace</p>
                  </div>
                </div>
                <button type="button" className="icon-button" aria-label="Close navigation menu" onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={18} />
                </button>
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

            <div className="pt-4 divider">
              <NavItem icon={LogOut} label={isDemo ? 'Exit demo' : 'Log out'} variant="danger" onClick={isDemo ? handleExitDemo : handleLogout} />
            </div>
          </aside>
        </div>
      )}

      <AddEntryModal
        isOpen={isAddEntryOpen && !isDemo}
        onClose={() => setIsAddEntryOpen(false)}
        onSaveExpense={handleSaveExpense}
        onSaveHabit={handleSaveHabit}
      />
      {editingEntry && (
        <EntryEditorModal
          key={`${editingEntry.type}-${editingEntry.value.id}`}
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaveHabit={handleUpdateHabit}
          onSaveExpense={handleUpdateExpense}
        />
      )}
    </div>
  );
}
