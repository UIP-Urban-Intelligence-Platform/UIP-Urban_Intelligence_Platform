"""
Centralized Logging Utility Module

Module: src.core.logger
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
Provides unified logging configuration for all agents with support for structured
logging, multiple output formats, and configurable log levels.

Features:
- JSON-formatted logging for production environments
- Human-readable console output for development
- File-based logging with automatic rotation
- Structured logging with contextual information
- Integration with popular log aggregation tools



Dependencies:
    - python-json-logger>=2.0: JSON log formatting

Configuration:
    Environment variables:
    - LOG_LEVEL: Set global log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    - LOG_FORMAT: Output format ('json' or 'console')
    - LOG_FILE_PATH: Path to log file for persistent logging

Examples:
    >>> from src.core.logger import AgentLogger
    >>> 
    >>> # Basic usage with default settings
    >>> logger = AgentLogger.setup_logger('my_agent')
    >>> logger.info('Processing started')
    >>> 
    >>> # Advanced usage with JSON formatting and file output
    >>> logger = AgentLogger.setup_logger(
    ...     name='data_pipeline',
    ...     level='DEBUG',
    ...     log_file='logs/pipeline.log',
    ...     json_format=True
    ... )
    >>> logger.info('Entity processed', extra={'entity_id': 'CAM001', 'count': 42})

Log Levels:
    - DEBUG: Detailed diagnostic information
    - INFO: General informational messages
    - WARNING: Warning messages for potentially harmful situations
    - ERROR: Error events that might allow the application to continue
    - CRITICAL: Severe error events that may cause premature termination

Best Practices:
    - Use structured logging with 'extra' parameter for contextual data
    - Set appropriate log levels based on environment (DEBUG for dev, INFO for prod)
    - Include relevant metadata (entity_id, agent_name, phase) in log messages
    - Use exception logging (logger.exception) to capture stack traces
"""

import logging
import sys
from pathlib import Path
from typing import Optional

from pythonjsonlogger import jsonlogger


class AgentLogger:
    """
    Centralized logger for agents with JSON and console output support.
    """
    
    @staticmethod
    def setup_logger(
        name: str,
        level: str = "INFO",
        log_file: Optional[str] = None,
        json_format: bool = False
    ) -> logging.Logger:
        """
        Setup and configure a logger for an agent.
        
        Args:
            name: Logger name (typically agent name)
            level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            log_file: Optional file path for log output
            json_format: Use JSON formatted logs
            
        Returns:
            Configured logger instance
        """
        logger = logging.getLogger(name)
        logger.setLevel(getattr(logging, level.upper()))
        
        # Remove existing handlers to avoid duplicates
        logger.handlers.clear()
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, level.upper()))
        
        if json_format:
            # JSON formatter for structured logging
            formatter = jsonlogger.JsonFormatter(
                '%(asctime)s %(name)s %(levelname)s %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
        else:
            # Standard formatter
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
        
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # File handler (optional)
        if log_file:
            log_path = Path(log_file)
            log_path.parent.mkdir(parents=True, exist_ok=True)
            
            file_handler = logging.FileHandler(log_file, encoding='utf-8')
            file_handler.setLevel(getattr(logging, level.upper()))
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        
        # Prevent propagation to root logger
        logger.propagate = False
        
        return logger
    
    @staticmethod
    def get_logger(name: str) -> logging.Logger:
        """
        Get an existing logger or create a new one with default settings.
        
        Args:
            name: Logger name
            
        Returns:
            Logger instance
        """
        logger = logging.getLogger(name)
        
        if not logger.handlers:
            # Setup with defaults if not already configured
            return AgentLogger.setup_logger(name)
        
        return logger
