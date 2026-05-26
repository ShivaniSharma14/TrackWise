// import { useState } from 'react';
// import { Download } from 'lucide-react';
// import { Expense, EXPENSE_CATEGORIES } from '../types';
// import { EmptyState, MetricCard, PageHeader, Panel, PanelSection } from './ui';

// interface ExpensesViewProps {
//   expenses: Expense[];
//   onAddExpenseClick: () => void;
//   searchValue: string;
// }

// export default function ExpensesView({ expenses, onAddExpenseClick, searchValue }: ExpensesViewProps) {
//   const [selectedCategory, setSelectedCategory] = useState<string>('All');
//   const [sortBy, setSortBy] = useState<'high-to-low' | 'low-to-high' | 'date'>('high-to-low');

//   const categoriesList = ['All', ...EXPENSE_CATEGORIES];

//   const filteredExpenses = expenses
//     .filter((e) => {
//       const matchesSearch =
//         e.transaction.toLowerCase().includes(searchValue.toLowerCase()) ||
//         (e.note && e.note.toLowerCase().includes(searchValue.toLowerCase()));
//       const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
//       return matchesSearch && matchesCategory;
//     })
//     .sort((a, b) => {
//       if (sortBy === 'high-to-low') return b.amount - a.amount;
//       if (sortBy === 'low-to-high') return a.amount - b.amount;
//       return new Date(b.date).getTime() - new Date(a.date).getTime();
//     });

//   const totalMonthlySpend = expenses.reduce((sum, e) => sum + e.amount, 0);
//   const transactionsCount = expenses.length;
//   const topCategoryName =
//     expenses.length > 0
//       ? Object.entries(
//           expenses.reduce<Record<string, number>>((acc, e) => {
//             acc[e.category] = (acc[e.category] || 0) + e.amount;
//             return acc;
//           }, {})
//         ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'
//       : 'None';

//   const handleExport = () => {
//     const dataString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(expenses, null, 2));
//     const downloadAnchor = document.createElement('a');
//     downloadAnchor.setAttribute("href", dataString);
//     downloadAnchor.setAttribute("download", "trackwise_expenses_export.json");
//     document.body.appendChild(downloadAnchor);
//     downloadAnchor.click();
//     downloadAnchor.remove();
//     alert("Export successful: Downloader triggered for 'trackwise_expenses_export.json'.");
//   };

//   return (
//     <div className="space-y-8">
//       <PageHeader
//         title="Expenses"
//         subtitle="Track and filter your transactions."
//         actions={
//           <>
//             <button onClick={onAddExpenseClick} className="flex-1 sm:flex-none btn-primary">
//               Add expense
//             </button>
//             <button onClick={handleExport} className="flex-1 sm:flex-none btn-secondary">
//               <Download size={14} />
//               Export
//             </button>
//           </>
//         }
//       />

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <MetricCard
//           label="Monthly total"
//           value={`$${totalMonthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
//         />
//         <MetricCard label="Transactions" value={transactionsCount} />
//         <MetricCard label="Top category" value={topCategoryName} />
//       </div>

//       <Panel padding="md" className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
//         <div className="flex flex-wrap gap-1.5 items-center">
//           {categoriesList.map((cat) => (
//             <button
//               key={cat}
//               onClick={() => setSelectedCategory(cat)}
//               className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
//                 selectedCategory === cat
//                   ? 'bg-primary text-on-primary'
//                   : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high'
//               }`}
//             >
//               {cat}
//             </button>
//           ))}
//         </div>
//         <div className="flex items-center gap-2">
//           <span className="label whitespace-nowrap">Sort</span>
//           <select
//             value={sortBy}
//             onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
//             className="input-field py-1.5 w-auto min-w-[160px] dropdown-dark"
//           >
//             <option value="high-to-low">Amount: high to low</option>
//             <option value="low-to-high">Amount: low to high</option>
//             <option value="date">Date: latest</option>
//           </select>
//         </div>
//       </Panel>

//       <PanelSection flushBody footer={`Showing ${filteredExpenses.length} of ${expenses.length}`}>
//         <div className="overflow-x-auto">
//           {filteredExpenses.length === 0 ? (
//             <div className="p-12">
//               <EmptyState
//                 title="No transactions match your filters"
//                 description="Try adjusting search or category."
//               />
//             </div>
//           ) : (
//             <table className="w-full text-left">
//               <thead>
//                 <tr className="border-b border-border-subtle text-xs text-text-muted">
//                   <th className="py-3 px-5 font-medium">Date</th>
//                   <th className="py-3 px-5 font-medium">Transaction</th>
//                   <th className="py-3 px-5 font-medium">Category</th>
//                   <th className="py-3 px-5 font-medium">Status</th>
//                   <th className="py-3 px-5 font-medium text-right">Amount</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border-subtle">
//                 {filteredExpenses.map((expense) => (
//                   <tr key={expense.id} className="hover:bg-surface-container-high/50 transition-colors">
//                     <td className="py-3.5 px-5 text-sm text-text-secondary">{expense.date}</td>
//                     <td className="py-3.5 px-5">
//                       <p className="text-sm font-medium text-text-primary">{expense.transaction}</p>
//                       <p className="text-xs text-text-muted mt-0.5">{expense.account}</p>
//                       {expense.note && <p className="text-xs text-text-muted mt-1">{expense.note}</p>}
//                     </td>
//                     <td className="py-3.5 px-5">
//                       <span className="badge">{expense.category}</span>
//                     </td>
//                     <td className="py-3.5 px-5 text-xs text-text-secondary">Completed</td>
//                     <td className="py-3.5 px-5 text-right text-sm font-medium text-text-primary tabular-nums">
//                       −${expense.amount.toFixed(2)}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </PanelSection>
//     </div>
//   );
// }


// import { useState } from 'react';
// import { Download, TrendingUp, TrendingDown } from 'lucide-react';
// import { Expense, ExpenseDashboardStats, EXPENSE_CATEGORIES } from '../types';
// import { EmptyState, MetricCard, PageHeader, Panel, PanelSection } from './ui';

// interface ExpensesViewProps {
//   expenses: Expense[];
//   stats: ExpenseDashboardStats | null;   // pass from parent after fetching /stats/dashboard/
//   onAddExpenseClick: () => void;
//   searchValue: string;
// }

// export default function ExpensesView({
//   expenses,
//   stats,
//   onAddExpenseClick,
//   searchValue,
// }: ExpensesViewProps) {
//   const [selectedCategory, setSelectedCategory] = useState<string>('All');
//   const [sortBy, setSortBy] = useState<'high-to-low' | 'low-to-high' | 'date'>('date');

//   const categoriesList = ['All', ...EXPENSE_CATEGORIES];

//   const filteredExpenses = expenses
//     .filter((e) => {
//       const matchesSearch =
//         (e.merchant ?? '').toLowerCase().includes(searchValue.toLowerCase()) ||
//         (e.note ?? '').toLowerCase().includes(searchValue.toLowerCase());
//       const matchesCategory =
//         selectedCategory === 'All' || e.category === selectedCategory;
//       return matchesSearch && matchesCategory;
//     })
//     .sort((a, b) => {
//       if (sortBy === 'high-to-low') return b.amount - a.amount;
//       if (sortBy === 'low-to-high') return a.amount - b.amount;
//       return new Date(b.date).getTime() - new Date(a.date).getTime();
//     });

//   // Use real API stats when available, fall back to client-side
//   const monthlyTotal = stats
//     ? stats.this_month_spent
//     : expenses.reduce((s, e) => s + e.amount, 0);

//   const topCategory = stats?.top_category_this_month?.category ?? 'None';

//   const pctChange = stats?.month_change?.percentage_change;
//   const isUp = pctChange !== null && pctChange !== undefined && pctChange > 0;

//   const handleExport = () => {
//     const rows = [
//       ['Date', 'Merchant', 'Category', 'Note', 'Amount'],
//       ...expenses.map((e) => [
//         e.date,
//         e.merchant ?? '',
//         e.category,
//         e.note ?? '',
//         e.amount.toFixed(2),
//       ]),
//     ];
//     const csv = rows.map((r) => r.join(',')).join('\n');
//     const dataString =
//       'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
//     const a = document.createElement('a');
//     a.setAttribute('href', dataString);
//     a.setAttribute('download', 'trackwise_expenses.csv');
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//   };

//   return (
//     <div className="space-y-8">
//       <PageHeader
//         title="Expenses"
//         subtitle="Track and filter your transactions."
//         actions={
//           <>
//             <button
//               onClick={onAddExpenseClick}
//               className="flex-1 sm:flex-none btn-primary"
//             >
//               Add expense
//             </button>
//             <button
//               onClick={handleExport}
//               className="flex-1 sm:flex-none btn-secondary"
//             >
//               <Download size={14} />
//               Export CSV
//             </button>
//           </>
//         }
//       />

//       {/* Stats row — from real API */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <MetricCard
//           label="Spent this month"
//           value={`$${monthlyTotal.toLocaleString(undefined, {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//           })}`}
//           badge={
//             pctChange !== null && pctChange !== undefined ? (
//               <span
//                 className={`flex items-center gap-1 text-xs font-medium ${
//                   isUp ? 'text-red-500' : 'text-green-500'
//                 }`}
//               >
//                 {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
//                 {Math.abs(pctChange).toFixed(1)}% vs last month
//               </span>
//             ) : null
//           }
//         />
//         <MetricCard label="Transactions" value={expenses.length} />
//         <MetricCard label="Top category" value={topCategory} />
//       </div>

//       {/* Last 7 days mini bar chart — only shown when stats available */}
//       {stats?.last_7_days_spending && stats.last_7_days_spending.length > 0 && (
//         <Panel padding="md">
//           <p className="label mb-3">Last 7 days</p>
//           <SpendingMiniChart data={stats.last_7_days_spending} />
//         </Panel>
//       )}

//       {/* Filter + sort bar */}
//       <Panel
//         padding="md"
//         className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
//       >
//         <div className="flex flex-wrap gap-1.5 items-center">
//           {categoriesList.map((cat) => (
//             <button
//               key={cat}
//               onClick={() => setSelectedCategory(cat)}
//               className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
//                 selectedCategory === cat
//                   ? 'bg-primary text-on-primary'
//                   : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high'
//               }`}
//             >
//               {cat}
//             </button>
//           ))}
//         </div>
//         <div className="flex items-center gap-2">
//           <span className="label whitespace-nowrap">Sort</span>
//           <select
//             value={sortBy}
//             onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
//             className="input-field py-1.5 w-auto min-w-[160px] dropdown-dark"
//           >
//             <option value="date">Date: latest first</option>
//             <option value="high-to-low">Amount: high to low</option>
//             <option value="low-to-high">Amount: low to high</option>
//           </select>
//         </div>
//       </Panel>

//       {/* Table */}
//       <PanelSection
//         flushBody
//         footer={`Showing ${filteredExpenses.length} of ${expenses.length}`}
//       >
//         <div className="overflow-x-auto">
//           {filteredExpenses.length === 0 ? (
//             <div className="p-12">
//               <EmptyState
//                 title="No transactions match your filters"
//                 description="Try adjusting the search or category filter."
//               />
//             </div>
//           ) : (
//             <table className="w-full text-left">
//               <thead>
//                 <tr className="border-b border-border-subtle text-xs text-text-muted">
//                   <th className="py-3 px-5 font-medium">Date</th>
//                   <th className="py-3 px-5 font-medium">Merchant</th>
//                   <th className="py-3 px-5 font-medium">Category</th>
//                   <th className="py-3 px-5 font-medium text-right">Amount</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border-subtle">
//                 {filteredExpenses.map((expense) => (
//                   <tr
//                     key={expense.id}
//                     className="hover:bg-surface-container-high/50 transition-colors"
//                   >
//                     <td className="py-3.5 px-5 text-sm text-text-secondary whitespace-nowrap">
//                       {expense.date}
//                     </td>
//                     <td className="py-3.5 px-5">
//                       <p className="text-sm font-medium text-text-primary">
//                         {expense.merchant || '—'}
//                       </p>
//                       {expense.note && (
//                         <p className="text-xs text-text-muted mt-0.5">
//                           {expense.note}
//                         </p>
//                       )}
//                     </td>
//                     <td className="py-3.5 px-5">
//                       <span className="badge">{expense.category}</span>
//                     </td>
//                     <td className="py-3.5 px-5 text-right text-sm font-medium text-text-primary tabular-nums">
//                       −${expense.amount.toFixed(2)}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </PanelSection>
//     </div>
//   );
// }

// // Inline mini bar chart component — no external dependency
// function SpendingMiniChart({
//   data,
// }: {
//   data: { date: string; spending: number }[];
// }) {
//   const max = Math.max(...data.map((d) => d.spending), 1);
//   return (
//     <div className="flex items-end gap-1.5 h-12">
//       {data.map((d) => {
//         const heightPct = max > 0 ? (d.spending / max) * 100 : 0;
//         const dayLabel = new Date(d.date).toLocaleDateString('en', {
//           weekday: 'narrow',
//         });
//         return (
//           <div
//             key={d.date}
//             className="flex flex-col items-center gap-1 flex-1"
//             title={`${d.date}: $${d.spending.toFixed(2)}`}
//           >
//             <div className="w-full flex items-end" style={{ height: '36px' }}>
//               <div
//                 className="w-full rounded-sm bg-primary/40"
//                 style={{ height: `${heightPct}%`, minHeight: d.spending > 0 ? '3px' : '0' }}
//               />
//             </div>
//             <span className="text-[10px] text-text-muted">{dayLabel}</span>
//           </div>
//         );
//       })}
//     </div>
//   );
// }



import { useState } from 'react';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Expense, ExpenseDashboardStats, EXPENSE_CATEGORIES } from '../types';
import { EmptyState, MetricCard, PageHeader, Panel, PanelSection } from './ui';
 
interface ExpensesViewProps {
  expenses: Expense[];
  stats: ExpenseDashboardStats | null;  // from GET /api/expenses/stats/dashboard/
  onAddExpenseClick: () => void;
  searchValue: string;
}
 
type SortOption = 'date' | 'high-to-low' | 'low-to-high';
 
// ─── Mini 7-day bar chart ────────────────────────────────────────────────────
function SpendingMiniChart({ data }: { data: { date: string; spending: number }[] }) {
  const max = Math.max(...data.map((d) => Number(d.spending)), 1);
 
  return (
    <div className="flex items-end gap-1.5 h-14" role="img" aria-label="Last 7 days spending chart">
      {data.map((d, i) => {
        const spending = Number(d.spending);
        const heightPct = max > 0 ? (spending / max) * 100 : 0;
        const isToday = i === data.length - 1;
        const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en', {
          weekday: 'narrow',
        });
 
        return (
          <div
            key={d.date}
            className="flex flex-col items-center gap-1.5 flex-1"
            title={`${d.date}: $${spending.toFixed(2)}`}
          >
            <div className="w-full flex items-end" style={{ height: '44px' }}>
              <div
                className={`w-full rounded-sm transition-all ${
                  isToday ? 'bg-primary' : 'bg-primary/35'
                }`}
                style={{
                  height: spending > 0 ? `${heightPct}%` : '2px',
                  opacity: spending === 0 ? 0.2 : 1,
                }}
              />
            </div>
            <span className={`text-[10px] ${isToday ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
              {dayLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
 
// ─── Month-over-month badge ──────────────────────────────────────────────────
function MonthChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
 
  const abs = Math.abs(pct).toFixed(1);
  const isUp = pct > 0;
  const isFlat = pct === 0;
 
  if (isFlat) {
    return (
      <span className="flex items-center gap-1 text-xs text-text-muted">
        <Minus size={11} />
        Same as last month
      </span>
    );
  }
 
  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${
        isUp ? 'text-red-400' : 'text-green-400'
      }`}
    >
      {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {abs}% vs last month
    </span>
  );
}
 
// ─── Main component ──────────────────────────────────────────────────────────
export default function ExpensesView({
  expenses,
  stats,
  onAddExpenseClick,
  searchValue,
}: ExpensesViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('date');
 
  const categoriesList = ['All', ...EXPENSE_CATEGORIES];
 
  // ── Filtering & sorting ──────────────────────────────────────────────────
  const filteredExpenses = expenses
    .filter((e) => {
      const q = searchValue.toLowerCase();
      const matchesSearch =
        (e.merchant ?? '').toLowerCase().includes(q) ||
        (e.note ?? '').toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === 'All' || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'high-to-low') return b.amount - a.amount;
      if (sortBy === 'low-to-high') return a.amount - b.amount;
      // default: date descending
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
 
  // ── Stats — prefer real API data, fall back to client computation ─────────
  const monthlyTotal =
    stats != null
      ? Number(stats.this_month_spent)
      : expenses.reduce((s, e) => s + e.amount, 0);
 
  const topCategory =
    stats?.top_category_this_month?.category ??
    (expenses.length > 0
      ? Object.entries(
          expenses.reduce<Record<string, number>>((acc, e) => {
            acc[e.category] = (acc[e.category] ?? 0) + e.amount;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None'
      : 'None');
 
  const pctChange = stats?.month_change?.percentage_change ?? null;
 
  // ── CSV export ────────────────────────────────────────────────────────────
  const handleExport = () => {
    const header = ['Date', 'Merchant', 'Category', 'Note', 'Amount'];
    const rows = expenses.map((e) => [
      e.date,
      `"${(e.merchant ?? '').replace(/"/g, '""')}"`,
      e.category,
      `"${(e.note ?? '').replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trackwise_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
 
  return (
    <div className="space-y-8">
 
      {/* Header */}
      <PageHeader
        title="Expenses"
        subtitle="Track and filter your transactions."
        actions={
          <>
            <button onClick={onAddExpenseClick} className="flex-1 sm:flex-none btn-primary">
              Add expense
            </button>
            <button onClick={handleExport} className="flex-1 sm:flex-none btn-secondary">
              <Download size={14} />
              Export CSV
            </button>
          </>
        }
      />
 
      {/* Stat cards — wired to real API */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <MetricCard
            label="Spent this month"
            value={`$${monthlyTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          />
          <div className="px-1">
            <MonthChangeBadge pct={pctChange} />
          </div>
        </div>
        <MetricCard label="Transactions" value={expenses.length} />
        <MetricCard label="Top category" value={topCategory} />
      </div>
 
      {/* 7-day mini chart — only renders when stats are loaded */}
      {stats?.last_7_days_spending && stats.last_7_days_spending.length === 7 && (
        <Panel padding="md">
          <p className="label mb-4">Last 7 days</p>
          <SpendingMiniChart data={stats.last_7_days_spending} />
        </Panel>
      )}
 
      {/* Filter bar */}
      <Panel
        padding="md"
        className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
      >
        <div className="flex flex-wrap gap-1.5 items-center">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="label whitespace-nowrap">Sort</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="input-field py-1.5 w-auto min-w-[168px] dropdown-dark"
          >
            <option value="date">Date: latest first</option>
            <option value="high-to-low">Amount: high to low</option>
            <option value="low-to-high">Amount: low to high</option>
          </select>
        </div>
      </Panel>
 
      {/* Transactions table */}
      <PanelSection flushBody footer={`Showing ${filteredExpenses.length} of ${expenses.length}`}>
        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="p-12">
              <EmptyState
                title="No transactions match your filters"
                description="Try adjusting the search term or selecting a different category."
              />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle text-xs text-text-muted">
                  <th className="py-3 px-5 font-medium">Date</th>
                  <th className="py-3 px-5 font-medium">Merchant</th>
                  <th className="py-3 px-5 font-medium">Category</th>
                  <th className="py-3 px-5 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-surface-container-high/50 transition-colors"
                  >
                    <td className="py-3.5 px-5 text-sm text-text-secondary whitespace-nowrap">
                      {expense.date}
                    </td>
                    <td className="py-3.5 px-5 max-w-240px]">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {expense.merchant || (
                          <span className="text-text-muted italic">No merchant</span>
                        )}
                      </p>
                      {expense.note && (
                        <p className="text-xs text-text-muted mt-0.5 truncate">
                          {expense.note}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="badge">{expense.category}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right text-sm font-medium text-text-primary tabular-nums">
                      −${expense.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PanelSection>
    </div>
  );
}