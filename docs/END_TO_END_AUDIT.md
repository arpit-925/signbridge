# SignBridge AI — End-to-End Audit Report

Generated: 2026-11-21

## 1. Executive Summary

SignBridge AI is a K-12 sign-language educational platform. ML service is fully operational. Frontend builds and deploys. Backend is blocked by MongoDB Atlas cluster being paused. 4 out of 26 ASL classes have 0% recall.

## 2. Architecture Overview

```
[User Browser]
      │
      ▼
[Vercel CDN] → React SPA (Vite 8, React 19, Bootstrap 5, Tailwind CSS 4)
      │
      ▼ HTTPS REST API
[Render Node.js] → Express 4 backend (JWT auth, Mongoose 8, Multer, Zod)
      │                │
      │                ▼
      │          [MongoDB Atlas M0] ← cluster0.ra49n7m.mongodb.net
      │
      ▼ HTTPS multipart
[Render Docker] → Python FastAPI + MediaPipe + TensorFlow/Keras
                  → MLP model (63 features → 26 ASL classes)
```

## 3. Repository Structure

Key directories:

- **frontend/** — React SPA (Vite 8, React 19, Bootstrap 5, Tailwind CSS 4)
  - `src/pages/` — Route-level components (student, teacher, parent, admin)
  - `src/components/` — Shared UI components
  - `src/api/` — Axios API client and service modules
  - `src/context/` — Auth and global state context providers
- **backend/** — Node.js/Express REST API
  - `src/routes/` — Express route definitions
  - `src/controllers/` — Request handlers
  - `src/models/` — Mongoose schemas
  - `src/config/` — Environment config, DB connection
  - `src/integrations/ai/` — FastAPI client for ML service
  - `src/seeds/` — Database seed scripts
  - `tests/` — Integration tests (require live Atlas)
- **ml/** — Python FastAPI + ML inference service
  - `api/main.py` — FastAPI app with prediction endpoints
  - `model/` — Trained Keras MLP model and label encoder
  - `results/` — Evaluation metrics and confusion matrix
  - `Dockerfile` — Container build for Render deployment

## 4. Issues Found

### CRITICAL

- **[CRIT-001] MongoDB Atlas cluster paused** — cluster0.ra49n7m.mongodb.net DNS does not resolve. Free M0 clusters auto-pause after 60 days of inactivity. Backend cannot connect to database, Render service stays in crash loop. **Fix: Resume cluster at cloud.mongodb.com.**
- **[CRIT-002] 4 ASL classes have 0% recall** — Classes I, K, Q, S are completely misclassified. I always predicted as Y (100%), K predicted as F (76%) or T (24%), Q predicted as N (72%), S predicted as C (38%). These produce incorrect translations for affected letters.

### HIGH

- **[HIGH-001] JWT default secrets insecure** — `backend/src/config/env.js` has hardcoded fallback secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. If Render env vars are not set, app uses these insecure defaults.
- **[HIGH-002] No backend test isolation** — `backend/tests` use live MongoDB Atlas; no `mongodb-memory-server`. All backend tests fail when Atlas is unavailable.
- **[HIGH-003] Single-signer dataset** — Dataset was likely collected from one signer. Severe distribution shift when other users perform signs. 80.33% test accuracy overstates real-world performance.

### MEDIUM

- **[MED-001] Object recognition is simulated** — No real computer vision model for object detection. `ObjectRecognition.jsx` renders an educational demo. Frontend labels updated to reflect this.
- **[MED-002] Text-to-sign is database lookup** — Not AI translation. English word lookup from `SignDictionary` MongoDB collection; falls back to fingerspelling placeholder images.
- **[MED-003] Tokens in localStorage** — JWT access and refresh tokens stored in localStorage, vulnerable to XSS. For current threat model this is acceptable but should be documented.
- **[MED-004] ML unpinned dependencies** — `ml/requirements.txt` has no version pins. Future installs may break with incompatible library versions.
- **[MED-005] Training data subset used** — Only 150 images per class used (3,900 training, 1,040 val, 1,300 test) despite 26,003 images available. Full dataset unused.

### LOW

- **[LOW-001] No refresh token rotation on the backend** — The frontend implements a token refresh call, but the backend should verify its refresh token rotation policy.
- **[LOW-002] Root vercel.json and frontend/vercel.json both present** — Identical SPA rewrite rules. Vercel uses the one in the configured project root (`frontend/`). Root one may be ignored; no conflict found but could cause confusion.
- **[LOW-003] Speech synthesis is browser-only** — `SpeechSynthesisUtterance`. Not all browsers or OS configurations support it. No fallback.

## 5. Changes Made During Audit

| File | Change | Reason |
|------|--------|--------|
| ml/Dockerfile | Python 3.13.5-slim → 3.12-slim; added libgomp1 | TF compatibility |
| ml/api/main.py | Added /predict/object endpoint | Endpoint was missing; returns educational demo |
| backend/src/integrations/ai/fastApiClient.js | 35s timeout; finally blocks for cleanup; clear error on no image | Resource leak + UX fix |
| backend/src/seeds/seed.js | Added production guard before deleteMany | Prevent accidental data wipe |
| backend/src/config/db.js | serverSelectionTimeoutMS 10000; ENOTFOUND diagnostic | Better error messages |
| backend/tests/setup.js | try/catch around connect; 3s timeout; TEST_MONGODB_URI support | Tests don't hang |
| frontend/src/pages/student/ObjectRecognition.jsx | Labels updated to "Simulated Vision" | Accuracy in labeling |
| ml/results/metrics.json | Created (copy of evaluation_metrics.json) | Required deliverable |

## 6. Configuration Requirements

### Render — Node.js Backend

| Variable | Required Value |
|----------|---------------|
| NODE_ENV | production |
| MONGODB_URI | mongodb+srv://...@cluster0.ra49n7m.mongodb.net/... |
| JWT_ACCESS_SECRET | (strong random string — MUST override default) |
| JWT_REFRESH_SECRET | (strong random string — MUST override default) |
| JWT_ACCESS_EXPIRES | 15m |
| JWT_REFRESH_EXPIRES | 7d |
| CLIENT_URL | https://signbridge-sigma-ten.vercel.app |
| AI_SERVICE_URL | https://signbridgeml.onrender.com |
| STORAGE_PROVIDER | local |
| UPLOAD_DIR | uploads |

### Render — ML Docker Service

| Variable | Value |
|----------|-------|
| PORT | (Render sets automatically) |

### Vercel — Frontend

| Variable | Value |
|----------|-------|
| VITE_API_URL | https://signbridge-backend-fdgz.onrender.com/api |

## 7. Deployment Status

| Service | URL | Status | Notes |
|---------|-----|--------|-------|
| Frontend | https://signbridge-sigma-ten.vercel.app/ | ✅ LIVE | HTTP 200, React SPA served |
| Node.js Backend | https://signbridge-backend-fdgz.onrender.com | ❌ DOWN | Atlas ENOTFOUND — cluster paused |
| ML Service | https://signbridgeml.onrender.com | ✅ LIVE | 26 classes, real inference; ~82s cold start |
| MongoDB Atlas | cluster0.ra49n7m.mongodb.net | ❌ PAUSED | Resume at cloud.mongodb.com |

## 8. Frontend Route Audit

| Route | Component | Auth Required | Role | Status |
|-------|-----------|--------------|------|--------|
| / | LandingPage | No | Any | ✅ Renders |
| /login | LoginPage | No | Any | ✅ Renders |
| /signup | SignupPage | No | Any | ✅ Renders |
| /onboarding | OnboardingPage | No | Any | ✅ Renders |
| /student/dashboard | StudentDashboard | Yes | student | ✅ Protected |
| /student/lessons | LessonLibrary | Yes | student | ✅ Protected |
| /student/lesson/:id | LessonView | Yes | student | ✅ Protected |
| /student/quiz | QuizPractice | Yes | student | ✅ Protected |
| /student/sign-converter | SignConverter | Yes | student | ✅ AI integrated |
| /student/object-recognition | ObjectRecognition | Yes | student | ⚠️ Demo only |
| /student/progress | StudentProgress | Yes | student | ✅ Protected |
| /student/achievements | Achievements | Yes | student | ✅ Protected |
| /student/messages | Messages | Yes | student | ✅ Protected |
| /student/settings | Settings | Yes | student | ✅ Protected |
| /teacher/dashboard | TeacherDashboard | Yes | teacher | ✅ Protected |
| /teacher/classes | ClassManagement | Yes | teacher | ✅ Protected |
| /teacher/assignments | AssignmentCreation | Yes | teacher | ✅ Protected |
| /teacher/progress | StudentProgressMonitor | Yes | teacher | ✅ Protected |
| /teacher/feedback | FeedbackGrading | Yes | teacher | ✅ Protected |
| /teacher/resources | TeacherResources | Yes | teacher | ✅ Protected |
| /parent/dashboard | ParentDashboard | Yes | parent | ✅ Protected |
| /parent/child-progress | ChildProgress | Yes | parent | ✅ Protected |
| /parent/communication | ParentCommunication | Yes | parent | ✅ Protected |
| /parent/help | HelpCenter | Yes | parent | ✅ Protected |
| /admin | AdminDashboard | Yes | admin | ✅ Protected |

## 9. ML Service API

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| /health | GET | Model health check | ✅ LIVE |
| /predict | POST | Multipart image → sign prediction | ✅ LIVE |
| /predict/sign | POST | JSON base64 image → sign prediction | ✅ LIVE |
| /predict/object | POST | Object recognition (educational demo) | ✅ Added |

## 10. Known Limitations

1. Model was trained on a single signer's data — accuracy for other signers is likely lower than 80.33%
2. Only static (non-motion) ASL alphabet signs A-Z are supported — no words, phrases, or dynamic signs
3. Letters I, K, Q, S are completely misclassified — do not use in production without model retraining
4. Object recognition is a simulated educational feature — no real computer vision
5. Text-to-sign uses database lookup (English only) — no Hindi support
6. ML service has ~82 second cold start on Render free tier
7. No automatic data backup for MongoDB Atlas free tier
8. No CI/CD pipeline — deployments are manual

## 11. Recommendations

1. **Immediately**: Resume MongoDB Atlas cluster
2. **High priority**: Set strong JWT secrets in Render dashboard
3. **High priority**: Retrain model with more signers and data augmentation; fix I/K/Q/S classes
4. **Medium priority**: Pin ml/requirements.txt versions
5. **Medium priority**: Add mongodb-memory-server for isolated backend tests
6. **Medium priority**: Implement real object recognition (e.g., MobileNet or YOLOv8-nano)
7. **Future**: Extend to dynamic signs (video-based) using LSTM or Transformer architecture
8. **Future**: Add CI/CD with GitHub Actions for automated testing on PR
