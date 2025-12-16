import React, { useMemo } from 'react';
import { Expense, CATEGORY_ICONS, PaymentMode, TransactionType } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, TrendingDown, Wallet, CreditCard, Smartphone, AlertCircle } from 'lucide-react';
import { format, addDays, isToday, isYesterday, endOfMonth, isWithinInterval } from 'date-fns';
import { motion } from 'framer-motion';

interface DashboardProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  monthlyBudget?: number;
  onAdd: (type: TransactionType) => void;
  currencySymbol: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ expenses, currentDate, onDateChange, monthlyBudget, onEdit, currencySymbol }) => {
  const dateKey = format(currentDate, 'yyyy-MM-dd');
  
  // --- Filter for selected date ---
  const dailyTransactions = useMemo(() => 
    expenses.filter(e => e.date === dateKey), 
  [expenses, dateKey]);

  // --- Calculate Totals ---
  const dailyIncome = useMemo(() => 
    dailyTransactions.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0),
  [dailyTransactions]);

  const dailyExpense = useMemo(() => 
    dailyTransactions.filter(e => (!e.type || e.type === 'expense')).reduce((sum, e) => sum + e.amount, 0),
  [dailyTransactions]);

  const dailyBalance = dailyIncome - dailyExpense;

  // --- Monthly Budget Calculation ---
  const monthlyStats = useMemo(() => {
    if (!monthlyBudget) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endOfMonth(new Date());
    
    const currentMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return isWithinInterval(d, { start, end }) && (!e.type || e.type === 'expense');
    });

    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const percentage = Math.min((totalSpent / monthlyBudget) * 100, 100);
    const remaining = Math.max(monthlyBudget - totalSpent, 0);
    
    return { totalSpent, percentage, remaining };
  }, [expenses, monthlyBudget]);

  // --- Category Breakdown (Daily) ---
  const categoryData = useMemo(() => {
    const totals: Record<string, { amount: number, type: string }> = {};
    dailyTransactions.forEach(e => {
        const current = totals[e.category] || { amount: 0, type: e.type || 'expense' };
        totals[e.category] = { amount: current.amount + e.amount, type: e.type || 'expense' };
    });
    
    return Object.entries(totals)
      .map(([name, data]) => ({ name, value: data.amount, type: data.type }))
      .sort((a, b) => b.value - a.value);
  }, [dailyTransactions]);

  // --- Recent Transactions (Last 3) ---
  const recentTransactions = useMemo(() => {
    return [...expenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt)
        .slice(0, 3);
  }, [expenses]);

  const getDateLabel = (date: Date) => {
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'EEE, MMM d');
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <button 
            onClick={() => onDateChange(addDays(currentDate, -1))} 
            className="p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-colors active:scale-95"
        >
            <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">{format(currentDate, 'yyyy')}</span>
            <div className="flex items-center space-x-2 text-slate-800 dark:text-white font-bold text-lg">
                <CalendarIcon size={18} className="text-primary" />
                <span>{getDateLabel(currentDate)}</span>
            </div>
        </div>
        <button 
            onClick={() => onDateChange(addDays(currentDate, 1))} 
            className="p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-colors active:scale-95"
        >
            <ChevronRight size={24} />
        </button>
      </div>

      {/* Main Balance Card */}
      <motion.div 
        key={dateKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 dark:bg-indigo-900/50 p-6 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-none text-white relative overflow-hidden"
      >
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-1 flex items-center text-sm uppercase tracking-wider">
                Net Balance
            </p>
            <div className="flex items-baseline mb-6">
                <span className="text-3xl font-light opacity-80 mr-1">{currencySymbol}</span>
                <span className={`text-4xl font-bold tracking-tighter ${dailyBalance < 0 ? 'text-red-400' : 'text-white'}`}>
                    {dailyBalance.toLocaleString('en-IN')}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                    <div className="flex items-center text-emerald-400 mb-1 text-sm font-bold">
                        <TrendingUp size={16} className="mr-1" /> Income
                    </div>
                    <span className="text-xl font-bold">{currencySymbol}{dailyIncome.toLocaleString()}</span>
                </div>
                <div className="text-right">
                     <div className="flex items-center justify-end text-red-400 mb-1 text-sm font-bold">
                        <TrendingDown size={16} className="mr-1" /> Expense
                    </div>
                    <span className="text-xl font-bold">{currencySymbol}{dailyExpense.toLocaleString()}</span>
                </div>
            </div>
          </div>
      </motion.div>

      {/* Budget Progress (Only if budget is set) */}
      {monthlyStats && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly Budget</h3>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                        {currencySymbol}{monthlyStats.totalSpent.toLocaleString()} <span className="text-sm text-slate-400 font-normal">/ {monthlyBudget.toLocaleString()}</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-bold ${monthlyStats.remaining < (monthlyBudget * 0.1) ? 'text-red-500' : 'text-emerald-500'}`}>
                        {currencySymbol}{monthlyStats.remaining.toLocaleString()} left
                    </p>
                </div>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${monthlyStats.percentage}%` }}
                    className={`h-full rounded-full ${monthlyStats.percentage > 90 ? 'bg-red-500' : 'bg-primary'}`}
                />
            </div>
            {monthlyStats.percentage > 90 && (
                <div className="mt-3 flex items-center text-xs text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                    <AlertCircle size={14} className="mr-2" />
                    You are nearing your budget limit!
                </div>
            )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Summary */}
        <div>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">Daily Breakdown</h3>
            
            {categoryData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-400 font-medium">No activity today</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {categoryData.map((item, index) => (
                        <motion.div 
                            key={item.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                    {CATEGORY_ICONS[item.name as any]}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                                    <p className={`text-xs font-bold uppercase ${item.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>{item.type}</p>
                                </div>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{currencySymbol}{item.value.toLocaleString()}</span>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>

        {/* Recent Activity */}
        <div>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">Recent Activity</h3>
            <div className="space-y-3">
                {recentTransactions.map((expense) => (
                    <div 
                        key={expense.id}
                        onClick={() => onEdit(expense)}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors"
                    >
                         <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                {CATEGORY_ICONS[expense.category]}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{expense.category}</p>
                                <p className="text-xs text-slate-400 flex items-center">
                                    {isToday(new Date(expense.date)) ? 'Today' : format(new Date(expense.date), 'MMM d')}
                                </p>
                            </div>
                        </div>
                        <span className={`font-bold ${expense.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'}`}>
                            {expense.type === 'income' ? '+' : '-'}{currencySymbol}{expense.amount.toLocaleString()}
                        </span>
                    </div>
                ))}
                <button 
                    onClick={() => document.querySelector<HTMLButtonElement>('button[aria-label="List"]')?.click()} 
                    className="w-full py-3 text-center text-xs font-bold text-primary hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                    View All Transactions
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};