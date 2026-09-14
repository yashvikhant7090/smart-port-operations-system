"use client";

import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Anchor,
  Layers,
  Construction,
  Sparkles,
  History,
  Info,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface PredictionViewProps {
  onNavigateToRouting?: () => void;
}

export function PredictionView({ onNavigateToRouting }: PredictionViewProps) {
  // Input parameters
  const [port, setPort] = useState("USLAX");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [incomingVessels, setIncomingVessels] = useState(16);
  const [availableBerths, setAvailableBerths] = useState(2);
  const [containerVolume, setContainerVolume] = useState(185000);
  const [availableCranes, setAvailableCranes] = useState(4);
  const [yardUtilisation, setYardUtilisation] = useState(88);
  const [historicalWaitingTime, setHistoricalWaitingTime] = useState(5.4);
  const [vesselPriority, setVesselPriority] = useState<"Low" | "Medium" | "High" | "Critical">("High");
  const [vesselSize, setVesselSize] = useState("Ultra Large");

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Presets
  const applyPreset = (presetName: string) => {
    if (presetName === "2021-lalb") {
      setIncomingVessels(24);
      setAvailableBerths(1);
      setContainerVolume(240000);
      setAvailableCranes(3);
      setYardUtilisation(94);
      setHistoricalWaitingTime(7.8);
      setVesselPriority("Critical");
      setVesselSize("Ultra Large");
    } else if (presetName === "normal") {
      setIncomingVessels(8);
      setAvailableBerths(6);
      setContainerVolume(85000);
      setAvailableCranes(12);
      setYardUtilisation(55);
      setHistoricalWaitingTime(1.6);
      setVesselPriority("Medium");
      setVesselSize("Post-Panamax");
    } else if (presetName === "moderate") {
      setIncomingVessels(14);
      setAvailableBerths(4);
      setContainerVolume(140000);
      setAvailableCranes(7);
      setYardUtilisation(76);
      setHistoricalWaitingTime(3.8);
      setVesselPriority("High");
      setVesselSize("Ultra Large");
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/predictions");
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
        if (data.length > 0 && !prediction) {
          // Parse latest prediction
          const latest = data[0];
          setPrediction({
            congestionScore: latest.congestion_score,
            riskLevel: latest.risk_level,
            expectedWaitingTime: parseFloat(latest.expected_waiting_time),
            highRiskBerths: latest.details?.breakdown ? latest.details.high_risk_berths : [latest.affected_berth],
            mainCauses: latest.reason ? latest.reason.split(". ") : [],
            recommendedActions: latest.details?.recommendedActions || [
              "Activate alternate dynamic rerouting from high-congestion berths to Pier E automated quay",
              "Authorize overtime twin-lift crane shifts across Berths B01 and B02",
            ],
            breakdown: latest.details?.breakdown || {
              vesselLoadScore: 26,
              berthCapacityScore: 22,
              craneAvailabilityScore: 12,
              yardUtilisationScore: 14,
              historicalDelayScore: 10,
            },
            forecast: latest.details?.forecast || {
              period24h: { score: latest.congestion_score, risk: latest.risk_level, waitHours: parseFloat(latest.expected_waiting_time) },
              period48h: { score: Math.round(latest.congestion_score * 0.85), risk: "HIGH", waitHours: 4.2 },
              period72h: { score: Math.round(latest.congestion_score * 0.6), risk: "MEDIUM", waitHours: 2.4 },
            },
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const payload = {
        portId: port === "USLAX" ? 1 : 2,
        date,
        incomingVessels: Number(incomingVessels),
        availableBerths: Number(availableBerths),
        containerVolume: Number(containerVolume),
        availableCranes: Number(availableCranes),
        yardUtilisation: Number(yardUtilisation),
        historicalWaitingTime: Number(historicalWaitingTime),
        vesselPriority,
      };

      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Prediction failed");

      setPrediction(data);
      loadHistory();
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Risk styling mapping
  const getRiskStyles = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case "CRITICAL":
        return {
          color: "text-red-400",
          border: "border-red-500",
          bg: "bg-red-500/10",
          badge: "bg-red-500 text-white",
          label: "CRITICAL (81–100)",
        };
      case "HIGH":
        return {
          color: "text-orange-400",
          border: "border-orange-500",
          bg: "bg-orange-500/10",
          badge: "bg-orange-500 text-white",
          label: "HIGH (61–80)",
        };
      case "MEDIUM":
        return {
          color: "text-yellow-400",
          border: "border-yellow-500",
          bg: "bg-yellow-500/10",
          badge: "bg-yellow-500 text-slate-900",
          label: "MEDIUM (31–60)",
        };
      default:
        return {
          color: "text-emerald-400",
          border: "border-emerald-500",
          bg: "bg-emerald-500/10",
          badge: "bg-emerald-500 text-slate-900",
          label: "LOW (0–30)",
        };
    }
  };

  const riskStyles = prediction ? getRiskStyles(prediction.riskLevel) : getRiskStyles("HIGH");

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <BrainCircuit className="w-5 h-5 text-cyan-400" />
              <span>Congestion Prediction Engine</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              Rule-Based v1.2 (ML Ready)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Predict port bottlenecks and offshore vessel queues using vessel arrival schedules, berth capacity, gantry crane availability, and yard dwell saturation.
          </p>
        </div>

        {/* Preset buttons */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Scenario Presets:</span>
          <button
            onClick={() => applyPreset("2021-lalb")}
            className="px-2.5 py-1 text-xs rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900/60 transition-colors font-medium cursor-pointer"
          >
            2021 LA/LB Backlog
          </button>
          <button
            onClick={() => applyPreset("moderate")}
            className="px-2.5 py-1 text-xs rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-300 hover:bg-amber-900/60 transition-colors font-medium cursor-pointer"
          >
            Peak Wave
          </button>
          <button
            onClick={() => applyPreset("normal")}
            className="px-2.5 py-1 text-xs rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60 transition-colors font-medium cursor-pointer"
          >
            Balanced Flow
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Terminal Operating Parameters</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Target Port</label>
              <select
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="USLAX">USLAX (Port of LA / LB)</option>
                <option value="SGSIN">SGSIN (Singapore Tuas)</option>
                <option value="NLRTM">NLRTM (Rotterdam Maasvlakte)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Forecast Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Incoming Vessel Arrivals</span>
              <span className="font-mono text-cyan-400 font-bold">{incomingVessels} vessels</span>
            </div>
            <input
              type="range"
              min="2"
              max="35"
              value={incomingVessels}
              onChange={(e) => setIncomingVessels(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Vessel Size Category</label>
              <select
                value={vesselSize}
                onChange={(e) => setVesselSize(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Ultra Large">Ultra Large (&gt;18k TEU)</option>
                <option value="Post-Panamax">Post-Panamax (10-18k TEU)</option>
                <option value="Panamax">Panamax (5-10k TEU)</option>
                <option value="Feeder">Feeder (&lt;5k TEU)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Vessel Priority</label>
              <select
                value={vesselPriority}
                onChange={(e) => setVesselPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Critical">Critical Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Container Volume Expected (TEU)</span>
              <span className="font-mono text-cyan-400 font-bold">{Number(containerVolume).toLocaleString()} TEU</span>
            </div>
            <input
              type="range"
              min="40000"
              max="260000"
              step="5000"
              value={containerVolume}
              onChange={(e) => setContainerVolume(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Available Berths</span>
                <span className="font-mono text-emerald-400 font-bold">{availableBerths} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={availableBerths}
                onChange={(e) => setAvailableBerths(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Available STS Cranes</span>
                <span className="font-mono text-blue-400 font-bold">{availableCranes} / 16</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                value={availableCranes}
                onChange={(e) => setAvailableCranes(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Yard Storage Utilisation (%)</span>
              <span className="font-mono text-indigo-400 font-bold">{yardUtilisation}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={yardUtilisation}
              onChange={(e) => setYardUtilisation(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Historical Waiting Time</span>
              <span className="font-mono text-amber-400 font-bold">{historicalWaitingTime} hours</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="12"
              step="0.1"
              value={historicalWaitingTime}
              onChange={(e) => setHistoricalWaitingTime(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span>Running Simulation Engine...</span>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                <span>PREDICT CONGESTION</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output: Score & Recommendations (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {prediction ? (
            <div className="space-y-4 animate-fade-in">
              {/* Score & Risk Level Card */}
              <div className={`p-6 rounded-xl border ${riskStyles.border} ${riskStyles.bg} shadow-lg relative overflow-hidden`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase font-mono tracking-wider text-slate-400">Predicted Congestion Level</div>
                    <div className="flex items-baseline space-x-3 mt-1">
                      <span className={`text-4xl sm:text-5xl font-black font-mono ${riskStyles.color}`}>
                        {prediction.congestionScore}
                      </span>
                      <span className="text-slate-400 text-sm font-mono">/ 100</span>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${riskStyles.badge}`}>
                        {prediction.riskLevel} RISK
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-right">
                    <div className="text-[11px] text-slate-400">Expected Waiting Time</div>
                    <div className="text-2xl font-bold font-mono text-cyan-400">{prediction.expectedWaitingTime} hrs</div>
                    <div className="text-[10px] text-slate-400">Outer Anchorage Queue</div>
                  </div>
                </div>

                {/* Visual Risk Indicator Bars */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>0 (LOW)</span>
                    <span>30</span>
                    <span>60 (MEDIUM)</span>
                    <span>80 (HIGH)</span>
                    <span>100 (CRITICAL)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 relative">
                    <div className="h-full bg-emerald-500 w-[30%]" title="0-30 Low"></div>
                    <div className="h-full bg-yellow-400 w-[30%]" title="31-60 Medium"></div>
                    <div className="h-full bg-orange-500 w-[20%]" title="61-80 High"></div>
                    <div className="h-full bg-red-600 w-[20%]" title="81-100 Critical"></div>
                    {/* Marker pointer */}
                    <div
                      className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-lg border border-slate-900 -ml-1 transition-all"
                      style={{ left: `${prediction.congestionScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* High risk berths tag */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Identified High-Risk Berths:</span>
                  <div className="flex items-center space-x-1.5">
                    {(prediction.highRiskBerths || ["B04", "B05"]).map((b: string) => (
                      <span
                        key={b}
                        className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold text-[11px]"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scoring Breakdown (Transparent Rule-Based Breakdown) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Transparent Scoring Breakdown Engine</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Vessel Load</div>
                    <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                      {prediction.breakdown?.vesselLoadScore || 24} <span className="text-[10px] text-slate-400">/30</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Berth Capacity</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      {prediction.breakdown?.berthCapacityScore || 20} <span className="text-[10px] text-slate-400">/25</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Crane Shortage</div>
                    <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">
                      {prediction.breakdown?.craneAvailabilityScore || 12} <span className="text-[10px] text-slate-400">/15</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Yard Saturation</div>
                    <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">
                      {prediction.breakdown?.yardUtilisationScore || 13} <span className="text-[10px] text-slate-400">/15</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-400">Historical Delay</div>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      {prediction.breakdown?.historicalDelayScore || 9} <span className="text-[10px] text-slate-400">/15</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 24-hr, 48-hr, 72-hr Forecasts */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[11px] font-bold text-slate-300">24-Hour Horizon</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {prediction.forecast?.period24h?.score || prediction.congestionScore}
                  </div>
                  <div className="text-[10px] text-rose-400 font-semibold uppercase mt-0.5">
                    {prediction.forecast?.period24h?.risk || prediction.riskLevel}
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono mt-1">
                    {prediction.forecast?.period24h?.waitHours || prediction.expectedWaitingTime} hrs wait
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[11px] font-bold text-slate-300">48-Hour Horizon</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {prediction.forecast?.period48h?.score || 68}
                  </div>
                  <div className="text-[10px] text-orange-400 font-semibold uppercase mt-0.5">
                    {prediction.forecast?.period48h?.risk || "HIGH"}
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono mt-1">
                    {prediction.forecast?.period48h?.waitHours || 4.2} hrs wait
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[11px] font-bold text-slate-300">72-Hour Horizon</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {prediction.forecast?.period72h?.score || 46}
                  </div>
                  <div className="text-[10px] text-yellow-400 font-semibold uppercase mt-0.5">
                    {prediction.forecast?.period72h?.risk || "MEDIUM"}
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono mt-1">
                    {prediction.forecast?.period72h?.waitHours || 2.4} hrs wait
                  </div>
                </div>
              </div>

              {/* Main Causes & Recommended Actions */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center space-x-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Primary Congestion Drivers</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {(prediction.mainCauses || []).map((cause: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Recommended Operational Actions</span>
                    </h4>
                    {onNavigateToRouting && (
                      <button
                        onClick={onNavigateToRouting}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Apply Alternate Routing</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {(prediction.recommendedActions || []).map((action: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                        <span className="text-cyan-400 font-bold shrink-0">#{idx + 1}</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 space-y-3">
              <BrainCircuit className="w-12 h-12 text-slate-600 animate-pulse" />
              <p className="text-sm font-semibold text-slate-300">Ready to simulate terminal conditions</p>
              <p className="text-xs max-w-sm text-slate-400">
                Adjust operational sliders on the left or select a scenario preset to run the rule-based congestion predictor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
