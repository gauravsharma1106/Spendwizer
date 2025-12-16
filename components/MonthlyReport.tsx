import React, { useState, useMemo } from 'react';
import { Expense, Category, CATEGORY_COLORS, CATEGORY_ICONS } from '../types';
import { ChevronLeft, ChevronRight, TrendingUp, Calendar, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { format, endOfMonth, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface MonthlyReportProps {
  expenses: Expense[];
  currencySymbol: string;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({ expenses, currencySymbol }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [focusedDay, setFocusedDay] = useState<{date: string, amount: number} | null>(null);

  const currentMonthStr = format(selectedDate, 'yyyy-MM');

  const monthExpenses = useMemo(() => 
    expenses.filter(e => e.date.startsWith(currentMonthStr) && (!e.type || e.type === 'expense')),
  [expenses, currentMonthStr]);

  const totalSpent = useMemo(() => 
    monthExpenses.reduce((sum, e) => sum + e.amount, 0),
  [monthExpenses]);

  // Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(e => {
        map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses]);

  // Daily Trend Data
  const trendData = useMemo(() => {
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });
    
    // Fill all days with 0 first
    const dailyMap: Record<string, number> = {};
    days.forEach(day => {
        dailyMap[format(day, 'yyyy-MM-dd')] = 0;
    });

    monthExpenses.forEach(e => {
        dailyMap[e.date] = (dailyMap[e.date] || 0) + e.amount;
    });

    return Object.entries(dailyMap).map(([date, amount]) => ({
        fullDate: date,
        day: format(new Date(date), 'd'),
        amount
    }));
  }, [monthExpenses, selectedDate]);

  const highestSpendDay = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(e => {
        map[e.date] = (map[e.date] || 0) + e.amount;
    });
    const sorted = Object.entries(map).sort(([, a], [, b]) => b - a);
    return sorted.length > 0 ? { date: sorted[0][0], amount: sorted[0][1] } : null;
  }, [monthExpenses]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
    setFocusedDay(null); // Reset selection on month change
  };

  const formattedMonth = format(selectedDate, 'MMMM yyyy');

  return (
    <div className="space-y-6 pb-28">
        {/* Month Selector */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-colors text-slate-500 dark:text-slate-400">
                <ChevronLeft size={24} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{formattedMonth}</h2>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-colors text-slate-500 dark:text-slate-400">
                <ChevronRight size={24} />
            </button>
        </div>

        {/* Total Summary */}
        <div className="bg-slate-900 dark:bg-indigo-900/50 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 dark:shadow-none overflow-hidden relative">
            <div className="relative z-10">
                <p className="text-slate-400 font-medium mb-1 text-sm uppercase tracking-wider">Total Spent</p>
                <div className="flex items-baseline">
                    <span className="text-3xl font-light opacity-80 mr-1">{currencySymbol}</span>
                    <span className="text-4xl font-bold tracking-tight">{totalSpent.toLocaleString()}</span>
                </div>
                {highestSpendDay && (
                    <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center text-sm text-slate-300">
                        <TrendingUp size={16} className="mr-2 text-emerald-400" />
                        <span>Peak: <b>{currencySymbol}{highestSpendDay.amount.toLocaleString()}</b> on {format(new Date(highestSpendDay.date), 'do MMM')}</span>
                    </div>
                )}
            </div>
            {/* Abstract bg shape */}
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-10 -mb-10"></div>
        </div>

        {/* Spend Trend Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <h3 className="text-slate-800 dark:text-white font-bold mb-4 flex items-center justify-between">
                <span className="flex items-center"><TrendingUp size={18} className="mr-2 text-primary" /> Spending Trend</span>
                {focusedDay && (
                    <span className="text-xs font-normal text-slate-400">Tap chart to change</span>
                )}
             </h3>
             <div className="h-48 relative z-0">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                        data={trendData}
                        onClick={(data) => {
                            if (data && data.activePayload && data.activePayload.length > 0) {
                                const { fullDate, amount } = data.activePayload[0].payload;
                                setFocusedDay({ date: fullDate, amount });
                            }
                        }}
                    >
                        <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#e2e8f0" strokeOpacity={0.3} />
                        <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 10}} 
                            interval={4} 
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                            formatter={(value: number) => [`${currencySymbol}${value}`, 'Spent']}
                            labelFormatter={(label) => `Day ${label}`}
                            cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#6366f1" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorAmount)" 
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                        />
                    </AreaChart>
                 </ResponsiveContainer>
             </div>

             <AnimatePresence>
                {focusedDay ? (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }} 
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="pt-4 border-t border-slate-50 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4">
                            <div>
                                <p className="text-xs text-primary dark:text-indigo-300 font-bold uppercase tracking-wider mb-1">
                                    {format(new Date(focusedDay.date), 'EEEE, MMMM do')}
                                </p>
                                <p className="text-slate-900 dark:text-white font-bold text-xl">
                                    Total: {currencySymbol}{focusedDay.amount.toLocaleString()}
                                </p>
                            </div>
                            <button 
                                onClick={() => setFocusedDay(null)} 
                                className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-full shadow-sm transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="mt-3 text-center">
                         <p className="text-[10px] text-slate-300 dark:text-slate-600 uppercase tracking-widest font-semibold">Tap chart to view details</p>
                    </div>
                )}
             </AnimatePresence>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-white">Top Categories</h3>
            </div>
            
            {categoryBreakdown.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">No expenses found for {formattedMonth}</div>
            ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {categoryBreakdown.map((item) => (
                        <div key={item.name} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                    {CATEGORY_ICONS[item.name as Category]}
                                </div>
                                <div>
                                    <span className="block text-slate-800 dark:text-slate-200 font-semibold">{item.name}</span>
                                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                        <div 
                                            className="h-full rounded-full" 
                                            style={{ 
                                                width: `${(item.value / totalSpent) * 100}%`,
                                                backgroundColor: CATEGORY_COLORS[item.name as Category] 
                                            }} 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-bold text-slate-900 dark:text-white">{currencySymbol}{item.value.toLocaleString()}</span>
                                <span className="text-xs text-slate-400 font-medium">{Math.round((item.value / totalSpent) * 100)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};