# SignBridge AI — Indian Sign Language (ISL) ML Pipeline

This directory contains the machine learning pipeline for recognizing Indian Sign Language (ISL) alphabet gestures (`A` through `Z`).

```
ISL Alphabet Image
        ↓
MediaPipe Hands (Static Image Mode)
        ↓
21 Hand Landmarks (x, y, z)
        ↓
Translation & Scale Invariant Normalization
        ↓
63 Normalized Features
        ↓
TensorFlow / Keras Dense Classifier
        ↓
Predicted ISL Alphabet + Confidence Score
        ↓
FastAPI Microservice (Port 8001)
        ↓
SignBridge Node.js Backend & React Frontend
```

---

## 1. Directory Structure

```
ml/
├── dataset/
│   ├── raw/
│   │   └── Dataset.zip            # Original 26-class dataset
│   ├── extracted/                 # Extracted images (Training, Validation, Testing)
│   └── processed/
│       ├── train.csv              # 63 features + label (Training split)
│       ├── validation.csv         # 63 features + label (Validation split)
│       ├── test.csv               # 63 features + label (Test split)
│       ├── landmarks.csv          # Combined feature dataset
│       └── preprocessing_report.json
│
├── preprocessing/
│   ├── extract_dataset.py         # Safe extraction of Dataset.zip
│   ├── preprocess.py              # Landmark normalization & feature extraction logic
│   └── extract_landmarks.py       # Batch MediaPipe feature extraction pipeline
│
├── training/
│   ├── train.py                   # Model training script
│   ├── evaluate.py                # Test set evaluation & confusion matrix
│   └── predict.py                 # Single image CLI inference script
│
├── models/
│   ├── sign_model.keras           # Trained Keras model
│   ├── label_encoder.json         # Index-to-label class mappings
│   └── model_metadata.json        # Architecture & training telemetry
│
├── results/
│   ├── evaluation_metrics.json    # Precision, Recall, F1, Loss, Accuracy
│   ├── classification_report.txt  # Detailed per-class precision/recall table
│   ├── confusion_matrix.json      # Raw confusion matrix array
│   └── confusion_matrix.png       # Confusion matrix heatmap
│
├── api/
│   └── main.py                    # FastAPI inference microservice
│
├── requirements.txt
└── README.md
```

---

## 2. Installation & Prerequisites

Python 3.10+ is recommended. Install required libraries:

```bash
cd ml
pip install -r requirements.txt
```

Core dependencies:
- `tensorflow>=2.16`
- `mediapipe>=0.10`
- `opencv-python>=4.8`
- `fastapi>=0.110`
- `uvicorn>=0.28`
- `scikit-learn`, `pandas`, `numpy`, `matplotlib`, `seaborn`

---

## 3. Step-by-Step Execution Pipeline

### Step 1: Extract the Raw Dataset

Extracts `dataset/raw/Dataset.zip` into `dataset/extracted/`:

```bash
python preprocessing/extract_dataset.py
```

- Verifies ZIP integrity and handles corrupt files gracefully.
- Preserves the official `Training`, `Validation`, and `Testing` directories.

### Step 2: Extract MediaPipe Landmarks & Normalize

Runs MediaPipe Hands on the extracted images to generate 63-dimensional feature vectors:

```bash
python preprocessing/extract_landmarks.py
```

- Skips samples where hands are undetected (logs failure counts).
- Saves `train.csv`, `validation.csv`, `test.csv`, and `landmarks.csv`.
- Generates `preprocessing_report.json`.

#### Landmark Normalization Method:
1. **Translation Invariance**: Translates all 21 points relative to the wrist (landmark 0):
   $$x'_i = x_i - x_0, \quad y'_i = y_i - y_0, \quad z'_i = z_i - z_0$$
2. **Scale Invariance**: Divides by the maximum Euclidean distance from the wrist to any landmark:
   $$\text{scale} = \max_i \sqrt{(x'_i)^2 + (y'_i)^2 + (z'_i)^2}$$
   $$x''_i = \frac{x'_i}{\text{scale}}, \quad y''_i = \frac{y'_i}{\text{scale}}, \quad z''_i = \frac{z'_i}{\text{scale}}$$
3. Yields 63 invariant numerical features in $[-1, 1]$.

### Step 3: Train the Classifier

Trains the TensorFlow/Keras neural network:

```bash
python training/train.py
```

- Architecture: Input(63) → Dense(128, ReLU) → BatchNorm → Dropout(0.25) → Dense(64, ReLU) → BatchNorm → Dropout(0.25) → Dense(26, Softmax).
- Uses Adam optimizer, `sparse_categorical_crossentropy`, EarlyStopping, and ReduceLROnPlateau.
- Saves best model to `models/sign_model.keras`, class mappings to `models/label_encoder.json`, and metadata to `models/model_metadata.json`.

### Step 4: Evaluate on Unseen Test Set

Evaluates the model on the unseen `test.csv`:

```bash
python training/evaluate.py
```

- Outputs accuracy, loss, precision, recall, and F1-score.
- Saves `results/classification_report.txt`, `results/evaluation_metrics.json`, and `results/confusion_matrix.png`.

---

## 4. Single-Image CLI Prediction

Test the trained model directly on an image:

```bash
python training/predict.py dataset/extracted/Testing/A/1.jpg
```

Example Output:
```text
Predicted sign:  A
Confidence:      98.42%
Accepted:        True
```

---

## 5. Running the FastAPI Service

Start the FastAPI microservice on port 8001:

```bash
uvicorn api.main:app --reload --port 8001
```

### Endpoints

#### 1. `GET /health`
Verifies server health and model status:
```json
{
  "status": "ok",
  "model_loaded": true,
  "classes_count": 26,
  "confidence_threshold": 0.5
}
```

#### 2. `POST /predict` (Multipart Image Upload)
Upload an image via `multipart/form-data`:
```bash
curl -X POST "http://localhost:8001/predict" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/hand_image.jpg"
```

Success Response:
```json
{
  "success": true,
  "label": "B",
  "confidence": 0.9542,
  "accepted": true,
  "message": "Sign recognized"
}
```

No Hand Detected Response:
```json
{
  "success": false,
  "label": null,
  "confidence": 0.0,
  "accepted": false,
  "message": "No hand detected"
}
```

Low Confidence Response:
```json
{
  "success": true,
  "label": "B",
  "confidence": 0.3812,
  "accepted": false,
  "message": "Low confidence prediction (< 0.5)"
}
```

#### 3. `POST /predict/sign` (Node.js JSON Payload)
Accepts base64 encoded frames for seamless integration with the Node.js backend:
```json
{
  "frames": ["data:image/jpeg;base64,..."]
}
```
