#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Main Application Entry Point - LOD Pipeline System.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: main
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-28
Version: 1.0.0
License: MIT

Description:
    Unified entry point for the LOD Pipeline system that manages:
    - Citizen Ingestion API Server (FastAPI on port 8001)
    - Orchestrator Scheduled Execution (configurable intervals)
    - Multi-process management with graceful shutdown

Features:
    - Starts Citizen Ingestion Agent (FastAPI) in separate process
    - Schedules Orchestrator runs at configurable intervals
    - Supports manual orchestrator trigger
    - Graceful shutdown on Ctrl+C
    - Health monitoring for all services
    - Comprehensive logging

Usage:
    # Default mode: API + Orchestrator every 1 hour
    python main.py

    # Custom orchestrator interval (30 minutes)
    python main.py --orchestrator-interval 30

    # API only (no orchestrator)
    python main.py --no-orchestrator

    # Orchestrator only (no API)
    python main.py --no-api

    # Custom workflow config
    python main.py --workflow-config config/custom_workflow.yaml

    # Run orchestrator immediately on startup
    python main.py --run-orchestrator-now

Environment Variables:
    ORCHESTRATOR_INTERVAL: Interval in minutes (default: 60)
    CITIZEN_API_PORT: API server port (default: 8001)
    WORKFLOW_CONFIG: Path to workflow.yaml (default: config/workflow.yaml)
    RUN_ORCHESTRATOR_NOW: Run orchestrator immediately (default: false)

Architecture:
    Main Process
    ├── Process 1: Citizen Ingestion API (uvicorn)
    └── Process 2: Orchestrator Scheduler (APScheduler)
        └── Executes: python src/orchestrator.py --config <config> --phase all

Shutdown Sequence:
    1. Catch SIGINT/SIGTERM
    2. Stop orchestrator scheduler
    3. Terminate API server process
    4. Wait for graceful shutdown (max 10s)
    5. Force kill if needed
"""

import argparse
import logging
import os
import signal
import subprocess
import sys
import time
from datetime import datetime
from multiprocessing import Process
from pathlib import Path
from typing import Optional

# Third-party dependencies
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.interval import IntervalTrigger

    SCHEDULER_AVAILABLE = True
except ImportError:
    SCHEDULER_AVAILABLE = False
    print("⚠️  APScheduler not installed. Install with: pip install apscheduler")

try:
    import uvicorn

    UVICORN_AVAILABLE = True
except ImportError:
    UVICORN_AVAILABLE = False
    print("⚠️  Uvicorn not installed. Install with: pip install uvicorn")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/main.log", mode="a", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)

# Global variables for process management
api_process: Optional[Process] = None
scheduler: Optional[BackgroundScheduler] = None


# ============================================================================
# Citizen Ingestion API Server
# ============================================================================


def start_citizen_api_server(port: int = 8001):
    """
    Start Citizen Ingestion Agent FastAPI server in separate process.

    Args:
        port: API server port (default: 8001)
    """
    logger.info(f"🚀 Starting Citizen Ingestion API on port {port}")

    try:
        uvicorn.run(
            "src.agents.ingestion.citizen_ingestion_agent:app",
            host="0.0.0.0",
            port=port,
            reload=False,  # Disable reload in production
            log_level="info",
            access_log=True,
        )
    except Exception as e:
        logger.error(f"❌ Citizen API server crashed: {e}", exc_info=True)


def run_citizen_api_process(port: int = 8001):
    """
    Wrapper to run API server in separate process.

    Args:
        port: API server port
    """
    global api_process

    if not UVICORN_AVAILABLE:
        logger.error("❌ Cannot start API: uvicorn not installed")
        return

    api_process = Process(target=start_citizen_api_server, args=(port,), daemon=True)
    api_process.start()
    logger.info(f"✅ Citizen API process started (PID: {api_process.pid})")


# ============================================================================
# Orchestrator Scheduler
# ============================================================================


def run_orchestrator(workflow_config: str = "config/workflow.yaml"):
    """
    Execute orchestrator.py with specified workflow config.

    Args:
        workflow_config: Path to workflow.yaml file
    """
    logger.info("=" * 80)
    logger.info(f"🔄 ORCHESTRATOR RUN STARTED - {datetime.now().isoformat()}")
    logger.info("=" * 80)

    try:
        # Build command
        python_exe = sys.executable
        orchestrator_script = Path(__file__).parent / "src" / "orchestrator.py"

        cmd = [python_exe, str(orchestrator_script), "--config", workflow_config]

        logger.info(f"📝 Command: {' '.join(cmd)}")

        # Run orchestrator as subprocess
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=3600  # 1 hour timeout
        )

        # Log output
        if result.stdout:
            logger.info(f"📤 STDOUT:\n{result.stdout}")
        if result.stderr:
            logger.warning(f"⚠️  STDERR:\n{result.stderr}")

        if result.returncode == 0:
            logger.info("✅ ORCHESTRATOR RUN COMPLETED SUCCESSFULLY")
        else:
            logger.error(f"❌ ORCHESTRATOR RUN FAILED (exit code: {result.returncode})")

    except subprocess.TimeoutExpired:
        logger.error("❌ Orchestrator execution timeout (>1 hour)")
    except Exception as e:
        logger.error(f"❌ Orchestrator execution failed: {e}", exc_info=True)

    logger.info("=" * 80)


def start_orchestrator_scheduler(
    interval_minutes: int = 60, workflow_config: str = "config/workflow.yaml"
):
    """
    Start APScheduler to run orchestrator periodically.

    Args:
        interval_minutes: Interval between orchestrator runs (default: 60)
        workflow_config: Path to workflow.yaml file
    """
    global scheduler

    if not SCHEDULER_AVAILABLE:
        logger.error("❌ Cannot start scheduler: APScheduler not installed")
        return

    scheduler = BackgroundScheduler()

    # Add job with interval trigger
    scheduler.add_job(
        func=run_orchestrator,
        trigger=IntervalTrigger(minutes=interval_minutes),
        args=[workflow_config],
        id="orchestrator_job",
        name="Orchestrator Periodic Execution",
        replace_existing=True,
        max_instances=1,  # Prevent overlapping runs
    )

    scheduler.start()
    logger.info(
        f"✅ Orchestrator scheduler started (interval: {interval_minutes} minutes)"
    )
    logger.info(f"⏰ Next run: {scheduler.get_job('orchestrator_job').next_run_time}")


# ============================================================================
# Shutdown Handlers
# ============================================================================


def graceful_shutdown(signum, frame):
    """
    Handle SIGINT/SIGTERM for graceful shutdown.

    Args:
        signum: Signal number
        frame: Current stack frame
    """
    logger.info("\n🛑 Shutdown signal received, cleaning up...")

    # Stop scheduler
    if scheduler:
        try:
            scheduler.shutdown(wait=False)
            logger.info("✅ Orchestrator scheduler stopped")
        except Exception as e:
            logger.error(f"❌ Failed to stop scheduler: {e}")

    # Terminate API process
    if api_process and api_process.is_alive():
        try:
            logger.info(f"🛑 Terminating Citizen API process (PID: {api_process.pid})")
            api_process.terminate()
            api_process.join(timeout=10)

            if api_process.is_alive():
                logger.warning("⚠️  Force killing API process")
                api_process.kill()

            logger.info("✅ Citizen API process terminated")
        except Exception as e:
            logger.error(f"❌ Failed to terminate API process: {e}")

    logger.info("👋 Goodbye!")
    sys.exit(0)


# ============================================================================
# Main Entry Point
# ============================================================================


def parse_arguments():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="LOD Pipeline System - Unified Entry Point",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Default: API + Orchestrator every 1 hour
  python main.py
  
  # Custom orchestrator interval (30 minutes)
  python main.py --orchestrator-interval 30
  
  # API only (no orchestrator)
  python main.py --no-orchestrator
  
  # Orchestrator only (no API)
  python main.py --no-api
  
  # Run orchestrator immediately on startup
  python main.py --run-orchestrator-now
        """,
    )

    parser.add_argument(
        "--orchestrator-interval",
        type=int,
        default=int(os.getenv("ORCHESTRATOR_INTERVAL", 60)),
        help="Orchestrator execution interval in minutes (default: 60)",
    )

    parser.add_argument(
        "--workflow-config",
        type=str,
        default=os.getenv("WORKFLOW_CONFIG", "config/workflow.yaml"),
        help="Path to workflow configuration file (default: config/workflow.yaml)",
    )

    parser.add_argument(
        "--api-port",
        type=int,
        default=int(os.getenv("CITIZEN_API_PORT", 8001)),
        help="Citizen API server port (default: 8001)",
    )

    parser.add_argument(
        "--no-api",
        action="store_true",
        help="Skip starting Citizen Ingestion API server",
    )

    parser.add_argument(
        "--no-orchestrator",
        action="store_true",
        help="Skip starting Orchestrator scheduler",
    )

    parser.add_argument(
        "--run-orchestrator-now",
        action="store_true",
        default=os.getenv("RUN_ORCHESTRATOR_NOW", "false").lower() == "true",
        help="Run orchestrator immediately on startup",
    )

    return parser.parse_args()


def main():
    """Main application entry point."""
    args = parse_arguments()

    # Register signal handlers
    signal.signal(signal.SIGINT, graceful_shutdown)
    signal.signal(signal.SIGTERM, graceful_shutdown)

    logger.info("=" * 80)
    logger.info("🚀 LOD PIPELINE SYSTEM STARTING")
    logger.info("=" * 80)
    logger.info(f"📅 Start Time: {datetime.now().isoformat()}")
    logger.info(f"🔧 Configuration:")
    logger.info(f"   - API Port: {args.api_port}")
    logger.info(f"   - Orchestrator Interval: {args.orchestrator_interval} minutes")
    logger.info(f"   - Workflow Config: {args.workflow_config}")
    logger.info(f"   - Run Orchestrator Now: {args.run_orchestrator_now}")
    logger.info("=" * 80)

    # Check dependencies
    if not args.no_api and not UVICORN_AVAILABLE:
        logger.error("❌ Cannot start API: uvicorn not installed")
        logger.error("   Install with: pip install uvicorn fastapi")
        sys.exit(1)

    if not args.no_orchestrator and not SCHEDULER_AVAILABLE:
        logger.error("❌ Cannot start scheduler: apscheduler not installed")
        logger.error("   Install with: pip install apscheduler")
        sys.exit(1)

    # Start Citizen Ingestion API
    if not args.no_api:
        run_citizen_api_process(port=args.api_port)
        time.sleep(2)  # Wait for API to start
        logger.info(f"📖 API Documentation: http://localhost:{args.api_port}/docs")
    else:
        logger.info("⏭️  Skipping Citizen API (--no-api flag)")

    # Run orchestrator immediately if requested
    if args.run_orchestrator_now and not args.no_orchestrator:
        logger.info("🏃 Running orchestrator immediately...")
        run_orchestrator(workflow_config=args.workflow_config)

    # Start Orchestrator Scheduler
    if not args.no_orchestrator:
        start_orchestrator_scheduler(
            interval_minutes=args.orchestrator_interval,
            workflow_config=args.workflow_config,
        )
    else:
        logger.info("⏭️  Skipping Orchestrator Scheduler (--no-orchestrator flag)")

    logger.info("=" * 80)
    logger.info("✅ ALL SERVICES STARTED SUCCESSFULLY")
    logger.info("=" * 80)
    logger.info("📊 Active Services:")
    if not args.no_api:
        logger.info(f"   ✓ Citizen Ingestion API - http://localhost:{args.api_port}")
    if not args.no_orchestrator:
        logger.info(
            f"   ✓ Orchestrator Scheduler - Every {args.orchestrator_interval} minutes"
        )
    logger.info("\n💡 Press Ctrl+C to shutdown gracefully")
    logger.info("=" * 80)

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        graceful_shutdown(None, None)


if __name__ == "__main__":
    # Create logs directory if not exists
    Path("logs").mkdir(exist_ok=True)

    main()
