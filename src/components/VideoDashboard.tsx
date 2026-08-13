import React, { useState } from 'react';
import { ProcessedVideo, AppAnalytics } from '../types';
import { Play, MessageSquare, Trash2, Clock, Database, Search, Youtube, BarChart3, ChevronRight, FileText } from 'lucide-react';
import { formatTimestamp } from '../../server/rag.js';

interface VideoDashboardProps {
  videos: ProcessedVideo[];
  analytics: AppAnalytics | null;
  onSelectVideo: (video: ProcessedVideo) => void;
  onDeleteVideo: (id: string) => void;
  onNewVideo: () => void;
}

export const VideoDashboard: React.FC<VideoDashboardProps> = ({
  videos,
  analytics,
  onSelectVideo,
  onDeleteVideo,
  onNewVideo
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVideos = videos.filter(v => 
    v.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.metadata.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Youtube className="w-6 h-6 text-red-500" />
            <span>My Video Vector Library</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access your analyzed YouTube videos, vector stores, and AI chat sessions.
          </p>
        </div>

        <button
          onClick={onNewVideo}
          className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium text-sm rounded-xl shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <span>+ Analyze New Video</span>
        </button>
      </div>

      {/* Analytics Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Videos</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{analytics.totalVideos}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Duration</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{formatTimestamp(analytics.totalTranscriptsLength)}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Processed Tokens</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{analytics.totalTokensProcessed.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Q&A Messages</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{analytics.totalChats}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by video title, channel name, or topics..."
          className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Video Cards Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <Youtube className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No videos found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
            {searchQuery ? 'No videos match your search criteria.' : 'You haven’t processed any YouTube videos yet. Paste a YouTube link to build your vector database!'}
          </p>
          <button
            onClick={onNewVideo}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-lg transition-colors"
          >
            Process First Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col group"
            >
              {/* Thumbnail Header */}
              <div 
                onClick={() => onSelectVideo(video)}
                className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden"
              >
                <img
                  src={video.metadata.thumbnailUrl}
                  alt={video.metadata.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />
                
                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[11px] font-mono font-semibold">
                  {formatTimestamp(video.metadata.duration)}
                </div>

                {/* Overlay Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {video.metadata.channelTitle}
                    </span>
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                  </div>

                  <h3 
                    onClick={() => onSelectVideo(video)}
                    className="font-bold text-slate-900 dark:text-white line-clamp-2 cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors text-base"
                  >
                    {video.metadata.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                    {video.summary?.short || 'Vector indexed transcript ready for multi-turn Q&A.'}
                  </p>
                </div>

                {/* Footer Metadata Badges */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Database className="w-3.5 h-3.5" />
                      {video.chunkCount} Chunks
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {video.transcript?.length || 0} Captions
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectVideo(video)}
                      className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Open RAG Workspace"
                    >
                      <ChevronRight className="w-4 h-4 text-red-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this video from vector storage?')) {
                          onDeleteVideo(video.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      title="Delete Video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
