# AI Contest Tracker - MVP Specification

## 1. COMPLETE MVP FEATURE LIST

### Authentication & User Management
- Email/password registration with email verification
- OAuth (Google, GitHub optional for Phase 2)
- User profile management
- Secure token refresh mechanism

### Integrations
- **Codeforces**
  - Connect via username (public data only)
  - Fetch current rating, max rating, rank
  - List recent contests participated
  - Fetch problem solve history
  - Monitor new contest announcements

- **LeetCode**
  - Connect via username (GraphQL API)
  - Fetch problem statistics (solved by difficulty)
  - Fetch submission history
  - Track acceptance rate
  - Fetch user rating/badges

### Dashboard & Analytics
- Unified user profile showing both platform stats
- Rating history charts (30d, 90d, all-time)
- Problem-solving analytics (by difficulty, category, language)
- Contest participation history and trends
- Next upcoming contests (auto-fetched from Codeforces)

### Contest Management
- View upcoming contests across platforms
- Contest reminder notifications (email/in-app)
- Calendar integration (iCal feed)
- One-click redirect to contest platform

### AI-Powered Insights
- Weakness analysis based on:
  - Problem categories with low success rate
  - Time-to-solve patterns
  - Difficulty progression gaps
  - Performance decline over time
- Personalized learning recommendations
- Streak tracking and gamification metrics

### Notifications
- Upcoming contest reminders (24h, 1h before)
- New contest announcements
- Rating milestones
- Weekly summary digest

---

## 2. BACKEND FOLDER STRUCTURE

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── external-apis.ts
│   │   └── env.ts
│   │
│   ├── auth/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   └── profile.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.service.ts
│   │   │   └── password.service.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts
│   │   │   ├── authorize.ts
│   │   │   └── rate-limit.ts
│   │   └── routes.ts
│   │
│   ├── integrations/
│   │   ├── codeforces/
│   │   │   ├── codeforces.service.ts
│   │   │   ├── codeforces.types.ts
│   │   │   └── codeforces.controller.ts
│   │   ├── leetcode/
│   │   │   ├── leetcode.service.ts
│   │   │   ├── leetcode.types.ts
│   │   │   └── leetcode.controller.ts
│   │   └── routes.ts
│   │
│   ├── jobs/
│   │   ├── sync-codeforces.job.ts
│   │   ├── sync-leetcode.job.ts
│   │   ├── fetch-contests.job.ts
│   │   ├── generate-insights.job.ts
│   │   ├── send-reminders.job.ts
│   │   └── scheduler.ts
│   │
│   ├── ai/
│   │   ├── insights.service.ts
│   │   ├── analytics.service.ts
│   │   ├── recommendation.service.ts
│   │   └── prompts.ts
│   │
│   ├── notifications/
│   │   ├── email.service.ts
│   │   ├── notification.service.ts
│   │   ├── templates/
│   │   │   ├── contest-reminder.ts
│   │   │   └── weekly-digest.ts
│   │   └── routes.ts
│   │
│   ├── analytics/
│   │   ├── analytics.service.ts
│   │   ├── analytics.controller.ts
│   │   └── routes.ts
│   │
│   ├── database/
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── codeforces-profile.model.ts
│   │   │   ├── leetcode-profile.model.ts
│   │   │   ├── contest.model.ts
│   │   │   ├── problem.model.ts
│   │   │   ├── user-problem.model.ts
│   │   │   ├── contest-reminder.model.ts
│   │   │   ├── insight.model.ts
│   │   │   └── sync-log.model.ts
│   │   ├── migrations/
│   │   └── seeders/
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── error-handler.ts
│   │   ├── validators.ts
│   │   ├── date-utils.ts
│   │   └── cache.ts
│   │
│   ├── types/
│   │   ├── express.d.ts
│   │   └── api.types.ts
│   │
│   └── app.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── .env.example
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

**Tech Stack**: Node.js + Express + TypeScript + PostgreSQL + Bull Queue (jobs) + Claude API (AI insights)

---

## 3. FRONTEND FOLDER STRUCTURE

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── RatingChart.tsx
│   │   │   └── UpcomingContests.tsx
│   │   │
│   │   ├── integrations/
│   │   │   ├── IntegrationManager.tsx
│   │   │   ├── CodeforcesConnect.tsx
│   │   │   ├── LeetCodeConnect.tsx
│   │   │   └── DisconnectModal.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── ProblemStats.tsx
│   │   │   ├── DifficultyDistribution.tsx
│   │   │   ├── TimeSeriesChart.tsx
│   │   │   ├── LanguageStats.tsx
│   │   │   └── CategoryBreakdown.tsx
│   │   │
│   │   ├── insights/
│   │   │   ├── InsightsPanel.tsx
│   │   │   ├── WeaknessAnalysis.tsx
│   │   │   ├── Recommendations.tsx
│   │   │   ├── StreakCard.tsx
│   │   │   └── InsightSkeleton.tsx
│   │   │
│   │   ├── contests/
│   │   │   ├── ContestList.tsx
│   │   │   ├── ContestCard.tsx
│   │   │   ├── ContestReminders.tsx
│   │   │   └── ContestCalendar.tsx
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── ProfileSettings.tsx
│   │   │   ├── PreferencesForm.tsx
│   │   │   └── PlatformStats.tsx
│   │   │
│   │   ├── notifications/
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── NotificationCenter.tsx
│   │   │   └── ToastNotification.tsx
│   │   │
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   └── layout/
│   │       ├── MainLayout.tsx
│   │       └── AuthLayout.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   ├── useCodeforces.ts
│   │   ├── useLeetCode.ts
│   │   ├── useContests.ts
│   │   ├── useInsights.ts
│   │   ├── useNotifications.ts
│   │   └── useFetch.ts
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── UserContext.tsx
│   │   └── NotificationContext.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── codeforces.service.ts
│   │   ├── leetcode.service.ts
│   │   ├── analytics.service.ts
│   │   ├── notification.service.ts
│   │   └── storage.service.ts
│   │
│   ├── utils/
│   │   ├── format.ts
│   │   ├── validators.ts
│   │   ├── date-utils.ts
│   │   ├── chart-colors.ts
│   │   └── constants.ts
│   │
│   ├── types/
│   │   └── api.types.ts
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Analytics.tsx
│   │   ├── Contests.tsx
│   │   ├── Profile.tsx
│   │   └── Settings.tsx
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── public/
├── tests/
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**Tech Stack**: React 18 + TypeScript + Vite + TanStack Query + Recharts + TailwindCSS

---

## 4. PostgreSQL SCHEMA

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Codeforces Profile
CREATE TABLE codeforces_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  handle VARCHAR(255) UNIQUE NOT NULL,
  
  current_rating INT,
  max_rating INT,
  rank VARCHAR(50),
  title_photo TEXT,
  
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, handle)
);

-- LeetCode Profile
CREATE TABLE leetcode_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(255) UNIQUE NOT NULL,
  
  total_solved INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  accept_rate DECIMAL(5, 2),
  badge_count INT DEFAULT 0,
  
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, username)
);

-- Contests
CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'codeforces', 'leetcode'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INT,
  
  status VARCHAR(50), -- 'scheduled', 'running', 'finished'
  url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(platform, external_id)
);

-- User Contest Reminders
CREATE TABLE contest_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  
  reminder_at TIMESTAMP NOT NULL,
  is_notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, contest_id)
);

-- Problems (aggregated from both platforms)
CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  
  difficulty VARCHAR(50), -- 'easy', 'medium', 'hard'
  category VARCHAR(100),
  tags JSONB, -- ['array', 'sorting', ...]
  
  url TEXT,
  editorial_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(platform, external_id)
);

-- User Problem Attempts
CREATE TABLE user_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  
  status VARCHAR(50), -- 'solved', 'attempted', 'skipped'
  first_submitted_at TIMESTAMP,
  last_submitted_at TIMESTAMP,
  attempt_count INT DEFAULT 0,
  
  language VARCHAR(50),
  runtime_ms INT,
  memory_kb INT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, problem_id)
);

-- Rating History (for charting)
CREATE TABLE rating_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  
  rating INT NOT NULL,
  change INT, -- +50, -30, etc
  contest_name VARCHAR(255),
  
  recorded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX(user_id, platform, recorded_at)
);

-- AI-Generated Insights
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  insight_type VARCHAR(100), -- 'weakness', 'recommendation', 'streak'
  content TEXT NOT NULL,
  metadata JSONB, -- {category: 'dp', accuracy: '35%', ...}
  
  is_dismissed BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX(user_id, created_at)
);

-- Sync Logs (for monitoring)
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  
  sync_type VARCHAR(50), -- 'rating', 'problems', 'contests'
  status VARCHAR(50), -- 'success', 'failed', 'partial'
  error_message TEXT,
  records_synced INT,
  
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INT,
  
  INDEX(user_id, completed_at)
);

-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  email_contests_24h BOOLEAN DEFAULT TRUE,
  email_contests_1h BOOLEAN DEFAULT TRUE,
  email_rating_milestone BOOLEAN DEFAULT TRUE,
  email_weekly_digest BOOLEAN DEFAULT TRUE,
  
  in_app_notifications BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_codeforces_user_id ON codeforces_profiles(user_id);
CREATE INDEX idx_leetcode_user_id ON leetcode_profiles(user_id);
CREATE INDEX idx_contests_start_time ON contests(start_time);
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_user_problems_user_id ON user_problems(user_id);
CREATE INDEX idx_user_problems_platform ON user_problems(platform);
CREATE INDEX idx_rating_history_user_id ON rating_history(user_id);
CREATE INDEX idx_insights_user_id ON insights(user_id);
```

---

## 5. API ENDPOINT DESIGN

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### User Profile
```
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/settings
PUT    /api/users/settings
DELETE /api/users/account
```

### Codeforces Integration
```
POST   /api/integrations/codeforces/connect      (username)
GET    /api/integrations/codeforces/status
GET    /api/integrations/codeforces/profile
POST   /api/integrations/codeforces/sync         (manual trigger)
DELETE /api/integrations/codeforces/disconnect
GET    /api/integrations/codeforces/history      (rating history)
```

### LeetCode Integration
```
POST   /api/integrations/leetcode/connect        (username)
GET    /api/integrations/leetcode/status
GET    /api/integrations/leetcode/profile
POST   /api/integrations/leetcode/sync           (manual trigger)
DELETE /api/integrations/leetcode/disconnect
GET    /api/integrations/leetcode/problems       (recent problems)
```

### Contests
```
GET    /api/contests                 (all upcoming)
GET    /api/contests?platform=codeforces
GET    /api/contests/:id
GET    /api/contests/upcoming?days=7
```

### Contest Reminders
```
GET    /api/reminders
POST   /api/reminders                (subscribe to contest)
DELETE /api/reminders/:id            (unsubscribe)
PUT    /api/reminders/:id            (update reminder time)
GET    /api/reminders/calendar.ics   (iCal feed)
```

### Analytics & Insights
```
GET    /api/analytics/overview
GET    /api/analytics/rating-history?days=90&platform=codeforces
GET    /api/analytics/problems
  - by difficulty, category, language, time
GET    /api/analytics/problem-stats
GET    /api/analytics/category-breakdown

GET    /api/insights                 (list all insights)
GET    /api/insights/weaknesses
GET    /api/insights/recommendations
GET    /api/insights/streak
POST   /api/insights/:id/dismiss
```

### Notifications
```
GET    /api/notifications
GET    /api/notifications?unread=true
PUT    /api/notifications/:id/read
DELETE /api/notifications/:id
PUT    /api/notification-preferences
GET    /api/notification-preferences
```

### Admin/Monitoring
```
GET    /api/admin/sync-logs/:userId
GET    /api/admin/job-status
```

---

## 6. FUTURE SCALABILITY ROADMAP

### Phase 2 (Months 2-3)
- [ ] Social features (friend comparison, leaderboards)
- [ ] OAuth integration (Google, GitHub login)
- [ ] Mobile app (React Native)
- [ ] API rate limit improvements
- [ ] PostgreSQL read replicas
- [ ] Redis caching layer for hot data

### Phase 3 (Months 4-6)
- [ ] AtCoder, SPOJ integrations
- [ ] Advanced ML insights (problem recommendation engine)
- [ ] Study group collaboration features
- [ ] Export to PDF/calendar
- [ ] Webhook notifications
- [ ] GraphQL API layer

### Phase 4 (Months 7-12)
- [ ] Team/organization dashboard
- [ ] Advanced analytics (Plotly/D3 visualizations)
- [ ] Video tutorials for weak areas
- [ ] Mock contest simulator
- [ ] Elasticsearch for problem search
- [ ] Kafka event streaming for real-time features
- [ ] Microservices extraction (integrations, AI services)

### Architectural Improvements
- **CDN**: Cloudflare/AWS CloudFront for frontend assets
- **Object Storage**: AWS S3 for user exports, charts
- **Message Queue**: RabbitMQ/SQS for job processing
- **Caching**: Redis cluster for session/data caching
- **Monitoring**: Datadog/New Relic for observability
- **Containers**: Docker + Kubernetes for orchestration
- **Database**: Sharding by user_id for multi-tenancy scale
- **Search**: Elasticsearch for full-text problem search
- **Analytics**: Segment/Mixpanel for product analytics

### Performance Targets (MVP → Scale)
| Metric | MVP | Phase 4 |
|--------|-----|---------|
| Concurrent Users | 100 | 10,000+ |
| API Response Time | <500ms | <200ms |
| Data Sync Latency | 5-10 min | Real-time (WebSocket) |
| Database Size | 10GB | 500GB+ (sharded) |
| Monthly API Calls | 1M | 100M+ |
| Uptime SLA | 99.5% | 99.99% |

---

## Key Design Decisions

### Why This Architecture?
1. **Monolithic Backend (MVP)**: Easier to deploy, maintain, debug. Microservices come later.
2. **PostgreSQL**: ACID compliance, powerful for analytics queries, relationships.
3. **Bull Queue**: Reliable job scheduling without external infrastructure.
4. **Claude API**: State-of-art insights generation without maintaining ML models.
5. **React + Vite**: Fast dev experience, modern tooling, component reusability.
6. **TypeScript**: Type safety across frontend and backend.

### Data Sync Strategy
- **Codeforces**: Poll every 6 hours for active users, daily for inactive
- **LeetCode**: Poll every 4 hours (slower API rate limits)
- **Contests**: Poll every 30 minutes for upcoming contests
- User can trigger manual sync any time

### Security
- JWT tokens with 15-min expiry, 7-day refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting: 100 req/min per user, 1000 req/min per IP
- No storage of external API credentials (re-authenticate on demand)
- HTTPS only, CSP headers, XSS/CSRF protection

