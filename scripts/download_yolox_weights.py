#!/usr/bin/env python3
"""
YOLOX Model Weights Downloader

Module: scripts.download_yolox_weights
Author: Nguyễn Nhật Quang
Created: 2025-12-1
Version: 1.0.0
License: MIT

Description:
Downloads pre-trained YOLOX weights from Megvii releases for object detection.
All models are licensed under Apache-2.0.

Usage:
    python scripts/download_yolox_weights.py [--model MODEL_NAME]
    
    Examples:
        python scripts/download_yolox_weights.py                    # Download yolox-s (default)
        python scripts/download_yolox_weights.py --model yolox-m    # Download yolox-m
        python scripts/download_yolox_weights.py --all              # Download all models

Copyright (c) 2024 Traffic LOD Pipeline Project Contributors
SPDX-License-Identifier: MIT
"""

import argparse
import hashlib
import os
import sys
from pathlib import Path
from urllib.request import urlretrieve
from urllib.error import URLError
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# YOLOX model information from official Megvii releases
# Source: https://github.com/Megvii-BaseDetection/YOLOX/releases
YOLOX_MODELS = {
    "yolox-nano": {
        "url": "https://github.com/Megvii-BaseDetection/YOLOX/releases/download/0.1.1rc0/yolox_nano.pth",
        "size_mb": 3.8,
        "description": "YOLOX-Nano - Smallest model, fastest inference",
        "mAP": 25.8,
    },
    "yolox-tiny": {
        "url": "https://github.com/Megvii-BaseDetection/YOLOX/releases/download/0.1.1rc0/yolox_tiny.pth",
        "size_mb": 19.0,
        "description": "YOLOX-Tiny - Small model, fast inference",
        "mAP": 32.8,
    },
    "yolox-s": {
        "url": "https://github.com/Megvii-BaseDetection/YOLOX/releases/download/0.1.1rc0/yolox_s.pth",
        "size_mb": 34.7,
        "description": "YOLOX-S - Small model, good balance of speed and accuracy",
        "mAP": 40.5,
    },
    "yolox-m": {
        "url": "https://github.com/Megvii-BaseDetection/YOLOX/releases/download/0.1.1rc0/yolox_m.pth",
        "size_mb": 96.3,
        "description": "YOLOX-M - Medium model, better accuracy",
        "mAP": 46.9,
    },
    "yolox-l": {
        "url": "https://github.com/Megvii-BaseDetection/YOLOX/releases/download/0.1.1rc0/yolox_l.pth",
        "size_mb": 206.2,
        "description": "YOLOX-L - Large model, high accuracy",
        "mAP": 49.7,
    },
    "yolox-x": {
        "url": "https://github.com/Megvii-BaseDetection/YOLOX/releases/download/0.1.1rc0/yolox_x.pth",
        "size_mb": 378.6,
        "description": "YOLOX-X - Extra large model, highest accuracy",
        "mAP": 51.1,
    },
}

# Default model
DEFAULT_MODEL = "yolox-s"

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "models"


def download_progress(block_num: int, block_size: int, total_size: int) -> None:
    """Display download progress."""
    if total_size > 0:
        percent = min(100, block_num * block_size * 100 / total_size)
        downloaded = min(total_size, block_num * block_size)
        downloaded_mb = downloaded / (1024 * 1024)
        total_mb = total_size / (1024 * 1024)
        sys.stdout.write(f"\rDownloading: {percent:.1f}% ({downloaded_mb:.1f}/{total_mb:.1f} MB)")
        sys.stdout.flush()


def get_file_hash(filepath: Path) -> str:
    """Calculate SHA256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def download_model(model_name: str, output_dir: Path, force: bool = False) -> bool:
    """
    Download a YOLOX model.
    
    Args:
        model_name: Name of the model (e.g., 'yolox-s')
        output_dir: Directory to save the model
        force: Force re-download even if file exists
        
    Returns:
        True if download was successful, False otherwise
    """
    if model_name not in YOLOX_MODELS:
        logger.error(f"Unknown model: {model_name}")
        logger.info(f"Available models: {', '.join(YOLOX_MODELS.keys())}")
        return False
    
    model_info = YOLOX_MODELS[model_name]
    url = model_info["url"]
    filename = url.split("/")[-1]
    output_path = output_dir / filename
    
    # Create output directory if needed
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if file already exists
    if output_path.exists() and not force:
        file_size_mb = output_path.stat().st_size / (1024 * 1024)
        expected_size_mb = model_info["size_mb"]
        
        # Verify file size (allow 5% tolerance)
        if abs(file_size_mb - expected_size_mb) / expected_size_mb < 0.05:
            logger.info(f"✅ {model_name} already exists at {output_path} ({file_size_mb:.1f} MB)")
            return True
        else:
            logger.warning(f"⚠️ File size mismatch for {model_name}. Re-downloading...")
    
    # Download the model
    logger.info(f"\n📥 Downloading {model_name}...")
    logger.info(f"   Description: {model_info['description']}")
    logger.info(f"   COCO mAP: {model_info['mAP']}%")
    logger.info(f"   Expected size: {model_info['size_mb']:.1f} MB")
    logger.info(f"   URL: {url}")
    logger.info(f"   Output: {output_path}")
    
    try:
        urlretrieve(url, output_path, download_progress)
        print()  # New line after progress
        
        # Verify download
        file_size_mb = output_path.stat().st_size / (1024 * 1024)
        logger.info(f"✅ Downloaded {model_name} successfully ({file_size_mb:.1f} MB)")
        
        return True
        
    except URLError as e:
        logger.error(f"❌ Failed to download {model_name}: {e}")
        if output_path.exists():
            output_path.unlink()
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error downloading {model_name}: {e}")
        if output_path.exists():
            output_path.unlink()
        return False


def list_models() -> None:
    """List all available YOLOX models."""
    print("\n" + "=" * 80)
    print("YOLOX Pre-trained Models (Apache-2.0 License)")
    print("Source: https://github.com/Megvii-BaseDetection/YOLOX")
    print("=" * 80)
    print(f"\n{'Model':<15} {'Size (MB)':<12} {'mAP (%)':<10} {'Description'}")
    print("-" * 80)
    
    for name, info in YOLOX_MODELS.items():
        print(f"{name:<15} {info['size_mb']:<12.1f} {info['mAP']:<10.1f} {info['description']}")
    
    print("-" * 80)
    print(f"Default model: {DEFAULT_MODEL}")
    print(f"Output directory: {OUTPUT_DIR}")
    print()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Download YOLOX pre-trained weights from Megvii releases",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python scripts/download_yolox_weights.py                    # Download yolox-s (default)
    python scripts/download_yolox_weights.py --model yolox-m    # Download yolox-m
    python scripts/download_yolox_weights.py --all              # Download all models
    python scripts/download_yolox_weights.py --list             # List available models
    
License Information:
    All YOLOX models are released under Apache-2.0 license by Megvii Inc.
    This is compatible with MIT license.
"""
    )
    
    parser.add_argument(
        "--model", "-m",
        type=str,
        default=DEFAULT_MODEL,
        help=f"Model to download (default: {DEFAULT_MODEL})"
    )
    
    parser.add_argument(
        "--all", "-a",
        action="store_true",
        help="Download all available models"
    )
    
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List available models"
    )
    
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=str(OUTPUT_DIR),
        help=f"Output directory (default: {OUTPUT_DIR})"
    )
    
    parser.add_argument(
        "--force", "-f",
        action="store_true",
        help="Force re-download even if file exists"
    )
    
    args = parser.parse_args()
    
    # List models
    if args.list:
        list_models()
        return 0
    
    output_dir = Path(args.output)
    
    # Download all models
    if args.all:
        logger.info("📦 Downloading all YOLOX models...")
        success_count = 0
        for model_name in YOLOX_MODELS:
            if download_model(model_name, output_dir, args.force):
                success_count += 1
        
        logger.info(f"\n✅ Downloaded {success_count}/{len(YOLOX_MODELS)} models")
        return 0 if success_count == len(YOLOX_MODELS) else 1
    
    # Download single model
    model_name = args.model.lower()
    if model_name not in YOLOX_MODELS:
        logger.error(f"Unknown model: {model_name}")
        list_models()
        return 1
    
    success = download_model(model_name, output_dir, args.force)
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
