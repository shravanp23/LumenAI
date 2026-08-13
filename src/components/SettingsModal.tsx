import React, { useState } from 'react';
import { X, User, Shield, Palette, Info, Check, Lock, LogOut, Sun, Moon, Laptop, Github, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { apiChangePassword } from '../lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onLogout: () => void;
  onOpenArchGuide: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  darkMode,
  setDarkMode,
  onLogout,
  onOpenArchGuide
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'security' | 'about'>('account');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);
    setPassLoading(true);

    try {
      const msg = await apiChangePassword(currentPassword, newPassword);
      setPassSuccess(msg);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full h-[80vh] max-h-[600px] overflow-hidden flex flex-col relative">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">LumenAI Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage account, appearance, and security</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Layout: Nav Tabs + Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Sidebar Tabs */}
          <div className="md:col-span-4 p-3 space-y-1 bg-slate-50/40 dark:bg-slate-900/30">
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'account'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/80 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Account</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'appearance'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/80 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Appearance</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'security'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/80 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'about'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/80 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About</span>
            </button>
          </div>

          {/* Main Content Pane */}
          <div className="md:col-span-8 p-6 overflow-y-auto space-y-6">
            
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Account Profile</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your personal account details in LumenAI</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-4">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500/80"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{user.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                      {user.provider} Auth Session
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Name</label>
                    <input
                      type="text"
                      readOnly
                      value={user.name}
                      className="w-full mt-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                    <input
                      type="email"
                      readOnly
                      value={user.email}
                      className="w-full mt-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Appearance & Theme</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Customize how LumenAI looks on your screen</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDarkMode(false)}
                    className={`p-4 rounded-2xl border text-left transition-all space-y-3 ${
                      !darkMode
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 shadow-sm ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm">Light Mode</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Clean off-white interface with charcoal text</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setDarkMode(true)}
                    className={`p-4 rounded-2xl border text-left transition-all space-y-3 ${
                      darkMode
                        ? 'border-indigo-600 bg-indigo-950/40 text-indigo-200 shadow-sm ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center font-bold">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm">Dark Mode</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Deep slate canvas with soft comfortable contrast</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Security & Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update your password and active session settings</p>
                </div>

                {passError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>{passError}</span>
                  </div>
                )}

                {passSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{passSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full mt-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full mt-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passLoading}
                    className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs"
                  >
                    {passLoading ? 'Updating...' : 'Change Password'}
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Active Session</p>
                    <p className="text-[11px] text-slate-400">Sign out from this device</p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="py-2 px-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-2 border border-red-200/60 dark:border-red-800/60 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">About LumenAI</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">AI Video Knowledge Assistant Studio</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">LumenAI Version</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                      v2.5.0-production
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">LLM Backbone</span>
                    <span>Google Gemini 3.6 Flash</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Vector Engine</span>
                    <span>Gemini Dense Vector Embeddings (768d)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenArchGuide();
                    }}
                    className="w-full p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-between hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>View Senior AI Architecture & Mentor Guide (Phases 1-15)</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold">&rarr;</span>
                  </button>

                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      <span>LumenAI Open Source Repository</span>
                    </div>
                    <span className="text-[10px] text-slate-400">&rarr;</span>
                  </a>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
