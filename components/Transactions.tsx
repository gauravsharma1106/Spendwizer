import React, { useState, useMemo } from 'react';
import { Expense, TransactionType, CATEGORY_ICONS } from '../types';
import { format, isWithinInterval, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { Search, Filter, ArrowUpCircle, ArrowDownCircle, Trash2, Calendar, Clock, Receipt, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionsProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onAdd: (type: TransactionType) => void;
  currencySymbol: string;
}

export const Transactions: React.FC<TransactionsProps> = ({ expenses, onEdit, onDelete, onAdd, currencySymbol }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Basic Filters
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced Filters
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Sort by date descending (newest first)
  const sortedExpenses = useMemo(() => {
      return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return sortedExpenses.filter(e => {
        const date = new Date(e.date);

        // 1. Basic Search (Text)
        const matchesSearch = 
            e.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (e.note && e.note.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (!matchesSearch) return false;

        // 2. Type Filter
        if (filterType !== 'all') {
             if (filterType === 'income' && e.type !== 'income') return false;
             if (filterType === 'expense' && (e.type === 'income')) return false;
        }

        // 3. Amount Range
        if (minAmount && e.amount < parseFloat(minAmount)) return false;
        if (maxAmount && e.amount > parseFloat(maxAmount)) return false;

        // 4. Date Range
        if (dateRange.start && dateRange.end) {
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            // Include end date by adding time or checking logic carefully
            if (!isWithinInterval(date, { start, end })) return false;
        }

        return true;
    });
  }, [sortedExpenses, searchTerm, filterType, minAmount, maxAmount, dateRange]);

  const generateBill = () => {
    const totalIncome = filteredExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const totalExpense = filteredExpenses.filter(e => (!e.type || e.type === 'expense')).reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncome - totalExpense;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Statement - Spendwizer</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
          .meta { text-align: right; font-size: 14px; color: #64748b; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
          .card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .card h3 { margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #64748b; }
          .card p { margin: 0; font-size: 20px; font-weight: bold; }
          .income { color: #10b981; }
          .expense { color: #ef4444; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px; text-transform: uppercase; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .amount { font-weight: bold; text-align: right; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Spendwizer</div>
          <div class="meta">
            <p>Generated on ${format(new Date(), 'PPP')}</p>
          </div>
        </div>

        <div class="summary">
          <div class="card">
            <h3>Total Income</h3>
            <p class="income">+${currencySymbol}${totalIncome.toLocaleString()}</p>
          </div>
          <div class="card">
            <h3>Total Expense</h3>
            <p class="expense">-${currencySymbol}${totalExpense.toLocaleString()}</p>
          </div>
          <div class="card">
            <h3>Net Balance</h3>
            <p>${currencySymbol}${balance.toLocaleString()}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Mode</th>
              <th>Note</th>
              <th style="text-align: right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${filteredExpenses.map(e => `
              <tr>
                <td>${format(new Date(e.date), 'MMM d, yyyy')}</td>
                <td>${e.category} <span style="font-size: 10px; color: #94a3b8; padding: 2px 4px; border: 1px solid #e2e8f0; border-radius: 4px; margin-left: 4px;">${e.type || 'expense'}</span></td>
                <td>${e.paymentMode}</td>
                <td>${e.note || '-'}</td>
                <td class="amount ${e.type === 'income' ? 'income' : 'expense'}">
                  ${e.type === 'income' ? '+' : '-'}${currencySymbol}${e.amount.toLocaleString()}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated by Spendwizer
        </div>
        <script>
          window.onload = () => { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const clearFilters = () => {
      setSearchTerm('');
      setFilterType('all');
      setMinAmount('');
      setMaxAmount('');
      setDateRange({ start: '', end: '' });
  };

  return (
    <div className="space-y-4 pb-28">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm sticky top-0 z-10 space-y-3">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Transactions</h2>
                 <div className="flex items-center space-x-2">
                    <button 
                        onClick={generateBill}
                        className="p-2 text-primary hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors flex items-center space-x-1"
                        title="Generate Statement"
                    >
                        <Receipt size={18} />
                        <span className="text-xs font-bold hidden sm:inline">Statement</span>
                    </button>
                    <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`p-2 rounded-xl transition-colors flex items-center space-x-1 ${showAdvanced ? 'bg-slate-900 dark:bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'}`}
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg">{filteredExpenses.length}</span>
                 </div>
            </div>
            
            {/* Simple Search */}
            {!showAdvanced && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search transactions..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-white font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* Advanced Filters Panel */}
            <AnimatePresence>
                {showAdvanced && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4 border border-slate-100 dark:border-slate-700">
                             {/* Text Search inside advanced */}
                             <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Search</label>
                                <input 
                                    type="text" 
                                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                             </div>

                             {/* Type */}
                             <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Type</label>
                                <select 
                                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as any)}
                                >
                                    <option value="all">All Types</option>
                                    <option value="expense">Expenses Only</option>
                                    <option value="income">Income Only</option>
                                </select>
                             </div>

                             {/* Amount Range */}
                             <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Min Amount</label>
                                    <input type="number" className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white" placeholder="0" value={minAmount} onChange={e => setMinAmount(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Max Amount</label>
                                    <input type="number" className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white" placeholder="Any" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} />
                                </div>
                             </div>

                             {/* Date Range */}
                             <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">From Date</label>
                                    <input type="date" className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">To Date</label>
                                    <input type="date" className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                                </div>
                             </div>

                             <button onClick={clearFilters} className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 flex items-center justify-center border-t border-slate-200 dark:border-slate-700 pt-3">
                                <X size={14} className="mr-1" /> Clear Filters
                             </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* List */}
        <div className="space-y-3 px-1">
            <AnimatePresence>
            {filteredExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
                    <Calendar size={48} className="mb-4 opacity-20" />
                    <p className="font-medium">No transactions found</p>
                    <p className="text-xs opacity-70 mt-1">Try adjusting your filters</p>
                </div>
            ) : (
                filteredExpenses.map((expense) => (
                    <motion.div 
                        key={expense.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onEdit(expense)}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer hover:border-primary/30 dark:hover:border-indigo-500/30 hover:shadow-md transition-all active:scale-[0.99]"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                {CATEGORY_ICONS[expense.category]}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">{expense.category}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center">
                                    <Clock size={10} className="mr-1" />
                                    {format(new Date(expense.date), 'MMM d')} • {expense.paymentMode}
                                </p>
                                {expense.note && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">{expense.note}</p>}
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className={`font-bold text-lg ${expense.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-slate-100'}`}>
                                {expense.type === 'income' ? '+' : '-'}{currencySymbol}{expense.amount.toLocaleString()}
                            </span>
                            
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(expense.id);
                                }} 
                                className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors mt-1"
                                aria-label="Delete transaction"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))
            )}
            </AnimatePresence>
        </div>
    </div>
  );
};