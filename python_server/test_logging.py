#!/usr/bin/env python3
"""
Test script to verify logging configuration
"""
import logging
import sys

# Configure logging to reduce verbosity (same as main.py)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Suppress verbose PyMongo debug logs
logging.getLogger("pymongo").setLevel(logging.WARNING)
logging.getLogger("motor").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

def test_logging():
    """Test different log levels"""
    print("Testing logging configuration...")
    print("=" * 50)
    
    # Test info level
    logger.info("This is an INFO message")
    
    # Test warning level
    logger.warning("This is a WARNING message")
    
    # Test error level
    logger.error("This is an ERROR message")
    
    # Test debug level (should not appear with INFO level)
    logger.debug("This is a DEBUG message (should not appear)")
    
    print("=" * 50)
    print("If you only see INFO, WARNING, and ERROR messages above, logging is configured correctly.")
    print("The DEBUG message should not appear, and PyMongo debug logs should be suppressed.")

if __name__ == "__main__":
    test_logging() 