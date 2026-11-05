import React, { useState } from 'react';
import { Target, CalendarDays, Repeat, Ruler, FileText, Info } from 'lucide-react';
import { HabitCreatePayload } from '../types';
import { PageHeader, Panel, Alert } from './ui';
 
// Matches backend TARGET_UNIT_CHOICES
type TargetUnit = 'MINUTES' | 'COUNT' | 'BOOL';
 
interface AddHabitViewProps {
  onSaveHabit: (habit: HabitCreatePayload) => Promise<void>;
  onSuccessNavigate: () => void;
}
 
const UNIT_OPTIONS: { value: TargetUnit; label: string; hint: string }[] = [
  { value: 'COUNT',   label: 'Count',    hint: 'e.g. 10 push-ups, 20 pages' },
  { value: 'MINUTES', label: 'Minutes',  hint: 'e.g. 30 min of running'     },
  { value: 'BOOL',    label: 'Yes / No', hint: 'Simply did it or not'        },
];
 
export default function AddHabitView({ onSaveHabit, onSuccessNavigate }: AddHabitViewProps) {
  const [name,        setName]        = useState('');
  const [targetValue, setTargetValue] = useState('1');
  const [targetUnit,  setTargetUnit]  = useState<TargetUnit>('COUNT');
  const [startDate,   setStartDate]   = useState(new Date().toISOString().split('T')[0]);
  const [error,       setError]       = useState('');
  const [isSaving,    setIsSaving]    = useState(false);
 
  const isBool = targetUnit === 'BOOL';
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
 
    if (!name.trim()) {
      setError('Please enter a habit name.');
      return;
    }
 
    const tv = parseInt(targetValue, 10);
    if (!isBool && (isNaN(tv) || tv < 1)) {
      setError('Target value must be at least 1.');
      return;
    }
 
    setIsSaving(true);
    try {
      await onSaveHabit({
        name: name.trim(),
        frequency: 'DAILY',
        targetValue: isBool ? 1 : tv,
        targetUnit,
        createdDate: startDate,
      });
      onSuccessNavigate();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create the habit. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
 
  return (
    <div className="app-page mx-auto w-full max-w-4xl">
      <PageHeader
        title="Create habit"
        subtitle="Define a daily habit to track."
      />
 
      <Panel padding="lg">
        {error && (
          <Alert variant="error" className="mb-4 text-sm flex items-center gap-1.5">
            <Info size={13} /> {error}
          </Alert>
        )}
 
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
 
          {/* Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="label flex items-center gap-1.5">
              <FileText size={13} /> Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Morning run, Read 20 pages"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isSaving}
              className="input-field"
            />
          </div>
 
          {/* Target unit */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="label flex items-center gap-1.5">
              <Ruler size={13} /> Measurement type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {UNIT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setTargetUnit(opt.value); if (opt.value === 'BOOL') setTargetValue('1'); }}
                  disabled={isSaving}
                  className={`
                    rounded-xl border px-2 py-3 text-xs font-medium transition-all cursor-pointer text-center
                    ${targetUnit === opt.value
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border-subtle bg-surface-container-low text-text-secondary hover:border-outline hover:text-text-primary'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted px-0.5">
              {UNIT_OPTIONS.find(o => o.value === targetUnit)?.hint}
            </p>
          </div>
 
          {/* Target value — hidden for BOOL */}
          {!isBool && (
            <div className="space-y-1.5">
              <label className="label flex items-center gap-1.5">
                <Target size={13} /> Daily target
                <span className="text-text-muted font-normal normal-case">
                  ({targetUnit === 'MINUTES' ? 'minutes' : 'times'})
                </span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetValue}
                onChange={e => setTargetValue(e.target.value)}
                  disabled={isSaving}
                placeholder="e.g. 30"
                className="input-field"
              />
            </div>
          )}
 
          {/* Start date */}
          <div className="space-y-1.5">
            <label className="label flex items-center gap-1.5">
              <CalendarDays size={13} /> Start date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-field"
              disabled={isSaving}
            />
          </div>
 
          {/* Frequency note */}
          <div className="panel-elevated flex items-start gap-2 rounded-xl p-3 md:col-span-2">
            <Repeat size={13} className="text-text-muted mt-0.5 shrink-0" />
            <p className="text-xs text-text-muted leading-relaxed">
              Habits are tracked <strong className="text-text-secondary font-medium">daily</strong>.
              Your habit will appear on the dashboard each day for you to log.
            </p>
          </div>
 
          {/* Actions */}
          <div className="divider flex gap-3 pt-5 md:col-span-2">
            <button
              type="button"
              onClick={onSuccessNavigate}
              disabled={isSaving}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="flex-[2] btn-primary">
              {isSaving ? 'Creating…' : 'Create habit'}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

