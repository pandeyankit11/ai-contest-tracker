# PHASE 3: Dashboard Implementation Plan

**Status**: Planning Phase
**Target Completion**: Next sprint
**Scope**: Frontend dashboard that aggregates user info, Codeforces profile, upcoming contests preview, and linked accounts summary.

---

## 1. GOAL

Deliver a responsive Dashboard page that:
- Displays authenticated user information
- Shows Codeforces profile summary (rating, handle, max rating)
- Previews next upcoming contests (3-5 items) with quick links
- Summarizes linked platform accounts and connection status
- Provides clear loading and error states

**Success criteria**:
- Dashboard accessible to authenticated users only
- All four sections load and render correctly
- Refreshing the page preserves session and fetches fresh data
- UX handles slow or failed API calls gracefully

---

## 2. FILES TO CREATE

- `frontend/src/pages/Dashboard.jsx` — Main Dashboard page composed of smaller components
- `frontend/src/components/Dashboard/HeaderInfo.jsx` — Shows user basic info + actions
- `frontend/src/components/Dashboard/CodeforcesCard.jsx` — Codeforces profile summary
- `frontend/src/components/Dashboard/UpcomingContestsPreview.jsx` — List/preview of next contests
- `frontend/src/components/Dashboard/LinkedAccountsSummary.jsx` — Linked accounts and statuses

---

## 3. FILES TO MODIFY

- `frontend/src/App.jsx` — Add route for `/dashboard` (if not present) and ensure AuthProvider wrap
- `frontend/src/components/ProtectedRoute.jsx` — Ensure dashboard route is protected
- `frontend/src/pages/Dashboard.jsx` (new) will import existing `Header` component if available
- `frontend/src/utils/api.js` — Add or confirm endpoints for contests and CF profile; expose methods used by the hook

---

## 4. EXACT TERMINAL COMMANDS

### Setup / Dev

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm install && npm run dev
```

### Build & Verification

```bash
# Build frontend
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview
```

### Quick API checks

```bash
# Check user session
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/auth/me

# Check Codeforces profile endpoint (authenticated)
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/codeforces/profile

# Check upcoming contests (authenticated)
curl -H "Authorization: Bearer <TOKEN>" "http://localhost:5000/api/contests/upcoming?limit=5"

# Check linked accounts
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/platforms
```

---

## 5. API ENDPOINTS USED

- GET `/api/auth/me` — returns authenticated user info (requires Bearer token)
- GET `/api/codeforces/profile` — returns CF profile summary for the authenticated user (requires Bearer token)
- GET `/api/contests/upcoming?limit={n}` — returns an ordered list of upcoming contests (requires Bearer token)
- GET `/api/platforms` — returns list of linked platform accounts for the authenticated user (requires Bearer token)
- (Optional) POST `/api/contests/sync` — trigger contest sync (authenticated; for manual refresh)

Response shapes (examples for planning, not implementation):
- /api/auth/me → { success: true, data: { user: { id, email, name, createdAt } } }
- /api/codeforces/profile → { success: true, data: { handle, rating, maxRating, rank, avatar } }
- /api/contests/upcoming → { success: true, data: [ { id, name, startTime, duration, platform, url } ] }
- /api/accounts/linked → { success: true, data: [ { platform, username, linkedAt, status } ] }

---

## 6. COMPONENT STRUCTURE

- Dashboard (page)
  - HeaderInfo (user info, quick actions)
  - CodeforcesCard (profile summary, link to full profile)
  - UpcomingContestsPreview (list of next 3-5 contests)
  - LinkedAccountsSummary (list of linked platforms with connect/manage buttons)

Component responsibilities:
- Each card handles its own loading/error UI
- Dashboard composes the cards and shows a central loading indicator only when initial aggregate load is in progress

---

## 7. DATA FLOW

- On Dashboard mount, components fetch their own data in parallel (or use shared helpers in `frontend/src/utils/api.js`):
  1. GET /api/auth/me (if context doesn't have user)
  2. GET /api/platforms
  3. If user has a linked Codeforces account, GET /api/codeforces/profile
  4. GET /api/contests/upcoming?limit=5
- Components manage their own loading/error states and may call shared api helper methods for consistent error handling and token injection.
- Provide a page-level "Refresh" control that re-requests contests/profile as needed.

Caching & invalidation:
- Short-lived in-memory cache in hook (stale-while-revalidate) is acceptable for MVP
- Contests may be polled on a configurable interval (optional)

---

## 8. LOADING STATES

- Page-level initial load: show centered spinner or skeleton for main layout while isLoading === true
- Card-level loading: each card shows its own skeleton if its piece of data is still loading
- Buttons that trigger actions (e.g., "Refresh contests") show inline spinner and disable while action runs
- Use accessible aria-live regions for status updates

---

## 9. ERROR STATES

- Per-endpoint errors surfaced inside corresponding card with a short message and "Retry" action
- Aggregate failures (most or all calls fail): show a page-level error banner with retry button
- Authentication failure (401 from /me): call logout flow and redirect to /login with message "Session expired"
- Logging: in development console.log errors with endpoint and status; do not log sensitive tokens

---

## 10. MANUAL TESTING CHECKLIST

### 10.1 Access & Routing
- [ ] Authenticated user can navigate to `/dashboard`
- [ ] Unauthenticated user redirected to `/login`

### 10.2 User Info
- [ ] `/api/auth/me` data displays name/email
- [ ] User avatar (if available) shows correctly

### 10.3 Codeforces Profile
- [ ] If user has CF handle, Codeforces card shows handle, rating, maxRating
- [ ] Link to Codeforces profile opens in new tab
- [ ] If CF API fails, show error + retry

### 10.4 Upcoming Contests
- [ ] Upcoming contests list shows at least next 1-5 contests
- [ ] Each contest shows name, start time (local), duration, platform, and link
- [ ] "Refresh contests" re-fetches and updates UI
- [ ] If no upcoming contests: show empty state with explanatory message

### 10.5 Linked Accounts
- [ ] Linked accounts are listed with platform name and username
- [ ] "Manage" or "Connect" buttons present and link to appropriate flows

### 10.6 Loading & Error Flows
- [ ] Simulate slow network: page shows skeletons, cards load progressively
- [ ] Cause endpoint error (e.g., stop backend): per-card error messages appear and retry works
- [ ] Cause 401 from /api/auth/me: user is logged out and redirected to /login with message

### 10.7 Responsive & Accessibility
- [ ] Dashboard responsive on small screens (cards stack)
- [ ] All interactive elements keyboard-accessible
- [ ] ARIA labels provided for main interactive controls

---

## 11. EXPECTED GIT DIFF SUMMARY

### Files Modified / Added

```
 A frontend/src/pages/Dashboard.jsx                     (+~120 lines: page + composition)
 A frontend/src/components/Dashboard/HeaderInfo.jsx    (+~40 lines)
 A frontend/src/components/Dashboard/CodeforcesCard.jsx (+~60 lines)
 A frontend/src/components/Dashboard/UpcomingContestsPreview.jsx (+~90 lines)
 A frontend/src/components/Dashboard/LinkedAccountsSummary.jsx (+~60 lines)
 A frontend/src/hooks/useDashboardData.js               (+~120 lines)
 M frontend/src/App.jsx                                 (~few lines: add /dashboard route)
 M frontend/src/utils/api.js                            (~few lines: expose endpoints)
```

Net lines: ~550 added, small modifications to 2-3 existing files.

---

## 12. IMPLEMENTATION NOTES & PRIORITY

Priority order:
1. Create `useDashboardData` hook and wire basic Dashboard page with skeletons
2. Implement CodeforcesCard and UpcomingContestsPreview with API integration
3. Add LinkedAccountsSummary and HeaderInfo
4. Polish loading/error UI and accessibility
5. Manual test checklist and small polish (timestamps, formatting)

Optional improvements (post-MVP):
- Add caching with localStorage for contests with TTL
- Add E2E tests for main flows
- Add unit tests for hook and components

---

**Document Created**: 2026-06-01
**Status**: Ready for implementation
