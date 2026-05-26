import random
import uuid
from datetime import datetime, timedelta
import database
import models
from engines import hipaa_vault
import utils

logger = utils.setup_logger("seed_db")

def seed_data():
    db = database.SessionLocal()
    try:
        # 1. Clear old data for a fresh start
        db.query(models.VitalSign).delete()
        db.query(models.Patient).delete()
        
        # 2. Generate 50 Normal Patients
        patients = []
        for i in range(50):
            raw_mrn = f"MRN-{random.randint(10000, 99999)}"
            patient = models.Patient(
                id=str(uuid.uuid4()),
                hashed_mrn=hipaa_vault.hash_identifier(raw_mrn), # Securely hash the fake MRN
                age=random.randint(18, 90),
                gender=random.choice(["M", "F"]),
                admission_date=datetime.utcnow() - timedelta(days=random.randint(0, 10))
            )
            patients.append(patient)
        
        db.add_all(patients)
        db.commit()

        # 3. Generate Normal Vital Signs
        vitals = []
        for p in patients:
            vital = models.VitalSign(
                id=str(uuid.uuid4()),
                patient_id=p.id,
                heart_rate=round(random.uniform(60, 95), 1),
                blood_pressure_sys=round(random.uniform(110, 130), 1),
                blood_pressure_dia=round(random.uniform(70, 85), 1),
                temperature=round(random.uniform(97.5, 99.2), 1),
                o2_saturation=round(random.uniform(95, 100), 1)
            )
            vitals.append(vital)

        # 4. Inject 3 Extreme Medical Anomalies to test the AI
        bad_patients = random.sample(patients, 3)
        
        # Anomaly 1: Severe Hypoxia & Tachycardia
        vitals.append(models.VitalSign(
            id=str(uuid.uuid4()), patient_id=bad_patients[0].id,
            heart_rate=165, blood_pressure_sys=90, blood_pressure_dia=50,
            temperature=101.2, o2_saturation=82 # Dangerously low O2
        ))
        
        # Anomaly 2: Hypertensive Crisis
        vitals.append(models.VitalSign(
            id=str(uuid.uuid4()), patient_id=bad_patients[1].id,
            heart_rate=95, blood_pressure_sys=210, blood_pressure_dia=130, # Stroke risk
            temperature=98.6, o2_saturation=97
        ))
        
        # Anomaly 3: Severe Hypothermia
        vitals.append(models.VitalSign(
            id=str(uuid.uuid4()), patient_id=bad_patients[2].id,
            heart_rate=45, blood_pressure_sys=85, blood_pressure_dia=45,
            temperature=91.0, o2_saturation=92 # Mathematically extreme temp
        ))

        db.add_all(vitals)
        db.commit()
        
        logger.info(f"✅ Successfully seeded {len(patients)} patients and {len(vitals)} vital signs!")
        logger.info("3 severe anomalies were injected. Ready for AI detection.")
        
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()