What it does
CodeLens gives you real-time AI-powered code reviews. Paste any code snippet, choose a review mode, and watch the analysis stream in token-by-token — just like ChatGPT, but focused entirely on making your code better.

Detects security vulnerabilities, performance bottlenecks, and style issues
Returns severity-ranked issues (Critical → High → Medium → Low) with line numbers and fix suggestions
Scores your code 0–100 with an animated health ring
Saves your full review history with pagination


Demo



Tech Stack
LayerTechnologyFrontendReact 18, Vite, Monaco Editor (VS Code's editor), CSS ModulesBackendNode.js, Express.js (ESM), MongooseDatabaseMongoDB (local dev) / MongoDB Atlas (production)AIGroq API — LLaMA 3.3 70B via streamingAuthJWT + bcryptjs (12 salt rounds)StreamingServer-Sent Events (SSE) via Fetch ReadableStreamDeploymentVercel (frontend) + Railway (backend)

Architecture
React (Vercel)
    │
    │  POST /api/review  (JWT in header)
    ▼
Express Server (Railway)
    │
    ├── authMiddleware  →  verify JWT  →  attach req.user
    ├── rateLimiter     →  10 reviews/hour per user
    │
    ▼
claudeService.js
    │  calls Groq streaming API
    │  fires onChunk() callback per token
    │
    ▼
SSE stream  →  res.write("event: chunk\ndata: {...}\n\n")
    │
    ▼
useReviewStream.js (client)
    │  ReadableStream reader loop
    │  buffer reassembly for TCP packet splits
    │
    ▼
React state  →  UI re-renders with each token

Features
4 Review Modes

Full Review — security + performance + style + edge cases
Security — OWASP vulnerabilities, injections, exposed secrets
Performance — Big-O complexity, memory leaks, blocking calls
Style & Quality — naming, DRY violations, documentation

Real-time Streaming
Results stream token-by-token using SSE — no waiting for a spinner. The moment the AI generates a word, it's on your screen.
JWT Authentication

bcrypt password hashing (cost factor 12 — 4096 iterations)
7-day JWT tokens with automatic session restore on page refresh
Per-user rate limiting — 10 reviews/hour, 10 auth attempts/15 min

Review History
Full paginated history of every review — language, mode, score, issues, timestamp. Compound MongoDB index on (userId, createdAt) for O(log n) queries.
Animated Score Ring
Canvas-based circular score indicator (0–100) that animates in on completion. Color-coded: red below 40, amber 40–79, green 80+.

Key Engineering Decisions
Why SSE over WebSockets?
The client sends code once — the server streams results back. SSE is the perfect fit: one-way server push, HTTP-native, auto-reconnect built in. WebSockets would add connection management complexity for zero benefit.
Why the fetch ReadableStream instead of EventSource?
The browser's native EventSource only supports GET requests. Since we need to POST the code in the request body, we use fetch() with a ReadableStream reader loop and a manual SSE line parser with a TCP packet reassembly buffer.
Why a compound index on (userId, createdAt)?
Without it, fetching a user's history scans the entire reviews collection — O(n). The compound index lets MongoDB jump directly to that user's cluster, already sorted by date — O(log n). The sort is free because it's built into the index.
Why callbacks for streaming?
claudeService.js has zero knowledge of Express or HTTP. It accepts an onChunk callback — whenever a token arrives from Groq, it calls onChunk(text). The route handler defines what to do with each token (forward via SSE + accumulate for parsing). This is Inversion of Control — keeps the AI service reusable across any transport layer.

Running Locally
Prerequisites

Node.js 18+
MongoDB installed locally (net start MongoDB on Windows)
Groq API key — free at console.groq.com

Setup
bash# Clone the repo
git clone https://github.com/yourusername/codelens.git
cd codelens

# Install server dependencies
cd server
npm install

# Create and fill .env
cp .env.example .env
Fill in server/.env:
envPORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/codelens
JWT_SECRET=your_long_random_secret_here
GROQ_API_KEY=gsk_your_key_here
CLIENT_URL=http://localhost:5173
bash# Start server
npm run dev

# In a new terminal — install and start client
cd ../client
npm install
npm run dev
Open http://localhost:5173

API Reference
MethodRouteAuthDescriptionPOST/api/auth/registerNoRegister new userPOST/api/auth/loginNoLogin, returns JWTGET/api/auth/meYesGet current userPOST/api/reviewYesStart streaming review (SSE)GET/api/historyYesPaginated review historyGET/api/history/:idYesSingle review detailDELETE/api/history/:idYesDelete a review
SSE Event Types
event: status   →  { message: "Analyzing your code..." }
event: chunk    →  { text: "..." }   streams token by token
event: done     →  { reviewId, parsed, durationMs }
event: error    →  { message: "..." }

Project Structure
codelens/
├── client/                        # React + Vite
│   ├── src/
│   │   ├── api/axios.js           # Axios instance with JWT interceptor
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Navbar + routing shell
│   │   │   ├── ReviewPanel.jsx    # Streaming output + issue cards
│   │   │   ├── IssueCard.jsx      # Collapsible issue with severity badge
│   │   │   └── ScoreRing.jsx      # Canvas animated score ring
│   │   ├── hooks/
│   │   │   ├── useAuth.jsx        # Auth context + session restore
│   │   │   └── useReviewStream.js # SSE ReadableStream reader
│   │   └── pages/
│   │       ├── ReviewPage.jsx     # Monaco editor + split layout
│   │       ├── HistoryPage.jsx    # Paginated review history
│   │       └── AuthPage.jsx       # Login + register
│   └── vercel.json                # SPA routing fix
│
└── server/                        # Node.js + Express
    ├── config/db.js               # MongoDB connection
    ├── middleware/
    │   ├── auth.js                # JWT verify + generateToken
    │   └── rateLimiter.js        # Per-user rate limiting
    ├── models/
    │   ├── User.js                # bcrypt pre-save hook
    │   └── Review.js             # Compound index (userId, createdAt)
    ├── routes/
    │   ├── auth.js               # Register + login + me
    │   ├── review.js             # SSE streaming endpoint
    │   └── history.js            # CRUD for review history
    └── services/
        └── claudeService.js      # Groq streaming + prompt engineering

What I Learned Building This

Server-Sent Events — why SSE beats polling (zero wasted requests) and when to use WebSockets instead (bidirectional communication)
Node.js event loop — how await suspends a coroutine without blocking the thread, letting one Node process handle thousands of concurrent streaming connections
TCP packet reassembly — why a buffer variable is needed when reading SSE streams: network packets arrive at arbitrary byte boundaries, potentially splitting a JSON payload mid-string
ES module hoisting — why import statements execute before any code in the file, and how to use dotenv.config({ path: ... }) with an explicit path to guarantee environment variables load before any module reads them
MongoDB indexing — how a B-tree compound index on (userId, createdAt) changes history queries from O(n) full collection scans to O(log n) lookups with a free index-covered sort
JWT security — why only the user ID goes in the token payload (base64, not encrypted), and why re-fetching the user from DB on each request enables instant account revocation


Deployment
ServicePurposeURLVercelReact frontendcodelens-ten-xi.vercel.appRailwayExpress backendcodelens-production-c762.up.railway.appMongoDB AtlasProduction databaseAWS Mumbai (ap-south-1)

License
MIT
