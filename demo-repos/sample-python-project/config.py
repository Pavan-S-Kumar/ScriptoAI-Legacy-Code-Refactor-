"""Configuration module."""

# Issue: Unused import
import datetime
import logging

# Configuration settings
DEBUG = True
LOG_LEVEL = "INFO"
MAX_CONNECTIONS = 100
TIMEOUT = 30

def get_config() -> dict:
    return {
        "debug": DEBUG,
        "log_level": LOG_LEVEL,
        "max_connections": MAX_CONNECTIONS,
        "timeout": TIMEOUT,
    }
