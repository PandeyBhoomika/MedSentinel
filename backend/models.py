from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    hashed_mrn = Column(String, unique=True, index=True, nullable=False) # Pseudonymized by HIPAA Vault
    age = Column(Integer)
    gender = Column(String)
    admission_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    vitals = relationship("VitalSign", back_populates="patient", cascade="all, delete-orphan")
    labs = relationship("LabResult", back_populates="patient", cascade="all, delete-orphan")

class VitalSign(Base):
    __tablename__ = "vitals"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=func.now())
    
    # Clinical Data
    heart_rate = Column(Float)
    blood_pressure_sys = Column(Float)
    blood_pressure_dia = Column(Float)
    temperature = Column(Float)
    o2_saturation = Column(Float)
    
    # MedSentinel Anomaly Tracking
    is_anomaly = Column(Boolean, default=False)
    threat_score = Column(Float, default=0.0) # 0 to 100
    ai_reason = Column(Text, nullable=True) # Groq's explanation
    review_status = Column(String, default="clean") # "clean", "flagged_for_review", "quarantined", "approved"

    patient = relationship("Patient", back_populates="vitals")

class LabResult(Base):
    __tablename__ = "labs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=func.now())
    
    # Clinical Data
    test_name = Column(String, index=True) # e.g., "HbA1c", "Creatinine"
    test_value = Column(Float)
    unit = Column(String)
    
    # MedSentinel Anomaly Tracking
    is_anomaly = Column(Boolean, default=False)
    threat_score = Column(Float, default=0.0)
    ai_reason = Column(Text, nullable=True)
    review_status = Column(String, default="clean")

    patient = relationship("Patient", back_populates="labs")