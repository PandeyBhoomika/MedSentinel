"use client";

import { useState } from "react";
import { api } from "../lib/api";
import { Search, Loader2, BotMessageSquare, Database, AlertTriangle } from "lucide-react";
import { AgGridReact } from "ag-grid-react";

// AG Grid Core CSS & Module Registration
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css"; // <--- Updated

// Fix for AG Grid Error #272: Register the community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ClinicalChat() {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [rowData, setRowData] = useState<any[] | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [colDefs, setColDefs] = useState<any[]>([]);
    const [sqlUsed, setSqlUsed] = useState("");

    // State to catch and display backend errors
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleAskAI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setRowData(null);
        setSqlUsed("");
        setErrorMsg(null); // Clear previous errors

        try {
            const response = await api.runQuery(query);

            if (response.data && response.data.length > 0) {
                setRowData(response.data);

                // Dynamically build columns based on whatever the AI decides to return
                const columns = Object.keys(response.data[0]).map((key) => {
                    return {
                        field: key,
                        headerName: key.replace(/_/g, " ").toUpperCase(),
                        sortable: true,
                        filter: true,
                        resizable: true,
                        minWidth: key === "ai_reason" ? 400 : 150,
                        autoHeight: key === "ai_reason",
                        wrapText: key === "ai_reason",
                    };
                });
                setColDefs(columns);
            } else {
                setRowData([]); // Empty results
            }
            setSqlUsed(response.sql_executed || "");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("AI Query Error:", error);
            // Extract the exact error message sent from FastAPI
            const backendMessage = error.response?.data?.detail || "The AI or Database encountered an unknown error.";
            setErrorMsg(backendMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm space-y-6 mt-8">
            <div className="flex items-center space-x-3 text-accent border-b border-border pb-4">
                <BotMessageSquare className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">Natural Language Database Agent</h2>
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleAskAI} className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask the AI (e.g., 'Show me all anomalies' or 'Show patients with heart rate over 100')"
                    className="w-full pl-12 pr-32 py-4 bg-surface-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-accent"
                />
                <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Ask Data"}
                </button>
            </form>

            {/* Error Display Banner */}
            {errorMsg && (
                <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl flex items-center space-x-3 text-sm font-medium">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* SQL Transparency Badge */}
            {sqlUsed && (
                <div className="flex items-start space-x-2 text-xs text-muted bg-surface-2 p-3 rounded-lg border border-border font-mono overflow-x-auto">
                    <Database className="h-4 w-4 flex-shrink-0 mt-0.5 text-secondary" />
                    <span><strong className="text-accent">AI Generated SQL:</strong> {sqlUsed}</span>
                </div>
            )}

            {/* AG Grid Data Table */}
            {rowData !== null && (
                <div className="ag-theme-alpine-dark w-full h-[400px] border border-border rounded-xl overflow-hidden mt-4">
                    {rowData.length > 0 ? (
                        <AgGridReact
                            rowData={rowData}
                            columnDefs={colDefs}
                            pagination={true}
                            paginationPageSize={10}
                            suppressCellFocus={true}
                            theme="legacy"       // <--- ADD THIS EXACT LINE
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted">
                            No results found for that query.
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}