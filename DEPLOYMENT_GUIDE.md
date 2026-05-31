# AI Contest Tracker - Deployment Guide

Complete guide for deploying the AI Contest Tracker application using Vercel (Frontend), Render (Backend), and PostgreSQL (Database).

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup (PostgreSQL)](#database-setup-postgresql)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Environment Variables](#environment-variables)
6. [Prisma Migrations](#prisma-migrations)
7. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- GitHub account (for repository access)
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- PostgreSQL database (Render, AWS RDS, or similar)
- Node.js v18+ installed locally

---

## Database Setup (PostgreSQL)

### Option 1: Render PostgreSQL

1. **Create Database on Render**
   - Log in to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "PostgreSQL"
   - Configure:
     - **Name**: `ai-contest-tracker-db`
     - **Database**: `ai_contest_tracker`
     - **User**: `postgres`
     - **Region**: Choose closest to your backend
     - **Version**: PostgreSQL 15+
   - Click "Create Database"

2. **Retrieve Connection String**
   - After creation, click on the database
   - Copy the "External Database URL" (looks like: `postgresql://user:password@host:port/database`)
   - Save this as your `DATABASE_URL`

### Option 2: AWS RDS (Alternative)

1. Create RDS PostgreSQL instance
2. Set publicly accessible to allow Render connection
3. Create database named `ai_contest_tracker`
4. Get connection string: `postgresql://username:password@host:5432/ai_contest_tracker`

---

## Backend Deployment (Render)

### Step 1: Prepare Backend for Deployment

1. **Update package.json build script** (if needed)
   ```json
   {
     "scripts": {
       "build": "prisma generate",
       "start": "node src/server.js"
     }
   }
   ```

2. **Create `.env.production`** (for reference only)
   - Don't commit this file
   - Render will inject env vars from dashboard

3. **Commit and push to GitHub**
   ```bash
   cd backend
   git add -A
   git commit -m "Prepare backend for Render deployment"
   git push origin master
   ```

### Step 2: Deploy to Render

1. **Log in to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing this project
   - Authorize Render to access your GitHub

3. **Configure Service**
   - **Name**: `ai-contest-tracker-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend/`
   - **Plan**: Free (or Pro for production)

4. **Set Environment Variables**
   - Scroll to "Environment" section
   - Click "Add Environment Variable" and add:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | `postgresql://user:password@host:port/db` |
   | `PORT` | `5000` |
   | `JWT_SECRET` | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `BCRYPT_SALT_ROUNDS` | `12` |
   | `NODE_ENV` | `production` |

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Wait for deployment to complete (5-10 minutes)
   - Note your service URL (e.g., `https://ai-contest-tracker-backend.onrender.com`)

### Step 3: Verify Backend Deployment

```bash
# Test health endpoint
curl https://ai-contest-tracker-backend.onrender.com/health

# Check logs in Render dashboard
# Settings → Logs
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Deployment

1. **Create `.env.production`** in `frontend/`
   ```
   VITE_API_URL=https://ai-contest-tracker-backend.onrender.com
   ```

2. **Update API configuration** in your React code
   ```javascript
   // src/config.js or similar
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   export default API_URL;
   ```

3. **Commit and push**
   ```bash
   cd frontend
   git add -A
   git commit -m "Prepare frontend for Vercel deployment"
   git push origin master
   ```

### Step 2: Deploy to Vercel

1. **Log in to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Authorize Vercel

3. **Configure Project**
   - **Project Name**: `ai-contest-tracker`
   - **Framework**: `Vite`
   - **Root Directory**: `frontend/`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Set Environment Variables**
   - Under "Environment Variables":
   
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://ai-contest-tracker-backend.onrender.com` |

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy (2-3 minutes)
   - Access at: `https://ai-contest-tracker.vercel.app` (or custom domain)

### Step 3: Configure Backend CORS

Update backend `src/server.js` to allow Vercel frontend:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://ai-contest-tracker.vercel.app',
    'http://localhost:5173' // Local development
  ],
  credentials: true
}));
```

Redeploy backend after this change.

---

## Environment Variables

### Backend Environment Variables

**Required:**
```env
DATABASE_URL=postgresql://user:password@host:5432/ai_contest_tracker
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

**Optional:**
```env
PORT=5000
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
LOG_LEVEL=info
```

### Frontend Environment Variables

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

### Generate Secure JWT_SECRET

```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32
```

---

## Prisma Migrations

### Initial Setup

1. **Generate Prisma Client**
   ```bash
   cd backend
   npx prisma generate
   ```

2. **Create Initial Migration**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Verify Schema**
   ```bash
   npx prisma studio  # Opens interactive UI
   ```

### Deploying Migrations

#### Automated (Recommended)

Add migration command to Render deployment:
1. Go to Render dashboard
2. Settings → Build & Deploy
3. Pre-deployment command: `cd backend && npx prisma migrate deploy`

#### Manual Migration

If automated doesn't work:

```bash
# Locally
cd backend
npx prisma migrate deploy --skip-generate

# Then deploy code
```

### Common Migration Scenarios

**Creating a New Migration:**
```bash
# After schema changes
npx prisma migrate dev --name describe_changes
```

**Resetting Database (Development Only):**
```bash
npx prisma migrate reset
```

**Checking Migration Status:**
```bash
npx prisma migrate status
```

---

## Common Issues & Troubleshooting

### 1. Database Connection Failed

**Error**: `P1000: Authentication failed`

**Solutions**:
- Verify `DATABASE_URL` is correct in Render environment variables
- Check PostgreSQL user/password
- Ensure Render Web Service can access database (same region if possible)
- Whitelist Render IP in database firewall

**Test Connection**:
```bash
# From backend directory
npx prisma db push --skip-generate
```

### 2. CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solutions**:
- Update backend CORS configuration with Vercel URL
- Redeploy backend
- Check frontend is using correct `VITE_API_URL`

**Verify**:
```bash
curl -H "Origin: https://your-vercel-url.vercel.app" \
  https://your-backend.onrender.com/api/endpoint
```

### 3. Prisma Client Not Found

**Error**: `Cannot find module '@prisma/client'`

**Solutions**:
- Ensure Render build command includes: `npm install && npm run build`
- Rebuild: Go to Render dashboard → Manual Deploy → Click deploy
- Check node_modules are not in `.gitignore`

### 4. Backend Cold Start Delays

**Issue**: First request takes 10+ seconds

**Normal**: Free tier on Render spins down after 15 minutes
**Solution**: Upgrade to Render Pro, or monitor and warm up regularly

**Keep Alive Script**:
```bash
# Add to cron job (every 14 minutes)
curl https://your-backend.onrender.com/health
```

### 5. Environment Variables Not Loaded

**Error**: `JWT_SECRET is undefined`

**Solutions**:
- Refresh Render deployment (manual redeploy)
- Verify variable names match exactly (case-sensitive)
- Check `node_modules` exists post-deployment

### 6. Vercel Build Fails

**Error**: `Build failed: Command 'npm run build' exited with 1`

**Solutions**:
- Check build logs in Vercel dashboard
- Ensure `VITE_API_URL` is set in environment variables
- Verify all imports resolve correctly
- Test build locally: `npm run build`

### 7. Render Free Tier Spin-Down

**Issue**: Backend goes offline after 15 minutes inactivity

**Symptoms**:
- First request after inactivity takes 10-30 seconds
- Subsequent requests are fast

**Solutions**:
1. Upgrade to Render Pro ($7/month)
2. Set up keep-alive monitoring:
   ```bash
   # Use Uptime Robot (free) to ping every 10 minutes
   ```

### 8. Database Locked During Migration

**Error**: `Database is locked`

**Solutions**:
- Cancel any other running migrations in Render logs
- Wait 5 minutes and retry
- For persistent issue, reset database and re-migrate

---

## Deployment Checklist

- [ ] PostgreSQL database created and accessible
- [ ] `DATABASE_URL` tested and working
- [ ] `JWT_SECRET` generated and stored securely
- [ ] Backend deployed to Render
- [ ] Backend environment variables configured
- [ ] Backend `/health` endpoint responds
- [ ] Frontend environment variables set
- [ ] Frontend `VITE_API_URL` points to backend
- [ ] Frontend deployed to Vercel
- [ ] CORS configured for Vercel URL
- [ ] Database migrations ran successfully
- [ ] All endpoints tested from frontend
- [ ] Error logging configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificates auto-renewed (default on both platforms)

---

## Monitoring & Logs

### Render Backend Logs
```
Dashboard → Your Service → Logs
Real-time streaming of backend logs
```

### Vercel Frontend Logs
```
Dashboard → Your Project → Deployments → Select Deployment → Logs
```

### Database Logs
```
Render PostgreSQL → Dashboard → Logs
Check for slow queries or connection issues
```

---

## Rollback Procedure

**Backend Rollback (Render)**:
1. Go to Render dashboard
2. Select web service
3. Click "Deployments"
4. Find previous working deployment
5. Click "Re-deploy" on that version

**Frontend Rollback (Vercel)**:
1. Go to Vercel dashboard
2. Click "Deployments"
3. Find previous working version
4. Click "Promote to Production"

**Database Rollback**:
```bash
# Create backup first
pg_dump DATABASE_URL > backup.sql

# Then rollback migration if needed
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Performance Optimization

### Backend
- Enable response compression: `npm install compression`
- Add caching headers in middleware
- Use connection pooling for PostgreSQL
- Monitor with Render metrics dashboard

### Frontend
- Vite already handles code splitting
- Configure image optimization
- Set up Vercel Analytics
- Monitor Core Web Vitals

---

## Security Considerations

- [ ] Never commit `.env` files
- [ ] Rotate `JWT_SECRET` regularly
- [ ] Use HTTPS everywhere (automatic)
- [ ] Enable rate limiting on backend
- [ ] Validate all user inputs
- [ ] Keep dependencies updated: `npm audit`
- [ ] Use environment-specific secrets
- [ ] Enable database encryption at rest

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/)

---

## Support

For deployment issues:
1. Check service logs first
2. Verify environment variables match exactly
3. Test locally before deploying
4. Check platform status pages
5. Review error messages carefully

Last Updated: 2026-06-01
