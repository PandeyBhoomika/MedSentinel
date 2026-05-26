"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Activity, Download, ArrowLeft, PlusCircle,
    FileText, Database, Sparkles, AlertTriangle, BrainCircuit
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AgGridReact } from "ag-grid-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

// AG Grid Setup
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function ReportPage() {
    const router = useRouter();
    const reportRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [dataset, setDataset] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const stored = localStorage.getItem("medsentinel_dataset");
        if (stored) {
            try {
                setDataset(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse dataset from storage");
            }
        }
    }, []);

    // --- Compute Report Telemetry ---
    const reportStats = useMemo(() => {
        if (dataset.length === 0) return null;

        const totalRows = dataset.length;
        const totalCols = Object.keys(dataset[0]).length;

        // Extract Anomalies
        const anomalies = dataset.filter(row => row.is_anomaly === true);
        const cleanRecords = totalRows - anomalies.length;

        // Severity Breakdown
        const critical = anomalies.filter(a => a.threat_score >= 80).length;
        const elevated = anomalies.filter(a => a.threat_score >= 50 && a.threat_score < 80).length;
        const warning = anomalies.filter(a => a.threat_score < 50).length;

        // Threat Score Distribution for Chart
        const bins = [
            { name: "0-20", count: anomalies.filter(a => a.threat_score <= 20).length },
            { name: "21-40", count: anomalies.filter(a => a.threat_score > 20 && a.threat_score <= 40).length },
            { name: "41-60", count: anomalies.filter(a => a.threat_score > 40 && a.threat_score <= 60).length },
            { name: "61-80", count: anomalies.filter(a => a.threat_score > 60 && a.threat_score <= 80).length },
            { name: "81-100", count: anomalies.filter(a => a.threat_score > 80).length },
        ];

        // Extract AI Insights (Get unique reasons)
        const insightsSet = new Set<string>();
        anomalies.forEach(a => {
            if (a.ai_reason) insightsSet.add(a.ai_reason);
        });
        const topInsights = Array.from(insightsSet).slice(0, 5);

        return {
            totalRows, totalCols, anomalies, cleanRecords,
            critical, elevated, warning, bins, topInsights
        };
    }, [dataset]);

    // --- PDF Generation ---
    const downloadPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // High resolution
                backgroundColor: '#0a0f1e', // Match our dark theme background
                windowWidth: reportRef.current.scrollWidth,
                windowHeight: reportRef.current.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`MedSentinel_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Failed to generate PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    const clearAndStartNew = () => {
        localStorage.removeItem("medsentinel_dataset");
        router.push("/upload");
    };

    if (!isClient) return null;

    if (dataset.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="p-6 bg-surface-2 rounded-full border border-border">
                    <FileText className="h-12 w-12 text-muted" />
                </div>
                <h2 className="text-2xl font-bold text-accent">No Analysis Found</h2>
                <p className="text-muted">You need to run an analysis in the Dashboard before generating a report.</p>
                <button onClick={() => router.push('/dashboard')} className="bg-primary text-[#0a0f1e] px-6 py-3 rounded-lg font-bold hover:bg-primary/80 transition-colors">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    // AG Grid Columns for Anomaly Table
    const agCols = reportStats?.anomalies.length ? Object.keys(reportStats.anomalies[0]).slice(0, 8).map(key => ({
        field: key,
        sortable: true,
        resizable: true,
        minWidth: key === 'ai_reason' ? 300 : 120,
        cellClassRules: {
            'text-danger font-bold bg-danger/10': (params: any) => key === 'threat_score' && params.value >= 80,
            'text-warning font-bold': (params: any) => key === 'threat_score' && params.value >= 50 && params.value < 80,
        }
    })) : [];

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

            {/* Top Action Bar (Will not be included in PDF) */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-surface p-4 rounded-2xl border border-border shadow-sm mb-8 gap-4">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center space-x-2 text-muted hover:text-accent transition-colors px-4 py-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Dashboard</span>
                </button>

                <div className="flex space-x-4 w-full sm:w-auto">
                    <button
                        onClick={clearAndStartNew}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-surface-2 hover:bg-border border border-border text-accent px-4 py-2 rounded-xl transition-colors"
                    >
                        <PlusCircle className="h-4 w-4" />
                        <span>New Analysis</span>
                    </button>
                    <button
                        onClick={downloadPDF}
                        disabled={isExporting}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-primary hover:bg-primary/80 text-[#0a0f1e] px-6 py-2 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)] disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />
                        <span>{isExporting ? "Generating..." : "Download PDF"}</span>
                    </button>
                </div>
            </div>

            {/* ================= PRINTABLE REPORT CONTAINER ================= */}
            <div
                ref={reportRef}
                className="bg-surface border border-border rounded-2xl p-8 md:p-12 shadow-xl space-y-12 relative overflow-hidden"
            >
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

                {/* HEADER */}
                <div className="flex justify-between items-end border-b border-border pb-8 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                            <Activity className="h-8 w-8 text-primary" />
                            <h1 className="text-3xl font-bold text-accent tracking-tight">MedSentinel Final Report</h1>
                        </div>
                        <p className="text-muted text-sm uppercase tracking-widest font-mono pl-11">
                            Automated Clinical Quality Audit
                        </p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-sm font-mono text-muted">Generated: <span className="text-accent">{new Date().toLocaleString()}</span></p>
                        <p className="text-sm font-mono text-muted">Status: <span className="text-success">HIPAA Compliant Execution</span></p>
                    </div>
                </div>

                {/* SECTION 1: Dataset Summary */}
                <section className="space-y-4 relative z-10">
                    <h2 className="text-xl font-bold text-accent flex items-center gap-2 border-b border-border pb-2">
                        <Database className="h-5 w-5 text-primary" /> Section 1: Target Dataset Profile
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-surface-2 p-4 rounded-xl border border-border">
                            <p className="text-xs text-muted uppercase font-bold tracking-wider">Total Rows Scanned</p>
                            <p className="text-2xl font-bold text-accent mt-1">{reportStats?.totalRows}</p>
                        </div>
                        <div className="bg-surface-2 p-4 rounded-xl border border-border">
                            <p className="text-xs text-muted uppercase font-bold tracking-wider">Total Columns</p>
                            <p className="text-2xl font-bold text-accent mt-1">{reportStats?.totalCols}</p>
                        </div>
                        <div className="bg-surface-2 p-4 rounded-xl border border-border">
                            <p className="text-xs text-muted uppercase font-bold tracking-wider">Clean Records</p>
                            <p className="text-2xl font-bold text-success mt-1">{reportStats?.cleanRecords}</p>
                        </div>
                        <div className="bg-surface-2 p-4 rounded-xl border border-border">
                            <p className="text-xs text-muted uppercase font-bold tracking-wider">Total Anomalies</p>
                            <p className="text-2xl font-bold text-danger mt-1">{reportStats?.anomalies.length}</p>
                        </div>
                    </div>
                </section>

                {/* SECTION 2: Anomaly Summary & Charts */}
                {reportStats && reportStats.anomalies.length > 0 && (
                    <section className="space-y-6 relative z-10">
                        <h2 className="text-xl font-bold text-accent flex items-center gap-2 border-b border-border pb-2">
                            <AlertTriangle className="h-5 w-5 text-warning" /> Section 2: Anomaly Threat Distribution
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Severity Breakdown */}
                            <div className="space-y-3">
                                <div className="bg-surface-2 p-4 rounded-xl border border-border flex justify-between items-center">
                                    <span className="text-sm font-bold text-muted">Critical (80-100)</span>
                                    <span className="text-lg font-mono text-danger font-bold">{reportStats.critical}</span>
                                </div>
                                <div className="bg-surface-2 p-4 rounded-xl border border-border flex justify-between items-center">
                                    <span className="text-sm font-bold text-muted">Elevated (50-79)</span>
                                    <span className="text-lg font-mono text-warning font-bold">{reportStats.elevated}</span>
                                </div>
                                <div className="bg-surface-2 p-4 rounded-xl border border-border flex justify-between items-center">
                                    <span className="text-sm font-bold text-muted">Warning (0-49)</span>
                                    <span className="text-lg font-mono text-primary font-bold">{reportStats.warning}</span>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="md:col-span-2 h-48 bg-surface-2 p-4 rounded-xl border border-border">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={reportStats.bins}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" fontSize={10} stroke="#64748b" tickLine={false} />
                                        <YAxis fontSize={10} stroke="#64748b" tickLine={false} axisLine={false} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1a2235' }} />
                                        <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>
                )}

                {/* SECTION 3: AI Clinical Insights */}
                {reportStats && reportStats.topInsights.length > 0 && (
                    <section className="space-y-4 relative z-10">
                        <h2 className="text-xl font-bold text-accent flex items-center gap-2 border-b border-border pb-2">
                            <BrainCircuit className="h-5 w-5 text-secondary" /> Section 3: Primary AI Clinical Explanations
                        </h2>
                        <div className="bg-surface-2 border border-border rounded-xl p-6 space-y-4">
                            <p className="text-sm text-muted mb-4">
                                The Groq LLaMA models analyzed the flagged records and identified the following recurring medical patterns:
                            </p>
                            <ul className="space-y-3">
                                {reportStats.topInsights.map((insight, idx) => (
                                    <li key={idx} className="flex items-start space-x-3 text-sm">
                                        <span className="text-secondary font-bold mt-0.5">•</span>
                                        <span className="text-accent leading-relaxed">{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                )}

                {/* SECTION 4: Data Table Extract */}
                {reportStats && reportStats.anomalies.length > 0 && (
                    <section className="space-y-4 relative z-10">
                        <h2 className="text-xl font-bold text-accent flex items-center gap-2 border-b border-border pb-2">
                            <Sparkles className="h-5 w-5 text-primary" /> Section 4: Flagged Record Extract (Top 15)
                        </h2>
                        <div className="ag-theme-alpine-dark w-full h-[400px] border border-border rounded-xl overflow-hidden">
                            <AgGridReact
                                rowData={reportStats.anomalies.slice(0, 15)} // Only print top 15 to fit on page nicely
                                columnDefs={agCols}
                                theme="legacy"
                                domLayout="normal"
                            />
                        </div>
                    </section>
                )}

                {/* Footer */}
                <div className="pt-8 border-t border-border text-center relative z-10">
                    <p className="text-xs text-muted font-mono">
                        CONFIDENTIAL MEDICAL DATA • GENERATED BY MEDSENTINEL AI ENGINE • SECURE VAULT RECORD
                    </p>
                </div>

            </div>
        </div>
    );
}