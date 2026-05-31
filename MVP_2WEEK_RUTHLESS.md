# AI Contest Tracker - 2-Week MVP (Solo Student Edition)

**Goal**: Ship a working prototype in 14-21 days. Ruthless scope cuts. Good engineering where it matters.

---

## 1. SIMPLIFIED TECH STACK

### Why This Stack?
- **Next.js**: One language (TypeScript), one framework, one deploy target → less context switching
- **Prisma + PostgreSQL**: Simple migrations, no SQL, type-safe queries
- **NextAuth.js**: GitHub OAuth in 30 minutes, zero auth bugs to build
- **Recharts**: Pre-built graphs, copy-paste examples
- **TailwindCSS**: Zero CSS writing, just class names

**Stack**:
```
Frontend: Next.js 14 + React + TypeScript + Tailwind
Backend: Next.js API routes
Database: PostgreSQL + Prisma ORM
Auth: NextAuth.js + GitHub OAuth
AI: Claude API via sdk
Hosting: Vercel (free) + Railway (free tier)
```

---

## 2. SIMPLIFIED FOLDER STRUCTURE

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── callback/
│   │   └── page.tsx
│   └── api/
│       ├── auth/[...nextauth]/
│       │   └── route.ts
│       └── auth-me/
│           └── route.ts
│
├── (app)/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── settings/
│   │   ├── page.tsx
│   │   ├── codeforces/
│   │   │   └── page.tsx
│   │   └── leetcode/
│   │       └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
│
├── api/
│   ├── codeforces/
│   │   ├── connect/
│   │   │   └── route.ts
│   │   └── profile/
│   │       └── route.ts
│   │
│   ├── leetcode/
│   │   ├── connect/
│   │   │   └── route.ts
│   │   └── profile/
│   │       └── route.ts
│   │
│   └── insights/
│       └── route.ts
│
├── lib/
│   ├── auth.ts
│   ├── db.ts (Prisma client)
│   ├── codeforces.ts (API calls)
│   ├── leetcode.ts (API calls)
│   ├── claude.ts (AI insights)
│   └── types.ts
│
├── components/
│   ├── Header.tsx
│   ├── RatingChart.tsx
│   ├── ProfileCard.tsx
│   ├── InsightPanel.tsx
│   └── LoadingSpinner.tsx
│
└── env.example
```

**Total files**: ~30 files. Small enough to hold in head.

---

## 3. SIMPLIFIED DATABASE SCHEMA

```sql
-- Only 5 tables

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  github_id INT NOT NULL UNIQUE,
  github_login VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE codeforces_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  handle VARCHAR(255) NOT NULL UNIQUE,
  
  rating INT,
  max_rating INT,
  rank VARCHAR(50),
  
  synced_at TIMESTAMP,
  UNIQUE(user_id)
);

CREATE TABLE leetcode_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL UNIQUE,
  
  solved INT,
  total INT,
  acceptance_rate DECIMAL(5, 2),
  
  synced_at TIMESTAMP,
  UNIQUE(user_id)
);

CREATE TABLE rating_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'codeforces', 'leetcode'
  
  rating INT,
  recorded_at TIMESTAMP,
  
  INDEX(user_id, platform, recorded_at)
);

CREATE TABLE ai_insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  metadata JSONB, -- {weakness: 'dp', confidence: 0.8}
  
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX(user_id, created_at DESC)
);

-- That's it. 5 tables.
-- No contest tables, no sync logs, no notification tables.
```

**Why this schema?**
- No normalization beyond sanity (users still searchable by email)
- No unnecessary columns (no avatar_url, timezone, etc)
- JSONB metadata for future extensibility without migrations
- Indexes only on query paths that will be hit

---

## 4. SIMPLIFIED API (8 Endpoints Total)

### Authentication (2 endpoints)
```
GET  /api/auth/session              → { user, isAuthenticated }
POST /api/auth/logout               → { ok: true }
```
(GitHub OAuth handled by NextAuth route)

### Codeforces (2 endpoints)
```
POST /api/codeforces/connect        → { handle: string }
  → Validates handle exists, saves to DB, returns profile
  
GET  /api/codeforces/profile        → { handle, rating, maxRating, rank, history: [...] }
  → Returns latest cached profile + rating history
```

### LeetCode (2 endpoints)
```
POST /api/leetcode/connect          → { username: string }
  → Validates username exists, saves to DB, returns profile
  
GET  /api/leetcode/profile          → { username, solved, total, acceptanceRate }
  → Returns latest cached profile
```

### AI Insights (1 endpoint)
```
GET  /api/insights                  → { insights: [...], loading: false }
  → Returns cached insights or generates new ones on demand
  → Rate limit: 1 request per 30 seconds per user
```

### Dashboard (1 endpoint, optional)
```
GET  /api/dashboard                 → Merges codeforces + leetcode data for dashboard
  → Can be done client-side instead
```

**That's literally it**. 8 endpoints.

---

## 5. DEVELOPMENT ORDER (14-21 Days)

### Day 1-2: Setup & Auth
- [ ] Create Next.js project
- [ ] Install Prisma, NextAuth.js
- [ ] Set up GitHub OAuth
- [ ] Create auth routes + login page
- [ ] Deploy to Vercel (test login works)
- **Checkpoint**: Can log in with GitHub

### Day 3-4: Codeforces Integration
- [ ] Create Codeforces API service (lib/codeforces.ts)
  - `getProfile(handle)` → fetch from API
  - `validateHandle(handle)` → simple existence check
- [ ] POST /api/codeforces/connect endpoint
- [ ] GET /api/codeforces/profile endpoint
- [ ] Create settings/codeforces page (input + connect button)
- [ ] Save & display profile on dashboard
- **Checkpoint**: Can connect Codeforces handle, see rating

### Day 5-6: LeetCode Integration
- [ ] Create LeetCode GraphQL service (lib/leetcode.ts)
- [ ] POST /api/leetcode/connect endpoint
- [ ] GET /api/leetcode/profile endpoint
- [ ] Create settings/leetcode page
- [ ] Save & display profile on dashboard
- **Checkpoint**: Can connect both platforms, see both profiles

### Day 7-8: Dashboard & Graphs
- [ ] Create /dashboard page layout
- [ ] Display both profiles side-by-side (cards)
- [ ] Fetch rating history for both platforms
- [ ] Create RatingChart component (recharts)
- [ ] Plot 30-day rating trends (simple line chart)
- **Checkpoint**: Dashboard shows both profiles + graphs

### Day 9-10: AI Insights
- [ ] Create lib/claude.ts service
  - Prompt: "Analyze this user's competitive programming data and identify top 3 weaknesses"
  - Input: Codeforces stats + LeetCode stats
  - Output: JSON array of insights
- [ ] GET /api/insights endpoint
- [ ] Create InsightPanel component
- [ ] Display on dashboard
- [ ] Add loading state, error handling
- **Checkpoint**: AI generates insights on dashboard

### Day 11-12: Polish & Errors
- [ ] Add error pages for invalid handles
- [ ] Add retry logic for API failures
- [ ] Add loading states everywhere
- [ ] Clean up UI (consistent colors, spacing)
- [ ] Add logout button
- [ ] Test login → connect → view dashboard flow
- **Checkpoint**: App feels complete

### Day 13-14: Deploy & Buffer
- [ ] Deploy to Vercel
- [ ] Set up PostgreSQL on Railway
- [ ] Test production flow
- [ ] Fix bugs
- [ ] Add buffer for unexpected issues

---

## 6. WHAT NOT TO BUILD

### DO NOT SPEND TIME ON:
- ❌ Notification system (real-time updates, email, reminders)
- ❌ Background sync jobs (schedule later via cron)
- ❌ Contests and contest reminders
- ❌ Problem-level analytics (categories, by difficulty)
- ❌ Friend comparisons or leaderboards
- ❌ User preferences UI (timezone, notification settings)
- ❌ Complex charting (stick to simple line/bar charts)
- ❌ Mobile responsiveness beyond basic (Tailwind handles this)
- ❌ Admin pages or monitoring dashboards
- ❌ Search functionality
- ❌ Dark mode
- ❌ Websockets or real-time features

### DO BUILD WITH DEFAULTS:
- ✅ Light mode only
- ✅ Simple UI (cards + text)
- ✅ On-demand data fetching (no background jobs)
- ✅ Cached in database (no Redis needed)
- ✅ Single region deployment (Vercel US)

---

## 7. KEY SHORTCUTS FOR SPEED

### Auth
```typescript
// Use NextAuth.js GitHub provider - don't build auth from scratch
// 2 lines of config, 0 custom code
import GitHubProvider from "next-auth/providers/github"
```

### Database
```typescript
// Use Prisma migrations, not raw SQL
// prisma migrate dev --name add_users
// Zero SQL to write manually
```

### Styling
```typescript
// TailwindCSS - no CSS files, just class names
// <div className="flex gap-4 rounded-lg border bg-white p-4">
// Done.
```

### API Client
```typescript
// Use fetch() directly, no axios/swr for MVP
const res = await fetch('/api/codeforces/profile')
const profile = await res.json()
```

### Charting
```typescript
// Recharts copy-paste examples
<LineChart data={data}>
  <CartesianGrid />
  <XAxis dataKey="date" />
  <YAxis />
  <Line type="monotone" dataKey="rating" />
</LineChart>
```

---

## 8. CRITICAL DECISIONS

| Decision | Choice | Why |
|----------|--------|-----|
| Language | TypeScript | Type safety saves debugging time, especially for student |
| Frontend | Next.js | One repo, one deploy, API routes avoid context switching |
| Auth | GitHub OAuth | Instant, zero bugs, free, student already has GitHub |
| Database | PostgreSQL | More durable than SQLite, similar complexity, Railway free tier |
| Charting | Recharts | Pre-built, copy-paste, no D3 learning curve |
| Deployment | Vercel | Next.js native, free tier, instant deploys |
| AI | Claude API | Better insights than LLMs, proven track record |

---

## 9. SUCCESS CRITERIA

### MVP is **done** when:
- [x] Student can log in via GitHub
- [x] Student can connect Codeforces handle
- [x] Student can connect LeetCode username
- [x] Dashboard displays both profiles
- [x] Rating graphs show 30-day trends
- [x] AI generates relevant insights
- [x] Deployed to Vercel + accessible via URL
- [x] No crashes when clicking through app

### NOT required:
- Perfect UI/UX
- 100% test coverage
- Mobile perfection
- Complex features
- Documentation

---

## 10. POST-MVP ROADMAP (Week 4+)

Once deployed, student can add in this order:
1. **Background jobs** (fetch ratings hourly, cache for speed)
2. **Contests** (fetch upcoming, show on dashboard)
3. **Problem analytics** (category breakdown, time-to-solve)
4. **Mobile polish** (responsive design refinements)
5. **Notifications** (email on rating changes)
6. **Social** (compare with friends)

**But first**: Ship. Get feedback. Then build features based on what users actually want.

---

## TLDR (For Impatient Principal Engineers)

**In 2-3 weeks, one student can:**
1. Build full auth with GitHub OAuth
2. Connect to 2 external APIs (Codeforces, LeetCode)
3. Build dashboard with rating graphs
4. Add AI insights
5. Deploy to production

**Tech**: Next.js + Prisma + Vercel. **Scope**: 8 API endpoints, 5 DB tables, ~30 files.

**Magic formula**: Ruthless scope cuts + boring tech that just works + deploy early.

