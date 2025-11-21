"""
Shared Utility Functions Module

Common utility functions used across all agents and services in the system.
Provides helpers for ID generation, data formatting, file I/O, and validation.

Core Utilities:
- Entity ID generation with namespace support
- Timestamp formatting and timezone handling
- JSON/YAML file operations with error handling
- URL parsing and query parameter manipulation
- Hash generation for data integrity
- Retry decorators for external service calls

Module: src.core.utils
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Examples:
    >>> from src.core.utils import generate_entity_id, format_timestamp
    >>> 
    >>> # Generate NGSI-LD compliant entity ID
    >>> entity_id = generate_entity_id('Camera', 'HCMC', '001')
    >>> print(entity_id)  # 'urn:ngsi-ld:Camera:HCMC:001'
    >>> 
    >>> # Format current timestamp
    >>> timestamp = format_timestamp()
    >>> print(timestamp)  # '2025-11-20T10:30:00Z'
"""

import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse


def generate_entity_id(prefix: str, *components: str) -> str:
    """
    Generate a unique entity ID from components.
    
    Args:
        prefix: URN prefix (e.g., 'urn:ngsi-ld:Camera')
        *components: Components to include in ID
        
    Returns:
        URN-formatted entity ID
        
    Example:
        >>> generate_entity_id('urn:ngsi-ld:Camera', 'location1', 'cam123')
        'urn:ngsi-ld:Camera:location1:cam123'
    """
    parts = [prefix] + list(components)
    return ':'.join(str(p) for p in parts)


def generate_hash_id(data: Union[str, Dict, List], algorithm: str = 'sha256') -> str:
    """
    Generate a hash ID from data.
    
    Args:
        data: Data to hash (string, dict, or list)
        algorithm: Hash algorithm (md5, sha1, sha256, etc.)
        
    Returns:
        Hexadecimal hash string
    """
    if isinstance(data, (dict, list)):
        data = json.dumps(data, sort_keys=True)
    
    hash_obj = hashlib.new(algorithm)
    hash_obj.update(data.encode('utf-8'))
    return hash_obj.hexdigest()


def get_current_timestamp_iso() -> str:
    """
    Get current timestamp in ISO 8601 format with UTC timezone.
    
    Returns:
        ISO formatted timestamp string
        
    Example:
        '2025-11-01T12:34:56.789Z'
    """
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def get_current_timestamp_ms() -> int:
    """
    Get current timestamp in milliseconds since epoch.
    
    Returns:
        Timestamp in milliseconds
    """
    return int(time.time() * 1000)


def parse_url_components(url: str) -> Dict[str, Any]:
    """
    Parse URL into components.
    
    Args:
        url: URL string to parse
        
    Returns:
        Dictionary with URL components
        
    Example:
        {
            'scheme': 'https',
            'netloc': 'example.com',
            'path': '/api/data',
            'params': {'key': 'value'},
            'query_string': 'key=value',
            'fragment': ''
        }
    """
    parsed = urlparse(url)
    query_params = parse_qs(parsed.query, keep_blank_values=True)
    
    # Flatten query params (take first value)
    params = {k: v[0] if v else '' for k, v in query_params.items()}
    
    return {
        'scheme': parsed.scheme,
        'netloc': parsed.netloc,
        'path': parsed.path,
        'params': params,
        'query_string': parsed.query,
        'fragment': parsed.fragment,
        'base_url': f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    }


def build_url(base_url: str, params: Optional[Dict[str, Any]] = None) -> str:
    """
    Build URL from base and parameters.
    
    Args:
        base_url: Base URL without query string
        params: Optional query parameters dictionary
        
    Returns:
        Complete URL string
    """
    if not params:
        return base_url
    
    query_string = urlencode(params, safe='')
    return f"{base_url}?{query_string}"


def safe_get(data: Dict[str, Any], key_path: str, default: Any = None) -> Any:
    """
    Safely get nested dictionary value using dot notation.
    
    Args:
        data: Dictionary to query
        key_path: Dot-separated key path (e.g., 'user.address.city')
        default: Default value if key not found
        
    Returns:
        Value at key path or default
        
    Example:
        >>> data = {'user': {'address': {'city': 'Paris'}}}
        >>> safe_get(data, 'user.address.city')
        'Paris'
        >>> safe_get(data, 'user.phone', 'N/A')
        'N/A'
    """
    keys = key_path.split('.')
    value = data
    
    for key in keys:
        if isinstance(value, dict) and key in value:
            value = value[key]
        else:
            return default
    
    return value


def ensure_directory(path: Union[str, Path]) -> Path:
    """
    Ensure directory exists, create if necessary.
    
    Args:
        path: Directory path
        
    Returns:
        Path object for the directory
    """
    dir_path = Path(path)
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def read_json_file(file_path: Union[str, Path]) -> Union[Dict, List]:
    """
    Read and parse JSON file.
    
    Args:
        file_path: Path to JSON file
        
    Returns:
        Parsed JSON data
        
    Raises:
        FileNotFoundError: If file doesn't exist
        ValueError: If JSON is invalid
    """
    path = Path(file_path)
    
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in {path}: {e}")


def write_json_file(file_path: Union[str, Path], data: Union[Dict, List],
                    indent: int = 2, ensure_ascii: bool = False) -> None:
    """
    Write data to JSON file.
    
    Args:
        file_path: Path to JSON file
        data: Data to write
        indent: Indentation spaces
        ensure_ascii: Escape non-ASCII characters
    """
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=indent, ensure_ascii=ensure_ascii)


def chunk_list(items: List[Any], chunk_size: int) -> List[List[Any]]:
    """
    Split list into chunks of specified size.
    
    Args:
        items: List to chunk
        chunk_size: Size of each chunk
        
    Returns:
        List of chunks
        
    Example:
        >>> chunk_list([1, 2, 3, 4, 5], 2)
        [[1, 2], [3, 4], [5]]
    """
    return [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]


def validate_url(url: str) -> bool:
    """
    Validate URL format.
    
    Args:
        url: URL string to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception:
        return False


def sanitize_filename(filename: str, replacement: str = '_') -> str:
    """
    Sanitize filename by removing/replacing invalid characters.
    
    Args:
        filename: Filename to sanitize
        replacement: Character to replace invalid chars with
        
    Returns:
        Sanitized filename
    """
    invalid_chars = '<>:"/\\|?*'
    sanitized = filename
    
    for char in invalid_chars:
        sanitized = sanitized.replace(char, replacement)
    
    return sanitized


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format.
    
    Args:
        size_bytes: Size in bytes
        
    Returns:
        Formatted size string
        
    Example:
        >>> format_file_size(1536)
        '1.50 KB'
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"


def retry_with_backoff(max_retries: int = 3, backoff_base: float = 2.0):
    """
    Decorator for retrying functions with exponential backoff.
    
    Args:
        max_retries: Maximum number of retry attempts
        backoff_base: Base for exponential backoff calculation
        
    Returns:
        Decorated function
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    wait_time = backoff_base ** attempt
                    await asyncio.sleep(wait_time)
            return None
        return wrapper
    return decorator


# Import asyncio for retry decorator
import asyncio
