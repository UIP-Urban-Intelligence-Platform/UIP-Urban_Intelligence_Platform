#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DETR Accident Detection Model Download Script.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: scripts.download_accident_model
Author: Nguyen Nhat Quang
Created: 2025-11-26
Version: 1.0.0
License: MIT

Description:
    Downloads the pre-trained DETR accident detection model from HuggingFace.

    Model Details:
    - Model: hilmantm/detr-traffic-accident-detection
    - Architecture: DETR (DEtection TRansformer)
    - Framework: HuggingFace Transformers
    - License: Apache-2.0 (model), Apache-2.0 (transformers library)

    The model weights will be cached by HuggingFace Transformers automatically.

Usage:
    python scripts/download_accident_model.py
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


def download_accident_model():
    """Download DETR accident detection model from HuggingFace."""
    try:
        from transformers import AutoImageProcessor, AutoModelForObjectDetection

        model_name = "hilmantm/detr-traffic-accident-detection"

        print("📥 Downloading DETR accident detection model from HuggingFace...")
        print(f"   Model: {model_name}")
        print("   Architecture: DETR (DEtection TRansformer)")
        print("   License: Apache-2.0")
        print()

        # Download image processor
        print("📦 Downloading image processor...")
        AutoImageProcessor.from_pretrained(model_name)
        print("   ✅ Image processor ready")

        # Download model
        print("📦 Downloading model weights...")
        AutoModelForObjectDetection.from_pretrained(model_name)
        print("   ✅ Model weights ready")

        # Get cache location
        cache_dir = Path.home() / ".cache" / "huggingface" / "hub"
        print(f"\n🎯 Model cached at: {cache_dir}")

        return str(cache_dir)

    except ImportError:
        print("❌ Error: transformers package not installed")
        print("   Install with: pip install transformers torch")
        return None

    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        print("\n💡 Alternative approach:")
        print(
            "   1. Visit: https://huggingface.co/hilmantm/detr-traffic-accident-detection"
        )
        print("   2. Use model directly in code with AutoModel.from_pretrained()")
        return None


def check_transformers_installed():
    """Check if transformers package is installed."""
    try:
        import transformers

        print(
            f"✅ transformers package installed (version: {transformers.__version__})"
        )
        return True
    except ImportError:
        print("❌ transformers package not installed")
        print("\n📦 Installing transformers package...")
        import subprocess

        try:
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", "transformers", "torch"]
            )
            print("✅ transformers package installed successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to install transformers: {e}")
            return False


if __name__ == "__main__":
    print("=" * 70)
    print("DETR Accident Detection Model Downloader")
    print("=" * 70)
    print()

    # Check and install transformers if needed
    if not check_transformers_installed():
        print("\n⚠️ Please install transformers manually:")
        print("   pip install transformers torch")
        sys.exit(1)

    print()

    # Download model
    cache_path = download_accident_model()

    if cache_path:
        print("\n" + "=" * 70)
        print("✅ DOWNLOAD COMPLETE")
        print("=" * 70)
        print(f"\nModel cached by HuggingFace at: {cache_path}")
        print("\nTo use this model in accident detection:")
        print("   1. Ensure config/cv_config.yaml has accident_detection.enabled: true")
        print("   2. Model will be loaded automatically from HuggingFace cache")
        print("   3. Run accident detection agent")
    else:
        print("\n" + "=" * 70)
        print("⚠️ DOWNLOAD FAILED")
        print("=" * 70)
        print("\nPlease check your internet connection and try again.")
