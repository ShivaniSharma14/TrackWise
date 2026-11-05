import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Flame,
  Plus,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import { CombinedDashboardSummary, Expense, Habit, TabType } from '../types';
import {
  Alert,
  EmptyState,
  MetricCard,
  PageHeader,
  Panel,
  PanelSection,
  TextLink,
} from './ui';

interface DashboardViewProps {
  habits: Habit[];
  expenses: Expense[];
  onToggleHabit: (id: string) => void | Promise<void>;
  onNavigateTab: (tab: TabType) => void;
  summary: CombinedDashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  isDemo?: boolean;
}

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? currency.format(amount) : null;
}

function localDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shortDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function WeeklySpendingChart({
  values,
}: {
  values: CombinedDashboardSummary['expense_stats']['last_7_days_spending'];
}) {
  if (values.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <EmptyState title="Spending trend unavailable" description="No seven-day spending data was returned." />
      </div>
    );
  }

  const maxAmount = Math.max(...values.map(({ spending }) => Number(spending)));
  if (!Number.isFinite(maxAmount)) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <EmptyState title="Spending trend unavailable" description="The returned spending values could not be read." />
      </div>
    );
  }

  if (maxAmount === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <EmptyState title="No expenses in the last 7 days" description="Your daily spend will appear here after you record a transaction." />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[220px] items-end gap-2 rounded-xl border border-border-subtle bg-surface-container-low/70 px-3 pb-3 pt-5 sm:gap-4 sm:px-5"
      role="img"
      aria-label="Daily spending amounts over the last seven days"
    >
      {values.map(({ date, spending }) => {
        const amount = Number(spending);
        const height = Number.isFinite(amount) && amount > 0 ? Math.max(4, (amount / maxAmount) * 100) : 0;
        const label = shortDate(date);
        return (
          <div
            key={date}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
            title={`${label}: ${formatCurrency(spending) ?? 'Unavailable'}`}
          >
            <span className="max-w-full truncate text-center text-[10px] text-text-muted tabular-nums sm:text-xs">
              {formatCurrency(spending) ?? '—'}
            </span>
            <div className="flex h-32 w-full items-end overflow-hidden rounded-t-lg bg-surface-container-high/60">
              <div
                className="w-full rounded-t-lg bg-primary"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-text-secondary sm:text-xs">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function TodayHabitList({
  habits,
  onToggleHabit,
  onNavigateTab,
  isLoading,
}: {
  habits: Habit[];
  onToggleHabit: DashboardViewProps['onToggleHabit'];
  onNavigateTab: DashboardViewProps['onNavigateTab'];
  isLoading: boolean;
}) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const today = localDateString(new Date());
  const dueHabits = habits.filter(
    (habit) => habit.isActive && habit.frequency === 'DAILY' && habit.createdDate <= today,
  );

  const toggle = async (id: string) => {
    setPendingIds((current) => new Set(current).add(id));
    try {
      await onToggleHabit(id);
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 px-5 py-5 sm:px-6" aria-busy="true" aria-label="Loading today's habits">
        {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-surface-container-high/60" />)}
      </div>
    );
  }

  if (dueHabits.length === 0) {
    return (
      <div className="px-5 py-10 sm:px-6">
        <EmptyState
          title="No habits due today"
          description="Create a daily habit to add a check-in to your routine."
          action={<button type="button" onClick={() => onNavigateTab('add-habit')} className="btn-primary"><Plus size={15} /> Add habit</button>}
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border-subtle">
      {dueHabits.slice(0, 5).map((habit) => {
        const done = habit.isCompletedToday;
        const pending = pendingIds.has(habit.id);
        return (
          <li key={habit.id} className="flex min-w-0 items-center gap-3 px-4 py-3.5 sm:px-6">
            <button
              type="button"
              onClick={() => void toggle(habit.id)}
              disabled={pending}
              aria-label={done ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
              aria-pressed={done}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 ${
                done ? 'bg-primary/15 text-primary' : 'bg-surface-container-high text-text-muted hover:text-primary'
              }`}
            >
              {done ? <CheckCircle2 size={19} /> : <Circle size={19} />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${done ? 'text-text-secondary' : 'text-text-primary'}`}>{habit.name}</p>
              <p className="mt-1 truncate text-xs text-text-muted">
                Daily{habit.targetUnit === 'BOOL' ? '' : ` · target ${habit.targetValue} ${habit.targetUnit.toLowerCase()}`}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${done ? 'bg-success/10 text-success' : 'bg-surface-container-high text-text-muted'}`}>
              {pending ? 'Saving…' : done ? 'Done' : 'To do'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function DashboardView({
  habits,
  expenses,
  onToggleHabit,
  onNavigateTab,
  summary,
  isLoading,
  error,
  onRetry,
  isDemo = false,
}: DashboardViewProps) {
  const habitSummary = summary?.habit_stats;
  const expenseSummary = summary?.expense_stats;
  const todaySummary = habitSummary?.today;
  const monthSpend = formatCurrency(expenseSummary?.this_month_spent);
  const monthChange = expenseSummary?.month_change.percentage_change;
  const monthChangeValue = monthChange === null || monthChange === undefined ? null : Number(monthChange);
  const currentStreak = habitSummary?.consistency.current_perfect_day_streak;
  const recentExpenses = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 5);
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
  const period = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date());

  if (isLoading && !summary) {
    return (
      <div className="app-page w-full pb-8" aria-busy="true" aria-label="Loading dashboard">
        <div className="h-20 animate-pulse rounded-2xl bg-surface-container-high/70" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-border-subtle bg-surface-container/80" />)}
        </div>
        <div className="h-[340px] animate-pulse rounded-2xl border border-border-subtle bg-surface-container/80" />
      </div>
    );
  }

  return (
    <div className="app-page w-full pb-8">
      {error && (
        <Alert variant="error" className="flex flex-wrap items-center justify-between gap-3">
          <span>Dashboard summary could not be loaded: {error}</span>
          <button type="button" onClick={onRetry} className="btn-secondary min-h-9 px-3 text-xs">Retry</button>
        </Alert>
      )}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          title={isDemo ? 'Your demo overview' : 'Your daily overview'}
          subtitle="Small steps add up. Here’s where you are today."
        />
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
          <div className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-subtle bg-surface-container/70 px-3.5 text-sm text-text-secondary">
            <CalendarDays size={16} className="shrink-0 text-primary" />
            <span>{today}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onNavigateTab('add-habit')} className="btn-secondary flex-1 sm:flex-none">
              <Plus size={16} /> Add habit
            </button>
            <button type="button" onClick={() => onNavigateTab('add-expense')} className="btn-primary flex-1 sm:flex-none">
              <Plus size={16} /> Add expense
            </button>
          </div>
        </div>
      </div>

      <section aria-label="At a glance" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Completed today"
          value={todaySummary ? <>{todaySummary.completed_habits}<span className="ml-1 text-lg font-medium text-text-muted">/ {todaySummary.due_habits}</span></> : '—'}
          icon={CheckCircle2}
          footer={todaySummary ? `${todaySummary.pending_habits} remaining today` : 'Habit summary unavailable'}
        />
        <MetricCard
          label="Spent this month"
          value={monthSpend ?? '—'}
          icon={Wallet}
          footer={monthSpend ? period : 'Expense summary unavailable'}
        />
        <MetricCard
          label="Perfect-day streak"
          value={currentStreak === undefined ? '—' : <>{currentStreak}<span className="ml-1 text-lg font-medium text-text-muted">days</span></>}
          icon={Flame}
          footer={currentStreak === undefined ? 'Habit summary unavailable' : currentStreak > 0 ? 'All due habits completed each day' : 'Complete all due habits to start'}
        />
        <MetricCard
          label="Spend change"
          value={monthChangeValue === null || !Number.isFinite(monthChangeValue) ? '—' : `${Math.abs(monthChangeValue).toFixed(1)}%`}
          icon={monthChangeValue === null || !Number.isFinite(monthChangeValue) ? Wallet : monthChangeValue > 0 ? ArrowUpRight : ArrowDownRight}
          footer={monthChangeValue === null || !Number.isFinite(monthChangeValue)
            ? 'No previous-month comparison available'
            : `${monthChangeValue > 0 ? 'Higher' : monthChangeValue < 0 ? 'Lower' : 'Unchanged'} month to date vs previous month`}
        />
      </section>

      <Panel>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title">Daily spending</h2>
            <p className="section-desc">Recorded expenses · last 7 days</p>
          </div>
          <span className="badge-accent">7-day trend</span>
        </div>
        {expenseSummary
          ? <WeeklySpendingChart values={expenseSummary.last_7_days_spending} />
          : <div className="flex min-h-[220px] items-center justify-center"><EmptyState title="Spending trend unavailable" description="Dashboard expense statistics have not loaded." /></div>}
      </Panel>

      <section aria-label="Today's actions and recent expenses" className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-12">
        <PanelSection
          title="Today’s habits"
          description={todaySummary ? `${todaySummary.completed_habits} of ${todaySummary.due_habits} complete` : 'Your daily check-ins'}
          action={<TextLink onClick={() => onNavigateTab('habits')} showChevron>All habits</TextLink>}
          flushBody
          className="min-w-0 xl:col-span-7"
        >
          <TodayHabitList
            habits={habits}
            onToggleHabit={onToggleHabit}
            onNavigateTab={onNavigateTab}
            isLoading={isLoading}
          />
          {habits.filter((habit) => habit.isActive).length > 5 && (
            <div className="border-t border-border-subtle px-5 py-3 sm:px-6">
              <TextLink onClick={() => onNavigateTab('habits')} showChevron>View all habits</TextLink>
            </div>
          )}
        </PanelSection>

        <PanelSection
          title={isDemo ? 'Recent sample expenses' : 'Recent expenses'}
          description="Latest transactions"
          action={<TextLink onClick={() => onNavigateTab('expenses')} showChevron>All expenses</TextLink>}
          flushBody
          className="min-w-0 xl:col-span-5"
        >
          {isLoading ? (
            <div className="space-y-3 px-5 py-5" aria-busy="true" aria-label="Loading recent expenses">
              {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-surface-container-high/60" />)}
            </div>
          ) : recentExpenses.length === 0 ? (
            <div className="px-5 py-10 sm:px-6">
              <EmptyState title="No expenses yet" description="Your recent transactions will appear here." />
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {recentExpenses.map((expense) => (
                <li key={expense.id} className="flex min-w-0 items-center gap-3 px-4 py-3.5 sm:px-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ReceiptText size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{expense.merchant || expense.category}</p>
                    <p className="mt-1 truncate text-xs text-text-muted">{expense.category} · {shortDate(expense.date)}</p>
                  </div>
                  <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-text-primary">
                    {formatCurrency(expense.amount) ?? '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {recentExpenses.length > 0 && (
            <div className="border-t border-border-subtle px-5 py-3 sm:px-6">
              <TextLink onClick={() => onNavigateTab('expenses')} showChevron>Open expense ledger</TextLink>
            </div>
          )}
        </PanelSection>
      </section>
    </div>
  );
}
