import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame, CheckCircle, Circle, ChevronLeft, ChevronRight,
  Plus, Loader, Trophy, Target, TrendingUp, Calendar,
  AlertCircle, CheckCheck, Clock, Zap, BookOpen, DollarSign, Heart,
} from 'lucide-react';
import { Habit } from '../types';
import { api } from '../api/client';
import { EmptyState, MetricCard, Panel, PanelSection, Alert } from './ui';
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
interface HabitStats {
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  today_status: 'completed' | 'pending' | 'inactive' | 'unsupported';
  total_completed_days: number;
  last_7_days_status: { date: string; completed: boolean }[];
}
 
interface HabitsViewProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onAddHabitClick: () => void;
  onRefresh?: () => void;
}
 
// ─── Constants ────────────────────────────────────────────────────────────────
 
const ITEMS_PER_PAGE = 6;
 
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Health:       <Heart size={14} />,
  Productivity: <Zap size={14} />,
  Finance:      <DollarSign size={14} />,
  Education:    <BookOpen size={14} />,
};
 
const CATEGORY_COLORS: Record<string, string> = {
  Health:       'bg-rose-500/10 text-rose-400',
  Productivity: 'bg-amber-500/10 text-amber-400',
  Finance:      'bg-emerald-500/10 text-emerald-400',
  Education:    'bg-blue-500/10 text-blue-400',
};
 
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
 
// ─── Sub-components ───────────────────────────────────────────────────────────
 
/** 7-day heatmap strip with day labels */
function WeekHeatmap({ days }: { days: { date: string; completed: boolean }[] }) {
  // Pad to 7 if fewer entries
  const padded = Array.from({ length: 7 }, (_, i) => days[i] ?? { date: '', completed: false });
 
  return (
    <div className="flex gap-1.5">
      {padded.map((day, i) => {
        const label = day.date
          ? new Date(day.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)
          : WEEKDAY_LABELS[i].slice(0, 1);
 
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div
              title={day.date || ''}
              className={`
                w-full rounded-md transition-colors
                ${day.completed
                  ? 'bg-primary h-7'
                  : day.date
                    ? 'bg-surface-container-highest h-7'
                    : 'bg-surface-container-high/40 h-7 opacity-40'
                }
              `}
            />
            <span className="text-[9px] font-medium text-text-muted uppercase">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
 
/** Circular completion ring */
function CompletionRing({ pct, size = 48 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
 
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={4}
        className="stroke-surface-container-highest" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        className="stroke-primary transition-all duration-700" />
    </svg>
  );
}
 
/** Streak flame badge */
function StreakBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
      <Flame size={10} />
      {count}d
    </span>
  );
}
 
/** Habit row in the list panel */
function HabitRow({
  habit,
  isSelected,
  onSelect,
  onToggle,
}: {
  habit: Habit;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: (e: React.MouseEvent) => void;
}) {
  const catColor = CATEGORY_COLORS[habit.category] ?? 'bg-surface-container-high text-text-muted';
  const catIcon  = CATEGORY_ICONS[habit.category] ?? <Target size={14} />;
 
  return (
    <div
      onClick={onSelect}
      className={`
        px-4 py-3.5 flex items-center justify-between cursor-pointer
        transition-colors group
        ${isSelected
          ? 'bg-primary/8 border-l-2 border-l-primary'
          : 'border-l-2 border-l-transparent hover:bg-surface-container-high/40'
        }
      `}
    >
      {/* Left: icon + name + meta */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${catColor}`}>
          {catIcon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate leading-tight">
            {habit.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-text-muted">{habit.category}</span>
            <StreakBadge count={habit.streak ?? 0} />
          </div>
        </div>
      </div>
 
      {/* Right: completion % + toggle */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div className="relative flex items-center justify-center">
          <CompletionRing pct={habit.completionRate ?? 0} size={34} />
          <span className="absolute text-[9px] font-semibold text-text-secondary tabular-nums">
            {habit.completionRate ?? 0}%
          </span>
        </div>
        <button
          onClick={onToggle}
          aria-label={habit.isCompletedToday ? 'Mark incomplete' : 'Mark complete'}
          className={`
            p-1 rounded-md transition-colors cursor-pointer
            ${habit.isCompletedToday
              ? 'text-primary hover:text-primary/70'
              : 'text-text-muted hover:text-text-primary'
            }
          `}
        >
          {habit.isCompletedToday
            ? <CheckCircle size={18} />
            : <Circle size={18} />
          }
        </button>
      </div>
    </div>
  );
}
 
/** Stat tile used in the detail panel */
function StatTile({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="panel-elevated p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide">{label}</p>
        {icon && <span className="text-text-muted opacity-60">{icon}</span>}
      </div>
      <p className="text-xl font-semibold text-text-primary leading-none">{value}</p>
    </div>
  );
}
 
/** Log entry form in the detail panel */
function LogEntryForm({
  habit,
  onRefresh,
  onToggle,
}: {
  habit: Habit;
  onRefresh?: () => void;
  onToggle: (id: string) => void;
}) {
  const [date, setDate]     = useState(new Date().toISOString().split('T')[0]);
  const [value, setValue]   = useState('1');
  const [note, setNote]     = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]   = useState('');
 
  // Reset feedback when habit changes
  useEffect(() => {
    setSuccess('');
    setError('');
    setValue('1');
    setNote('');
  }, [habit.id]);
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
 
    try {
      await api.logHabit(habit.id, date, parseFloat(value) || 1, note);
      setSuccess('Entry saved.');
      setNote('');
      if (onRefresh) onRefresh();
      else onToggle(habit.id);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save log.');
    } finally {
      setLoading(false);
    }
  };
 
  const isYesNo = (habit.targetUnit ?? '').toUpperCase() === 'BOOL';
 
  return (
    <div className="space-y-3">
      {success && (
        <Alert variant="success" className="text-xs flex items-center gap-1.5 py-2">
          <CheckCheck size={12} /> {success}
        </Alert>
      )}
      {error && (
        <Alert variant="error" className="text-xs flex items-center gap-1.5 py-2">
          <AlertCircle size={12} /> {error}
        </Alert>
      )}
 
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="label flex items-center gap-1">
              <Calendar size={11} /> Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input-field text-xs"
            />
          </div>
 
          {!isYesNo && (
            <div className="space-y-1">
              <label className="label flex items-center gap-1">
                <Target size={11} /> Value
                <span className="text-text-muted normal-case font-normal">
                  ({habit.targetUnit?.toLowerCase() ?? 'count'})
                </span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={`Target: ${habit.targetValue ?? 1}`}
                className="input-field text-xs"
              />
            </div>
          )}
 
          {isYesNo && (
            <div className="space-y-1">
              <label className="label">Completed?</label>
              <select
                value={value}
                onChange={e => setValue(e.target.value)}
                className="input-field text-xs"
              >
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </div>
          )}
        </div>
 
        <div className="space-y-1">
          <label className="label">Note</label>
          <input
            type="text"
            placeholder="Optional reflection…"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="input-field text-xs"
          />
        </div>
 
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-1.5"
        >
          {loading
            ? <><Loader size={13} className="animate-spin" /> Saving…</>
            : <><Plus size={13} /> Save log</>
          }
        </button>
      </form>
    </div>
  );
}
 
// ─── Main component ───────────────────────────────────────────────────────────
 
export default function HabitsView({
  habits,
  onToggleHabit,
  onAddHabitClick,
  onRefresh,
}: HabitsViewProps) {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(
    habits.length > 0 ? habits[0].id : null
  );
  const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'in-progress'>('all');
  const [currentPage, setCurrentPage]   = useState(0);
  const [habitStats, setHabitStats]     = useState<HabitStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
 
  const selectedHabit = habits.find(h => h.id === selectedHabitId) ?? habits[0] ?? null;
 
  // Auto-select first habit when list changes
  useEffect(() => {
    if (!selectedHabitId && habits.length > 0) {
      setSelectedHabitId(habits[0].id);
    }
  }, [habits, selectedHabitId]);
 
  // Fetch stats whenever selected habit changes
  const fetchStats = useCallback(async (id: string) => {
    setStatsLoading(true);
    setHabitStats(null);
    try {
      const data = await api.getHabitStats(id);
      setHabitStats(data as HabitStats);
    } catch (err) {
      console.error('Failed to load habit stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);
 
  useEffect(() => {
    if (selectedHabitId) fetchStats(selectedHabitId);
  }, [selectedHabitId, fetchStats]);
 
  // Re-fetch stats after a log is saved (called via onRefresh)
  const handleRefresh = useCallback(() => {
    if (onRefresh) onRefresh();
    if (selectedHabitId) fetchStats(selectedHabitId);
  }, [onRefresh, selectedHabitId, fetchStats]);
 
  // ── Filtering + pagination ──────────────────────────────────────────────────
  const FILTER_LABELS: Record<typeof filterMode, string> = {
    all:          'All',
    completed:    'Completed',
    'in-progress':'In progress',
  };
 
  const filteredHabits = habits.filter(h => {
    if (filterMode === 'completed')    return h.isCompletedToday;
    if (filterMode === 'in-progress')  return !h.isCompletedToday;
    return true;
  });
 
  const totalPages    = Math.ceil(filteredHabits.length / ITEMS_PER_PAGE);
  const paginatedHabits = filteredHabits.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE,
  );
 
  // ── Aggregate stats ─────────────────────────────────────────────────────────
  const completedToday  = habits.filter(h => h.isCompletedToday).length;
  const completionPct   = habits.length > 0
    ? Math.round((completedToday / habits.length) * 100)
    : 0;
 
  const tabCounts: Record<typeof filterMode, number> = {
    all:          habits.length,
    completed:    habits.filter(h => h.isCompletedToday).length,
    'in-progress':habits.filter(h => !h.isCompletedToday).length,
  };
 
  // ── Detail panel data ───────────────────────────────────────────────────────
  const currentStreak  = habitStats?.current_streak  ?? selectedHabit?.streak   ?? 0;
  const longestStreak  = habitStats?.longest_streak  ?? 0;
  const completionRate = habitStats?.completion_rate ?? selectedHabit?.completionRate ?? 0;
  const todayStatus    = habitStats?.today_status    ?? (selectedHabit?.isCompletedToday ? 'completed' : 'pending');
  const last7Days      = habitStats?.last_7_days_status ?? [];
 
  return (
    <div className="space-y-5">
 
      {/* ── Top metric strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Active habits"    value={habits.length}          padding="sm" />
        <MetricCard
          label="Completed today"
          value={
            <>
              {completedToday}
              <span className="text-sm font-normal text-text-muted"> / {habits.length}</span>
            </>
          }
          padding="sm"
        />
        <MetricCard label="Completion rate"  value={`${completionPct}%`}    padding="sm" />
      </div>
 
      {/* ── Two-column layout ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
 
        {/* LEFT — Habit list */}
        <PanelSection
          className="lg:col-span-7 flex flex-col"
          flushBody
          title="Habits"
          description="Select a habit to view details"
          action={
            <div className="flex items-center gap-2">
              {/* Filter tabs */}
              <div className="flex bg-surface-container-high rounded-md p-0.5 gap-0.5">
                {(Object.keys(FILTER_LABELS) as (typeof filterMode)[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setFilterMode(mode); setCurrentPage(0); }}
                    className={`
                      relative px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer
                      ${filterMode === mode
                        ? 'bg-surface-container-highest text-text-primary'
                        : 'text-text-muted hover:text-text-secondary'
                      }
                    `}
                  >
                    {FILTER_LABELS[mode]}
                    {tabCounts[mode] > 0 && (
                      <span className={`
                        ml-1.5 text-[10px] px-1 py-0.5 rounded-full font-semibold
                        ${filterMode === mode
                          ? 'bg-primary/15 text-primary'
                          : 'bg-surface-container-highest text-text-muted'
                        }
                      `}>
                        {tabCounts[mode]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
 
              {/* New habit CTA */}
              <button
                onClick={onAddHabitClick}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <Plus size={13} /> New
              </button>
            </div>
          }
        >
          {filteredHabits.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                <CheckCheck size={18} className="text-text-muted" />
              </div>
              <p className="text-sm text-text-muted">
                {filterMode === 'completed'
                  ? 'No habits completed yet today.'
                  : filterMode === 'in-progress'
                    ? 'All habits done for today!'
                    : 'No habits yet. Create one to get started.'
                }
              </p>
              {filterMode === 'all' && (
                <button onClick={onAddHabitClick} className="btn-primary py-1.5 px-4 text-xs mt-1">
                  <Plus size={13} /> Add first habit
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {paginatedHabits.map(habit => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  isSelected={selectedHabit?.id === habit.id}
                  onSelect={() => setSelectedHabitId(habit.id)}
                  onToggle={e => { e.stopPropagation(); onToggleHabit(habit.id); }}
                />
              ))}
            </div>
          )}
 
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-2.5 flex items-center justify-between border-t border-border-subtle">
              <span className="text-xs text-text-muted">
                {currentPage * ITEMS_PER_PAGE + 1}–{Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredHabits.length)} of {filteredHabits.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
                  disabled={currentPage === 0}
                  className="btn-ghost py-1 px-2 disabled:opacity-30"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))}
                  disabled={currentPage === totalPages - 1}
                  className="btn-ghost py-1 px-2 disabled:opacity-30"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </PanelSection>
 
        {/* RIGHT — Detail panel */}
        <div className="lg:col-span-5">
          {selectedHabit ? (
            <Panel className="space-y-5">
 
              {/* Header */}
              <div className="pb-4 divider">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`
                        inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full
                        ${CATEGORY_COLORS[selectedHabit.category] ?? 'bg-surface-container-high text-text-muted'}
                      `}>
                        {CATEGORY_ICONS[selectedHabit.category]}
                        {selectedHabit.category}
                      </span>
                      <span className={`
                        inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full
                        ${todayStatus === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-surface-container-high text-text-muted'
                        }
                      `}>
                        {todayStatus === 'completed'
                          ? <><CheckCheck size={10} /> Done</>
                          : <><Clock size={10} /> Pending</>
                        }
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary leading-snug">
                      {selectedHabit.name}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Daily · target {selectedHabit.targetValue ?? 1}{' '}
                      {selectedHabit.targetUnit?.toLowerCase() ?? 'count'}
                    </p>
                  </div>
 
                  {statsLoading && (
                    <Loader size={14} className="animate-spin text-text-muted shrink-0 mt-1" />
                  )}
                </div>
              </div>
 
              {/* Habit stats grid */}
              <div className="space-y-2">
                <h4 className="label flex items-center gap-1.5">
                  <TrendingUp size={12} /> Habit stats
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <StatTile
                    label="Current streak"
                    value={
                      <span className="flex items-center gap-1.5">
                        {currentStreak}
                        <Flame size={14} className={currentStreak > 0 ? 'text-amber-400' : 'text-text-muted'} />
                      </span>
                    }
                  />
                  <StatTile
                    label="Longest streak"
                    value={
                      <span className="flex items-center gap-1.5">
                        {longestStreak}
                        <Trophy size={14} className={longestStreak > 0 ? 'text-amber-400' : 'text-text-muted'} />
                      </span>
                    }
                  />
                  <StatTile
                    label="Completion rate"
                    value={`${completionRate}%`}
                    icon={<Target size={13} />}
                  />
                  <StatTile
                    label="Total days done"
                    value={habitStats?.total_completed_days ?? '—'}
                    icon={<CheckCheck size={13} />}
                  />
                </div>
              </div>
 
              {/* 7-day heatmap */}
              <div className="space-y-2">
                <h4 className="label flex items-center gap-1.5">
                  <Calendar size={12} /> Last 7 days
                </h4>
                <div className="panel-elevated p-3">
                  {statsLoading && last7Days.length === 0 ? (
                    <div className="h-10 flex items-center justify-center">
                      <Loader size={14} className="animate-spin text-text-muted" />
                    </div>
                  ) : last7Days.length > 0 ? (
                    <WeekHeatmap days={last7Days} />
                  ) : (
                    /* Fallback: use history7d booleans from Habit type */
                    <div className="flex gap-1.5">
                      {(selectedHabit.history7d ?? Array(7).fill(false)).map((done: boolean, i: number) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                          <div className={`w-full h-7 rounded-md ${done ? 'bg-primary' : 'bg-surface-container-highest'}`} />
                          <span className="text-[9px] font-medium text-text-muted uppercase">
                            {WEEKDAY_LABELS[i].slice(0, 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
 
              {/* Log entry form */}
              <div className="space-y-3 pt-3 divider">
                <h4 className="label">Log entry</h4>
                <LogEntryForm
                  habit={selectedHabit}
                  onRefresh={handleRefresh}
                  onToggle={onToggleHabit}
                />
              </div>
 
            </Panel>
          ) : (
            <Panel padding="lg" className="flex items-center justify-center min-h-200px]">
              <EmptyState title="Create a habit to see details here." />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
 


// import React, { useState, useEffect } from 'react';
// import {
//   Flame, CheckCircle, Circle, ChevronLeft, ChevronRight,
//   Clipboard, Check, Plus, Loader, Info, Trophy
// } from 'lucide-react';
// import { Habit } from '../types';
// import { api } from '../api/client';
// import { Alert, EmptyState, MetricCard, Panel, PanelSection } from './ui';
 
// // Maps backend TARGET_UNIT_CHOICES to readable display labels
// const TARGET_UNIT_LABELS: Record<string, string> = {
//   MINUTES: 'min',
//   COUNT: 'reps',
//   BOOL: 'yes/no',
// };
 
// // Maps category to emoji — centralised so it's easy to extend
// const CATEGORY_ICON: Record<string, string> = {
//   Health: '❤️',
//   Productivity: '⚡',
//   Finance: '💵',
//   Education: '📖',
// };
 
// // Returns "Mon", "Tue" etc. from a date string like "2026-05-24"
// function getDayLabel(dateStr: string): string {
//   const d = new Date(dateStr);
//   return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1); // M T W T F S S
// }
 
// interface HabitsViewProps {
//   habits: Habit[];
//   onToggleHabit: (id: string) => void;
//   onAddHabitClick: () => void;
//   onRefresh?: () => void;
// }
 
// export default function HabitsView({
//   habits,
//   onToggleHabit,
//   onAddHabitClick,
//   onRefresh,
// }: HabitsViewProps) {
//   const [selectedHabitId, setSelectedHabitId] = useState<string | null>(
//     habits.length > 0 ? habits[0].id : null
//   );
//   const [currentPage, setCurrentPage] = useState(0);
//   const itemsPerPage = 5;
 
//   // FIX: renamed 'pending' → 'in_progress' to match the habit domain
//   // Habits are not tasks; they don't have a "pending" state — they're either done or in progress
//   const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'in_progress'>('all');
 
//   const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
//   const [logValue, setLogValue] = useState('1');
//   const [logNote, setLogNote] = useState('');
//   const [logLoading, setLogLoading] = useState(false);
//   const [logSuccess, setLogSuccess] = useState('');
//   const [logError, setLogError] = useState('');
 
//   const selectedHabit = habits.find(h => h.id === selectedHabitId)
//     ?? (habits.length > 0 ? habits[0] : null);
 
//   // Sync selectedHabitId if habits list changes and selection is stale
//   useEffect(() => {
//     if (!selectedHabitId && habits.length > 0) {
//       setSelectedHabitId(habits[0].id);
//     }
//   }, [habits, selectedHabitId]);
 
//   const [selectedHabitStats, setSelectedHabitStats] = useState<any>(null);
//   const [loadingSelectedStats, setLoadingSelectedStats] = useState(false);
 
//   useEffect(() => {
//     if (!selectedHabitId) {
//       setSelectedHabitStats(null);
//       return;
//     }
//     let active = true;
//     const fetchStats = async () => {
//       setLoadingSelectedStats(true);
//       try {
//         const stats = await api.getHabitStats(selectedHabitId);
//         if (active) setSelectedHabitStats(stats);
//       } catch (err) {
//         console.error('Failed to load habit stats:', err);
//       } finally {
//         if (active) setLoadingSelectedStats(false);
//       }
//     };
//     fetchStats();
//     return () => { active = false; };
//   }, [selectedHabitId, habits]);
 
//   // FIX: filter logic updated to use 'in_progress' key
//   const filteredHabits = habits.filter(h => {
//     if (filterMode === 'completed') return h.isCompletedToday;
//     if (filterMode === 'in_progress') return !h.isCompletedToday;
//     return true;
//   });
 
//   const paginatedHabits = filteredHabits.slice(
//     currentPage * itemsPerPage,
//     (currentPage + 1) * itemsPerPage
//   );
//   const maxPages = Math.ceil(filteredHabits.length / itemsPerPage);
 
//   const handleLogSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedHabit) return;
//     setLogLoading(true);
//     setLogError('');
//     setLogSuccess('');
//     try {
//       const valNumber = parseFloat(logValue) || 1;
//       await api.logHabit(selectedHabit.id, logDate, valNumber, logNote);
//       setLogSuccess('Log saved successfully.');
//       setLogNote('');
//       if (onRefresh) onRefresh();
//       else onToggleHabit(selectedHabit.id);
//     } catch (err: any) {
//       setLogError(err.message || 'Failed to save log.');
//     } finally {
//       setLogLoading(false);
//     }
//   };
 
//   const completedCount = habits.filter(h => h.isCompletedToday).length;
//   const completionPct = habits.length > 0
//     ? Math.round((completedCount / habits.length) * 100)
//     : 0;
 
//   // FIX: Normalise last_7_days_status from backend
//   // Backend returns: [{date: "2026-05-18", completed: true}, ...]
//   // We need: [{date, completed}] array — no fake fallbacks
//   const last7Days: { date: string; completed: boolean }[] = (() => {
//     const raw = selectedHabitStats?.last_7_days_status;
//     if (Array.isArray(raw) && raw.length > 0) {
//       return raw.map((item: any) => ({
//         date: item.date ?? '',
//         completed: item.completed === true || item.completed === 'yes',
//       }));
//     }
//     // Genuine fallback only when backend hasn't loaded yet: 7 empty slots
//     return Array.from({ length: 7 }, (_, i) => ({
//       date: '',
//       completed: false,
//     }));
//   })();
 
//   // FIX: Use real backend values only — no fake streak+4 or || 75 fallbacks
//   // Show '—' when data isn't loaded yet instead of fake numbers
//   const currentStreak = selectedHabitStats?.current_streak ?? null;
//   const longestStreak = selectedHabitStats?.longest_streak ?? null;
//   const completionRate = selectedHabitStats?.completion_rate ?? null;
//   const todayStatus = selectedHabitStats?.today_status ?? null;
 
//   // FIX: target_unit from backend is uppercase ("COUNT", "MINUTES", "BOOL")
//   // Map to readable label using centralised map
//   const targetUnitLabel = TARGET_UNIT_LABELS[selectedHabit?.targetUnit?.toUpperCase() ?? ''] ?? '';
 
//   // FIX: filter tab labels — 'in_progress' displays as 'In progress', not 'pending'
//   const filterLabels: Record<typeof filterMode, string> = {
//     all: 'All',
//     completed: 'Completed',
//     in_progress: 'In progress',
//   };
 
//   return (
//     <div className="space-y-6">
//       {/* Summary metric cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//         <MetricCard label="Active habits" value={habits.length} padding="sm" />
//         <MetricCard
//           label="Completed today"
//           value={
//             <>
//               {completedCount}
//               <span className="text-sm font-normal text-text-muted"> / {habits.length}</span>
//             </>
//           }
//           padding="sm"
//         />
//         <MetricCard label="Completion rate" value={`${completionPct}%`} padding="sm" />
//       </div>
 
//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//         {/* Left panel: habit list */}
//         <PanelSection
//           className="lg:col-span-7 flex flex-col"
//           flushBody
//           action={
//             <div className="flex items-center gap-2">
//               <div className="flex bg-surface-container-high rounded-md p-0.5">
//                 {/* FIX: filter tabs now use correct labels */}
//                 {(['all', 'completed', 'in_progress'] as const).map((mode) => (
//                   <button
//                     key={mode}
//                     onClick={() => { setFilterMode(mode); setCurrentPage(0); }}
//                     className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
//                       filterMode === mode
//                         ? 'bg-surface-container-highest text-text-primary'
//                         : 'text-text-muted hover:text-text-secondary'
//                     }`}
//                   >
//                     {filterLabels[mode]}
//                   </button>
//                 ))}
//               </div>
//               <button onClick={onAddHabitClick} className="btn-primary py-1.5 px-3 text-xs">
//                 <Plus size={14} />
//                 New
//               </button>
//             </div>
//           }
//           title="Habits"
//           description="Select a habit to view details"
//         >
//           {filteredHabits.length === 0 ? (
//             <div className="py-20 px-5">
//               <EmptyState title="No habits match this filter." />
//             </div>
//           ) : (
//             <div className="divide-y divide-border-subtle">
//               {paginatedHabits.map((habit) => {
//                 const isCur = selectedHabit?.id === habit.id;
//                 return (
//                   <div
//                     key={habit.id}
//                     onClick={() => setSelectedHabitId(habit.id)}
//                     className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
//                       isCur
//                         ? 'bg-surface-container-high'
//                         : 'hover:bg-surface-container-high/50'
//                     }`}
//                   >
//                     <div className="flex items-center gap-3 min-w-0">
//                       <div className="w-8 h-8 rounded-md bg-surface-container-highest flex items-center justify-center text-sm shrink-0">
//                         {CATEGORY_ICON[habit.category] ?? '📌'}
//                       </div>
//                       <div className="min-w-0">
//                         <p className="text-sm font-medium text-text-primary truncate">
//                           {habit.name}
//                         </p>
//                         <p className="text-xs text-text-muted mt-0.5">
//                           {/* FIX: show streak from real data only, not fake fallback */}
//                           {habit.category} · {habit.streak ?? 0}d streak
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-3 shrink-0">
//                       {/* FIX: removed `|| 75` fake fallback — show real rate or nothing */}
//                       {habit.completionRate != null && (
//                         <span className="text-xs text-text-muted tabular-nums">
//                           {habit.completionRate}%
//                         </span>
//                       )}
//                       <button
//                         onClick={(e) => { e.stopPropagation(); onToggleHabit(habit.id); }}
//                         className={`p-1.5 rounded-md transition-colors cursor-pointer ${
//                           habit.isCompletedToday
//                             ? 'text-success'
//                             : 'text-text-muted hover:text-text-primary'
//                         }`}
//                         aria-label={habit.isCompletedToday ? 'Mark incomplete' : 'Mark complete'}
//                       >
//                         {habit.isCompletedToday
//                           ? <CheckCircle size={18} />
//                           : <Circle size={18} />
//                         }
//                       </button>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
 
//           {maxPages > 1 && (
//             <div className="p-3 flex items-center justify-between border-t border-border-subtle">
//               <span className="text-xs text-text-muted">
//                 Page {currentPage + 1} of {maxPages}
//               </span>
//               <div className="flex gap-1">
//                 <button
//                   onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
//                   disabled={currentPage === 0}
//                   className="btn-ghost py-1 px-2 disabled:opacity-40"
//                 >
//                   <ChevronLeft size={16} />
//                 </button>
//                 <button
//                   onClick={() => setCurrentPage(p => Math.min(p + 1, maxPages - 1))}
//                   disabled={currentPage === maxPages - 1}
//                   className="btn-ghost py-1 px-2 disabled:opacity-40"
//                 >
//                   <ChevronRight size={16} />
//                 </button>
//               </div>
//             </div>
//           )}
//         </PanelSection>
 
//         {/* Right panel: habit detail */}
//         <div className="lg:col-span-5">
//           {selectedHabit ? (
//             <Panel className="space-y-6">
//               {/* Habit header */}
//               <div className="pb-4 divider">
//                 <span className="badge-accent">{selectedHabit.category}</span>
//                 <h3 className="text-base font-semibold text-text-primary mt-2">
//                   {selectedHabit.name}
//                 </h3>
//                 <p className="text-xs text-text-muted mt-1">
//                   {/* FIX: use mapped label, not raw backend value */}
//                   Daily · {selectedHabit.targetValue ?? 1} {targetUnitLabel}
//                 </p>
//               </div>
 
//               {/* FIX: renamed section from "Stats" → "Habit stats" */}
//               <div className="space-y-2">
//                 <div className="flex justify-between items-center">
//                   <h4 className="label">Habit stats</h4>
//                   {loadingSelectedStats && (
//                     <span className="text-xs text-text-muted flex items-center gap-1">
//                       <Loader size={10} className="animate-spin" />
//                       Loading…
//                     </span>
//                   )}
//                 </div>
//                 <div className="grid grid-cols-2 gap-2">
//                   <div className="panel-elevated p-3">
//                     <p className="text-xs text-text-muted">Current streak</p>
//                     <p className="text-lg font-semibold text-text-primary mt-1 flex items-center gap-1">
//                       {/* FIX: show '—' while loading, not a fake number */}
//                       {currentStreak !== null ? currentStreak : '—'}
//                       <Flame size={14} className="text-text-muted" />
//                     </p>
//                   </div>
//                   <div className="panel-elevated p-3">
//                     <p className="text-xs text-text-muted">Longest streak</p>
//                     <p className="text-lg font-semibold text-text-primary mt-1 flex items-center gap-1">
//                       {/* FIX: was streak+4 or hardcoded 10 — now uses real backend field */}
//                       {longestStreak !== null ? longestStreak : '—'}
//                       <Trophy size={14} className="text-text-muted" />
//                     </p>
//                   </div>
//                   <div className="panel-elevated p-3">
//                     <p className="text-xs text-text-muted">Completion rate</p>
//                     <p className="text-lg font-semibold text-text-primary mt-1">
//                       {/* FIX: was || 75 fallback — now real or '—' */}
//                       {completionRate !== null ? `${completionRate}%` : '—'}
//                     </p>
//                   </div>
//                   <div className="panel-elevated p-3">
//                     <p className="text-xs text-text-muted">Today</p>
//                     {/* FIX: use today_status from backend, not just isCompletedToday from local state */}
//                     <span className={`inline-block text-xs font-medium mt-2 ${
//                       todayStatus === 'completed' || selectedHabit.isCompletedToday
//                         ? 'text-success'
//                         : todayStatus === 'inactive'
//                         ? 'text-text-muted'
//                         : 'text-text-muted'
//                     }`}>
//                       {todayStatus === 'completed' || selectedHabit.isCompletedToday
//                         ? 'Done'
//                         : todayStatus === 'inactive'
//                         ? 'Inactive'
//                         : 'In progress'}
//                     </span>
//                   </div>
//                 </div>
//               </div>
 
//               {/* Last 7 days heatmap */}
//               <div className="space-y-2">
//                 <h4 className="label">Last 7 days</h4>
//                 <div className="panel-elevated p-3 flex justify-between items-end gap-1">
//                   {last7Days.map((day, idx) => (
//                     <div key={idx} className="flex-1 flex flex-col items-center gap-1">
//                       <div
//                         className={`w-full h-8 rounded-sm ${
//                           day.completed ? 'bg-primary' : 'bg-surface-container-highest'
//                         }`}
//                         title={day.date || undefined}
//                       />
//                       {/* FIX: show actual day initial (M/T/W) not D1/D2/D3 */}
//                       <span className="text-[10px] text-text-muted">
//                         {day.date ? getDayLabel(day.date) : '·'}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
 
//               {/* Log entry form */}
//               <div className="space-y-3 pt-2 divider">
//                 <h4 className="label flex items-center gap-1.5">
//                   <Clipboard size={14} />
//                   Log entry
//                 </h4>
 
//                 {logSuccess && (
//                   <Alert variant="success" className="flex items-center gap-1.5 text-xs">
//                     <Check size={12} />
//                     {logSuccess}
//                   </Alert>
//                 )}
//                 {logError && (
//                   <Alert variant="error" className="flex items-center gap-1.5 text-xs">
//                     <Info size={12} />
//                     {logError}
//                   </Alert>
//                 )}
 
//                 <form onSubmit={handleLogSubmit} className="space-y-3">
//                   <div className="grid grid-cols-2 gap-2">
//                     <div className="space-y-1">
//                       <label className="label">Date</label>
//                       <input
//                         type="date"
//                         required
//                         value={logDate}
//                         onChange={(e) => setLogDate(e.target.value)}
//                         className="input-field text-xs"
//                       />
//                     </div>
//                     <div className="space-y-1">
//                       {/* FIX: show target unit in label so user knows what unit to enter */}
//                       <label className="label">
//                         Value {targetUnitLabel ? `(${targetUnitLabel})` : ''}
//                       </label>
//                       <input
//                         type="number"
//                         step="any"
//                         required
//                         value={logValue}
//                         onChange={(e) => setLogValue(e.target.value)}
//                         placeholder={`${selectedHabit.targetValue ?? 1}`}
//                         className="input-field text-xs"
//                       />
//                     </div>
//                   </div>
//                   <div className="space-y-1">
//                     {/* FIX: "Note" not "Note (optional)" — optionality is implied by the placeholder */}
//                     <label className="label">Note</label>
//                     <input
//                       type="text"
//                       placeholder="Optional reflection"
//                       value={logNote}
//                       onChange={(e) => setLogNote(e.target.value)}
//                       className="input-field text-xs"
//                     />
//                   </div>
//                   <button
//                     type="submit"
//                     disabled={logLoading}
//                     className="w-full btn-primary"
//                   >
//                     {logLoading ? (
//                       <>
//                         <Loader size={14} className="animate-spin" />
//                         Saving…
//                       </>
//                     ) : (
//                       <>
//                         <Plus size={14} />
//                         Save log
//                       </>
//                     )}
//                   </button>
//                 </form>
//               </div>
//             </Panel>
//           ) : (
//             <Panel padding="lg">
//               <EmptyState title="Create a habit to see details here." />
//             </Panel>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }





// import React, { useState, useEffect } from 'react';
// import { Flame, CheckCircle, Circle, ChevronLeft, ChevronRight, Clipboard, Check, Plus, Loader, Info, Trophy } from 'lucide-react';
// import { Habit } from '../types';
// import { api } from '../api/client';
// import { Alert, EmptyState, MetricCard, Panel, PanelSection } from './ui';

// interface HabitsViewProps {
//   habits: Habit[];
//   onToggleHabit: (id: string) => void;
//   onAddHabitClick: () => void;
//   onRefresh?: () => void;
// }

// export default function HabitsView({ habits, onToggleHabit, onAddHabitClick, onRefresh }: HabitsViewProps) {
//   const [selectedHabitId, setSelectedHabitId] = useState<string | null>(
//     habits.length > 0 ? habits[0].id : null
//   );
//   const [currentPage, setCurrentPage] = useState(0);
//   const itemsPerPage = 5;
//   const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'pending'>('all');
//   const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
//   const [logValue, setLogValue] = useState('1');
//   const [logNote, setLogNote] = useState('');
//   const [logLoading, setLogLoading] = useState(false);
//   const [logSuccess, setLogSuccess] = useState('');
//   const [logError, setLogError] = useState('');

//   const selectedHabit = habits.find(h => h.id === selectedHabitId) || (habits.length > 0 ? habits[0] : null);

//   if (!selectedHabitId && habits.length > 0) {
//     setSelectedHabitId(habits[0].id);
//   }

//   const [selectedHabitStats, setSelectedHabitStats] = useState<any>(null);
//   const [loadingSelectedStats, setLoadingSelectedStats] = useState(false);

//   useEffect(() => {
//     if (!selectedHabitId) {
//       setSelectedHabitStats(null);
//       return;
//     }

//     let active = true;
//     const fetchBackendStats = async () => {
//       setLoadingSelectedStats(true);
//       try {
//         const stats = await api.getHabitStats(selectedHabitId);
//         if (active) setSelectedHabitStats(stats);
//       } catch (err) {
//         console.error('Error loading specific backend habit statistics:', err);
//       } finally {
//         if (active) setLoadingSelectedStats(false);
//       }
//     };

//     fetchBackendStats();
//     return () => { active = false; };
//   }, [selectedHabitId, habits]);

//   const filteredHabits = habits.filter(h => {
//     if (filterMode === 'completed') return h.isCompletedToday;
//     if (filterMode === 'pending') return !h.isCompletedToday;
//     return true;
//   });

//   const paginatedHabits = filteredHabits.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
//   const maxPages = Math.ceil(filteredHabits.length / itemsPerPage);

//   const handleLogSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedHabit) return;

//     setLogLoading(true);
//     setLogError('');
//     setLogSuccess('');

//     try {
//       const valNumber = parseFloat(logValue) || 1;
//       await api.logHabit(selectedHabit.id, logDate, valNumber, logNote);
//       setLogSuccess('Log saved successfully.');
//       setLogNote('');
//       if (onRefresh) onRefresh();
//       else onToggleHabit(selectedHabit.id);
//     } catch (err: any) {
//       setLogError(err.message || 'Failed to save log.');
//     } finally {
//       setLogLoading(false);
//     }
//   };

//   const completedCount = habits.filter(h => h.isCompletedToday).length;
//   const completionPct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

//   return (
//     <div className="space-y-6">
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//         <MetricCard label="Active habits" value={habits.length} padding="sm" />
//         <MetricCard
//           label="Completed today"
//           value={
//             <>
//               {completedCount}
//               <span className="text-sm font-normal text-text-muted"> / {habits.length}</span>
//             </>
//           }
//           padding="sm"
//         />
//         <MetricCard label="Completion rate" value={`${completionPct}%`} padding="sm" />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//         <PanelSection
//           className="lg:col-span-7 flex flex-col"
//           flushBody
//           action={
//             <div className="flex items-center gap-2">
//               <div className="flex bg-surface-container-high rounded-md p-0.5">
//                 {(['all', 'completed', 'pending'] as const).map((mode) => (
//                   <button
//                     key={mode}
//                     onClick={() => { setFilterMode(mode); setCurrentPage(0); }}
//                     className={`px-2.5 py-1 text-xs font-medium rounded capitalize transition-colors cursor-pointer ${
//                       filterMode === mode ? 'bg-surface-container-highest text-text-primary' : 'text-text-muted hover:text-text-secondary'
//                     }`}
//                   >
//                     {mode}
//                   </button>
//                 ))}
//               </div>
//               <button onClick={onAddHabitClick} className="btn-primary py-1.5 px-3 text-xs">
//                 <Plus size={14} />
//                 New
//               </button>
//             </div>
//           }
//           title="Habits"
//           description="Select a habit to view details"
//         >
//           {filteredHabits.length === 0 ? (
//             <div className="py-20 px-5">
//               <EmptyState title="No habits match this filter." />
//             </div>
//           ) : (
//             <div className="divide-y divide-border-subtle">
//               {paginatedHabits.map((habit) => {
//                 const isCur = selectedHabit?.id === habit.id;
//                 return (
//                   <div
//                     key={habit.id}
//                     onClick={() => setSelectedHabitId(habit.id)}
//                     className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
//                       isCur ? 'bg-surface-container-high' : 'hover:bg-surface-container-high/50'
//                     }`}
//                   >
//                     <div className="flex items-center gap-3 min-w-0">
//                       <div className="w-8 h-8 rounded-md bg-surface-container-highest flex items-center justify-center text-sm shrink-0">
//                         {habit.category === 'Health' ? '❤️' : habit.category === 'Productivity' ? '⚡' : habit.category === 'Finance' ? '💵' : '📖'}
//                       </div>
//                       <div className="min-w-0">
//                         <p className="text-sm font-medium text-text-primary truncate">{habit.name}</p>
//                         <p className="text-xs text-text-muted mt-0.5">
//                           {habit.category} · {habit.streak}d streak
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-3 shrink-0">
//                       <span className="text-xs text-text-muted tabular-nums">{habit.completionRate || 75}%</span>
//                       <button
//                         onClick={(e) => { e.stopPropagation(); onToggleHabit(habit.id); }}
//                         className={`p-1.5 rounded-md transition-colors cursor-pointer ${
//                           habit.isCompletedToday ? 'text-success' : 'text-text-muted hover:text-text-primary'
//                         }`}
//                       >
//                         {habit.isCompletedToday ? <CheckCircle size={18} /> : <Circle size={18} />}
//                       </button>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           {maxPages > 1 && (
//             <div className="p-3 flex items-center justify-between border-t border-border-subtle">
//               <span className="text-xs text-text-muted">Page {currentPage + 1} of {maxPages}</span>
//               <div className="flex gap-1">
//                 <button
//                   onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
//                   disabled={currentPage === 0}
//                   className="btn-ghost py-1 px-2 disabled:opacity-40"
//                 >
//                   <ChevronLeft size={16} />
//                 </button>
//                 <button
//                   onClick={() => setCurrentPage(p => Math.min(p + 1, maxPages - 1))}
//                   disabled={currentPage === maxPages - 1}
//                   className="btn-ghost py-1 px-2 disabled:opacity-40"
//                 >
//                   <ChevronRight size={16} />
//                 </button>
//               </div>
//             </div>
//           )}
//         </PanelSection>

//         <div className="lg:col-span-5">
//           {selectedHabit ? (
//             <Panel className="space-y-6">
//               <div className="pb-4 divider">
//                 <span className="badge-accent">{selectedHabit.category}</span>
//                 <h3 className="text-base font-semibold text-text-primary mt-2">{selectedHabit.name}</h3>
//                 <p className="text-xs text-text-muted mt-1">
//                   Daily · {selectedHabit.targetValue || 1} {selectedHabit.targetUnit || 'yes/no'}
//                 </p>
//               </div>

//               <div className="space-y-2">
//                 <div className="flex justify-between items-center">
//                   <h4 className="label">Stats</h4>
//                   {loadingSelectedStats && <span className="text-xs text-text-muted">Updating…</span>}
//                 </div>
//                 <div className="grid grid-cols-2 gap-2">
//                   <div className="panel-elevated p-3">
//                     <p className="text-xs text-text-muted">Current streak</p>
//                     <p className="text-lg font-semibold text-text-primary mt-1 flex items-center gap-1">
//                       {selectedHabitStats?.current_streak ?? selectedHabitStats?.streak ?? selectedHabit.streak}
//                       <Flame size={14} className="text-text-muted" />
//                     </p>
//                   </div>
//                   <div className="panel-elevated p-3">
//                     <p className="text-xs text-text-muted">Longest streak</p>
//                     <p className="text-lg font-semibold text-text-primary mt-1 flex items-center gap-1">
//                       {selectedHabitStats?.longest_streak ?? (selectedHabit.streak > 0 ? selectedHabit.streak + 4 : 10)}
//                       <Trophy size={14} className="text-text-muted" />
//                     </p>
//                   </div>
//                   <div className="panel-elevated p-3">
//                     <p className="text-xs text-text-muted">Completion</p>
//                     <p className="text-lg font-semibold text-text-primary mt-1">
//                       {selectedHabitStats?.completion_rate ?? selectedHabit.completionRate ?? 75}%
//                     </p>
//                   </div>
//                   <div className="panel-elevated p-3">
//                     <p className="text-xs text-text-muted">Today</p>
//                     <span className={`inline-block text-xs font-medium mt-2 ${selectedHabit.isCompletedToday ? 'text-success' : 'text-text-muted'}`}>
//                       {selectedHabit.isCompletedToday ? 'Done' : 'Pending'}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <h4 className="label">Last 7 days</h4>
//                 <div className="panel-elevated p-3 flex justify-between items-end gap-1">
//                   {((selectedHabitStats?.last_7_days && Array.isArray(selectedHabitStats.last_7_days))
//                     ? selectedHabitStats.last_7_days.map((item: any) => {
//                         if (typeof item === 'boolean') return item;
//                         if (typeof item === 'object' && item !== null) {
//                           return item.completed === 'yes' || item.completed === true || item.status === 'completed';
//                         }
//                         return !!item;
//                       })
//                     : selectedHabit.history7d)?.map((val: boolean, idx: number) => (
//                     <div key={idx} className="flex-1 flex flex-col items-center gap-1">
//                       <div className={`w-full h-8 rounded-sm ${val ? 'bg-primary' : 'bg-surface-container-highest'}`} />
//                       <span className="text-[10px] text-text-muted">D{idx + 1}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="space-y-3 pt-2 divider">
//                 <h4 className="label flex items-center gap-1.5">
//                   <Clipboard size={14} />
//                   Log entry
//                 </h4>

//                 {logSuccess && (
//                   <Alert variant="success" className="flex items-center gap-1.5 text-xs">
//                     <Check size={12} />
//                     {logSuccess}
//                   </Alert>
//                 )}
//                 {logError && (
//                   <Alert variant="error" className="flex items-center gap-1.5 text-xs">
//                     <Info size={12} />
//                     {logError}
//                   </Alert>
//                 )}

//                 <form onSubmit={handleLogSubmit} className="space-y-3">
//                   <div className="grid grid-cols-2 gap-2">
//                     <div className="space-y-1">
//                       <label className="label">Date</label>
//                       <input type="date" required value={logDate} onChange={(e) => setLogDate(e.target.value)} className="input-field text-xs" />
//                     </div>
//                     <div className="space-y-1">
//                       <label className="label">Value</label>
//                       <input
//                         type="number"
//                         step="any"
//                         required
//                         value={logValue}
//                         onChange={(e) => setLogValue(e.target.value)}
//                         placeholder={`1 ${selectedHabit.targetUnit || ''}`}
//                         className="input-field text-xs"
//                       />
//                     </div>
//                   </div>
//                   <div className="space-y-1">
//                     <label className="label">Note</label>
//                     <input
//                       type="text"
//                       placeholder="Optional reflection"
//                       value={logNote}
//                       onChange={(e) => setLogNote(e.target.value)}
//                       className="input-field text-xs"
//                     />
//                   </div>
//                   <button type="submit" disabled={logLoading} className="w-full btn-primary">
//                     {logLoading ? (
//                       <>
//                         <Loader size={14} className="animate-spin" />
//                         Saving…
//                       </>
//                     ) : (
//                       <>
//                         <Plus size={14} />
//                         Save log
//                       </>
//                     )}
//                   </button>
//                 </form>
//               </div>
//             </Panel>
//           ) : (
//             <Panel padding="lg">
//               <EmptyState title="Create a habit to see details here." />
//             </Panel>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
