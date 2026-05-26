import groq_client
import database
import utils
from sqlalchemy import text
import re

logger = utils.setup_logger("nl_query")

# We must teach the AI our exact database structure so it can write accurate queries
DATABASE_SCHEMA = """
You are a senior PostgreSQL clinical data analyst. 
You are querying a healthcare database with the following schema:

Table 1: patients
- id (String, UUID)
- hashed_mrn (String)
- age (Integer)
- gender (String)
- admission_date (Timestamp)

Table 2: vitals
- id (String)
- patient_id (String, Foreign Key to patients.id)
- recorded_at (Timestamp)
- heart_rate, blood_pressure_sys, blood_pressure_dia, temperature, o2_saturation (Float)
- is_anomaly (Boolean)
- threat_score (Float, 0-100)
- review_status (String: 'clean', 'flagged_for_review')
- ai_reason (String)

Table 3: labs
- id (String)
- patient_id (String, Foreign Key to patients.id)
- recorded_at (Timestamp)
- test_name (String)
- test_value (Float)
- unit (String)
- is_anomaly (Boolean)
- threat_score (Float, 0-100)
- review_status (String: 'clean', 'flagged_for_review')
- ai_reason (String)

CRITICAL RULES:
1. ONLY write SELECT statements. NEVER write UPDATE, DELETE, INSERT, or DROP.
2. Return ONLY the raw SQL query. Do not wrap it in markdown (like ```sql). 
3. Do not include any explanations or conversational text.
4. NEVER use UNION or UNION ALL to combine tables with different columns. If the user asks for "all anomalies" without specifying, ONLY query the vitals table.
"""

def clean_sql_output(raw_sql: str) -> str:
    """Strips out Markdown formatting if the AI disobeys rule #2."""
    clean = re.sub(r"```[sS][qQ][lL]", "", raw_sql)
    clean = re.sub(r"```", "", clean)
    return clean.strip()

def process_natural_query(user_question: str) -> dict:
    """
    Translates English to SQL, safely executes it against PostgreSQL, 
    and returns the results.
    """
    if not user_question:
        return {"error": "Question cannot be empty."}

    # 1. Ask Groq to translate English to SQL
    messages = [
        {"role": "system", "content": DATABASE_SCHEMA},
        {"role": "user", "content": user_question}
    ]
    
    logger.info(f"Translating query: '{user_question}'")
    
    # We use the 70B reasoning model here because SQL generation is complex
    raw_response = groq_client.groq_chat(messages, model=groq_client.MODEL_REASONING, temperature=0.0)
    
    if not raw_response:
        return {"error": "AI failed to generate a response."}

    # Clean the SQL string
    sql_query = clean_sql_output(raw_response)
    logger.info(f"Generated SQL: {sql_query}")

    # 2. Security Check: Prevent Destructive Queries (SQL Injection protection)
    if any(forbidden in sql_query.upper() for forbidden in ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER"]):
        return {"error": "Security Alert: Only read-only (SELECT) queries are allowed."}

    # 3. Execute the SQL against our live PostgreSQL database
    try:
        db = database.SessionLocal()
        # Execute securely using SQLAlchemy's text() wrapper
        result = db.execute(text(sql_query))
        
        # Fetch column names and row data
        columns = result.keys()
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
        
        db.close()
        
        return {
            "sql_executed": sql_query,
            "row_count": len(rows),
            "data": rows
        }
        
    except Exception as e:
        logger.error(f"SQL Execution Error: {e}")
        return {"error": f"Database execution failed: {str(e)}", "sql_executed": sql_query}