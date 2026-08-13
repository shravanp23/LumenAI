import React, { useState } from 'react';
import { 
  Plus, MessageSquare, Trash2, Edit2, Check, X, 
  Sun, Moon, Settings as SettingsIcon, LogOut, ChevronLeft, ChevronRight, User, Sparkles 
} from 'lucide-react';
import { Conversation, UserProfile, GroupedConversations } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  user: UserProfile;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggleOpen,
  isMobileOpen,
  onCloseMobile,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  user,
  darkMode,
  setDarkMode,
  onOpenSettings,
  onLogout
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Group conversations by Date
  const groupConversations = (items: Conversation[]): GroupedConversations => {
    const now = new Date();
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const previous7Days: Conversation[] = [];
    const older: Conversation[] = [];

    items.forEach(c => {
      const date = new Date(c.updatedAt || c.createdAt);
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        today.push(c);
      } else if (diffDays <= 2) {
        yesterday.push(c);
      } else if (diffDays <= 7) {
        previous7Days.push(c);
      } else {
        older.push(c);
      }
    });

    return { today, yesterday, previous7Days, older };
  };

  const grouped = groupConversations(conversations);

  const startRenaming = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const saveRenaming = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const renderGroup = (title: string, list: Conversation[]) => {
    if (list.length === 0) return null;

    return (
      <div className="space-y-1 my-3">
        <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {title}
        </p>
        <div className="space-y-0.5">
          {list.map(c => {
            const isActive = c.id === activeConversationId;
            const isEditing = c.id === editingId;

            return (
              <div
                key={c.id}
                onClick={() => {
                  onSelectConversation(c.id);
                  onCloseMobile();
                }}
                className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />

                {isEditing ? (
                  <form onSubmit={(e) => saveRenaming(c.id, e)} className="flex-1 flex items-center gap-1 min-w-0" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-xs px-2 py-1 rounded border border-indigo-400 outline-none"
                      autoFocus
                    />
                    <button type="submit" className="p-1 text-emerald-600 hover:text-emerald-700">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <span className="flex-1 truncate">{c.title}</span>
                )}

                {!isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      onClick={(e) => startRenaming(c, e)}
                      title="Rename conversation"
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this conversation?')) {
                          onDeleteConversation(c.id);
                        }
                      }}
                      title="Delete conversation"
                      className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-3.5 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      
      {/* Top Header & New Chat */}
      <div className="space-y-4">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
              L
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base">LumenAI</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                Video
              </span>
            </div>
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleOpen}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          className="w-full py-2.5 px-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto my-2 pr-1 custom-scrollbar">
        {conversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 stroke-1 opacity-50" />
            <p className="text-xs font-medium">No conversations yet.</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Paste a YouTube URL to start a new video chat session.
            </p>
          </div>
        ) : (
          <>
            {renderGroup('Today', grouped.today)}
            {renderGroup('Yesterday', grouped.yesterday)}
            {renderGroup('Previous 7 Days', grouped.previous7Days)}
            {renderGroup('Older', grouped.older)}
          </>
        )}
      </div>

      {/* Bottom Footer Controls */}
      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
        
        {/* Settings & Theme Row */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>

        {/* User Profile Bar */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5 transition-all text-left"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-500/50 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </button>

          {/* Profile Dropdown Popup */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-2 space-y-1 z-30 animate-fade-in">
              <div className="p-2 border-b border-slate-100 dark:border-slate-700/60">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account Profile</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setDarkMode(!darkMode);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
                <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
              </button>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Container */}
      <aside
        className={`hidden md:block h-screen sticky top-0 transition-all duration-300 z-20 ${
          isOpen ? 'w-72' : 'w-0 overflow-hidden'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-80 max-w-[80vw] h-full shadow-2xl z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
