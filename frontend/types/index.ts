// types/index.ts

export interface VitalSign {
    id: string;
    patient_id: string;
    recorded_at: string;
    heart_rate: number;
    blood_pressure_sys: number;
    blood_pressure_dia: number;
    temperature: number;
    o2_saturation: number;
    is_anomaly: boolean;
    threat_score: number;
    ai_reason?: string;
    review_status: string;
}

export interface DetectionResponse {
    status: string;
    message: string;
    total_records_scanned: number;
    anomalies_flagged: number;
}

export interface QueryResponse {
    sql_executed?: string;
    row_count?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any[];
    error?: string;
}