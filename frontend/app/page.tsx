"use client";


import ThreatChart from "../components/ThreatChart";
import { useState } from "react";
import ClinicalChat from "../components/ClinicalChat";
import { api } from "../lib/api";
import { DetectionResponse } from "../types";
import { Activity, AlertTriangle, Database, Play, CheckCircle } from "lucide-react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDetection = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This calls the FastAPI /api/detect route we built!
      const data = await api.runDetection();
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Failed to connect to the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-accent">Clinical Data Engine</h1>
          <p className="text-muted mt-1">Initialize the ML pipeline to scan electronic health records.</p>
        </div>
        <button
          onClick={runDetection}
          disabled={isLoading}
          className="mt-4 md:mt-0 flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {isLoading ? (
            <Activity className="h-5 w-5 animate-spin" />
          ) : (
            <Play className="h-5 w-5 fill-current" />
          )}
          <span>{isLoading ? "Running ML Pipeline..." : "Run AI Detection"}</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Results State (Only shows after you click the button) */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Records Card */}
          <div className="bg-surface border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center space-x-5">
            <div className="p-4 bg-primary/10 rounded-xl text-primary">
              <Database className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-muted font-semibold uppercase tracking-wider">Records Scanned</p>
              <h3 className="text-4xl font-bold text-accent mt-1">
                {results.total_records_scanned || 0}
              </h3>
            </div>
          </div>

          {/* Anomalies Card */}
          <div className="bg-surface border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center space-x-5">
            <div className={`p-4 rounded-xl ${results.anomalies_flagged && results.anomalies_flagged > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
              {results.anomalies_flagged && results.anomalies_flagged > 0 ? (
                <AlertTriangle className="h-7 w-7" />
              ) : (
                <CheckCircle className="h-7 w-7" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted font-semibold uppercase tracking-wider">Anomalies Flagged</p>
              <h3 className="text-4xl font-bold text-accent mt-1">
                {results.anomalies_flagged || 0}
              </h3>
            </div>
          </div>
        </div>
      )}
      {/* Results State (Only shows after you click the button) */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ... stat cards ... */}
        </div>
      )}

      {/* NEW: The Visual Chart */}
      <ThreatChart />

      {/* Natural Language SQL Agent Chat Interface */}
      <ClinicalChat />

    </div>
  );
}