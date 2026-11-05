import { ArrowDownRight, ArrowUpRight, Flame, Target, Wallet } from 'lucide-react';
import { CombinedDashboardSummary, ExpenseAnalytics, Habit } from '../types';
import { Alert, EmptyState, MetricCard, PageHeader, PanelBlock } from './ui';

interface AnalyticsViewProps {
  habits: Habit[];
  summary: CombinedDashboardSummary | null;
  expenseAnalytics: ExpenseAnalytics | null;
  isLoading: boolean;
  summaryError: string | null;
  expenseError: string | null;
  onRetrySummary: () => void;
  onRetryExpenses: () => void;
}

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function amount(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? currency.format(parsed) : null;
}

function monthLabel(value: string): string {
  const date = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

function dateLabel(value?: string): string {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function HabitCompletionTrend({ summary }: { summary: CombinedDashboardSummary['habit_stats'] }) {
  const days = summary.trend.last_7_days;
  if (days.length === 0) {
    return <EmptyState title="No habit trend yet" description="There are no active daily habits to report for this period." className="py-10" />;
  }
  if (days.every((day) => day.due_habits === 0)) {
    return <EmptyState title="No habits were due" description="Daily completion appears here once a habit is active for this period." className="py-10" />;
  }

  return (
    <div className="flex min-h-[220px] items-end gap-2 rounded-xl border border-border-subtle bg-surface-container-low/70 px-3 pb-3 pt-5 sm:gap-4 sm:px-5">
      {days.map((day) => {
        const rate = day.due_habits > 0 ? Math.max(0, Math.min(100, day.completion_rate)) : 0;
        const label = dateLabel(day.date);
        return (
          <div
            key={day.date ?? label}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
            title={`${label}: ${day.completed_habits} of ${day.due_habits} complete (${Math.round(rate)}%)`}
          >
            <span className="text-center text-[10px] text-text-muted tabular-nums sm:text-xs">
              {day.due_habits > 0 ? `${Math.round(rate)}%` : '—'}
            </span>
            <div className="flex h-32 w-full items-end overflow-hidden rounded-t-lg bg-surface-container-high/60">
              <div className="w-full rounded-t-lg bg-primary" style={{ height: `${rate}%`, minHeight: rate > 0 ? 4 : 0 }} />
            </div>
            <span className="truncate text-[10px] font-medium text-text-secondary sm:text-xs">{label || 'Day'}</span>
          </div>
        );
      })}
    </div>
  );
}

function MonthlySpendingChart({ history }: { history: ExpenseAnalytics['monthly_trend']['history'] }) {
  if (history.length === 0) {
    return <EmptyState title="No monthly history returned" description="The analytics endpoint did not include monthly totals." className="py-10" />;
  }

  const values = history.map((item) => Number(item.total));
  if (values.some((value) => !Number.isFinite(value))) {
    return <EmptyState title="Monthly history unavailable" description="One or more monthly totals could not be read." className="py-10" />;
  }
  const maxAmount = Math.max(...values);
  if (maxAmount === 0) {
    return <EmptyState title="No expenses recorded in the last 12 months" description="Monthly totals will appear after you add transactions." className="py-10" />;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex h-56 min-w-[560px] items-end gap-2 rounded-xl border border-border-subtle bg-surface-container-low/70 px-3 pb-3 pt-5 sm:gap-3 sm:px-5">
        {history.map((item, index) => {
          const total = values[index];
          const height = total > 0 ? Math.max(4, (total / maxAmount) * 100) : 0;
          return (
            <div
              key={item.month}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
              title={`${monthLabel(item.month)}: ${amount(total) ?? 'Unavailable'}`}
              aria-label={`${monthLabel(item.month)} spending: ${amount(total) ?? 'Unavailable'}`}
            >
              <div className="flex h-36 w-full items-end overflow-hidden rounded-t-lg bg-surface-container-high/60">
                <div className="w-full rounded-t-lg bg-primary" style={{ height: `${height}%` }} />
              </div>
              <span className="whitespace-nowrap text-[10px] font-medium text-text-secondary sm:text-xs">
                {monthLabel(item.month)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryBreakdown({ analytics }: { analytics: ExpenseAnalytics }) {
  const categories = analytics.category_distribution_this_month;
  if (categories.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">No expenses recorded this month.</p>;
  }

  const colors = ['bg-primary', 'bg-sky-300', 'bg-emerald-300', 'bg-amber-300', 'bg-rose-300', 'bg-teal-300', 'bg-violet-300'];
  return (
    <ul className="space-y-4">
      {categories.map((item, index) => {
        const percentage = Number(item.percentage);
        const total = amount(item.total);
        if (!Number.isFinite(percentage)) return null;
        const boundedPercentage = Math.min(100, Math.max(0, percentage));
        return (
          <li key={item.category}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-text-secondary">{item.category}</span>
              <span className="shrink-0 tabular-nums text-text-muted">
                {total ?? '—'} · {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
              <div className={`h-full rounded-full ${colors[index % colors.length]}`} style={{ width: `${boundedPercentage}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function AnalyticsView({
  habits,
  summary,
  expenseAnalytics,
  isLoading,
  summaryError,
  expenseError,
  onRetrySummary,
  onRetryExpenses,
}: AnalyticsViewProps) {
  if (isLoading && !summary && !expenseAnalytics) {
    return (
      <div className="app-page w-full pb-8" aria-busy="true" aria-label="Loading analytics">
        <div className="h-20 animate-pulse rounded-2xl bg-surface-container-high/70" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-border-subtle bg-surface-container/80" />)}
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {[0, 1].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-border-subtle bg-surface-container/80" />)}
        </div>
      </div>
    );
  }

  const habitStats = summary?.habit_stats;
  const analytics = expenseAnalytics;
  const activeHabitCount = habits.filter((habit) => habit.isActive && habit.frequency === 'DAILY').length;
  const overallRate = habitStats?.performance.overall_completion_rate;
  const monthSpend = amount(analytics?.spending_behavior_this_month.total_spent);
  const transactionCount = analytics?.spending_behavior_this_month.total_expenses_count;
  const averageMonthly = amount(analytics?.monthly_trend.average_monthly_spend);
  const monthChange = analytics?.month_comparison.percentage_change;
  const monthChangeValue = monthChange === null || monthChange === undefined ? null : Number(monthChange);
  const currentStreak = habitStats?.consistency.current_perfect_day_streak;

  return (
    <div className="app-page w-full pb-8">
      <PageHeader title="Analytics" subtitle="Historical patterns in your habits and spending." />

      {summaryError && (
        <Alert variant="error" className="flex flex-wrap items-center justify-between gap-3">
          <span>Habit and dashboard statistics could not be loaded: {summaryError}</span>
          <button type="button" onClick={onRetrySummary} className="btn-secondary min-h-9 px-3 text-xs">Retry</button>
        </Alert>
      )}
      {expenseError && (
        <Alert variant="error" className="flex flex-wrap items-center justify-between gap-3">
          <span>Expense analytics could not be loaded: {expenseError}</span>
          <button type="button" onClick={onRetryExpenses} className="btn-secondary min-h-9 px-3 text-xs">Retry</button>
        </Alert>
      )}

      <section aria-label="Analytics summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Overall habit completion"
          value={habitStats && activeHabitCount > 0 ? `${Math.round(overallRate ?? 0)}%` : '—'}
          icon={Target}
          progress={habitStats && activeHabitCount > 0 ? overallRate : undefined}
          footer={habitStats && activeHabitCount > 0 ? 'Across tracked habit-days' : 'No active daily habits'}
        />
        <MetricCard
          label="Perfect-day streak"
          value={currentStreak === undefined ? '—' : <>{currentStreak}<span className="ml-1 text-lg font-medium text-text-muted">days</span></>}
          icon={Flame}
          footer={habitStats ? 'Consecutive days all due habits were completed' : 'Habit summary unavailable'}
        />
        <MetricCard
          label="Spent this month"
          value={monthSpend ?? '—'}
          icon={Wallet}
          footer={transactionCount === undefined ? 'Expense analytics unavailable' : `${transactionCount} transaction${transactionCount !== 1 ? 's' : ''} month to date`}
        />
        <MetricCard
          label="Average monthly spend"
          value={averageMonthly ?? '—'}
          footer={averageMonthly === null ? 'Expense analytics unavailable' : 'Average of non-zero months in the last 12 months'}
        />
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <PanelBlock title="Habit completion" description="Daily completion rate · last 7 days" className="min-w-0">
          {habitStats
            ? <HabitCompletionTrend summary={habitStats} />
            : <EmptyState title="Habit trend unavailable" description="The combined dashboard summary has not loaded." className="py-10" />}
        </PanelBlock>
        <PanelBlock title="Monthly spending" description="Recorded expense totals · last 12 months" className="min-w-0">
          {analytics
            ? <MonthlySpendingChart history={analytics.monthly_trend.history} />
            : <EmptyState title="Monthly trend unavailable" description="Expense analytics have not loaded." className="py-10" />}
          {monthChangeValue !== null && Number.isFinite(monthChangeValue) && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-4 text-xs">
              <span className="text-text-muted">Month to date vs previous calendar month</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${monthChangeValue > 0 ? 'text-error' : monthChangeValue < 0 ? 'text-success' : 'text-text-secondary'}`}>
                {monthChangeValue > 0 ? <ArrowUpRight size={13} /> : monthChangeValue < 0 ? <ArrowDownRight size={13} /> : null}
                {monthChangeValue > 0 ? '+' : monthChangeValue < 0 ? '−' : ''}{Math.abs(monthChangeValue).toFixed(1)}%
              </span>
            </div>
          )}
        </PanelBlock>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <PanelBlock title="Spending by category" description="Current calendar month to date">
          {analytics
            ? <CategoryBreakdown analytics={analytics} />
            : <EmptyState title="Category breakdown unavailable" description="Expense analytics have not loaded." className="py-8" />}
        </PanelBlock>
        <PanelBlock title="This month’s spending behavior" description="Derived by the expense analytics endpoint">
          {analytics ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
                <span className="text-sm text-text-muted">Average transaction</span>
                <span className="text-sm font-semibold tabular-nums text-text-primary">
                  {amount(analytics.spending_behavior_this_month.average_expense_amount) ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
                <span className="text-sm text-text-muted">Most frequent category</span>
                <span className="max-w-[55%] truncate text-right text-sm font-medium text-text-primary">
                  {analytics.spending_behavior_this_month.most_frequent_category?.category ?? 'No transactions'}
                </span>
              </div>
              <div>
                <p className="mb-2 text-sm text-text-muted">Largest transaction this month</p>
                {analytics.spending_behavior_this_month.highest_expense ? (
                  <div className="rounded-xl border border-border-subtle bg-surface-container-low/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        {amount(analytics.spending_behavior_this_month.highest_expense.amount) ?? '—'}
                      </span>
                      <span className="badge-accent">{analytics.spending_behavior_this_month.highest_expense.category}</span>
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      {dateLabel(analytics.spending_behavior_this_month.highest_expense.date)}
                      {analytics.spending_behavior_this_month.highest_expense.note
                        ? ` · ${analytics.spending_behavior_this_month.highest_expense.note}`
                        : ''}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No expenses recorded this month.</p>
                )}
              </div>
            </div>
          ) : (
            <EmptyState title="Spending behavior unavailable" description="Expense analytics have not loaded." className="py-8" />
          )}
        </PanelBlock>
      </div>
    </div>
  );
}
