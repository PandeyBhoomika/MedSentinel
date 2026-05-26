import pandas as pd
import groq_client
import utils

logger = utils.setup_logger("medical_logic")

def evaluate_clinical_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    """
    Takes a dataframe containing flagged anomalies and sends the extreme 
    values to Groq to generate a biological explanation for the UI.
    """
    if df.empty or 'is_anomaly' not in df.columns:
        return df

    # Filter only the rows our ML model flagged as anomalous
    anomalous_rows = df[df['is_anomaly'] == True]
    
    if anomalous_rows.empty:
        return df

    logger.info(f"Sending {len(anomalous_rows)} flagged clinical records to Groq for evaluation...")

    # For safety and cost, we only process the first 10 anomalies at a time
    for index, row in anomalous_rows.head(10).iterrows():
        # Convert the row data to a clean dictionary, dropping empty values
        patient_data = row.dropna().to_dict()
        
        # Remove our internal tracking columns from the AI prompt
        for col in ['is_anomaly', 'threat_score', 'review_status', 'id', 'patient_id']:
            patient_data.pop(col, None)

        # Build the Prompt
        system_prompt = (
            "You are a strict, highly analytical Chief Medical Officer reviewing an Electronic Health Record (EHR). "
            "A statistical anomaly detection engine has flagged the following patient record as highly abnormal. "
            "Analyze the vitals or lab results provided. "
            "Respond ONLY with a valid JSON object containing a single key: 'explanation'. "
            "The explanation must be a single, concise sentence explaining WHY these values are biologically concerning or mathematically impossible."
        )

        user_prompt = f"Patient Data:\n{patient_data}"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # Call Groq forcing JSON output
        response = groq_client.groq_chat_json(messages)

        if response and "explanation" in response:
            df.at[index, 'ai_reason'] = response["explanation"]
        else:
            df.at[index, 'ai_reason'] = "AI could not generate a clinical explanation for this anomaly."

    return df