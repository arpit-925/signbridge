"""
SignBridge AI - Single Image Inference Script
Predicts the ISL alphabet and confidence score from a single input image.
Usage:
  python training/predict.py path/to/image.jpg
"""

import os
import sys
import json
from pathlib import Path
import numpy as np

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

# Reuse standard normalization logic
sys.path.append(str(BASE_DIR))
from preprocessing.preprocess import extract_landmarks_from_image, create_hand_detector


class SignPredictor:
    def __init__(self, model_path: Path = None, encoder_path: Path = None, confidence_threshold: float = 0.50):
        self.model_path = model_path or (MODELS_DIR / "sign_model.keras")
        self.encoder_path = encoder_path or (MODELS_DIR / "label_encoder.json")
        self.confidence_threshold = confidence_threshold

        if not self.model_path.exists():
            raise FileNotFoundError(f"Model file not found: {self.model_path}. Train the model first.")
        if not self.encoder_path.exists():
            raise FileNotFoundError(f"Label encoder not found: {self.encoder_path}")

        # Load label map
        with open(self.encoder_path, "r") as f:
            encoder_data = json.load(f)
        self.idx_to_class = encoder_data["idx_to_class"]

        # Load model
        import tensorflow as tf
        self.model = tf.keras.models.load_model(str(self.model_path))

        # Initialize MediaPipe Hands detector
        self.hands_detector = create_hand_detector()

    def predict_image_path(self, image_path: str) -> dict:
        """Reads an image from disk and performs prediction."""
        import cv2
        img = cv2.imread(image_path)
        if img is None:
            return {
                "success": False,
                "label": None,
                "confidence": 0.0,
                "accepted": False,
                "message": f"Could not read image from path: {image_path}"
            }
        return self.predict_bgr_image(img)

    def predict_bgr_image(self, img_bgr) -> dict:
        """
        Processes BGR image through MediaPipe -> exact same normalization -> Keras model.
        """
        # Extract 63 normalized landmarks using shared preprocessing
        features = extract_landmarks_from_image(img_bgr, self.hands_detector)

        if features is None:
            return {
                "success": False,
                "label": None,
                "confidence": 0.0,
                "accepted": False,
                "message": "No hand detected"
            }

        # Predict
        input_tensor = np.expand_dims(features, axis=0)  # Shape (1, 63)
        probabilities = self.model.predict(input_tensor, verbose=0)[0]

        best_idx = int(np.argmax(probabilities))
        confidence = float(probabilities[best_idx])
        label = self.idx_to_class.get(str(best_idx), f"Unknown_{best_idx}")

        accepted = confidence >= self.confidence_threshold

        return {
            "success": True,
            "label": label,
            "confidence": round(confidence, 4),
            "accepted": accepted,
            "message": "Prediction successful" if accepted else f"Confidence below threshold ({self.confidence_threshold})"
        }


def main():
    if len(sys.argv) < 2:
        print("Usage: python training/predict.py <path_to_image>")
        sys.exit(1)

    img_path = sys.argv[1]
    print(f"Loading SignPredictor...")
    predictor = SignPredictor()
    print(f"Predicting sign for: {img_path}")
    result = predictor.predict_image_path(img_path)

    print("\n" + "=" * 40)
    print("INFERENCE RESULT")
    print("=" * 40)
    if result["success"]:
        print(f"Predicted sign:  {result['label']}")
        print(f"Confidence:      {result['confidence'] * 100:.2f}%")
        print(f"Accepted:        {result['accepted']}")
    else:
        print(f"Failed:          {result['message']}")
    print("=" * 40)


if __name__ == "__main__":
    main()
