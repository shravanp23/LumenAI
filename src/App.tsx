import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { ArchitectureGuideModal } from './components/ArchitectureGuideModal';
import { 
  UserProfile, Conversation, ProcessedVideo 
} from './types';
import { 
  getAuthToken, removeAuthToken, apiGetCurrentUser, 
  apiGetConversations, apiCreateConversation, apiRenameConversation, apiDeleteConversation, 
  apiProcessYoutubeVideo, apiGetVideos, apiSendChatMessage 
} from './lib/api';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Theme state: LIGHT MODE default per prompt requirements
  const [darkMode, setDarkMode] = useState(false);

  // Layout & Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Conversations & Video State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [videos, setVideos] = useState<ProcessedVideo[]>([]);
  
  // Processing & Sending Loaders
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isArchGuideOpen, setIsArchGuideOpen] = useState(false);

  // Apply dark mode class to <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial Auth Check
  useEffect(() => {
    checkAuthSession();

    // Listen for unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
      setConversations([]);
      setVideos([]);
      setActiveConversationId(undefined);
    };
    window.addEventListener('lumen_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('lumen_unauthorized', handleUnauthorized);
  }, []);

  const checkAuthSession = async () => {
    setAuthChecking(true);
    try {
      const token = getAuthToken();
      if (token) {
        const currentUser = await apiGetCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          await loadUserData();
        } else {
          removeAuthToken();
        }
      }
    } catch (err) {
      console.error('Session verification failed:', err);
      removeAuthToken();
    } finally {
      setAuthChecking(false);
    }
  };

  const loadUserData = async () => {
    try {
      const [convs, vids] = await Promise.all([
        apiGetConversations(),
        apiGetVideos()
      ]);
      setConversations(convs);
      setVideos(vids);
      if (convs.length > 0 && !activeConversationId) {
        setActiveConversationId(convs[0].id);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const handleAuthSuccess = async (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    await loadUserData();
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    setConversations([]);
    setVideos([]);
    setActiveConversationId(undefined);
    setIsSettingsOpen(false);
  };

  // Video Processing Handler
  const handleProcessUrl = async (url: string) => {
    setIsProcessing(true);
    setProcessingStep('Extracting YouTube transcript & video metadata...');

    try {
      setTimeout(() => setProcessingStep('Chunking transcript into vector context windows...'), 1200);
      setTimeout(() => setProcessingStep('Generating dense vector embeddings with Gemini...'), 2500);
      setTimeout(() => setProcessingStep('Synthesizing executive summary & key insights...'), 4000);

      const result = await apiProcessYoutubeVideo(url);
      setVideos(prev => [result.video, ...prev.filter(v => v.id !== result.video.id)]);
      
      // Update conversations with newly created conversation
      setConversations(prev => [result.conversation, ...prev.filter(c => c.id !== result.conversation.id)]);
      setActiveConversationId(result.conversation.id);
    } catch (err: any) {
      alert(err.message || 'LumenAI was unable to process this video URL.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Send Chat Query Handler
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    setIsSending(true);

    try {
      const activeConv = conversations.find(c => c.id === activeConversationId);
      const activeVideo = videos.find(v => v.id === activeConv?.videoId) || (videos.length > 0 ? videos[0] : undefined);

      const res = await apiSendChatMessage(
        messageText,
        activeVideo?.id,
        activeConversationId
      );

      // Update conversations list with updated session & messages
      setConversations(prev => {
        const exists = prev.some(c => c.id === res.conversation.id);
        if (exists) {
          return prev.map(c => c.id === res.conversation.id ? res.conversation : c);
        } else {
          return [res.conversation, ...prev];
        }
      });

      setActiveConversationId(res.conversation.id);
    } catch (err: any) {
      alert(err.message || 'Failed to send message to LumenAI.');
    } finally {
      setIsSending(false);
    }
  };

  // New Chat Handler
  const handleNewChat = () => {
    setActiveConversationId(undefined);
  };

  // Rename Conversation Handler
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const updated = await apiRenameConversation(id, newTitle);
      setConversations(prev => prev.map(c => c.id === id ? updated : c));
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  // Delete Conversation Handler
  const handleDeleteConversation = async (id: string) => {
    try {
      await apiDeleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter(c => c.id !== id);
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : undefined);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Derived Active State
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
  const activeVideo = activeConversation?.videoId 
    ? videos.find(v => v.id === activeConversation.videoId) || null 
    : (videos.length > 0 ? videos[0] : null);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl animate-bounce shadow-lg">
          L
        </div>
        <p className="text-xs font-bold text-slate-500 animate-pulse">Initializing LumenAI Engine...</p>
      </div>
    );
  }

  // Render Auth Screen if user is not logged in
  if (!user) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="h-screen w-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden">
      
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Chat Interface Canvas */}
      <ChatInterface
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        activeConversation={activeConversation}
        activeVideo={activeVideo}
        onProcessUrl={handleProcessUrl}
        isProcessing={isProcessing}
        processingStep={processingStep}
        onSendMessage={handleSendMessage}
        isSending={isSending}
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewChat={handleNewChat}
      />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        onOpenArchGuide={() => setIsArchGuideOpen(true)}
      />

      <ArchitectureGuideModal
        isOpen={isArchGuideOpen}
        onClose={() => setIsArchGuideOpen(false)}
      />

    </div>
  );
}
