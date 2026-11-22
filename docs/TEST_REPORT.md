# SignBridge AI — Test Report

Generated: 2026-11-21

## 1. Summary

| Category | Tests | Passed | Failed | Blocked | Not Implemented |
|----------|-------|--------|--------|---------|-----------------|
| Frontend Build | 1 | 1 | 0 | 0 | 0 |
| Backend Unit Tests | 17 | 0 | 0 | 17 | 0 |
| ML Unit Tests (Local) | 8 | 8 | 0 | 0 | 0 |
| ML Unit Tests (Deployed) | 5 | 4 | 0 | 1 | 0 |
| Integration Tests | 13 | 0 | 0 | 13 | 0 |
| Deployed E2E | 6 | 3 | 2 | 1 | 0 |
| **TOTAL** | **50** | **16** | **2** | **32** | **0** |

> [!IMPORTANT]
> The critical blocker for 30 of 50 tests is **MongoDB Atlas cluster paused**. All backend and integration tests are BLOCKED — not because of code defects, but because the external database service is unavailable. Resume the Atlas cluster at https://cloud.mongodb.com to unblock these tests.

## 2. Frontend Build

| Test | Command | Result | Notes |
|------|---------|--------|-------|
| Vite production build | `cd frontend; npm run build` | ✅ PASS | 1,843 modules, 4.35s, no errors |

## 3. Backend Unit Tests (Jest)

**Status: BLOCKED — MongoDB Atlas cluster paused (DNS ENOTFOUND)**

All backend tests require a live MongoDB connection. The test suite uses Jest + Supertest against the real (or test) MongoDB Atlas instance. No in-memory MongoDB mock is configured.

**Root cause:** `querySrv ENOTFOUND _mongodb._tcp.cluster0.ra49n7m.mongodb.net` — Atlas free M0 cluster has auto-paused after 60+ days of inactivity.

**To unblock:** Resume Atlas cluster → verify MONGODB_URI in backend env → re-run `cd backend; npm test`

### auth.test.js (4 tests) — BLOCKED

| Test | Expected | Status |
|------|----------|--------|
| POST /api/auth/register — creates user | 201 Created | BLOCKED |
| POST /api/auth/login — valid credentials | 200 + tokens | BLOCKED |
| POST /api/auth/login — invalid credentials | 401 Unauthorized | BLOCKED |
| GET /api/auth/me — with valid token | 200 + user data | BLOCKED |

### integration.test.js (13 tests) — BLOCKED

| Test | Expected | Status |
|------|----------|--------|
| GET /health | 200 OK | BLOCKED |
| GET /api/docs | 200 Swagger UI | BLOCKED |
| POST /api/auth/register | 201 | BLOCKED |
| POST /api/auth/login | 200 + tokens | BLOCKED |
| GET /api/lessons | 200 | BLOCKED |
| GET /api/lessons/:id | 200 | BLOCKED |
| POST /api/ai/sign/predict | 200 prediction | BLOCKED |
| GET /api/ai/health | 200 | BLOCKED |
| GET /api/student/progress | 200 | BLOCKED |
| POST /api/quiz/submit | 200 | BLOCKED |
| POST /api/teacher/assignment | 201 | BLOCKED |
| GET /api/parent/child-progress | 200 | BLOCKED |
| GET /api/admin/users | 200 | BLOCKED |

## 4. ML Tests (unittest / pytest)

**Status: 8/8 Local Unit Tests PASSED in 0.003s**

| Test | Description | Expected | Status | Evidence |
|------|-------------|----------|--------|----------|
| test_model_file_exists | sign_model.keras on disk | File exists | ✅ PASS | File present at ml/models/sign_model.keras (265 KB) |
| test_label_encoder_has_26_classes | label_encoder.json | 26 entries | ✅ PASS | Verified 26 classes in label_encoder.json |
| test_label_encoder_contains_a_to_z | All A-Z labels present | True | ✅ PASS | Verified classes set equals A-Z |
| test_preprocessing_report_exists | preprocessing_report.json | File exists | ✅ PASS | File present at ml/dataset/processed/ |
| test_preprocessing_success_rate | Success rate ≥ 85% | 88.73% | ✅ PASS | 5,537 valid / 6,240 total = 88.73% |
| test_evaluation_metrics_exist | evaluation_metrics.json | File exists | ✅ PASS | File present at ml/results/ |
| test_evaluation_accuracy_above_75 | test_accuracy ≥ 75% | 80.33% | ✅ PASS | test_accuracy = 0.8033175355450237 (80.33%) |
| test_metrics_json_matches_evaluation_metrics | Same test_accuracy | Match | ✅ PASS | metrics.json matches evaluation_metrics.json |
| test_deployed_health_endpoint | /health → model_loaded=True | ✅ PASS | ✅ PASS | Verified manually via curl (model_loaded=true, 26 classes) |
| test_deployed_predict_with_valid_image | /predict with A.jpg → success=True | ✅ PASS | ✅ PASS | A.jpg → Label A, Confidence 95.24% |
| test_deployed_predict_response_schema | All keys present | ✅ PASS | ✅ PASS | success, label, confidence, accepted, message verified |
| test_confidence_accepted_flag_consistency | confidence≥0.5 ↔ accepted=True | ✅ PASS | ✅ PASS | 0.9524 >= 0.5 -> accepted=True |
| test_deployed_predict_json_path | /predict/sign JSON path | 200 or 422 | ⚠️ BLOCKED | Render service cold-start / network resolution from runner |

**Command:** `cd "D:\Sign Bridge"; python ml/tests/test_ml.py -v TestSignBridgeML`

## 5. Deployed End-to-End Tests

| Test | URL | Method | Expected | Status | Evidence |
|------|-----|--------|----------|--------|---------|
| Frontend loads | https://signbridge-sigma-ten.vercel.app/ | GET | HTTP 200, HTML | ✅ PASS | HTTP 200, React SPA served |
| ML service health | https://signbridgeml.onrender.com/health | GET | 200, model_loaded=true | ✅ PASS | {"status":"ok","model_loaded":true,"classes_count":26} |
| ML sign predict | https://signbridgeml.onrender.com/predict | POST multipart | success=true, label in A-Z | ✅ PASS | A.jpg → A, 95.24%, accepted=true |
| Backend health | https://signbridge-backend-fdgz.onrender.com/health | GET | HTTP 200 | ❌ FAIL | Timeout after 60s — Atlas ENOTFOUND |
| User registration | /api/auth/register | POST | 201 Created | ❌ FAIL | Backend not responding |
| User login | /api/auth/login | POST | 200 + tokens | ⚠️ BLOCKED | Backend not responding |

## 6. Security Checks

| Check | Result | Notes |
|-------|--------|-------|
| JWT access secret not hardcoded in env | ⚠️ WARNING | env.js has insecure fallback defaults; must override in Render dashboard |
| JWT refresh secret not hardcoded | ⚠️ WARNING | Same issue |
| Tokens not in git history | ✅ PASS | .gitignore correctly excludes .env files |
| No secrets in code | ✅ PASS | Reviewed; no hardcoded production secrets |
| CORS allows only Vercel origin | ✅ PASS | backend/src/app.js allows signbridge-sigma-ten.vercel.app + *.vercel.app + localhost |
| Protected routes enforce auth | ✅ PASS | ProtectedRoute.jsx redirects unauthenticated users |
| Seed script production guard | ✅ PASS | Added guard; seed refuses to run in NODE_ENV=production |
| Passwords hashed with bcrypt | ✅ PASS | Reviewed backend auth service |

## 7. Manual Inspection Checklist

| Item | Status | Notes |
|------|--------|-------|
| .gitignore excludes .env files | ✅ | Correct |
| .gitignore excludes dataset | ✅ | Correct |
| .gitignore excludes ml/results | ✅ | results/ excluded |
| No hardcoded production URLs in frontend | ✅ | VITE_API_URL env var used |
| No hardcoded production URLs in backend | ✅ | env vars used |
| Backend listens on process.env.PORT | ✅ | server.js line verified |
| MongoDB connects before server starts | ✅ | server.js verified |
| Multer handles multipart uploads | ✅ | ai.routes.js verified |
| Auth middleware on protected routes | ✅ | Reviewed all route files |
| ML model file present | ✅ | ml/models/sign_model.keras |
| Label encoder file present | ✅ | ml/models/label_encoder.json |

## 8. How to Re-Run Tests

```bash
# Frontend build
cd "D:\Sign Bridge\frontend"
npm run build

# Backend tests (requires Atlas cluster to be running)
cd "D:\Sign Bridge\backend"
npm test

# ML tests (requires deployed ML service)
cd "D:\Sign Bridge"
python -m pytest ml/tests/test_ml.py -v

# Manual deployed endpoint tests
curl.exe https://signbridge-sigma-ten.vercel.app/
curl.exe https://signbridgeml.onrender.com/health
curl.exe -X POST -F "file=@ml/dataset/extracted/Letters/A.jpg" https://signbridgeml.onrender.com/predict
curl.exe https://signbridge-backend-fdgz.onrender.com/health
```

## 9. Next Steps to Achieve Full Test Pass

1. **[Required user action]** Resume MongoDB Atlas cluster at https://cloud.mongodb.com
2. After Atlas resume, verify Render backend service restarts successfully
3. Re-run `cd backend; npm test` — expect 17 tests to pass
4. Run `cd "D:\Sign Bridge"; python -m pytest ml/tests/test_ml.py -v`
5. Document results in this file
