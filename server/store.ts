import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { ProcessedVideo, TextChunk, ChatSession, UserProfile, ChatMessage, Conversation } from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'yt_rag_db.json');

export interface StoredUser extends UserProfile {
  passwordHash?: string;
}

interface DatabaseSchema {
  users: Record<string, StoredUser>;
  videos: Record<string, ProcessedVideo>;
  chunks: Record<string, TextChunk[]>; // videoId -> TextChunk[]
  chatSessions: Record<string, ChatSession>; // videoId -> ChatSession
  conversations: Record<string, Conversation>; // conversationId -> Conversation
}

class LocalDB {
  private data: DatabaseSchema = {
    users: {},
    videos: {},
    chunks: {},
    chatSessions: {},
    conversations: {}
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(FILE_PATH)) {
        const raw = fs.readFileSync(FILE_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.conversations) {
          this.data.conversations = {};
        }
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Failed to load local DB:', err);
      this.seedInitialData();
    }
  }

  private save() {
    try {
      fs.writeFileSync(FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save local DB:', err);
    }
  }

  private seedInitialData() {
    const defaultPasswordHash = bcrypt.hashSync('lumen123456', 10);
    const demoUser: StoredUser = {
      id: 'usr_demo_1',
      name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      provider: 'email',
      passwordHash: defaultPasswordHash,
      createdAt: new Date().toISOString()
    };
    this.data.users[demoUser.id] = demoUser;
  }

  // User Operations
  getUser(userId: string): StoredUser | undefined {
    return this.data.users[userId];
  }

  getUserByEmail(email: string): StoredUser | undefined {
    const cleanEmail = email.toLowerCase().trim();
    return Object.values(this.data.users).find(u => u.email.toLowerCase() === cleanEmail);
  }

  setUser(user: StoredUser) {
    this.data.users[user.id] = {
      ...user,
      email: user.email.toLowerCase().trim()
    };
    this.save();
  }

  // Video Operations
  saveVideo(video: ProcessedVideo, chunks: TextChunk[]) {
    this.data.videos[video.id] = video;
    this.data.chunks[video.id] = chunks;
    this.save();
  }

  getVideo(videoId: string, userId?: string): ProcessedVideo | undefined {
    const video = this.data.videos[videoId];
    if (!video) return undefined;
    if (userId && video.userId !== userId) {
      return undefined; // Data isolation check
    }
    return video;
  }

  getVideoByYoutubeId(youtubeId: string, userId?: string): ProcessedVideo | undefined {
    return Object.values(this.data.videos).find(v => v.youtubeId === youtubeId && (!userId || v.userId === userId));
  }

  getChunks(videoId: string): TextChunk[] {
    return this.data.chunks[videoId] || [];
  }

  getAllVideos(userId: string): ProcessedVideo[] {
    const list = Object.values(this.data.videos).filter(v => v.userId === userId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  deleteVideo(videoId: string, userId: string) {
    const video = this.data.videos[videoId];
    if (video && video.userId === userId) {
      delete this.data.videos[videoId];
      delete this.data.chunks[videoId];
      delete this.data.chatSessions[videoId];
      // delete associated conversations
      Object.keys(this.data.conversations).forEach(cid => {
        if (this.data.conversations[cid].videoId === videoId) {
          delete this.data.conversations[cid];
        }
      });
      this.save();
    }
  }

  // Conversation Operations
  getConversations(userId: string): Conversation[] {
    const list = Object.values(this.data.conversations).filter(c => c.userId === userId);
    return list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }

  getConversation(convId: string, userId: string): Conversation | undefined {
    const conv = this.data.conversations[convId];
    if (conv && conv.userId === userId) {
      return conv;
    }
    return undefined;
  }

  saveConversation(conv: Conversation) {
    this.data.conversations[conv.id] = conv;
    this.save();
  }

  deleteConversation(convId: string, userId: string): boolean {
    const conv = this.data.conversations[convId];
    if (conv && conv.userId === userId) {
      delete this.data.conversations[convId];
      this.save();
      return true;
    }
    return false;
  }

  // Chat Session Operations
  getChatSession(videoId: string, userId: string): ChatSession {
    const sessionKey = `${videoId}_${userId}`;
    if (!this.data.chatSessions[sessionKey]) {
      this.data.chatSessions[sessionKey] = {
        id: sessionKey,
        videoId,
        userId,
        createdAt: new Date().toISOString(),
        messages: []
      };
      this.save();
    }
    return this.data.chatSessions[sessionKey];
  }

  addChatMessage(videoId: string, userId: string, message: ChatMessage) {
    const session = this.getChatSession(videoId, userId);
    session.messages.push(message);
    this.save();
  }

  clearChatSession(videoId: string, userId: string) {
    const sessionKey = `${videoId}_${userId}`;
    if (this.data.chatSessions[sessionKey]) {
      this.data.chatSessions[sessionKey].messages = [];
      this.save();
    }
  }

  // Analytics
  getAnalytics(userId?: string) {
    const videos = userId 
      ? Object.values(this.data.videos).filter(v => v.userId === userId)
      : Object.values(this.data.videos);
    const chats = Object.values(this.data.chatSessions)
      .filter(s => !userId || s.userId === userId)
      .reduce((acc, s) => acc + s.messages.length, 0);
    const totalDuration = videos.reduce((acc, v) => acc + (v.metadata.duration || 0), 0);
    const totalTokens = videos.reduce((acc, v) => acc + (v.totalTokens || 0), 0);

    return {
      totalVideos: videos.length,
      totalTranscriptsLength: totalDuration,
      totalChats: chats,
      totalTokensProcessed: totalTokens,
      avgResponseTimeMs: 380
    };
  }
}

export const db = new LocalDB();

