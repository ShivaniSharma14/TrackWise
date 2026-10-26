
import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Flame, TrendingUp, TrendingDown, CheckCircle2, Circle } from 'lucide-react';
import { Habit, Expense, ExpenseDashboardStats } from '../types';
import { api } from '../api/client';
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
  onToggleHabit: (id: string) => void;
  onNavigateTab: (tab: 'habits' | 'expenses' | 'analytics') => void;
  expenseStats?: ExpenseDashboardStats | null;
}
 
// ─── Mini sparkline: 7-day habit completion bars ────────────────────────────
function HabitSparkline({ trend }: { trend: Array<{ date: string; completion_rate: number; is_perfect_day: boolean }> }) {
  if (!trend || trend.length === 0) return null;
 
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const maxRate = 100;
 
  return (
    <div className="flex items-end gap-1 h-10" aria-label="7-day habit completion trend">
      {trend.map((day, i) => {
        const height = Math.max(4, Math.round((day.completion_rate / maxRate) * 40));
        const isPerfect = day.is_perfect_day;
        const hasData = day.completion_rate > 0;
        const dayLabel = days[new Date(day.date).getDay()];
 
        return (
          <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full flex items-end" style={{ height: 32 }}>
              <div
                className={`w-full rounded-sm transition-all ${
                  isPerfect
                    ? 'bg-violet-500'
                    : hasData
                    ? 'bg-violet-500/40'
                    : 'bg-surface-container-high/60'
                }`}
                style={{ height: `${height}px` }}
                title={`${day.date}: ${day.completion_rate}%`}
              />
            </div>
            <span className="text-[10px] text-text-muted">{dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
 
// ─── Mini spend bars: 7-day spending ────────────────────────────────────────
function SpendSparkline({ data }: { data: Array<{ date: string; spending: string | number }> }) {
  if (!data || data.length === 0) return null;
 
  const values = data.map((d) => Number(d.spending));
  const max = Math.max(...values, 1);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
 
  return (
    <div className="flex items-end gap-1 h-10" aria-label="7-day spending trend">
      {data.map((day) => {
        const val = Number(day.spending);
        const height = Math.max(4, Math.round((val / max) * 40));
        const dayLabel = days[new Date(day.date).getDay()];
 
        return (
          <div key={String(day.date)} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full flex items-end" style={{ height: 32 }}>
              <div
                className="w-full rounded-sm bg-emerald-500/60"
                style={{ height: `${height}px` }}
                title={`$${val.toFixed(0)}`}
              />
            </div>
            <span className="text-[10px] text-text-muted">{dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
 
// ─── Category breakdown bars ─────────────────────────────────────────────────
function CategoryBreakdown({ breakdown }: { breakdown: Array<{ category: string; total: string | number }> }) {
  if (!breakdown || breakdown.length === 0) return null;
 
  const values = breakdown.map((b) => Number(b.total));
  const max = Math.max(...values, 1);
  const top5 = breakdown.slice(0, 5);
 
  const categoryColors: Record<string, string> = {
    FOOD: 'bg-amber-400',
    TRANSPORT: 'bg-blue-400',
    ENTERTAINMENT: 'bg-pink-400',
    SHOPPING: 'bg-violet-400',
    UTILITIES: 'bg-teal-400',
    HEALTH: 'bg-emerald-400',
    OTHER: 'bg-gray-400',
  };
 
  return (
    <div className="space-y-2.5">
      {top5.map((item) => {
        const pct = Math.round((Number(item.total) / max) * 100);
        const color = categoryColors[item.category] ?? 'bg-gray-400';
        const label = item.category.charAt(0) + item.category.slice(1).toLowerCase();
 
        return (
          <div key={item.category}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-text-secondary">{label}</span>
              <span className="text-xs text-text-muted">${Number(item.total).toFixed(0)}</span>
            </div>
            <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${color} transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Habit Progress Today: shows all habits with completion status ────────────
function HabitProgressToday({
  habits,
  onToggleHabit,
}: {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
}) {
  if (habits.length === 0) return null;

  return (
    <div className="space-y-2">
      {habits.map((habit) => {
        const isCompleted = habit.isCompletedToday;
        const last7DaysComplete = habit.history7d.filter((done) => done).length;
        const completionRate = habit.history7d.length > 0 ? Math.round((last7DaysComplete / 7) * 100) : 0;

        return (
          <div
            key={habit.id}
            className="flex items-center gap-3 p-3 rounded-md bg-surface-container-high/50 hover:bg-surface-container-high transition-colors group"
          >
            <button
              type="button"
              onClick={() => onToggleHabit(habit.id)}
              className="flex-shrink-0 cursor-pointer transition-colors"
              aria-label={`Toggle ${habit.name}`}
            >
              {isCompleted ? (
                <CheckCircle2 size={18} className="text-violet-500" />
              ) : (
                <Circle size={18} className="text-border-subtle group-hover:text-violet-400" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{habit.name}</p>
              <p className="text-xs text-text-muted">
                {completionRate}% complete (7 days)
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Weekly Spend Summary ──────────────────────────────────────────────────
function WeeklySpendSummary({
  stats,
}: {
  stats: ExpenseDashboardStats | null;
}) {
  if (!stats) return null;

  const totalSpent = stats.this_month_spent;
  const breakdown = stats.category_breakdown_this_month || [];

  if (breakdown.length === 0) return null;

  const total = breakdown.reduce((sum, item) => sum + Number(item.total), 0);

  const categoryColors: Record<string, string> = {
    Food: 'bg-amber-400',
    Transport: 'bg-blue-400',
    Entertainment: 'bg-pink-400',
    Shopping: 'bg-violet-400',
    Utilities: 'bg-teal-400',
    Health: 'bg-emerald-400',
    Other: 'bg-gray-400',
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-text-muted mb-1">Total this month</p>
        <p className="text-xl font-semibold text-text-primary">
          ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-text-muted">By category</p>
        <div className="space-y-1">
          {breakdown.map((item) => {
            const amount = Number(item.total);
            const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
            const color = categoryColors[item.category] || 'bg-gray-400';
            const label = item.category.charAt(0) + item.category.slice(1).toLowerCase();

            return (
              <div key={item.category} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-text-secondary">{label}</span>
                    <span className="text-xs text-text-muted">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Streak badge ─────────────────────────────────────────────────────────────
function StreakBadge({ current, best }: { current: number; best: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <Flame size={14} className={current > 0 ? 'text-orange-400' : 'text-text-muted'} />
        <span className="text-sm font-medium text-text-primary">{current}</span>
        <span className="text-xs text-text-muted">day streak</span>
      </div>
      {best > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-muted">best: {best}</span>
        </div>
      )}
    </div>
  );
}
 
// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardView({ habits, expenses, onToggleHabit, onNavigateTab, expenseStats }: DashboardViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    habitsSummary: any;
    expensesSummary: any;
  } | null>(null);
 
  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await api.getCombinedDashboardSummary();
      setData({
        habitsSummary: stats.habit_stats ?? stats.habits,
        expensesSummary: stats.expense_stats ?? stats.expenses,
      });
    } catch (e: any) {
      setError(e?.message || 'Unable to load dashboard statistics.');
      setData({ habitsSummary: null, expensesSummary: null });
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    fetchDashboardStats();
  }, [habits, expenses]);
 
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <RefreshCw className="animate-spin text-text-muted" size={24} />
        <p className="text-sm text-text-muted mt-4">Loading…</p>
      </div>
    );
  }
 
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <EmptyState
          title="Couldn't load dashboard"
          description="Check your connection and try again."
          action={
            <button onClick={fetchDashboardStats} className="btn-primary">
              Retry
            </button>
          }
        />
      </div>
    );
  }
 
  const { habitsSummary, expensesSummary } = data;
 
  // ── Normalise habit data ──
  const trend: Array<{ date: string; completion_rate: number; is_perfect_day: boolean }> =
    habitsSummary?.trend?.last_7_days ??
    habitsSummary?.trend ??
    habitsSummary?.last_7_days ??
    [];
 
  const hbToday = habitsSummary?.today ?? habitsSummary?.today_summary ?? {
    due_habits: habits.length,
    completed_habits: habits.filter((h) => h.isCompletedToday).length,
    pending_habits: habits.filter((h) => !h.isCompletedToday).length,
    completion_rate:
      habits.length > 0
        ? Math.round((habits.filter((h) => h.isCompletedToday).length / habits.length) * 100)
        : 0,
    is_perfect_day: habits.length > 0 && habits.every((h) => h.isCompletedToday),
  };
 
  const consistency = habitsSummary?.consistency ?? {};
  const currentStreak: number = consistency.current_perfect_day_streak ?? 0;
  const bestStreak: number = consistency.best_perfect_day_streak ?? 0;
  const overallRate: number = habitsSummary?.performance?.overall_completion_rate ?? 0;
 
  // ── Normalise expense data ──
  const monthSpent: number = Number(expensesSummary?.this_month_spent ?? 0);
  const lastMonthSpent: number = Number(expensesSummary?.last_month_spent ?? 0);
 
  const monthChangePct: number | null = (() => {
    const mc = expensesSummary?.month_change;
    if (!mc) return null;
    if (typeof mc === 'object') return mc.percentage_change ?? null;
    return typeof mc === 'number' ? mc : null;
  })();
 
  const topCategory: string = (() => {
    const tc = expensesSummary?.top_category_this_month;
    if (!tc) return 'None';
    if (typeof tc === 'object') return tc.category ?? 'None';
    return tc;
  })();
 
  const last7DaysSpend: Array<{ date: string; spending: string | number }> =
    expensesSummary?.last_7_days_spending ?? expensesSummary?.last_7_days ?? [];
 
  const categoryBreakdown: Array<{ category: string; total: string | number }> =
    expensesSummary?.category_breakdown_this_month ?? [];
 
  // ── Derived UI values ──
  const pendingHabits = habits.filter((h) => !h.isCompletedToday);
  const allDone = habits.length > 0 && pendingHabits.length === 0;
 
  const statusLine = (() => {
    if (habits.length === 0) return 'Add your first habit to start tracking.';
    if (allDone) return 'All habits done for today. Great work.';
    return `${hbToday.pending_habits} habit${hbToday.pending_habits !== 1 ? 's' : ''} remaining today.`;
  })();
 
  const spendTrend = monthChangePct !== null && monthChangePct !== 0;
  const spendUp = (monthChangePct ?? 0) > 0;
 
  return (
    <div className="flex flex-col gap-7 max-w-6xl">
      {error && (
        <Alert variant="error" className="flex gap-3 items-start">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Some stats couldn't load</p>
            <p className="text-xs opacity-90 mt-0.5">{error}</p>
          </div>
        </Alert>
      )}
 
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Good to see you" subtitle={statusLine} />
        <span className="text-xs text-text-muted">Today&apos;s overview</span>
      </div>

      {/* ── Today&apos;s habits ── */}
      <PanelSection
        title="Today"
        description={
          habits.length > 0
            ? `${hbToday.completed_habits} of ${hbToday.due_habits} complete`
            : undefined
        }
        action={
          habits.length > 0 ? (
            <TextLink onClick={() => onNavigateTab('habits')} showChevron>
              All habits
            </TextLink>
          ) : undefined
        }
        flushBody
      >
        {habits.length === 0 ? (
          <div className="px-5 py-10">
            <EmptyState
              title="No habits yet"
              description="Create a habit to track daily progress here."
              action={
                <button type="button" onClick={() => onNavigateTab('habits')} className="btn-primary text-sm">
                  Go to habits
                </button>
              }
            />
          </div>
        ) : (
          <div className="px-5 py-6">
            <HabitProgressToday habits={habits} onToggleHabit={onToggleHabit} />
          </div>
        )}
      </PanelSection>
 
      {/* ── Stat cards row ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Habits today"
          value={habits.length === 0 ? '—' : `${hbToday.completed_habits}/${hbToday.due_habits}`}
          progress={habits.length > 0 ? hbToday.completion_rate : undefined}
          footer={
            habits.length > 0 ? (
              <span className="text-xs text-text-muted">{hbToday.completion_rate}% complete</span>
            ) : undefined
          }
        />
        <MetricCard
          label="Spent this month"
          value={`$${monthSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          footer={
            spendTrend ? (
              <span className={`text-xs flex items-center gap-1 ${spendUp ? 'text-red-400' : 'text-emerald-400'}`}>
                {spendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {spendUp ? '+' : ''}{monthChangePct}% vs last month
              </span>
            ) : (
              <TextLink onClick={() => onNavigateTab('expenses')} showChevron className="mt-0">
                View expenses
              </TextLink>
            )
          }
        />
      </section>
 
      {/* ── Habit trend + streak ── */}
      {habits.length > 0 && (
        <Panel padding="md" className="border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Habit completion</p>
              <p className="text-xs text-text-muted mt-0.5">Last 7 days</p>
            </div>
            <div className="text-right">
              <StreakBadge current={currentStreak} best={bestStreak} />
              {overallRate > 0 && (
                <p className="text-xs text-text-muted mt-1">{overallRate}% all-time rate</p>
              )}
            </div>
          </div>
          {trend.length > 0 ? (
            <HabitSparkline trend={trend} />
          ) : (
            <p className="text-xs text-text-muted">Log habits to see your trend.</p>
          )}
        </Panel>
      )}
 
      {/* ── Weekly spend summary ── */}
      {expenseStats && (
        <Panel padding="md">
          <p className="text-sm font-medium text-text-primary mb-4">Spending breakdown</p>
          <WeeklySpendSummary stats={expenseStats} />
        </Panel>
      )}
  
      {/* ── Spending breakdown ── */}
      {(last7DaysSpend.length > 0 || categoryBreakdown.length > 0) && (
        <Panel padding="md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Spending this month</p>
              <p className="text-xs text-text-muted mt-0.5">
                Top category: <span className="capitalize">{topCategory.toLowerCase()}</span>
              </p>
            </div>
            <TextLink onClick={() => onNavigateTab('expenses')} showChevron>
              Details
            </TextLink>
          </div>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {last7DaysSpend.length > 0 && (
              <div>
                <p className="text-xs text-text-muted mb-2">Last 7 days</p>
                <SpendSparkline data={last7DaysSpend} />
              </div>
            )}
            {categoryBreakdown.length > 0 && (
              <div>
                <p className="text-xs text-text-muted mb-2">By category</p>
                <CategoryBreakdown breakdown={categoryBreakdown} />
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
// import { useState, useEffect } from 'react';
// import { AlertCircle, RefreshCw } from 'lucide-react';
// import { Habit, Expense } from '../types';
// import { api } from '../api/client';
// import {
//   Alert,
//   EmptyState,
//   MetricCard,
//   PageHeader,
//   Panel,
//   PanelSection,
//   TextLink,
// } from './ui';

// interface DashboardViewProps {
//   habits: Habit[];
//   expenses: Expense[];
//   onToggleHabit: (id: string) => void;
//   onNavigateTab: (tab: 'habits' | 'expenses' | 'analytics') => void;
// }

// export default function DashboardView({ habits, expenses, onToggleHabit, onNavigateTab }: DashboardViewProps) {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [data, setData] = useState<{
//     habitsSummary: any;
//     expensesSummary: any;
//   } | null>(null);

//   const fetchDashboardStats = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const stats = await api.getCombinedDashboardSummary();
//       console.debug('Dashboard stats fetched:', stats);
//       setData({
//         habitsSummary: stats.habit_stats ?? stats.habits,
//         expensesSummary: stats.expense_stats ?? stats.expenses,
//       });
//     } catch (e: any) {
//       console.error('Error fetching combined dashboard statistics:', e);
//       setError(e?.message || 'Unable to load dashboard statistics.');
//       setData({
//         habitsSummary: null,
//         expensesSummary: null,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboardStats();
//   }, [habits, expenses]);

//   if (loading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-32">
//         <RefreshCw className="animate-spin text-text-muted" size={24} />
//         <p className="text-sm text-text-muted mt-4">Loading…</p>
//       </div>
//     );
//   }

//   if (!data) {
//     return (
//       <div className="flex flex-col items-center justify-center py-32 text-center px-4">
//         <EmptyState
//           title="Couldn't load dashboard"
//           description="Check your connection and try again."
//           action={
//             <button onClick={fetchDashboardStats} className="btn-primary">
//               Retry
//             </button>
//           }
//         />
//       </div>
//     );
//   }

//   const { habitsSummary, expensesSummary } = data;

//   const normalizedHabitsSummary = {
//     ...(habitsSummary || {}),
//     today_summary: habitsSummary?.today_summary || habitsSummary?.today || null,
//     trend: Array.isArray(habitsSummary?.trend)
//       ? habitsSummary.trend
//       : habitsSummary?.trend?.last_7_days || habitsSummary?.last_7_days || [],
//   };

//   const hbToday = normalizedHabitsSummary?.today_summary || {
//     due_habits: habits.length,
//     completed_habits: habits.filter((h) => h.isCompletedToday).length,
//     pending_habits: habits.filter((h) => !h.isCompletedToday).length,
//     completion_rate:
//       habits.length > 0
//         ? Math.round((habits.filter((h) => h.isCompletedToday).length / habits.length) * 100)
//         : 0,
//     is_perfect_day: habits.length > 0 && habits.every((h) => h.isCompletedToday),
//   };

//   const normalizedExpenseStats = {
//     ...(expensesSummary || {}),
//     last_7_days:
//       expensesSummary?.last_7_days || expensesSummary?.last_7_days_spending || [],
//     month_change:
//       typeof expensesSummary?.month_change === 'object'
//         ? expensesSummary?.month_change?.percentage_change ?? 0
//         : expensesSummary?.month_change ?? 0,
//     top_category_this_month:
//       typeof expensesSummary?.top_category_this_month === 'object'
//         ? expensesSummary?.top_category_this_month?.category || 'None'
//         : expensesSummary?.top_category_this_month || 'None',
//     monthly_spending_history: expensesSummary?.monthly_spending_history || [],
//   };

//   const expStats = normalizedExpenseStats || {
//     this_month_spent: expenses.reduce((sum, e) => sum + e.amount, 0),
//     last_month_spent: 0,
//     month_change: 0,
//     top_category_this_month: 'None',
//     last_7_days: [],
//     monthly_spending_history: [],
//   };

//   const monthSpent =
//     expStats.this_month_spent ??
//     expenses.reduce((sum, e) => sum + e.amount, 0);

//   const statusLine = (() => {
//     if (habits.length === 0) return 'Add habits to start tracking your day.';
//     if (hbToday.pending_habits === 0 && habits.length > 0) return 'All habits done for today.';
//     if (hbToday.pending_habits > 0) {
//       return `${hbToday.pending_habits} habit${hbToday.pending_habits !== 1 ? 's' : ''} left today.`;
//     }
//     return 'Overview of habits and spending.';
//   })();

//   const pendingHabits = habits.filter((h) => !h.isCompletedToday);
//   const showMonthChange =
//     typeof expStats.month_change === 'number' && expStats.month_change !== 0;

//   return (
//     <div className="space-y-8 max-w-3xl">
//       {error && (
//         <Alert variant="error" className="flex gap-3 items-start">
//           <AlertCircle size={16} className="shrink-0 mt-0.5" />
//           <div>
//             <p className="font-medium">Some stats couldn&apos;t load</p>
//             <p className="text-xs opacity-90 mt-0.5">{error}</p>
//           </div>
//         </Alert>
//       )}

//       <PageHeader title="Dashboard" subtitle={statusLine} />

//       <PanelSection
//         title="Today"
//         description={
//           habits.length > 0
//             ? `${hbToday.completed_habits} of ${hbToday.due_habits} complete`
//             : undefined
//         }
//         action={
//           habits.length > 0 ? (
//             <TextLink onClick={() => onNavigateTab('habits')} showChevron>
//               All habits
//             </TextLink>
//           ) : undefined
//         }
//         flushBody
//         footer={
//           habits.length > 0 && hbToday.completed_habits > 0 && pendingHabits.length > 0
//             ? `${hbToday.completed_habits} completed — open Habits to review or undo`
//             : undefined
//         }
//       >
//         {habits.length === 0 ? (
//           <div className="px-5 py-10">
//             <EmptyState
//               title="No habits yet"
//               description="Create a habit to track daily progress here."
//               action={
//                 <button type="button" onClick={() => onNavigateTab('habits')} className="btn-primary text-sm">
//                   Go to habits
//                 </button>
//               }
//             />
//           </div>
//         ) : pendingHabits.length === 0 ? (
//           <div className="px-5 py-8">
//             <EmptyState title="You're done for today." />
//           </div>
//         ) : (
//           <ul className="divide-y divide-border-subtle">
//             {pendingHabits.map((habit) => (
//               <li key={habit.id}>
//                 <button
//                   type="button"
//                   onClick={() => onToggleHabit(habit.id)}
//                   className="w-full px-5 py-3.5 flex items-center gap-3 text-left hover:bg-surface-container-high/60 transition-colors"
//                 >
//                   <span className="w-4 h-4 rounded ring-1 ring-border-subtle shrink-0" aria-hidden />
//                   <span className="text-sm text-text-primary truncate">{habit.name}</span>
//                 </button>
//               </li>
//             ))}
//           </ul>
//         )}
//       </PanelSection>

//       <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//         <MetricCard
//           label="Habits today"
//           value={habits.length === 0 ? '—' : `${hbToday.completed_habits}/${hbToday.due_habits}`}
//           progress={habits.length > 0 ? hbToday.completion_rate : undefined}
//           footer={habits.length > 0 ? `${hbToday.completion_rate}% complete` : undefined}
//         />
//         <MetricCard
//           label="Spent this month"
//           value={`$${monthSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
//           footer={
//             showMonthChange ? (
//               <>
//                 {expStats.month_change > 0 ? '+' : ''}
//                 {expStats.month_change}% vs last month
//               </>
//             ) : (
//               <TextLink onClick={() => onNavigateTab('expenses')} showChevron className="mt-0">
//                 View expenses
//               </TextLink>
//             )
//           }
//         />
//       </section>

//       {(normalizedHabitsSummary.trend?.length > 0 || habits.length > 0) && (
//         <Panel padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//           <p className="text-sm text-text-secondary">
//             Trends and category breakdowns live in Analytics.
//           </p>
//           <button
//             type="button"
//             onClick={() => onNavigateTab('analytics')}
//             className="btn-secondary text-sm shrink-0 self-start sm:self-auto"
//           >
//             Open analytics
//           </button>
//         </Panel>
//       )}
//     </div>
//   );
// }
