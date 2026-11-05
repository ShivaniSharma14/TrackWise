import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Expense,
  ExpenseCategory,
  ExpenseUpdatePayload,
  Habit,
  HabitUpdatePayload,
  EXPENSE_CATEGORIES,
} from '../types';
import { Alert, Panel } from './ui';

type EditableEntry =
  | { type: 'habit'; value: Habit }
  | { type: 'expense'; value: Expense };

interface EntryEditorModalProps {
  entry: EditableEntry;
  onClose: () => void;
  onSaveHabit: (id: string, value: HabitUpdatePayload) => Promise<void>;
  onSaveExpense: (id: string, value: ExpenseUpdatePayload) => Promise<void>;
}

export default function EntryEditorModal({
  entry,
  onClose,
  onSaveHabit,
  onSaveExpense,
}: EntryEditorModalProps) {
  const [name, setName] = useState(entry.type === 'habit' ? entry.value.name : '');
  const [targetValue, setTargetValue] = useState(
    entry.type === 'habit' ? String(entry.value.targetValue ?? 1) : '1',
  );
  const [targetUnit, setTargetUnit] = useState(
    entry.type === 'habit' ? entry.value.targetUnit ?? 'COUNT' : 'COUNT',
  );
  const [amount, setAmount] = useState(
    entry.type === 'expense' ? String(entry.value.amount) : '',
  );
  const [category, setCategory] = useState<string>(
    entry.type === 'expense' ? entry.value.category : 'Food',
  );
  const [merchant, setMerchant] = useState(
    entry.type === 'expense' ? entry.value.merchant ?? '' : '',
  );
  const [note, setNote] = useState(
    entry.type === 'expense' ? entry.value.note ?? '' : '',
  );
  const [date, setDate] = useState(
    entry.type === 'habit' ? entry.value.createdDate : entry.value.date,
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (entry.type === 'habit') {
        const target = Number.parseInt(targetValue, 10);
        if (!name.trim() || !Number.isInteger(target) || target < 1) {
          throw new Error('Enter a habit name and a target of at least 1.');
        }
        const payload: HabitUpdatePayload = {
          name: name.trim(),
          targetValue: target,
          targetUnit,
          createdDate: date,
        };
        await onSaveHabit(entry.value.id, payload);
      } else {
        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 99999999.99) {
          throw new Error('Enter a valid expense amount.');
        }
        const payload: ExpenseUpdatePayload = {
          amount: parsedAmount,
          category,
          date,
          merchant: merchant.trim(),
          note: note.trim(),
        };
        await onSaveExpense(entry.value.id, payload);
      }
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <Panel
        padding="lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-editor-title"
        className="app-dialog relative my-auto max-h-[calc(100vh-2rem)] w-full overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close editor"
          className="absolute right-5 top-5 rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-container-high hover:text-text-primary disabled:opacity-50"
        >
          <X size={18} />
        </button>
        <p className="eyebrow mb-2">UPDATE YOUR WORKSPACE</p>
        <h2 id="entry-editor-title" className="mb-6 pr-10 text-xl font-semibold tracking-tight text-text-primary">
          Edit {entry.type === 'habit' ? 'habit' : 'expense'}
        </h2>
        {error && <Alert variant="error" className="mb-4 text-sm">{error}</Alert>}
        <form className="space-y-4" onSubmit={submit}>
          {entry.type === 'habit' ? (
            <>
              <label className="block space-y-1.5">
                <span className="label">Habit name</span>
                <input className="input-field" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="label">Target</span>
                  <input className="input-field" type="number" min="1" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} required />
                </label>
                <label className="block space-y-1.5">
                  <span className="label">Unit</span>
                  <select className="input-field" value={targetUnit} onChange={(event) => setTargetUnit(event.target.value as HabitUpdatePayload['targetUnit'])}>
                    <option value="COUNT">Count</option>
                    <option value="MINUTES">Minutes</option>
                    <option value="BOOL">Yes / No</option>
                  </select>
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="label">Start date</span>
                <input className="input-field" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
              </label>
            </>
          ) : (
            <>
              <label className="block space-y-1.5">
                <span className="label">Amount (₹)</span>
                <input className="input-field" type="number" min="0.01" max="99999999.99" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
              </label>
              <label className="block space-y-1.5">
                <span className="label">Category</span>
                <select className="input-field" value={category} onChange={(event) => setCategory(event.target.value)}>
                  {!EXPENSE_CATEGORIES.includes(category as ExpenseCategory) && <option value={category}>{category}</option>}
                  {EXPENSE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="label">Merchant</span>
                <input className="input-field" value={merchant} onChange={(event) => setMerchant(event.target.value)} maxLength={150} />
              </label>
              <label className="block space-y-1.5">
                <span className="label">Date</span>
                <input className="input-field" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
              </label>
              <label className="block space-y-1.5">
                <span className="label">Note</span>
                <textarea className="input-field resize-y" rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={255} />
              </label>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" className="flex-1 btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="flex-1 btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </Panel>
    </div>
  );
}