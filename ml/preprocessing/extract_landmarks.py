"""
SignBridge AI - High-Throughput Landmark Extraction Pipeline
Uses MediaPipe HandLandmarker to extract 21 normalized landmarks (63 features) from images.
Leverages multi-threading across CPU cores for fast batch processing.
Outputs:
  - ml/dataset/processed/train.csv
  - ml/dataset/processed/validation.csv
  - ml/dataset/processed/test.csv
  - ml/dataset/processed/landmarks.csv (combined)
  - ml/dataset/processed/preprocessing_report.json
"""

import os
import sys
import json
import time
import threading
from pathlib import Path
from typing import Dict, List, Tuple
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
import cv2

# Path setup
BASE_DIR = Path(__file__).resolve().parent.parent
EXTRACT_DIR = BASE_DIR / "dataset" / "extracted"
PROCESSED_DIR = BASE_DIR / "dataset" / "processed"

# Import normalization logic
sys.path.append(str(BASE_DIR))
from preprocessing.preprocess import normalize_landmarks, create_hand_detector, extract_landmarks_from_image

# Thread-local detector store
_thread_local = threading.local()


def get_thread_detector():
    """Retrieves or creates a thread-local hand detector."""
    if not hasattr(_thread_local, "detector"):
        _thread_local.detector = create_hand_detector()
    return _thread_local.detector


def generate_feature_columns() -> List[str]:
    """Generates column names: x0, y0, z0, ..., x20, y20, z20, label"""
    cols = []
    for i in range(21):
        cols.extend([f"x{i}", f"y{i}", f"z{i}"])
    cols.append("label")
    return cols


def _process_single_image(args: Tuple[str, str]) -> Tuple[bool, list, str]:
    """Worker function for single image feature extraction."""
    img_path, cls_name = args
    img_bgr = cv2.imread(img_path)
    if img_bgr is None:
        return False, None, cls_name

    detector = get_thread_detector()
    features = extract_landmarks_from_image(img_bgr, detector)

    if features is None:
        return False, None, cls_name

    row = list(features) + [cls_name]
    return True, row, cls_name


def process_split_directory(split_dir: Path, max_samples_per_class: int = None, workers: int = 8) -> Tuple[List[list], Dict]:
    """
    Processes all class subdirectories inside a split directory in parallel.
    """
    classes = sorted([d.name for d in split_dir.iterdir() if d.is_dir()])
    stats = {
        "split": split_dir.name,
        "classes": classes,
        "total_images": 0,
        "valid_samples": 0,
        "failed_samples": 0,
        "failure_rate": 0.0,
        "per_class": {}
    }

    print(f"\nProcessing split: {split_dir.name} ({len(classes)} classes, workers={workers})...")

    # Gather tasks
    tasks = []
    class_targets = {}
    for cls_name in classes:
        cls_dir = split_dir / cls_name
        img_paths = sorted(list(cls_dir.glob("*.jpg")))
        if max_samples_per_class and max_samples_per_class > 0:
            img_paths = img_paths[:max_samples_per_class]

        class_targets[cls_name] = len(img_paths)
        for p in img_paths:
            tasks.append((str(p), cls_name))

    stats["total_images"] = len(tasks)
    print(f"  Queued {len(tasks)} images across {len(classes)} classes")

    # Execute in parallel
    records = []
    cls_valid_map = {c: 0 for c in classes}
    cls_failed_map = {c: 0 for c in classes}

    t0 = time.time()
    with ThreadPoolExecutor(max_workers=workers) as executor:
        for is_valid, row, cls_name in executor.map(_process_single_image, tasks):
            if is_valid:
                records.append(row)
                cls_valid_map[cls_name] += 1
                stats["valid_samples"] += 1
            else:
                cls_failed_map[cls_name] += 1
                stats["failed_samples"] += 1

    elapsed = time.time() - t0
    rate = len(tasks) / elapsed if elapsed > 0 else 0
    print(f"  Completed {split_dir.name} in {elapsed:.1f}s ({rate:.1f} img/s)")

    for c in classes:
        total_c = class_targets[c]
        valid_c = cls_valid_map[c]
        failed_c = cls_failed_map[c]
        fail_pct = (failed_c / total_c * 100) if total_c > 0 else 0
        stats["per_class"][c] = {
            "total": total_c,
            "valid": valid_c,
            "failed": failed_c,
            "failure_rate_pct": round(fail_pct, 2)
        }

    if stats["total_images"] > 0:
        stats["failure_rate"] = round(stats["failed_samples"] / stats["total_images"] * 100, 2)

    print(f"  [{split_dir.name} Summary] Valid: {stats['valid_samples']}/{stats['total_images']} ({stats['failure_rate']}% failed)")
    return records, stats


def run_pipeline(train_limit: int = 150, val_limit: int = 40, test_limit: int = 50, workers: int = 8):
    """Executes landmark extraction across all dataset splits and saves CSV files."""
    start_time = time.time()
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("SignBridge AI - Landmark Extraction & Normalization")
    print("=" * 60)
    print(f"Settings: Train limit={train_limit}/class, Val limit={val_limit}/class, Test limit={test_limit}/class, Workers={workers}")

    columns = generate_feature_columns()
    all_stats = {}
    all_records = []

    split_configs = [
        ("Training", train_limit, "train.csv"),
        ("Validation", val_limit, "validation.csv"),
        ("Testing", test_limit, "test.csv")
    ]

    for split_name, limit, csv_name in split_configs:
        split_dir = EXTRACT_DIR / split_name
        if not split_dir.exists():
            print(f"[WARN] Split directory not found: {split_dir}")
            continue

        records, stats = process_split_directory(split_dir, max_samples_per_class=limit, workers=workers)
        all_stats[split_name] = stats
        all_records.extend(records)

        # Save split CSV
        df = pd.DataFrame(records, columns=columns)
        out_csv = PROCESSED_DIR / csv_name
        df.to_csv(out_csv, index=False)
        print(f"[SAVED] {out_csv} ({len(df)} samples)")

    # Save combined landmarks CSV
    combined_df = pd.DataFrame(all_records, columns=columns)
    combined_csv = PROCESSED_DIR / "landmarks.csv"
    combined_df.to_csv(combined_csv, index=False)
    print(f"[SAVED] {combined_csv} ({len(combined_df)} total samples)")

    # Summary report
    total_imgs = sum(s["total_images"] for s in all_stats.values())
    total_valid = sum(s["valid_samples"] for s in all_stats.values())
    total_failed = sum(s["failed_samples"] for s in all_stats.values())
    overall_fail_rate = (total_failed / total_imgs * 100) if total_imgs > 0 else 0

    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_images_processed": total_imgs,
        "valid_samples_extracted": total_valid,
        "failed_detections": total_failed,
        "overall_failure_percentage": round(overall_fail_rate, 2),
        "feature_count": 63,
        "normalization": "wrist_relative_max_euclidean_distance",
        "splits": all_stats
    }

    report_path = PROCESSED_DIR / "preprocessing_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"[SAVED] Preprocessing report: {report_path}")

    elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print("EXTRACTION COMPLETE")
    print(f"Total images:             {total_imgs}")
    print(f"Valid landmark samples:   {total_valid}")
    print(f"Failed samples:           {total_failed}")
    print(f"Failure percentage:       {overall_fail_rate:.2f}%")
    print(f"Time elapsed:             {elapsed:.1f}s")
    print("=" * 60)


if __name__ == "__main__":
    t_lim = 150
    v_lim = 40
    te_lim = 50

    if "--full" in sys.argv:
        t_lim = None
        v_lim = None
        te_lim = None
    elif "--sample" in sys.argv:
        idx = sys.argv.index("--sample")
        sample_val = int(sys.argv[idx + 1])
        t_lim = sample_val
        v_lim = sample_val
        te_lim = sample_val

    run_pipeline(train_limit=t_lim, val_limit=v_lim, test_limit=te_lim, workers=8)
