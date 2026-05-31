

## Frontend Architecture Plan

I've reviewed the backend and project structure. Here's the MVP frontend plan for React + Vite.

---

### 1. FOLDER STRUCTURE

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── LinkedAccounts.jsx
│   │   └── UpcomingContests.jsx
│   │
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.jsx (nav, logout)
│   │   │   ├── Sidebar.jsx (optional, collapsible nav)
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── Forms/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── LinkAccountForm.jsx
│   │   │
│   │   ├── Contests/
│   │   │   └── ContestCard.jsx
│   │   │
│   │   └── Common/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       └── ErrorAlert.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js (auth context)
│   │   ├── useApi.js (API calls wrapper)
│   │   └── useLocalStorage.js (persist auth token)
│   │
│   ├── services/
│   │   └── api.js (API client with axios-like setup)
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── App.jsx
│   ├── index.css (TailwindCSS)
│   └── main.jsx
│
├── .env.example
├── vite.config.js
└── package.json
```

---

### 2. COMPONENTS BREAKDOWN

#### Pages
| Page | Purpose | Dependencies |
|------|---------|--------------|
| `Login` | Email/password login | LoginForm, useAuth |
| `Register` | Email/password registration | RegisterForm, useAuth |
| `Dashboard` | User overview, Codeforces profile, recent contests | Header, ContestCard, useAuth |
| `LinkedAccounts` | Connect/disconnect Codeforces & LeetCode | LinkAccountForm, Header |
| `UpcomingContests` | Paginated list of upcoming contests | ContestCard, pagination controls, Header |

#### Reusable Components
- **Header**: Logo, user name, logout button, nav links
- **ProtectedRoute**: Wrapper for authenticated routes
- **LoginForm**: Email, password inputs + submit
- **RegisterForm**: Email, password, confirm password + validation
- **LinkAccountForm**: Platform dropdown, username input
- **ContestCard**: Contest name, platform, date, time, link
- **Button, Input, ErrorAlert**: Shared form elements

---

### 3. API INTEGRATION STRATEGY

**Approach**: Simple fetch wrapper (no external HTTP library for MVP)

**api.js** handles:
- Base URL config from env
- Token management (read from localStorage)
- Request interceptor (add `Authorization` header)
- Response wrapper (unwrap `{ success, data, error }`)
- Error handling (return error object or throw)

```javascript
// api.js pseudo-structure
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('authToken');
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const json = await response.json();
  
  if (!response.ok) {
    throw json.error || new Error('Request failed');
  }
  
  return json.data;
}

export const authAPI = {
  register: (email, password) => request('/api/auth/register', {...}),
  login: (email, password) => request('/api/auth/login', {...}),
  me: () => request('/api/auth/me'),
};

export const platformAPI = {
  list: () => request('/api/platforms'),
  create: (platform, username) => request('/api/platforms', {...}),
  delete: (id) => request(`/api/platforms/${id}`, {...}),
};

export const codeforcesAPI = {
  getProfile: () => request('/api/codeforces/profile'),
};

export const contestAPI = {
  upcoming: (page, limit, days, platform) => 
    request(`/api/contests/upcoming?page=${page}&limit=${limit}&days=${days}&platform=${platform}`),
};
```

---

### 4. STATE MANAGEMENT APPROACH

**Use React Context API** (no Redux for MVP):

**AuthContext** stores:
- `user` (id, email)
- `token` (JWT)
- `isLoading`
- `error`

**Methods**:
- `login(email, password)` → store token + user, redirect to dashboard
- `register(email, password)` → call API, auto-login
- `logout()` → clear token, redirect to login
- `me()` → fetch user from `/api/auth/me` on app load

**Implementation**:
- Persist token in localStorage
- Wrap App with `<AuthProvider>`
- `useAuth()` hook for components to access auth state

**Note**: No global contests state—fetch on-demand per page. Per-page loading prevents stale data issues.

---

### 5. ROUTING PLAN

```javascript
// App.jsx
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<LinkedAccounts />} />
            <Route path="/contests" element={<UpcomingContests />} />
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

**Navigation Flow**:
- No token → redirect to `/login`
- After login → redirect to `/dashboard`
- Header shows links: Dashboard | Accounts | Contests | Logout
- Invalid routes → 404 page

---

### 6. DATA FLOW EXAMPLE: Login Page

```
User fills form
    ↓
LoginForm.jsx: onSubmit → calls authAPI.login(email, password)
    ↓
AuthContext.login() updates context state
    ↓
Token saved to localStorage
    ↓
Navigate to /dashboard
    ↓
Dashboard.jsx: useEffect(() => { codeforcesAPI.getProfile() })
    ↓
Render user data
```

---

### 7. KEY MVP DECISIONS

| Decision | Rationale |
|----------|-----------|
| No Redux | Context API sufficient for auth state |
| No TanStack Query | Per-page fetch is simple enough |
| No component lib | TailwindCSS + basic components faster to own |
| Fetch API | No extra dependency, built-in |
| localStorage | Simplest token persistence |
| No TS yet | Faster iteration, add after MVP |
| Single AuthContext | All auth flows in one provider |

---

### 8. ENVIRONMENT FILE

**frontend/.env**
```
VITE_API_URL=http://localhost:5000
```

**frontend/.env.production**
```
VITE_API_URL=https://api.domain.com
```

---

**This plan is production-ready for MVP scope.** No over-engineering, every file has a clear purpose. Ready to implement?