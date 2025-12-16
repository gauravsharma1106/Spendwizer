import React, { useState, useRef } from 'react';
import { User, CURRENCIES } from '../types';
import { Button } from './ui/Button';
import { Save, Download, Trash2, LogOut, Moon, Sun, Globe, Camera, User as UserIcon, Briefcase, Calendar } from 'lucide-react';
import { storageService } from '../services/storageService';

interface SettingsProps {
    user: User;
    onUpdateUser: (user: User) => void;
    onLogout: () => void;
    onExport: () => void;
    onClearData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout, onExport, onClearData }) => {
    const [budget, setBudget] = useState<string>(user.monthlyBudget ? user.monthlyBudget.toString() : '');
    const [name, setName] = useState(user.name || '');
    const [age, setAge] = useState(user.age ? user.age.toString() : '');
    const [profession, setProfession] = useState(user.profession || '');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveProfile = () => {
        const updated = { 
            ...user, 
            name, 
            age: parseInt(age) || undefined, 
            profession 
        };
        storageService.setUser(updated);
        onUpdateUser(updated);
        alert('Profile updated!');
    };

    const handleSaveBudget = () => {
        const val = parseFloat(budget);
        if (!isNaN(val)) {
            const updated = { ...user, monthlyBudget: val };
            storageService.setUser(updated);
            onUpdateUser(updated);
            alert('Budget updated successfully!');
        }
    };

    const toggleDarkMode = () => {
        const updated = { ...user, darkMode: !user.darkMode };
        storageService.setUser(updated);
        onUpdateUser(updated);
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const updated = { ...user, currency: e.target.value };
        storageService.setUser(updated);
        onUpdateUser(updated);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const updated = { ...user, profilePic: reader.result as string };
                storageService.setUser(updated);
                onUpdateUser(updated);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const getInitials = () => {
        return name ? name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
    };

    return (
        <div className="space-y-6 pb-28">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white px-2">Settings</h2>

            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10"></div>
                
                <div className="relative flex flex-col items-center sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 mt-4">
                    <div className="relative group">
                        <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            {user.profilePic ? (
                                <img src={user.profilePic} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-primary dark:text-indigo-200">{getInitials()}</span>
                            )}
                        </div>
                        <button 
                            onClick={triggerFileInput}
                            className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full hover:bg-slate-700 transition-colors shadow-sm"
                        >
                            <Camera size={16} />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                        />
                    </div>
                    
                    <div className="flex-1 w-full space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                                <div className="relative">
                                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary text-sm font-medium text-slate-800 dark:text-white"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Profession</label>
                                <div className="relative">
                                    <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary text-sm font-medium text-slate-800 dark:text-white"
                                        value={profession}
                                        onChange={(e) => setProfession(e.target.value)}
                                        placeholder="e.g. Developer"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Age</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="number" 
                                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary text-sm font-medium text-slate-800 dark:text-white"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                    />
                                </div>
                            </div>
                             <div className="flex items-end">
                                <Button onClick={handleSaveProfile} fullWidth className="py-2 text-sm h-[38px]">Update Profile</Button>
                            </div>
                        </div>
                        <div className="pt-2">
                             <p className="text-xs text-slate-400 text-center sm:text-left">{user.email} • Free Plan</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appearance & Currency */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                    <Globe size={20} className="mr-2 text-primary" /> General
                </h3>
                
                <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Dark Mode</span>
                    <button 
                        onClick={toggleDarkMode}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${user.darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${user.darkMode ? 'translate-x-7' : 'translate-x-1'} flex items-center justify-center`}>
                            {user.darkMode ? <Moon size={14} className="text-slate-800" /> : <Sun size={14} className="text-yellow-500" />}
                        </span>
                    </button>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Currency</label>
                    <select 
                        value={user.currency || 'INR'}
                        onChange={handleCurrencyChange}
                        className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary font-bold text-slate-800 dark:text-white appearance-none"
                    >
                        {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
                        ))}
                    </select>
                </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Monthly Budget</label>
                    <div className="flex space-x-2">
                        <input 
                            type="number" 
                            className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary font-bold text-slate-800 dark:text-white"
                            placeholder="e.g. 20000"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                        />
                        <Button onClick={handleSaveBudget}>
                            <Save size={20} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Data Management</h3>
                <div className="space-y-3">
                    <button 
                        onClick={onExport}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left"
                    >
                        <div className="flex items-center">
                            <Download size={20} className="text-slate-500 dark:text-slate-400 mr-3" />
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-200">Export CSV</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Download all your expenses</p>
                            </div>
                        </div>
                    </button>
                    
                    <button 
                        onClick={onClearData}
                        className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left group"
                    >
                        <div className="flex items-center">
                            <Trash2 size={20} className="text-red-400 group-hover:text-red-500 mr-3" />
                            <div>
                                <p className="font-medium text-red-600 dark:text-red-400">Clear All Data</p>
                                <p className="text-xs text-red-400/70 dark:text-red-400/60">Permanently delete everything</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <Button variant="outline" fullWidth onClick={onLogout} className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900">
                <LogOut size={18} className="mr-2" /> Sign Out
            </Button>
            
            <div className="text-center text-xs text-slate-300 dark:text-slate-600 py-4">
                Spendwizer v2.2 • Offline First
            </div>
        </div>
    );
};