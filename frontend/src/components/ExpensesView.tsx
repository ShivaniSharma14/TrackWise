import { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, Download, Pencil, ReceiptText, Trash2, Wallet } from 'lucide-react';
import { api } from '../api/client';
import { Expense, EXPENSE_CATEGORIES } from '../types';
import { Alert, EmptyState, MetricCard, PageHeader, PanelSection } from './ui';

interface ExpensesViewProps {
  expenses: Expense[];
  onAddExpenseClick: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  searchValue: string;
  isDemo?: boolean;
  isLoading: boolean;
}

type SortOption = 'date' | 'high-to-low' | 'low-to-high';

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function localDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatCurrency(value: number): string {
  return currency.format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function exportCsv(expenses: Expense[]) {
  const header = ['Date', 'Merchant', 'Category', 'Note', 'Amount'];
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = expenses.map((expense) => [
    expense.date,
    expense.merchant ?? '',
    expense.category,
    expense.note ?? '',
    expense.amount.toFixed(2),
  ].map(quote));
  const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `trackwise_expenses_${localDateString(new Date())}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ExpenseActions({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" onClick={onEdit} aria-label={`Edit ${expense.merchant || expense.category} expense`} title="Edit expense" className="icon-button">
        <Pencil size={15} />
      </button>
      <button type="button" onClick={onDelete} aria-label={`Delete ${expense.merchant || expense.category} expense`} title="Delete expense" className="icon-button hover:!text-error">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function ExpensesView({
  expenses,
  onAddExpenseClick,
  onEditExpense,
  onDeleteExpense,
  searchValue,
  isDemo = false,
  isLoading,
}: ExpensesViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [queryExpenses, setQueryExpenses] = useState<Expense[] | null>(null);
  const [queryLoading, setQueryLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const invalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  useEffect(() => {
    let active = true;
    if (isLoading) return () => { active = false; };
    setQueryLoading(true);
    setQueryError(null);
    setQueryExpenses(null);
    if (invalidDateRange) {
      setQueryExpenses([]);
      setQueryLoading(false);
      return () => { active = false; };
    }
    api.getExpenses({
      category: selectedCategory === 'All categories' ? undefined : selectedCategory,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      ordering: sortBy === 'high-to-low'
        ? '-amount,-date'
        : sortBy === 'low-to-high'
          ? 'amount,date'
          : '-date,-created_at',
    })
      .then((results) => {
        if (active) setQueryExpenses(results);
      })
      .catch((requestError: unknown) => {
        if (active) setQueryError(requestError instanceof Error ? requestError.message : 'Unable to load transactions.');
      })
      .finally(() => {
        if (active) setQueryLoading(false);
      });
    return () => { active = false; };
  }, [dateFrom, dateTo, expenses, invalidDateRange, isLoading, retryKey, selectedCategory, sortBy]);

  const periodExpenses = useMemo(() => {
    if (invalidDateRange) return [];
    return expenses.filter((expense) =>
      (!dateFrom || expense.date >= dateFrom) &&
      (!dateTo || expense.date <= dateTo),
    );
  }, [dateFrom, dateTo, expenses, invalidDateRange]);

  const filteredExpenses = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return (queryExpenses ?? []).filter((expense) => [
      expense.merchant ?? '',
      expense.note ?? '',
      expense.category,
    ].some((value) => value.toLowerCase().includes(query)));
  }, [queryExpenses, searchValue]);
  const categories = [...new Set([...EXPENSE_CATEGORIES, ...expenses.map((expense) => expense.category)])].sort();

  const periodTotal = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const periodLabel = dateFrom && dateTo
    ? `${formatDate(dateFrom)} – ${formatDate(dateTo)}`
    : dateFrom ? `From ${formatDate(dateFrom)}` : dateTo ? `Through ${formatDate(dateTo)}` : 'All dates';

  if ((isLoading && expenses.length === 0) || (queryLoading && expenses.length === 0)) {
    return (
      <div className="app-page w-full pb-8" aria-busy="true" aria-label="Loading expenses">
        <div className="h-20 animate-pulse rounded-2xl bg-surface-container-high/70" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl border border-border-subtle bg-surface-container/80" />)}
        </div>
        <div className="space-y-3 rounded-2xl border border-border-subtle bg-surface-container p-5">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-surface-container-high/60" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="app-page w-full pb-8">
      <PageHeader
        title="Expenses"
        subtitle={isDemo ? 'Review sample transactions in your isolated workspace.' : 'Keep your spending records clear and up to date.'}
        actions={
          <>
            <button type="button" onClick={onAddExpenseClick} className="btn-primary flex-1 sm:flex-none">
              <CircleDollarSign size={16} /> Add expense
            </button>
            <button type="button" onClick={() => exportCsv(filteredExpenses)} disabled={filteredExpenses.length === 0} className="btn-secondary flex-1 sm:flex-none">
              <Download size={15} /> Export CSV
            </button>
          </>
        }
      />

      <section aria-label="Spending in selected date range" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard label="Total across all categories" value={formatCurrency(periodTotal)} icon={Wallet} footer={invalidDateRange ? 'Choose a valid date range' : periodLabel} />
        <MetricCard label="Transactions in range" value={periodExpenses.length} icon={ReceiptText} footer={periodLabel} />
      </section>

      <PanelSection
        title="Transactions"
        description={isDemo ? 'Sample transactions · changes stay in this demo workspace' : 'Your transaction history'}
        flushBody
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{invalidDateRange ? 'Start date must be on or before end date.' : `Showing ${filteredExpenses.length} of ${periodExpenses.length} transactions in range`}</span>
            <span>{periodLabel}</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 border-b border-border-subtle bg-surface-container-low/40 px-4 py-4 sm:grid-cols-2 sm:px-6 xl:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_minmax(12rem,1fr)_auto]">
          <label className="min-w-0 space-y-1.5">
            <span className="label">From</span>
            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} className="input-field" aria-label="Expenses from date" />
          </label>
          <label className="min-w-0 space-y-1.5">
            <span className="label">To</span>
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} className="input-field" aria-label="Expenses to date" />
          </label>
          <label className="min-w-0 space-y-1.5">
            <span className="label">Category</span>
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="input-field">
              <option>All categories</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="min-w-0 space-y-1.5 sm:col-span-2 xl:col-span-1">
            <span className="label">Sort by</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="input-field">
              <option value="date">Latest date</option>
              <option value="high-to-low">Amount: high to low</option>
              <option value="low-to-high">Amount: low to high</option>
            </select>
          </label>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="btn-ghost min-h-11 self-end text-xs sm:col-span-2 xl:col-span-4 xl:justify-self-end"
            >
              Clear date range
            </button>
          )}
        </div>

        {queryError ? (
          <div className="px-5 py-12">
            <Alert variant="error" className="flex flex-wrap items-center justify-between gap-3">
              <span>Couldn’t load transactions: {queryError}</span>
              <button type="button" className="btn-secondary min-h-9 px-3 text-xs" onClick={() => setRetryKey((key) => key + 1)}>Retry</button>
            </Alert>
          </div>
        ) : queryLoading ? (
          <div className="space-y-3 px-5 py-5" aria-busy="true" aria-label="Loading transactions">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-surface-container-high/60" />)}
          </div>
        ) : invalidDateRange ? (
          <div className="px-5 py-12"><EmptyState title="Invalid date range" description="Choose a start date before the end date." /></div>
        ) : filteredExpenses.length === 0 ? (
          <div className="px-5 py-12">
            <EmptyState
              title={periodExpenses.length ? 'No transactions match these filters' : 'No expenses in this date range'}
              description={periodExpenses.length ? 'Try another search or category.' : 'Try a wider date range or record an expense.'}
              action={!periodExpenses.length ? <button type="button" onClick={onAddExpenseClick} className="btn-primary"><CircleDollarSign size={15} /> Add expense</button> : undefined}
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-border-subtle text-xs text-text-muted">
                    <th scope="col" className="px-6 py-3.5 font-medium">Transaction</th>
                    <th scope="col" className="px-5 py-3.5 font-medium">Category</th>
                    <th scope="col" className="px-5 py-3.5 font-medium">Date</th>
                    <th scope="col" className="px-5 py-3.5 text-right font-medium">Amount</th>
                    <th scope="col" className="px-5 py-3.5 text-right font-medium"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="transition-colors hover:bg-white/[0.025]">
                      <td className="max-w-[360px] px-6 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ReceiptText size={17} /></span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text-primary">{expense.merchant || 'Expense'}</p>
                            {expense.note && <p className="mt-1 truncate text-xs text-text-muted">{expense.note}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><span className="badge-accent">{expense.category}</span></td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-text-secondary">{formatDate(expense.date)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold tabular-nums text-text-primary">{formatCurrency(expense.amount)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <ExpenseActions expense={expense} onEdit={() => onEditExpense(expense)} onDelete={() => onDeleteExpense(expense)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-border-subtle md:hidden">
              {filteredExpenses.map((expense) => (
                <li key={expense.id} className="flex min-w-0 items-start gap-3 px-4 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ReceiptText size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-text-primary">{expense.merchant || 'Expense'}</p>
                    <p className="mt-1 text-xs text-text-muted">{formatDate(expense.date)}</p>
                    <span className="mt-2 inline-flex badge-accent">{expense.category}</span>
                    {expense.note && <p className="mt-2 break-words text-xs text-text-muted">{expense.note}</p>}
                  </div>
                  <div className="flex max-w-[42%] shrink-0 flex-col items-end gap-2">
                    <span className="break-all text-right text-sm font-semibold tabular-nums text-text-primary">{formatCurrency(expense.amount)}</span>
                    <ExpenseActions expense={expense} onEdit={() => onEditExpense(expense)} onDelete={() => onDeleteExpense(expense)} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </PanelSection>

    </div>
  );
}