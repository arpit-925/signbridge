# SignBridge AI — Deployment Guide

## 1. Prerequisites

### Local Development
- Node.js 18+ and npm
- Python 3.12 (recommended; 3.11+ should work)
- Git

### Deployment Accounts Required
- GitHub account (repository: https://github.com/arpit-925/signbridge)
- Vercel account (frontend deployment)
- Render account (backend + ML service)
- MongoDB Atlas account (database)

---

## 2. Local Development Setup

### 2.1 Clone the Repository

```bash
git clone https://github.com/arpit-925/signbridge.git
cd signbridge
```

### 2.2 Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend dev server:
```bash
npm run dev
```
Frontend will be available at http://localhost:5173

### 2.3 Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.ra49n7m.mongodb.net/signbridge
JWT_ACCESS_SECRET=<your-strong-secret-min-32-chars>
JWT_REFRESH_SECRET=<your-strong-secret-min-32-chars>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:10000
STORAGE_PROVIDER=local
UPLOAD_DIR=uploads
```

> [!CAUTION]
> Never commit `.env` files to git. The `.gitignore` already excludes them.

Start the backend:
```bash
node src/server.js
```
Backend will be available at http://localhost:5000

### 2.4 ML Service Setup

```bash
cd ml
pip install -r requirements.txt
```

> [!TIP]
> Use a virtual environment: `python -m venv venv && venv\Scripts\activate` (Windows)

Start the ML service:
```bash
uvicorn api.main:app --host 0.0.0.0 --port 10000 --reload
```
ML service will be available at http://localhost:10000

### 2.5 Seed Database (Development Only)

> [!WARNING]
> The seed script is DESTRUCTIVE — it deletes all existing data first. It is blocked in NODE_ENV=production. Only run in development.

```bash
cd backend
node src/seeds/seed.js
```

---

## 3. MongoDB Atlas Setup

### 3.1 Create / Resume Cluster

1. Go to https://cloud.mongodb.com
2. Sign in
3. If cluster shows "Paused" → click **Resume** → wait 2-3 minutes for cluster to become active
4. If creating new: Choose M0 (free tier), region closest to Render server (US East recommended)

### 3.2 Network Access

For Render deployment, Render servers do not have fixed IPs on the free tier. You must allow all IPs:

1. In Atlas, go to **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** → `0.0.0.0/0`
3. Click **Confirm**

> [!NOTE]
> This is required for Render free tier. For production with paid Render plans, you can use static outbound IPs and restrict access accordingly.

### 3.3 Get Connection String

1. In Atlas, click **Connect** on your cluster
2. Choose **Connect your application**
3. Driver: Node.js, Version 5.5+
4. Copy the connection string: `mongodb+srv://<user>:<password>@cluster0.ra49n7m.mongodb.net/?retryWrites=true&w=majority`
5. Replace `<password>` with your Atlas user password
6. Add `/signbridge` before the `?` to specify the database: `mongodb+srv://<user>:<password>@cluster0.ra49n7m.mongodb.net/signbridge?retryWrites=true&w=majority`

---

## 4. Vercel Deployment (Frontend)

### 4.1 Connect Repository

1. Go to https://vercel.com/dashboard
2. Click **New Project** → Import from GitHub
3. Select `arpit-925/signbridge`
4. Set **Root Directory** to `frontend`
5. Framework: **Vite** (auto-detected)
6. Build Command: `vite build` (or `npm run build`)
7. Output Directory: `dist`

### 4.2 Environment Variables

In Vercel project settings → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://signbridge-backend-fdgz.onrender.com/api` |

### 4.3 Vercel Configuration

The `frontend/vercel.json` configures SPA routing (all paths → index.html):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

> [!NOTE]
> There is also a `vercel.json` at the repository root. Vercel uses the one in the configured project root directory (`frontend/`). The root-level file is harmless but can be removed to avoid confusion.

### 4.4 Deploy

Push to `main` branch triggers automatic deployment. Or click **Deploy** manually in Vercel dashboard.

**Current frontend URL:** https://signbridge-sigma-ten.vercel.app/

---

## 5. Render — Node.js Backend

### 5.1 Create Web Service

1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Runtime:** Node
   - **Plan:** Free (or Starter for always-on)

### 5.2 Environment Variables

In Render service settings → **Environment**:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://...@cluster0.ra49n7m.mongodb.net/signbridge?...` |
| `JWT_ACCESS_SECRET` | (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `JWT_REFRESH_SECRET` | (generate a different strong random string) |
| `JWT_ACCESS_EXPIRES` | `15m` |
| `JWT_REFRESH_EXPIRES` | `7d` |
| `CLIENT_URL` | `https://signbridge-sigma-ten.vercel.app` |
| `AI_SERVICE_URL` | `https://signbridgeml.onrender.com` |
| `STORAGE_PROVIDER` | `local` |
| `UPLOAD_DIR` | `uploads` |

> [!CAUTION]
> Do NOT use the default JWT secrets from `backend/src/config/env.js`. Generate strong random secrets and set them in Render. The defaults are insecure.

### 5.3 Health Check

Render can use the health endpoint. In service settings → **Health Check Path**: `/health`

**Current backend URL:** https://signbridge-backend-fdgz.onrender.com

---

## 6. Render — ML Docker Service

### 6.1 Create Web Service (Docker)

1. In Render dashboard → **New** → **Web Service**
2. Connect GitHub repository
3. Settings:
   - **Root Directory:** `ml`
   - **Runtime:** **Docker** (Render will auto-detect `ml/Dockerfile`)
   - **Plan:** Free (note: free Docker services have ~82s cold start)

### 6.2 Dockerfile

The `ml/Dockerfile` uses Python 3.12-slim and installs all requirements. No environment variables needed for the ML service (uses PORT from Render automatically).

### 6.3 Health Check

Health check path: `/health`

Expected response after startup (~82s on free tier):
```json
{"status":"ok","model_loaded":true,"classes_count":26,"confidence_threshold":0.5}
```

**Current ML service URL:** https://signbridgeml.onrender.com

---

## 7. Environment Variable Reference

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API base URL (must end with /api) |

### Backend (Render)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✅ | development | Set to `production` on Render |
| `MONGODB_URI` | ✅ | — | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | ✅ | insecure-default | Min 32 char random string |
| `JWT_REFRESH_SECRET` | ✅ | insecure-default | Min 32 char random string, different from access |
| `JWT_ACCESS_EXPIRES` | ❌ | 15m | Access token lifetime |
| `JWT_REFRESH_EXPIRES` | ❌ | 7d | Refresh token lifetime |
| `CLIENT_URL` | ✅ | localhost:5173 | Vercel frontend URL for CORS |
| `AI_SERVICE_URL` | ✅ | mock | ML service URL |
| `STORAGE_PROVIDER` | ❌ | local | File storage provider |
| `UPLOAD_DIR` | ❌ | uploads | Upload directory |
| `PORT` | ❌ | (Render provides) | Do not set; Render assigns port |

---

## 8. Troubleshooting

### Backend shows timeout / 503
1. Check Render service logs for startup error
2. Look for `ENOTFOUND` in logs → Atlas cluster is paused → resume at cloud.mongodb.com
3. Look for `MongooseServerSelectionError` → check MONGODB_URI env var in Render
4. Render free services sleep after 15 minutes of inactivity → first request takes ~30-60s

### ML service shows timeout
1. Render Docker free tier has ~82s cold start — wait and retry
2. Check Render service logs for TensorFlow import errors
3. If `libgomp` error: Dockerfile already installs `libgomp1`; redeploy if this was added after last deploy

### Frontend shows API errors
1. Open browser DevTools → Network tab
2. Check request URL — should be `https://signbridge-backend-fdgz.onrender.com/api/...`
3. If `/api/api/...` → VITE_API_URL has trailing `/api` and code also appends `/api` → fix VITE_API_URL to not include the trailing `/api` path, or update api.js (see api.js for current handling)
4. If CORS error → verify CLIENT_URL in Render backend env matches exact Vercel URL

### Sign converter not working
1. First check ML service health: https://signbridgeml.onrender.com/health
2. Wait up to 90s for cold start
3. Check browser console for fetch errors
4. Verify backend AI_SERVICE_URL is set to https://signbridgeml.onrender.com

### Registration/Login fails
1. Requires backend to be running and Atlas to be connected
2. Check https://signbridge-backend-fdgz.onrender.com/health
3. If 503 → see "Backend shows timeout" above

---

## 9. CI/CD (Recommended Future Setup)

Currently there is no CI/CD pipeline. Recommended GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npm run build
  backend-test:
    runs-on: ubuntu-latest
    env:
      MONGODB_URI: ${{ secrets.TEST_MONGODB_URI }}
      JWT_ACCESS_SECRET: test-secret-32-chars-minimum-here
      JWT_REFRESH_SECRET: test-refresh-secret-32chars-min
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd backend && npm ci && npm test
  ml-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r ml/requirements.txt pytest
      - run: python -m pytest ml/tests/test_ml.py -v -k "not deployed"
```

---

## 10. Quick Reference — Deployed URLs

| Service | URL |
|---------|-----|
| Frontend | https://signbridge-sigma-ten.vercel.app/ |
| Backend API | https://signbridge-backend-fdgz.onrender.com/api |
| Backend Health | https://signbridge-backend-fdgz.onrender.com/health |
| Backend Docs | https://signbridge-backend-fdgz.onrender.com/api/docs |
| ML Service | https://signbridgeml.onrender.com |
| ML Health | https://signbridgeml.onrender.com/health |
| ML Predict | https://signbridgeml.onrender.com/predict |
| GitHub | https://github.com/arpit-925/signbridge |
| MongoDB Atlas | https://cloud.mongodb.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| Render Dashboard | https://dashboard.render.com |
