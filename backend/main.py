import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text  # <-- Added this import
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Any
import pandas as pd

# Import our custom modules
import database
import groq_client
import utils
from engines import clinical_detection, medical_logic, nl_query

# Load environment variables
load_dotenv()
logger = utils.setup_logger("main")

# Initialize FastAPI App
app = FastAPI(
    title="MedSentinel API",
    description="AI-Powered Clinical Data Quality & Anomaly Detection",
    version="1.0.0"
)

# Setup CORS (Allows your Next.js frontend to communicate with this backend)
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the MedSentinel Clinical API"}

@app.get("/api/health")
def health_check(db: Session = Depends(database.get_db)):
    """
    Detailed health check to verify Database and AI connectivity.
    """
    health_status = {
        "status": "online",
        "database": "disconnected",
        "groq_ai": "disconnected"
    }

    # 1. Test Database Connection
    try:
        # A simple query to check if the DB is responding
        db.execute(text("SELECT 1")) 
        health_status["database"] = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")

    # 2. Test Groq AI Connection
    if groq_client.check_groq_connectivity():
        health_status["groq_ai"] = "connected"

    return health_status


# --- Input Schemas ---
class QueryRequest(BaseModel):
    question: str

class DatasetUpload(BaseModel):
    columns: List[str]
    rows: List[List[Any]]

# --- MedSentinel API Routes ---

@app.post("/api/detect")
def run_full_detection_pipeline(db: Session = Depends(database.get_db)):
    """
    Pulls data from PostgreSQL, runs the ML anomaly detection, 
    asks Groq for medical reasons, and saves the results back.
    """
    try:
        # 1. Load data from the database into a Pandas DataFrame
        query = "SELECT * FROM vitals"
        df = pd.read_sql(query, db.get_bind())
        
        if df.empty:
            return {"message": "No vital signs found in database to analyze."}

        # 2. Run the Machine Learning Isolation Forest
        feature_cols = ['heart_rate', 'blood_pressure_sys', 'blood_pressure_dia', 'temperature', 'o2_saturation']
        df = clinical_detection.run_anomaly_detection(df, feature_cols)

        # 3. Ask Groq's Medical AI to explain the anomalies
        df = medical_logic.evaluate_clinical_anomalies(df)

        # 4. Save the updated threat scores and AI reasons back to PostgreSQL
        df.to_sql('vitals', con=db.get_bind(), if_exists='replace', index=False)
        
        # Calculate summary stats to return to the frontend UI
        total_records = len(df)
        anomalies_found = len(df[df['is_anomaly'] == True])
        
        return {
            "status": "success",
            "message": "Detection pipeline complete.",
            "total_records_scanned": total_records,
            "anomalies_flagged": anomalies_found
        }
        
    except Exception as e:
        logger.error(f"Detection pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/query")
def natural_language_query(request: QueryRequest):
    """
    Takes plain English from a doctor and returns SQL data via Groq.
    """
    logger.info(f"Received NL Query: {request.question}")
    
    # Send the question to our NL-to-SQL engine
    result = nl_query.process_natural_query(request.question)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@app.post("/api/upload-dataset")
async def upload_dataset(payload: DatasetUpload):
    """
    Accepts an uploaded dataset from the frontend, converts it to a DataFrame, 
    runs the ML/AI pipeline dynamically, and returns the scored data.
    """
    try:
        # Convert incoming JSON payload directly into a Pandas DataFrame
        df = pd.DataFrame(payload.rows, columns=payload.columns)
        
        # Ensure we only pass numeric columns to the Isolation Forest
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        
        if not numeric_cols:
            raise HTTPException(status_code=400, detail="Dataset must contain at least one numeric column for anomaly detection.")

        # Run the ML pipeline (Isolation Forest)
        df = clinical_detection.run_anomaly_detection(df, numeric_cols)
        
        # Run the Groq AI medical logic to explain the anomalies
        df = medical_logic.evaluate_clinical_anomalies(df)
        
        # Calculate summary statistics
        anomalies_flagged = int(df['is_anomaly'].sum()) if 'is_anomaly' in df.columns else 0
        
        # Clean the DataFrame for JSON serialization (FastAPI/JSON hates NaNs)
        df = df.where(pd.notnull(df), None)
        cleaned_data = df.to_dict(orient="records")
        
        return {
            "status": "success",
            "total_records": len(df),
            "anomalies_flagged": anomalies_flagged,
            "cleaned_data": cleaned_data
        }
        
    except Exception as e:
        # Log the exact error and pass it back to the frontend
        logger.error(f"Dataset Upload Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))