"""
Cache Manager CLI
Module: src.cli.cache.cache_manager
Author: nguyễn Nhật Quang
Created: 2025-11-25
Version: 1.0.0
License: MIT
Description:
    Command-line interface for cache operations (clear, stats, warm).

    Features:
    - Clear cache entries by pattern or entirely
    - Display cache statistics (hit rate, memory usage, key count)
    - Warm cache with frequently accessed data
    Uses Redis as the backend cache store.


"""

import logging
import argparse
from typing import Optional
import sys

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("Warning: redis-py not installed. Install with: pip install redis")

logger = logging.getLogger(__name__)


def get_redis_client(host: str = "localhost", port: int = 6379, db: int = 1) -> Optional['redis.Redis']:
    """Get Redis client connection."""
    if not REDIS_AVAILABLE:
        print("ERROR: Redis client not available")
        return None
    
    try:
        client = redis.Redis(host=host, port=port, db=db, decode_responses=True)
        client.ping()
        return client
    except Exception as e:
        print(f"ERROR: Failed to connect to Redis at {host}:{port} - {e}")
        return None


def cache_clear(pattern: Optional[str] = None, host: str = "localhost", port: int = 6379):
    """Clear cache entries matching pattern."""
    client = get_redis_client(host, port)
    if not client:
        return
    
    try:
        if pattern:
            # Pattern-based deletion
            keys = list(client.scan_iter(match=pattern))
            if keys:
                deleted = client.delete(*keys)
                print(f"✓ Cleared {deleted} cache keys matching pattern: {pattern}")
            else:
                print(f"No keys found matching pattern: {pattern}")
        else:
            # Clear all cache
            client.flushdb()
            print("✓ Cleared all cache entries")
    except Exception as e:
        print(f"ERROR: Cache clear failed - {e}")
    finally:
        client.close()


def cache_stats(host: str = "localhost", port: int = 6379):
    """Display cache statistics."""
    client = get_redis_client(host, port)
    if not client:
        return
    
    try:
        info = client.info("stats")
        memory_info = client.info("memory")
        
        total_keys = client.dbsize()
        used_memory_mb = memory_info.get('used_memory', 0) / (1024 * 1024)
        
        # Calculate hit rate
        hits = info.get('keyspace_hits', 0)
        misses = info.get('keyspace_misses', 0)
        total = hits + misses
        hit_rate = (hits / total * 100) if total > 0 else 0
        
        print("=" * 50)
        print("CACHE STATISTICS")
        print("=" * 50)
        print(f"Total keys:     {total_keys:,}")
        print(f"Hit rate:       {hit_rate:.2f}%")
        print(f"Hits:           {hits:,}")
        print(f"Misses:         {misses:,}")
        print(f"Memory usage:   {used_memory_mb:.2f} MB")
        print(f"Connected clients: {info.get('connected_clients', 0)}")
        print("=" * 50)
    except Exception as e:
        print(f"ERROR: Failed to get stats - {e}")
    finally:
        client.close()


def cache_warm(host: str = "localhost", port: int = 6379):
    """Warm cache with frequently accessed data."""
    client = get_redis_client(host, port)
    if not client:
        return
    
    try:
        # Example: Pre-load common camera IDs
        cameras = [f"camera:{i:03d}" for i in range(1, 51)]  # camera:001 to camera:050
        
        pipeline = client.pipeline()
        for camera_id in cameras:
            pipeline.set(f"cache:{camera_id}", f'{{"id": "{camera_id}", "status": "active"}}', ex=3600)
        
        pipeline.execute()
        print(f"✓ Cache warmed with {len(cameras)} camera entries")
    except Exception as e:
        print(f"ERROR: Cache warming failed - {e}")
    finally:
        client.close()


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(description="Cache management CLI - Production Ready")
    parser.add_argument("command", choices=["clear", "stats", "warm"], help="Command to execute")
    parser.add_argument("--pattern", help="Cache key pattern for clear command")
    parser.add_argument("--host", default="localhost", help="Redis host")
    parser.add_argument("--port", type=int, default=6379, help="Redis port")
    
    args = parser.parse_args()
    
    if args.command == "clear":
        cache_clear(args.pattern, args.host, args.port)
    elif args.command == "stats":
        cache_stats(args.host, args.port)
    elif args.command == "warm":
        cache_warm(args.host, args.port)


if __name__ == "__main__":
    main()
