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
  isCompletedToday: boolean;
  createdDate: string;
  frequency: 'DAILY';
  targetValue: number;
  targetUnit: 'MINUTES' | 'COUNT' | 'BOOL';
  isActive: boolean;
  streak?: number;
  history7d?: boolean[];
  completionRate?: number;
  history?: Record<string, boolean>;
}

export interface HabitCreatePayload {
  name: string;
  frequency: 'DAILY';
  targetValue: number;
  targetUnit: Habit['targetUnit'];
  createdDate: string;
}

export interface HabitLog {
  id: number;
  habit: number;
  date: string;
  value: number;
  note: string;
  created_at?: string;
  updated_at?: string;
}

export interface HabitDaySummary {
  date?: string;
  due_habits: number;
  completed_habits: number;
  pending_habits: number;
  completion_rate: number;
  is_perfect_day: boolean;
}

export interface HabitDashboardSummary {
  today: HabitDaySummary;
  consistency: {
    current_perfect_day_streak: number;
    best_perfect_day_streak: number;
    days_with_activity: number;
    tracked_days: number;
  };
  performance: {
    overall_completion_rate: number;
    perfect_days_count: number;
    incomplete_days_count: number;
  };
  trend: { last_7_days: HabitDaySummary[] };
}

// Matches backend serializer exactly:
// fields: id, amount, date, category, merchant, note, created_at, updated_at
export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;       // YYYY-MM-DD
  merchant?: string;  // optional — added to model, may be blank on older records
  note?: string;
  created_at?: string;
  updated_at?: string;
}

// Shape of POST/PATCH body sent to /api/expenses/
export type ExpenseCreatePayload = Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
export type ExpenseUpdatePayload = Partial<ExpenseCreatePayload>;

export type HabitUpdatePayload = Partial<Pick<
  Habit,
  'name' | 'createdDate' | 'targetValue' | 'targetUnit'
>>;

// Shape returned by GET /api/expenses/stats/dashboard/
export interface ExpenseDashboardStats {
  this_month_spent: number | string;
  last_month_spent: number | string;
  month_change: {
    amount_difference: number | string;
    percentage_change: number | string | null;
  };
  top_category_this_month: { category: string; total: number | string } | null;
  category_breakdown_this_month: { category: string; total: number | string }[];
  last_7_days_spending: { date: string; spending: number | string }[];
  monthly_spending_history: { month: string; total: number | string }[];
}

export interface CombinedDashboardSummary {
  habit_stats: HabitDashboardSummary;
  expense_stats: ExpenseDashboardStats;
}

export interface ExpenseAnalytics {
  monthly_trend: {
    history: { month: string; total: string | number }[];
    average_monthly_spend: string | number;
  };
  category_distribution_this_month: {
    category: string;
    total: string | number;
    percentage: string | number;
  }[];
  spending_behavior_this_month: {
    total_expenses_count: number;
    average_expense_amount: string | number;
    total_spent: string | number;
    highest_expense: {
      amount: string | number;
      category: string;
      date: string;
      note: string;
    } | null;
    most_frequent_category: { category: string; count: number } | null;
  };
  month_comparison: {
    this_month_spent: string | number;
    last_month_spent: string | number;
    amount_difference: string | number;
    percentage_change: string | number | null;
  };
}

export type TabType =
  | 'dashboard'
  | 'habits'
  | 'expenses'
  | 'analytics'
  | 'add-habit'
  | 'add-expense'
  | 'auth';

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    email: string;
    firstName?: string;
    lastName?: string;
    isDemo?: boolean;
    demoExpiresAt?: string;
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface BackendConfig {
  baseUrl: string;
}