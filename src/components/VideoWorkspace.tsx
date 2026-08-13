import React, { useState, useEffect, useRef } from 'react';
import { ProcessedVideo, ChatMessage, RAGQueryResult } from '../types';
import { 
  Play, Pause, Volume2, Youtube, Send, Sparkles, Clock, 
  FileText, Database, Lightbulb, Copy, Check, RefreshCw, 
  Trash2, ChevronDown, ChevronUp, Download, ExternalLink, MessageSquare, ArrowLeft,
  Share2
} from 'lucide-react';
import { formatTimestamp } from '../../server/rag.js';

interface VideoWorkspaceProps {
  video: ProcessedVideo;
  onBack: () => void;
}

export const VideoWorkspace: React.FC<VideoWorkspaceProps> = ({ video, onBack }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'insights' | 'transcript' | 'vectorStore'>('summary');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [searchTranscript, setSearchTranscript] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedChunksMsgId, setExpandedChunksMsgId] = useState<string | null>(null);

  // YouTube Iframe player state
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load chat session history
  useEffect(() => {
    fetchHistory();
  }, [video.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/chat/history/${video.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.session?.messages) {
          setMessages(data.session.messages);
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleSeekToTimestamp = (seconds: number) => {
    if (iframeRef.current) {
      // Send postMessage command to YouTube Iframe API
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [seconds, true]
        }),
        '*'
      );
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'playVideo',
          args: []
        }),
        '*'
      );
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isQuerying) return;

    setInputPrompt('');
    setIsQuerying(true);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sessionId: `session_${video.id}`,
      sender: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          message: prompt
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
        }
      } else {
        throw new Error('API server error');
      }
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback assistant message
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sessionId: `session_${video.id}`,
        sender: 'assistant',
        content: `I encountered an issue querying the vector database. Please try re-sending your question.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Clear entire chat conversation history for this video?')) {
      try {
        await fetch(`/api/chat/clear/${video.id}`, { method: 'POST' });
        setMessages([]);
      } catch (err) {
        console.error('Failed to clear history:', err);
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTranscript = video.transcript.filter(seg =>
    seg.text.toLowerCase().includes(searchTranscript.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Workspace Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Vector DB Active
          </span>

          <a
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Youtube className="w-3.5 h-3.5 text-red-500" />
            <span>Open on YouTube</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Main Split Screen (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Video Player & Context Tabs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Synchronized YouTube Video Player */}
          <div className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-xl border border-slate-800">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${video.youtubeId}?enablejsapi=1&autoplay=0&origin=${window.location.origin}`}
              title={video.metadata.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Video Information Header */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold text-red-600 dark:text-red-400">{video.metadata.channelTitle}</span>
              <span>Duration: {formatTimestamp(video.metadata.duration)}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {video.metadata.title}
            </h1>
          </div>

          {/* Context Tab Controls */}
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-2 flex items-center gap-1 overflow-x-auto shadow-xs">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'summary'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'insights'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Key Insights</span>
            </button>

            <button
              onClick={() => setActiveTab('transcript')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'transcript'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Full Transcript ({video.transcript.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('vectorStore')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'vectorStore'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Vector Chunks ({video.chunkCount})</span>
            </button>
          </div>

          {/* TAB CONTENT PANELS */}
          
          {/* 1. SUMMARY TAB */}
          {activeTab === 'summary' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-5 shadow-xs">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Executive Summary
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  {video.summary?.short || 'No summary available.'}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Bulleted Takeaways
                </h3>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-1.5 whitespace-pre-line">
                  {video.summary?.medium}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Chronological Breakdown
                </h3>
                <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 whitespace-pre-line font-sans">
                  {video.summary?.detailed}
                </div>
              </div>
            </div>
          )}

          {/* 2. KEY INSIGHTS TAB */}
          {activeTab === 'insights' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-5 shadow-xs">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  Topic Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {video.summary?.topics?.map((topic, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200 dark:border-indigo-800/50"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  Key Insights & Actionable Takeaways
                </h3>
                <div className="space-y-3">
                  {video.summary?.keyInsights?.map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/50 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                        {insight}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. FULL TRANSCRIPT TAB */}
          {activeTab === 'transcript' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <Clock className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTranscript}
                  onChange={(e) => setSearchTranscript(e.target.value)}
                  placeholder="Search transcript text..."
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2 pr-2 divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredTranscript.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No matching captions found.</p>
                ) : (
                  filteredTranscript.map((seg, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSeekToTimestamp(seg.start)}
                      className="pt-2 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 p-2 rounded-lg transition-colors group"
                    >
                      <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 font-mono text-[11px] font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                        {formatTimestamp(seg.start)}
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {seg.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. VECTOR STORE CHUNKS TAB */}
          {activeTab === 'vectorStore' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Vector Index Engine: <strong>Gemini Embedding 2 / Dense Vector</strong></span>
                <span>{video.chunkCount} Total Chunks</span>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {video.summary && (
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1">
                    <div className="text-emerald-400 font-bold">Vector Store Schema Inspection</div>
                    <div>Collection: video_chunks_{video.youtubeId}</div>
                    <div>Dimensions: 768 (Gemini standard embedding space)</div>
                    <div>Metric: Cosine Similarity</div>
                  </div>
                )}

                {/* Vector Chunk Sample List */}
                {video.transcript.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Indexed Context Window Chunks:</p>
                    {[0, 1, 2, 3].map((num) => {
                      const sampleSeg = video.transcript[num * 4];
                      if (!sampleSeg) return null;
                      return (
                        <div key={num} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                            <span className="text-red-500 font-bold">Chunk #{num + 1}</span>
                            <span>Range: [{formatTimestamp(sampleSeg.start)} - {formatTimestamp(sampleSeg.start + 60)}]</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 line-clamp-2 italic">
                            "{sampleSeg.text}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT PANEL: AI Chatbot Interface (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col h-[700px] overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 p-0.5 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Video AI Assistant</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">Grounding in exact transcript vectors</p>
              </div>
            </div>

            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            
            {/* Welcome Bot Greeting */}
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-sm">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Ask anything about this video</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                    Answers are powered by RAG vector retrieval with instant timestamp links.
                  </p>
                </div>

                {/* Default Suggested Questions */}
                {video.summary?.suggestedQuestions && (
                  <div className="pt-2 text-left space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">
                      Suggested prompts to start:
                    </p>
                    {video.summary.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-red-50/80 dark:bg-slate-900/60 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 text-left font-medium transition-all group flex items-center justify-between"
                      >
                        <span className="truncate">{q}</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-2 group-hover:scale-110 transition-transform" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat Bubble Items */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Sender Avatar/Label */}
                <span className="text-[10px] font-medium text-slate-400 px-1">
                  {msg.sender === 'user' ? 'You' : 'TubeMind RAG Assistant'}
                </span>

                {/* Bubble Container */}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[90%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-red-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/70 shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* Timestamp Citations Badges */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Exact Video Citations:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((cit, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => handleSeekToTimestamp(cit.timestamp)}
                            className="px-2 py-1 rounded bg-red-100 dark:bg-red-950/80 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300 text-[11px] font-mono font-bold flex items-center gap-1 border border-red-200 dark:border-red-800/50 transition-colors"
                            title={cit.textSnippet}
                          >
                            <Play className="w-3 h-3 fill-red-600 text-red-600" />
                            <span>[{cit.formattedTime}]</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inspection of Retrieved Vector Chunks */}
                  {msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setExpandedChunksMsgId(expandedChunksMsgId === msg.id ? null : msg.id)}
                        className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                      >
                        <Database className="w-3 h-3" />
                        <span>{expandedChunksMsgId === msg.id ? 'Hide' : 'Inspect'} Retrieved Vector Chunks ({msg.retrievedChunks.length})</span>
                      </button>

                      {expandedChunksMsgId === msg.id && (
                        <div className="mt-2 space-y-1.5 p-2 rounded-lg bg-slate-900 text-slate-300 font-mono text-[10px]">
                          {msg.retrievedChunks.map((chunk, k) => (
                            <div key={k} className="border-b border-slate-800 last:border-0 pb-1">
                              <div className="flex justify-between text-emerald-400 font-semibold">
                                <span>Chunk #{k + 1} ({formatTimestamp(chunk.start)})</span>
                                <span>Sim Score: {chunk.score}</span>
                              </div>
                              <p className="text-slate-400 line-clamp-2 italic text-[9.5px]">"{chunk.text}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Claude-Style Smart Follow-Up Prompts */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="pt-1 text-left space-y-1 max-w-[90%]">
                    <p className="text-[10px] font-semibold text-slate-400 px-1">Suggested Follow-ups:</p>
                    <div className="flex flex-col gap-1">
                      {msg.suggestedFollowUps.map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSendMessage(prompt)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-red-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 text-left transition-all flex items-center justify-between group"
                        >
                          <span className="truncate">{prompt}</span>
                          <Sparkles className="w-3 h-3 text-amber-500 ml-1.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))}

            {/* Query Processing Indicator */}
            {isQuerying && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span>Searching vector store & synthesizing answer with Gemini...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask a question about this video..."
                disabled={isQuerying}
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-red-500 dark:focus:border-red-500 placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={isQuerying || !inputPrompt.trim()}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
