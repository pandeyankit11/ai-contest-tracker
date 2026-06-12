# AI Contest Tracker v2.1 🚀

A unified, full-stack dashboard designed to track competitive programming performances, analyze problem-solving trends, and monitor upcoming competitions across platforms like Codeforces and LeetCode.

[![Live Demo](https://img.shields.io/badge/Live_Demo-ai--contest--tracker.vercel.app-blue?style=for-the-badge)](https://ai-contest-tracker.vercel.app)

## 💡 Project Philosophy
* **Real Users First:** Delivering core value to real users is more important than rushing AI features.
* **Data Over Hype:** Public launch is gated behind robust, actionable analytics. 
* **Earned Intelligence:** AI features will only be introduced once a solid foundation of active users and reliable data is established.

## 🌟 Overview
Managing profiles across multiple coding platforms can be fragmented. AI Contest Tracker centralizes your competitive programming journey by pulling data from Codeforces and LeetCode into a single, comprehensive dashboard. Whether you are tracking your rating progression, analyzing your strongest topics, or planning for upcoming contests, this tool provides the intelligence you need to improve.

## 🛠️ Current State & Tech Stack
The project is currently deployed and functional with the following architecture:
* **Frontend:** React.js (Deployed via Vercel)
* **Backend:** Node.js / Express.js (Deployed via Render)
* **Database:** PostgreSQL hosted on Neon DB
* **ORM:** Prisma
* **Authentication:** Fully custom JWT-based authentication

## ✨ Features (v2.0 & v2.1)
* **Contest Aggregation:** Centralized browser to discover upcoming contests with advanced filters (platform, time range).
* **Secure Multi-Account Linking:** Securely link and manage multiple platform handles under a single authenticated user session.
* **Deep Analytics Engine:** * Granular topic analysis and solved-problem trend charts.
  * Difficulty progression tracking with visual difficulty bars and water-filled progress circles.
  * Rating history graphs to track Elo changes over time.
* **Activity Heatmaps:** GitHub-style contribution graphs for both Codeforces and LeetCode.
* **Unified Dashboard:** Get a bird's-eye view of your current ratings, maximum ratings, active ranks, and upcoming events.

## 🚀 Local Setup & Installation

### Prerequisites
* Node.js (v16+)
* PostgreSQL instance (Local or Cloud like Neon/Supabase)

### 1. Clone the repository
    git clone https://github.com/pandeyankit11/ai-contest-tracker
    cd ai-contest-tracker

### 2. Install Dependencies
    # Install backend dependencies
    cd backend
    npm install

    # Install frontend dependencies
    cd ../frontend
    npm install

### 3. Environment Variables
Create a .env file in the backend directory. Use .env.example as a template:

    DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require"
    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRES_IN=7d
    NODE_ENV=development

### 4. Database Setup (Prisma)
Run the following commands in the backend directory:

    npx prisma db push
    npx prisma generate

### 5. Run the Application
Start both development servers:

    # In the backend directory
    npm run dev

    # In the frontend directory
    npm run dev

## 🗺️ Master Roadmap

### ✅ Phase 1: Core Dashboard (V2.0 & V2.1)
- [x] Authentication complete (JWT, Sessions)
- [x] React frontend deployed
- [x] Express backend deployed
- [x] PostgreSQL + Prisma + Neon DB configured
- [x] Contest Aggregation & Upcoming Contests Browser
- [x] Rating Analytics & Graphs
- [x] Problems Solved Analytics & Solved Trends
- [x] Activity Heatmaps
- [x] Difficulty Progress Bars & Water-filled Progress Circles
- [ ] Contest Calendar *(In Progress)*

**🚀 PUBLIC LAUNCH PLANNED UPON COMPLETION OF V2.1**

### ⏳ Phase 2: Social & Community (V2.2)
- [ ] Friends System & Friend Requests
- [ ] Profile Comparisons
- [ ] Friend Leaderboards
- [ ] College / University Leaderboards

### 🤖 Phase 3: Artificial Intelligence (V3.0)
- [ ] AI Contest Coach
- [ ] AI Weakness Detection
- [ ] Personalized AI Recommendations
- [ ] Automated AI Study Plans

### 🏆 Phase 4: Gamification (V4.0)
- [ ] Daily/Weekly Streaks
- [ ] Achievement Badges
- [ ] Custom Challenges
- [ ] Team Competitions

## 👨‍💻 Author
**Ankit Pandey**
* Email: pandeyankit9a@gmail.com
* GitHub: [@pandeyankit11](https://github.com/pandeyankit11)