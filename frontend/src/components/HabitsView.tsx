import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
} from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { api } from '../api/client';
import { Alert, EmptyState, MetricCard, PageHeader, Panel, PanelSection } from './ui';

interface HabitsViewProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void | Promise<void>;
  onAddHabitClick: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habit: Habit) => void;
  isLoading: boolean;
}

type HabitSection = 'today' | 'all' | 'history';

const currencylessUnit: Record<string, string> = {
  MINUTES: 'min',
  COUNT: 'count',
  BOOL: 'yes / no',
};

function localDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatLongDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function HabitIcon() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Target size={18} />
    </span>
  );
}

function SectionTabs({
  value,
  onChange,
}: {
  value: HabitSection;
  onChange: (section: HabitSection) => void;
}) {
  const tabs: Array<{ value: HabitSection; label: string; icon: typeof CheckCircle2 }> = [
    { value: 'today', label: 'Today', icon: CheckCircle2 },
    { value: 'all', label: 'All habits', icon: Target },
    { value: 'history', label: 'History', icon: CalendarDays },
  ];

  return (
    <div role="tablist" aria-label="Habit views" className="flex w-full gap-1 overflow-x-auto rounded-xl border border-border-subtle bg-surface-container-low p-1 sm:w-fit">
      {tabs.map(({ value: tab, label, icon: Icon }) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={value === tab}
          onClick={() => onChange(tab)}
          className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:px-4 ${
            value === tab ? 'bg-primary/15 text-primary ring-1 ring-primary/20' : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}

function HabitCheckRow({
  habit,
  pending,
  onToggle,
}: {
  habit: Habit;
  pending: boolean;
  onToggle: () => void;
}) {
  const done = habit.isCompletedToday;
  const unit = habit.targetUnit ?? 'COUNT';
  return (
    <li className={`flex min-w-0 items-center gap-3 px-4 py-4 transition-colors sm:px-6 ${done ? 'bg-success/[0.025]' : 'hover:bg-white/[0.02]'}`}>
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-label={done ? `Undo ${habit.name} completion` : `Complete ${habit.name}`}
        aria-pressed={done}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-50 ${
          done ? 'bg-success/10 text-success' : 'bg-surface-container-high text-text-muted hover:bg-primary/10 hover:text-primary'
        }`}
      >
        {done ? <CheckCircle2 size={21} /> : <Circle size={21} />}
      </button>
      <HabitIcon />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${done ? 'text-text-secondary' : 'text-text-primary'}`}>{habit.name}</p>
        <p className="mt-1 truncate text-xs text-text-muted">
          Daily
          {unit !== 'BOOL' ? ` · ${habit.targetValue} ${currencylessUnit[unit] ?? unit.toLowerCase()}` : ''}
        </p>
      </div>
      <span className={`min-w-[4.5rem] shrink-0 text-right text-xs font-medium ${done ? 'text-success' : pending ? 'text-primary' : 'text-text-muted'}`}>
        {pending ? 'Saving…' : done ? 'Complete' : 'To do'}
      </span>
    </li>
  );
}

function ManageHabitRow({
  habit,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const unit = habit.targetUnit ?? 'COUNT';
  return (
    <li className="flex min-w-0 items-center gap-3 px-4 py-4 transition-colors hover:bg-white/[0.02] sm:px-6">
      <HabitIcon />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{habit.name}</p>
        <p className="mt-1 truncate text-xs text-text-muted">
          Daily
          {unit !== 'BOOL' ? ` · target ${habit.targetValue} ${currencylessUnit[unit] ?? unit.toLowerCase()}` : ''}
        </p>
      </div>
      <span className={`badge ${habit.isActive ? '' : 'text-text-muted'}`}>{habit.isActive ? 'Active' : 'Inactive'}</span>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" className="icon-button" onClick={onEdit} aria-label={`Edit ${habit.name}`} title="Edit habit">
          <Pencil size={16} />
        </button>
        <button type="button" className="icon-button hover:!text-error" onClick={onDelete} aria-label={`Delete ${habit.name}`} title="Delete habit">
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}

function HistoryPanel({ habits }: { habits: Habit[] }) {
  const [month, setMonth] = useState(() => localDateString(new Date()).slice(0, 7));
  const [logs, setLogs] = useState<Array<{ log: HabitLog; habit: Habit }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const maxMonth = localDateString(new Date()).slice(0, 7);

  useEffect(() => {
    let active = true;
    if (habits.length === 0) {
      setLogs([]);
      setError(null);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError(null);
    api.getHabitLogs()
      .then((habitLogs) => {
        const habitById = new Map(habits.map((habit) => [Number(habit.id), habit]));
        if (active) {
          setLogs(
            habitLogs
              .flatMap((log) => {
                const habit = habitById.get(log.habit);
                return habit ? [{ log, habit }] : [];
              })
              .sort((a, b) => b.log.date.localeCompare(a.log.date)),
          );
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load habit history.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [habits, reloadKey]);

  const visibleLogs = useMemo(
    () => logs.filter(({ log }) => log.date.startsWith(month)),
    [logs, month],
  );
  const groupedLogs = useMemo(() => {
    const groups = new Map<string, Array<{ log: HabitLog; habit: Habit }>>();
    for (const entry of visibleLogs) {
      const current = groups.get(entry.log.date) ?? [];
      current.push(entry);
      groups.set(entry.log.date, current);
    }
    return [...groups.entries()];
  }, [visibleLogs]);

  const changeMonth = (direction: -1 | 1) => {
    const [year, value] = month.split('-').map(Number);
    const next = new Date(year, value - 1 + direction, 1);
    setMonth(localDateString(next).slice(0, 7));
  };
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  if (habits.length === 0) {
    return <EmptyState title="No habit history yet" description="Create a habit and log check-ins to see your past activity here." className="px-5 py-12" />;
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-border-subtle px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Completion history</h2>
          <p className="mt-1 text-xs text-text-muted">Recorded check-ins by date. History is read-only here.</p>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button type="button" className="icon-button" onClick={() => changeMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <label className="min-w-36 text-center text-sm font-medium text-text-primary">
            <span className="sr-only">Choose history month</span>
            <input
              type="month"
              value={month}
              max={maxMonth}
              onChange={(event) => event.target.value && setMonth(event.target.value)}
              className="input-field py-2 text-center"
            />
          </label>
          <button type="button" className="icon-button" onClick={() => changeMonth(1)} disabled={month >= maxMonth} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5">
          <Alert variant="error" className="flex flex-wrap items-center justify-between gap-3">
            <span>Couldn’t load completion history: {error}</span>
            <button type="button" className="btn-secondary min-h-9 px-3 text-xs" onClick={() => setReloadKey((key) => key + 1)}>Retry</button>
          </Alert>
        </div>
      )}
      {loading ? (
        <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading habit history">
          {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-surface-container-high/60" />)}
        </div>
      ) : !error && groupedLogs.length === 0 ? (
        <div className="px-5 py-12">
          <EmptyState title={`No check-ins in ${monthLabel}`} description="When you log habits, those records will appear here." />
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {groupedLogs.map(([date, entries]) => (
            <section key={date} className="px-4 py-4 sm:px-6">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <CalendarDays size={14} className="text-primary" />
                {formatLongDate(date)}
              </h3>
              <ul className="space-y-2">
                {entries.map(({ log, habit }) => {
                  const complete = log.value >= (habit.targetValue ?? 1);
                  return (
                    <li key={log.id} className="flex min-w-0 items-center gap-3 rounded-xl bg-surface-container-low/70 px-3 py-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${complete ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {complete ? <Check size={17} /> : <Clock3 size={17} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">{habit.name}</p>
                        {log.note && <p className="mt-1 truncate text-xs text-text-muted">{log.note}</p>}
                      </div>
                      <span className={`shrink-0 text-xs font-medium ${complete ? 'text-success' : 'text-warning'}`}>
                        {complete ? 'Complete' : habit.targetUnit === 'BOOL' ? 'Not complete' : `${log.value} / ${habit.targetValue ?? 1}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HabitsView({
  habits,
  onToggleHabit,
  onAddHabitClick,
  onEditHabit,
  onDeleteHabit,
  isLoading,
}: HabitsViewProps) {
  const [section, setSection] = useState<HabitSection>('today');
  const [search, setSearch] = useState('');
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

  const today = localDateString(new Date());
  const dueHabits = useMemo(
    () => habits.filter((habit) => habit.isActive && habit.frequency === 'DAILY' && habit.createdDate <= today),
    [habits, today],
  );
  const completed = dueHabits.filter((habit) => habit.isCompletedToday).length;
  const completionRate = dueHabits.length > 0 ? Math.round((completed / dueHabits.length) * 100) : 0;
  const filteredHabits = habits.filter((habit) => {
    return habit.name.toLowerCase().includes(search.trim().toLowerCase());
  });

  const toggleHabit = useCallback(async (id: string) => {
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
  }, [onToggleHabit]);

  if (isLoading && habits.length === 0) {
    return (
      <div className="app-page w-full pb-8" aria-busy="true" aria-label="Loading habits">
        <div className="h-20 animate-pulse rounded-2xl bg-surface-container-high/70" />
        <div className="h-12 w-64 animate-pulse rounded-xl bg-surface-container-high/70" />
        <div className="space-y-3 rounded-2xl border border-border-subtle bg-surface-container p-5">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-surface-container-high/60" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="app-page w-full pb-8">
      <PageHeader
        title="Habits"
        subtitle="Build a rhythm that feels good to keep."
        actions={
          <button type="button" onClick={onAddHabitClick} className="btn-primary w-full sm:w-auto">
            <Plus size={16} /> New habit
          </button>
        }
      />

      <SectionTabs value={section} onChange={setSection} />

      {section === 'today' && (
        <>
          <section aria-label="Today's habit progress" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard label="Today’s progress" value={<>{completed}<span className="ml-1 text-lg font-medium text-text-muted">/ {dueHabits.length}</span></>} icon={CheckCircle2} progress={dueHabits.length ? completionRate : undefined} footer={dueHabits.length ? `${completionRate}% complete` : 'No habits due yet'} />
            <MetricCard label="Habits to go" value={Math.max(0, dueHabits.length - completed)} icon={Target} footer={dueHabits.length ? 'Check in when you finish' : 'Create a habit to get started'} />
          </section>

          <PanelSection
            title="Your daily check-in"
            description={dueHabits.length ? `${completed} of ${dueHabits.length} routines complete` : 'A small step today adds up'}
            flushBody
          >
            {dueHabits.length === 0 ? (
              <div className="px-5 py-12">
                <EmptyState
                  title="Start with one small habit"
                  description="Create a daily routine and your check-ins will appear here."
                  action={<button type="button" onClick={onAddHabitClick} className="btn-primary"><Plus size={15} /> Create a habit</button>}
                />
              </div>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {dueHabits.map((habit) => (
                  <HabitCheckRow
                    key={habit.id}
                    habit={habit}
                    pending={pendingIds.has(habit.id)}
                    onToggle={() => void toggleHabit(habit.id)}
                  />
                ))}
              </ul>
            )}
          </PanelSection>
        </>
      )}

      {section === 'all' && (
        <PanelSection
          title="All habits"
          description={`${filteredHabits.length} ${filteredHabits.length === 1 ? 'routine' : 'routines'} · edit or remove a habit from here`}
          flushBody
          action={<span className="badge">{habits.length} total</span>}
        >
          <div className="flex flex-col gap-3 border-b border-border-subtle px-4 py-4 sm:flex-row sm:items-center sm:px-6">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search habits</span>
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="input-field pl-9" placeholder="Search habits" />
            </label>
          </div>
          {filteredHabits.length === 0 ? (
            <div className="px-5 py-12">
              <EmptyState
                title={habits.length ? 'No habits match these filters' : 'No habits created yet'}
                description={habits.length ? 'Try another search or category.' : 'Create a habit to start building your daily rhythm.'}
                action={!habits.length ? <button type="button" className="btn-primary" onClick={onAddHabitClick}><Plus size={15} /> New habit</button> : undefined}
              />
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {filteredHabits.map((habit) => (
                <ManageHabitRow
                  key={habit.id}
                  habit={habit}
                  onEdit={() => onEditHabit(habit)}
                  onDelete={() => onDeleteHabit(habit)}
                />
              ))}
            </ul>
          )}
        </PanelSection>
      )}

      {section === 'history' && (
        <Panel padding="none" className="overflow-hidden">
          <HistoryPanel habits={habits} />
        </Panel>
      )}
    </div>
  );
}
