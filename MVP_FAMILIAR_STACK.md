# AI Contest Tracker - MVP (Familiar Tech Stack)

**Constraint**: Use only technologies you already know + Prisma as optional ORM.

**Goal**: Build in 2-4 weeks. Understand every line. Prepare for interviews.

**Why this approach**: Manual JWT + Express is classic backend interview material. Separate frontend/backend teaches architecture. No magic frameworks = you own the code.

---

## 1. PROJECT ARCHITECTURE

### Directory Layout (Monorepo)
```
ai-contest-tracker/
├── backend/          (Node.js + Express)
├── frontend/         (React + React Router)
└── shared/           (Types, constants)
```

### Tech Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + React Router + TailwindCSS | You know this |
| Backend | Node.js + Express.js | You know this |
| Database | PostgreSQL + Prisma ORM | Prisma saves time on queries |
| Auth | JWT (manual) + bcrypt | Interview prep, understand the flow |
| API Communication | REST JSON | Simple, no GraphQL complexity |
| Deployment | Railway (PostgreSQL) + Render/Fly.io | Free tier, simple |

---

## 2. BACKEND FOLDER STRUCTURE

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.middleware.js
│   │   ├── auth.routes.js
│   │   └── jwt.js
│   │
│   ├── integrations/
│   │   ├── codeforces/
│   │   │   ├── codeforces.controller.js
│   │   │   ├── codeforces.service.js
│   │   │   ├── codeforces.routes.js
│   │   │   └── codeforces.types.js
│   │   │
│   │   └── leetcode/
│   │       ├── leetcode.controller.js
│   │       ├── leetcode.service.js
│   │       ├── leetcode.routes.js
│   │       └── leetcode.types.js
│   │
│   ├── insights/
│   │   ├── insights.controller.js
│   │   ├── insights.service.js
│   │   ├── claude.js (Claude API calls)
│   │   └── insights.routes.js
│   │
│   ├── db/
│   │   ├── prisma.js (Prisma client)
│   │   └── schema.prisma (Prisma schema)
│   │
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── requestLogger.js
│   │   └── corsHandler.js
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── errorResponse.js
│   │   └── constants.js
│   │
│   ├── app.js (Express setup)
│   └── server.js (Start server)
│
├── .env.example
├── .gitignore
├── package.json
└── README.md

Files: ~20 total. Everything small and focused.
```

**Design principle**: One service per external API. One middleware for auth. Clear separation.

---

## 3. FRONTEND FOLDER STRUCTURE

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── integrations/
│   │   │   ├── CodeforcesConnect.jsx
│   │   │   ├── LeetCodeConnect.jsx
│   │   │   └── PlatformStatus.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ProfileCard.jsx
│   │   │   ├── RatingChart.jsx
│   │   │   ├── InsightPanel.jsx
│   │   │   └── StatsOverview.jsx
│   │   │
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   └── Button.jsx
│   │   │
│   │   └── layout/
│   │       ├── MainLayout.jsx
│   │       └── AuthLayout.jsx
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Settings.jsx
│   │   └── NotFound.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useUser.js
│   │   ├── useCodeforces.js
│   │   ├── useLeetCode.js
│   │   ├── useInsights.js
│   │   └── useFetch.js
│   │
│   ├── services/
│   │   ├── api.js (Base fetch wrapper)
│   │   ├── auth.service.js
│   │   ├── codeforces.service.js
│   │   ├── leetcode.service.js
│   │   └── insights.service.js
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── UserContext.jsx
│   │
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── chartColors.js
│   │
│   ├── App.jsx (Routes)
│   ├── main.jsx
│   └── index.css (Tailwind imports)
│
├── public/
├── .env.example
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md

Files: ~25 total. Clear component hierarchy.
```

**Design principle**: Pages contain routes. Components are reusable. Services handle API calls. Hooks manage state.

---

## 4. DATABASE SCHEMA (Prisma)

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?

  codeforcesProfile CodeforcesProfile?
  leetcodeProfile   LeetcodeProfile?
  ratingHistory     RatingHistory[]
  insights          Insight[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CodeforcesProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  handle    String   @unique

  rating    Int?
  maxRating Int?
  rank      String?

  syncedAt  DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model LeetcodeProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  username  String   @unique

  solved       Int?
  total        Int?
  acceptRate   Float?

  syncedAt  DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model RatingHistory {
  id        String   @id @default(cuid())
  userId    String
  platform  String   // 'codeforces' or 'leetcode'

  rating    Int
  recordedAt DateTime

  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, platform, recordedAt])
}

model Insight {
  id        String   @id @default(cuid())
  userId    String
  platform  String   // 'codeforces', 'leetcode', or 'combined'

  content   String   // AI-generated insight text
  metadata  Json?    // {weakness: 'dp', confidence: 0.8}

  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
}
```

**Why Prisma?**
- Type-safe queries in JavaScript (catch errors early)
- Automatic migrations (`prisma migrate dev`)
- Built-in query builder (no SQL strings)
- Good for interviews ("I used an ORM for type safety and faster development")

**Total**: 5 models. That's it.

---

## 5. EXACT API ENDPOINTS

### Auth Routes (POST only)
```
POST /api/auth/register
  Request:  { email, password, name }
  Response: { token, user: { id, email, name } }

POST /api/auth/login
  Request:  { email, password }
  Response: { token, user: { id, email, name } }

POST /api/auth/refresh
  Request:  { token }
  Response: { token }

GET /api/auth/me
  Headers:  Authorization: Bearer <token>
  Response: { user: { id, email, name, codeforcesHandle, leetcodeUsername } }

POST /api/auth/logout
  Headers:  Authorization: Bearer <token>
  Response: { ok: true }
```

### Codeforces Routes
```
POST /api/codeforces/connect
  Headers:  Authorization: Bearer <token>
  Request:  { handle }
  Response: { handle, rating, maxRating, rank }
  (Fetches from public Codeforces API, saves to DB)

GET /api/codeforces/profile
  Headers:  Authorization: Bearer <token>
  Response: { handle, rating, maxRating, rank, syncedAt }

GET /api/codeforces/history?days=30
  Headers:  Authorization: Bearer <token>
  Response: [{ rating, recordedAt, change }, ...]
  (Returns rating history for charting)

DELETE /api/codeforces/disconnect
  Headers:  Authorization: Bearer <token>
  Response: { ok: true }
```

### LeetCode Routes
```
POST /api/leetcode/connect
  Headers:  Authorization: Bearer <token>
  Request:  { username }
  Response: { username, solved, total, acceptRate }

GET /api/leetcode/profile
  Headers:  Authorization: Bearer <token>
  Response: { username, solved, total, acceptRate, syncedAt }

GET /api/leetcode/history?days=30
  Headers:  Authorization: Bearer <token>
  Response: [{ solved, recordedAt }, ...]

DELETE /api/leetcode/disconnect
  Headers:  Authorization: Bearer <token>
  Response: { ok: true }
```

### Insights Route
```
GET /api/insights?platform=codeforces
  Headers:  Authorization: Bearer <token>
  Response: { insights: [{ content, metadata, createdAt }, ...], lastGenerated }
  (Generates on first call or if older than 24h, caches result)

POST /api/insights/regenerate
  Headers:  Authorization: Bearer <token>
  Request:  { platform: 'codeforces' | 'leetcode' | 'combined' }
  Response: { insights: [...], generatedAt }
```

### Dashboard Route (optional, can be done client-side)
```
GET /api/dashboard
  Headers:  Authorization: Bearer <token>
  Response: {
    codeforces: { handle, rating, maxRating },
    leetcode: { username, solved, total },
    ratingHistory: [...]
  }
```

**Total: 12 endpoints**. Clear, RESTful, easy to understand.

---

## 6. DATABASE SCHEMA (SQL, if not using Prisma)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Codeforces Profile
CREATE TABLE codeforces_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  handle VARCHAR(255) NOT NULL UNIQUE,
  rating INT,
  max_rating INT,
  rank VARCHAR(50),
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- LeetCode Profile
CREATE TABLE leetcode_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL UNIQUE,
  solved INT,
  total INT,
  accept_rate FLOAT,
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rating History
CREATE TABLE rating_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  rating INT NOT NULL,
  recorded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX rating_history_user_platform (user_id, platform, recorded_at)
);

-- AI Insights
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX insights_user_created (user_id, created_at DESC)
);
```

---

## 7. DEVELOPMENT ORDER (2-4 Weeks)

### Week 1: Backend Foundation & Auth

**Days 1-2: Project Setup**
- [ ] Create backend folder, `npm init`, install Express
- [ ] Create frontend folder, set up Vite + React
- [ ] Install Prisma, set up PostgreSQL locally
- [ ] Create `.env` files (DATABASE_URL, JWT_SECRET, etc)
- **Checkpoint**: Both repos running locally, empty pages

**Days 3-4: Authentication**
- [ ] Create `backend/src/auth/jwt.js` (sign/verify tokens)
- [ ] Create `backend/src/auth/auth.middleware.js` (protect routes)
- [ ] Create `backend/src/auth/auth.controller.js` (register/login endpoints)
- [ ] Create `backend/src/auth/auth.service.js` (password hashing, validation)
- [ ] Test with Postman: register → login → get token
- **Checkpoint**: Can register, login, get JWT token

**Days 5-6: Frontend Auth**
- [ ] Create `frontend/src/context/AuthContext.jsx` (store token, user)
- [ ] Create `frontend/src/pages/Login.jsx` (login form)
- [ ] Create `frontend/src/pages/Register.jsx` (register form)
- [ ] Create `frontend/src/hooks/useAuth.js` (login/logout/register)
- [ ] Create `frontend/src/components/ProtectedRoute.jsx` (redirect if not logged in)
- [ ] Wire up routing in `App.jsx`
- **Checkpoint**: Can register on frontend, see token in localStorage

**Days 7: Database & Models**
- [ ] Create Prisma schema (User, CodeforcesProfile, LeetcodeProfile)
- [ ] Run `prisma migrate dev --name init`
- [ ] Test: Can create user via backend
- **Checkpoint**: Database is connected and populated

---

### Week 2: Integrations

**Days 8-9: Codeforces Integration**
- [ ] Create `backend/src/integrations/codeforces/codeforces.service.js`
  - Fetch public user data from Codeforces API
  - Parse rating, maxRating, rank
- [ ] Create `backend/src/integrations/codeforces/codeforces.controller.js`
  - POST /api/codeforces/connect (save handle, fetch profile)
  - GET /api/codeforces/profile (return cached profile)
  - DELETE /api/codeforces/disconnect
- [ ] Test with Postman: connect a real Codeforces handle
- **Checkpoint**: Can connect Codeforces, see rating displayed

**Days 10-11: LeetCode Integration**
- [ ] Create `backend/src/integrations/leetcode/leetcode.service.js`
  - Fetch user data from LeetCode GraphQL API
  - Parse solved, total, acceptRate
- [ ] Create `backend/src/integrations/leetcode/leetcode.controller.js`
  - POST /api/leetcode/connect
  - GET /api/leetcode/profile
  - DELETE /api/leetcode/disconnect
- [ ] Test with Postman: connect a real LeetCode username
- **Checkpoint**: Can connect both platforms

**Day 12: Rating History**
- [ ] In Codeforces + LeetCode services: save rating to `rating_history` table
- [ ] Create GET /api/codeforces/history?days=30 endpoint
- [ ] Create GET /api/leetcode/history?days=30 endpoint
- **Checkpoint**: Can fetch historical ratings for graphing

---

### Week 3: Frontend & Visualization

**Days 13-14: Dashboard Layout**
- [ ] Create `frontend/src/pages/Dashboard.jsx`
- [ ] Create `frontend/src/components/ProfileCard.jsx` (display Codeforces + LeetCode stats)
- [ ] Create `frontend/src/components/StatsOverview.jsx`
- [ ] Layout with Tailwind grid
- **Checkpoint**: Dashboard shows both profiles when logged in

**Days 15-16: Rating Graphs**
- [ ] Install `recharts`
- [ ] Create `frontend/src/components/RatingChart.jsx`
  - Line chart with rating over time
  - Show both platforms on same chart or separate
- [ ] Fetch rating history from backend
- [ ] Display 30-day trend
- **Checkpoint**: Graphs render correctly

**Day 17: Connect/Disconnect UI**
- [ ] Create `frontend/src/pages/Settings.jsx`
- [ ] Create `frontend/src/components/CodeforcesConnect.jsx` (input + connect button)
- [ ] Create `frontend/src/components/LeetCodeConnect.jsx` (input + connect button)
- [ ] Wire up disconnect buttons
- **Checkpoint**: Can connect/disconnect platforms from frontend

---

### Week 4: AI Insights & Polish

**Days 18-19: AI Insights**
- [ ] Create `backend/src/insights/claude.js` (Claude API client)
  - Prompt: "User has Codeforces rating X, solved Y LeetCode problems. What are their top 3 weaknesses?"
  - Make API call to Claude
  - Parse response
- [ ] Create `backend/src/insights/insights.controller.js`
  - GET /api/insights (fetch or generate)
  - POST /api/insights/regenerate
- [ ] Create `frontend/src/components/InsightPanel.jsx` (display insights)
- [ ] Add to dashboard
- **Checkpoint**: AI generates insights when you view dashboard

**Day 20: Error Handling & Loading States**
- [ ] Add error boundaries to React components
- [ ] Add loading spinners during API calls
- [ ] Better error messages from backend
- [ ] Validate inputs (email format, handle existence)
- **Checkpoint**: App gracefully handles errors

**Days 21-22: Polish & Testing**
- [ ] Test complete flow: register → login → connect both → view dashboard → see graphs → read insights
- [ ] Fix styling issues
- [ ] Test on mobile (Tailwind responsiveness)
- [ ] Clean up console errors
- **Checkpoint**: App is usable end-to-end

**Days 23-28: Buffer for Surprises**
- [ ] Deploy to Railway (backend) + Vercel (frontend)
- [ ] Fix any deployment issues
- [ ] Handle any bugs discovered
- [ ] Document code (comments in tricky spots)
- [ ] Update README with setup instructions

---

## 8. INTERVIEW-FOCUSED IMPLEMENTATION GUIDE

### Authentication (Interview Gold)
```javascript
// backend/src/auth/jwt.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Show you understand JWT structure
const signToken = (userId) => {
  return jwt.sign(
    { userId, issuedAt: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Short expiry = security
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Password hashing shows you understand security
const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10); // 10 rounds
};

const comparePassword = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};
```

**Interview talking point**: "I implemented JWT manually to understand the token lifecycle. The middleware intercepts requests, verifies the token signature, and checks expiration. If valid, it attaches the user to the request."

### Middleware (Interview Silver)
```javascript
// backend/src/auth/auth.middleware.js
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Extract from "Bearer <token>"

  if (!token) return res.status(401).json({ error: 'No token' });

  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user; // Attach to request
  next();
};
```

**Interview talking point**: "This middleware extracts the JWT from the Authorization header, validates the signature, and attaches the decoded payload to the request. It's applied to all protected routes."

### Service Layer Pattern (Interview Platinum)
```javascript
// backend/src/integrations/codeforces/codeforces.service.js
const CodeforcesService = {
  // Fetch from external API
  fetchUserData: async (handle) => {
    const response = await fetch(
      `https://codeforces.com/api/user.info?handles=${handle}`
    );
    if (!response.ok) throw new Error('User not found');
    const data = await response.json();
    return {
      handle: data.result[0].handle,
      rating: data.result[0].rating,
      maxRating: data.result[0].maxRating,
    };
  },

  // Save to database
  saveProfile: async (userId, handle, profile) => {
    return await prisma.codeforcesProfile.upsert({
      where: { userId },
      update: { ...profile, syncedAt: new Date() },
      create: { userId, handle, ...profile, syncedAt: new Date() },
    });
  },

  // Retrieve from database
  getProfile: async (userId) => {
    return await prisma.codeforcesProfile.findUnique({
      where: { userId },
    });
  },
};

module.exports = CodeforcesService;
```

**Interview talking point**: "I separated the service layer from the controller so the business logic is testable and reusable. The service handles external API calls, database operations, and data transformation."

### React Hooks for State (Interview Gold)
```javascript
// frontend/src/hooks/useCodeforces.js
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const useCodeforces = () => {
  const { token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connect = async (handle) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/codeforces/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle }),
      });
      if (!res.ok) throw new Error('Failed to connect');
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, connect };
};

export default useCodeforces;
```

**Interview talking point**: "I use custom hooks to encapsulate API logic, state management, and error handling. This keeps components clean and makes the logic reusable across multiple components."

---

## 9. WHAT TO TELL INTERVIEWERS

### Architecture
"I built a monolithic backend with Express and a separate React frontend. The backend uses a service layer to separate API calls, database operations, and business logic. This makes the code testable and maintainable."

### Authentication
"I implemented JWT-based authentication with manual token signing and verification. The tokens are short-lived (15 minutes) and validated by middleware on every protected request. Passwords are hashed with bcrypt before storage."

### Data Flow
"When a user connects their Codeforces handle, the backend fetches their public profile from the Codeforces API, stores it in PostgreSQL, and returns it to the frontend. The rating history is fetched on-demand and used for charting."

### Scaling
"The current architecture works for hundreds of users. To scale further, I would add Redis caching for frequently accessed profiles, implement background jobs for periodic syncing, and potentially split into microservices. But for an MVP, this is the right balance of simplicity and functionality."

### What You Learned
"I learned the full stack: authentication from first principles (JWT, bcrypt), REST API design, database design with foreign keys and indexes, React hooks for state management, and how external APIs work."

---

## 10. DEPLOYMENT (Simple)

### Backend (Railway.app)
```bash
# Push to GitHub
git push

# Railway auto-deploys
# Set environment variables in Railway dashboard:
# - DATABASE_URL
# - JWT_SECRET
# - CLAUDE_API_KEY
# - NODE_ENV=production
```

### Frontend (Vercel)
```bash
# Connect Vercel to GitHub
# Set VITE_API_URL environment variable
# Auto-deploys on every push
```

---

## 11. RESUME BULLET POINTS

After completing this, write:
- ✅ Built full-stack web application (React + Express + PostgreSQL)
- ✅ Implemented JWT authentication with bcrypt password hashing
- ✅ Integrated with external REST APIs (Codeforces, LeetCode, Claude)
- ✅ Designed RESTful API with 12 endpoints and proper middleware
- ✅ Used Prisma ORM for type-safe database queries and migrations
- ✅ Deployed to production (Vercel, Railway)

---

## 12. EXACT TECH DEPENDENCIES

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "@prisma/client": "^4.10.1",
    "node-fetch": "^2.6.9"
  },
  "devDependencies": {
    "@types/node": "^18.15.11",
    "nodemon": "^2.0.20",
    "prisma": "^4.10.1"
  }
}
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.10.0",
    "recharts": "^2.5.0"
  },
  "devDependencies": {
    "vite": "^4.2.0",
    "@vitejs/plugin-react": "^3.1.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.24",
    "autoprefixer": "^10.4.14"
  }
}
```

No Next.js, no NextAuth, no magic. Just boring, proven libraries.

---

## QUICK START (TL;DR)

1. **Clone + setup**:
   ```bash
   mkdir ai-contest-tracker && cd ai-contest-tracker
   git init
   ```

2. **Backend**:
   ```bash
   mkdir backend && cd backend
   npm init -y
   npm install express cors dotenv jsonwebtoken bcrypt @prisma/client node-fetch
   npx prisma init
   # Edit .env with DATABASE_URL
   npx prisma migrate dev --name init
   node src/server.js
   ```

3. **Frontend**:
   ```bash
   npm create vite@latest frontend -- --template react
   cd frontend
   npm install react-router-dom recharts tailwindcss postcss autoprefixer
   npm run dev
   ```

4. **Build in order**:
   - Auth endpoints first
   - Codeforces integration
   - LeetCode integration
   - Dashboard UI
   - Graphs
   - AI insights
   - Deploy

5. **Interview ready**:
   "I built this using technologies I already knew (React, Express, PostgreSQL) to focus on system design and architecture instead of learning new frameworks. Every component serves a purpose, and I can explain the entire data flow."
