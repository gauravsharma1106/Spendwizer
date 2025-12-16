import { Expense, User, RecurringRule } from '../types';

const EXPENSE_KEY = 'spendwizer_expenses';
const USER_KEY = 'spendwizer_user';
const SESSION_KEY = 'spendwizer_session';
const RECURRING_KEY = 'spendwizer_recurring';

export const storageService = {
  // --- User Auth ---
  
  // Check if a user is currently authenticated (Session exists)
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(SESSION_KEY);
  },

  // Get the stored user data (regardless of session)
  getUser: (): User | null => {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  // Update user data (settings, profile)
  setUser: (user: User) => {
    const existing = storageService.getUser();
    // Preserve password if not provided in update
    const updated = { ...existing, ...user };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  },

  // Create a new account
  signup: (user: User): boolean => {
    // For this single-user offline app, we check if a user already exists to prevent accidental overwrite
    // unless the user explicitly cleared data.
    const existing = storageService.getUser();
    if (existing) {
        return false; // User already exists
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_KEY, 'true');
    return true;
  },

  // Verify credentials and create session
  login: (email: string, password?: string): boolean => {
    const storedUser = storageService.getUser();
    if (!storedUser) return false;

    // Simple check
    if (storedUser.email === email && storedUser.password === password) {
        localStorage.setItem(SESSION_KEY, 'true');
        return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    // We DO NOT remove USER_KEY so data persists
  },

  // --- Expenses ---
  getExpenses: (): Expense[] => {
    const data = localStorage.getItem(EXPENSE_KEY);
    return data ? JSON.parse(data) : [];
  },

  addExpense: (expense: Expense) => {
    const expenses = storageService.getExpenses();
    const updated = [expense, ...expenses];
    localStorage.setItem(EXPENSE_KEY, JSON.stringify(updated));
  },

  updateExpense: (updatedExpense: Expense) => {
    const expenses = storageService.getExpenses();
    const updated = expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
    localStorage.setItem(EXPENSE_KEY, JSON.stringify(updated));
  },

  deleteExpense: (id: string) => {
    const expenses = storageService.getExpenses();
    const updated = expenses.filter(e => e.id !== id);
    localStorage.setItem(EXPENSE_KEY, JSON.stringify(updated));
  },
  
  // --- Recurring Rules ---
  getRecurringRules: (): RecurringRule[] => {
    const data = localStorage.getItem(RECURRING_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveRecurringRules: (rules: RecurringRule[]) => {
    localStorage.setItem(RECURRING_KEY, JSON.stringify(rules));
  },
  
  clearAllData: () => {
    localStorage.removeItem(EXPENSE_KEY);
    localStorage.removeItem(RECURRING_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
  },

  sync: async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  }
};