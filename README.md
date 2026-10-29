# LumenAI

**Chat with any YouTube video.** Paste a link, ask questions, and get answers grounded in the video's transcript, with timestamp references.

LumenAI is a full-stack Retrieval-Augmented Generation (RAG) app built with Next.js, FastAPI, LangGraph, Qdrant and Claude.

---

## Features

- **YouTube ingestion**: paste a URL and the transcript is fetched automatically
- **RAG pipeline**: transcript chunking, embeddings, vector search, grounded generation
- **Timestamp citations**: answers show where in the video the information came from
- **Multi-turn chat**: follow-up questions use recent conversation history
- **Video summaries**: on-demand summary generated from the most relevant chunks
- **Multiple videos**: switch between processed videos from the sidebar
- **Modern UI**: dark theme, animated landing page, typing indicator, suggested questions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand, shadcn/ui |
| Backend | Python, FastAPI |
| AI orchestration | LangGraph, LangChain |
| LLM | Claude (Anthropic API) |
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`, runs locally, no API key) |
| Vector DB | Qdrant |
| Infra | Docker, Docker Compose |
| Deployment | Vercel (frontend), Railway (backend), Qdrant Cloud |

## How It Works

```
YouTube URL
   |
   v
Extract transcript  ->  Chunk (~800 chars, with timestamps)
   |
   v
Embed chunks  ->  Store in Qdrant (payload: video_id, text, start/end time)

Question
   |
   v
LangGraph:  [retrieve]  ->  [generate]
   |             |              |
   |     embed question,   prompt = context +
   |     top-5 search      history + question
   |     filtered by       -> Claude -> answer
   |     video_id             with timestamps
   v
Answer + source timestamps
```

## Project Structure

```
LumenAI/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # videos, chat, summaries
│   │   ├── core/            # config (pydantic-settings)
│   │   ├── services/        # transcript, chunking, embeddings, vector store
│   │   ├── graph/           # LangGraph chat flow
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/             # landing page + /chat
│       ├── lib/             # API client
│       └── store/           # Zustand store
└── docker-compose.yml       # Postgres + Qdrant for local dev
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker Desktop
- An [Anthropic API key](https://console.anthropic.com)

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/lumenai.git
cd lumenai
```

### 2. Start Qdrant and Postgres

```bash
docker-compose up -d
```

### 3. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
database_url=postgresql+psycopg://user:pass@localhost:5433/lumenai
qdrant_url=http://localhost:6333
qdrant_api_key=
anthropic_api_key=YOUR_ANTHROPIC_KEY
app_name=LumenAI
```

Run:

```bash
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

### 4. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Run:

```bash
npm run dev
```

Open http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/videos/process` | Fetch, chunk, embed and store a video transcript |
| `POST` | `/api/chat/` | Ask a question about a processed video |
| `GET` | `/api/summaries/{video_id}?type=short\|medium\|detailed` | Generate a summary |
| `GET` | `/health` | Health check |

## Deployment

- **Backend**: Railway (uses `backend/Dockerfile`), set root directory to `backend`
- **Vector DB**: Qdrant Cloud, set `qdrant_url` and `qdrant_api_key`
- **Frontend**: Vercel, set root directory to `frontend` and `NEXT_PUBLIC_API_URL` to the Railway URL
- Add your Vercel domain to the CORS `allow_origins` list in `backend/app/main.py`

## Limitations

- Only works for videos that have captions or auto-generated transcripts
- Video processing is synchronous (can take a while for long videos)
- Chat history is kept in browser memory and is lost on refresh

## Roadmap

- [ ] Authentication (Clerk) and per-user history
- [ ] Persist videos and conversations in PostgreSQL
- [ ] Streaming responses
- [ ] AI-generated follow-up question suggestions
- [ ] Background processing queue for long videos
- [ ] Reranking and overlapping chunks for better retrieval
- [ ] Skip re-processing for videos already indexed

## License

MIT
