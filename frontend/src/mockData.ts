import { Habit, Expense } from './types';

// Helper to get formatted dates relative to 2026-05-20
export function getDateString(offsetDays: number): string {
  const date = new Date('2026-05-20');
  date.setDate(date.getDate() - offsetDays);
  return date.toISOString().split('T')[0];
}

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'h1',
    name: 'Morning Meditation',
    category: 'Health',
    streak: 12,
    completionRate: 85,
    isCompletedToday: true,
    createdDate: getDateString(60),
    history7d: [false, true, true, false, true, true, true],
    history: {
      [getDateString(0)]: true,
      [getDateString(1)]: true,
      [getDateString(2)]: true,
      [getDateString(3)]: false,
      [getDateString(4)]: true,
      [getDateString(5)]: true,
      [getDateString(6)]: false,
    }
  },
  {
    id: 'h2',
    name: 'Deep Reading',
    category: 'Education',
    streak: 45,
    completionRate: 98,
    isCompletedToday: true,
    createdDate: getDateString(90),
    history7d: [true, true, true, true, true, true, true],
    history: {
      [getDateString(0)]: true,
      [getDateString(1)]: true,
      [getDateString(2)]: true,
      [getDateString(3)]: true,
      [getDateString(4)]: true,
      [getDateString(5)]: true,
      [getDateString(6)]: true,
    }
  },
  {
    id: 'h3',
    name: 'Gym Session',
    category: 'Health',
    streak: 0,
    completionRate: 62,
    isCompletedToday: false,
    createdDate: getDateString(30),
    history7d: [false, true, false, false, true, false, false],
    history: {
      [getDateString(0)]: false,
      [getDateString(1)]: false,
      [getDateString(2)]: true,
      [getDateString(3)]: false,
      [getDateString(4)]: false,
      [getDateString(5)]: true,
      [getDateString(6)]: false,
    }
  },
  {
    id: 'h4',
    name: 'Log Expenses',
    category: 'Finance',
    streak: 7,
    completionRate: 91,
    isCompletedToday: true,
    createdDate: getDateString(40),
    history7d: [true, true, true, false, true, true, true],
    history: {
      [getDateString(0)]: true,
      [getDateString(1)]: true,
      [getDateString(2)]: true,
      [getDateString(3)]: false,
      [getDateString(4)]: true,
      [getDateString(5)]: true,
      [getDateString(6)]: true,
    }
  },
  {
    id: 'h5',
    name: 'Hydration Target (3L)',
    category: 'Health',
    streak: 14,
    completionRate: 80,
    isCompletedToday: true,
    createdDate: getDateString(30),
    history7d: [true, true, true, true, true, true, true],
    history: {
      [getDateString(0)]: true,
      [getDateString(1)]: true,
      [getDateString(2)]: true,
      [getDateString(3)]: true,
      [getDateString(4)]: true,
      [getDateString(5)]: true,
      [getDateString(6)]: true,
    }
  },
  {
    id: 'h6',
    name: 'Daily Code Session',
    category: 'Productivity',
    streak: 8,
    completionRate: 95,
    isCompletedToday: true,
    createdDate: getDateString(45),
    history7d: [true, true, true, true, true, true, true],
    history: {
      [getDateString(0)]: true,
      [getDateString(1)]: true,
      [getDateString(2)]: true,
      [getDateString(3)]: true,
      [getDateString(4)]: true,
      [getDateString(5)]: true,
      [getDateString(6)]: true,
    }
  },
  {
    id: 'h7',
    name: 'Read 20 Pages',
    category: 'Education',
    streak: 0,
    completionRate: 50,
    isCompletedToday: false,
    createdDate: getDateString(20),
    history7d: [false, false, true, false, false, true, false],
    history: {
      [getDateString(0)]: false,
      [getDateString(1)]: false,
      [getDateString(2)]: true,
      [getDateString(3)]: false,
      [getDateString(4)]: false,
      [getDateString(5)]: true,
      [getDateString(6)]: false,
    }
  },
  {
    id: 'h8',
    name: 'Core Workout',
    category: 'Health',
    streak: 21,
    completionRate: 75,
    isCompletedToday: false,
    createdDate: getDateString(50),
    history7d: [false, true, true, true, true, true, false],
    history: {
      [getDateString(0)]: false,
      [getDateString(1)]: true,
      [getDateString(2)]: true,
      [getDateString(3)]: true,
      [getDateString(4)]: true,
      [getDateString(5)]: true,
      [getDateString(6)]: false,
    }
  }
];

export const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'e1',
    amount: 1240.00,
    category: 'Shopping',
    date: getDateString(1), // May 19, 2026
    merchant: 'AWS Infrastructure',
    note: 'Monthly cloud hosting services'
  },
  {
    id: 'e2',
    amount: 256.40,
    category: 'Food',
    date: getDateString(2), // May 18, 2026
    merchant: 'Whole Foods Market',
    note: 'Weekly family groceries'
  },
  {
    id: 'e3',
    amount: 189.00,
    category: 'Utilities',
    date: getDateString(3), // May 17, 2026
    merchant: 'City Utilities Corp',
    note: 'Electricity, water, and sewage utilities'
  },
  {
    id: 'e4',
    amount: 34.20,
    category: 'Transport',
    date: getDateString(4), // May 16, 2026
    merchant: 'Uber Trip',
    note: 'Commute ride to tech district branch'
  },
  {
    id: 'e5',
    amount: 1299.00,
    category: 'Shopping',
    date: getDateString(5), // May 15, 2026
    merchant: 'Apple Store',
    note: 'New hardware purchase'
  }
];
