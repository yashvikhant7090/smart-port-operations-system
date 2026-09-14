"use client";

import React, { useState, useEffect } from "react";
import {
  Route,
  Ship,
  Anchor,
  Clock,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldAlert,
} from "lucide-react";

interface RoutingOptimizationViewProps {
  onNavigateToBerths?: () => void;
}

export function RoutingOptimizationView({ onNavigateToBerths }: RoutingOptimizationViewProps) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/optimization/routing");
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleExecuteReroute = async (c: any) => {
    setExecutingId(c.vesselId);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/optimization/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          vesselId: c.vesselId,
          targetBerthId: c.recommendedBerthId,
          recId: c.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message || `Rerouted ${c.vesselName} to Berth ${c.recommendedBerthCode}!`);
        fetchRecommendations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Route className="w-5 h-5 text-rose-400" />
              <span>Alternate Routing & Dynamic Congestion Bypass</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
              Hotspot Diversion Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Detect congested berth bottlenecks and dynamically reroute incoming container vessels to high-speed available automated quays.
          </p>
        </div>

        <button
          onClick={fetchRecommendations}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Refresh Routing Recommendations"
        >
          <RefreshCw className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center space-x-2 text-emerald-300 text-xs shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Scanning terminal slips for congestion hotspots and alternate routes...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">All Terminals Operating Smoothly</h3>
          <p className="text-xs max-w-md mx-auto">
            No vessels currently experiencing bottlenecks exceeding the 4.0-hour waiting threshold. All quays are balanced.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {candidates.map((c) => {
            const isExecuted = c.status === "Applied";
            return (
              <div
                key={c.vesselId}
                className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-[#0e172a] border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl transition-all space-y-4"
              >
                {/* Header row: Alert badge & vessel name */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>CONGESTION DETECTED</span>
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-white">{c.vesselName}</h2>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {c.imoNumber} • {Number(c.containerVolume).toLocaleString()} TEU
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-mono text-xs font-bold rounded-lg flex items-center space-x-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>{c.congestionReductionPct}% IMPROVEMENT</span>
                    </div>
                  </div>
                </div>

                {/* Routing Comparison Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Route */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-900/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400 font-bold">
                        CURRENT BOTTLENECK ROUTE
                      </span>
                      <span className="text-xs font-mono text-rose-400 bg-rose-950 px-2 py-0.5 rounded">
                        CONGESTED
                      </span>
                    </div>

                    <div className="flex items-baseline space-x-3 mt-1">
                      <span className="text-2xl font-black font-mono text-white">
                        Berth {c.currentBerthCode}
                      </span>
                      <span className="text-xs text-slate-400">(Pier G Slipway)</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-900 flex justify-between text-xs">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-rose-400" />
                        <span>Expected Waiting Time:</span>
                      </span>
                      <span className="font-mono font-bold text-rose-400 text-sm">
                        {c.currentExpectedWait} hours
                      </span>
                    </div>
                  </div>

                  {/* Recommended Optimized Route */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-600/40 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">
                        RECOMMENDED ALTERNATE BERTH
                      </span>
                      <span className="text-xs font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded font-bold">
                        CLEAR DEEPWATER
                      </span>
                    </div>

                    <div className="flex items-baseline space-x-3 mt-1">
                      <span className="text-2xl font-black font-mono text-cyan-300">
                        Berth {c.recommendedBerthCode}
                      </span>
                      <span className="text-xs text-slate-400">(Pier E Automated Quay)</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-900 flex justify-between text-xs">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Wait Time After Optimisation:</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {c.waitAfterRerouting} hours
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                    Operational Rerouting Justification:
                  </span>
                  <p className="text-slate-300 leading-relaxed">{c.reason}</p>
                </div>

                {/* Footer action button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-400 flex items-center space-x-1">
                    <span className="text-emerald-400 font-bold">Saving: {c.timeSavedHours} hours</span>
                    <span>of idling demurrage & channel anchorage fuel consumption</span>
                  </div>

                  <button
                    onClick={() => handleExecuteReroute(c)}
                    disabled={isExecuted || executingId === c.vesselId}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center space-x-2 cursor-pointer ${
                      isExecuted
                        ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                        : "bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-600/30"
                    }`}
                  >
                    {executingId === c.vesselId ? (
                      <span>Executing Dynamic Reroute...</span>
                    ) : isExecuted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Rerouted to Berth {c.recommendedBerthCode}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>EXECUTE REROUTE TO BERTH {c.recommendedBerthCode}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
