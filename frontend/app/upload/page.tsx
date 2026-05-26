"use client";

import { motion } from "framer-motion";
import toast from "react-hot-toast";
import ProcessingOverlay from "../../components/ProcessingOverlay";
import { useState, dragEvent, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    UploadCloud, AlertTriangle, FileText, Trash2,
    Play, Database, Columns, HelpCircle, CheckCircle
} from "lucide-react";
import Papa from "papaparse";
import { AgGridReact } from "ag-grid-react";

// AG Grid Setup for Dark Theme
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([AllCommunityModule]);

interface SchemaItem {
    columnName: string;
    detectedType: string;
    nullCount: number;
    samples: string[];
}

interface DatasetStats {
    totalRows: number;
    totalCols: number;
    missingPercentage: string;
    typesCount: string;
}

export default function UploadPage() {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Parsed States
    const [rawRows, setRawRows] = useState<any[]>([]);
    const [previewCols, setPreviewCols] = useState<any[]>([]);
    const [schemaData, setSchemaData] = useState<SchemaItem[]>([]);
    const [stats, setStats] = useState<DatasetStats | null>(null);

    // --- 1. Helper: Infer Native Data Type ---
    const inferType = (val: any): string => {
        if (val === undefined || val === null || val === "") return "NULL";
        if (!isNaN(Number(val)) && val.trim() !== "") return "Number";
        if (val.toLowerCase() === "true" || val.toLowerCase() === "false") return "Boolean";
        // Check if looks like ISO/standard date string
        if (!isNaN(Date.parse(val)) && isNaN(Number(val)) && val.length > 5) return "DateTime";
        return "String";
    };

    // --- 2. Central Processing Core ---
    const processDataset = (data: any[]) => {
        if (!data || data.length === 0) {
            setErrorMsg("The uploaded dataset contains zero readable records.");
            return;
        }

        const totalRows = data.length;
        const firstRow = data[0];
        const columnNames = Object.keys(firstRow);
        const totalCols = columnNames.length;

        let totalCells = totalRows * totalCols;
        let missingCells = 0;
        const typeDiscovery: Record<string, Set<string>> = {};

        // Prepare Schema Aggregation Matrix
        const schemaMap: Record<string, { nulls: number; types: Record<string, number>; uniqueSamples: Set<string> }> = {};
        columnNames.forEach(col => {
            schemaMap[col] = { nulls: 0, types: {}, uniqueSamples: new Set() };
            typeDiscovery[col] = new Set();
        });

        // Compute Telemetry Matrix across dataset rows
        data.forEach(row => {
            columnNames.forEach(col => {
                const val = row[col];
                const currentType = inferType(String(val));

                if (val === undefined || val === null || String(val).trim() === "") {
                    missingCells++;
                    schemaMap[col].nulls++;
                } else {
                    typeDiscovery[col].add(currentType);
                    schemaMap[col].types[currentType] = (schemaMap[col].types[currentType] || 0) + 1;
                    if (schemaMap[col].uniqueSamples.size < 3) {
                        schemaMap[col].uniqueSamples.add(String(val));
                    }
                }
            });
        });

        // Compile Schema Profile Table Rows
        const finalizedSchema: SchemaItem[] = columnNames.map(col => {
            const recordedTypes = schemaMap[col].types;
            let dominantType = "String";
            let highestCount = 0;

            Object.entries(recordedTypes).forEach(([type, count]) => {
                if (count > highestCount) {
                    highestCount = count;
                    dominantType = type;
                }
            });

            if (schemaMap[col].nulls === totalRows) dominantType = "Empty/Null";

            return {
                columnName: col,
                detectedType: dominantType,
                nullCount: schemaMap[col].nulls,
                samples: Array.from(schemaMap[col].uniqueSamples)
            };
        });

        // Compute Global Aggregated Counters
        const distinctTypesGlobal = new Set(finalizedSchema.map(s => s.detectedType)).size;
        const missingPercentage = ((missingCells / totalCells) * 100).toFixed(1);

        // Mount Configuration Layouts
        setRawRows(data);
        setSchemaData(finalizedSchema);
        setStats({
            totalRows,
            totalCols,
            missingPercentage: `${missingPercentage}%`,
            typesCount: `${distinctTypesGlobal} Types Found`
        });

        // Configure AG Grid Headers dynamically
        const columnsConfig = columnNames.map(col => ({
            field: col,
            headerName: col.toUpperCase().replace(/_/g, " "),
            sortable: true,
            filter: true,
            resizable: true,
        }));
        setPreviewCols(columnsConfig);
    };

    // --- 3. Native File Interceptors ---
    const handleFileExtraction = (file: File) => {
        setErrorMsg(null);
        if (!file) return;

        // Strict validation boundaries
        if (file.size > 50 * 1024 * 1024) {
            setErrorMsg("File volume violation. Upload cannot surpass the 50MB infrastructure limit.");
            return;
        }

        const extension = file.name.split('.').pop()?.toLowerCase();
        setFileInfo({ name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB` });

        const reader = new FileReader();

        if (extension === "csv") {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false, // Type handled securely in step 2
                complete: (results) => processDataset(results.data),
                error: (err) => setErrorMsg(`Parsing failure: ${err.message}`)
            });
        } else if (extension === "json") {
            reader.onload = (e) => {
                try {
                    const parsedJson = JSON.parse(e.target?.result as string);
                    const localizedArray = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
                    processDataset(localizedArray);
                } catch (err) {
                    setErrorMsg("JSON validation matrix corrupted. Invalid structural notation.");
                }
            };
            reader.readAsText(file);
        } else {
            setErrorMsg("File schema rejection. MedSentinel engine isolates imports strictly to CSV and JSON formats.");
            setFileInfo(null);
        }
    };

    // --- 4. Event Delegation Overrides ---
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = () => { setIsDragging(false); };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropTargetFile = e.dataTransfer.files[0];
        handleFileExtraction(dropTargetFile);
    };

    const purgeActiveState = () => {
        setFileInfo(null);
        setErrorMsg(null);
        setRawRows([]);
        setSchemaData([]);
        setStats(null);
    };

    // Commit context structures to client state layer
    const pipelineAnalysisCommit = () => {
        if (typeof window !== "undefined" && rawRows.length > 0) {
            localStorage.setItem("medsentinel_dataset", JSON.stringify(rawRows));
            router.push("/dashboard");
        }
    };

    // Truncate runtime visualization performance array
    const activePreviewData = useMemo(() => rawRows.slice(0, 10), [rawRows]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto px-1">

            {/* Header Panel */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-md">
                <h1 className="text-3xl font-bold text-accent tracking-tight">Clinical Intake Center</h1>
                <p className="text-muted mt-1">Stage structured analytical telemetry in-browser. All verification occurs execution-side inside client infrastructure sandbox.</p>
            </div>

            {/* Primary Error State Alert */}
            {errorMsg && (
                <div className="bg-danger/10 border border-danger/20 text-danger px-5 py-4 rounded-xl flex items-center space-x-3 shadow-sm">
                    <AlertTriangle className="h-6 w-6 flex-shrink-0" />
                    <span className="font-semibold tracking-wide">{errorMsg}</span>
                </div>
            )}

            {/* Drag Zone and Context Shell */}
            {!fileInfo ? (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`bg-surface border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-4 group ${isDragging
                        ? 'border-primary bg-primary/5 shadow-[0_0_25px_rgba(0,212,255,0.15)]'
                        : 'border-border hover:border-primary/50 hover:bg-surface-2'
                        }`}
                >
                    <div className="p-5 bg-surface-2 rounded-full border border-border group-hover:border-primary/30 transition-colors">
                        <UploadCloud className="h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-accent">Drop runtime files here or trigger a manual pipeline search</p>
                        <p className="text-sm text-muted mt-1">Accepting structured relational variants (.CSV, .JSON) inside 50MB storage thresholds</p>
                    </div>
                    <input
                        type="file"
                        id="fileLoader"
                        className="hidden"
                        accept=".csv,.json"
                        onChange={(e) => e.target.files && handleFileExtraction(e.target.files[0])}
                    />
                    <label
                        htmlFor="fileLoader"
                        className="bg-surface-2 border border-border text-accent px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-border transition-colors cursor-pointer"
                    >
                        Browse Directory
                    </label>
                </div>
            ) : (
                /* File Management Console Active Metadata */
                <div className="bg-surface p-5 rounded-2xl border border-border flex justify-between items-center shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-bold text-accent tracking-wide">{fileInfo.name}</p>
                            <p className="text-xs text-muted font-mono mt-0.5">{fileInfo.size}</p>
                        </div>
                    </div>
                    <button
                        onClick={purgeActiveState}
                        className="p-3 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl transition-all flex items-center space-x-1 font-medium"
                    >
                        <Trash2 className="h-5 w-5" />
                        <span className="text-sm hidden sm:inline">Flush Memory</span>
                    </button>
                </div>
            )}

            {/* Analytics Execution Panel (Fired post processing validation check) */}
            {stats && (
                <div className="space-y-8 animate-in fade-in duration-300">

                    {/* 4 Summary Telemetry Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { title: "Total Rows", value: stats.totalRows, icon: Database },
                            { title: "Total Columns", value: stats.totalCols, icon: Columns },
                            { title: "Missing Cells %", value: stats.missingPercentage, icon: HelpCircle },
                            { title: "Typing Profile", value: stats.typesCount, icon: CheckCircle }
                        ].map((card, idx) => (
                            <div key={idx} className="bg-surface border border-border p-5 rounded-xl shadow-sm flex items-center space-x-4">
                                <div className="p-3 bg-surface-2 rounded-lg text-primary">
                                    <card.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted uppercase font-semibold tracking-wider">{card.title}</p>
                                    <p className="text-2xl font-bold text-accent mt-0.5 font-mono">{card.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Core Structured Structural Matrix Schema Data Map */}
                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-4">
                        <h3 className="text-xl font-bold text-accent tracking-wide">Data Matrix Structural Mapping</h3>
                        <div className="overflow-x-auto rounded-xl border border-border bg-surface-2">
                            <table className="min-w-full divide-y divide-border text-left text-sm">
                                <thead className="bg-surface text-muted font-mono text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Column Name</th>
                                        <th className="px-6 py-4">Type Inferred</th>
                                        <th className="px-6 py-4">Null Cell Matrix count</th>
                                        <th className="px-6 py-4">Structural Data Previews</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-accent">
                                    {schemaData.map((schema, index) => (
                                        <tr key={index} className="hover:bg-background/40 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-primary">{schema.columnName}</td>
                                            <td className="px-6 py-4 font-medium"><span className="px-2.5 py-1 bg-background border border-border rounded-md text-xs">{schema.detectedType}</span></td>
                                            <td className="px-6 py-4 font-mono text-muted">{schema.nullCount}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-secondary tracking-wide">{schema.samples.join(" | ") || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* AG Grid Pipeline Preview Array View Box */}
                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-4">
                        <h3 className="text-xl font-bold text-accent tracking-wide">Matrix Snapshot (First 10 Structural Records)</h3>
                        <div className="ag-theme-alpine-dark w-full h-[320px] border border-border rounded-xl overflow-hidden">
                            <AgGridReact
                                rowData={activePreviewData}
                                columnDefs={previewCols}
                                suppressCellFocus={true}
                                theme="legacy"
                            />
                        </div>
                    </div>

                    {/* Pipeline Launch Executive Execution Node */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={pipelineAnalysisCommit}
                            className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-[#0a0f1e] px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
                        >
                            <span>Initialize Analytical Core Pipeline</span>
                            <Play className="h-5 w-5 fill-current" />
                        </button>
                    </div>

                </div>
            )}

        </div>
    );
}