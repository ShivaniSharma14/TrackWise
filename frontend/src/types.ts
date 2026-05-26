// export type HabitCategory = 'Health' | 'Productivity' | 'Finance' | 'Education';

// export type ExpenseCategory =
//   | 'Food'
//   | 'Transport'
//   | 'Entertainment'
//   | 'Shopping'
//   | 'Utilities'
//   | 'Health'
//   | 'Other';

// export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
//   'Food',
//   'Transport',
//   'Entertainment',
//   'Shopping',
//   'Utilities',
//   'Health',
//   'Other',
// ];

// export interface Habit {
//   id: string;
//   name: string;
//   category: HabitCategory;
//   streak: number;
//   history7d: boolean[]; // 7 elements, e.g. from 6 days ago up to today
//   completionRate: number; // percentage, e.g. 85 for 85%
//   isCompletedToday: boolean;
//   history: Record<string, boolean>; // "YYYY-MM-DD" mapping
//   createdDate: string;
//   // backend specific fields
//   frequency?: string;
//   targetValue?: number;
//   targetUnit?: 'MINUTES' | 'COUNT' | 'BOOL';
// }


// // types.ts — replace the Expense interface

// export interface Expense {
//   id: string;
//   amount: number;
//   category: ExpenseCategory;
//   merchant?: string;
//   date: string;           // YYYY-MM-DD
//   note?: string;          // only real optional field
//   created_at?: string;
//   updated_at?: string;
// }

// // Add this — for dashboard stats from /expenses/stats/dashboard/
// export interface ExpenseDashboardStats {
//   this_month_spent: number;
//   last_month_spent: number;
//   month_change: {
//     amount_difference: number;
//     percentage_change: number | null;
//   };
//   top_category_this_month: { category: string; total: number } | null;
//   category_breakdown_this_month: { category: string; total: number }[];
//   last_7_days_spending: { date: string; spending: number }[];
//   monthly_spending_history: { month: string; total: number }[];
// }

// // export interface Expense {
// //   id: string;
// //   amount: number;
// //   category: ExpenseCategory;
// //   date: string; // YYYY-MM-DD
// //   transaction: string;
// //   account: string;
// //   note?: string;
// // }

// export type TabType = 'dashboard' | 'habits' | 'expenses' | 'analytics' | 'add-habit' | 'add-expense' | 'auth' | 'settings';

// export interface AuthState {
//   isAuthenticated: boolean;
//   user: {
//     email: string;
//     firstName?: string;
//     lastName?: string;
//   } | null;
//   accessToken: string | null;
//   refreshToken: string | null;
// }

// export interface BackendConfig {
//   baseUrl: string;
// }



export type HabitCategory = 'Health' | 'Productivity' | 'Finance' | 'Education';

export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Entertainment'
  | 'Shopping'
  | 'Utilities'
  | 'Health'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Health',
  'Other',
];

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  streak: number;
  history7d: boolean[];
  completionRate: number;
  isCompletedToday: boolean;
  history: Record<string, boolean>;
  createdDate: string;
  frequency?: string;
  targetValue?: number;
  targetUnit?: 'MINUTES' | 'COUNT' | 'BOOL';
}

// Matches backend serializer exactly:
// fields: id, amount, date, category, merchant, note, created_at, updated_at
export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string;       // YYYY-MM-DD
  merchant?: string;  // optional — added to model, may be blank on older records
  note?: string;
  created_at?: string;
  updated_at?: string;
}

// Shape of POST/PATCH body sent to /api/expenses/
export type ExpenseCreatePayload = Omit<Expense, 'id' | 'created_at' | 'updated_at'>;

// Shape returned by GET /api/expenses/stats/dashboard/
export interface ExpenseDashboardStats {
  this_month_spent: number;
  last_month_spent: number;
  month_change: {
    amount_difference: number;
    percentage_change: number | null; // null when no last-month data
  };
  top_category_this_month: { category: string; total: number } | null;
  category_breakdown_this_month: { category: string; total: number }[];
  last_7_days_spending: { date: string; spending: number }[];
  monthly_spending_history: { month: string; total: number }[];
}

export type TabType =
  | 'dashboard'
  | 'habits'
  | 'expenses'
  | 'analytics'
  | 'add-habit'
  | 'add-expense'
  | 'auth'
  | 'settings';

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    email: string;
    firstName?: string;
    lastName?: string;
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface BackendConfig {
  baseUrl: string;
}