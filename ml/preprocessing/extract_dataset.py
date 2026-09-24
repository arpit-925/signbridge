"""
SignBridge AI - Dataset Extraction Script
Safely extracts ml/dataset/raw/Dataset.zip into ml/dataset/extracted/
"""

import os
import sys
import zipfile
from collections import Counter
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_ZIP = BASE_DIR / "dataset" / "raw" / "Dataset.zip"
EXTRACT_DIR = BASE_DIR / "dataset" / "extracted"


def extract_dataset(force: bool = False):
    """
    Safely extract Dataset.zip into dataset/extracted/
    Avoids redundant extraction if files are already present.
    """
    print("=" * 60)
    print("SignBridge AI - ISL Dataset Extraction")
    print("=" * 60)

    if not RAW_ZIP.exists():
        print(f"[ERROR] Raw dataset ZIP not found at: {RAW_ZIP}")
        sys.exit(1)

    EXTRACT_DIR.mkdir(parents=True, exist_ok=True)

    # Check if already extracted
    existing_files = list(EXTRACT_DIR.glob("**/*.jpg"))
    if existing_files and not force:
        print(f"[INFO] Dataset already extracted ({len(existing_files)} images found).")
        print(f"[INFO] Skipping re-extraction. Use --force to overwrite.")
        return print_summary()

    print(f"[INFO] Source ZIP: {RAW_ZIP}")
    print(f"[INFO] Destination: {EXTRACT_DIR}")
    print(f"[INFO] Extracting archive... (this may take a minute)")

    corrupt_count = 0
    extracted_count = 0

    with zipfile.ZipFile(RAW_ZIP, "r") as archive:
        members = [m for m in archive.infolist() if not m.is_dir()]
        total_members = len(members)

        for idx, member in enumerate(members, 1):
            try:
                archive.extract(member, EXTRACT_DIR)
                extracted_count += 1
            except Exception as e:
                print(f"[WARN] Failed extracting {member.filename}: {e}")
                corrupt_count += 1

            if idx % 5000 == 0 or idx == total_members:
                print(f"  Progress: {idx}/{total_members} files extracted ({idx / total_members * 100:.1f}%)")

    print("\n[SUCCESS] Extraction complete!")
    if corrupt_count > 0:
        print(f"[WARN] Corrupt or failed files: {corrupt_count}")

    print_summary()


def print_summary():
    """Prints detailed directory and class breakdown of extracted images."""
    print("-" * 60)
    print("DATASET EXTRACTION SUMMARY")
    print("-" * 60)

    splits = ["Training", "Validation", "Testing", "Letters"]
    total_images = 0

    for split in splits:
        split_dir = EXTRACT_DIR / split
        if not split_dir.exists():
            continue

        images = list(split_dir.glob("**/*.jpg"))
        total_images += len(images)
        classes = sorted([d.name for d in split_dir.iterdir() if d.is_dir()])

        if classes:
            print(f"Split: {split:<12} | Classes: {len(classes):<3} | Total Images: {len(images)}")
            class_counts = {c: len(list((split_dir / c).glob("*.jpg"))) for c in classes}
            min_c = min(class_counts.values())
            max_c = max(class_counts.values())
            print(f"  Class range: {min_c} to {max_c} images per class")
            print(f"  Classes: {', '.join(classes[:10])}... ({len(classes)} total)")
        else:
            print(f"Directory: {split:<8} | Reference Images: {len(images)}")

    print(f"\nTotal Images Extracted: {total_images}")
    print("=" * 60)


if __name__ == "__main__":
    force_run = "--force" in sys.argv
    extract_dataset(force=force_run)
