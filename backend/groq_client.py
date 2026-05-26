import os
import json
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv
import utils

# Force explicitly loading the .env file from the current directory
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

logger = utils.setup_logger("groq_client")

# Initialize client (Notice it asks for the NAME of the variable, not the key itself)
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    logger.warning("GROQ_API_KEY is missing from .env! AI features will not work.")
client = Groq(api_key=api_key) if api_key else None

# Define our model roles
MODEL_FAST = "llama-3.1-8b-instant"          # For logic gates & insights
MODEL_REASONING = "llama-3.3-70b-versatile"  # For NL-to-SQL

def check_groq_connectivity() -> bool:
    """Checks if the Groq API is reachable and authenticated."""
    if not client:
        return False
    try:
        # Simple ping to test auth
        client.chat.completions.create(
            messages=[{"role": "user", "content": "ping"}],
            model=MODEL_FAST,
            max_tokens=5
        )
        return True
    except Exception as e:
        logger.error(f"Groq connectivity failed: {e}")
        return False

def groq_chat(messages: list, model: str = MODEL_FAST, temperature: float = 0.0) -> str | None:
    """Standard text response from Groq."""
    if not client:
        return None
    try:
        response = client.chat.completions.create(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=1024
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Groq chat error: {e}")
        return None

def groq_chat_json(messages: list, model: str = MODEL_FAST) -> dict | None:
    """Forces Groq to return a valid JSON object (Great for rules and data extraction)."""
    if not client:
        return None
    try:
        response = client.chat.completions.create(
            messages=messages,
            model=model,
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        logger.error(f"Groq JSON chat error: {e}")
        return None