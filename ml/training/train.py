"""
SignBridge AI - Model Training Pipeline
Trains a TensorFlow/Keras Dense classifier on 63 normalized hand landmark features.
Saves:
  - ml/models/sign_model.keras
  - ml/models/label_encoder.json
  - ml/models/model_metadata.json
"""

import os
import sys
import json
import time
from pathlib import Path
import numpy as np
import pandas as pd

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = BASE_DIR / "dataset" / "processed"
MODELS_DIR = BASE_DIR / "models"


def load_data():
    """Loads training and validation datasets from processed CSV files."""
    train_path = PROCESSED_DIR / "train.csv"
    val_path = PROCESSED_DIR / "validation.csv"

    if not train_path.exists() or not val_path.exists():
        # Fallback to landmarks.csv if splits aren't extracted separately
        landmarks_path = PROCESSED_DIR / "landmarks.csv"
        if not landmarks_path.exists():
            raise FileNotFoundError(
                f"No processed data found in {PROCESSED_DIR}. Run extract_landmarks.py first."
            )
        print("[INFO] train.csv/validation.csv not found; splitting from landmarks.csv...")
        from sklearn.model_selection import train_test_split
        df = pd.read_csv(landmarks_path)
        train_df, temp_df = train_test_split(df, test_size=0.30, random_state=42, stratify=df["label"])
        val_df, test_df = train_test_split(temp_df, test_size=0.50, random_state=42, stratify=temp_df["label"])
        test_df.to_csv(PROCESSED_DIR / "test.csv", index=False)
    else:
        train_df = pd.read_csv(train_path)
        val_df = pd.read_csv(val_path)

    feature_cols = [c for c in train_df.columns if c != "label"]
    X_train = train_df[feature_cols].values.astype(np.float32)
    y_train_raw = train_df["label"].values

    X_val = val_df[feature_cols].values.astype(np.float32)
    y_val_raw = val_df["label"].values

    # Determine unique classes across both splits
    classes = sorted(list(set(y_train_raw).union(set(y_val_raw))))
    class_to_idx = {cls_name: i for i, cls_name in enumerate(classes)}
    idx_to_class = {str(i): cls_name for i, cls_name in enumerate(classes)}

    y_train = np.array([class_to_idx[lbl] for lbl in y_train_raw], dtype=np.int32)
    y_val = np.array([class_to_idx[lbl] for lbl in y_val_raw], dtype=np.int32)

    return X_train, y_train, X_val, y_val, idx_to_class, class_to_idx, len(feature_cols)


def build_model(num_features: int, num_classes: int):
    """
    Builds a lightweight, robust Dense/MLP neural network.
    Input(63) -> Dense(128) -> Dropout(0.2) -> Dense(64) -> Dropout(0.2) -> Dense(num_classes, softmax)
    """
    import tensorflow as tf
    from tensorflow.keras import layers, models

    model = models.Sequential([
        layers.Input(shape=(num_features,)),
        layers.Dense(128, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.25),
        layers.Dense(64, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.25),
        layers.Dense(num_classes, activation="softmax")
    ])

    optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
    model.compile(
        optimizer=optimizer,
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model


def train():
    """Main training routine with callbacks and artifact persistence."""
    print("=" * 60)
    print("SignBridge AI - ISL Classifier Training")
    print("=" * 60)

    import tensorflow as tf
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    X_train, y_train, X_val, y_val, idx_to_class, class_to_idx, num_features = load_data()
    num_classes = len(idx_to_class)

    print(f"[DATA] Training samples:   {X_train.shape[0]}")
    print(f"[DATA] Validation samples: {X_val.shape[0]}")
    print(f"[DATA] Features per sample:{num_features}")
    print(f"[DATA] Number of classes:  {num_classes}")
    print(f"[DATA] Classes:            {', '.join(idx_to_class.values())}")

    # Save label encoder JSON mapping
    label_encoder_path = MODELS_DIR / "label_encoder.json"
    with open(label_encoder_path, "w") as f:
        json.dump({
            "idx_to_class": idx_to_class,
            "class_to_idx": class_to_idx,
            "classes": sorted(list(idx_to_class.values()))
        }, f, indent=2)
    print(f"[SAVED] Label encoder map: {label_encoder_path}")

    # Build model
    model = build_model(num_features, num_classes)
    model.summary()

    # Callbacks
    best_model_path = MODELS_DIR / "sign_model.keras"
    callbacks = [
        EarlyStopping(
            monitor="val_accuracy",
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-5,
            verbose=1
        ),
        ModelCheckpoint(
            filepath=str(best_model_path),
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1
        )
    ]

    print("\n[TRAINING] Starting training for up to 40 epochs...")
    start_time = time.time()
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=40,
        batch_size=64,
        callbacks=callbacks,
        verbose=1
    )
    training_duration = time.time() - start_time

    # Evaluate final best on validation set
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    train_loss, train_acc = model.evaluate(X_train, y_train, verbose=0)

    print("\n" + "=" * 60)
    print(f"TRAINING COMPLETE ({training_duration:.1f}s)")
    print(f"Final Train Accuracy: {train_acc * 100:.2f}% | Loss: {train_loss:.4f}")
    print(f"Final Val Accuracy:   {val_acc * 100:.2f}% | Loss: {val_loss:.4f}")
    print(f"Saved Best Model:     {best_model_path}")
    print("=" * 60)

    # Save model metadata
    metadata = {
        "model_name": "SignBridge-ISL-Classifier",
        "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "training_duration_seconds": round(training_duration, 1),
        "input_features": num_features,
        "num_classes": num_classes,
        "classes": sorted(list(idx_to_class.values())),
        "architecture": "MLP (Input(63) -> Dense(128, BatchNorm, Dropout) -> Dense(64, BatchNorm, Dropout) -> Dense(num_classes, Softmax))",
        "normalization_method": "wrist_relative_max_euclidean_distance",
        "train_samples": int(X_train.shape[0]),
        "validation_samples": int(X_val.shape[0]),
        "final_train_accuracy": round(float(train_acc), 4),
        "final_validation_accuracy": round(float(val_acc), 4),
        "final_train_loss": round(float(train_loss), 4),
        "final_validation_loss": round(float(val_loss), 4)
    }

    metadata_path = MODELS_DIR / "model_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[SAVED] Model metadata:    {metadata_path}")


if __name__ == "__main__":
    train()
