"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  Ship,
  Anchor,
  CheckCircle2,
  Clock,
  Construction,
  Sparkles,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Layers,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface BerthOptimizationViewProps {
  initialVesselId?: number | null;
  onNavigateToCraneOpt?: (vesselId: number) => void;
}

export function BerthOptimizationView({ initialVesselId, onNavigateToCraneOpt }: BerthOptimizationViewProps) {
  const [vessels, setVessels] = useState<any[]>([]);
  const [selectedVesselId, setSelectedVesselId] = useState<number>(initialVesselId || 0);
  const [optimization, setOptimization] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  // Fetch vessels
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
      const res = await fetch("/api/optimization/berth", {
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

  const handleApplyBerth = async (berthId: number) => {
    if (!optimization) return;
    setApplying(true);
    setApplySuccess(null);
    try {
      const res = await fetch("/api/optimization/berth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          vesselId: optimization.vessel.id,
          berthId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setApplySuccess(`Successfully assigned ${data.vesselName} to Berth ${data.assignedBerth}!`);
        // Refresh optimization state
        runOptimization(optimization.vessel.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  const activeVessel = vessels.find((v) => v.id === selectedVesselId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <span>Berth Optimisation Engine</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              Heuristic Quay Allocation v2.1
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Multi-constraint algorithmic solver evaluating vessel ETA, container volume, draft depth, quay length, current utilisation, and STS gantry crane availability.
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
                {v.name} ({v.vessel_size} • {v.container_volume.toLocaleString()} TEU • {v.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {applySuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center justify-between text-emerald-300 text-xs shadow-lg animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">{applySuccess}</span>
          </div>
          {onNavigateToCraneOpt && optimization && (
            <button
              onClick={() => onNavigateToCraneOpt(optimization.vessel.id)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <span>Proceed to Crane Allocation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Evaluating quay constraints and calculating optimal berth fit...</p>
        </div>
      ) : optimization ? (
        <div className="space-y-6">
          {/* Vessel Profile Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white">
                <Ship className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>{optimization.vessel.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {optimization.vessel.imo_number}
                  </span>
                </h3>
                <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                  <span>{optimization.vessel.size}</span>
                  <span>•</span>
                  <span>{Number(optimization.vessel.container_volume).toLocaleString()} TEU</span>
                  <span>•</span>
                  <span className="text-rose-400 font-semibold">{optimization.vessel.priority} Priority</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">CURRENT ALLOCATION</span>
                <span className="font-bold text-amber-400">{optimization.vessel.current_berth || "Unassigned"}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">RECOMMENDED CRANES</span>
                <span className="font-bold text-cyan-400">{optimization.bestBerth.requiredCranes} STS Cranes</span>
              </div>
            </div>
          </div>

          {/* Recommendation Cards: BEST BERTH vs ALTERNATIVE BERTH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BEST BERTH CARD */}
            <div className="bg-gradient-to-b from-cyan-950/40 via-slate-900/90 to-slate-900/90 border-2 border-cyan-500/80 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-blue-600 text-white font-mono text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl shadow">
                TOP RECOMMENDATION
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-mono text-2xl font-black text-white bg-slate-950 px-3 py-1 rounded-lg border border-cyan-500/60 shadow">
                    {optimization.bestBerth.berth_code}
                  </span>
                  <div className="text-xs font-bold text-cyan-300">{optimization.bestBerth.name}</div>
                </div>

                {/* Key Metrics */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Expected Wait</span>
                    <span className="font-mono font-bold text-emerald-400 text-base">
                      {optimization.bestBerth.expectedWaiting} hrs
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Operation Time</span>
                    <span className="font-mono font-bold text-cyan-400 text-base">
                      {optimization.bestBerth.expectedOperationTime} hrs
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Required Cranes</span>
                    <span className="font-mono font-bold text-blue-400 text-base">
                      {optimization.bestBerth.requiredCranes} STS
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Fit Confidence</span>
                    <span className="font-mono font-bold text-purple-400 text-base">
                      {optimization.bestBerth.confidence}%
                    </span>
                  </div>
                </div>

                {/* Algorithmic Reason */}
                <div className="mt-4 p-3 bg-slate-950/90 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                    System Reasoning:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{optimization.bestBerth.reason}</p>
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => handleApplyBerth(optimization.bestBerth.id)}
                disabled={applying}
                className="w-full mt-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {applying ? (
                  <span>Applying to Terminal Database...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>APPLY RECOMMENDED BERTH ({optimization.bestBerth.berth_code})</span>
                  </>
                )}
              </button>
            </div>

            {/* ALTERNATIVE BERTH CARD */}
            {optimization.alternativeBerth ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">ALTERNATIVE BERTH</span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      Fallback Option
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-mono text-2xl font-black text-slate-200 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                      {optimization.alternativeBerth.berth_code}
                    </span>
                    <div className="text-xs font-bold text-slate-300">{optimization.alternativeBerth.name}</div>
                  </div>

                  {/* Key Metrics */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Expected Wait</span>
                      <span className="font-mono font-bold text-amber-400 text-base">
                        {optimization.alternativeBerth.expectedWaiting} hrs
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Operation Time</span>
                      <span className="font-mono font-bold text-slate-300 text-base">
                        {optimization.alternativeBerth.expectedOperationTime} hrs
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Required Cranes</span>
                      <span className="font-mono font-bold text-blue-400 text-base">
                        {optimization.alternativeBerth.requiredCranes} STS
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Fit Confidence</span>
                      <span className="font-mono font-bold text-slate-400 text-base">
                        {optimization.alternativeBerth.confidence}%
                      </span>
                    </div>
                  </div>

                  {/* Algorithmic Reason */}
                  <div className="mt-4 p-3 bg-slate-950/90 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      System Reasoning:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{optimization.alternativeBerth.reason}</p>
                  </div>
                </div>

                {/* Apply Alternative Button */}
                <button
                  onClick={() => handleApplyBerth(optimization.alternativeBerth.id)}
                  disabled={applying}
                  className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  <Anchor className="w-4 h-4 text-cyan-400" />
                  <span>APPLY ALTERNATIVE BERTH ({optimization.alternativeBerth.berth_code})</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-center text-slate-400 text-xs">
                No alternative berth meets minimum draft clearances.
              </div>
            )}
          </div>

          {/* Full Ranked Quay Candidate Evaluation Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>All Evaluated Berths Comparison Matrix</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evaluated against draft depth, quay length, operational backlog, and crane connectivity
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-3">Berth Code</th>
                    <th className="py-3 px-3">Pier Name</th>
                    <th className="py-3 px-3">Score</th>
                    <th className="py-3 px-3">Fit Rating</th>
                    <th className="py-3 px-3">Est. Wait</th>
                    <th className="py-3 px-4">Evaluation Notes</th>
                    <th className="py-3 px-4 text-right">Assign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {optimization.allEvaluations.map((evalItem: any, idx: number) => (
                    <tr key={evalItem.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">#{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-white">{evalItem.berth_code}</td>
                      <td className="py-3 px-3 font-medium text-slate-200">{evalItem.name}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-100">{evalItem.score}/100</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            evalItem.fitRating === "Optimal"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                              : evalItem.fitRating === "Good Alternative"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                              : evalItem.fitRating === "Suboptimal"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          }`}
                        >
                          {evalItem.fitRating}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">{evalItem.expectedWaiting} hrs</td>
                      <td className="py-3 px-4 text-[11px] text-slate-400 max-w-xs truncate" title={evalItem.notes}>
                        {evalItem.notes}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleApplyBerth(evalItem.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-600 hover:text-white text-cyan-400 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
