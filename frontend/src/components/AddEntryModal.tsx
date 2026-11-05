import { FormEvent, useState } from 'react';
import { CalendarDays, Check, CircleDollarSign, FileText, Plus, Ruler, Tag, X } from 'lucide-react';
import { Expense, ExpenseCategory, HabitCreatePayload, EXPENSE_CATEGORIES } from '../types';
import { Alert, Panel } from './ui';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  onSaveHabit: (habit: HabitCreatePayload) => Promise<void>;
}

type EntryType = 'expense' | 'habit';
type TargetUnit = HabitCreatePayload['targetUnit'];

const TARGET_UNITS: Array<{ value: TargetUnit; label: string }> = [
  { value: 'COUNT', label: 'Count' },
  { value: 'MINUTES', label: 'Minutes' },
  { value: 'BOOL', label: 'Yes / No' },
];
const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Food: '🍲',
  Transport: '🚗',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Utilities: '🧾',
  Health: '❤️',
  Other: '📦',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddEntryModal({
  isOpen,
  onClose,
  onSaveExpense,
  onSaveHabit,
}: AddEntryModalProps) {
  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [amount, setAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Food');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(todayISO);
  const [note, setNote] = useState('');
  const [habitName, setHabitName] = useState('');
  const [targetValue, setTargetValue] = useState('1');
  const [targetUnit, setTargetUnit] = useState<TargetUnit>('COUNT');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (entryType === 'expense') {
        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 999999.99) {
          throw new Error('Enter an expense amount between ₹0.01 and ₹999,999.99.');
        }
        await onSaveExpense({
          amount: Number(parsedAmount.toFixed(2)),
          category: expenseCategory,
          date,
          merchant: merchant.trim(),
          note: note.trim(),
        });
      } else {
        const parsedTarget = Number.parseInt(targetValue, 10);
        if (!habitName.trim()) throw new Error('Enter a name for your habit.');
        if (targetUnit !== 'BOOL' && (!Number.isInteger(parsedTarget) || parsedTarget < 1)) {
          throw new Error('The daily target must be at least 1.');
        }
        await onSaveHabit({
          name: habitName.trim(),
          frequency: 'DAILY',
          targetValue: targetUnit === 'BOOL' ? 1 : parsedTarget,
          targetUnit,
          createdDate: date,
        });
      }

      setAmount('');
      setMerchant('');
      setNote('');
      setHabitName('');
      setDate(todayISO());
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <Panel
        padding="lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
        className="app-dialog relative my-auto max-h-[calc(100vh-2rem)] w-full overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close quick add"
          className="absolute right-5 top-5 rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-container-high hover:text-text-primary disabled:opacity-50"
        >
          <X size={18} />
        </button>
        <p className="eyebrow mb-2">QUICK ADD</p>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="quick-add-title" className="text-xl font-semibold tracking-tight text-text-primary">Add to your workspace</h2>
            <p className="mt-1 text-sm text-text-muted">Capture a transaction or start a new daily habit.</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-border-subtle bg-surface-container-low p-1.5">
          {(['expense', 'habit'] as const).map((type) => {
            const active = entryType === type;
            const Icon = type === 'expense' ? CircleDollarSign : Check;
            return (
              <button
                key={type}
                type="button"
                onClick={() => { setEntryType(type); setError(''); }}
                aria-pressed={active}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active ? 'bg-primary/15 text-primary ring-1 ring-primary/20' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Icon size={15} />
                {type === 'expense' ? 'Expense' : 'Habit'}
              </button>
            );
          })}
        </div>

        {error && <Alert variant="error" className="mb-5">{error}</Alert>}

        <form onSubmit={submit} className="space-y-5">
          {entryType === 'expense' ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="label">Amount</span>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">₹</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      max="999999.99"
                      step="0.01"
                      required
                      autoFocus
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      className="input-field pl-8 text-lg font-semibold tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                </label>
                <label className="block space-y-1.5">
                  <span className="label flex items-center gap-1.5"><CalendarDays size={13} /> Date</span>
                  <input type="date" required max={todayISO()} value={date} onChange={(event) => setDate(event.target.value)} className="input-field color-scheme-dark" />
                </label>
              </div>
              <fieldset className="space-y-2">
                <legend className="label mb-2 flex items-center gap-1.5"><Tag size={13} /> Category</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {EXPENSE_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setExpenseCategory(category)}
                      aria-pressed={expenseCategory === category}
                      className={`flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 transition-all ${
                        expenseCategory === category
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border-subtle bg-surface-container-low text-text-secondary hover:border-outline hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="text-base" aria-hidden="true">{CATEGORY_ICONS[category]}</span>
                      <span className="text-[11px] font-medium">{category}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block space-y-1.5">
                <span className="label">Merchant</span>
                <input value={merchant} onChange={(event) => setMerchant(event.target.value)} maxLength={150} className="input-field" placeholder="Where was this purchase?" />
              </label>
              <label className="block space-y-1.5">
                <span className="label">Note <span className="font-normal text-text-muted">(optional)</span></span>
                <textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} maxLength={255} className="input-field resize-y" placeholder="Add a detail to remember…" />
              </label>
            </>
          ) : (
            <>
              <label className="block space-y-1.5">
                <span className="label flex items-center gap-1.5"><FileText size={13} /> Habit name</span>
                <input value={habitName} onChange={(event) => setHabitName(event.target.value)} maxLength={100} required autoFocus className="input-field" placeholder="e.g. Morning walk, Read 20 pages" />
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="label flex items-center gap-1.5"><Ruler size={13} /> Measure</span>
                  <select value={targetUnit} onChange={(event) => setTargetUnit(event.target.value as TargetUnit)} className="input-field">
                    {TARGET_UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                  </select>
                </label>
                {targetUnit !== 'BOOL' && (
                  <label className="block space-y-1.5">
                    <span className="label">Daily target</span>
                    <input type="number" min="1" required value={targetValue} onChange={(event) => setTargetValue(event.target.value)} className="input-field" />
                  </label>
                )}
              </div>
              <label className="block max-w-sm space-y-1.5">
                <span className="label flex items-center gap-1.5"><CalendarDays size={13} /> Start date</span>
                <input type="date" required max={todayISO()} value={date} onChange={(event) => setDate(event.target.value)} className="input-field color-scheme-dark" />
              </label>
            </>
          )}

          <div className="flex gap-3 border-t border-border-subtle pt-5">
            <button type="button" onClick={onClose} disabled={saving} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="flex-[1.5] btn-primary">
              <Plus size={15} />
              {saving ? 'Saving…' : entryType === 'expense' ? 'Save expense' : 'Create habit'}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
