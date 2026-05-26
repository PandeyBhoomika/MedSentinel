// lib/api.ts
import axios from 'axios';
import { DetectionResponse, QueryResponse } from '../types';

// --- New Types for Dataset Upload ---
export interface DatasetUploadPayload {
    columns: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: any[][];
}

export interface UploadResponse {
    status: string;
    total_records: number;
    anomalies_flagged: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cleaned_data: any[];
}
// ------------------------------------

// Connects to the URL we put in .env.local
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const api = {
    // Triggers the Machine Learning Anomaly Detection Pipeline (PostgreSQL version)
    runDetection: async (): Promise<DetectionResponse> => {
        try {
            const response = await apiClient.post<DetectionResponse>('/api/detect');
            return response.data;
        } catch (error) {
            console.error("Detection pipeline failed:", error);
            throw error;
        }
    },

    // Triggers the Groq Natural Language SQL Agent
    runQuery: async (question: string): Promise<QueryResponse> => {
        try {
            const response = await apiClient.post<QueryResponse>('/api/query', { question });
            return response.data;
        } catch (error) {
            console.error("NL Query failed:", error);
            throw error;
        }
    },

    // --- NEW: Triggers the Dynamic Dataset Upload and Detection Pipeline ---
    uploadDataset: async (payload: DatasetUploadPayload): Promise<UploadResponse> => {
        try {
            const response = await apiClient.post<UploadResponse>('/api/upload-dataset', payload);
            return response.data;
        } catch (error) {
            console.error("Dataset upload failed:", error);
            throw error;
        }
    },
};