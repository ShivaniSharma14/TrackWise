import React, { useState } from 'react';
import { CreditCard, Calendar, Notebook, Tag, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { ExpenseCategory, ExpenseCreatePayload, EXPENSE_CATEGORIES } from '../types';
import { PageHeader, Panel } from './ui';
 
interface AddExpenseViewProps {
  onSaveExpense: (payload: ExpenseCreatePayload) => Promise<void>;
  onSuccessNavigate: () => void;
}
 
type SubmitState = 'idle' | 'loading' | 'success' | 'error';
 
const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Food: '🍲',
  Transport: '🚗',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Utilities: '🧾',
  Health: '❤️',
  Other: '📦',
};
 
function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
 
export default function AddExpenseView({ onSaveExpense, onSuccessNavigate }: AddExpenseViewProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(todayISO);
  const [note, setNote] = useState('');
 
  const [amountError, setAmountError] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
 
  const validateAmount = (value: string): boolean => {
    const parsed = parseFloat(value);
    if (!value || isNaN(parsed) || parsed <= 0) {
      setAmountError('Enter an amount greater than ₹0.00');
      return false;
    }
    if (parsed > 999999.99) {
      setAmountError('Amount exceeds maximum (₹999,999.99)');
      return false;
    }
    setAmountError('');
    return true;
  };
 
  const handleAmountBlur = () => validateAmount(amount);
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
 
    if (!validateAmount(amount)) return;
 
    setSubmitState('loading');
    setErrorMessage('');
 
    const payload: ExpenseCreatePayload = {
      amount: parseFloat(parseFloat(amount).toFixed(2)),
      category,
      date,
      merchant: merchant.trim(),
      note: note.trim(),
    };
 
    try {
      await onSaveExpense(payload);
      setSubmitState('success');
      // Brief success flash, then navigate
      setTimeout(() => onSuccessNavigate(), 900);
    } catch (err) {
      setSubmitState('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save expense. Please try again.'
      );
    }
  };
 
  const handleCancel = () => {
    onSuccessNavigate();
  };
 
  const isLoading = submitState === 'loading';
  const isSuccess = submitState === 'success';
 
  return (
    <div className="app-page mx-auto w-full max-w-4xl">
      <PageHeader
        title="Log expense"
        subtitle="Add a transaction to your ledger."
      />
 
      <Panel padding="lg">
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-5 md:grid-cols-2">
 
          {/* Amount */}
          <div className="space-y-1.5">
            <label className="label flex items-center gap-1.5">
              <CreditCard size={14} aria-hidden />
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium select-none">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                max="999999.99"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (amountError) validateAmount(e.target.value);
                }}
                onBlur={handleAmountBlur}
                className={`input-field pl-8 text-xl font-semibold py-3 ${
                  amountError ? 'border-red-500/60 focus:ring-red-500/30' : ''
                }`}
                aria-describedby={amountError ? 'amount-error' : undefined}
                disabled={isLoading || isSuccess}
              />
            </div>
            {amountError && (
              <p id="amount-error" className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                <AlertCircle size={12} />
                {amountError}
              </p>
            )}
          </div>
 
          {/* Category */}
          <div className="space-y-1.5">
            <label className="label flex items-center gap-1.5">
              <Tag size={14} aria-hidden />
              Category
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EXPENSE_CATEGORIES.map((name) => {
                const isActive = category === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCategory(name)}
                    disabled={isLoading || isSuccess}
                    className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-all cursor-pointer ${
                      isActive
                        ? 'border-primary/30 bg-primary/10 text-primary shadow-[0_6px_18px_rgba(115,89,190,0.12)]'
                        : 'border-border-subtle bg-surface-container-low hover:border-outline hover:bg-surface-container-high'
                    }`}
                    aria-pressed={isActive}
                  >
                    <span className="text-lg" role="img" aria-label={name}>
                      {CATEGORY_ICONS[name]}
                    </span>
                    <span className="text-xs font-medium text-text-primary leading-tight text-center">
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
 
          {/* Merchant */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="merchant" className="label">
              Merchant
            </label>
            <input
              id="merchant"
              type="text"
              placeholder="e.g. Whole Foods, Uber, Netflix"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              maxLength={150}
              className="input-field"
              disabled={isLoading || isSuccess}
            />
          </div>
 
          {/* Date — full width, no fake account field */}
          <div className="space-y-1.5">
            <label htmlFor="expense-date" className="label flex items-center gap-1.5">
              <Calendar size={14} aria-hidden />
              Date
            </label>
            <input
              id="expense-date"
              type="date"
              required
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="input-field color-scheme-dark"
              disabled={isLoading || isSuccess}
            />
          </div>
 
          {/* Note */}
          <div className="space-y-1.5">
            <label htmlFor="expense-note" className="label flex items-center gap-1.5">
              <Notebook size={14} aria-hidden />
              Note
            </label>
            <textarea
              id="expense-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={255}
              className="input-field resize-none"
              placeholder="Add a note…"
              disabled={isLoading || isSuccess}
            />
            <p className="text-xs text-text-muted text-right tabular-nums">
              {note.length}/255
            </p>
          </div>
 
          {/* API error banner */}
          {submitState === 'error' && errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error md:col-span-2">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
 
          {/* Success banner */}
          {isSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-3 py-2.5 text-sm text-success md:col-span-2">
              <CheckCircle size={15} className="shrink-0" />
              <span>Expense saved — redirecting…</span>
            </div>
          )}
 
          {/* Actions */}
          <div className="flex gap-3 border-t border-border-subtle pt-5 md:col-span-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading || isSuccess}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="flex-[2] btn-primary flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Saving…
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle size={14} />
                  Saved
                </>
              ) : (
                'Save expense'
              )}
            </button>
          </div>
 
        </form>
      </Panel>
    </div>
  );
}