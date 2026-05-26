import React, { useState } from 'react';
import { X, DollarSign, Calendar, Landmark, Notebook, Plus, Smile } from 'lucide-react';
import { HabitCategory, ExpenseCategory, Habit, Expense, EXPENSE_CATEGORIES } from '../types';
import { Panel } from './ui';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: Omit<Expense, 'id'>) => void;
  onSaveHabit: (habit: Omit<Habit, 'id' | 'history7d' | 'history' | 'streak'>) => void;
}

export default function AddEntryModal({ isOpen, onClose, onSaveExpense, onSaveHabit }: AddEntryModalProps) {
  const [entryType, setEntryType] = useState<'expense' | 'habit'>('expense');

  // Expense states
  const [amount, setAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Food');
  const [date, setDate] = useState('2026-05-20');
  const [account, setAccount] = useState('Primary Bank (....4210)');
  const [transaction, setTransaction] = useState('');
  const [note, setNote] = useState('');

  // Habit states
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState<HabitCategory>('Health');
  const [completionTarget, setCompletionTarget] = useState('85');

  if (!isOpen) return null;

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }
    onSaveExpense({
      amount: parseFloat(amount),
      category: expenseCategory,
      date,
      transaction: transaction.trim() || `${expenseCategory} Purchase`,
      account,
      note: note.trim()
    });

    // Reset state & close
    setAmount('');
    setTransaction('');
    setNote('');
    onClose();
  };

  const handleHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) {
      return;
    }
    onSaveHabit({
      name: habitName.trim(),
      category: habitCategory,
      completionRate: parseInt(completionTarget, 10),
      isCompletedToday: false,
      createdDate: new Date('2026-05-20').toISOString().split('T')[0]
    });

    // Reset state & close
    setHabitName('');
    onClose();
  };

  const categoryMeta: Record<ExpenseCategory, { icon: string }> = {
    Food: { icon: '🍲' },
    Transport: { icon: '🚗' },
    Entertainment: { icon: '🎬' },
    Shopping: { icon: '🛍️' },
    Utilities: { icon: '🧾' },
    Health: { icon: '❤️' },
    Other: { icon: '📦' },
  };
  const expenseCategories = EXPENSE_CATEGORIES.map((name) => ({
    name,
    ...categoryMeta[name],
  }));

  const habitCategories: HabitCategory[] = ['Health', 'Productivity', 'Finance', 'Education'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <Panel
        padding="md"
        className="w-full max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-text-muted hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Toggle between Expense and Habit */}
        <div className="flex bg-surface-container-high p-0.5 rounded-md mb-6 max-w-xs mx-auto">
          <button
            onClick={() => setEntryType('expense')}
            className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors cursor-pointer ${
              entryType === 'expense' ? 'bg-surface-container-highest text-text-primary' : 'text-text-muted'
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => setEntryType('habit')}
            className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors cursor-pointer ${
              entryType === 'habit' ? 'bg-surface-container-highest text-text-primary' : 'text-text-muted'
            }`}
          >
            Habit
          </button>
        </div>

        {entryType === 'expense' ? (
          <div>
            <div className="mb-6">
              <h3 className="text-base font-semibold text-text-primary mb-1">Log New Expense</h3>
              <p className="text-xs text-text-muted">Enter the transaction details to update your records.</p>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                  Transaction Amount ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-medium text-lg">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-field pl-10 text-lg font-semibold py-3"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                  Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {expenseCategories.map((cat) => {
                    const isActive = expenseCategory === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setExpenseCategory(cat.name)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-md transition-colors cursor-pointer ${
                          isActive ? 'bg-primary/12 ring-1 ring-primary/30' : 'bg-surface-container-high hover:bg-surface-container-highest'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg bg-surface-container-highest">
                          <span>{cat.icon}</span>
                        </div>
                        <span className="text-[9px] font-medium text-on-surface-variant truncate w-full text-center">
                          {cat.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transaction Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                  Transaction / Merchant
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Cloud, Whole Foods"
                    value={transaction}
                    onChange={(e) => setTransaction(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-field text-xs color-scheme-dark"
                  />
                </div>

                {/* Account */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                    Account
                  </label>
                  <select
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="input-field text-xs dropdown-dark"
                  >
                    <option value="Primary Bank (....4210)">Primary Bank (....4210)</option>
                    <option value="Savings A/C (....9902)">Savings A/C (....9902)</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                  Note (Optional)
                </label>
                <textarea
                  placeholder="What was this for? e.g. Weekly software subscriptions"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input-field text-xs resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 divider">
                <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-[2] btn-primary">Save expense</button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h3 className="text-base font-semibold text-text-primary mb-1">Create Daily Habit</h3>
              <p className="text-xs text-text-muted">Define a new tracking loop to build long-term consistency.</p>
            </div>

            <form onSubmit={handleHabitSubmit} className="space-y-4">
              {/* Habit Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                  Habit Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code 1 Hour, Core Workout"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                  Domain Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {habitCategories.map((cat) => {
                    const isActive = habitCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setHabitCategory(cat)}
                        className={`py-2 px-3 rounded-md text-sm font-medium capitalize transition-colors cursor-pointer ${
                          isActive ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-text-secondary'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Completion Target Percent */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
                  Completion Target Rate (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={completionTarget}
                    onChange={(e) => setCompletionTarget(e.target.value)}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-xs font-bold text-primary w-12 text-right">{completionTarget}%</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 divider">
                <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-[2] btn-primary">Add habit</button>
              </div>
            </form>
          </div>
        )}
      </Panel>
    </div>
  );
}
