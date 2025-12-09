"""
Clean cameras_enriched.json by removing null values and publish to Stellio
"""

import json
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

from agents.context_management.entity_publisher_agent import EntityPublisherAgent


def remove_null_values(obj):
    """Recursively remove null values from dict or list"""
    if isinstance(obj, dict):
        return {k: remove_null_values(v) for k, v in obj.items() if v is not None}
    elif isinstance(obj, list):
        return [remove_null_values(item) for item in obj if item is not None]
    else:
        return obj


def main():
    input_file = Path(__file__).parent.parent / "data" / "cameras_enriched.json"
    output_file = Path(__file__).parent.parent / "data" / "cameras_cleaned.json"
    
    print(f"Loading cameras from {input_file}")
    with open(input_file, "r", encoding="utf-8") as f:
        cameras = json.load(f)
    
    print(f"Found {len(cameras)} cameras")
    print("Removing null values...")
    
    # Clean all cameras
    cameras_cleaned = [remove_null_values(camera) for camera in cameras]
    
    # Save cleaned version
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(cameras_cleaned, f, indent=2, ensure_ascii=False)
    
    print(f"Saved cleaned cameras to {output_file}")
    
    # Publish to Stellio
    print("\nPublishing to Stellio...")
    agent = EntityPublisherAgent()
    report = agent.publish(input_file=str(output_file))
    
    print(f"\n✅ Success: {report.successful_entities}")
    print(f"❌ Failed: {report.failed_entities}")
    
    if report.failed_entities > 0:
        print("\nFailed entities saved to data/failed_entities.json")


if __name__ == "__main__":
    main()
