import React, { useState } from 'react';
import { X, BookOpen, Layers, Server, Database, Shield, Cpu, Terminal, CheckCircle2, ChevronRight } from 'lucide-react';

interface ArchitectureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureGuideModal: React.FC<ArchitectureGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedPhase, setSelectedPhase] = useState<number>(1);

  if (!isOpen) return null;

  const PHASES = [
    {
      phase: 1,
      title: "Phase 1: Requirements & System Architecture",
      icon: Layers,
      summary: "System design, requirements breakdown, and data flow architecture.",
      content: `
### What We Built:
A complete full-stack RAG (Retrieval-Augmented Generation) application that turns YouTube videos into vector-searchable knowledge bases with exact timestamp citations.

### Architecture Flow:
1. **User Request**: User submits YouTube link -> Server extracts video ID.
2. **Metadata & Caption Fetcher**: Retrieves video title, duration, author, thumbnail, and raw transcript timing array.
3. **Sliding Window Chunking**: Splits transcript text into ~150-word chunks with 2-segment overlaps while preserving start and end timestamps.
4. **Vector Embedding**: Calls Gemini \`gemini-embedding-2-preview\` to generate 768-dimensional dense vectors.
5. **Vector Store Ingestion**: Stores chunks and embeddings in persistent vector database.
6. **Query & Retrieval**: User asks a question -> Query is vectorized -> Cosine similarity search retrieves top-k matching chunks -> Grounded RAG prompt sent to Gemini 3.6 Flash -> Response with [MM:SS] timestamp citations and suggested follow-ups returned to user.
      `
    },
    {
      phase: 2,
      title: "Phase 2: Modern Tech Stack (2026 Standards)",
      icon: Cpu,
      summary: "Technology selection, trade-offs, and design rationale.",
      content: `
### Selected Tech Stack:
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons.
- **Backend**: Express.js on Node.js (Full-stack API proxy for key security).
- **AI Models**: Google GenAI SDK (\`@google/genai\`) using \`gemini-3.6-flash\` for Q&A and reasoning, and \`gemini-embedding-2-preview\` for vector generation.
- **Vector Engine**: In-memory + JSON file-persisted Cosine Similarity vector store with support for Pinecone, Qdrant, or PostgreSQL pgvector migration.
- **Transcript Engine**: \`youtube-transcript\` with Gemini 3.6 Flash fallback synthesis.

### Architectural Trade-offs:
- **Server-side Gemini proxy vs Client SDK**: All Gemini API calls are strictly executed on the Express server to keep \`GEMINI_API_KEY\` secure and avoid client key exposure.
- **Sliding Window vs Paragraph Chunking**: Video transcripts lack natural paragraphs, so time-bound sliding word windows ensure context continuity.
      `
    },
    {
      phase: 3,
      title: "Phase 3: Authentication & Security",
      icon: Shield,
      summary: "User sessions, API key protection, and privacy controls.",
      content: `
### Key Security Measures:
1. **API Key Security**: Server-only handling of \`process.env.GEMINI_API_KEY\` via Express backend proxy endpoints.
2. **Input Sanitization**: Strict YouTube URL regex parsing and sanitization to prevent SSRF and injection attacks.
3. **JWT / OAuth Integration**: Support for Google OAuth and email/password sessions with isolated user video collections.
4. **Rate Limiting**: Express middleware rate limiting on \`/api/youtube/process\` and \`/api/chat/query\` to prevent quota abuse.
      `
    },
    {
      phase: 4,
      title: "Phase 4-6: YouTube Ingestion & Vector RAG Pipeline",
      icon: Database,
      summary: "Extracting captions, generating embeddings, and vector similarity search.",
      content: `
### Step-by-Step RAG Execution:
1. **Caption Parsing**: Extracted raw captions with timestamps (\`start\` in seconds, \`duration\`).
2. **Chunking Logic**:
\`\`\`ts
export function chunkTranscript(videoId, segments) {
  // Sliding window with 150 target words and overlap
  // Preserves exact start and end timestamps for citations
}
\`\`\`
3. **Cosine Similarity Vector Search**:
\`\`\`ts
export function cosineSimilarity(vecA, vecB) {
  // Calculates dot product normalized by vector magnitudes
}
\`\`\`
4. **Timestamp Citation Matching**: The retrieved chunks pass exact \`start\` timestamps to Gemini system instructions so every answer includes interactive \`[MM:SS]\` links that seek the video player automatically.
      `
    },
    {
      phase: 5,
      title: "Phase 7-10: Conversational Memory & Claude Prompts",
      icon: Terminal,
      summary: "Multi-turn context memory and automated suggested follow-up questions.",
      content: `
### Key Chat Features:
1. **Conversational Memory**: Chat history is persisted per video session and supplied to Gemini so follow-up queries understand prior pronouns and context.
2. **Claude-Style Follow-up Suggestions**: After every assistant response, Gemini produces 3 smart follow-up question pills based on the answer and video context.
3. **Interactive Player Syncing**: Clicking any \`[MM:SS]\` badge sends a \`postMessage\` command to the embedded YouTube iframe API to seek and play at that exact second.
      `
    },
    {
      phase: 6,
      title: "Phase 11-15: Production Deployment & Dockerization",
      icon: Server,
      summary: "Containerization, Cloud Run, Vercel, and enterprise scalability.",
      content: `
### Production Build Pipeline:
- **Build Command**: \`npm run build\` executes \`vite build && esbuild server.ts --bundle --platform=node --format=cjs --outfile=dist/server.cjs\`
- **Start Command**: \`node dist/server.cjs\`

### Dockerfile Deployment:
\`\`\`dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
\`\`\`

### Monitoring & Logging:
- **Sentry**: Runtime error capture.
- **LangSmith / PostHog**: RAG query latency, token usage, and user analytics tracking.
      `
    }
  ];

  const currentPhaseData = PHASES.find(p => p.phase === selectedPhase) || PHASES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full h-[85vh] overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Senior AI Engineer Mentor Guide & Architecture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete engineering breakdown from Phase 1 to Phase 15 production deployment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Sidebar + Main Content) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Phase Selector Navigation (4 cols) */}
          <div className="md:col-span-4 p-4 overflow-y-auto space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1">
              Development Lifecycle Phases:
            </p>
            {PHASES.map((p) => {
              const Icon = p.icon;
              const isSelected = p.phase === selectedPhase;
              return (
                <button
                  key={p.phase}
                  onClick={() => setSelectedPhase(p.phase)}
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 border ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 border-emerald-500/50 shadow-sm'
                      : 'border-transparent hover:bg-white/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {p.title}
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {p.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Phase Detail Viewer (8 cols) */}
          <div className="md:col-span-8 p-6 overflow-y-auto space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>PRODUCTION ARCHITECTURE SPECIFICATION</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {currentPhaseData.title}
            </h3>

            <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
              {currentPhaseData.content}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span>YouTube RAG AI Engineering Blueprint</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl"
          >
            Got it, Return to App
          </button>
        </div>

      </div>
    </div>
  );
};
