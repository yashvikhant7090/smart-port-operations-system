"use client";

import React, { useState, useEffect } from "react";
import {
  Construction,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Zap,
  Ship,
  Anchor,
  X,
  AlertTriangle,
  CheckCircle2,
  Sliders,
} from "lucide-react";

interface CranesViewProps {
  onSelectVesselForCraneOpt?: (vesselId: number) => void;
}

export function CranesView({ onSelectVesselForCraneOpt }: CranesViewProps) {
  const [cranes, setCranes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMaint, setFilterMaint] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCrane, setSelectedCrane] = useState<any>(null);

  const [formData, setFormData] = useState({
    id: 0,
    crane_code: "",
    type: "STS Super Post-Panamax",
    capacity: 45,
    status: "Available",
    maintenance_status: "Operational",
    utilisation: 0,
  });

  const fetchCranes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cranes");
      if (res.ok) {
        const data = await res.json();
        setCranes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCranes();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedCrane(null);
    setFormData({
      id: 0,
      crane_code: `C${String(cranes.length + 1).padStart(2, "0")}`,
      type: "STS Super Post-Panamax",
      capacity: 48,
      status: "Available",
      maintenance_status: "Operational",
      utilisation: 0,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (crane: any) => {
    setIsEditing(true);
    setSelectedCrane(crane);
    setFormData({
      id: crane.id,
      crane_code: crane.crane_code,
      type: crane.type,
      capacity: crane.capacity,
      status: crane.status,
      maintenance_status: crane.maintenance_status,
      utilisation: crane.utilisation,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this gantry crane?")) return;
    try {
      const res = await fetch(`/api/cranes/${id}`, { method: "DELETE" });
      if (res.ok) fetchCranes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/cranes/${formData.id}` : "/api/cranes";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setModalOpen(false);
        fetchCranes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCranes = cranes.filter((c) => {
    const matchesSearch =
      c.crane_code.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase()) ||
      (c.current_vessel_name && c.current_vessel_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = filterStatus === "All" || c.status === filterStatus;
    const matchesMaint = filterMaint === "All" || c.maintenance_status === filterMaint;

    return matchesSearch && matchesStatus && matchesMaint;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Working":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "Available":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "Maintenance":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "Offline":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getMaintBadge = (maint: string) => {
    switch (maint) {
      case "Operational":
        return "text-emerald-400";
      case "Scheduled Inspection":
        return "text-yellow-400";
      case "In Repair":
      case "Overhaul Needed":
        return "text-rose-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Construction className="w-5 h-5 text-cyan-400" />
              <span>Crane Management & Gantry Fleet</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              {cranes.length} Units Deployed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track Ship-to-Shore (STS) super post-panamax cranes, mobile harbour gantries, lift cycles per hour, and scheduled maintenance.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Crane Unit</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search cranes by code (C01), type, or assigned vessel..."
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
            <option value="Working">Working</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Offline">Offline</option>
          </select>

          <select
            value={filterMaint}
            onChange={(e) => setFilterMaint(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Maintenance</option>
            <option value="Operational">Operational</option>
            <option value="Scheduled Inspection">Scheduled Inspection</option>
            <option value="In Repair">In Repair</option>
            <option value="Overhaul Needed">Overhaul Needed</option>
          </select>

          <button
            onClick={fetchCranes}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Refresh Cranes"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Cranes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCranes.map((crane) => (
          <div
            key={crane.id}
            className={`bg-slate-900/90 border rounded-xl p-4 shadow-sm transition-all hover:border-slate-700 flex flex-col justify-between ${
              crane.status === "Working"
                ? "border-blue-900/60 bg-gradient-to-b from-blue-950/20 to-slate-900/90"
                : crane.status === "Maintenance" || crane.status === "Offline"
                ? "border-amber-900/60 bg-gradient-to-b from-amber-950/20 to-slate-900/90"
                : "border-slate-800"
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-base font-extrabold text-white bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  {crane.crane_code}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusBadge(crane.status)}`}>
                  {crane.status}
                </span>
              </div>

              <h3 className="text-xs font-bold text-slate-200 mt-1">{crane.type}</h3>

              {/* Utilisation Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Utilisation</span>
                  <span className="font-mono font-bold text-white">{crane.utilisation}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      crane.utilisation >= 85 ? "bg-cyan-500" : crane.utilisation > 0 ? "bg-blue-500" : "bg-slate-700"
                    }`}
                    style={{ width: `${crane.utilisation}%` }}
                  ></div>
                </div>
              </div>

              {/* Lift capacity & pier assignment */}
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between bg-slate-950/70 p-2 rounded border border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">Moves / Hour:</span>
                  <span className="font-mono font-bold text-cyan-400">{crane.capacity} moves/hr</span>
                </div>

                <div className="flex justify-between bg-slate-950/70 p-2 rounded border border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">Assigned Berth:</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {crane.assigned_berth_code || "Quay Standby"}
                  </span>
                </div>
              </div>

              {/* Active vessel allocation */}
              <div className="mt-3 p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Current Assignment</span>
                {crane.current_vessel_name ? (
                  <span className="font-semibold text-cyan-300 font-mono text-xs truncate block">
                    {crane.current_vessel_name}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px] italic">Idle / Available for Gang</span>
                )}
              </div>

              {/* Maintenance status */}
              <div className="mt-2 text-[11px] flex items-center justify-between">
                <span className="text-slate-400">Health:</span>
                <span className={`font-mono font-semibold text-[10px] ${getMaintBadge(crane.maintenance_status)}`}>
                  {crane.maintenance_status}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end space-x-1.5">
              <button
                onClick={() => handleOpenEdit(crane)}
                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="Edit Crane"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(crane.id)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="Delete Crane"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Crane Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0e172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Construction className="w-4 h-4 text-cyan-400" />
                <span>{isEditing ? `Edit ${formData.crane_code}` : "Register New Crane"}</span>
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
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Crane Code</label>
                <input
                  type="text"
                  required
                  value={formData.crane_code}
                  onChange={(e) => setFormData({ ...formData, crane_code: e.target.value })}
                  placeholder="C17"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Gantry Crane Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="STS Super Post-Panamax">STS Super Post-Panamax (Double-Trolley)</option>
                  <option value="STS Post-Panamax">STS Post-Panamax</option>
                  <option value="Mobile Harbour Crane">Mobile Harbour Crane</option>
                  <option value="RTG Rail Mounted">RTG Rail Mounted Gantry</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Capacity (Moves/Hr)</label>
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Utilisation (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.utilisation}
                    onChange={(e) => setFormData({ ...formData, utilisation: Number(e.target.value) })}
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
                    <option value="Working">Working</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Maintenance Health</label>
                  <select
                    value={formData.maintenance_status}
                    onChange={(e) => setFormData({ ...formData, maintenance_status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Scheduled Inspection">Scheduled Inspection</option>
                    <option value="In Repair">In Repair</option>
                    <option value="Overhaul Needed">Overhaul Needed</option>
                  </select>
                </div>
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
                  Save Crane
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
