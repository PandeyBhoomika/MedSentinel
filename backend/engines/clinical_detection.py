import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import utils

logger = utils.setup_logger("clinical_detection")

def run_anomaly_detection(df: pd.DataFrame, feature_columns: list) -> pd.DataFrame:
    """
    Scans a clinical DataFrame (like Vitals or Labs) using an Isolation Forest 
    to detect statistical outliers and assigns a 0-100 Threat Score.
    """
    if df.empty or not feature_columns:
        logger.warning("Empty dataframe or no features provided for anomaly detection.")
        return df

    try:
        # Step 1: Filter out rows with missing values in our target columns
        clean_df = df.dropna(subset=feature_columns).copy()
        
        if clean_df.empty:
            return df

        # Step 2: Initialize the ML Model
        # contamination=0.05 means we assume roughly 5% of the data might be anomalous
        model = IsolationForest(contamination=0.05, random_state=42)

        # Step 3: Train & Predict in one go
        # Returns 1 for normal, -1 for anomaly
        predictions = model.fit_predict(clean_df[feature_columns])

        # Step 4: Calculate Threat Scores
        # decision_function gives a raw score (negative means anomaly)
        raw_scores = model.decision_function(clean_df[feature_columns])
        
        # Convert predictions to boolean (True if it's an anomaly)
        clean_df['is_anomaly'] = predictions == -1

        # Normalize the raw ML scores into a human-readable 0-100 Threat Score
        # Normal records get 0-49, Anomalies get 50-100
        threat_scores = np.where(
            predictions == -1,
            np.interp(-raw_scores, [0, abs(raw_scores.min())], [50, 100]), 
            np.interp(-raw_scores, [-raw_scores.max(), 0], [0, 49])       
        )
        clean_df['threat_score'] = np.round(threat_scores, 2)
        
        # Step 5: Automatically flag anomalies for human clinical review
        clean_df['review_status'] = np.where(
            clean_df['is_anomaly'] == True, 
            'flagged_for_review', 
            'clean'
        )

        # Merge the results back into the original dataframe
        df.update(clean_df)
        return df

    except Exception as e:
        logger.error(f"Failed to run anomaly detection: {e}")
        return df