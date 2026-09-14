"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Anchor,
  Ship,
  Construction,
  Layers,
  AlertTriangle,
  RefreshCw,
  Compass,
  Zap,
  Info,
  Maximize2,
  X,
} from "lucide-react";

interface PortMapViewProps {
  onSelectVesselForBerthOpt?: (vesselId: number) => void;
  onSelectVesselForCraneOpt?: (vesselId: number) => void;
}

export function PortMapView({ onSelectVesselForBerthOpt, onSelectVesselForCraneOpt }: PortMapViewProps) {
  const [berths, setBerths] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [cranes, setCranes] = useState<any[]>([]);
  const [yards, setYards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail modals
  const [selectedBerth, setSelectedBerth] = useState<any>(null);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const [resB, resV, resC, resY] = await Promise.all([
        fetch("/api/berths"),
        fetch("/api/vessels"),
        fetch("/api/cranes"),
        fetch("/api/yards"),
      ]);

      if (resB.ok) setBerths(await resB.json());
      if (resV.ok) setVessels(await resV.json());
      if (resC.ok) setCranes(await resC.json());
      if (resY.ok) setYards(await resY.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  const waitingVessels = vessels.filter((v) => v.status === "Waiting" || v.status === "Arrived");

  const getBerthStatusColor = (b: any) => {
    if (b.status === "High Congestion" || b.current_utilisation >= 85) {
      return {
        bg: "bg-rose-950/70 border-rose-600/80 text-rose-300",
        indicator: "bg-red-500 shadow-red-500/50",
        label: "HIGH CONGESTION",
      };
    }
    if (b.status === "Occupied" || b.current_utilisation >= 60) {
      return {
        bg: "bg-amber-950/70 border-amber-600/80 text-amber-300",
        indicator: "bg-yellow-400 shadow-yellow-400/50",
        label: "OCCUPIED / ACTIVE",
      };
    }
    if (b.status === "Maintenance") {
      return {
        bg: "bg-slate-900 border-slate-700 text-slate-400",
        indicator: "bg-slate-500",
        label: "MAINTENANCE",
      };
    }
    return {
      bg: "bg-emerald-950/60 border-emerald-600/80 text-emerald-300",
      indicator: "bg-emerald-400 shadow-emerald-400/50",
      label: "AVAILABLE / OPTIMAL",
    };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <span>Interactive Port Layout & Terminal Map</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              USLAX Harbor GIS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual quay layout showing deepwater berths (B01 - B10), ship-to-shore gantry cranes, container yard zones, and anchorage hotspots.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-3 text-[11px] font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">Normal</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-slate-300">Warning / Active</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-slate-300">High Congestion</span>
            </span>
          </div>

          <button
            onClick={fetchMapData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Refresh GIS Layout"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="bg-[#0b1426] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Background ocean waves decorative lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

        {/* Outer Anchorage Queue (Waiting vessels) */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-blue-950/40 border border-blue-900/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Ship className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                San Pedro Outer Anchorage Queue ({waitingVessels.length} Vessels Waiting Offshore)
              </span>
            </div>
            <span className="text-[10px] text-amber-300 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
              Avg Delay: 4.6 hrs
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {waitingVessels.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVessel(v)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-amber-600/50 hover:border-cyan-400 text-xs transition-all flex items-center space-x-2 cursor-pointer shadow-sm group"
              >
                <Ship className="w-3.5 h-3.5 text-amber-400 group-hover:text-cyan-400" />
                <span className="font-semibold text-slate-200">{v.name}</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1 rounded">
                  {v.waiting_time_hours}h
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Pier Channel & Berths Quay Slips */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <Anchor className="w-4 h-4 text-cyan-400" />
              <span>Deepwater Quay Front & Pier Slips (B01 - B10)</span>
            </div>
            <span className="text-[11px] text-slate-400">Click any berth or vessel to inspect</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {berths.map((b) => {
              const statusStyling = getBerthStatusColor(b);
              const berthCranes = cranes.filter((c) => c.assigned_berth_id === b.id);
              const dockedVessel = vessels.find((v) => v.assigned_berth_id === b.id && v.status !== "Completed");

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBerth(b)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-md hover:scale-[1.02] ${statusStyling.bg}`}
                >
                  {/* Top line */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-sm font-extrabold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {b.berth_code}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${statusStyling.indicator} shadow-sm`}></span>
                      <span className="text-[10px] font-mono font-bold">{b.current_utilisation}%</span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-white truncate" title={b.name}>
                    {b.name.replace("Berth ", "Pier ")}
                  </div>

                  {/* Docked vessel slot */}
                  <div className="mt-2.5 p-2 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Vessel</span>
                      {dockedVessel && <span className="text-cyan-400 font-mono">{dockedVessel.vessel_size}</span>}
                    </div>
                    {dockedVessel ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVessel(dockedVessel);
                        }}
                        className="mt-0.5 font-semibold text-cyan-300 truncate hover:underline cursor-pointer flex items-center space-x-1"
                      >
                        <Ship className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{dockedVessel.name}</span>
                      </div>
                    ) : (
                      <div className="mt-0.5 text-slate-400 italic text-[11px]">Vacant Berth</div>
                    )}
                  </div>

                  {/* Crane positions */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Construction className="w-3 h-3 text-blue-400" />
                      <span>Cranes:</span>
                    </span>
                    <div className="flex items-center space-x-1">
                      {berthCranes.length > 0 ? (
                        berthCranes.map((c) => (
                          <span
                            key={c.id}
                            className={`px-1 py-0.2 rounded font-mono ${
                              c.status === "Working"
                                ? "bg-blue-600/40 text-blue-300 font-bold"
                                : c.status === "Maintenance"
                                ? "bg-amber-600/40 text-amber-300"
                                : "bg-emerald-600/40 text-emerald-300"
                            }`}
                          >
                            {c.crane_code}
                          </span>
                        ))
                      ) : (
                        <span className="italic">None</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Container Yard Zones (A through E) */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Container Yard Staging Zones (Yard A - Yard E)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Total Capacity: 145,000 TEU</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {yards.map((y) => {
              const occPct = Math.round((y.current_occupancy / y.capacity) * 100);
              const isCrit = occPct >= 90;
              const isHigh = occPct >= 80;

              return (
                <div
                  key={y.id}
                  className={`p-3 rounded-xl border bg-slate-900/90 transition-all ${
                    isCrit
                      ? "border-rose-800/80 bg-rose-950/20"
                      : isHigh
                      ? "border-amber-800/80 bg-amber-950/20"
                      : "border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {y.yard_code}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isCrit ? "bg-rose-500/20 text-rose-300" : isHigh ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {occPct}%
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-200 mt-1">{y.name.replace("Yard ", "")}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{y.zone_type}</div>

                  <div className="mt-2">
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          isCrit ? "bg-rose-500" : isHigh ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${occPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400 flex justify-between font-mono">
                    <span>{Number(y.current_occupancy).toLocaleString()} TEU</span>
                    <span>/ {Number(y.capacity).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Berth Modal */}
      {selectedBerth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0e172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-cyan-400 font-bold text-sm block">{selectedBerth.berth_code}</span>
                <h3 className="text-base font-bold text-white">{selectedBerth.name}</h3>
              </div>
              <button
                onClick={() => setSelectedBerth(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Utilisation Level</span>
                  <span className="font-mono font-bold text-white text-base">{selectedBerth.current_utilisation}%</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Operational Status</span>
                  <span className="font-bold text-cyan-400 text-xs">{selectedBerth.status}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payload Capacity:</span>
                  <span className="font-mono text-white font-semibold">{Number(selectedBerth.capacity).toLocaleString()} TEU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quay Water Depth:</span>
                  <span className="font-mono text-white font-semibold">{selectedBerth.max_draft}m draft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Cranes:</span>
                  <span className="font-mono text-cyan-400 font-semibold">{selectedBerth.available_cranes} Cranes</span>
                </div>
              </div>

              {selectedBerth.current_vessel && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block mb-1">
                    Moored Container Vessel
                  </span>
                  <div className="font-bold text-white text-sm">{selectedBerth.current_vessel.name}</div>
                  <div className="text-slate-400 text-xs mt-1">
                    {selectedBerth.current_vessel.vessel_size} • {Number(selectedBerth.current_vessel.container_volume).toLocaleString()} TEU
                  </div>
                  <div className="text-amber-400 font-mono text-[11px] mt-1">
                    Waiting Time: {selectedBerth.current_vessel.waiting_time_hours} hrs
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedBerth(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Vessel Modal */}
      {selectedVessel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0e172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">{selectedVessel.name}</h3>
                <span className="text-xs font-mono text-cyan-400">{selectedVessel.imo_number}</span>
              </div>
              <button
                onClick={() => setSelectedVessel(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Container Payload</span>
                  <span className="font-mono font-bold text-white text-base">
                    {Number(selectedVessel.container_volume).toLocaleString()} TEU
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Offshore Wait Delay</span>
                  <span className="font-mono font-bold text-amber-400 text-base">
                    {selectedVessel.waiting_time_hours} hrs
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vessel Class:</span>
                  <span className="font-semibold text-white">{selectedVessel.vessel_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="font-bold text-cyan-400">{selectedVessel.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Priority:</span>
                  <span className="font-semibold text-rose-400">{selectedVessel.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Route:</span>
                  <span className="text-white">{selectedVessel.origin} → {selectedVessel.destination}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex space-x-2">
              {onSelectVesselForBerthOpt && (
                <button
                  onClick={() => {
                    const vid = selectedVessel.id;
                    setSelectedVessel(null);
                    onSelectVesselForBerthOpt(vid);
                  }}
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Optimise Berth</span>
                </button>
              )}
              {onSelectVesselForCraneOpt && (
                <button
                  onClick={() => {
                    const vid = selectedVessel.id;
                    setSelectedVessel(null);
                    onSelectVesselForCraneOpt(vid);
                  }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Optimise Cranes</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
