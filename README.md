# SignBridge AI

> An AI-powered educational platform for learning Indian Sign Language (ISL), built for K-12 students.

## Live Demo

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://signbridge-sigma-ten.vercel.app/ | ✅ Live |
| Backend API | https://signbridge-backend-fdgz.onrender.com | ⚠️ Requires Atlas |
| ML Service | https://signbridgeml.onrender.com | ✅ Live |

## Features

### Sign Recognition (AI-Powered)
- Real-time ISL alphabet recognition (A-Z static gestures) via webcam
- MediaPipe hand landmark extraction → MLP classifier
- 80.33% test accuracy on 26-class alphabet
- Confidence threshold filtering (≥50% required)
- Known limitation: Letters I, K, Q, and S are misclassified by the current model

### Educational Platform
- **Student portal** — lessons, quizzes, sign practice, progress tracking, achievements
- **Teacher portal** — class management, assignment creation, student progress monitoring, grading
- **Parent portal** — child progress overview, communication tools
- **Admin dashboard** — user and content management

### Text-to-Sign with 3-Level Fallback
- Converts English text to sign sequences with strict 3-level fallback:
  1. **Level 1**: Verified ISL Dictionary sign
  2. **Level 2**: Alphabet-by-alphabet fingerspelling
  3. **Level 3**: Clear unavailable-sign message
- Interactive visual sequence player with play, pause, next/prev, replay, and speed controls

### Sign-to-Voice
- Browser-based speech synthesis (SpeechSynthesisUtterance)
- Converts recognized gestures into spoken audio with rate adjustment, voice selection, pause, resume, and replay controls

### Voice-to-Sign
- Browser speech recognition (SpeechRecognition API)
- Converts natural voice to editable text, then translates to ISL sign visual sequences with the three-level fallback

### Object Recognition (Educational Demo)
- Simulated object recognition for classroom educational purposes
- Not powered by a real computer vision model — clearly labeled as demo

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Bootstrap 5, Tailwind CSS 4, Lucide React, React Router 7 |
| Backend | Node.js, Express 4, JWT auth, bcryptjs, Mongoose 8, Multer, Zod, Swagger |
| Database | MongoDB Atlas (M0 free tier) |
| ML Service | Python, FastAPI, MediaPipe Hands, TensorFlow/Keras, NumPy |
| Frontend Hosting | Vercel |
| Backend Hosting | Render (Node.js Web Service) |
| ML Hosting | Render (Docker Web Service) |

## ML Model

| Metric | Value |
|--------|-------|
| Task | ASL static alphabet recognition (A-Z) |
| Architecture | MLP: Dense(128,BN,Dropout) → Dense(64,BN,Dropout) → Softmax(26) |
| Input | 63 features (21 hand landmarks × 3 coords, wrist-normalized) |
| Test Accuracy | 80.33% |
| Training Accuracy | 96.77% |
| Known failures | I → Y (100%), K → F/T, Q → N, S → C/L/G |
| Model size | ~265 KB |

See [docs/ML_EVALUATION_REPORT.md](docs/ML_EVALUATION_REPORT.md) for full details.

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+, Python 3.12+, Git

```bash
# Clone
git clone https://github.com/arpit-925/signbridge.git
cd signbridge

# Frontend
cd frontend && npm install
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
npm run dev

# Backend (new terminal)
cd backend && npm install
# Create backend/.env with MONGODB_URI, JWT secrets, etc.
node src/server.js

# ML Service (new terminal)
cd ml && pip install -r requirements.txt
uvicorn api.main:app --host 0.0.0.0 --port 10000
```

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for full setup instructions.

## Project Structure

```
signbridge/
├── frontend/          # React SPA (Vite)
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # AuthContext
│   │   ├── pages/         # Student, Teacher, Parent, Admin, Auth pages
│   │   ├── routes/        # AppRoutes with ProtectedRoute
│   │   └── services/      # api.js, authApi.js, aiApi.js
│   └── vercel.json        # SPA rewrite rule
├── backend/           # Express API
│   ├── src/
│   │   ├── config/        # DB, env config
│   │   ├── controllers/   # Route handlers
│   │   ├── integrations/  # FastAPI client
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routes
│   │   ├── services/      # Business logic
│   │   └── seeds/         # Database seeder
│   └── tests/             # Jest + Supertest tests
├── ml/                # Python ML service
│   ├── api/           # FastAPI application
│   ├── dataset/       # Training data (not in git)
│   ├── models/        # Trained model + label encoder
│   ├── preprocessing/ # MediaPipe landmark extraction
│   ├── results/       # Evaluation metrics (not in git)
│   ├── tests/         # Pytest test suite
│   ├── training/      # Train, evaluate, predict scripts
│   └── Dockerfile
└── docs/              # Audit and deployment documentation
    ├── END_TO_END_AUDIT.md
    ├── ML_EVALUATION_REPORT.md
    ├── TEST_REPORT.md
    └── DEPLOYMENT_GUIDE.md
```

## Documentation

| Document | Description |
|----------|-------------|
| [docs/END_TO_END_AUDIT.md](docs/END_TO_END_AUDIT.md) | Complete architecture audit, issues, and fixes |
| [docs/ML_EVALUATION_REPORT.md](docs/ML_EVALUATION_REPORT.md) | Model architecture, training, evaluation metrics |
| [docs/TEST_REPORT.md](docs/TEST_REPORT.md) | Full test results and status |
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Step-by-step local and production deployment |

## Known Issues

1. **MongoDB Atlas cluster must be active** — Free M0 clusters auto-pause. Resume at cloud.mongodb.com.
2. **ML cold start ~82 seconds** — Render free Docker service sleeps after inactivity.
3. **I, K, Q, S letters misclassified** — Model confusion between geometrically similar signs. Avoid relying on these letters until model is retrained.
4. **Object recognition is a demo** — Not powered by a real vision model.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes
4. Push and open a Pull Request

## License

MIT
