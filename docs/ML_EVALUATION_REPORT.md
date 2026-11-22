# SignBridge AI — ML Evaluation Report

Generated: 2026-11-21

## 1. Model Overview

**Task:** American Sign Language (ASL) static alphabet recognition (A-Z, 26 classes)
**Architecture:** Multi-Layer Perceptron (MLP)
**Input Features:** 63 (21 hand landmarks × 3 coordinates, wrist-relative normalized)
**Output:** Softmax probabilities over 26 classes
**Framework:** TensorFlow / Keras
**Model file:** `ml/models/sign_model.keras` (265,761 bytes ≈ 265 KB)

### Network Architecture

```
Input (63,)
│
├─ Dense(128, activation='relu')
├─ BatchNormalization
├─ Dropout(0.25)
│
├─ Dense(64, activation='relu')
├─ BatchNormalization
├─ Dropout(0.25)
│
└─ Dense(26, activation='softmax')
```

**Total parameters:** ~12,000 trainable
**Optimizer:** Adam (lr=0.001)
**Loss:** sparse_categorical_crossentropy
**Regularization:** BatchNormalization + Dropout(0.25) in both hidden layers
**Training callbacks:** EarlyStopping (patience=10, restore_best_weights=True), ModelCheckpoint, ReduceLROnPlateau

## 2. Dataset

| Split | Images | Per Class (avg) |
|-------|--------|----------------|
| Training | 18,198 raw → 3,408 processed (3,900 intended) | ~150 |
| Validation | 2,579 raw → 863 processed (1,040 intended) | ~40 |
| Test | 5,200 raw → 1,266 processed (1,300 intended) | ~50 |
| **Total** | **26,003 raw → 5,537 valid** | — |

**Preprocessing pipeline:**
1. Decode image → BGR → RGB
2. MediaPipe HandLandmarker extracts 21 landmarks (x, y, z each = 63 values)
3. Wrist-relative normalization: subtract wrist (landmark 0) from all landmarks
4. Flatten to 1D feature vector of 63 floats
5. Reject images where no hand is detected

**Preprocessing stats:**
- Total attempted: 6,240
- Successfully processed: 5,537 (88.73%)
- Failed (no hand detected): 703 (11.27%)

> [!NOTE]
> The full 26,003-image dataset was available but only 150 images per class were used for training due to the preprocessing pipeline configuration. This is a known limitation — the unused data could significantly improve model performance if incorporated.

**Dataset limitations:**
- Collected from a single signer (not signer-independent)
- Static gestures only — no motion-based signs
- No background variation or lighting variation documented

## 3. Training Results

| Metric | Value |
|--------|-------|
| Final training accuracy | 96.77% |
| Final validation accuracy | 73.35% |
| Test accuracy | **80.33%** |

> [!WARNING]
> The 23-point gap between training accuracy (96.77%) and validation accuracy (73.35%) indicates significant overfitting, almost certainly due to the single-signer dataset — the model memorizes the specific signer's hand geometry rather than generalizing across signers.

> [!NOTE]
> Training history plots are not available because the training history object was not saved to disk during model training. These plots cannot be reproduced without retraining.

## 4. Test-Set Evaluation Results

**Test set:** 1,266 samples (50 images × 26 classes, with some variation due to preprocessing failures)

### Overall Metrics

| Metric | Score |
|--------|-------|
| Accuracy | **80.33%** |
| Macro Precision | 71.92% |
| Macro Recall | 80.81% |
| Macro F1 | 75.14% |
| Weighted F1 | 74.52% |

### Per-Class F1 Scores

| Class | Precision | Recall | F1 | Support |
|-------|-----------|--------|----|---------|
| A | (from classification_report.txt) | — | — | ~50 |
| B | — | — | — | ~50 |
| C | — | — | — | ~50 |
| D | — | — | — | ~50 |
| E | — | — | — | ~50 |
| F | — | — | — | ~50 |
| G | — | — | — | ~50 |
| H | — | — | — | ~50 |
| **I** | **0.00** | **0.00** | **0.00** | ~50 |
| J | — | — | — | ~50 |
| **K** | **0.00** | **0.00** | **0.00** | ~50 |
| L | — | — | — | ~50 |
| M | — | — | — | ~50 |
| N | — | — | — | ~50 |
| O | — | — | — | ~50 |
| P | — | — | — | ~50 |
| **Q** | **0.00** | **0.00** | **0.00** | ~50 |
| R | — | — | — | ~50 |
| **S** | **0.00** | **0.00** | **0.00** | ~50 |
| T | — | — | — | ~50 |
| U | — | — | — | ~50 |
| V | — | — | — | ~50 |
| W | — | — | — | ~50 |
| X | — | — | — | ~50 |
| Y | — | — | — | ~50 |
| Z | — | — | — | ~50 |

> [!CAUTION]
> **4 classes have F1 = 0.00**: I, K, Q, S. Every test sample from these classes was misclassified.
> - **I** → always predicted as **Y** (100% of samples)
> - **K** → predicted as **F** (76%) or **T** (24%)
> - **Q** → predicted as **N** (72%), S (18%), or W (10%)
> - **S** → predicted as **C** (38%), L (32%), or G (30%)
> 
> These four letters MUST NOT be relied upon in production. The application should warn users when these letters appear in a prediction.

### Confusion Matrix

The confusion matrix is saved at `ml/results/confusion_matrix.png`.

Key off-diagonal entries (worst misclassifications):
- I → Y (geometric similarity: extended pinky)
- K → F (overlapping finger configurations)
- Q → N (similar wrist-relative positions)
- S → C/L (curved fist configurations)

## 5. Confidence Threshold

The deployed model uses a confidence threshold of **0.50**. Predictions with softmax probability below 0.50 are returned with `accepted: false` and the user is asked to retry.

**Impact of threshold:**
- Too low: Incorrect predictions accepted
- Too high: Too many rejections for borderline correct signs
- 0.50 is a reasonable default for the current dataset; tuning on a held-out set is recommended

## 6. Live Inference Test (Deployed Service)

Tested against `https://signbridgeml.onrender.com`:

| Test Image | Expected | Predicted | Confidence | Accepted |
|------------|----------|-----------|-----------|---------|
| Letters/A.jpg | A | A | 95.24% | ✅ True |
| Letters/B.jpg | B | O | 37.91% | ❌ False |

> [!NOTE]
> B.jpg returned O at 37.91% (rejected). This may be because the training sample image was from the original signer's particular B gesture. The model correctly rejected the prediction via the confidence threshold.

**Cold start latency:** ~82 seconds (Render free Docker service)
**Inference latency:** <1 second after model is loaded

## 7. Model Comparison (Research Context)

This model is a simple MLP baseline. Published results on the same ASL dataset type range from 90-99% accuracy using CNNs trained directly on images. The MediaPipe landmark-based approach sacrifices some accuracy for:
- Real-time performance
- Hardware independence (no GPU required)
- Smaller model size (265 KB vs. 10-100 MB for CNNs)

## 8. Limitations

1. **Single signer** — model generalization to other signers is unknown and likely lower
2. **Static only** — no support for letters requiring motion (J, Z — though these may be excluded from dataset)
3. **Four classes with 0% recall** — I, K, Q, S completely misclassified
4. **No signer-independent validation** — test set likely from same signer as training
5. **Unpinned training dependencies** — exact library versions not recorded
6. **No data augmentation** — rotation, translation, scaling not applied during training
7. **No cross-validation** — single train/val/test split

## 9. Recommendations

| Priority | Recommendation |
|----------|---------------|
| High | Add data augmentation (landmark jitter, rotation) |
| High | Collect multi-signer data (minimum 5-10 signers) |
| High | Fix I/K/Q/S confusion — investigate landmark similarity, consider feature engineering |
| Medium | Use full training dataset (18,198 images, not just 150/class) |
| Medium | Add cross-validation for more reliable metrics |
| Medium | Experiment with CNN on raw images for comparison |
| Medium | Pin all ml/requirements.txt versions |
| Low | Save training history for reproducibility |
| Low | Add per-class confidence calibration |
| Low | Implement dynamic sign recognition (LSTM/Transformer on video frames) |

## 10. Files

| File | Description |
|------|-------------|
| ml/models/sign_model.keras | Trained Keras model |
| ml/models/label_encoder.json | 26-class label mapping |
| ml/models/model_metadata.json | Training run metadata |
| ml/results/evaluation_metrics.json | Full evaluation metrics JSON |
| ml/results/metrics.json | Alias of evaluation_metrics.json |
| ml/results/confusion_matrix.json | Full 26×26 confusion matrix |
| ml/results/confusion_matrix.png | Confusion matrix heatmap |
| ml/results/classification_report.txt | Per-class precision/recall/F1 |
