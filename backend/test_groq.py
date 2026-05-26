import os
from dotenv import load_dotenv
from groq import Groq

# Load the env file
load_dotenv()
key = os.getenv("GROQ_API_KEY")

print("--- DIAGNOSTIC TEST ---")
if not key:
    print("❌ ERROR: Could not find GROQ_API_KEY in .env file.")
else:
    # Print just the start and end of the key for security to verify it loaded
    print(f"🔑 Key loaded: {key[:5]}.....{key[-4:]}")
    
    try:
        print("⏳ Attempting to contact Groq servers...")
        client = Groq(api_key=key)
        client.chat.completions.create(
            messages=[{"role": "user", "content": "ping"}],
            model="llama-3.1-8b-instant",
            max_tokens=5
        )
        print("✅ SUCCESS! Groq is connected.")
    except Exception as e:
        print(f"❌ GROQ REJECTED CONNECTION. Reason:\n{e}")