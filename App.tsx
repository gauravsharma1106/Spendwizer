import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { MonthlyReport } from './components/MonthlyReport';
import { Transactions } from './components/Transactions';
import { AddExpense } from './components/AddExpense';
import { Settings } from './components/Settings';
import { storageService } from './services/storageService';
import { User, Expense, TransactionType, RecurringRule, CURRENCIES } from './types';
import { LayoutGrid, PieChart as PieChartIcon, Settings as SettingsIcon, List, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { format, addDays, isAfter, isBefore, isToday } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

type View = 'dashboard' | 'transactions' | 'monthly' | 'settings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<TransactionType>('expense');
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  const [dashboardDate, setDashboardDate] = useState(new Date());
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // --- Initialization & Hooks ---

  useEffect(() => {
    // Check if authenticated
    if (storageService.isAuthenticated()) {
        const loadedUser = storageService.getUser();
        if (loadedUser) setUser(loadedUser);
    }
    
    // Load Expenses
    let loadedExpenses = storageService.getExpenses();
    setExpenses(loadedExpenses);
    
    // Process Recurring Expenses
    const processed = processRecurringExpenses(loadedExpenses);
    if (processed.length > loadedExpenses.length) {
       setExpenses(processed);
       localStorage.setItem('spendwizer_expenses', JSON.stringify(processed));
    }

    setLoading(false);
  }, []);

  // Dark Mode Effect
  useEffect(() => {
    if (user?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.darkMode]);

  // Toast Timer
  useEffect(() => {
    if (toast) {
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
  };

  const getCurrencySymbol = () => {
    const code = user?.currency || 'INR';
    return CURRENCIES.find(c => c.code === code)?.symbol || '₹';
  }

  // --- Logic Functions ---

  const processRecurringExpenses = (currentExpenses: Expense[]): Expense[] => {
    const rules = storageService.getRecurringRules();
    const today = new Date();
    let newExpenses: Expense[] = [];
    let updatedRules = [...rules];
    let hasUpdates = false;

    updatedRules = updatedRules.map(rule => {
      let nextDate = new Date(rule.nextDueDate);
      const ruleUpdates: Expense[] = [];
      
      // While next due date is in the past or today
      while (isBefore(nextDate, today) || isToday(nextDate)) {
        if (!rule.active) break;
        
        ruleUpdates.push({
          ...rule.expenseTemplate,
          id: uuidv4(),
          date: format(nextDate, 'yyyy-MM-dd'),
          createdAt: Date.now(),
          type: rule.expenseTemplate.type || 'expense'
        });

        // Calculate next date
        if (rule.frequency === 'daily') nextDate = addDays(nextDate, 1);
        if (rule.frequency === 'weekly') nextDate = addDays(nextDate, 7);
        if (rule.frequency === 'monthly') nextDate = addDays(nextDate, 30); // Approx
        if (rule.frequency === 'yearly') nextDate = addDays(nextDate, 365);
      }

      if (ruleUpdates.length > 0) {
        newExpenses = [...newExpenses, ...ruleUpdates];
        hasUpdates = true;
        return { ...rule, nextDueDate: format(nextDate, 'yyyy-MM-dd'), lastRun: format(today, 'yyyy-MM-dd') };
      }
      return rule;
    });

    if (hasUpdates) {
      storageService.saveRecurringRules(updatedRules);
      showToastMessage(`${newExpenses.length} recurring expenses added`);
      return [...newExpenses, ...currentExpenses];
    }
    return currentExpenses;
  };

  const handleLogin = () => {
    const u = storageService.getUser();
    setUser(u);
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
  };

  const saveExpense = (expense: Expense) => {
    if (editingExpense) {
      storageService.updateExpense(expense);
      setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
      showToastMessage('Transaction updated');
    } else {
      storageService.addExpense(expense);
      setExpenses(prev => [expense, ...prev]);
      showToastMessage(`${expense.type === 'income' ? 'Income' : 'Expense'} added`);
    }
    setEditingExpense(undefined);
  };

  const saveRecurringRule = (rule: RecurringRule) => {
      const rules = storageService.getRecurringRules();
      storageService.saveRecurringRules([...rules, rule]);
  };

  const deleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
        storageService.deleteExpense(id);
        setExpenses(prev => prev.filter(e => e.id !== id));
        showToastMessage('Transaction deleted');
    }
  };

  const handleClearData = () => {
    if (confirm('DANGER: This will permanently delete all your expenses, user data, and log you out. Are you sure?')) {
        storageService.clearAllData();
        setExpenses([]);
        setUser(null);
        showToastMessage('All data cleared', 'success');
    }
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setAddModalType(expense.type);
    setShowAddModal(true);
  };

  const openAdd = (type: TransactionType) => {
      setEditingExpense(undefined);
      setAddModalType(type);
      setShowAddModal(true);
  }

  const exportData = () => {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Type,Category,Amount,PaymentMode,Note\n"
        + expenses.map(e => {
            return `${e.date},${e.type || 'expense'},${e.category},${e.amount},${e.paymentMode},"${e.note || ''}"`
        }).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `spendwizer_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToastMessage('Data exported to CSV');
  };

  // Profile Picture Display Helper
  const ProfileDisplay = ({ user, size = 'md' }: { user: User, size?: 'sm' | 'md' | 'lg' }) => {
     const sizeClass = size === 'sm' ? 'h-8 w-8 text-sm' : size === 'lg' ? 'h-16 w-16 text-2xl' : 'h-10 w-10 text-lg';
     
     if (user.profilePic) {
         return <img src={user.profilePic} alt={user.name} className={`${sizeClass} rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm`} />
     }

     const initial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
     return (
        <div className={`${sizeClass} rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-primary dark:text-indigo-200 font-bold border-2 border-white dark:border-slate-800 shadow-sm`}>
            {initial}
        </div>
     );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary bg-slate-50 dark:bg-slate-900">Loading...</div>;

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-0 md:pb-0 overflow-x-hidden transition-colors duration-300">
      
      {/* Toast Notification */}
      <AnimatePresence>
      {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl flex items-center animate-fade-in">
              <div className={`w-2 h-2 rounded-full mr-3 ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="font-medium text-sm">{toast.message}</span>
          </div>
      )}
      </AnimatePresence>

      <div className="md:flex md:h-screen md:overflow-hidden">
          
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full p-6 relative z-20 transition-colors">
              <div className="flex items-center space-x-3 mb-12 text-primary">
                  <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/30">S</div>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Spendwizer</span>
              </div>
              
              <nav className="space-y-2 flex-1">
                  <NavButton 
                    active={currentView === 'dashboard'} 
                    onClick={() => setCurrentView('dashboard')} 
                    icon={<LayoutGrid size={20} />} 
                    label="Overview" 
                  />
                  <NavButton 
                    active={currentView === 'transactions'} 
                    onClick={() => setCurrentView('transactions')} 
                    icon={<List size={20} />} 
                    label="Transactions" 
                  />
                  <NavButton 
                    active={currentView === 'monthly'} 
                    onClick={() => setCurrentView('monthly')} 
                    icon={<PieChartIcon size={20} />} 
                    label="Analytics" 
                  />
                   <NavButton 
                    active={currentView === 'settings'} 
                    onClick={() => setCurrentView('settings')} 
                    icon={<SettingsIcon size={20} />} 
                    label="Settings" 
                  />
              </nav>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => openAdd('expense')} className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors mb-4 shadow-lg shadow-slate-200 dark:shadow-none">
                      <ArrowUpCircle size={18} />
                      <span>Add Expense</span>
                  </button>
                  <div className="flex items-center space-x-3 mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => setCurrentView('settings')}>
                      <ProfileDisplay user={user} size="md" />
                      <div className="text-sm overflow-hidden">
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{user.name || user.email.split('@')[0]}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{user.profession || 'Free Plan'}</p>
                      </div>
                  </div>
              </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 h-full overflow-y-auto relative scroll-smooth no-scrollbar bg-slate-50 dark:bg-slate-950">
              {/* Mobile Header */}
              <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center md:hidden transition-colors">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white">S</div>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white">Spendwizer</h1>
                </div>
                <button onClick={() => setCurrentView('settings')} className="flex items-center">
                    <ProfileDisplay user={user} size="sm" />
                </button>
              </div>

              <div className="max-w-4xl mx-auto p-4 md:p-8 pt-6">
                {currentView === 'dashboard' && (
                    <Dashboard 
                        expenses={expenses} 
                        onEdit={openEdit} 
                        onDelete={deleteExpense} 
                        currentDate={dashboardDate}
                        onDateChange={setDashboardDate}
                        monthlyBudget={user.monthlyBudget}
                        onAdd={openAdd}
                        currencySymbol={getCurrencySymbol()}
                    />
                )}
                {currentView === 'transactions' && (
                    <Transactions 
                        expenses={expenses}
                        onEdit={openEdit}
                        onDelete={deleteExpense}
                        onAdd={openAdd}
                        currencySymbol={getCurrencySymbol()}
                    />
                )}
                {currentView === 'monthly' && (
                    <MonthlyReport 
                        expenses={expenses} 
                        currencySymbol={getCurrencySymbol()}
                    />
                )}
                {currentView === 'settings' && (
                    <Settings 
                        user={user} 
                        onUpdateUser={setUser} 
                        onLogout={handleLogout} 
                        onExport={exportData}
                        onClearData={handleClearData}
                    />
                )}
              </div>
          </main>
      </div>

      {/* Floating Action Buttons (Mobile Only) */}
      <div className="md:hidden fixed bottom-24 left-0 right-0 px-6 flex justify-center space-x-4 z-40 pointer-events-none">
          <button 
            onClick={() => openAdd('income')} 
            className="pointer-events-auto flex-1 bg-emerald-500 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-500/30 flex items-center justify-center active:scale-95 transition-transform backdrop-blur-sm"
          >
              <ArrowDownCircle size={20} className="mr-2" /> Income
          </button>
          <button 
            onClick={() => openAdd('expense')} 
            className="pointer-events-auto flex-1 bg-red-500 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-red-500/30 flex items-center justify-center active:scale-95 transition-transform backdrop-blur-sm"
          >
              <ArrowUpCircle size={20} className="mr-2" /> Expense
          </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 py-3 flex justify-between items-center md:hidden z-30 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] transition-colors">
        <MobileNavButton 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
            icon={<LayoutGrid />} 
            label="Home"
        />
        <MobileNavButton 
            active={currentView === 'transactions'} 
            onClick={() => setCurrentView('transactions')} 
            icon={<List />} 
            label="List"
        />
        <MobileNavButton 
            active={currentView === 'monthly'} 
            onClick={() => setCurrentView('monthly')} 
            icon={<PieChartIcon />} 
            label="Stats"
        />
        <MobileNavButton 
            active={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')} 
            icon={<SettingsIcon />} 
            label="Settings"
        />
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
      {showAddModal && (
        <AddExpense 
            onClose={() => { setShowAddModal(false); setEditingExpense(undefined); }} 
            onSave={saveExpense} 
            onSaveRecurring={saveRecurringRule}
            existingExpense={editingExpense}
            initialDate={currentView === 'dashboard' ? dashboardDate : undefined}
            defaultPaymentMode={user.defaultPaymentMode}
            defaultType={addModalType}
            allowPrint={currentView === 'transactions'}
            currencySymbol={getCurrencySymbol()}
        />
      )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
const NavButton = ({ active, onClick, icon, label }: any) => (
    <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium ${active ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg shadow-slate-200 dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${active ? 'text-primary dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
    >
        {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
    </button>
);