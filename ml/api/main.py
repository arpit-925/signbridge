"""
SignBridge AI - FastAPI Machine Learning Inference Microservice
Provides real-time inference for Indian Sign Language (ISL) hand gestures.
Endpoints:
  GET  /health
  POST /predict       (Multipart Image Upload)
  POST /predict/sign  (JSON Base64 / Frames payload for Node.js backend)
"""

import os
import sys
import json
import base64
from pathlib import Path
from typing import Optional, List
import numpy as np

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "sign_model.keras"
ENCODER_PATH = MODELS_DIR / "label_encoder.json"

# Reusable normalization module
sys.path.append(str(BASE_DIR))
from preprocessing.preprocess import normalize_landmarks, extract_landmarks_from_image, create_hand_detector

# Environment / Configuration
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.50"))

app = FastAPI(
    title="SignBridge AI - Sign Recognition Service",
    description="ISL Hand Gesture Landmark Classifier powered by MediaPipe and TensorFlow/Keras",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model and detector state
model = None
idx_to_class = {}
hands_detector = None


@app.on_event("startup")
def load_artifacts():
    global model, idx_to_class, hands_detector

    print("[STARTUP] Initializing SignBridge ML Service...")

    if not MODEL_PATH.exists():
        print(f"[WARN] Model not found at {MODEL_PATH}. Prediction endpoints will be unavailable until trained.")
        return

    if not ENCODER_PATH.exists():
        print(f"[WARN] Label encoder not found at {ENCODER_PATH}.")
        return

    try:
        import tensorflow as tf
        model = tf.keras.models.load_model(str(MODEL_PATH))
        print(f"[STARTUP] Successfully loaded Keras model from {MODEL_PATH}")

        with open(ENCODER_PATH, "r") as f:
            encoder_data = json.load(f)
        idx_to_class = encoder_data["idx_to_class"]
        print(f"[STARTUP] Loaded {len(idx_to_class)} classes into label encoder map")

        hands_detector = create_hand_detector()
        print("[STARTUP] Hand detector initialized successfully.")
    except Exception as e:
        print(f"[ERROR] Failed loading ML artifacts: {e}")


class PredictionResponse(BaseModel):
    success: bool
    label: Optional[str] = None
    confidence: float = 0.0
    accepted: bool = False
    message: str


class SignPayload(BaseModel):
    image: Optional[str] = None
    frames: Optional[List[str]] = None
    sessionId: Optional[str] = None
    language: Optional[str] = "en"


def run_inference_on_bgr(img_bgr, threshold: float = CONFIDENCE_THRESHOLD) -> dict:
    """Core prediction pipeline: BGR image -> MediaPipe -> Normalization -> Keras model."""
    if model is None or hands_detector is None:
        return {
            "success": False,
            "label": None,
            "confidence": 0.0,
            "accepted": False,
            "message": "Model not loaded on server."
        }

    features = extract_landmarks_from_image(img_bgr, hands_detector)
    if features is None:
        return {
            "success": False,
            "label": None,
            "confidence": 0.0,
            "accepted": False,
            "message": "No hand detected"
        }

    input_tensor = np.expand_dims(features, axis=0)
    probabilities = model.predict(input_tensor, verbose=0)[0]

    best_idx = int(np.argmax(probabilities))
    confidence = float(probabilities[best_idx])
    label = idx_to_class.get(str(best_idx), f"Class_{best_idx}")

    accepted = confidence >= threshold

    return {
        "success": True,
        "label": label,
        "confidence": round(confidence, 4),
        "accepted": accepted,
        "message": "Sign recognized" if accepted else f"Low confidence prediction (< {threshold})"
    }


@app.get("/health")
def health():
    """Health check endpoint verifying server status and model loading."""
    model_loaded = (model is not None) and (hands_detector is not None)
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "classes_count": len(idx_to_class) if idx_to_class else 0,
        "confidence_threshold": CONFIDENCE_THRESHOLD
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_image(file: UploadFile = File(...), threshold: Optional[float] = None):
    """
    Accepts an uploaded image file (JPEG/PNG), detects hand landmarks, and classifies the sign.
    """
    import cv2

    eff_threshold = threshold if threshold is not None else CONFIDENCE_THRESHOLD

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return PredictionResponse(
            success=False,
            label=None,
            confidence=0.0,
            accepted=False,
            message="Invalid or unreadable image file"
        )

    result = run_inference_on_bgr(img, threshold=eff_threshold)
    return PredictionResponse(**result)


@app.post("/predict/sign")
async def predict_sign_json(payload: SignPayload):
    """
    JSON API endpoint for integration with Node.js backend.
    Accepts base64 encoded frame or image string.
    """
    import cv2

    img_data = payload.image
    if not img_data and payload.frames and len(payload.frames) > 0:
        img_data = payload.frames[-1]

    if not img_data:
        return {
            "prediction": {
                "text": "UNKNOWN",
                "confidence": 0.0,
                "alternatives": []
            }
        }

    # Clean data URL prefix if present
    if "base64," in img_data:
        img_data = img_data.split("base64,")[1]

    try:
        raw_bytes = base64.b64decode(img_data)
        nparr = np.frombuffer(raw_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image")
    except Exception:
        return {
            "prediction": {
                "text": "UNKNOWN",
                "confidence": 0.0,
                "alternatives": []
            }
        }

    result = run_inference_on_bgr(img)
    return {
        "prediction": {
            "text": result["label"] if result["success"] and result["accepted"] else "UNKNOWN",
            "confidence": result["confidence"],
            "accepted": result["accepted"],
            "alternatives": []
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8001, reload=False)
