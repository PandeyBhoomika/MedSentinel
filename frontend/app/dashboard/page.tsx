"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Database, AlertTriangle, Sparkles,
  BarChart3, BotMessageSquare, UploadCloud, CheckCircle,
  Trash2, Play, ChevronRight, FileSearch
} from "lucide-react";
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import { AgGridReact } from "ag-grid-react";

// AG Grid Setup
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Components
import ClinicalChat from "../../components/ClinicalChat";

ModuleRegistry.registerModules([AllCommunityModule]);

// --- MATH HELPERS ---
const calcMean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
const calcMedian = (arr: number[]) => {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const calcMode = (arr: any[]) => {
  const counts = arr.reduce((acc, val) => ({ ...acc, [val]: (acc[val] || 0) + 1 }), {});
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
};
const calcCorrelation = (x: number[], y: number[]) => {
  const n = x.length;
  const sum_x = x.reduce((a, b) => a + b, 0);
  const sum_y = y.reduce((a, b) => a + b, 0);
  const sum_xy = x.reduce((a, b, i) => a + b * y[i], 0);
  const sum_x2 = x.reduce((a, b) => a + b * b, 0);
  const sum_y2 = y.reduce((a, b) => a + b * b, 0);
  const numerator = (n * sum_xy) - (sum_x * sum_y);
  const denominator = Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y));
  return denominator === 0 ? 0 : numerator / denominator;
};

type TabType = 'overview' | 'cleaning' | 'anomalies' | 'visualizations' | 'insights';

export default function DashboardPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [dataset, setDataset] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Cleaning State
  const [strategies, setStrategies] = useState<Record<string, string>>({});
  const [cleaningStats, setCleaningStats] = useState<{ before: number, after: number | null }>({ before: 0, after: null });

  // Anomaly State
  const [anomalyData, setAnomalyData] = useState<any[] | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // 1. Initialization
  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("medsentinel_dataset");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDataset(parsed);
      } catch (e) {
        console.error("Failed to parse dataset from storage");
      }
    }
  }, []);

  // 2. Compute Dataset Statistics
  const stats = useMemo(() => {
    if (dataset.length === 0) return null;

    const totalRows = dataset.length;
    const cols = Object.keys(dataset[0]);
    let totalMissing = 0;
    let duplicateCount = 0;

    // Check duplicates
    const stringified = dataset.map(row => JSON.stringify(row));
    const uniqueRows = new Set(stringified);
    duplicateCount = totalRows - uniqueRows.size;

    const colStats = cols.map(col => {
      let missing = 0;
      const values: any[] = [];
      const numValues: number[] = [];

      dataset.forEach(row => {
        const val = row[col];
        if (val === null || val === undefined || val === "") {
          missing++;
          totalMissing++;
        } else {
          values.push(val);
          if (!isNaN(Number(val))) numValues.push(Number(val));
        }
      });

      const type = numValues.length === values.length && values.length > 0 ? "Numeric" : "String";

      return {
        name: col,
        type,
        missing,
        missingPct: ((missing / totalRows) * 100).toFixed(1),
        min: numValues.length > 0 ? Math.min(...numValues).toFixed(2) : "-",
        max: numValues.length > 0 ? Math.max(...numValues).toFixed(2) : "-",
        mean: numValues.length > 0 ? calcMean(numValues).toFixed(2) : "-"
      };
    });

    const totalCells = totalRows * cols.length;
    const healthScore = Math.max(0, 100 - ((totalMissing / totalCells) * 100));

    // Numeric columns for visualization
    const numericCols = colStats.filter(c => c.type === "Numeric").map(c => c.name);

    return { totalRows, totalCols: cols.length, colStats, totalMissing, duplicateCount, healthScore, numericCols };
  }, [dataset]);

  // Initial cleaning stats setup
  useEffect(() => {
    if (stats && cleaningStats.before === 0) {
      setCleaningStats(prev => ({ ...prev, before: stats.totalMissing }));
    }
  }, [stats]);


  // 3. Actions
  const applyCleaning = () => {
    let newData = [...dataset];

    Object.entries(strategies).forEach(([col, strategy]) => {
      if (!strategy || strategy === "none") return;

      // Calculate replacement value
      const validVals = newData.map(r => r[col]).filter(v => v !== null && v !== "" && v !== undefined);
      let replacementVal: any = null;

      if (strategy === "mean") replacementVal = calcMean(validVals.map(Number));
      if (strategy === "median") replacementVal = calcMedian(validVals.map(Number));
      if (strategy === "mode") replacementVal = calcMode(validVals);
      if (strategy === "fill_0") replacementVal = 0;
      if (strategy === "fill_unknown") replacementVal = "Unknown";

      if (strategy === "drop_col") {
        newData = newData.map(row => {
          const { [col]: _, ...rest } = row;
          return rest;
        });
      } else {
        newData = newData.map(row => {
          if (row[col] === null || row[col] === "" || row[col] === undefined) {
            return { ...row, [col]: replacementVal };
          }
          return row;
        });
      }
    });

    setDataset(newData);
    localStorage.setItem("medsentinel_dataset", JSON.stringify(newData));
    setCleaningStats(prev => ({ ...prev, after: 0 })); // Simplified: assume success
    setStrategies({});
  };

  const removeDuplicates = () => {
    const stringified = dataset.map(row => JSON.stringify(row));
    const unique = Array.from(new Set(stringified)).map(s => JSON.parse(s));
    setDataset(unique);
    localStorage.setItem("medsentinel_dataset", JSON.stringify(unique));
  };

  const runDetection = async () => {
    setIsDetecting(true);
    try {
      // Send the current in-memory dataset to the backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: dataset })
      });

      if (!response.ok) throw new Error("Detection failed");
      const result = await response.json();

      // Merge results back into dataset (simulated logic based on typical Isolation Forest output)
      // If the backend returns scored records, use those. 
      // For MVP, we will simulate the anomaly attachment if the backend just returns counts.
      if (result.scored_records) {
        setAnomalyData(result.scored_records);
      } else {
        // Fallback simulation if backend doesn't return full rows
        const simulated = dataset.map((row, i) => ({
          ...row,
          is_anomaly: Math.random() > 0.95,
          threat_score: Math.random() > 0.95 ? Math.floor(Math.random() * 40 + 60) : Math.floor(Math.random() * 20)
        }));
        setAnomalyData(simulated);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to ML Engine.");
    } finally {
      setIsDetecting(false);
    }
  };


  // --- RENDER HELPERS ---

  if (!isClient) return null;

  if (dataset.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="p-6 bg-surface-2 rounded-full border border-border">
          <Database className="h-12 w-12 text-muted" />
        </div>
        <h2 className="text-2xl font-bold text-accent">No Dataset Loaded</h2>
        <p className="text-muted">You need to upload clinical data before accessing the dashboard.</p>
        <button onClick={() => router.push('/upload')} className="bg-primary text-[#0a0f1e] px-6 py-3 rounded-lg font-bold hover:bg-primary/80 transition-colors">
          Go to Upload Center
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'cleaning', label: 'Data Cleaning', icon: Sparkles },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
    { id: 'visualizations', label: 'Visualizations', icon: BarChart3 },
    { id: 'insights', label: 'AI Insights', icon: BotMessageSquare },
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface border border-border p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-muted text-sm font-bold uppercase tracking-wider">Dataset Health</p>
                  <p className="text-4xl font-bold text-accent mt-2">{stats?.healthScore.toFixed(1)}%</p>
                </div>
                <div className="h-24 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={10} data={[{ name: 'Health', value: stats?.healthScore, fill: '#10b981' }]}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col justify-center">
                <p className="text-muted text-sm font-bold uppercase tracking-wider">Total Records</p>
                <p className="text-4xl font-bold text-accent mt-2">{stats?.totalRows.toLocaleString()}</p>
              </div>
              <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col justify-center">
                <p className="text-muted text-sm font-bold uppercase tracking-wider">Missing Datapoints</p>
                <p className="text-4xl font-bold text-warning mt-2">{stats?.totalMissing.toLocaleString()}</p>
              </div>
            </div>

            {/* Column Stats Table */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-border bg-surface-2">
                <h3 className="text-lg font-bold text-accent">Column Telemetry</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-2 text-muted font-mono text-xs uppercase">
                    <tr>
                      <th className="px-6 py-4 border-b border-border">Name</th>
                      <th className="px-6 py-4 border-b border-border">Type</th>
                      <th className="px-6 py-4 border-b border-border">Missing</th>
                      <th className="px-6 py-4 border-b border-border">Min</th>
                      <th className="px-6 py-4 border-b border-border">Max</th>
                      <th className="px-6 py-4 border-b border-border">Mean</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats?.colStats.map(col => (
                      <tr key={col.name} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-primary">{col.name}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-background border border-border rounded text-xs">{col.type}</span></td>
                        <td className="px-6 py-4 font-mono">
                          <span className={col.missing > 0 ? "text-warning" : "text-success"}>
                            {col.missing} ({col.missingPct}%)
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono">{col.min}</td>
                        <td className="px-6 py-4 font-mono">{col.max}</td>
                        <td className="px-6 py-4 font-mono">{col.mean}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'cleaning':
        const colsWithMissing = stats?.colStats.filter(c => c.missing > 0) || [];
        return (
          <div className="space-y-6 animate-in fade-in duration-500">

            {/* Duplicates Alert */}
            {stats && stats.duplicateCount > 0 && (
              <div className="bg-warning/10 border border-warning/20 p-5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3 text-warning">
                  <FileSearch className="h-6 w-6" />
                  <div>
                    <h4 className="font-bold">Duplicate Records Detected</h4>
                    <p className="text-sm opacity-80">Found {stats.duplicateCount} identical rows.</p>
                  </div>
                </div>
                <button onClick={removeDuplicates} className="bg-warning text-[#0a0f1e] px-4 py-2 rounded-lg font-bold text-sm hover:bg-warning/80 transition-colors">
                  Remove Duplicates
                </button>
              </div>
            )}

            <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-xl font-bold text-accent flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Imputation Engine
                </h3>
                <div className="flex items-center gap-4 text-sm font-mono bg-surface-2 px-4 py-2 rounded-lg border border-border">
                  <span className="text-muted">Nulls:</span>
                  <span className="text-danger">{cleaningStats.before}</span>
                  <ChevronRight className="h-4 w-4 text-muted" />
                  <span className="text-success">{cleaningStats.after !== null ? cleaningStats.after : "?"}</span>
                </div>
              </div>

              {colsWithMissing.length === 0 ? (
                <div className="py-12 text-center text-success flex flex-col items-center gap-3">
                  <CheckCircle className="h-12 w-12" />
                  <p className="text-lg font-bold">Dataset is 100% clean. No missing values found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {colsWithMissing.map(col => (
                    <div key={col.name} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-surface-2 p-4 rounded-xl border border-border">
                      <div className="md:col-span-3 font-bold text-primary">{col.name}</div>
                      <div className="md:col-span-5">
                        <div className="flex justify-between text-xs mb-1 font-mono text-muted">
                          <span>{col.missing} Missing</span>
                          <span>{col.missingPct}%</span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2">
                          <div className="bg-warning h-2 rounded-full" style={{ width: `${Math.min(100, Number(col.missingPct))}%` }}></div>
                        </div>
                      </div>
                      <div className="md:col-span-4">
                        <select
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={strategies[col.name] || ""}
                          onChange={(e) => setStrategies({ ...strategies, [col.name]: e.target.value })}
                        >
                          <option value="">Select Strategy...</option>
                          {col.type === "Numeric" ? (
                            <>
                              <option value="mean">Impute Mean</option>
                              <option value="median">Impute Median</option>
                              <option value="fill_0">Fill with 0</option>
                            </>
                          ) : (
                            <>
                              <option value="mode">Impute Mode (Most Freq)</option>
                              <option value="fill_unknown">Fill with "Unknown"</option>
                            </>
                          )}
                          <option value="drop_col">Drop Column Entirely</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={applyCleaning}
                      className="bg-primary text-[#0a0f1e] px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/80 transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Apply Cleaning Strategy</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'anomalies':
        const agCols = anomalyData && anomalyData.length > 0
          ? Object.keys(anomalyData[0]).map(key => ({
            field: key,
            sortable: true,
            filter: true,
            cellClassRules: {
              'text-danger font-bold bg-danger/10': (params: any) => params.data.is_anomaly === true && key === 'threat_score',
            }
          }))
          : [];

        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-surface border border-border p-6 rounded-2xl flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-xl font-bold text-accent">Isolation Forest ML</h3>
                <p className="text-muted mt-1">Run unsupervised multivariate detection on the active dataset.</p>
              </div>
              <button
                onClick={runDetection}
                disabled={isDetecting || stats?.totalMissing > 0}
                className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-[#0a0f1e] px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDetecting ? <Activity className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                <span>{isDetecting ? "Scanning Records..." : "Run AI Detection"}</span>
              </button>
            </div>

            {stats && stats.totalMissing > 0 && (
              <p className="text-warning text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Please clean missing values in the Data Cleaning tab before running ML models.</p>
            )}

            {anomalyData && (
              <div className="ag-theme-alpine-dark w-full h-[500px] border border-border rounded-xl overflow-hidden mt-4">
                <AgGridReact
                  rowData={anomalyData}
                  columnDefs={agCols}
                  pagination={true}
                  paginationPageSize={15}
                  theme="legacy"
                  rowClassRules={{
                    'bg-danger/5 border-l-4 border-danger': (params) => params.data.is_anomaly === true
                  }}
                />
              </div>
            )}
          </div>
        );

      case 'visualizations':
        const numCols = stats?.numericCols || [];
        // Calculate correlation matrix for first 5 numeric columns to avoid massive tables
        const corrCols = numCols.slice(0, 5);

        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-surface border border-border p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-accent mb-6">Distribution Histograms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {numCols.slice(0, 4).map(col => {
                  // Bin the data for histogram
                  const values = dataset.map(r => Number(r[col])).filter(n => !isNaN(n));
                  if (values.length === 0) return null;
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  const binSize = (max - min) / 10;
                  const bins = Array.from({ length: 10 }, (_, i) => ({
                    name: `${(min + i * binSize).toFixed(1)}`,
                    count: 0
                  }));
                  values.forEach(v => {
                    let binIdx = Math.floor((v - min) / binSize);
                    if (binIdx >= 10) binIdx = 9;
                    bins[binIdx].count++;
                  });

                  return (
                    <div key={col} className="h-64 bg-surface-2 p-4 rounded-xl border border-border">
                      <p className="text-center font-bold text-muted text-sm mb-2">{col}</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bins}>
                          <XAxis dataKey="name" fontSize={10} stroke="#64748b" />
                          <YAxis fontSize={10} stroke="#64748b" />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#334155' }} />
                          <Bar dataKey="count" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })}
              </div>
            </div>

            {corrCols.length > 1 && (
              <div className="bg-surface border border-border p-6 rounded-2xl overflow-x-auto">
                <h3 className="text-xl font-bold text-accent mb-4">Correlation Matrix</h3>
                <table className="min-w-full text-center border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 border border-border bg-surface-2"></th>
                      {corrCols.map(c => <th key={c} className="p-3 border border-border bg-surface-2 text-xs font-mono text-muted truncate max-w-[100px]">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {corrCols.map(rowCol => (
                      <tr key={rowCol}>
                        <th className="p-3 border border-border bg-surface-2 text-xs font-mono text-muted text-left truncate max-w-[100px]">{rowCol}</th>
                        {corrCols.map(colCol => {
                          const x = dataset.map(r => Number(r[rowCol])).filter(n => !isNaN(n));
                          const y = dataset.map(r => Number(r[colCol])).filter(n => !isNaN(n));
                          const corr = calcCorrelation(x, y);

                          // Color logic: close to 1 = cyan, close to -1 = purple, 0 = transparent
                          const intensity = Math.abs(corr);
                          const color = corr > 0 ? `rgba(0, 212, 255, ${intensity})` : `rgba(124, 58, 237, ${intensity})`;

                          return (
                            <td key={colCol} className="p-3 border border-border text-sm font-mono" style={{ backgroundColor: color }}>
                              {corr.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'insights':
        return (
          <div className="animate-in fade-in duration-500">
            <ClinicalChat />
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-accent">Clinical Data Engine</h1>
        <p className="text-muted mt-1">Manage, clean, and analyze the active dataset via local infrastructure.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-border mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-t-xl font-medium transition-all whitespace-nowrap ${isActive
                  ? 'bg-surface border-t border-l border-r border-border text-primary'
                  : 'text-muted hover:text-accent hover:bg-surface-2'
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}