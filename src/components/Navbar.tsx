import React from 'react';
import { Youtube, Sparkles, BookOpen, Layers, Moon, Sun, LogIn, UserCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'home' | 'dashboard' | 'workspace';
  setActiveTab: (tab: 'home' | 'dashboard' | 'workspace') => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenArchGuide: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onOpenArchGuide,
  darkMode,
  setDarkMode
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 p-0.5 shadow-md group-hover:shadow-red-500/20 transition-all">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white">
              <Youtube className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                Tube<span className="text-red-500">Mind</span> RAG
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800/50">
                PRO AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 font-medium hidden sm:block">
              YouTube Video Vector Chatbot
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'home'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>My Library</span>
          </button>

          <button
            onClick={onOpenArchGuide}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/50 transition-all flex items-center gap-1.5 hidden md:flex"
          >
            <BookOpen className="w-4 h-4" />
            <span>Architecture & Mentor Guide</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* User Auth */}
          {user ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/30"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
                {user.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
