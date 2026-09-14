"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  Ship,
  Construction,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Check,
} from "lucide-react";

interface CraneOptimizationViewProps {
  initialVesselId?: number | null;
}

export function CraneOptimizationView({ initialVesselId }: CraneOptimizationViewProps) {
  const [vessels, setVessels] = useState<any[]>([]);
  const [selectedVesselId, setSelectedVesselId] = useState<number>(initialVesselId || 0);
  const [optimization, setOptimization] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vessels")
      .then((res) => res.json())
      .then((data) => {
        setVessels(data);
        if (data.length > 0) {
          const targetId = initialVesselId || data.find((v: any) => v.status === "Waiting")?.id || data[0].id;
          setSelectedVesselId(targetId);
          runOptimization(targetId);
        }
      })
      .catch((err) => console.error(err));
  }, [initialVesselId]);

  const runOptimization = async (vesselId: number) => {
    if (!vesselId) return;
    setLoading(true);
    setApplySuccess(null);
    try {
      const res = await fetch("/api/optimization/crane", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vesselId }),
      });
      if (res.ok) {
        const data = await res.json();
        setOptimization(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAllocation = async () => {
    if (!optimization) return;
    setApplying(true);
    setApplySuccess(null);
    try {
      const craneIds = optimization.recommendedAllocation.map((c: any) => c.crane_id);
      const res = await fetch("/api/optimization/crane", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          vesselId: optimization.vessel.id,
          craneIds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setApplySuccess(`Successfully deployed ${data.allocatedCranes} STS Cranes to ${data.vesselName}!`);
        runOptimization(optimization.vessel.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span>Gantry Crane Gang Optimiser</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              STS Dual-Lift Solver
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Optimise Ship-to-Shore crane gang allocations to maximize container moves/hour and minimize vessel turnaround delay.
          </p>
        </div>

        {/* Vessel selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 font-medium">Select Target Vessel:</label>
          <select
            value={selectedVesselId}
            onChange={(e) => {
              const vid = Number(e.target.value);
              setSelectedVesselId(vid);
              runOptimization(vid);
            }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-500"
          >
            {vessels.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.vessel_size} • {v.container_volume.toLocaleString()} TEU)
              </option>
            ))}
          </select>
        </div>
      </div>

      {applySuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center space-x-2 text-emerald-300 text-xs shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-sm">{applySuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Analysing crane gantry moves, hoist limits, and maintenance buffers...</p>
        </div>
      ) : optimization ? (
        <div className="space-y-6">
          {/* Top Operational Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Target Vessel</span>
              <div className="text-base font-bold text-white mt-1 truncate">{optimization.vessel.name}</div>
              <div className="text-xs text-cyan-400 font-mono mt-0.5">
                {Number(optimization.vessel.container_volume).toLocaleString()} TEU
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Expected Handling Time</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                {optimization.estimatedHandlingHours} hrs
              </div>
              <div className="text-[11px] text-slate-400">Turnaround target: {optimization.targetCompletionHours}h</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Net Gang Throughput</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {optimization.expectedThroughputRate} moves/hr
              </div>
              <div className="text-[11px] text-slate-400">Synchronous twin-lift</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] text-slate-400 block uppercase font-mono">Assigned Quay Slip</span>
              <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                {optimization.vessel.assigned_berth_code || "Quay B04"}
              </div>
              <div className="text-[11px] text-slate-400">Deepwater Pier</div>
            </div>
          </div>

          {/* Allocation Comparison: Current vs Recommended */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Allocation Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <Construction className="w-4 h-4 text-slate-500" />
                    <span>Current Crane Allocation</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Manual Allocation</span>
                </div>

                {optimization.currentAllocation.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                    No cranes currently locked to this vessel berth.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {optimization.currentAllocation.map((c: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-bold text-slate-300">{c.crane_code}</span>
                          <span className="text-slate-400">{c.type}</span>
                        </div>
                        <span className="font-mono text-slate-400">{c.capacity} moves/hr</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                Manual allocations typically under-utilize dual-trolley speeds and result in pier crane bottlenecks.
              </div>
            </div>

            {/* Recommended Allocation Card */}
            <div className="bg-gradient-to-b from-blue-950/40 via-slate-900/90 to-slate-900/90 border-2 border-cyan-500/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Algorithmic Recommended Allocation</span>
                  </h3>
                  <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                    OPTIMISED GANG
                  </span>
                </div>

                <div className="space-y-2.5">
                  {optimization.recommendedAllocation.map((c: any) => (
                    <div
                      key={c.crane_id}
                      className="p-3 bg-slate-950/90 rounded-xl border border-cyan-500/30 flex items-center justify-between text-xs hover:border-cyan-500/60 transition-colors shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-base font-extrabold text-white bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
                          {c.crane_code}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-200 block">{c.type}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">{c.capacity} moves/hr capacity</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            c.role === "Primary"
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                              : c.role === "Secondary"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                              : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          }`}
                        >
                          {c.role}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1">Score: {c.score}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Algorithmic Reason */}
                <div className="mt-4 p-3 bg-slate-950/90 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                    System Reasoning:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{optimization.reason}</p>
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={handleApplyAllocation}
                disabled={applying}
                className="w-full mt-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {applying ? (
                  <span>Deploying Crane Gang...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>APPLY RECOMMENDED CRANE ALLOCATION</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
