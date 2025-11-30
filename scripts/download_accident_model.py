#!/usr/bin/env python3
"""YOLOv8 Accident Detection Model Download Script.

Module: scripts.download_accident_model
Author:Nguyễn Nhật Quang
Created: 2025-11-26
Version: 1.0.0
License: MIT

Description:
    Downloads the pre-trained YOLOv8 accident detection model from Roboflow Universe.
    
    Model Details:
    - Dataset: 3200+ accident images
    - Architecture: YOLOv8
    - Training: 25 epochs
    - Source: https://universe.roboflow.com/accident-detection-model/accident-detection-model
    - Model License: CC BY 4.0
    
    The downloaded weights will be saved to: assets/models/yolov8_accident.pt

Usage:
    python scripts/download_accident_model.py
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def download_accident_model():
    """Download YOLOv8 accident detection model from Roboflow."""
    try:
        from roboflow import Roboflow
        
        # Initialize Roboflow with API key
        rf = Roboflow(api_key="U3IeLPGogTCHbFe1xqlA")
        
        # Access the accident detection project
        project = rf.workspace("accident-detection-model").project("accident-detection-model")
        
        # Download the latest trained model version
        print("📥 Downloading accident detection model from Roboflow...")
        print("   Project: Accident detection model")
        print("   Dataset: 3200+ images")
        print("   Model: YOLOv8 (25 epochs)")
        print("   License: CC BY 4.0")
        print()
        
        # Get dataset version (usually version 2 has the trained model)
        version = project.version(2)
        
        # Download in YOLOv8 format
        dataset = version.download("yolov8")
        
        print(f"\n✅ Model downloaded to: {dataset.location}")
        print(f"   Looking for weights in: {dataset.location}/runs/detect/train/weights/best.pt")
        
        # Find the best.pt file
        weights_paths = [
            Path(dataset.location) / "runs" / "detect" / "train" / "weights" / "best.pt",
            Path(dataset.location) / "weights" / "best.pt",
            Path(dataset.location) / "best.pt"
        ]
        
        weights_file = None
        for path in weights_paths:
            if path.exists():
                weights_file = path
                break
        
        if weights_file:
            # Copy to assets/models/
            target_dir = project_root / "assets" / "models"
            target_dir.mkdir(parents=True, exist_ok=True)
            
            target_path = target_dir / "yolov8_accident.pt"
            
            import shutil
            shutil.copy(weights_file, target_path)
            
            print(f"\n🎯 Weights copied to: {target_path}")
            print(f"   File size: {target_path.stat().st_size / (1024*1024):.2f} MB")
            
            return str(target_path)
        else:
            print("\n⚠️ Could not find best.pt in downloaded dataset")
            print("   You may need to train the model or use Roboflow Inference API")
            
            # Alternative: Use Roboflow hosted inference
            print("\n💡 Alternative: Use Roboflow Hosted Inference API")
            print("   The model can be accessed via API without downloading weights:")
            print(f"   API Endpoint: {version.model}")
            
            return None
            
    except ImportError:
        print("❌ Error: roboflow package not installed")
        print("   Install with: pip install roboflow")
        return None
        
    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        print("\n💡 Alternative approach:")
        print("   1. Visit: https://universe.roboflow.com/accident-detection-model/accident-detection-model")
        print("   2. Use 'Download Dataset' → YOLOv8 format")
        print("   3. Or use Roboflow Inference API for hosted inference")
        return None

def check_roboflow_installed():
    """Check if roboflow package is installed."""
    try:
        import roboflow
        print(f"✅ roboflow package installed (version: {roboflow.__version__})")
        return True
    except ImportError:
        print("❌ roboflow package not installed")
        print("\n📦 Installing roboflow package...")
        import subprocess
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "roboflow"])
            print("✅ roboflow package installed successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to install roboflow: {e}")
            return False

if __name__ == "__main__":
    print("=" * 70)
    print("YOLOv8 Accident Detection Model Downloader")
    print("=" * 70)
    print()
    
    # Check and install roboflow if needed
    if not check_roboflow_installed():
        print("\n⚠️ Please install roboflow manually:")
        print("   pip install roboflow")
        sys.exit(1)
    
    print()
    
    # Download model
    weights_path = download_accident_model()
    
    if weights_path:
        print("\n" + "=" * 70)
        print("✅ DOWNLOAD COMPLETE")
        print("=" * 70)
        print(f"\nModel weights saved to: {weights_path}")
        print("\nTo use this model in accident detection:")
        print("   1. Update config/accident_config.yaml")
        print("   2. Set model_weights: 'assets/models/yolov8_accident.pt'")
        print("   3. Run accident detection agent")
    else:
        print("\n" + "=" * 70)
        print("⚠️ DOWNLOAD FAILED - Using Alternative")
        print("=" * 70)
        print("\nYou can use Roboflow Hosted Inference instead:")
        print("   - No weight file needed")
        print("   - Inference runs on Roboflow cloud")
        print("   - API key: U3IeLPGogTCHbFe1xqlA")
