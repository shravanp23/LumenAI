import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, Send, Play, Youtube, Clock, CheckCircle2, Sparkles, Copy, Check, 
  Layers, FileText, ChevronDown, ChevronUp, AlertCircle, RefreshCw, ExternalLink, User, X, BookOpen 
} from 'lucide-react';
import { ProcessedVideo, Conversation, ChatMessage, UserProfile } from '../types';

interface ChatInterfaceProps {
  onToggleMobileSidebar: () => void;
  activeConversation: Conversation | null;
  activeVideo: ProcessedVideo | null;
  onProcessUrl: (url: string) => Promise<void>;
  isProcessing: boolean;
  processingStep: string;
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
  user: UserProfile;
  onOpenSettings: () => void;
  onNewChat: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onToggleMobileSidebar,
  activeConversation,
  activeVideo,
  onProcessUrl,
  isProcessing,
  processingStep,
  onSendMessage,
  isSending,
  user,
  onOpenSettings,
  onNewChat
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'summary' | 'transcript' | 'chunks'>('chat');
  
  // Video Player Seeking State
  const [activeSeekTime, setActiveSeekTime] = useState<number | null>(null);
  const [isPlayingModalOpen, setIsPlayingModalOpen] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [expandedChunksMsgId, setExpandedChunksMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isSending]);

  // Handle URL Process
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim() || isProcessing) return;
    await onProcessUrl(youtubeUrl.trim());
    setYoutubeUrl('');
  };

  // Handle Message Send
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isSending) return;
    const msgToSend = inputMessage.trim();
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(msgToSend);
  };

  // Handle Enter key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-grow textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const copyToClipboard = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSeek = (seconds: number) => {
    setActiveSeekTime(seconds);
    setIsPlayingModalOpen(true);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Sample prompt chips
  const samplePrompts = [
    "Summarize this video in 3 key takeaways",
    "What are the main points discussed?",
    "Explain the core concept in simple terms",
    "What did the speaker say about future trends?"
  ];

  return (
    <div className="flex-1 h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden relative">
      
      {/* Top Header Bar */}
      <header className="h-14 px-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
              {activeConversation?.title || activeVideo?.metadata.title || 'LumenAI Chat'}
            </span>
            {activeVideo && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Ready</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <span>+ New Chat</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1 rounded-full ring-2 ring-indigo-500/40 hover:scale-105 transition-transform"
          >
            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        
        {/* State A: Welcome & URL Input Screen (When no active video or empty chat) */}
        {!activeVideo && (!activeConversation || activeConversation.messages.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-2xl mx-auto w-full text-center my-auto space-y-8 animate-fade-in">
            
            {/* Logo Badge */}
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-xl shadow-indigo-500/20">
                L
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                LumenAI
              </h1>
              <p className="text-base sm:text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                Chat with any YouTube video
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Paste a YouTube URL and start asking questions about the video's content with instant timestamp citations.
              </p>
            </div>

            {/* Main URL Process Container */}
            <form onSubmit={handleUrlSubmit} className="w-full space-y-3">
              <div className="relative flex items-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all">
                <Youtube className="w-5 h-5 text-red-500 ml-3 flex-shrink-0" />
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Paste YouTube video URL... (e.g. https://www.youtube.com/watch?v=...)"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400"
                  required
                />
                <button
                  type="submit"
                  disabled={isProcessing || !youtubeUrl.trim()}
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Process</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Processing Progress Status */}
              {isProcessing && (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs flex items-center justify-center gap-2 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="font-semibold">{processingStep || 'Extracting video transcript & vectorizing...'}</span>
                </div>
              )}
            </form>

            {/* Example Prompts Grid */}
            <div className="w-full space-y-3 pt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
                Try asking questions like:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {samplePrompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputMessage(promptText);
                      if (textareaRef.current) textareaRef.current.focus();
                    }}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs transition-all flex items-start gap-2.5 group"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform flex-shrink-0 mt-0.5" />
                    <span>"{promptText}"</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        ) : (
          
          /* State B: Active Video + Chat Messages Area */
          <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1 flex flex-col">
            
            {/* Processed Video Banner Header */}
            {activeVideo && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative group cursor-pointer flex-shrink-0" onClick={() => handleSeek(0)}>
                      <img
                        src={activeVideo.metadata.thumbnailUrl}
                        alt={activeVideo.metadata.title}
                        className="w-24 h-16 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                        {activeVideo.metadata.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {activeVideo.metadata.channelTitle} • {formatSeconds(activeVideo.metadata.duration)} duration • {activeVideo.chunkCount} vector chunks
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>✓ Ready to chat</span>
                        </span>

                        <a
                          href={activeVideo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Open on YouTube</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Navigation View Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-stretch sm:self-auto justify-center">
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'chat'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'summary'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => setActiveTab('transcript')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'transcript'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Transcript
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Chat View */}
            {activeTab === 'chat' && (
              <div className="flex-1 space-y-6">
                
                {/* Message Stream */}
                {activeConversation?.messages.map((msg) => {
                  const isUser = msg.sender === 'user';

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-sm mt-1">
                          L
                        </div>
                      )}

                      <div className={`space-y-3 max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                        
                        {/* Bubble Container */}
                        <div
                          className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                            isUser
                              ? 'bg-indigo-600 text-white rounded-tr-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.content}</p>

                          {/* Timestamp Citation Links */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5">
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Video Citations:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.citations.map((cit, cIdx) => (
                                  <button
                                    key={cIdx}
                                    onClick={() => handleSeek(cit.timestamp)}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1 transition-all"
                                  >
                                    <Play className="w-3 h-3 fill-indigo-600 dark:fill-indigo-400" />
                                    <span>[{cit.formattedTime}]</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Assistant Tools Footer */}
                        {!isUser && (
                          <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-slate-400">
                            <button
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                              className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                              {copiedMsgId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-500 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
                              <button
                                onClick={() => setExpandedChunksMsgId(expandedChunksMsgId === msg.id ? null : msg.id)}
                                className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              >
                                <Layers className="w-3.5 h-3.5" />
                                <span>{msg.retrievedChunks.length} Vector Chunks</span>
                                {expandedChunksMsgId === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Expandable Vector Chunk Inspector */}
                        {!isUser && expandedChunksMsgId === msg.id && msg.retrievedChunks && (
                          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2 animate-fade-in">
                            <p className="font-bold text-slate-700 dark:text-slate-300">
                              Top Retrieved Vector Chunks (Cosine Similarity):
                            </p>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {msg.retrievedChunks.map((chk, chkIdx) => (
                                <div key={chkIdx} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                                  <div className="flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400">
                                    <span>Timestamp: {formatSeconds(chk.start)} - {formatSeconds(chk.end)}</span>
                                    <span>Score: {(chk.score * 100).toFixed(1)}%</span>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-300 line-clamp-3 font-mono text-[10px]">
                                    "{chk.text}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Follow-up Prompts */}
                        {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <p className="text-[11px] font-bold text-slate-400">Suggested Follow-ups:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.suggestedFollowUps.map((fol, fIdx) => (
                                <button
                                  key={fIdx}
                                  onClick={() => {
                                    setInputMessage(fol);
                                    if (textareaRef.current) textareaRef.current.focus();
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-300 font-medium text-xs shadow-2xs transition-all flex items-center gap-1.5 group"
                                >
                                  <Sparkles className="w-3 h-3 text-indigo-500 group-hover:scale-110 transition-transform" />
                                  <span>{fol}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>

                      {isUser && (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-500 flex-shrink-0 mt-1"
                        />
                      )}
                    </div>
                  );
                })}

                {/* Loading State during Generation */}
                {isSending && (
                  <div className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                      L
                    </div>
                    <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>LumenAI is searching vector chunks & synthesizing response...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* TAB CONTENT: Summary & Key Insights */}
            {activeTab === 'summary' && activeVideo && (
              <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Executive Summary</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    {activeVideo.summary.short}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Key Insights & Takeaways</h3>
                  <ul className="space-y-2">
                    {activeVideo.summary.keyInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Topics Covered</h3>
                  <div className="flex flex-wrap gap-2">
                    {activeVideo.summary.topics.map((tpc, tIdx) => (
                      <span key={tIdx} className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                        #{tpc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Transcript Viewer */}
            {activeTab === 'transcript' && activeVideo && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Full Video Transcript</h3>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {activeVideo.transcript.map((seg, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSeek(seg.start)}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer transition-colors flex items-start gap-3 group"
                    >
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-md flex-shrink-0">
                        {formatSeconds(seg.start)}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        {seg.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Auto-growing Chat Input Footer Bar */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
        <div className="max-w-4xl mx-auto w-full">
          <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={activeVideo ? "Ask anything about this video... (Enter to send, Shift+Enter for newline)" : "Paste a YouTube video URL above or select a conversation..."}
              disabled={isSending}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent outline-none resize-none max-h-40 text-slate-900 dark:text-white placeholder-slate-400 custom-scrollbar"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all disabled:opacity-40 flex-shrink-0 active:scale-95 shadow-sm"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            LumenAI generates answers grounded strictly in YouTube video transcript vectors.
          </p>
        </div>
      </div>

      {/* Interactive YouTube Video Player Modal */}
      {isPlayingModalOpen && activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-3xl w-full overflow-hidden relative space-y-4 p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs sm:text-sm truncate pr-4">
                {activeVideo.metadata.title} {activeSeekTime !== null && `(At ${formatSeconds(activeSeekTime)})`}
              </span>
              <button
                onClick={() => setIsPlayingModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&start=${activeSeekTime || 0}`}
                title={activeVideo.metadata.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
