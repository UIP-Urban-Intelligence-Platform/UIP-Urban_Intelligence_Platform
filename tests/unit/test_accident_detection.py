"""
Test YOLO Accident Detection Model
Author: nguyễn Nhật Quang
Created: 2025-11-21
Quick test script to verify the downloaded accident detection model works correctly.
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def test_model_exists():
    """Check if accident detection model exists."""
    model_path = project_root / "assets" / "models" / "yolov8_accident.pt"
    
    print("=" * 70)
    print("YOLOv8 Accident Detection Model Test")
    print("=" * 70)
    print()
    
    if model_path.exists():
        size_mb = model_path.stat().st_size / (1024 * 1024)
        print(f"✅ Model file found: {model_path}")
        print(f"   Size: {size_mb:.2f} MB")
        return True
    else:
        print(f"❌ Model file not found: {model_path}")
        print()
        print("Please download the model first:")
        print("   python scripts/download_accident_model.py")
        print()
        print("Or download manually from:")
        print("   https://github.com/shyamg090/Vision_Based_Accident_Detection/raw/main/best.pt")
        return False

def test_model_loading():
    """Test loading the YOLO model."""
    try:
        from ultralytics import YOLO
        print()
        print("Testing model loading...")
        
        model_path = project_root / "assets" / "models" / "yolov8_accident.pt"
        model = YOLO(str(model_path))
        
        print(f"✅ Model loaded successfully!")
        print(f"   Model type: {type(model).__name__}")
        
        # Get model info
        if hasattr(model, 'names'):
            print(f"   Classes: {model.names}")
        
        return True
        
    except ImportError:
        print()
        print("❌ ultralytics package not installed")
        print("   Install with: pip install ultralytics")
        return False
    except Exception as e:
        print()
        print(f"❌ Failed to load model: {e}")
        return False

def test_accident_detector():
    """Test AccidentDetector class."""
    try:
        from src.agents.analytics.cv_analysis_agent import AccidentDetector
        from PIL import Image
        import numpy as np
        
        print()
        print("Testing AccidentDetector class...")
        
        # Create test configuration
        config = {
            'weights': 'assets/models/yolov8_accident.pt',
            'confidence': 0.4,
            'device': 'cpu',
            'severity_thresholds': {
                'minor': 0.4,
                'moderate': 0.6,
                'severe': 0.8
            }
        }
        
        # Initialize detector
        detector = AccidentDetector(config)
        
        if detector.is_enabled():
            print("✅ AccidentDetector initialized successfully")
            print(f"   Confidence threshold: {detector.confidence}")
            print(f"   Device: {detector.device}")
            
            # Create dummy image for testing
            print()
            print("Creating test image...")
            dummy_image = Image.fromarray(np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8))
            
            # Test detection (should return empty for random image)
            detections = detector.detect(dummy_image)
            print(f"✅ Detection test passed (found {len(detections)} accidents in random image)")
            
            return True
        else:
            print("❌ AccidentDetector failed to initialize")
            return False
            
    except Exception as e:
        print()
        print(f"❌ AccidentDetector test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_cv_analysis_integration():
    """Test accident detection integration in CVAnalysisAgent."""
    try:
        print()
        print("Testing CVAnalysisAgent integration...")
        
        # Check config
        config_path = project_root / "config" / "cv_config.yaml"
        
        import yaml
        with open(config_path) as f:
            config = yaml.safe_load(f)
        
        accident_config = config.get('cv_analysis', {}).get('accident_detection', {})
        
        if accident_config.get('enabled'):
            print("✅ Accident detection enabled in cv_config.yaml")
            print(f"   Model: {accident_config.get('model', {}).get('weights')}")
            print(f"   Confidence: {accident_config.get('model', {}).get('confidence')}")
        else:
            print("⚠️ Accident detection disabled in cv_config.yaml")
            print("   Enable it by setting accident_detection.enabled: true")
        
        return True
        
    except Exception as e:
        print()
        print(f"❌ Integration test failed: {e}")
        return False

if __name__ == "__main__":
    results = []
    
    # Test 1: Model file exists
    results.append(("Model file exists", test_model_exists()))
    
    # Test 2: Model loading
    if results[0][1]:
        results.append(("Model loading", test_model_loading()))
    
    # Test 3: AccidentDetector class
    if results[0][1]:
        results.append(("AccidentDetector class", test_accident_detector()))
    
    # Test 4: CVAnalysisAgent integration
    results.append(("CVAnalysisAgent integration", test_cv_analysis_integration()))
    
    # Summary
    print()
    print("=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(r[1] for r in results)
    
    print()
    if all_passed:
        print("🎉 All tests passed! Accident detection is ready to use.")
        print()
        print("To use accident detection:")
        print("   1. Ensure accident_detection.enabled: true in config/cv_config.yaml")
        print("   2. Run CV analysis agent as normal")
        print("   3. Accident detections will be logged and added to analysis results")
    else:
        print("⚠️ Some tests failed. Please fix the issues above.")
    
    sys.exit(0 if all_passed else 1)
