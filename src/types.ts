export interface TranscriptSegment {
  text: string;
  start: number; // in seconds
  duration: number; // in seconds
}

export interface TextChunk {
  id: string;
  videoId: string;
  text: string;
  start: number;
  end: number;
  embedding?: number[];
  tokenCount: number;
}

export interface VideoMetadata {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  viewCount?: string;
  publishedAt?: string;
  description?: string;
}

export interface VideoSummary {
  short: string; // Executive summary (2-3 sentences)
  medium: string; // Bulleted breakdown
  detailed: string; // Section-by-section analysis with timestamps
  keyInsights: string[];
  topics: string[];
  suggestedQuestions: string[];
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: {
    timestamp: number; // seconds
    formattedTime: string; // MM:SS
    textSnippet: string;
  }[];
  retrievedChunks?: {
    text: string;
    start: number;
    end: number;
    score: number;
  }[];
  suggestedFollowUps?: string[];
}

export interface ChatSession {
  id: string;
  videoId: string;
  userId: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface ProcessedVideo {
  id: string;
  youtubeId: string;
  url: string;
  metadata: VideoMetadata;
  transcript: TranscriptSegment[];
  summary: VideoSummary;
  chunkCount: number;
  totalTokens: number;
  createdAt: string;
  userId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'email' | 'demo';
  createdAt?: string;
}

export interface Conversation {
  id: string;
  title: string;
  videoId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  videoTitle?: string;
  thumbnailUrl?: string;
}

export interface GroupedConversations {
  today: Conversation[];
  yesterday: Conversation[];
  previous7Days: Conversation[];
  older: Conversation[];
}

export interface RAGQueryResult {
  answer: string;
  citations: {
    timestamp: number;
    formattedTime: string;
    textSnippet: string;
  }[];
  retrievedChunks: {
    text: string;
    start: number;
    end: number;
    score: number;
  }[];
  suggestedFollowUps: string[];
}

export interface AppAnalytics {
  totalVideos: number;
  totalTranscriptsLength: number; // in seconds
  totalChats: number;
  totalTokensProcessed: number;
  avgResponseTimeMs: number;
}
