import React, { useState } from 'react';
import { Youtube, ArrowRight, Sparkles, Cpu, Search, Database, MessageSquare, Zap, Play, CheckCircle2 } from 'lucide-react';

interface LandingHeroProps {
  onProcessUrl: (url: string) => void;
  isProcessing: boolean;
  processingStep?: string;
}

const SAMPLE_VIDEOS = [
  {
    title: "Andrej Karpathy: Intro to Large Language Models",
    url: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
    id: "zjkBMFhNj_g",
    duration: "1h 00m",
    topic: "AI Architecture & LLMs"
  },
  {
    title: "Steve Jobs' 2005 Stanford Commencement Address",
    url: "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
    id: "UF8uR6Z6KLc",
    duration: "15m 04s",
    topic: "Inspiration & Leadership"
  },
  {
    title: "Huberman Lab: Master Your Dopamine & Focus",
    url: "https://www.youtube.com/watch?v=QmOF0crdyRU",
    id: "QmOF0crdyRU",
    duration: "2h 14m",
    topic: "Neuroscience & Health"
  },
  {
    title: "MKBHD: The AI Hardware Revolution",
    url: "https://www.youtube.com/watch?v=2-0E10bIn28",
    id: "2-0E10bIn28",
    duration: "14m 20s",
    topic: "Tech & Hardware"
  }
];

export const LandingHero: React.FC<LandingHeroProps> = ({
  onProcessUrl,
  isProcessing,
  processingStep
}) => {
  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onProcessUrl(inputUrl.trim());
    }
  };

  return (
    <div className="relative overflow-hidden py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      {/* Background Animated Gradient Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-red-500/10 dark:bg-red-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-8">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Next-Gen RAG Vector Search & Timestamp Citations</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Chat with any <span className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">YouTube Video</span> using AI RAG
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Extract transcripts, index vector embeddings, ask complex questions, get exact timestamp citations, and generate instant summaries with Gemini 3.6 Flash.
        </p>

        {/* Primary Input Box */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="relative flex items-center p-2 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 focus-within:border-red-500 dark:focus-within:border-red-500 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
              <div className="pl-3 text-slate-400 group-focus-within:text-red-500 transition-colors">
                <Youtube className="w-6 h-6 text-red-500" />
              </div>
              
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=...)"
                disabled={isProcessing}
                className="w-full px-3 py-3 text-sm sm:text-base text-slate-900 dark:text-white bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />

              <button
                type="submit"
                disabled={isProcessing || !inputUrl.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md flex items-center gap-2 transition-all whitespace-nowrap"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze & Vectorize</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Processing Status Banner */}
          {isProcessing && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900/90 text-white border border-slate-700 shadow-lg text-left space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-red-400 animate-pulse" />
                  {processingStep || 'Processing RAG Pipeline...'}
                </span>
                <span className="text-red-400">Gemini 3.6 Flash</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 h-full w-3/4 animate-pulse rounded-full" />
              </div>
              <p className="text-[11px] text-slate-400">
                Extracting captions • Chunking sliding windows • Computing vector embeddings • Indexing vector store
              </p>
            </div>
          )}
        </div>

        {/* Quick Sample Links */}
        <div className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Or try with one-click sample videos:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {SAMPLE_VIDEOS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  setInputUrl(sample.url);
                  onProcessUrl(sample.url);
                }}
                disabled={isProcessing}
                className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-red-500/50 dark:hover:border-red-500/50 hover:bg-white dark:hover:bg-slate-800 text-left transition-all group flex items-start gap-3 shadow-xs"
              >
                <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-700">
                  <img
                    src={`https://i.ytimg.com/vi/${sample.id}/hqdefault.jpg`}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-red-600 dark:text-red-400">{sample.topic}</span>
                    <span>{sample.duration}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {sample.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tech Features Grid */}
        <div className="pt-10 grid grid-cols-1 md:grid-cols-4 gap-4 text-left border-t border-slate-200 dark:border-slate-800">
          <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Vector Store & RAG</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sliding window transcript chunking and vector embeddings for high-precision context retrieval.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Timestamp Citations</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every answer includes interactive timestamp links <span className="text-red-500 font-mono">[MM:SS]</span> that jump straight to that moment in the video.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Claude-Style Prompts</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automated suggested follow-up questions generated after every response for deep exploration.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Gemini 3.6 Flash</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Powered by Google's latest Gemini reasoning models with structured JSON schemas & conversational memory.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
