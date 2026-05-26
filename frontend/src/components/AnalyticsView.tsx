import { Habit } from '../types';
import { EmptyState, MetricCard, PageHeader, Panel, PanelBlock, PanelSection } from './ui';

interface AnalyticsViewProps {
  habits: Habit[];
}

const DAY_LABELS = ['−6d', '−5d', '−4d', '−3d', '−2d', '−1d', 'Today'];

function aggregateLast7Days(habits: Habit[]): { rate: number; completed: number; total: number }[] {
  if (habits.length === 0) return [];

  return Array.from({ length: 7 }, (_, dayIndex) => {
    let completed = 0;
    for (const habit of habits) {
      const history = habit.history7d;
      if (history && history.length > dayIndex && history[dayIndex]) {
        completed += 1;
      }
    }
    const total = habits.length;
    return {
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
}

function categoryBreakdown(habits: Habit[]): { category: string; count: number; pct: number }[] {
  if (habits.length === 0) return [];

  const counts: Record<string, number> = {};
  for (const h of habits) {
    counts[h.category] = (counts[h.category] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([category, count]) => ({
      category,
      count,
      pct: Math.round((count / habits.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export default function AnalyticsView({ habits }: AnalyticsViewProps) {
  const totalHabits = habits.length;

  const avgCompletion =
    totalHabits > 0
      ? Math.round(habits.reduce((acc, h) => acc + (h.completionRate ?? 0), 0) / totalHabits)
      : 0;

  const completedToday = habits.filter((h) => h.isCompletedToday).length;
  const bestStreak = totalHabits > 0 ? Math.max(...habits.map((h) => h.streak ?? 0)) : 0;

  const last7Days = aggregateLast7Days(habits);
  const chartMax = Math.max(...last7Days.map((d) => d.rate), 1);

  const categories = categoryBreakdown(habits);

  const ranked = [...habits].sort((a, b) => (b.completionRate ?? 0) - (a.completionRate ?? 0));

  if (totalHabits === 0) {
    return (
      <div className="space-y-8 pb-8">
        <PageHeader title="Analytics" subtitle="Insights from your habit data." />
        <Panel padding="lg" className="py-12">
          <EmptyState
            title="No habits to analyze yet"
            description="Create habits and log completions. Analytics will reflect your 7-day history and completion rates."
          />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        title="Analytics"
        subtitle={`Based on ${totalHabits} habit${totalHabits !== 1 ? 's' : ''} · last 7 days`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Average completion"
          value={`${avgCompletion}%`}
          valueSize="lg"
          progress={avgCompletion}
        />
        <MetricCard
          label="Completed today"
          value={
            <>
              {completedToday}
              <span className="text-lg font-normal text-text-muted"> / {totalHabits}</span>
            </>
          }
          valueSize="lg"
          footer={`${totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0}% of habits done`}
        />
        <MetricCard
          label="Longest streak"
          value={
            <>
              {bestStreak}
              <span className="text-lg font-normal text-text-muted"> days</span>
            </>
          }
          valueSize="lg"
          footer="Across all habits"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <PanelBlock title="Daily completion" description="Share of habits completed each day (last 7 days)" className="lg:col-span-3">
          {last7Days.every((d) => d.rate === 0) ? (
            <p className="text-sm text-text-muted py-8 text-center">No completion data in the last 7 days.</p>
          ) : (
            <>
              <div className="flex items-end gap-3 h-36">
                {last7Days.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                    <span className="text-[11px] text-text-muted tabular-nums">{day.rate}%</span>
                    <div className="w-full flex-1 flex flex-col justify-end">
                      <div
                        className="w-full rounded-sm fill-primary-muted"
                        style={{ height: `${(day.rate / chartMax) * 100}%`, minHeight: day.rate > 0 ? 4 : 0 }}
                      />
                    </div>
                    <span className="text-[11px] text-text-muted truncate w-full text-center">
                      {DAY_LABELS[i]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-text-muted mt-4">
                {last7Days.length > 0
                  ? `${Math.round(last7Days.reduce((s, d) => s + d.rate, 0) / last7Days.length)}% average daily completion`
                  : null}
              </p>
            </>
          )}
        </PanelBlock>

        <PanelBlock title="By category" description="Habit count per category" className="lg:col-span-2">
          <div className="space-y-4">
            {categories.map(({ category, count, pct }) => (
              <div key={category}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-secondary">{category}</span>
                  <span className="text-text-muted tabular-nums">
                    {count} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full rounded-full fill-primary-soft" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </PanelBlock>
      </div>

      <PanelSection
        title="Habits"
        description="Sorted by completion rate"
        flushBody
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-text-muted border-b border-border-subtle">
                <th className="py-3 px-5 font-medium">Habit</th>
                <th className="py-3 px-5 font-medium">Last 7 days</th>
                <th className="py-3 px-5 font-medium text-right">Completion</th>
                <th className="py-3 px-5 font-medium text-right">Streak</th>
                <th className="py-3 px-5 font-medium text-right">Today</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {ranked.map((habit) => {
                const week = habit.history7d ?? [];
                const weekDone = week.filter(Boolean).length;

                return (
                  <tr key={habit.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="text-sm font-medium text-text-primary">{habit.name}</p>
                      <p className="text-xs text-text-muted mt-0.5">{habit.category}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1" aria-label={`${weekDone} of 7 days completed`}>
                        {Array.from({ length: 7 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-sm ${
                              week[i] ? 'fill-primary-muted' : 'bg-surface-container-highest'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-text-muted mt-1 tabular-nums">{weekDone}/7</p>
                    </td>
                    <td className="py-3.5 px-5 text-right text-sm tabular-nums text-text-primary">
                      {habit.completionRate ?? 0}%
                    </td>
                    <td className="py-3.5 px-5 text-right text-sm tabular-nums text-text-secondary">
                      {habit.streak ?? 0}d
                    </td>
                    <td className="py-3.5 px-5 text-right text-xs text-text-secondary">
                      {habit.isCompletedToday ? 'Done' : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PanelSection>
    </div>
  );
}
