import logging
import os
from pathlib import Path

# Setup absolute paths
BACKEND_DIR = Path(__file__).parent.absolute()
DATA_DIR = BACKEND_DIR / "data"
SESSIONS_DIR = BACKEND_DIR / "sessions"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
SESSIONS_DIR.mkdir(exist_ok=True)

def setup_logger(name: str = "medsentinel"):
    """Configures a standardized logger."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        
        # Console handler
        ch = logging.StreamHandler()
        ch.setFormatter(formatter)
        logger.addHandler(ch)
        
        # File handler for critical errors
        fh = logging.FileHandler(BACKEND_DIR / "error.log")
        fh.setLevel(logging.ERROR)
        fh.setFormatter(formatter)
        logger.addHandler(fh)
        
    return logger

logger = setup_logger()

def log_audit_action(action: str, metadata: dict):
    """Appends actions to the immutable JSONL audit log for compliance."""
    import json
    from datetime import datetime
    
    audit_file = DATA_DIR / "audit_logs.jsonl"
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "action": action,
        "metadata": metadata
    }
    
    with open(audit_file, "a") as f:
        f.write(json.dumps(entry) + "\n")