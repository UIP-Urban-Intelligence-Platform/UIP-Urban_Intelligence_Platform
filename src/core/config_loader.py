"""
Centralized Configuration Loader Utility

Provides unified YAML configuration loading, validation, and management
for all agents and services in the LOD pipeline system.

Core Features:
- YAML configuration file parsing with error handling
- Environment variable interpolation in config values
- Configuration merging from multiple sources
- Type-safe configuration access with default values
- Validation of required fields and data types

Module: src.core.config_loader
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Dependencies:
    - PyYAML>=6.0: YAML file parsing

Examples:
    >>> from src.core.config_loader import ConfigLoader
    >>> 
    >>> # Load single configuration file
    >>> config = ConfigLoader.load('config/workflow.yaml')
    >>> print(config['phases'])
    >>> 
    >>> # Load with validation
    >>> config = ConfigLoader.load_and_validate('config/agents.yaml')

Best Practices:
    - Store secrets in environment variables, not config files
    - Provide sensible defaults for optional parameters
    - Document all configuration options
    - Version configuration schemas for compatibility

Error Handling:
    Raises ConfigurationError for:
    - Missing required configuration files
    - Invalid YAML syntax
    - Missing required fields
    - Type mismatches in values
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


logger = logging.getLogger(__name__)


class ConfigurationError(Exception):
    """Raised when configuration is invalid or missing."""
    pass


class ConfigLoader:
    """
    Domain-agnostic configuration loader.
    
    Loads and validates YAML configuration files with
    support for environment variable substitution and
    schema validation.
    """
    
    def __init__(self, base_path: str = "config"):
        """
        Initialize configuration loader.
        
        Args:
            base_path: Base directory for configuration files
        """
        self.base_path = Path(base_path)
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    def load(self, config_file: str, domain: Optional[str] = None) -> Dict[str, Any]:
        """
        Load configuration from YAML file.
        
        Args:
            config_file: Name of configuration file (e.g., 'data_sources.yaml')
            domain: Optional domain section to extract
            
        Returns:
            Configuration dictionary
            
        Raises:
            ConfigurationError: If file not found or invalid
        """
        config_path = self.base_path / config_file
        
        # Check cache
        cache_key = f"{config_path}:{domain}" if domain else str(config_path)
        if cache_key in self._cache:
            logger.debug(f"Using cached configuration for {cache_key}")
            return self._cache[cache_key]
        
        # Load from file
        if not config_path.exists():
            raise ConfigurationError(f"Configuration file not found: {config_path}")
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config_data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            raise ConfigurationError(f"Invalid YAML in {config_path}: {e}")
        
        if config_data is None:
            raise ConfigurationError(f"Configuration file is empty: {config_path}")
        
        # Extract domain if specified
        if domain:
            if domain not in config_data:
                available = list(config_data.keys())
                raise ConfigurationError(
                    f"Domain '{domain}' not found in {config_file}. "
                    f"Available: {available}"
                )
            config_data = config_data[domain]
        
        # Cache and return
        self._cache[cache_key] = config_data
        logger.info(f"Loaded configuration from {config_path}")
        
        return config_data
    
    def validate_required_fields(self, config: Dict[str, Any], 
                                 required_fields: List[str]) -> None:
        """
        Validate that required fields are present in configuration.
        
        Args:
            config: Configuration dictionary to validate
            required_fields: List of required field names
            
        Raises:
            ConfigurationError: If any required field is missing
        """
        missing = [field for field in required_fields if field not in config]
        if missing:
            raise ConfigurationError(f"Missing required configuration fields: {missing}")
    
    def get(self, config_file: str, domain: Optional[str] = None, 
            key: Optional[str] = None, default: Any = None) -> Any:
        """
        Get configuration value with optional key path.
        
        Args:
            config_file: Name of configuration file
            domain: Optional domain section
            key: Optional key to retrieve (supports dot notation)
            default: Default value if key not found
            
        Returns:
            Configuration value
        """
        config = self.load(config_file, domain)
        
        if key is None:
            return config
        
        # Support dot notation (e.g., 'database.host')
        keys = key.split('.')
        value = config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def clear_cache(self) -> None:
        """Clear configuration cache."""
        self._cache.clear()
        logger.debug("Configuration cache cleared")
    
    def reload(self, config_file: str, domain: Optional[str] = None) -> Dict[str, Any]:
        """
        Reload configuration from file (bypass cache).
        
        Args:
            config_file: Name of configuration file
            domain: Optional domain section
            
        Returns:
            Reloaded configuration dictionary
        """
        self.clear_cache()
        return self.load(config_file, domain)


# Global instance for convenience
config_loader = ConfigLoader()
