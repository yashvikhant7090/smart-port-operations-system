"use client";

import React, { useState, useEffect } from "react";
import {
  Anchor,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Compass,
  AlertTriangle,
  Construction,
  Ship,
  X,
  CheckCircle,
} from "lucide-react";

interface BerthsViewProps {
  onSelectVesselForBerthOpt?: (vesselId: number) => void;
}

export function BerthsView({ onSelectVesselForBerthOpt }: BerthsViewProps) {
  const [berths, setBerths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBerth, setSelectedBerth] = useState<any>(null);
  const [viewModal, setViewModal] = useState<any>(null);

  const [formData, setFormData] = useState({
    id: 0,
    berth_code: "",
    name: "",
    capacity: 20000,
    max_draft: "16.5",
    current_utilisation: 0,
    status: "Available",
    available_cranes: 2,
  });

  const fetchBerths = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/berths");
      if (res.ok) {
        const data = await res.json();
        setBerths(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBerths();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedBerth(null);
    setFormData({
      id: 0,
      berth_code: `B${String(berths.length + 1).padStart(2, "0")}`,
      name: `Berth ${berths.length + 1} - Pier Expansion`,
      capacity: 18000,
      max_draft: "16.5",
      current_utilisation: 0,
      status: "Available",
      available_cranes: 2,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (b: any) => {
    setIsEditing(true);
    setSelectedBerth(b);
    setFormData({
      id: b.id,
      berth_code: b.berth_code,
      name: b.name,
      capacity: b.capacity,
      max_draft: b.max_draft || "16.0",
      current_utilisation: b.current_utilisation,
      status: b.status,
      available_cranes: b.available_cranes,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this berth slip?")) return;
    try {
      const res = await fetch(`/api/berths/${id}`, { method: "DELETE" });
      if (res.ok) fetchBerths();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/berths/${formData.id}` : "/api/berths";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setModalOpen(false);
        fetchBerths();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBerths = berths.filter((b) => {
    const matchesSearch =
      b.berth_code.toLowerCase().includes(search.toLowerCase()) ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.current_vessel_name && b.current_vessel_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = filterStatus === "All" || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "High Congestion":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "Occupied":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "Available":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "Maintenance":
        return "bg-slate-700/50 text-slate-300 border-slate-600";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Anchor className="w-5 h-5 text-cyan-400" />
              <span>Berth Management & Quay Slips</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              {berths.length} Active Berths
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time deepwater berth monitoring, quay draft clearances, gantry crane allocations, and operational occupancy.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Berth Slip</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search berths by code, pier name, or docked vessel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="High Congestion">High Congestion</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <button
            onClick={fetchBerths}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Refresh Berths"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Berths Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBerths.map((berth) => (
          <div
            key={berth.id}
            className={`bg-slate-900/90 border rounded-xl p-4 shadow-sm transition-all hover:border-slate-700 flex flex-col justify-between ${
              berth.status === "High Congestion"
                ? "border-rose-800/80 bg-gradient-to-b from-rose-950/20 to-slate-900/90"
                : "border-slate-800"
            }`}
          >
            <div>
              {/* Top row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-base font-extrabold text-cyan-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    {berth.berth_code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusBadge(berth.status)}`}>
                    {berth.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">CONGESTION</span>
                  <span
                    className={`text-xs font-bold font-mono ${
                      berth.congestion_level === "Critical"
                        ? "text-red-400"
                        : berth.congestion_level === "High"
                        ? "text-orange-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {berth.congestion_level}
                  </span>
                </div>
              </div>

              {/* Berth name & info */}
              <h3 className="text-sm font-bold text-white mt-1">{berth.name}</h3>

              {/* Utilisation Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Current Utilisation</span>
                  <span className="font-mono font-bold text-white">{berth.current_utilisation}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      berth.current_utilisation >= 85
                        ? "bg-red-500"
                        : berth.current_utilisation >= 60
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${berth.current_utilisation}%` }}
                  ></div>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Max Capacity</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {Number(berth.capacity).toLocaleString()} TEU
                  </span>
                </div>
                <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Max Water Draft</span>
                  <span className="font-mono font-semibold text-slate-200">{berth.max_draft}m depth</span>
                </div>
              </div>

              {/* Docked vessel status */}
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Ship className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Moored Vessel:</span>
                  </span>
                  {berth.current_vessel ? (
                    <span className="font-semibold text-cyan-300 font-mono truncate max-w-[140px]">
                      {berth.current_vessel.name}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">No vessel berthed</span>
                  )}
                </div>
                {berth.current_vessel && (
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{berth.current_vessel.vessel_size}</span>
                    <span className="text-amber-400 font-mono">{berth.current_vessel.waiting_time_hours}h wait delay</span>
                  </div>
                )}
              </div>

              {/* Crane availability */}
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <Construction className="w-3.5 h-3.5 text-blue-400" />
                  <span>Available STS Cranes:</span>
                </span>
                <span className="font-mono font-bold text-white">{berth.available_cranes} Cranes</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setViewModal(berth)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Details</span>
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleOpenEdit(berth)}
                  className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Edit Berth"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(berth.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Delete Berth"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Berth Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0e172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Anchor className="w-4 h-4 text-cyan-400" />
                <span>{isEditing ? `Edit ${formData.berth_code}` : "Add Berth Slip"}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Berth Code</label>
                <input
                  type="text"
                  required
                  value={formData.berth_code}
                  onChange={(e) => setFormData({ ...formData, berth_code: e.target.value })}
                  placeholder="B04"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Pier / Berth Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Berth 04 - Pier G Super Terminal"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Capacity (TEU)</label>
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Max Draft (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.max_draft}
                    onChange={(e) => setFormData({ ...formData, max_draft: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="High Congestion">High Congestion</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Utilisation (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.current_utilisation}
                    onChange={(e) => setFormData({ ...formData, current_utilisation: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Available STS Cranes</label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={formData.available_cranes}
                  onChange={(e) => setFormData({ ...formData, available_cranes: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-md cursor-pointer"
                >
                  Save Berth Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Berth Details Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0e172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-cyan-400 font-bold text-sm block">{viewModal.berth_code}</span>
                <h3 className="text-base font-bold text-white">{viewModal.name}</h3>
              </div>
              <button
                onClick={() => setViewModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Utilisation Level</span>
                  <span className="font-mono font-bold text-white text-base">{viewModal.current_utilisation}%</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusBadge(viewModal.status)}`}>
                    {viewModal.status}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Length / Volume:</span>
                  <span className="font-mono text-white font-semibold">{Number(viewModal.capacity).toLocaleString()} TEU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Maximum Water Draft:</span>
                  <span className="font-mono text-white font-semibold">{viewModal.max_draft} meters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Available STS Cranes:</span>
                  <span className="font-mono text-cyan-400 font-semibold">{viewModal.available_cranes} Cranes</span>
                </div>
              </div>

              {viewModal.current_vessel && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block mb-1">
                    Currently Berthed Vessel
                  </span>
                  <div className="font-bold text-white text-sm">{viewModal.current_vessel.name}</div>
                  <div className="text-slate-400 text-xs mt-1">
                    {viewModal.current_vessel.vessel_size} • {Number(viewModal.current_vessel.container_volume).toLocaleString()} TEU
                  </div>
                  <div className="text-amber-400 font-mono text-[11px] mt-1">
                    Current Waiting Time: {viewModal.current_vessel.waiting_time_hours} hrs
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
