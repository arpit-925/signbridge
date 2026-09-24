"""
SignBridge AI - Model Evaluation Script
Evaluates the trained sign_model.keras on the unseen test set (ml/dataset/processed/test.csv).
Generates:
  - Test loss & Test accuracy
  - Precision, Recall, F1-score
  - Classification report
  - Confusion matrix (JSON & PNG heatmap)
Outputs saved to:
  - ml/results/
"""

import os
import sys
import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = BASE_DIR / "dataset" / "processed"
MODELS_DIR = BASE_DIR / "models"
RESULTS_DIR = BASE_DIR / "results"


def evaluate():
    print("=" * 60)
    print("SignBridge AI - Model Evaluation on Unseen Test Set")
    print("=" * 60)

    test_path = PROCESSED_DIR / "test.csv"
    model_path = MODELS_DIR / "sign_model.keras"
    label_encoder_path = MODELS_DIR / "label_encoder.json"

    if not test_path.exists():
        raise FileNotFoundError(f"Test dataset not found at: {test_path}")
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found at: {model_path}. Run train.py first.")
    if not label_encoder_path.exists():
        raise FileNotFoundError(f"Label encoder not found at: {label_encoder_path}")

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Load label encoder
    with open(label_encoder_path, "r") as f:
        encoder_data = json.load(f)
    idx_to_class = encoder_data["idx_to_class"]
    class_to_idx = encoder_data["class_to_idx"]
    target_names = [idx_to_class[str(i)] for i in range(len(idx_to_class))]

    # 2. Load test data
    test_df = pd.read_csv(test_path)
    feature_cols = [c for c in test_df.columns if c != "label"]
    X_test = test_df[feature_cols].values.astype(np.float32)
    y_test_labels = test_df["label"].values

    y_test = np.array([class_to_idx[l] for l in y_test_labels], dtype=np.int32)
    print(f"[DATA] Test samples: {len(X_test)} across {len(target_names)} classes")

    # 3. Load trained model
    import tensorflow as tf
    model = tf.keras.models.load_model(str(model_path))
    print(f"[MODEL] Successfully loaded model: {model_path}")

    # 4. Evaluate loss and accuracy
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)

    # 5. Predict probabilities and classes
    y_pred_probs = model.predict(X_test, verbose=0)
    y_pred = np.argmax(y_pred_probs, axis=1)

    # 6. Metrics
    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(
        y_test, y_pred, average="macro", zero_division=0
    )
    precision_weighted, recall_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_test, y_pred, average="weighted", zero_division=0
    )

    clf_report_text = classification_report(
        y_test, y_pred, target_names=target_names, digits=4, zero_division=0
    )
    clf_report_dict = classification_report(
        y_test, y_pred, target_names=target_names, output_dict=True, zero_division=0
    )

    # 7. Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "=" * 60)
    print("EVALUATION RESULTS")
    print("=" * 60)
    print(f"Test Loss:             {loss:.4f}")
    print(f"Test Accuracy:         {accuracy * 100:.2f}%")
    print(f"Macro Precision:       {precision_macro:.4f}")
    print(f"Macro Recall:          {recall_macro:.4f}")
    print(f"Macro F1-Score:        {f1_macro:.4f}")
    print(f"Weighted F1-Score:     {f1_weighted:.4f}")
    print("\nClassification Report:\n")
    print(clf_report_text)

    # Save Classification Report Text
    report_file = RESULTS_DIR / "classification_report.txt"
    with open(report_file, "w") as f:
        f.write(f"SignBridge AI - Test Set Evaluation\n")
        f.write(f"Test Samples: {len(X_test)}\n")
        f.write(f"Test Accuracy: {accuracy * 100:.2f}%\n")
        f.write(f"Test Loss: {loss:.4f}\n\n")
        f.write(clf_report_text)

    # Save Metrics JSON
    metrics_summary = {
        "test_samples": int(len(X_test)),
        "test_accuracy": round(float(accuracy), 4),
        "test_loss": round(float(loss), 4),
        "precision_macro": round(float(precision_macro), 4),
        "recall_macro": round(float(recall_macro), 4),
        "f1_macro": round(float(f1_macro), 4),
        "precision_weighted": round(float(precision_weighted), 4),
        "recall_weighted": round(float(recall_weighted), 4),
        "f1_weighted": round(float(f1_weighted), 4),
        "per_class": clf_report_dict
    }

    metrics_file = RESULTS_DIR / "evaluation_metrics.json"
    with open(metrics_file, "w") as f:
        json.dump(metrics_summary, f, indent=2)

    # Save Confusion Matrix JSON & PNG
    cm_file = RESULTS_DIR / "confusion_matrix.json"
    with open(cm_file, "w") as f:
        json.dump({
            "classes": target_names,
            "matrix": cm.tolist()
        }, f, indent=2)

    # Plot Confusion Matrix Heatmap if matplotlib is available
    try:
        import matplotlib.pyplot as plt
        import seaborn as sns

        plt.figure(figsize=(12, 10))
        sns.heatmap(
            cm,
            annot=True,
            fmt="d",
            cmap="Blues",
            xticklabels=target_names,
            yticklabels=target_names
        )
        plt.title(f"Confusion Matrix (Test Accuracy: {accuracy * 100:.2f}%)")
        plt.xlabel("Predicted Class")
        plt.ylabel("True Class")
        plt.tight_layout()
        cm_png = RESULTS_DIR / "confusion_matrix.png"
        plt.savefig(cm_png, dpi=300)
        plt.close()
        print(f"[SAVED] Confusion matrix heatmap: {cm_png}")
    except Exception as e:
        print(f"[WARN] Could not plot confusion matrix image: {e}")

    print(f"[SAVED] Evaluation metrics JSON:   {metrics_file}")
    print(f"[SAVED] Classification report:     {report_file}")
    print(f"[SAVED] Confusion matrix JSON:     {cm_file}")
    print("=" * 60)

    # Update metadata with test accuracy
    metadata_file = MODELS_DIR / "model_metadata.json"
    if metadata_file.exists():
        with open(metadata_file, "r") as f:
            meta = json.load(f)
        meta["test_accuracy"] = round(float(accuracy), 4)
        meta["test_loss"] = round(float(loss), 4)
        meta["test_samples"] = int(len(X_test))
        meta["test_f1_macro"] = round(float(f1_macro), 4)
        with open(metadata_file, "w") as f:
            json.dump(meta, f, indent=2)


if __name__ == "__main__":
    evaluate()
