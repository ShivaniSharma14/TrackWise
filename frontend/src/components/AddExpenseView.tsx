// import React, { useState } from 'react';
// import { CreditCard, Calendar, Landmark, Notebook, Tag } from 'lucide-react';
// import { ExpenseCategory, Expense, EXPENSE_CATEGORIES } from '../types';
// import { PageHeader, Panel } from './ui';

// interface AddExpenseViewProps {
//   onSaveExpense: (expense: Omit<Expense, 'id'>) => void;
//   onSuccessNavigate: () => void;
// }

// export default function AddExpenseView({ onSaveExpense, onSuccessNavigate }: AddExpenseViewProps) {
//   const [amount, setAmount] = useState('');
//   const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Food');
//   const [date, setDate] = useState('2026-05-20');
//   const [account, setAccount] = useState('Primary Bank (....4210)');
//   const [transaction, setTransaction] = useState('');
//   const [note, setNote] = useState('');

//   const handleExpenseSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!amount || parseFloat(amount) <= 0) {
//       alert('Please enter a valid amount');
//       return;
//     }
//     onSaveExpense({
//       amount: parseFloat(amount),
//       category: expenseCategory,
//       date,
//       merchant: transaction.trim() || `${expenseCategory} Purchase`,
      
//       note: note.trim(),
//     });
//     setAmount('');
//     setTransaction('');
//     setNote('');
//     alert('Expense recorded successfully!');
//     onSuccessNavigate();
//   };

//   const categoryIcons: Record<ExpenseCategory, string> = {
//     Food: '🍲',
//     Transport: '🚗',
//     Entertainment: '🎬',
//     Shopping: '🛍️',
//     Utilities: '🧾',
//     Health: '❤️',
//     Other: '📦',
//   };

//   return (
//     <div className="max-w-xl mx-auto space-y-6">
//       <PageHeader title="Log expense" subtitle="Add a transaction to your ledger." />

//       <Panel padding="md">
//         <form onSubmit={handleExpenseSubmit} className="space-y-5">
//           <div className="space-y-1.5">
//             <label className="label flex items-center gap-1.5">
//               <CreditCard size={14} />
//               Amount
//             </label>
//             <div className="relative">
//               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">$</span>
//               <input
//                 type="number"
//                 step="0.01"
//                 required
//                 placeholder="0.00"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value)}
//                 className="input-field pl-8 text-xl font-semibold py-3"
//               />
//             </div>
//           </div>

//           <div className="space-y-1.5">
//             <label className="label flex items-center gap-1.5">
//               <Tag size={14} />
//               Category
//             </label>
//             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
//               {EXPENSE_CATEGORIES.map((name) => {
//                 const isActive = expenseCategory === name;
//                 return (
//                   <button
//                     key={name}
//                     type="button"
//                     onClick={() => setExpenseCategory(name)}
//                     className={`flex flex-col items-center gap-1.5 p-3 rounded-md transition-colors cursor-pointer ${
//                       isActive ? 'bg-primary/12 ring-1 ring-primary/30' : 'bg-surface-container-high hover:bg-surface-container-highest'
//                     }`}
//                   >
//                     <span className="text-lg">{categoryIcons[name]}</span>
//                     <span className="text-xs font-medium text-text-primary">{name}</span>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           <div className="space-y-1.5">
//             <label className="label">Merchant</label>
//             <input
//               type="text"
//               required
//               placeholder="e.g. Whole Foods, Uber"
//               value={transaction}
//               onChange={(e) => setTransaction(e.target.value)}
//               className="input-field"
//             />
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div className="space-y-1.5">
//               <label className="label flex items-center gap-1.5">
//                 <Calendar size={14} />
//                 Date
//               </label>
//               <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input-field color-scheme-dark" />
//             </div>
//             <div className="space-y-1.5">
//               <label className="label flex items-center gap-1.5">
//                 <Landmark size={14} />
//                 Account
//               </label>
//               <select value={account} onChange={(e) => setAccount(e.target.value)} className="input-field dropdown-dark">
//                 <option value="Primary Bank (....4210)">Primary Bank (....4210)</option>
//                 <option value="Savings A/C (....9902)">Savings A/C (....9902)</option>
//                 <option value="Digital Wallet">Digital Wallet</option>
//               </select>
//             </div>
//           </div>

//           <div className="space-y-1.5">
//             <label className="label flex items-center gap-1.5">
//               <Notebook size={14} />
//               Note (optional)
//             </label>
//             <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="input-field resize-none" placeholder="Add a note…" />
//           </div>

//           <div className="flex gap-3 pt-2 divider">
//             <button type="button" onClick={onSuccessNavigate} className="flex-1 btn-secondary">
//               Cancel
//             </button>
//             <button type="submit" className="flex-[2] btn-primary">
//               Save expense
//             </button>
//           </div>
//         </form>
//       </Panel>
//     </div>
//   );
// }




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
      setAmountError('Enter an amount greater than $0.00');
      return false;
    }
    if (parsed > 999999.99) {
      setAmountError('Amount exceeds maximum ($999,999.99)');
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
    <div className="max-w-xl mx-auto space-y-6">
      <PageHeader
        title="Log expense"
        subtitle="Add a transaction to your ledger."
      />
 
      <Panel padding="md">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
 
          {/* Amount */}
          <div className="space-y-1.5">
            <label className="label flex items-center gap-1.5">
              <CreditCard size={14} aria-hidden />
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium select-none">
                $
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
            <div className="grid grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((name) => {
                const isActive = category === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCategory(name)}
                    disabled={isLoading || isSuccess}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-primary/12 ring-1 ring-primary/30'
                        : 'bg-surface-container-high hover:bg-surface-container-highest'
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
          <div className="space-y-1.5">
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
            <div className="flex items-start gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
 
          {/* Success banner */}
          {isSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2.5 text-sm text-green-400">
              <CheckCircle size={15} className="shrink-0" />
              <span>Expense saved — redirecting…</span>
            </div>
          )}
 
          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-border-subtle">
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
              className="flex-2] btn-primary flex items-center justify-center gap-2"
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