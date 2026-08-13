import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, StoredUser } from './server/store.js';
import { extractYoutubeId, fetchVideoMetadata, fetchTranscript } from './server/youtube.js';
import { chunkTranscript, generateEmbeddings, generateVideoSummary, queryRAGPipeline } from './server/rag.js';
import { ProcessedVideo, Conversation, ChatMessage } from './src/types.js';
import { authMiddleware, AuthenticatedRequest, generateToken, comparePassword, hashPassword } from './server/auth.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // -----------------------------
  // PUBLIC ROUTES
  // -----------------------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'LumenAI Engine', timestamp: new Date().toISOString() });
  });

  // Auth: Email + Password Registration
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const existing = db.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }

      const newUser: StoredUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        provider: 'email',
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
      };

      db.setUser(newUser);

      const userProfile = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        provider: newUser.provider,
        createdAt: newUser.createdAt
      };

      const token = generateToken(userProfile);
      return res.json({ token, user: userProfile });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Failed to complete registration.' });
    }
  });

  // Auth: Email + Password Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (user.passwordHash && !comparePassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const userProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        createdAt: user.createdAt
      };

      const token = generateToken(userProfile);
      return res.json({ token, user: userProfile });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Authentication failed.' });
    }
  });

  // Auth: Google OAuth / Gmail Login
  app.post('/api/auth/google', (req, res) => {
    try {
      const { email, name, avatar } = req.body;
      const userEmail = (email || 'google.user@lumenai.app').toLowerCase().trim();
      const userName = name || userEmail.split('@')[0];
      const userAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

      let user = db.getUserByEmail(userEmail);
      if (!user) {
        user = {
          id: `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: userName,
          email: userEmail,
          avatar: userAvatar,
          provider: 'google',
          createdAt: new Date().toISOString()
        };
        db.setUser(user);
      }

      const userProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: 'google' as const,
        createdAt: user.createdAt
      };

      const token = generateToken(userProfile);
      return res.json({ token, user: userProfile });
    } catch (err: any) {
      console.error('Google login error:', err);
      return res.status(500).json({ error: 'Google authentication failed.' });
    }
  });

  // Auth: Forgot Password Request
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    const user = db.getUserByEmail(email);
    if (!user) {
      return res.json({ message: 'If an account exists with this email, password reset instructions have been sent.' });
    }
    return res.json({
      message: 'Password reset link sent! Check your inbox for reset instructions.',
      simulatedResetToken: `reset_${Date.now()}`
    });
  });

  // -----------------------------
  // PROTECTED ROUTES (JWT REQUIRED)
  // -----------------------------

  // Get Current Authenticated User Session
  app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Change Password Endpoint
  app.post('/api/auth/change-password', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }

      const user = db.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (user.passwordHash && !comparePassword(currentPassword, user.passwordHash)) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }

      user.passwordHash = hashPassword(newPassword);
      db.setUser(user);

      return res.json({ message: 'Password successfully updated.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update password.' });
    }
  });

  // CONVERSATIONS MANAGEMENT
  app.get('/api/conversations', authMiddleware, (req: AuthenticatedRequest, res) => {
    const conversations = db.getConversations(req.user!.id);
    res.json({ conversations });
  });

  app.post('/api/conversations', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { title, videoId } = req.body;
      let videoTitle = undefined;
      let thumbnailUrl = undefined;

      if (videoId) {
        const video = db.getVideo(videoId, req.user!.id);
        if (video) {
          videoTitle = video.metadata.title;
          thumbnailUrl = video.metadata.thumbnailUrl;
        }
      }

      const newConv: Conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: title || 'New Chat',
        videoId: videoId || undefined,
        userId: req.user!.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        videoTitle,
        thumbnailUrl
      };

      db.saveConversation(newConv);
      res.json({ conversation: newConv });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create new conversation.' });
    }
  });

  app.get('/api/conversations/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
    const conv = db.getConversation(req.params.id, req.user!.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found or access denied.' });
    }
    res.json({ conversation: conv });
  });

  app.patch('/api/conversations/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
    const conv = db.getConversation(req.params.id, req.user!.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found or access denied.' });
    }

    const { title } = req.body;
    if (title && title.trim()) {
      conv.title = title.trim();
      conv.updatedAt = new Date().toISOString();
      db.saveConversation(conv);
    }
    res.json({ conversation: conv });
  });

  app.delete('/api/conversations/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
    const deleted = db.deleteConversation(req.params.id, req.user!.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Conversation not found or access denied.' });
    }
    res.json({ success: true, message: 'Conversation deleted.' });
  });

  // PROCESS YOUTUBE VIDEO & INGEST INTO VECTOR RAG PIPELINE
  app.post('/api/youtube/process', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'Please enter a valid YouTube URL.' });
      }

      const youtubeId = extractYoutubeId(url);
      if (!youtubeId) {
        return res.status(400).json({ error: 'Invalid YouTube URL or Video ID. Please enter a valid YouTube link.' });
      }

      // Check if video already exists in user's isolated library
      const existing = db.getVideoByYoutubeId(youtubeId, req.user!.id);
      if (existing) {
        return res.json({
          message: 'Video loaded from vector library cache.',
          video: existing,
          fromCache: true
        });
      }

      // Step A: Fetch Video Metadata
      const metadata = await fetchVideoMetadata(youtubeId);

      // Step B: Fetch Transcript Segments
      let transcript = [];
      try {
        transcript = await fetchTranscript(youtubeId, metadata.title);
      } catch (err: any) {
        return res.status(400).json({ error: "We couldn't find a transcript for this video. Please try another YouTube video with captions enabled." });
      }

      if (!transcript || transcript.length === 0) {
        return res.status(400).json({ error: "We couldn't find a transcript for this video." });
      }

      // Calculate total duration if omitted
      if (transcript.length > 0) {
        const lastSeg = transcript[transcript.length - 1];
        metadata.duration = lastSeg.start + (lastSeg.duration || 5);
      }

      // Step C: Chunk Transcript (Sliding Window Strategy)
      const rawChunks = chunkTranscript(metadata.id, transcript);

      // Step D: Generate Vector Embeddings
      const embeddedChunks = await generateEmbeddings(rawChunks);

      // Step E: Synthesize Summary & Key Insights with Gemini
      const summary = await generateVideoSummary(metadata.title, transcript);

      const totalTokens = embeddedChunks.reduce((acc, c) => acc + c.tokenCount, 0);

      const videoRecord: ProcessedVideo = {
        id: metadata.id,
        youtubeId,
        url: `https://www.youtube.com/watch?v=${youtubeId}`,
        metadata,
        transcript,
        summary,
        chunkCount: embeddedChunks.length,
        totalTokens,
        createdAt: new Date().toISOString(),
        userId: req.user!.id
      };

      // Store in Local Vector DB with user ownership
      db.saveVideo(videoRecord, embeddedChunks);

      // Automatically create a new conversation for this processed video
      const newConv: Conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: metadata.title.length > 40 ? `${metadata.title.substring(0, 37)}...` : metadata.title,
        videoId: videoRecord.id,
        userId: req.user!.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        videoTitle: metadata.title,
        thumbnailUrl: metadata.thumbnailUrl
      };
      db.saveConversation(newConv);

      return res.json({
        message: 'YouTube video successfully processed & vectorized.',
        video: videoRecord,
        conversation: newConv,
        fromCache: false
      });
    } catch (err: any) {
      console.error('Error processing YouTube video:', err);
      return res.status(500).json({ error: err.message || 'LumenAI was unable to process this video. Please verify the link and try again.' });
    }
  });

  // GET ALL PROCESS VIDEOS FOR AUTHENTICATED USER
  app.get('/api/videos', authMiddleware, (req: AuthenticatedRequest, res) => {
    const videos = db.getAllVideos(req.user!.id);
    res.json({ videos });
  });

  // GET SPECIFIC VIDEO
  app.get('/api/videos/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
    const video = db.getVideo(req.params.id, req.user!.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found or access denied.' });
    }
    const chunks = db.getChunks(video.id);
    res.json({ video, chunkCount: chunks.length });
  });

  // DELETE VIDEO
  app.delete('/api/videos/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
    db.deleteVideo(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Video removed from your library.' });
  });

  // CHAT Q&A WITH VECTOR RAG RETRIEVAL & CONVERSATION PERSISTENCE
  app.post('/api/chat/query', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { videoId, conversationId, message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message content is required.' });
      }

      let conversation: Conversation | undefined;
      if (conversationId) {
        conversation = db.getConversation(conversationId, req.user!.id);
      }

      let video: ProcessedVideo | undefined;
      if (videoId) {
        video = db.getVideo(videoId, req.user!.id);
      } else if (conversation?.videoId) {
        video = db.getVideo(conversation.videoId, req.user!.id);
      }

      if (!video) {
        return res.status(404).json({ error: 'Please select or process a video before sending a query.' });
      }

      // Get or create conversation
      if (!conversation) {
        conversation = {
          id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: message.length > 30 ? `${message.substring(0, 27)}...` : message,
          videoId: video.id,
          userId: req.user!.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
          videoTitle: video.metadata.title,
          thumbnailUrl: video.metadata.thumbnailUrl
        };
      }

      const chunks = db.getChunks(video.id);

      // Add user message
      const userMsg: ChatMessage = {
        id: `msg_u_${Date.now()}`,
        sessionId: conversation.id,
        sender: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString()
      };
      conversation.messages.push(userMsg);

      // Format chat history for Gemini context window
      const historyFormatted = conversation.messages.map(m => ({
        sender: m.sender,
        content: m.content
      }));

      // RAG Search & Gemini Generation
      const ragResult = await queryRAGPipeline(message, video.metadata.title, chunks, historyFormatted);

      // Add assistant message
      const assistantMsg: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        sessionId: conversation.id,
        sender: 'assistant',
        content: ragResult.answer,
        timestamp: new Date().toISOString(),
        citations: ragResult.citations,
        retrievedChunks: ragResult.retrievedChunks,
        suggestedFollowUps: ragResult.suggestedFollowUps
      };
      conversation.messages.push(assistantMsg);
      conversation.updatedAt = new Date().toISOString();

      db.saveConversation(conversation);

      return res.json({
        conversation,
        message: assistantMsg,
        result: ragResult
      });
    } catch (err: any) {
      console.error('LumenAI Chat API Error:', err);
      return res.status(500).json({ error: 'LumenAI is temporarily unavailable. Please try again.' });
    }
  });

  // GET CHAT HISTORY FOR VIDEO / CONVERSATION
  app.get('/api/chat/history/:videoId', authMiddleware, (req: AuthenticatedRequest, res) => {
    const session = db.getChatSession(req.params.videoId, req.user!.id);
    res.json({ session });
  });

  // ANALYTICS
  app.get('/api/analytics', authMiddleware, (req: AuthenticatedRequest, res) => {
    const analytics = db.getAnalytics(req.user!.id);
    res.json(analytics);
  });

  // -----------------------------
  // VITE DEV SERVER & PRODUCTION STATIC SERVING
  // -----------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LumenAI Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
