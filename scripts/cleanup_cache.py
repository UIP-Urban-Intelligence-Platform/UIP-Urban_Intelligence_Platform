#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cache Cleanup Script - Emergency Disk Space Recovery.

UIP - Urban Intelligence Platform
Copyright (C) 2025 UIP Team

SPDX-License-Identifier: MIT

Module: scripts.cleanup_cache
Project: UIP - Urban Intelligence Platform
Author: Nguyen Dinh Anh Tuan
Created: 2025-12-08
Version: 1.0.0
License: MIT

Description:
    Script to clean up image cache files to prevent disk space exhaustion.
    Can be run manually or via cron job for periodic cleanup.

Usage:
    python scripts/cleanup_cache.py              # Clean expired files
    python scripts/cleanup_cache.py --all        # Delete ALL cache files
    python scripts/cleanup_cache.py --max-mb 50  # Enforce 50MB limit

Cron Example (run every 5 minutes):
    */5 * * * * cd /path/to/project && python scripts/cleanup_cache.py >> logs/cleanup.log 2>&1
"""

import argparse
import logging
import os
import sys
import time
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def get_cache_dir() -> Path:
    """Get cache directory from config or default"""
    try:
        import yaml
        config_path = Path(__file__).parent.parent / "config" / "cv_config.yaml"
        if config_path.exists():
            with open(config_path) as f:
                config = yaml.safe_load(f)
                cache_dir = config.get("cv_analysis", {}).get("cache", {}).get("directory", "data/cache/images")
                return Path(__file__).parent.parent / cache_dir
    except Exception:
        pass
    return Path(__file__).parent.parent / "data" / "cache" / "images"


def get_cache_stats(cache_dir: Path) -> dict:
    """Get cache directory statistics"""
    if not cache_dir.exists():
        return {"files": 0, "size_mb": 0, "oldest_age_minutes": 0}
    
    files = list(cache_dir.glob("*.jpg")) + list(cache_dir.glob("*.png"))
    if not files:
        return {"files": 0, "size_mb": 0, "oldest_age_minutes": 0}
    
    total_size = sum(f.stat().st_size for f in files)
    current_time = time.time()
    oldest_age = max((current_time - f.stat().st_mtime) / 60 for f in files)
    
    return {
        "files": len(files),
        "size_mb": round(total_size / (1024 * 1024), 2),
        "oldest_age_minutes": round(oldest_age, 1)
    }


def cleanup_expired(cache_dir: Path, ttl_minutes: int = 5) -> int:
    """Remove files older than TTL
    
    Args:
        cache_dir: Path to cache directory
        ttl_minutes: Time-to-live in minutes
        
    Returns:
        Number of files removed
    """
    if not cache_dir.exists():
        logger.info(f"Cache directory does not exist: {cache_dir}")
        return 0
    
    current_time = time.time()
    ttl_seconds = ttl_minutes * 60
    removed = 0
    
    for cache_file in list(cache_dir.glob("*.jpg")) + list(cache_dir.glob("*.png")):
        try:
            file_age = current_time - cache_file.stat().st_mtime
            if file_age > ttl_seconds:
                cache_file.unlink()
                removed += 1
        except Exception as e:
            logger.warning(f"Failed to remove {cache_file}: {e}")
    
    return removed


def cleanup_by_size(cache_dir: Path, max_size_mb: int = 100) -> int:
    """Remove oldest files until cache is under size limit
    
    Args:
        cache_dir: Path to cache directory
        max_size_mb: Maximum cache size in MB
        
    Returns:
        Number of files removed
    """
    if not cache_dir.exists():
        return 0
    
    files = list(cache_dir.glob("*.jpg")) + list(cache_dir.glob("*.png"))
    if not files:
        return 0
    
    total_size_mb = sum(f.stat().st_size for f in files) / (1024 * 1024)
    
    if total_size_mb <= max_size_mb:
        return 0
    
    # Sort by modification time (oldest first)
    files.sort(key=lambda f: f.stat().st_mtime)
    
    removed = 0
    while total_size_mb > max_size_mb and files:
        oldest = files.pop(0)
        try:
            size_mb = oldest.stat().st_size / (1024 * 1024)
            oldest.unlink()
            total_size_mb -= size_mb
            removed += 1
        except Exception:
            pass
    
    return removed


def cleanup_all(cache_dir: Path) -> int:
    """Remove ALL cache files (emergency cleanup)
    
    Args:
        cache_dir: Path to cache directory
        
    Returns:
        Number of files removed
    """
    if not cache_dir.exists():
        return 0
    
    removed = 0
    for cache_file in list(cache_dir.glob("*.jpg")) + list(cache_dir.glob("*.png")):
        try:
            cache_file.unlink()
            removed += 1
        except Exception:
            pass
    
    return removed


def main():
    parser = argparse.ArgumentParser(description="Clean up CV analysis image cache")
    parser.add_argument("--all", action="store_true", help="Delete ALL cache files")
    parser.add_argument("--max-mb", type=int, default=100, help="Maximum cache size in MB")
    parser.add_argument("--ttl", type=int, default=5, help="TTL in minutes for expired cleanup")
    parser.add_argument("--stats", action="store_true", help="Show cache statistics only")
    parser.add_argument("--quiet", action="store_true", help="Suppress output unless files removed")
    
    args = parser.parse_args()
    
    cache_dir = get_cache_dir()
    
    # Show stats
    before_stats = get_cache_stats(cache_dir)
    
    if args.stats:
        print(f"📊 Cache Statistics:")
        print(f"   Directory: {cache_dir}")
        print(f"   Files: {before_stats['files']}")
        print(f"   Size: {before_stats['size_mb']} MB")
        print(f"   Oldest file: {before_stats['oldest_age_minutes']} minutes")
        return
    
    if not args.quiet:
        logger.info(f"Cache before: {before_stats['files']} files, {before_stats['size_mb']} MB")
    
    # Perform cleanup
    if args.all:
        removed = cleanup_all(cache_dir)
        logger.info(f"🧹 Emergency cleanup: removed ALL {removed} cache files")
    else:
        # First remove expired files
        removed_expired = cleanup_expired(cache_dir, args.ttl)
        
        # Then enforce size limit
        removed_size = cleanup_by_size(cache_dir, args.max_mb)
        
        removed = removed_expired + removed_size
        
        if removed > 0 or not args.quiet:
            logger.info(f"🧹 Cleanup complete: {removed_expired} expired + {removed_size} oversized = {removed} files removed")
    
    # Show after stats
    after_stats = get_cache_stats(cache_dir)
    if not args.quiet:
        logger.info(f"Cache after: {after_stats['files']} files, {after_stats['size_mb']} MB")
        freed_mb = before_stats['size_mb'] - after_stats['size_mb']
        if freed_mb > 0:
            logger.info(f"💾 Freed {freed_mb:.2f} MB disk space")


if __name__ == "__main__":
    main()
