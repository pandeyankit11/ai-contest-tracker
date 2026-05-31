# PHASE 2: Frontend Authentication Implementation Plan

**Status**: Planning Phase  
**Target Completion**: Next sprint  
**Scope**: Full auth flow (login, register, token persistence, protected routes)

---

## 1. GOAL

Complete the frontend authentication system by:
- Implementing a fully functional `AuthContext` with login, register, logout, and session persistence
- Building Login and Register pages with form validation and error handling
- Establishing secure token management via localStorage
- Implementing `ProtectedRoute` with proper loading and redirect states
- Creating a Header component with authenticated navigation and logout
- Initializing user session on app load via the `/api/auth/me` endpoint
- Preparing the app for manual and automated testing of auth flows

**Success Criteria**:
- User can register with email/password
- User can log in with valid credentials
- JWT token persists across page refreshes
- Unauthenticated users redirect to login
- Authenticated users see protected routes
- Logout clears session and redirects to login
- All error messages display in UI
- No 404s on auth endpoints

---

## 2. FILES TO MODIFY

| File | Changes | Reason |
|------|---------|--------|
| `frontend/src/App.jsx` | Wrap with `<AuthProvider>` | Enable auth context throughout app |
| `frontend/src/context/AuthContext.jsx` | Implement full context with methods | Provide auth state and actions |
| `frontend/src/components/ProtectedRoute.jsx` | Add loading + loading state handling | Prevent flashing of login during session restore |
| `frontend/src/pages/Login.jsx` | Implement form submission + API call | Handle user login |
| `frontend/src/pages/Register.jsx` | Implement form submission + API call | Handle user registration |
| `frontend/src/utils/api.js` | Implement all HTTP methods with interceptors | Provide centralized API client with token injection |

---

## 3. FILES TO CREATE

| File | Purpose | Dependencies |
|------|---------|--------------|
| `frontend/src/components/Header.jsx` | Navigation bar with user info and logout | `useAuth`, `useNavigate` |
| `frontend/src/hooks/useApi.js` | Custom hook for API requests with error handling | `useAuth` |
| `frontend/src/pages/Dashboard.jsx` | Update with Header and actual layout | `Header`, `useAuth`, `useEffect` |
| `frontend/src/pages/LinkedAccounts.jsx` | Update with Header | `Header` |
| `frontend/src/pages/UpcomingContests.jsx` | Update with Header | `Header` |
| `frontend/src/pages/Register.jsx` | Complete register form implementation | `useAuth`, `useNavigate`, `api` |
| `frontend/.env.local` | Development environment variables | (create locally, don't commit) |

---

## 4. EXACT TERMINAL COMMANDS

### 4.1 Setup

```bash
# Terminal 1: Start backend (from backend directory)
cd backend
npm run dev
# Expected: Server running on http://localhost:5000

# Terminal 2: Start frontend (from frontend directory)
cd frontend
npm install
npm run dev
# Expected: Vite server running on http://localhost:5173
```

### 4.2 Create Environment File

```bash
# In frontend directory
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:5000
EOF
```

### 4.3 Build Verification

```bash
# Frontend build verification
cd frontend
npm run build
# Expected: dist/ folder created, no errors

# Backend health check
curl http://localhost:5000/api/health
# Expected: {"status":"ok","message":"AI Contest Tracker Backend Running"}
```

---

## 5. API ENDPOINTS USED

### 5.1 Authentication Endpoints

| Method | Endpoint | Request Body | Response | Auth Required |
|--------|----------|--------------|----------|---------------|
| POST | `/api/auth/register` | `{email, password}` | `{success, data: {token, user}}` | No |
| POST | `/api/auth/login` | `{email, password}` | `{success, data: {token, user}}` | No |
| GET | `/api/auth/me` | — | `{success, data: {user}}` | Yes (Bearer token) |

### 5.2 Request/Response Format

**Login/Register Response** (on success):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2026-06-01T00:00:00Z"
    }
  }
}
```

**Error Response** (all endpoints):
```json
{
  "success": false,
  "error": "Invalid credentials" or "Email already exists" or "Validation error"
}
```

**Me Endpoint Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2026-06-01T00:00:00Z"
    }
  }
}
```

---

## 6. AUTHCONTEXT DESIGN

### 6.1 State Shape

```javascript
{
  user: {
    id: string,
    email: string,
    createdAt: string,
  } | null,
  token: string | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null,
}
```

### 6.2 Methods Provided

```javascript
// login(email: string, password: string) -> Promise<void>
// - Validates email/password format
// - Calls POST /api/auth/login
// - Stores token in localStorage
// - Updates user state
// - Redirects to /dashboard on success
// - Sets error state on failure

// register(email: string, password: string) -> Promise<void>
// - Validates email/password format
// - Calls POST /api/auth/register
// - Auto-logs in user (stores token + user)
// - Redirects to /dashboard on success
// - Sets error state on failure

// logout() -> void
// - Clears token from localStorage
// - Clears user from state
// - Sets isAuthenticated to false
// - Redirects to /login

// initializeAuth() -> Promise<void>
// - Called on app load
// - Checks localStorage for token
// - If token exists, calls GET /api/auth/me to restore user
// - Sets isAuthenticated based on token validity
// - Handles expired tokens (clear state, redirect to login)
// - Called from useEffect in AuthProvider

// clearError() -> void
// - Sets error state to null
// - Used after user reads error message
```

### 6.3 Implementation Hooks

- `useEffect` on AuthProvider mount: call `initializeAuth()`
- Token should be validated on every route change (ProtectedRoute)
- Error messages auto-clear after 5 seconds or on form resubmission

---

## 7. LOCALSTORAGE STRATEGY

### 7.1 Key Storage

| Key | Value | TTL | Purpose |
|-----|-------|-----|---------|
| `authToken` | JWT string | Session | Sent in Authorization header for protected endpoints |
| `authUser` | JSON stringified user object | Session | Display user email in header, skip /me call if not stale |

### 7.2 Implementation Details

```javascript
// Helpers in AuthContext or separate utility file

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

// Save token
localStorage.setItem(TOKEN_KEY, token);
localStorage.setItem(USER_KEY, JSON.stringify(user));

// Retrieve token
const token = localStorage.getItem(TOKEN_KEY);

// Clear on logout
localStorage.removeItem(TOKEN_KEY);
localStorage.removeItem(USER_KEY);
```

### 7.3 Security Considerations

- JWT stored in localStorage (XSS risk if app is compromised, but acceptable for MVP)
- No sensitive data beyond JWT in localStorage
- Token sent only to backend API (HTTPS in production)
- Clear on logout and on 401 responses
- Consider httpOnly cookies for production (requires backend CSRF changes)

---

## 8. PROTECTEDROUTE BEHAVIOR

### 8.1 Route Guard Logic

```
Request protected route
  ↓
Check isLoading state
  ├─ If true: Render <Loading /> (or empty div)
  │  (User sees loading state while /me endpoint is called)
  │
  ├─ If false:
  │   ├─ isAuthenticated === true:
  │   │   └─ Render <children /> (the protected component)
  │   │
  │   └─ isAuthenticated === false:
  │       └─ <Navigate to="/login" replace />
```

### 8.2 Loading State Flow

1. App mounts → `isLoading = true`
2. AuthProvider calls `initializeAuth()`
3. If token in localStorage:
   - Calls GET `/api/auth/me`
   - Updates user state
   - Sets `isLoading = false`
   - Redirects to dashboard if on `/login` or `/register`
4. If no token:
   - Sets `isAuthenticated = false`
   - Sets `isLoading = false`
   - User stays on `/login`

### 8.3 Redirect Behavior

| Condition | Action |
|-----------|--------|
| Accessing `/login` + authenticated | Redirect to `/dashboard` |
| Accessing protected route + not authenticated | Redirect to `/login` |
| Token expires (401 from API) | Clear token, redirect to `/login` |
| Token invalid in localStorage | Clear token, redirect to `/login` |

---

## 9. LOGIN PAGE FLOW

### 9.1 User Interaction Flow

```
User lands on /login
  ↓
See login form (email, password inputs, submit button, register link)
  ↓
User fills form + clicks "Login"
  ↓
Form validation (email format, password length)
  ├─ If validation fails: Show error message inline
  │
  └─ If validation passes:
    ├─ Disable submit button (show loading state)
    ├─ Call authContext.login(email, password)
    │
    ├─ Backend response:
    │   ├─ 200 Success:
    │   │   ├─ Token saved to localStorage
    │   │   ├─ User saved to context
    │   │   ├─ Navigate to /dashboard
    │   │
    │   └─ 401/400 Error:
    │       ├─ Display error message ("Invalid email/password")
    │       ├─ Clear password field
    │       ├─ Re-enable submit button
```

### 9.2 Form Fields

| Field | Type | Validation | Error Message |
|-------|------|-----------|----------------|
| Email | text | Required, valid email format | "Please enter a valid email" |
| Password | password | Required, min 6 chars | "Password must be at least 6 characters" |

### 9.3 UI States

- **Idle**: Form visible, button enabled
- **Loading**: Button shows spinner, inputs disabled
- **Error**: Error message shown below form (red text), button re-enabled
- **Success**: Redirect happens (no UI change needed)

### 9.4 Keyboard Navigation

- Tab through email → password → submit button
- Enter key on password field submits form
- Esc key clears error message

---

## 10. REGISTER PAGE FLOW

### 10.1 User Interaction Flow

```
User lands on /register
  ↓
See register form (email, password, confirm password, submit button, login link)
  ↓
User fills form + clicks "Register"
  ↓
Form validation:
  ├─ Email format valid
  ├─ Password length >= 6
  ├─ Passwords match
  ├─ Passwords not empty
  │
  ├─ If validation fails: Show error message inline for first invalid field
  │
  └─ If validation passes:
    ├─ Disable submit button
    ├─ Call authContext.register(email, password)
    │
    ├─ Backend response:
    │   ├─ 201 Success (user created + auto-logged in):
    │   │   ├─ Token saved to localStorage
    │   │   ├─ User saved to context
    │   │   ├─ Navigate to /dashboard
    │   │
    │   └─ 400 Error (email exists or validation):
    │       ├─ Display error message ("Email already exists")
    │       ├─ Re-enable submit button
    │       ├─ Keep form filled (user can modify)
```

### 10.2 Form Fields

| Field | Type | Validation | Error Message |
|-------|------|-----------|----------------|
| Email | text | Required, valid email, unique (backend check) | "Please enter a valid email" / "Email already exists" |
| Password | password | Required, min 6 chars | "Password must be at least 6 characters" |
| Confirm Password | password | Required, must match password | "Passwords do not match" |

### 10.3 UI States

- **Idle**: Form visible, button enabled
- **Loading**: Button shows spinner, inputs disabled
- **Error**: Error message shown above form (red text), button re-enabled
- **Success**: Auto-logs in and redirects (no UI change needed)

### 10.4 Real-Time Validation

- Show password strength indicator as user types (optional, nice-to-have)
- Show "Passwords match" checkmark once fields match
- Email format validation on blur (not on change to avoid flashing errors)

---

## 11. ERROR HANDLING

### 11.1 Error Types and Messages

| Error Type | API Response | Display Message | Action |
|------------|--------------|-----------------|--------|
| Invalid credentials | 401 Unauthorized | "Invalid email or password" | Clear password field, keep email |
| Email already exists | 400 Bad Request | "Email already in use. Try logging in instead." | Link to login page |
| Network error | No response | "Network error. Please check your connection." | Retry button |
| Server error | 500 Server Error | "Server error. Please try again later." | Retry button |
| Validation error (backend) | 400 Bad Request | Show specific error from API | Keep form filled |
| Token expired | 401 (from /me) | Silently redirect to /login, show message on login page | User sees "Session expired, please log in again" |
| Token invalid (malformed) | Handle in AuthProvider | Silently clear and redirect | User on login page |

### 11.2 Error Display

- **Form-level errors**: Below form, red text, 5-second auto-dismiss
- **Network errors**: Persistent, user must close manually
- **401 on /me**: Silent logout, message on login page
- **Field-level errors**: Below input field, on blur validation

### 11.3 Error Recovery

```javascript
// In api.js
fetch(url, { headers })
  .then(res => {
    if (res.status === 401) {
      // Call logout from context
      // Clear token from localStorage
      // Redirect to /login
    }
    return res.json();
  })
  .catch(err => {
    // Network error, return error object
    return { error: err.message };
  });
```

### 11.4 Logging

- Log all auth errors to console in development
- Include timestamp, endpoint, status code, error message
- Never log passwords or tokens

---

## 12. MANUAL TESTING CHECKLIST

### 12.1 Registration Flow

- [ ] Navigate to `/register`
- [ ] Try submitting empty form → see validation errors
- [ ] Try password shorter than 6 chars → see error
- [ ] Try mismatched passwords → see error
- [ ] Try invalid email → see error
- [ ] Register with valid data → redirected to `/dashboard`
- [ ] Check localStorage has `authToken` and `authUser`
- [ ] Refresh page → still logged in, `/dashboard` visible
- [ ] Try registering with same email → see "Email already exists" error
- [ ] Can still log in with newly created account

### 12.2 Login Flow

- [ ] Navigate to `/login`
- [ ] Try submitting empty form → see validation errors
- [ ] Try invalid email → see error
- [ ] Try wrong password → see "Invalid email or password"
- [ ] Log in with valid credentials → redirected to `/dashboard`
- [ ] Check localStorage has `authToken` and `authUser`
- [ ] Refresh page → still logged in, `/dashboard` visible
- [ ] Check Header shows user email

### 12.3 Protected Routes

- [ ] Clear localStorage manually
- [ ] Try accessing `/dashboard` → redirected to `/login`
- [ ] Try accessing `/accounts` → redirected to `/login`
- [ ] Try accessing `/contests` → redirected to `/login`
- [ ] Log in → access `/dashboard` successfully
- [ ] Navigate between `/accounts`, `/contests`, `/dashboard` → all load
- [ ] Loading state appears briefly on page refresh (shows "Loading...")

### 12.4 Logout Flow

- [ ] Logged in on `/dashboard`
- [ ] Click logout in Header
- [ ] Redirected to `/login`
- [ ] Check localStorage cleared (no `authToken`, no `authUser`)
- [ ] Try going back (browser back button) → still on `/login` (can't access `/dashboard`)
- [ ] Can log in again successfully

### 12.5 Session Persistence

- [ ] Log in → check localStorage
- [ ] Copy `authToken` value
- [ ] Refresh page → still logged in (calls `/me` with token)
- [ ] Open DevTools Network tab → see GET `/api/auth/me` request with Bearer token
- [ ] Close and reopen browser → still logged in
- [ ] Manually delete `authToken` from localStorage → refresh → redirected to `/login`

### 12.6 Token Expiration (Manual)

- [ ] Log in successfully
- [ ] Wait 5+ seconds (or set short JWT expiry in backend for testing)
- [ ] Try accessing a page → see loading state briefly
- [ ] If token expired: see error message, redirected to `/login`

### 12.7 Error Messages

- [ ] Network down (disconnect WiFi) → see network error message
- [ ] Backend down → see server error message
- [ ] Try submitting form twice quickly → no duplicate submissions (button disabled)

### 12.8 Form UX

- [ ] Focus order: email → password → submit button
- [ ] Tab navigation works
- [ ] Enter key on password submits form
- [ ] Password field masks characters
- [ ] Links to register/login pages work
- [ ] Responsive on mobile (form fits screen)

---

## 13. BUILD VERIFICATION COMMANDS

### 13.1 Development Mode

```bash
# Terminal 1: Backend
cd backend
npm run dev
# Expected output: "Server listening on port 5000"

# Terminal 2: Frontend
cd frontend
npm run dev
# Expected output: "VITE v[version] ready in [time] ms"
# URL: http://localhost:5173
```

### 13.2 Production Build

```bash
# Build frontend
cd frontend
npm run build
# Expected: dist/ folder with index.html, assets/

# Check build output
ls -lh dist/
# Expected: dist/index.html (small, ~5-10KB)

# Test build locally
npm run preview
# Access http://localhost:4173
```

### 13.3 API Validation

```bash
# Test auth endpoints
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Expected: {"success":true,"data":{"token":"...","user":{...}}}

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Expected: {"success":true,"data":{"token":"...","user":{...}}}

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
# Expected: {"success":true,"data":{"user":{...}}}
```

### 13.4 Browser Console Check

- Open DevTools Console (F12)
- Perform login flow
- Expected: No errors, no 404s
- Network tab: POST /api/auth/login → 200, GET /api/auth/me → 200
- Application tab: localStorage has `authToken` and `authUser`

### 13.5 Linting

```bash
# Frontend lint check
cd frontend
npm run lint
# Expected: 0 errors (warnings OK)
```

---

## 14. EXPECTED GIT DIFF SUMMARY

### 14.1 Files Modified

```
 M frontend/src/App.jsx                    (+5 lines: wrap AuthProvider)
 M frontend/src/context/AuthContext.jsx    (+80 lines: full implementation)
 M frontend/src/components/ProtectedRoute.jsx (+20 lines: complete logic)
 M frontend/src/pages/Login.jsx            (+40 lines: form + API integration)
 M frontend/src/pages/Register.jsx         (+50 lines: form + API integration)
 M frontend/src/utils/api.js               (+80 lines: HTTP client + interceptors)
```

### 14.2 Files Created

```
 A frontend/src/components/Header.jsx      (+50 lines: nav + logout)
 A frontend/src/hooks/useApi.js            (+30 lines: custom hook)
 A frontend/.env.local                     (3 lines: local config, .gitignored)
```

### 14.3 Changes per File

#### App.jsx
```diff
+ import { AuthProvider } from './context/AuthContext';

  function App() {
    return (
+     <AuthProvider>
        <Router>
          ...routing...
        </Router>
+     </AuthProvider>
    );
  }
```

#### AuthContext.jsx
```diff
+ Add: login(email, password) method
+ Add: register(email, password) method
+ Add: logout() method
+ Add: initializeAuth() method
+ Add: clearError() method
+ Add: useEffect for initializeAuth on mount
+ Add: localStorage helpers (saveToken, getToken, clearToken)
~ Change: State now includes token, error, and methods
```

#### ProtectedRoute.jsx
```diff
~ Update: Add proper loading state check
~ Update: Show loading spinner while checking auth
~ Update: Add redirect logic for authenticated users on /login
```

#### Login.jsx
```diff
~ Implement: handleSubmit to call authContext.login()
~ Add: Error message display
~ Add: Loading state on button
~ Add: Link to register page
+ Add: Email/password validation
```

#### Register.jsx
```diff
~ Implement: handleSubmit to call authContext.register()
~ Add: Confirm password field
~ Add: Password matching validation
~ Add: Error message display
~ Add: Link to login page
+ Add: Form validation (email, password, confirm)
```

#### api.js
```diff
+ Implement: get(endpoint, options) with token injection
+ Implement: post(endpoint, data, options) with token injection
+ Implement: put(endpoint, data, options) with token injection
+ Implement: delete(endpoint, options) with token injection
+ Add: Token retrieval from localStorage
+ Add: Authorization header injection
+ Add: Error handling (401, network, server)
+ Add: Response unwrapping
```

#### Header.jsx (NEW)
```
+ Create: Navigation component
+ Display: User email
+ Button: Logout (calls authContext.logout)
+ Links: Dashboard, Accounts, Contests
```

#### useApi.js (NEW)
```
+ Create: Custom hook for making API requests
+ Handle: Error states
+ Handle: Loading states
+ Return: { data, error, isLoading, retry }
```

### 14.4 Summary Statistics

```
Files modified: 6
Files created: 3
Total lines added: ~350
Total lines removed: ~30 (mostly TODO comments)
Net change: +320 lines
```

---

## 15. IMPLEMENTATION ORDER

### Phase 2.1: API Layer (Day 1)
1. Implement `api.js` with all HTTP methods
2. Add token injection in headers
3. Add error handling (401, network, server)
4. Test with Postman or curl

### Phase 2.2: Context Layer (Day 1)
1. Implement `AuthContext` full state
2. Add `login()`, `register()`, `logout()`, `initializeAuth()` methods
3. Add localStorage helpers
4. Add useEffect for session restore on app load

### Phase 2.3: Routing & Protection (Day 2)
1. Update `ProtectedRoute` with complete logic
2. Update `App.jsx` to wrap with `AuthProvider`
3. Test redirect flows

### Phase 2.4: UI Layer (Day 2)
1. Implement `Login.jsx` form + API integration
2. Implement `Register.jsx` form + API integration
3. Create `Header.jsx` component
4. Update `Dashboard.jsx`, `LinkedAccounts.jsx`, `UpcomingContests.jsx` to include Header

### Phase 2.5: Testing & Polish (Day 3)
1. Run through manual testing checklist
2. Test error scenarios
3. Verify localStorage persistence
4. Check mobile responsiveness
5. Build verification

---

## 16. DEPENDENCIES & ASSUMPTIONS

### 16.1 Backend Assumptions

- Backend is running on `http://localhost:5000`
- `/api/auth/register` returns `{ success, data: { token, user } }` on 201
- `/api/auth/login` returns `{ success, data: { token, user } }` on 200
- `/api/auth/me` returns `{ success, data: { user } }` on 200
- Token is JWT, can be stored in localStorage
- All errors return JSON with `success: false` and `error` field
- CORS is enabled on backend

### 16.2 Frontend Assumptions

- React 19.2.6+, React Router 7.16.0+ available
- Vite is used for bundling
- localStorage is available (no incognito/private mode handling)
- No TypeScript (using JSX only)

### 16.3 Browser Assumptions

- localStorage API available
- Fetch API available (no IE11 support needed)
- ES6+ features supported

---

## 17. ROLLBACK STRATEGY

If Phase 2 needs to be rolled back:

```bash
# Reset to Phase 1 (scaffold complete)
git reset --hard <commit-before-phase-2>

# Or, selectively undo auth changes
git checkout HEAD~N -- frontend/src/App.jsx frontend/src/context/AuthContext.jsx
```

No database migrations needed (auth endpoints already exist in backend).

---

## 18. NEXT PHASES (POST-MVP)

After Phase 2 is complete:

- **Phase 3**: Implement Dashboard, LinkedAccounts, UpcomingContests pages
- **Phase 4**: Add TypeScript for type safety
- **Phase 5**: Add unit tests with Vitest/Jest
- **Phase 6**: Add E2E tests with Cypress or Playwright
- **Phase 7**: Migrate to httpOnly cookies + CSRF tokens

---

**Document Created**: 2026-06-01  
**Status**: Ready for implementation  
**Reviewer**: —
