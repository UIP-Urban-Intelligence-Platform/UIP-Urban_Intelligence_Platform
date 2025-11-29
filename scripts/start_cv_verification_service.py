#!/usr/bin/env python3
"""
CV Agent Citizen Verification Background Service
Module: scripts.start_cv_verification_service.py
Author: nguyễn Nhật Quang
Created: 2025-11-23
Version: 1.0.0
License: AGPL-3.0 (uses ultralytics/YOLOv8)
See LICENSE-AGPL-3.0 for full license text.
Description:
Chạy như một daemon để liên tục verify citizen reports từ Stellio.
Poll Stellio mỗi 30 giây để tìm reports chưa được verify (aiVerified=false).

Usage:
    python scripts/start_cv_verification_service.py
"""

import sys
import time
import asyncio
import yaml
import logging
from pathlib import Path
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.agents.analytics.cv_analysis_agent import CVAnalysisAgent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/cv_verification_service.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


async def verification_loop(agent: CVAnalysisAgent, poll_interval: int = 30):
    """
    Main verification loop - Poll Stellio và verify reports
    
    Args:
        agent: CV Analysis Agent instance
        poll_interval: Seconds between polls (default 30s)
    """
    logger.info(f"🤖 CV Verification Service started - Polling every {poll_interval}s")
    
    iteration = 0
    
    while True:
        iteration += 1
        start_time = time.time()
        
        try:
            logger.info(f"\n{'='*80}")
            logger.info(f"Iteration #{iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            logger.info(f"{'='*80}")
            
            # Query and process unverified citizen reports
            processed_count = await agent.process_citizen_reports()
            
            elapsed = time.time() - start_time
            
            if processed_count > 0:
                logger.info(f"✅ Processed {processed_count} reports in {elapsed:.2f}s")
            else:
                logger.info(f"💤 No unverified reports found (checked in {elapsed:.2f}s)")
            
            # Wait before next poll
            logger.info(f"⏱️  Next poll in {poll_interval}s...\n")
            await asyncio.sleep(poll_interval)
            
        except KeyboardInterrupt:
            logger.info("\n🛑 Service stopped by user")
            break
            
        except Exception as e:
            logger.error(f"❌ Error in verification loop: {e}", exc_info=True)
            logger.info(f"🔄 Retrying in {poll_interval}s...")
            await asyncio.sleep(poll_interval)


def main():
    """Main entry point"""
    
    # Load CV config
    config_path = Path(__file__).parent / 'config' / 'cv_config.yaml'
    
    logger.info("📋 Loading CV config...")
    with open(config_path, 'r', encoding='utf-8') as f:
        cv_config = yaml.safe_load(f)
    
    # Check if citizen verification is enabled
    citizen_config = cv_config.get('cv_analysis', {}).get('citizen_verification', {})
    
    if not citizen_config.get('enabled', False):
        logger.error("❌ Citizen verification is disabled in cv_config.yaml!")
        logger.info("   Set citizen_verification.enabled = true to enable")
        sys.exit(1)
    
    poll_interval = citizen_config.get('poll_interval', 30)
    
    logger.info(f"✅ Citizen verification enabled")
    logger.info(f"   Poll interval: {poll_interval}s")
    logger.info(f"   Stellio URL: {citizen_config.get('stellio_url', 'N/A')}")
    logger.info(f"   Max batch: {citizen_config.get('max_reports_per_batch', 10)}")
    
    # Create CV Agent
    logger.info("\n🚀 Initializing CV Analysis Agent...")
    agent = CVAnalysisAgent(config_path)
    
    # Create logs directory if not exists
    Path("logs").mkdir(exist_ok=True)
    
    # Start verification loop
    try:
        asyncio.run(verification_loop(agent, poll_interval))
    except KeyboardInterrupt:
        logger.info("\n👋 Service shutdown complete")


if __name__ == '__main__':
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║              CV AGENT - CITIZEN VERIFICATION BACKGROUND SERVICE              ║
║                                                                              ║
║  This service continuously polls Stellio for unverified citizen reports      ║
║  and updates them with AI verification results (aiConfidence, aiVerified).   ║
║                                                                              ║
║  Press Ctrl+C to stop                                                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    main()
