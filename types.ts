export type TransactionType = 'income' | 'expense';

export type Category = 
  // Expense Categories
  'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Entertainment' | 'Health' | 'Education' | 'Other' |
  // Income Categories
  'Salary' | 'Business' | 'Gift' | 'Investment' | 'Refund';

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank' | 'Other';

export const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'Card', 'Bank', 'Other'];

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringRule {
  id: string;
  frequency: Frequency;
  nextDueDate: string;
  expenseTemplate: Omit<Expense, 'id' | 'date' | 'createdAt'>;
  active: boolean;
  lastRun?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  paymentMode: PaymentMode;
  date: string; // ISO Date string YYYY-MM-DD
  note?: string;
  createdAt: number; // Timestamp for sorting
  type: TransactionType;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface User {
  email: string;
  password?: string; // Stored locally for offline auth
  name: string;
  age?: number;
  profession?: string;
  profilePic?: string; // Base64 string
  monthlyBudget?: number;
  currency?: string; // e.g. 'INR', 'USD'
  defaultPaymentMode?: PaymentMode;
  darkMode?: boolean;
}

export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export const EXPENSE_CATEGORIES: Category[] = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'
];

export const INCOME_CATEGORIES: Category[] = [
  'Salary', 'Business', 'Investment', 'Gift', 'Refund', 'Other'
];

export const CATEGORY_COLORS: Record<Category, string> = {
  // Expenses
  Food: '#f59e0b', // Amber
  Transport: '#3b82f6', // Blue
  Shopping: '#ec4899', // Pink
  Bills: '#ef4444', // Red
  Entertainment: '#8b5cf6', // Violet
  Health: '#10b981', // Emerald
  Education: '#6366f1', // Indigo
  Other: '#64748b', // Slate
  
  // Income
  Salary: '#10b981', // Emerald
  Business: '#3b82f6', // Blue
  Investment: '#8b5cf6', // Violet
  Gift: '#ec4899', // Pink
  Refund: '#f59e0b', // Amber
};

export const CATEGORY_ICONS: Record<Category, string> = {
    // Expenses
    Food: '🍕',
    Transport: '🚗',
    Shopping: '🛍️',
    Bills: '💡',
    Entertainment: '🎬',
    Health: '🏥',
    Education: '📚',
    Other: '📝',
    
    // Income
    Salary: '💰',
    Business: '💼',
    Investment: '📈',
    Gift: '🎁',
    Refund: '↩️',
};