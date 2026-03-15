# CodeLens — AI Code Review Platform

A full-stack MERN application that provides real-time AI-powered code reviews using Claude. Paste your code, choose a review mode, and get streaming senior-engineer-level feedback with severity-ranked issues and an overall health score.

## Features

- **Streaming reviews** — results stream token-by-token via SSE, no waiting for a spinner
- **4 review modes** — Full Review, Security, Performance, Style & Quality
- **Severity ranking** — issues sorted by Critical → High → Medium → Low
- **Code health score** — animated 0–100 score with color coding
- **Review history** — all past reviews saved and paginated
- **JWT auth** — register/login with bcrypt-hashed passwords
- **Rate limiting** — 10 reviews/hour per user, 10 auth attempts/15min
- **17 languages** — JS, TS, Python, Java, Go, Rust, SQL, and more

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Monaco Editor, CSS Modules |
| Backend | Node.js, Express 5 (ESM) |
| Database | MongoDB + Mongoose |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Auth | JWT + bcryptjs |
| Streaming | Server-Sent Events (SSE) via Fetch ReadableStream |
| Deploy | Vercel (client) + Render (server) + MongoDB Atlas |

## Project Structure

```
codelens/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── api/             # Axios instance
│       ├── components/      # Layout, ReviewPanel, IssueCard, ScoreRing
│       ├── hooks/           # useAuth, useReviewStream
│       └── pages/           # AuthPage, ReviewPage, HistoryPage
│
└── server/                  # Express backend
    ├── agents/
    ├── config/              # MongoDB connection
    ├── middleware/          # JWT auth, rate limiter
    ├── models/              # User, Review schemas
    ├── routes/              # auth, review, history
    └── services/            # claudeService (streaming + prompts)
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com)

### 1. Clone and install

```bash
git clone https://github.com/yourusername/codelens.git
cd codelens

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Configure environment

```bash
# server/.env
cp server/.env.example server/.env
```

Fill in your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/codelens
JWT_SECRET=some_long_random_string_here
ANTHROPIC_API_KEY=sk-ant-...
CLIENT_URL=http://localhost:5173
```

### 3. Run in development

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deployment

### Frontend → Vercel

```bash
cd client
npm run build
# Push to GitHub and import repo in vercel.com
# Set VITE_API_URL env var to your Render backend URL
```

### Backend → Render

1. Create a new Web Service on [render.com](https://render.com)
2. Connect your GitHub repo, set root to `/server`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables from `.env`

## API Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/review` | Yes | Start streaming review (SSE) |
| GET | `/api/history` | Yes | Paginated review history |
| GET | `/api/history/:id` | Yes | Single review detail |
| DELETE | `/api/history/:id` | Yes | Delete a review |

## How the Streaming Works

The review endpoint returns `Content-Type: text/event-stream`. The client uses the Fetch API's `ReadableStream` (not `EventSource`) so it can send a POST with a body. Events emitted:

```
event: status    → { message: "Analyzing your code..." }
event: chunk     → { text: "..." }   (streams token by token)
event: done      → { reviewId, parsed, durationMs }
event: error     → { message: "..." }
event: close     → {}
```

## Resume Bullets

> **CodeLens — AI Code Review Platform** | MERN · Anthropic Claude API · SSE
> - Built a full-stack code review platform serving real-time AI feedback via Server-Sent Events, streaming Claude's analysis token-by-token to the client using the Fetch ReadableStream API
> - Engineered a JWT refresh-token auth system with bcrypt hashing and per-user rate limiting to protect the AI endpoint (10 reviews/hour)
> - Designed a structured prompt engineering layer with 4 review modes (Security, Performance, Style, Full) that returns severity-ranked JSON issues with line numbers and fix suggestions
> - Deployed frontend on Vercel and backend on Render with MongoDB Atlas, serving paginated review history with delete operations

## License

MIT
