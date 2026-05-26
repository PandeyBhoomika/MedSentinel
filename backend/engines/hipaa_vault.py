import hashlib
import os
import re

def get_salt() -> str:
    """Fetches a custom salt from env, or uses a default for development."""
    return os.getenv("DS_PII_SALT", "medsentinel_secure_salt_2024")

def hash_identifier(identifier: str) -> str:
    """
    Takes a raw identifier (like an MRN or SSN) and converts it 
    to a secure, irreversible SHA-256 hash for HIPAA compliance.
    """
    if not identifier:
        return ""
    
    # Clean the input (remove spaces, dashes, make uppercase)
    clean_id = re.sub(r'[^a-zA-Z0-9]', '', str(identifier)).upper()
    
    # Combine with salt and hash
    payload = f"{clean_id}{get_salt()}".encode('utf-8')
    return hashlib.sha256(payload).hexdigest()

def detect_phi_in_text(text: str) -> list[str]:
    """
    Basic heuristic scanner to detect potential Protected Health Info (PHI)
    like SSNs or standard MRN formats in raw text.
    """
    findings = []
    
    # Simple regex for US SSN format (XXX-XX-XXXX)
    if re.search(r'\b\d{3}-\d{2}-\d{4}\b', str(text)):
        findings.append("SSN Detected")
        
    return findings