import React, { useState, useEffect } from 'react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_MODES, Category, PaymentMode, Expense, TransactionType, CATEGORY_ICONS, RecurringRule, Frequency } from '../types';
import { Button } from './ui/Button';
import { X, Calendar, FileText, CreditCard, Wallet, Smartphone, ArrowDownCircle, ArrowUpCircle, Printer, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface AddExpenseProps {
  onClose: () => void;
  onSave: (expense: Expense) => void;
  onSaveRecurring: (rule: RecurringRule) => void;
  existingExpense?: Expense;
  initialDate?: Date;
  defaultPaymentMode?: PaymentMode;
  defaultType?: TransactionType;
  allowPrint?: boolean;
  currencySymbol: string;
}

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
    Cash: <Wallet size={16} />,
    UPI: <Smartphone size={16} />,
    Card: <CreditCard size={16} />,
    Bank: <Wallet size={16} />,
    Other: <Wallet size={16} />
};

export const AddExpense: React.FC<AddExpenseProps> = ({ 
  onClose, onSave, onSaveRecurring, existingExpense, initialDate, defaultPaymentMode, defaultType = 'expense', allowPrint, currencySymbol 
}) => {
  const [type, setType] = useState<TransactionType>(existingExpense ? existingExpense.type : defaultType);
  const [amount, setAmount] = useState<string>(existingExpense ? existingExpense.amount.toString() : '');
  const [category, setCategory] = useState<Category>(
    existingExpense ? existingExpense.category : (defaultType === 'income' ? 'Salary' : 'Food')
  );
  
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
      existingExpense ? existingExpense.paymentMode : (defaultPaymentMode || 'Cash')
  );
  
  const [date, setDate] = useState<string>(
    existingExpense ? existingExpense.date : (initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  );
  const [note, setNote] = useState<string>(existingExpense?.note || '');

  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('monthly');

  useEffect(() => {
    if (!existingExpense) {
        setCategory(type === 'income' ? 'Salary' : 'Food');
    }
  }, [type, existingExpense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const finalAmount = parseFloat(amount);
    
    // 1. Create the main expense
    const expense: Expense = {
      id: existingExpense ? existingExpense.id : uuidv4(),
      amount: finalAmount,
      category,
      paymentMode,
      date,
      note,
      type,
      createdAt: existingExpense ? existingExpense.createdAt : Date.now(),
    };

    onSave(expense);

    // 2. If Recurring is checked (and it's a new expense), save the rule
    if (isRecurring && !existingExpense) {
        const rule: RecurringRule = {
            id: uuidv4(),
            frequency,
            nextDueDate: date, // Will process on next load if today, logic handled in App
            active: true,
            expenseTemplate: {
                amount: finalAmount,
                category,
                paymentMode: expense.paymentMode,
                note,
                type,
            }
        };
        onSaveRecurring(rule);
    }

    onClose();
  };

  const handlePrint = () => {
      if (!existingExpense) return;
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const expense = existingExpense; 
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt #${expense.id.substring(0,8)}</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; padding: 40px; max-width: 400px; margin: 0 auto; color: #1e293b; background: #fff; }
                .receipt { border: 1px dashed #cbd5e1; padding: 20px; text-align: center; }
                .logo { font-weight: bold; font-size: 20px; margin-bottom: 20px; display: block; }
                .divider { border-top: 1px dashed #cbd5e1; margin: 15px 0; }
                .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                .total { font-size: 20px; font-weight: bold; margin-top: 15px; }
                .footer { font-size: 10px; color: #94a3b8; margin-top: 20px; }
                .type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; font-size: 10px; text-transform: uppercase; font-weight: bold; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="receipt">
                <span class="logo">Spendwizer</span>
                <span class="type-badge">${expense.type || 'Expense'} Receipt</span>
                
                <div class="divider"></div>
                
                <div class="row">
                    <span>Date</span>
                    <span>${format(new Date(expense.date), 'dd/MM/yyyy')}</span>
                </div>
                <div class="row">
                    <span>Category</span>
                    <span>${expense.category}</span>
                </div>
                <div class="row">
                    <span>Mode</span>
                    <span>${expense.paymentMode}</span>
                </div>
                ${expense.note ? `
                <div class="row">
                    <span>Note</span>
                    <span>${expense.note}</span>
                </div>` : ''}
                
                <div class="divider"></div>
                
                <div class="row total">
                    <span>TOTAL</span>
                    <span>${currencySymbol}${expense.amount.toLocaleString()}</span>
                </div>
                
                <div class="footer">
                    Transaction ID: ${expense.id}<br/>
                    Generated on ${new Date().toLocaleString()}
                </div>
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

  const activeColor = type === 'income' ? 'text-emerald-500' : 'text-red-500';
  const activeBg = type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20';
  const activeBorder = type === 'income' ? 'border-emerald-500' : 'border-red-500';
  const categoryList = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4"
    >
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[85vh]"
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 rounded-t-3xl z-10 sticky top-0">
          <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {existingExpense ? 'Edit Transaction' : `New ${type === 'income' ? 'Income' : 'Expense'}`}
              </h2>
          </div>
          <div className="flex items-center space-x-1">
            {existingExpense && allowPrint && (
                <button 
                    onClick={handlePrint}
                    className="p-2 text-primary hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors mr-1"
                    title="Print Receipt"
                >
                    <Printer size={20} />
                </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={24} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-6">
          {/* Type Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button 
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                  <ArrowUpCircle size={16} className="mr-2" /> Expense
              </button>
              <button 
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                  <ArrowDownCircle size={16} className="mr-2" /> Income
              </button>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col items-center justify-center py-2">
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Amount</label>
            <div className="relative w-full max-w-[200px]">
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-bold ${type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{currencySymbol}</span>
                <input
                type="number"
                inputMode="decimal"
                className={`block w-full text-center text-5xl font-bold border-none focus:ring-0 bg-transparent p-0 placeholder-slate-200 dark:placeholder-slate-700 ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                />
            </div>
          </div>

          {/* Category Grid */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Category</label>
            <div className="grid grid-cols-4 gap-3">
              {categoryList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 ${
                    category === cat
                      ? `${activeBg} ${activeBorder} shadow-sm ring-1 ${type === 'income' ? 'ring-emerald-500' : 'ring-red-500'}`
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="text-2xl mb-1">{CATEGORY_ICONS[cat]}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${category === cat ? activeColor : 'text-slate-500 dark:text-slate-400'}`}>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
             {/* Payment Mode */}
             <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Payment Method</label>
                <div className="flex space-x-3 overflow-x-auto no-scrollbar">
                    {PAYMENT_MODES.map(mode => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => setPaymentMode(mode)}
                            className={`flex-1 min-w-[80px] flex items-center justify-center py-3 px-3 rounded-xl border transition-all duration-200 ${
                                paymentMode === mode
                                    ? `bg-slate-800 dark:bg-slate-700 border-slate-800 dark:border-slate-600 text-white font-bold`
                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span className="mr-2">{PAYMENT_ICONS[mode] || <Wallet size={16}/>}</span>
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date */}
            <div>
                <label className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <Calendar size={14} className="mr-1.5 text-primary" /> Date
                </label>
                <input
                type="date"
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium text-slate-700 dark:text-slate-200"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                />
            </div>

            {/* Recurring Toggle (New Expenses Only) */}
            {!existingExpense && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-bold text-sm">
                        <Repeat size={16} className="mr-2 text-primary" /> Repeat Expense
                    </div>
                    <button 
                        type="button"
                        onClick={() => setIsRecurring(!isRecurring)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isRecurring ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                
                {isRecurring && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as Frequency[]).map(freq => (
                            <button
                                key={freq}
                                type="button"
                                onClick={() => setFrequency(freq)}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold capitalize ${frequency === freq ? 'bg-indigo-100 dark:bg-indigo-900 text-primary dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                {freq}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                <FileText size={14} className="mr-1.5 text-primary" /> Note
            </label>
            <input
              type="text"
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all dark:text-white"
              placeholder="Description (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-3xl">
          <Button fullWidth onClick={handleSubmit} className={`h-14 text-lg shadow-lg ${type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 dark:shadow-none' : 'bg-red-500 hover:bg-red-600 shadow-red-200 dark:shadow-none'}`}>
            Save {type === 'income' ? 'Income' : 'Expense'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};