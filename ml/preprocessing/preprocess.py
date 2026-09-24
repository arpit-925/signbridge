"""
SignBridge AI - Shared Preprocessing & Landmark Normalization Module
Reusable across dataset feature extraction, test scripts, and FastAPI inference.
"""

from typing import List, Optional, Tuple, Union
import numpy as np


def normalize_landmarks(landmarks: Union[List[List[float]], np.ndarray]) -> np.ndarray:
    """
    Normalizes 21 3D hand landmarks (x, y, z) to be invariant to:
      1. Translation (hand position in frame)
      2. Scale (distance from camera / bounding size)

    Method:
      - Translate all landmarks relative to the wrist (landmark 0).
      - Compute max Euclidean distance from the wrist to any landmark.
      - Divide translated coordinates by this max distance to normalize scale to [0, 1].

    Parameters:
      landmarks: Array or list of shape (21, 3) representing (x, y, z) for 21 points.

    Returns:
      1D numpy array of 63 normalized float32 values [x0, y0, z0, ..., x20, y20, z20].
    """
    pts = np.array(landmarks, dtype=np.float32)
    if pts.shape != (21, 3):
        raise ValueError(f"Expected landmarks array of shape (21, 3), got {pts.shape}")

    # 1. Translation: wrist is landmark index 0
    wrist = pts[0].copy()
    translated = pts - wrist

    # 2. Scale normalization: maximum Euclidean distance from wrist to any landmark
    distances = np.linalg.norm(translated, axis=1)
    max_dist = np.max(distances)

    if max_dist < 1e-6:
        scale = 1.0
    else:
        scale = max_dist

    normalized = translated / scale

    # Flatten to 63 numerical features
    return normalized.flatten().astype(np.float32)


def create_hand_detector(model_path: Optional[str] = None):
    """
    Creates a MediaPipe hand detector instance.
    Uses modern mediapipe.tasks.python.vision.HandLandmarker if available,
    falling back to legacy mp.solutions.hands.
    """
    import mediapipe as mp
    from pathlib import Path

    # 1. Try modern MediaPipe Tasks Vision
    try:
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision as mp_vision

        if not model_path:
            # Default location: ml/models/hand_landmarker.task
            base = Path(__file__).resolve().parent.parent
            model_path = str(base / "models" / "hand_landmarker.task")

        base_options = mp_python.BaseOptions(model_asset_path=str(model_path))
        options = mp_vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=1,
            min_hand_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        return mp_vision.HandLandmarker.create_from_options(options)
    except Exception as e:
        # 2. Fall back to legacy solutions
        if hasattr(mp, "solutions") and hasattr(mp.solutions, "hands"):
            return mp.solutions.hands.Hands(
                static_image_mode=True,
                max_num_hands=1,
                min_detection_confidence=0.5
            )
        raise RuntimeError(f"Could not initialize MediaPipe detector: {e}")


def extract_landmarks_from_image(image_bgr, detector) -> Optional[np.ndarray]:
    """
    Given a BGR image and an initialized detector, returns 63 normalized features.
    Works with both HandLandmarker and legacy Hands detector.
    """
    import cv2
    import mediapipe as mp

    if image_bgr is None:
        return None

    # Handle modern HandLandmarker
    if hasattr(detector, "detect"):
        # Convert BGR -> RGB
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
        result = detector.detect(mp_img)

        if not result.hand_landmarks or len(result.hand_landmarks) == 0:
            return None

        hand = result.hand_landmarks[0]
        raw_points = [[lm.x, lm.y, lm.z] for lm in hand]
        return normalize_landmarks(raw_points)

    # Handle legacy mp.solutions.hands.Hands
    if hasattr(detector, "process"):
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        result = detector.process(image_rgb)

        if not result.multi_hand_landmarks:
            return None

        hand = result.multi_hand_landmarks[0]
        raw_points = [[lm.x, lm.y, lm.z] for lm in hand.landmark]
        return normalize_landmarks(raw_points)

    return None
