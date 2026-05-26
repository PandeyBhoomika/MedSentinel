from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- PATIENT SCHEMAS ---
class PatientBase(BaseModel):
    hashed_mrn: str
    age: int
    gender: str

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: str
    admission_date: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- VITAL SIGN SCHEMAS ---
class VitalSignBase(BaseModel):
    heart_rate: Optional[float] = None
    blood_pressure_sys: Optional[float] = None
    blood_pressure_dia: Optional[float] = None
    temperature: Optional[float] = None
    o2_saturation: Optional[float] = None

class VitalSignCreate(VitalSignBase):
    patient_id: str

class VitalSignResponse(VitalSignBase):
    id: str
    patient_id: str
    recorded_at: datetime
    is_anomaly: bool
    threat_score: float
    ai_reason: Optional[str]
    review_status: str

    model_config = ConfigDict(from_attributes=True)

# --- LAB RESULT SCHEMAS ---
class LabResultBase(BaseModel):
    test_name: str
    test_value: float
    unit: str

class LabResultCreate(LabResultBase):
    patient_id: str

class LabResultResponse(LabResultBase):
    id: str
    patient_id: str
    recorded_at: datetime
    is_anomaly: bool
    threat_score: float
    ai_reason: Optional[str]
    review_status: str

    model_config = ConfigDict(from_attributes=True)