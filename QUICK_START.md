# Quick Start Guide - Day 1

## What to Do First (Next 2 Hours)

### 1. Create Project Structure
```bash
cd ~/Documents
mkdir ai-contest-tracker
cd ai-contest-tracker
git init

# Backend
mkdir backend
cd backend
npm init -y
npm install express cors dotenv jsonwebtoken bcrypt @prisma/client
npm install --save-dev nodemon prisma
cd ..

# Frontend
npm create vite@latest frontend -- --template react
cd frontend
npm install react-router-dom recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
cd ..
```

### 2. Set Up Environment Files

**backend/.env**
```
DATABASE_URL="postgresql://user:password@localhost:5432/ai_contest_tracker"
JWT_SECRET="your-super-secret-key-change-this"
PORT=5000
CLAUDE_API_KEY="sk-your-claude-api-key"
```

**frontend/.env**
```
VITE_API_URL="http://localhost:5000"
```

### 3. Prisma Setup

**backend/prisma/schema.prisma**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    String     @id @default(cuid())
  email String     @unique
  password String
  createdAt DateTime @default(now())
}
```

Then run:
```bash
cd backend
npx prisma migrate dev --name init
```

### 4. Backend Entry Point

**backend/src/server.js**
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**backend/package.json** (add script):
```json
"scripts": {
  "dev": "nodemon src/server.js",
  "start": "node src/server.js"
}
```

Run: `npm run dev`

### 5. Frontend Entry Point

**frontend/src/App.jsx**
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**frontend/src/pages/Login.jsx**
```jsx
export default function Login() {
  return <div>Login page - coming soon</div>;
}
```

**frontend/src/pages/Dashboard.jsx**
```jsx
export default function Dashboard() {
  return <div>Dashboard - coming soon</div>;
}
```

**frontend/src/index.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Run: `npm run dev`

### 6. Verify It Works

- Backend: `curl http://localhost:5000/api/health` → should return `{ status: 'ok' }`
- Frontend: Visit `http://localhost:5173` → should see login page placeholder

**You're done with Day 1.** Commit to git:
```bash
git add .
git commit -m "Initial project setup"
```

## Next: Build Authentication (Days 2-4)

See MVP_FAMILIAR_STACK.md section 7 for detailed steps.
