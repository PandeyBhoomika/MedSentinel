"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Activity, Loader2 } from "lucide-react";

export default function ThreatChart() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // When the component loads, automatically ask the AI for the chart data!
        const fetchChartData = async () => {
            try {
                const response = await api.runQuery(
                    "SELECT heart_rate, threat_score, is_anomaly FROM vitals WHERE heart_rate IS NOT NULL LIMIT 100"
                );
                if (response.data) {
                    setData(response.data);
                }
            } catch (error) {
                console.error("Failed to load chart data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChartData();
    }, []);

    return (
        <div className="bg-surface border border-gray-100 p-6 rounded-2xl shadow-sm space-y-6 mt-8">
            <div className="flex items-center space-x-3 text-accent border-b border-gray-100 pb-4">
                <Activity className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">Anomaly Threat Distribution (Heart Rate)</h2>
            </div>

            <div className="h-[300px] w-full">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p>Loading clinical telemetry...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted">
                        No vital signs available to chart. Run the AI Detection first!
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                type="number"
                                dataKey="heart_rate"
                                name="Heart Rate"
                                unit=" bpm"
                                stroke="#64748B"
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                type="number"
                                dataKey="threat_score"
                                name="Threat Score"
                                stroke="#64748B"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Scatter name="Vitals" data={data}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        // Color the dot red if it's an anomaly, otherwise use our medical teal
                                        fill={entry.is_anomaly ? '#EF4444' : '#0077B6'}
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}