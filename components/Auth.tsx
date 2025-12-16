import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { Button } from './ui/Button';
import { Wallet, ArrowRight, User as UserIcon, Briefcase, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthProps {
  onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
        setError("Email and Password are required.");
        return;
    }

    if (!isLogin && (!name || !age || !profession)) {
        setError("Please fill in all fields to create your account.");
        return;
    }

    setIsLoading(true);
    
    // Simulate network delay for UX
    setTimeout(() => {
      if (isLogin) {
          const success = storageService.login(email, password);
          if (success) {
              onLogin();
          } else {
              // Check if user exists at all to give better error
              const userExists = storageService.getUser();
              if (!userExists) {
                  setError("No account found. Please create an account.");
              } else {
                  setError("Invalid email or password.");
              }
              setIsLoading(false);
          }
      } else {
          // Signup
          const success = storageService.signup({
              email,
              password,
              name,
              age: parseInt(age),
              profession
          });

          if (success) {
              onLogin();
          } else {
              setError("An account already exists on this device. Please login or clear data from settings to start fresh.");
              setIsLoading(false);
          }
      }
    }, 800);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    // Reset specific fields when switching
    if (isLogin) { // Switching to Signup
        setName('');
        setAge('');
        setProfession('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-indigo-600 shadow-xl shadow-indigo-500/30 text-white rounded-2xl flex items-center justify-center mb-6 transform -rotate-6">
            <Wallet size={32} />
          </div>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Spendwizer</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg">Master your money, offline & private.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h3>
                <button 
                    onClick={toggleMode}
                    className="text-sm font-medium text-primary hover:text-indigo-700 transition-colors"
                >
                    {isLogin ? 'Need an account?' : 'Have an account?'}
                </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm flex items-start"
                        >
                            <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {!isLogin && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden"
                        >
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required={!isLogin}
                                        className="block w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Age</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="number"
                                            required={!isLogin}
                                            className="block w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                                            placeholder="25"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Profession</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            required={!isLogin}
                                            className="block w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                                            placeholder="Designer"
                                            value={profession}
                                            onChange={(e) => setProfession(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                        type="email"
                        required
                        className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                    <input
                        type="password"
                        required
                        className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <Button type="submit" fullWidth disabled={isLoading} className="mt-4 h-12 text-lg shadow-lg shadow-indigo-500/20">
                    {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    {!isLoading && <ArrowRight size={18} className="ml-2" />}
                </Button>
            </form>
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-8">
            Data is stored locally on your device. <br/> No cloud, no tracking.
        </p>
      </div>
    </div>
  );
};