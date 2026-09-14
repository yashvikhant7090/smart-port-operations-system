"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Ship,
  Anchor,
  Layers,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  PieChart as PieIcon,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";

export function AnalyticsView() {
  const [range, setRange] = useState<"today" | "7days" | "30days">("7days");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${selectedRange}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span>Operations Intelligence & Logistics Analytics</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              Throughput Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical wait time reduction metrics, crane hoist efficiency, yard turnover velocity, and demurrage cost avoidance.
          </p>
        </div>

        {/* Range switcher */}
        <div className="flex rounded-lg bg-slate-900/90 p-1 border border-slate-800">
          {(
            [
              { id: "today", label: "Today (24h)" },
              { id: "7days", label: "7 Days" },
              { id: "30days", label: "30 Days" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setRange(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                range === t.id ? "bg-cyan-600 text-white shadow font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Aggregating historical terminal records and trends...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top Impact KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Waiting Time Reduction</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                -{data.optimizationImpact?.avgWaitingReductionPct || 28.6}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Avg {data.optimizationImpact?.hoursSavedPerVessel || 1.8} hours saved per vessel
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Dynamic Reroutes</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {data.optimizationImpact?.vesselsRerouted || 12} Vessels
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Diverted from congested Pier G</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Crane Gang Efficiency</span>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
                +{data.optimizationImpact?.craneGangEfficiencyGainPct || 18.2}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Moves per gross crane hour</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Demurrage Avoidance</span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                ${Number(data.optimizationImpact?.demurrageCostAvoidedUSD || 480000).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Estimated carrier charter savings</div>
            </div>
          </div>

          {/* Charts Row 1: Waiting Time Trend + Throughput Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Average Waiting Time (Actual vs Rerouted vs Baseline) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Vessel Anchorage Waiting Time (Hours)</span>
                  </h3>
                  <p className="text-xs text-slate-400">Pre-optimisation baseline vs actual optimised vessel waiting time</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.waitingTimeTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                    <Line type="monotone" dataKey="baseline" name="Unoptimized Baseline" stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} />
                    <Line type="monotone" dataKey="actual" name="Actual Wait Delay" stroke="#f59e0b" strokeWidth={2} />
                    {range !== "today" && (
                      <Line type="monotone" dataKey="rerouted" name="Optimised Dynamic Reroute" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Container Throughput (Inbound vs Outbound TEU) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Container Throughput Flow (TEU)</span>
                  </h3>
                  <p className="text-xs text-slate-400">Inbound discharge vs outbound gate export transfers</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.throughputTimeSeries || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: any) => [`${Number(v).toLocaleString()} TEU`, ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                    <Bar dataKey="inbound" name="Inbound Discharges" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outbound" name="Outbound Staging" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Arrivals by Category & Congestion Frequency */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Arrivals By Class */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center space-x-2">
                <Ship className="w-4 h-4 text-cyan-400" />
                <span>Vessel Arrivals by Class</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">Fleet breakdown scheduled at terminal</p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.arrivalsByCategory || []} layout="vertical" margin={{ top: 5, right: 15, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={10} />
                    <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={10} width={90} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Berth Utilisation Distribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center space-x-2">
                <Anchor className="w-4 h-4 text-cyan-400" />
                <span>Berth Utilisation Heat</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">Quay capacity saturation levels</p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.berthUtilisation || []} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="code" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: any) => [`${v}%`, "Utilisation"]}
                    />
                    <Bar dataKey="utilisation" radius={[4, 4, 0, 0]}>
                      {(data.berthUtilisation || []).map((b: any, index: number) => (
                        <Cell
                          key={`bcell-${index}`}
                          fill={b.utilisation >= 85 ? "#ef4444" : b.utilisation >= 60 ? "#f59e0b" : "#10b981"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Congestion Frequency Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-cyan-400" />
                <span>Congestion Incident Severity</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">Distribution of predicted risk states</p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.congestionFrequency || []}
                      dataKey="count"
                      nameKey="level"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {(data.congestionFrequency || []).map((entry: any, index: number) => (
                        <Cell key={`pcell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "10px", color: "#94a3b8" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
