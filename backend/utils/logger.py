import logging
import sys
from pythonjsonlogger import jsonlogger

def setup_logger(name: str):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Check if handler exists to avoid duplicate logs in reloads
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        
        # Custom JSON formatter
        formatter = jsonlogger.JsonFormatter(
            "%(timestamp)s %(level)s %(name)s %(message)s",
            timestamp=True
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        # Propagate to root helps sometimes or set root
        logger.propagate = False
        
    return logger

# Create a default logger instance for easy import if needed, 
# but usually we call setup_logger(__name__) in modules.
