"use client";

import React, { useState } from "react";
import {
  Ship,
  Anchor,
  Construction,
  Layers,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Route,
  CalendarDays,
  MapPin,
  RefreshCw,
  Activity,
  CheckCircle2,
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
  Cell,
  Legend,
} from "recharts";

interface DashboardViewProps {
  data: any;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (tab: any) => void;
}

export function DashboardView({ data, loading, onRefresh, onNavigate }: DashboardViewProps) {
  const [forecastTab, setForecastTab] = useState<"24h" | "48h" | "72h">("24h");

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading port telemetry and congestion state...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {
    activeVessels: 42,
    waitingVessels: 18,
    availableBerths: 6,
    totalBerths: 10,
    availableCranes: 14,
    totalCranes: 16,
    yardUtilisation: 82,
    containerThroughput: 356400,
    averageWaitingTime: 4.6,
    congestionRisk: "HIGH",
    congestionScore: 78,
  };

  const charts = data?.charts || {};

  // Risk styling
  const getRiskBadge = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case "CRITICAL":
        return { bg: "bg-red-500/20 text-red-400 border-red-500/40", dot: "bg-red-500" };
      case "HIGH":
        return { bg: "bg-orange-500/20 text-orange-400 border-orange-500/40", dot: "bg-orange-500" };
      case "MEDIUM":
        return { bg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", dot: "bg-yellow-400" };
      default:
        return { bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", dot: "bg-emerald-400" };
    }
  };

  const riskBadge = getRiskBadge(metrics.congestionRisk);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-[#0e1f3d] border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                USLAX Real-time Telemetry
              </span>
              <span className="text-slate-400 text-xs flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active 72-Hour Optimization Loop</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">Smart Port Operations Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Real-time container logistics control room monitoring offshore queues, berth saturation, gantry crane movements, and yard storage capacity.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate("prediction")}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-md transition-all cursor-pointer"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Predict Congestion</span>
            </button>
            <button
              onClick={() => onNavigate("routing-opt")}
              className="flex items-center space-x-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer"
            >
              <Route className="w-3.5 h-3.5" />
              <span>Alternate Routing</span>
            </button>
            <button
              onClick={() => onNavigate("planner")}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>72h Planner</span>
            </button>
            <button
              onClick={() => onNavigate("port-map")}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Port Map</span>
            </button>
            <button
              onClick={onRefresh}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time-style operational cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Active Vessels */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Active Vessels</span>
            <Ship className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{metrics.activeVessels}</span>
            <span className="text-[10px] text-cyan-400 font-mono">Discharging</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center space-x-1">
            <span className="text-slate-300 font-semibold">{metrics.totalVessels} Total</span>
            <span>registered in schedule</span>
          </div>
        </div>

        {/* Waiting Vessels */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Waiting Vessels</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">{metrics.waitingVessels}</span>
            <span className="text-[10px] text-amber-300/80 font-mono">Offshore Queue</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-300/80 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>LA/LB Backlog threshold high</span>
          </div>
        </div>

        {/* Available Berths */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Available Berths</span>
            <Anchor className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {metrics.availableBerths} <span className="text-sm font-normal text-slate-400">/ {metrics.totalBerths}</span>
            </span>
            <span className="text-[10px] text-emerald-300/80 font-mono">Quay Capacity</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>Berths B03, B06, B08 ready</span>
          </div>
        </div>

        {/* Available Cranes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Available Cranes</span>
            <Construction className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">
              {metrics.availableCranes} <span className="text-sm font-normal text-slate-400">/ {metrics.totalCranes}</span>
            </span>
            <span className="text-[10px] text-blue-300/80 font-mono">STS Operational</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>C07 in scheduled overhaul</span>
          </div>
        </div>

        {/* Yard Utilisation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Yard Utilisation</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{metrics.yardUtilisation}%</span>
            <span className="text-[10px] text-indigo-300 font-mono">5 Zones</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                metrics.yardUtilisation >= 85 ? "bg-red-500" : metrics.yardUtilisation >= 70 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${metrics.yardUtilisation}%` }}
            ></div>
          </div>
        </div>

        {/* Container Throughput */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Throughput Volume</span>
            <ArrowUpRight className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {Number(metrics.containerThroughput).toLocaleString()}
            </span>
            <span className="text-[10px] text-cyan-300 font-mono">TEU Total</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>Target: 400,000 TEU / month</span>
          </div>
        </div>

        {/* Average Waiting Time */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Avg Waiting Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
              {metrics.averageWaitingTime} <span className="text-sm font-normal text-slate-400">hrs</span>
            </span>
            <span className="text-[10px] text-amber-300/80 font-mono">Outer Channel</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>-1.8 hrs after alternate rerouting</span>
          </div>
        </div>

        {/* Congestion Risk */}
        <div className={`border rounded-xl p-4 shadow-sm transition-colors ${riskBadge.bg}`}>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
            <span>Congestion Risk</span>
            <span className={`w-2.5 h-2.5 rounded-full ${riskBadge.dot} animate-ping`}></span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">{metrics.congestionRisk}</span>
            <span className="text-xs font-mono font-bold bg-slate-950/60 px-2 py-0.5 rounded">
              Score: {metrics.congestionScore}/100
            </span>
          </div>
          <div className="mt-2 text-[11px] opacity-90 truncate">
            <span>Hotspot: {metrics.affectedBerth || "Berths B04 & B05"}</span>
          </div>
        </div>
      </div>

      {/* 24-hr, 48-hr, 72-hr Forecast Overview Switch */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Multi-Horizon Port Congestion Forecast</span>
            </h2>
            <p className="text-xs text-slate-400">Projections driven by incoming vessel ETAs and dynamic quay crane capacity</p>
          </div>

          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            {(["24h", "48h", "72h"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setForecastTab(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  forecastTab === tab ? "bg-cyan-600 text-white shadow font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.toUpperCase()} Horizon
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Expected Waiting Delay</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {forecastTab === "24h" ? "5.8 hrs" : forecastTab === "48h" ? "4.2 hrs" : "2.4 hrs"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-bold text-white">
                {forecastTab === "24h" ? "Outer Anchorage Queue" : forecastTab === "48h" ? "Stabilizing Stream" : "Normalized Clearance"}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  forecastTab === "24h"
                    ? "bg-rose-500/20 text-rose-300"
                    : forecastTab === "48h"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {forecastTab === "24h" ? "CRITICAL RISK" : forecastTab === "48h" ? "HIGH RISK" : "MEDIUM RISK"}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Berth Congestion Index</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {forecastTab === "24h" ? "84 / 100" : forecastTab === "48h" ? "71 / 100" : "48 / 100"}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-300">
              {forecastTab === "24h"
                ? "Berths B04 & B05 saturated. Immediate dynamic diversion recommended."
                : forecastTab === "48h"
                ? "Secondary wave arriving; Pier E automated quay absorbs 40% load."
                : "Continuous clearance with steady dwell turnaround."}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Rerouting Recommendations</span>
              <span className="font-mono text-emerald-400 font-semibold">2 Actionable</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-300">Reroute MV Ocean Star to B06</span>
              <button
                onClick={() => onNavigate("routing-opt")}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
              >
                Review Route
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Vessel Arrival Forecast */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Ship className="w-4 h-4 text-cyan-400" />
                <span>Vessel Arrival Forecast & Inbound Volume (TEU)</span>
              </h3>
              <p className="text-xs text-slate-400">Vessel count and scheduled container TEU volume over next 72 hours</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.vesselArrivalForecast || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeframe" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: any, name: any) => [name === "volumeTEU" ? `${Number(value).toLocaleString()} TEU` : value, name]}
                />
                <Area type="monotone" dataKey="volumeTEU" name="Container Volume" stroke="#06b6d4" fillOpacity={1} fill="url(#volGrad)" />
                <Line type="monotone" dataKey="vessels" name="Vessel Count" stroke="#f59e0b" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Berth Utilisation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Anchor className="w-4 h-4 text-cyan-400" />
                <span>Berth Utilisation & Congestion State</span>
              </h3>
              <p className="text-xs text-slate-400">Quay occupancy percentage across Berths B01 through B10</p>
            </div>
            <span className="text-[11px] font-mono text-rose-400 font-semibold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
              Threshold: &gt;80%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.berthChartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="code" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: any) => [`${value}% Utilisation`, "Capacity Utilisation"]}
                />
                <Bar dataKey="utilisation" radius={[4, 4, 0, 0]}>
                  {(charts.berthChartData || []).map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.utilisation >= 85 ? "#ef4444" : entry.utilisation >= 65 ? "#f59e0b" : "#10b981"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Crane Utilisation & Capacity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Construction className="w-4 h-4 text-cyan-400" />
                <span>Ship-to-Shore (STS) Crane Utilisation</span>
              </h3>
              <p className="text-xs text-slate-400">Gantry crane workload efficiency and capacity across quays</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.craneChartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="code" stroke="#64748b" fontSize={10} interval={0} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: any) => [`${value}% Utilisation`, "Active Moves"]}
                />
                <Bar dataKey="utilisation" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Yard Zone Occupancy */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Container Yard Occupancy (Zones A - E)</span>
              </h3>
              <p className="text-xs text-slate-400">Current TEU dwell vs maximum yard staging limit</p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 font-semibold">Total: 145,000 TEU</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.yardChartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="code" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: any, name: any) => [`${Number(value).toLocaleString()} TEU`, name]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                <Bar dataKey="occupancy" name="Occupied TEU" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacity" name="Total Capacity" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 5: Average Waiting Time Trend & Congestion Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Average Vessel Waiting Time Trend (Hours)</span>
              </h3>
              <p className="text-xs text-slate-400">Outer harbor channel delays comparing port average vs high-risk berths</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.waitingTimeTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: any) => [`${value} Hours`, "Wait Delay"]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                <Line type="monotone" dataKey="avgHours" name="Terminal Average Wait" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="highRiskBerth" name="Berth B04 Peak Delay" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Congestion Forecast Cards */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center space-x-2">
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              <span>Congestion Risk Forecast</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Predicted delay severity over 24h, 48h and 72h cycles</p>

            <div className="space-y-3">
              {(charts.congestionForecast || []).map((f: any, idx: number) => {
                const b = getRiskBadge(f.risk);
                return (
                  <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-200">{f.period}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${b.bg}`}>{f.risk}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Congestion Score</span>
                      <span className="font-mono text-white font-bold">{f.score} / 100</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>Expected Wait Time</span>
                      <span className="font-mono text-cyan-400 font-semibold">{f.waitHours} hrs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigate("prediction")}
            className="w-full mt-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer shadow"
          >
            <span>Run Custom Congestion Simulation</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
