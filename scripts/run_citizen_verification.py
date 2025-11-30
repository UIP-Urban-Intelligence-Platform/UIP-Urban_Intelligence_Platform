#!/usr/bin/env python3
"""
Citizen Report Verification Runner
Runs CV agent in citizen verification mode to process pending reports

Author: Nguyen Dinh Anh Tuan
Created: 2025-11-28
Modified: 2025-11-28
Version: 1.0.0
License: MIT

License: AGPL-3.0 (uses ultralytics/YOLOv8)
See LICENSE-AGPL-3.0 for full license text.
"""

import asyncio
import sys
import logging
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from src.agents.analytics.cv_analysis_agent import CVAnalysisAgent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def run_verification_cycle(agent: CVAnalysisAgent, max_cycles: int = None):
    """
    Run citizen report verification cycles.
    
    Args:
        agent: CVAnalysisAgent instance
        max_cycles: Maximum number of cycles to run (None = run once)
    """
    cycle = 0
    total_processed = 0
    
    while True:
        cycle += 1
        logger.info(f"\n{'='*80}")
        logger.info(f"🔄 Verification Cycle {cycle}")
        logger.info(f"{'='*80}\n")
        
        try:
            # Process citizen reports
            processed = await agent.process_citizen_reports()
            total_processed += processed
            
            logger.info(f"\n✅ Cycle {cycle} complete: {processed} reports processed")
            logger.info(f"📊 Total processed: {total_processed} reports\n")
            
            # Check if we should stop
            if processed == 0:
                logger.info("⏹️  No more pending reports found")
                break
            
            if max_cycles and cycle >= max_cycles:
                logger.info(f"⏹️  Reached max cycles ({max_cycles})")
                break
                
        except KeyboardInterrupt:
            logger.info("\n⏹️  Interrupted by user")
            break
        except Exception as e:
            logger.error(f"❌ Error in cycle {cycle}: {e}", exc_info=True)
            break
    
    # Summary
    logger.info(f"\n{'='*80}")
    logger.info(f"📊 VERIFICATION SUMMARY")
    logger.info(f"{'='*80}")
    logger.info(f"Total cycles: {cycle}")
    logger.info(f"Total reports processed: {total_processed}")
    logger.info(f"{'='*80}\n")


async def main():
    """Main entry point"""
    logger.info("="*80)
    logger.info("🚀 Citizen Report Verification Runner")
    logger.info("="*80)
    logger.info("Config: config/cv_config.yaml")
    logger.info("Mode: Citizen Verification Only")
    logger.info("="*80 + "\n")
    
    # Create agent
    config_path = 'config/cv_config.yaml'
    agent = CVAnalysisAgent(config_path)
    
    # Check if citizen verification is enabled
    if not agent.config.citizen_verification_enabled:
        logger.error("❌ Citizen verification is disabled in config!")
        logger.error("Enable it in config/cv_config.yaml:")
        logger.error("  cv_analysis:")
        logger.error("    citizen_verification:")
        logger.error("      enabled: true")
        return
    
    logger.info("✅ Citizen verification enabled")
    logger.info(f"📍 Stellio URL: {agent.config.citizen_verification_stellio_url}")
    logger.info(f"🔍 Query: {agent.config.citizen_verification_query}")
    logger.info(f"📦 Max batch size: {agent.config.citizen_verification_max_batch}")
    logger.info("")
    
    # Run verification cycles (process all pending reports)
    await run_verification_cycle(agent, max_cycles=None)


if __name__ == '__main__':
    asyncio.run(main())
