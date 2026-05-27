"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import {
    Search, Loader2, BotMessageSquare, Database,
    AlertTriangle, Sparkles, ChevronRight, Zap,
    TrendingUp, Activity, FileSearch, BarChart3,
    Send, RotateCcw, Copy, CheckCheck
} from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { motion, AnimatePresence } from "framer-motion";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([AllCommunityModule]);

// ─── AI Suggested Queries ─────────────────────────────────────────────────────
const SUGGESTED_QUERIES = [
    { icon: AlertTriangle, label: "Show all anomalies", query: "Show me all records flagged as anomalies", color: "#ef4444" },
    { icon: Activity, label: "High heart rate", query: "Show patients with heart rate over 120", color: "#f59e0b" },
    { icon: TrendingUp, label: "Critical vitals", query: "Find patients with critical blood pressure readings", color: "#7c3aed" },
    { icon: BarChart3, label: "Top 10 records", query: "Show the top 10 records by threat score", color: "#00d4ff" },
    { icon: FileSearch, label: "Missing data", query: "Show records that have missing values", color: "#10b981" },
    { icon: Zap, label: "Dangerous glucose", query: "Find patients with dangerous glucose levels above 300", color: "#f97316" },
];

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingDots() {
    return (
        <div className="flex items-center gap-1 px-4 py-3">
            {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-[#00d4ff]"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
            ))}
        </div>
    );
}

// ─── SQL Badge ────────────────────────────────────────────────────────────────
function SqlBadge({ sql, onCopy }: { sql: string; onCopy: () => void }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(sql);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        onCopy();
    };
    return (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 text-xs bg-[#0a0f1e] p-4 rounded-xl border border-[rgba(124,58,237,0.2)] font-mono overflow-x-auto group">
            <Database className="h-4 w-4 flex-shrink-0 mt-0.5 text-[#7c3aed]" />
            <div className="flex-1">
                <span className="text-[#7c3aed] font-bold uppercase tracking-wider text-[10px]">AI Generated SQL</span>
                <p className="text-[#f1f5f9] mt-1 leading-relaxed break-all">{sql}</p>
            </div>
            <button onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-[#00d4ff] text-[#64748b]">
                {copied ? <CheckCheck className="h-4 w-4 text-[#10b981]" /> : <Copy className="h-4 w-4" />}
            </button>
        </motion.div>
    );
}

// ─── Result Summary ───────────────────────────────────────────────────────────
function ResultSummary({ data }: { data: any[] }) {
    const cols = data.length > 0 ? Object.keys(data[0]).length : 0;
    return (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-6 px-4 py-3 bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl text-sm">
            <div className="flex items-center gap-2 text-[#10b981]">
                <CheckCheck className="h-4 w-4" />
                <span className="font-bold">Query Successful</span>
            </div>
            <div className="h-4 w-px bg-[rgba(255,255,255,0.1)]" />
            <span className="text-[#64748b]"><span className="text-[#f1f5f9] font-mono">{data.length}</span> rows returned</span>
            <span className="text-[#64748b]"><span className="text-[#f1f5f9] font-mono">{cols}</span> columns</span>
        </motion.div>
    );
}

export default function ClinicalChat() {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [rowData, setRowData] = useState<any[] | null>(null);
    const [colDefs, setColDefs] = useState<any[]>([]);
    const [sqlUsed, setSqlUsed] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [history, setHistory] = useState<{ q: string; rows: number; time: number }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const [copiedSql, setCopiedSql] = useState(false);

    const handleAskAI = async (q?: string) => {
        const queryText = q || query;
        if (!queryText.trim()) return;
        setIsLoading(true);
        setRowData(null);
        setSqlUsed("");
        setErrorMsg(null);
        const startTime = Date.now();

        try {
            const response = await api.runQuery(queryText);
            if (response.data && response.data.length > 0) {
                setRowData(response.data);
                setColDefs(Object.keys(response.data[0]).map(key => ({
                    field: key,
                    headerName: key.replace(/_/g, " ").toUpperCase(),
                    sortable: true, filter: true, resizable: true,
                    minWidth: key === "ai_reason" ? 400 : 130,
                    autoHeight: key === "ai_reason",
                    wrapText: key === "ai_reason",
                })));
                setHistory(prev => [{ q: queryText, rows: response.data.length, time: Date.now() - startTime }, ...prev.slice(0, 4)]);
            } else {
                setRowData([]);
            }
            setSqlUsed(response.sql_executed || "");
        } catch (error: any) {
            const msg = error.response?.data?.detail || "The AI or Database encountered an error.";
            setErrorMsg(msg);
        } finally {
            setIsLoading(false);
            if (!q) setQuery("");
        }
    };

    const handleSuggestionClick = (q: string) => {
        setQuery(q);
        handleAskAI(q);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAskAI();
    };

    const clearAll = () => {
        setRowData(null);
        setSqlUsed("");
        setErrorMsg(null);
        setQuery("");
        inputRef.current?.focus();
    };

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#00d4ff] rounded-xl blur-lg opacity-20 animate-pulse" />
                        <div className="relative p-2.5 bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-xl">
                            <BotMessageSquare className="h-6 w-6 text-[#00d4ff]" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#f1f5f9]">Natural Language Data Agent</h2>
                        <p className="text-[#64748b] text-xs flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse inline-block" />
                            Powered by Groq LLaMA · HIPAA Compliant
                        </p>
                    </div>
                </div>
                {(rowData !== null || errorMsg) && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onClick={clearAll}
                        className="flex items-center gap-2 text-xs text-[#64748b] hover:text-[#f1f5f9] transition-colors px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]">
                        <RotateCcw className="h-3.5 w-3.5" /> New Query
                    </motion.button>
                )}
            </div>

            {/* ── AI Suggested Queries ── */}
            <div>
                <p className="text-[#64748b] text-xs font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-[#00d4ff]" /> AI Suggestions
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SUGGESTED_QUERIES.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <motion.button key={i}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                                onClick={() => handleSuggestionClick(s.query)}
                                disabled={isLoading}
                                className="flex items-center gap-2.5 p-3 bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-xl text-left hover:border-[rgba(255,255,255,0.15)] transition-all group disabled:opacity-50 disabled:cursor-not-allowed">
                                <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                                    <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                                </div>
                                <span className="text-[#f1f5f9] text-xs font-medium group-hover:text-[#00d4ff] transition-colors line-clamp-1">{s.label}</span>
                                <ChevronRight className="h-3 w-3 text-[#64748b] ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* ── Search Input ── */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff]/10 to-[#7c3aed]/10 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative flex items-center bg-[#111827] border border-[rgba(255,255,255,0.08)] group-focus-within:border-[rgba(0,212,255,0.4)] rounded-2xl transition-all overflow-hidden">
                    <Search className="h-5 w-5 text-[#64748b] ml-4 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about your data…  e.g. 'Show patients with heart rate > 150'"
                        className="flex-1 pl-3 pr-4 py-4 bg-transparent outline-none text-[#f1f5f9] placeholder-[#64748b] text-sm"
                    />
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAskAI()}
                        disabled={isLoading || !query.trim()}
                        className="m-2 flex items-center gap-2 px-5 py-2.5 bg-[#00d4ff] hover:bg-[#00d4ff]/80 text-[#0a0f1e] rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                        {isLoading
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Send className="h-4 w-4" />}
                        <span className="hidden sm:block">{isLoading ? "Analyzing…" : "Ask AI"}</span>
                    </motion.button>
                </div>
            </div>

            {/* ── Loading ── */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-[#111827] border border-[rgba(0,212,255,0.15)] rounded-2xl p-4 flex items-center gap-4">
                        <div className="p-2 bg-[#00d4ff]/10 rounded-xl">
                            <BotMessageSquare className="h-5 w-5 text-[#00d4ff]" />
                        </div>
                        <div>
                            <p className="text-[#f1f5f9] text-sm font-medium">MedSentinel AI is analyzing your query…</p>
                            <p className="text-[#64748b] text-xs mt-0.5">Converting natural language → SQL → executing on database</p>
                        </div>
                        <div className="ml-auto">
                            <TypingDots />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Error ── */}
            <AnimatePresence>
                {errorMsg && (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] px-5 py-4 rounded-2xl flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm">Query Failed</p>
                            <p className="text-sm opacity-80 mt-1">{errorMsg}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── SQL Badge ── */}
            <AnimatePresence>
                {sqlUsed && <SqlBadge sql={sqlUsed} onCopy={() => setCopiedSql(true)} />}
            </AnimatePresence>

            {/* ── Results ── */}
            <AnimatePresence>
                {rowData !== null && !isLoading && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-4">
                        {rowData.length > 0 ? (
                            <>
                                <ResultSummary data={rowData} />
                                <div className="ag-theme-alpine-dark w-full rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)]" style={{ height: Math.min(420, 80 + rowData.length * 42) }}>
                                    <AgGridReact
                                        rowData={rowData}
                                        columnDefs={colDefs}
                                        pagination={rowData.length > 15}
                                        paginationPageSize={15}
                                        suppressCellFocus
                                        theme="legacy"
                                        rowStyle={{ background: 'transparent' }}
                                    />
                                </div>
                            </>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="py-12 text-center bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-2xl">
                                <Database className="h-10 w-10 text-[#64748b] mx-auto mb-3" />
                                <p className="text-[#f1f5f9] font-bold">No results found</p>
                                <p className="text-[#64748b] text-sm mt-1">Try rephrasing your query or check if the data exists.</p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Query History ── */}
            {history.length > 0 && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-t border-[rgba(255,255,255,0.06)] pt-4">
                    <p className="text-[#64748b] text-xs font-mono uppercase tracking-widest mb-3">Recent Queries</p>
                    <div className="space-y-2">
                        {history.map((h, i) => (
                            <motion.button key={i}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => handleSuggestionClick(h.q)}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-[#111827] border border-[rgba(255,255,255,0.04)] rounded-xl text-left hover:border-[rgba(0,212,255,0.15)] transition-all group">
                                <RotateCcw className="h-3.5 w-3.5 text-[#64748b] flex-shrink-0" />
                                <span className="text-[#f1f5f9] text-sm truncate flex-1">{h.q}</span>
                                <span className="text-[#64748b] text-xs font-mono flex-shrink-0">{h.rows} rows · {h.time}ms</span>
                                <ChevronRight className="h-3.5 w-3.5 text-[#64748b] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
