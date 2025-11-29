#!/usr/bin/env python3
"""
Module: tests.test_citizen_complete_workflow.py
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-25
Version: 1.0.0
License: MIT
Description:
Test COMPLETE Citizen Workflow với AI Verification

Workflow:
1. Send citizen report → Citizen API
2. Background enrichment (Weather + AQ)
3. Save to Stellio (aiVerified=false, aiConfidence=0.0)
4. CV Agent verify image với YOLOv8
5. Update Stellio (aiVerified=true, aiConfidence=0.X)
Usage:
    python tests/test_citizen_complete_workflow.py
"""

import sys
import time
import json
import requests
from pathlib import Path
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

CITIZEN_API = "http://localhost:8001/api/v1/citizen-reports"
STELLIO_URL = "http://localhost:8080/ngsi-ld/v1/entities"

def print_step(step_num, title):
    print(f"\n{'='*80}")
    print(f"  BƯỚC {step_num}: {title}")
    print(f"{'='*80}\n")

def send_citizen_report():
    """Bước 1: Gửi citizen report"""
    print_step(1, "GỬI CITIZEN REPORT VỚI HÌNH ẢNH")
    
    report = {
        "userId": f"user_ai_test_{datetime.now().strftime('%H%M%S')}",
        "reportType": "accident",
        "description": "Tai nạn giao thông - Test AI verification với YOLOv8",
        "latitude": 10.7769,
        "longitude": 106.7009,
        "imageUrl": r"D:\\olp\\Builder-Layer-End\\data\\cache\\images\\0a4a8e14ac85d9b23831aeca35c27576.jpg"
    }
    
    print(f"📤 Sending POST to {CITIZEN_API}")
    print(f"📝 Report type: {report['reportType']}")
    
    response = requests.post(CITIZEN_API, json=report, timeout=30)
    
    if response.status_code == 202:
        data = response.json()
        print(f"✅ Response: {response.status_code} Accepted")
        print(f"📋 Report ID: {data['reportId']}")
        return data['reportId']
    else:
        print(f"❌ Failed: {response.status_code}")
        return None

def wait_background_processing():
    """Bước 2: Chờ background processing"""
    print_step(2, "CHỜ BACKGROUND ENRICHMENT")
    
    print("⚙️  Processing:")
    print("  - Weather API enrichment")
    print("  - Air Quality API enrichment")
    print("  - NGSI-LD transformation")
    print("  - Publishing to Stellio")
    
    for i in range(5, 0, -1):
        print(f"\r⏱️  {i} seconds...", end="", flush=True)
        time.sleep(1)
    print("\n✅ Done!")

def verify_stellio_initial_state():
    """Bước 3: Verify initial state trong Stellio"""
    print_step(3, "KIỂM TRA INITIAL STATE (aiVerified=false)")
    
    url = f"{STELLIO_URL}?type=CitizenObservation&limit=1"
    response = requests.get(url, headers={"Accept": "application/ld+json"}, timeout=10)
    
    if response.status_code == 200:
        entities = response.json()
        if entities:
            entity = entities[0]
            ai_verified = entity.get('aiVerified', {}).get('value', None)
            ai_confidence = entity.get('aiConfidence', {}).get('value', None)
            status = entity.get('status', {}).get('value', 'N/A')
            
            print(f"📊 Entity ID: {entity['id']}")
            print(f"   Status: {status}")
            print(f"   aiVerified: {ai_verified}")
            print(f"   aiConfidence: {ai_confidence}")
            
            if ai_verified == False and ai_confidence == 0.0:
                print("\n✅ ĐÚNG! Initial state là aiVerified=false, aiConfidence=0.0")
                return entity['id']
            else:
                print("\n⚠️  Unexpected state!")
                return entity['id']
    
    return None

def run_cv_agent_verification():
    """Bước 4: Chạy CV Agent để verify"""
    print_step(4, "CHẠY CV AGENT ĐỂ VERIFY HÌNH ẢNH")
    
    print("🤖 Starting CV Agent citizen verification...")
    print("   - Query unverified reports (aiVerified=false)")
    print("   - Download image từ imageSnapshot")
    print("   - Run YOLOv8 object detection")
    print("   - Calculate confidence score")
    print("   - PATCH Stellio với kết quả")
    
    try:
        # Import CV Agent directly without config_loader
        from agents.analytics.cv_analysis_agent import CVAnalysisAgent
        import yaml
        
        # Load config manually
        config_path = Path(__file__).parent / 'config' / 'cv_config.yaml'
        with open(config_path, 'r', encoding='utf-8') as f:
            cv_config = yaml.safe_load(f)
        
        # Initialize CV Agent
        agent = CVAnalysisAgent(cv_config)
        
        print("\n🔄 Processing citizen reports...")
        
        # Run verification loop (async function)
        import asyncio
        
        # Get or create event loop
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        processed_count = loop.run_until_complete(agent.process_citizen_reports())
        
        print(f"\n✅ Processed {processed_count} reports")
        return processed_count > 0
        
    except ImportError as e:
        print(f"\n❌ Cannot import CV Agent: {e}")
        print("   Trying alternative import...")
        
        try:
            # Alternative: Import from src package
            import sys
            sys.path.insert(0, str(Path(__file__).parent))
            from src.agents.analytics.cv_analysis_agent import CVAnalysisAgent
            import yaml
            
            config_path = Path(__file__).parent / 'config' / 'cv_config.yaml'
            with open(config_path, 'r', encoding='utf-8') as f:
                cv_config = yaml.safe_load(f)
            
            agent = CVAnalysisAgent(cv_config)
            
            import asyncio
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            processed_count = loop.run_until_complete(agent.process_citizen_reports())
            print(f"\n✅ Processed {processed_count} reports")
            return processed_count > 0
            
        except Exception as e2:
            print(f"   ❌ Alternative import also failed: {e2}")
            print("   CV Agent verification skipped")
            return False
        
    except Exception as e:
        print(f"\n❌ Error running CV Agent: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_stellio_final_state(entity_id):
    """Bước 5: Verify final state sau AI verification"""
    print_step(5, "KIỂM TRA FINAL STATE SAU AI VERIFICATION")
    
    url = f"{STELLIO_URL}/{entity_id}"
    response = requests.get(url, headers={"Accept": "application/ld+json"}, timeout=10)
    
    if response.status_code == 200:
        entity = response.json()
        
        ai_verified = entity.get('aiVerified', {}).get('value', None)
        ai_confidence = entity.get('aiConfidence', {}).get('value', None)
        status = entity.get('status', {}).get('value', 'N/A')
        ai_metadata = entity.get('aiMetadata', {}).get('value', {})
        
        print(f"📊 Entity ID: {entity['id']}")
        print(f"   Status: {status}")
        print(f"   aiVerified: {ai_verified}")
        print(f"   aiConfidence: {ai_confidence}")
        
        if ai_metadata:
            print(f"\n🤖 AI Metadata:")
            print(f"   - Vehicle count: {ai_metadata.get('vehicle_count', 'N/A')}")
            print(f"   - Person count: {ai_metadata.get('person_count', 'N/A')}")
            print(f"   - Detected classes: {ai_metadata.get('detected_classes', [])}")
            print(f"   - Avg confidence: {ai_metadata.get('avg_detection_confidence', 'N/A')}")
            
            if 'accident_detected' in ai_metadata:
                print(f"   - Accident detected: {ai_metadata['accident_detected']}")
                print(f"   - Accident confidence: {ai_metadata.get('accident_confidence', 'N/A')}")
        
        # Save to file
        output_file = Path("data") / f"citizen_ai_verified_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        output_file.parent.mkdir(exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(entity, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Saved to: {output_file}")
        
        # Check if AI verification worked
        if ai_verified == True and ai_confidence > 0.0:
            print(f"\n🎉 AI VERIFICATION THÀNH CÔNG!")
            print(f"   aiConfidence đã được update từ 0.0 → {ai_confidence}")
            return True
        else:
            print(f"\n⚠️  AI verification chưa chạy hoặc failed")
            return False
    else:
        print(f"❌ Cannot query entity: {response.status_code}")
        return False

def explain_workflow():
    """Giải thích tại sao aiConfidence ban đầu là 0.0"""
    print("\n" + "="*80)
    print("  TẠI SAO aiConfidence BAN ĐẦU LÀ 0.0?")
    print("="*80 + "\n")
    
    print("📌 WORKFLOW HOÀN CHỈNH:")
    print()
    print("1️⃣  USER GỬI REPORT")
    print("    ↓")
    print("    POST /citizen-reports với 6 fields:")
    print("    - userId, reportType, description")
    print("    - latitude, longitude, imageUrl")
    print()
    print("2️⃣  CITIZEN API XỬ LÝ")
    print("    ↓")
    print("    Background task:")
    print("    - Gọi Weather API → get temperature, humidity, wind")
    print("    - Gọi Air Quality API → get AQI, PM2.5, PM10")
    print("    - Transform to NGSI-LD")
    print()
    print("3️⃣  LƯU VÀO STELLIO (INITIAL STATE)")
    print("    ↓")
    print("    Entity được tạo với:")
    print("    - status: 'pending_verification'")
    print("    - aiVerified: false")
    print("    - aiConfidence: 0.0  ← CHƯA CÓ AI XỬ LÝ!")
    print("    → Đây là initial state, chưa có AI verify hình ảnh")
    print()
    print("4️⃣  CV AGENT POLL STELLIO")
    print("    ↓")
    print("    Định kỳ mỗi 30s CV Agent chạy:")
    print("    - Query: type=CitizenObservation&q=aiVerified==false")
    print("    - Download image từ imageSnapshot URL")
    print("    - Run YOLOv8 object detection")
    print("    - Nếu reportType=accident → Run AccidentDetector")
    print("    - Calculate confidence score (0.0-1.0)")
    print()
    print("5️⃣  UPDATE STELLIO (FINAL STATE)")
    print("    ↓")
    print("    PATCH entity với:")
    print("    - aiVerified: true")
    print("    - aiConfidence: 0.X  ← AI ĐÃ TÍNH CONFIDENCE!")
    print("    - status: 'verified' hoặc 'rejected'")
    print("    - aiMetadata: {detections, vehicle_count, ...}")
    print()
    print("🎯 KẾT LUẬN:")
    print("   - Ban đầu aiConfidence=0.0 là ĐÚNG")
    print("   - Phải chạy CV Agent mới có confidence thật")
    print("   - Test hiện tại chỉ đến bước 3 (lưu Stellio)")
    print("   - Cần thêm bước 4-5 để có AI verification\n")

def main():
    print("\n" + "="*80)
    print("  CITIZEN SCIENCE - COMPLETE WORKFLOW WITH AI VERIFICATION")
    print("="*80)
    
    # Explain first
    explain_workflow()
    
    input("\nPress ENTER to start test...")
    
    # Step 1: Send report
    report_id = send_citizen_report()
    if not report_id:
        print("\n❌ Test failed at step 1")
        return
    
    # Step 2: Wait
    wait_background_processing()
    
    # Step 3: Verify initial state
    entity_id = verify_stellio_initial_state()
    if not entity_id:
        print("\n❌ Cannot query Stellio")
        return
    
    # Step 4: Run CV Agent automatically
    print("\n" + "-"*80)
    print("🤖 TỰ ĐỘNG CHẠY CV AGENT VERIFICATION...")
    print("-"*80)
    
    success = run_cv_agent_verification()
    
    if success:
        # Wait for processing
        print("\n⏱️  Waiting for CV Agent to process...")
        time.sleep(3)
        
        # Step 5: Verify final state
        verify_stellio_final_state(entity_id)
    else:
        print("\n⚠️  CV Agent verification failed or skipped")
        print("   aiConfidence vẫn là 0.0 (initial state)")
    
    print("\n" + "="*80)
    print("  TEST COMPLETED")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
