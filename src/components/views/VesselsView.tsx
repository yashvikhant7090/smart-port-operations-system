"use client";

import React, { useState, useEffect } from "react";
import {
  Ship,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Compass,
  Zap,
  ArrowUpDown,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
} from "lucide-react";

interface VesselsViewProps {
  onSelectVesselForBerthOpt?: (vesselId: number) => void;
  onSelectVesselForCraneOpt?: (vesselId: number) => void;
}

export function VesselsView({ onSelectVesselForBerthOpt, onSelectVesselForCraneOpt }: VesselsViewProps) {
  const [vessels, setVessels] = useState<any[]>([]);
  const [berths, setBerths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterSize, setFilterSize] = useState("All");
  const [sortField, setSortField] = useState<string>("eta");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);
  const [viewDetailsModal, setViewDetailsModal] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    imo_number: "",
    eta: "",
    etd: "",
    container_volume: 12000,
    vessel_size: "Post-Panamax",
    priority: "Medium",
    status: "Scheduled",
    assigned_berth_id: "",
    destination: "Los Angeles",
    origin: "Shanghai Port",
    draft: "14.5",
    waiting_time_hours: "0.0",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchVessels = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (filterStatus !== "All") query.append("status", filterStatus);
      if (filterPriority !== "All") query.append("priority", filterPriority);
      if (filterSize !== "All") query.append("size", filterSize);

      const [resVessels, resBerths] = await Promise.all([
        fetch(`/api/vessels?${query.toString()}`),
        fetch("/api/berths"),
      ]);

      if (resVessels.ok) {
        const data = await resVessels.json();
        setVessels(data);
      }
      if (resBerths.ok) {
        const dataB = await resBerths.json();
        setBerths(dataB);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVessels();
  }, [search, filterStatus, filterPriority, filterSize]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedVessel(null);
    const now = new Date();
    const inTwoDays = new Date(now.getTime() + 48 * 3600 * 1000);
    setFormData({
      id: 0,
      name: "",
      imo_number: `IMO${Math.floor(1000000 + Math.random() * 9000000)}`,
      eta: now.toISOString().slice(0, 16),
      etd: inTwoDays.toISOString().slice(0, 16),
      container_volume: 14500,
      vessel_size: "Post-Panamax",
      priority: "Medium",
      status: "Scheduled",
      assigned_berth_id: "",
      destination: "Los Angeles",
      origin: "Shanghai Port",
      draft: "15.0",
      waiting_time_hours: "0.0",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (vessel: any) => {
    setIsEditing(true);
    setSelectedVessel(vessel);
    setFormData({
      id: vessel.id,
      name: vessel.name,
      imo_number: vessel.imo_number,
      eta: new Date(vessel.eta).toISOString().slice(0, 16),
      etd: new Date(vessel.etd).toISOString().slice(0, 16),
      container_volume: vessel.container_volume,
      vessel_size: vessel.vessel_size,
      priority: vessel.priority,
      status: vessel.status,
      assigned_berth_id: vessel.assigned_berth_id ? String(vessel.assigned_berth_id) : "",
      destination: vessel.destination,
      origin: vessel.origin || "Shanghai Port",
      draft: vessel.draft || "14.5",
      waiting_time_hours: vessel.waiting_time_hours || "0.0",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this vessel from the terminal manifest?")) return;
    try {
      const res = await fetch(`/api/vessels/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchVessels();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const url = isEditing ? `/api/vessels/${formData.id}` : "/api/vessels";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save vessel");

      setModalOpen(false);
      fetchVessels();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Sorting
  const sortedVessels = [...vessels].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === "eta" || sortField === "etd") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    } else if (sortField === "container_volume" || sortField === "waiting_time_hours") {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Status styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Waiting":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "Delayed":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "Loading":
      case "Unloading":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "Arrived":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "Completed":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-slate-700/50 text-slate-300 border-slate-600";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-950 text-rose-400 border-rose-800 font-bold";
      case "High":
        return "bg-orange-950 text-orange-400 border-orange-800 font-medium";
      case "Medium":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-slate-900 text-slate-400 border-slate-800";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Ship className="w-5 h-5 text-cyan-400" />
              <span>Vessel Management & Inbound Manifest</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              {vessels.length} In System
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete container vessel manifest tracking offshore arrival queues, container volume, draft depth, and berth assignments.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Container Vessel</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by vessel name, IMO number, destination, or origin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Statuses</option>
            <option value="Waiting">Waiting (Queue)</option>
            <option value="Arrived">Arrived</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Loading">Loading</option>
            <option value="Unloading">Unloading</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={filterSize}
            onChange={(e) => setFilterSize(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Sizes</option>
            <option value="Ultra Large">Ultra Large</option>
            <option value="Post-Panamax">Post-Panamax</option>
            <option value="Panamax">Panamax</option>
            <option value="Feeder">Feeder</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setFilterStatus("All");
              setFilterPriority("All");
              setFilterSize("All");
            }}
            className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
            title="Reset Filters"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Vessels Data Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th
                  onClick={() => toggleSort("name")}
                  className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Vessel Name / IMO</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("vessel_size")}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Class & Draft</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("container_volume")}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Payload TEU</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("eta")}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>ETA / ETD</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("waiting_time_hours")}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Wait Delay</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Berth Slip</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-4 text-right">Actions & Optimise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span>Loading manifest from database...</span>
                  </td>
                </tr>
              ) : sortedVessels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No vessels found matching your criteria.
                  </td>
                </tr>
              ) : (
                sortedVessels.map((vessel) => (
                  <tr key={vessel.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 flex items-center space-x-1.5">
                        <span>{vessel.name}</span>
                      </div>
                      <div className="text-[10px] text-cyan-400/80 font-mono">{vessel.imo_number}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-xs font-medium text-slate-200">{vessel.vessel_size}</div>
                      <div className="text-[10px] text-slate-400">{vessel.draft}m draft</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-white">
                      {Number(vessel.container_volume).toLocaleString()} <span className="text-[10px] text-slate-400">TEU</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div className="text-slate-200">
                        {new Date(vessel.eta).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        dep: {new Date(vessel.etd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span
                        className={`font-bold ${
                          parseFloat(vessel.waiting_time_hours || "0") > 4
                            ? "text-rose-400"
                            : parseFloat(vessel.waiting_time_hours || "0") > 2
                            ? "text-amber-400"
                            : "text-slate-400"
                        }`}
                      >
                        {vessel.waiting_time_hours || "0.0"} hrs
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusBadge(vessel.status)}`}>
                        {vessel.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {vessel.assigned_berth_code ? (
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-semibold text-xs">
                          {vessel.assigned_berth_code}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getPriorityBadge(vessel.priority)}`}>
                        {vessel.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Optimise Berth Quick Action */}
                        {onSelectVesselForBerthOpt && (
                          <button
                            onClick={() => onSelectVesselForBerthOpt(vessel.id)}
                            title="Run Berth Optimiser for this vessel"
                            className="p-1.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded transition-colors cursor-pointer"
                          >
                            <Compass className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Optimise Cranes Quick Action */}
                        {onSelectVesselForCraneOpt && (
                          <button
                            onClick={() => onSelectVesselForCraneOpt(vessel.id)}
                            title="Run Crane Optimiser for this vessel"
                            className="p-1.5 bg-blue-950/60 hover:bg-blue-900 border border-blue-800 text-blue-300 rounded transition-colors cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* View Details */}
                        <button
                          onClick={() => setViewDetailsModal(vessel)}
                          title="View Vessel Details"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(vessel)}
                          title="Edit Vessel"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(vessel.id)}
                          title="Delete Vessel"
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Vessel Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0e172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Ship className="w-4 h-4 text-cyan-400" />
                <span>{isEditing ? `Edit Vessel: ${formData.name}` : "Register Inbound Vessel"}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Vessel Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="MV Pacific Star"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">IMO Number</label>
                  <input
                    type="text"
                    required
                    value={formData.imo_number}
                    onChange={(e) => setFormData({ ...formData, imo_number: e.target.value })}
                    placeholder="IMO9812345"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Vessel Size Class</label>
                  <select
                    value={formData.vessel_size}
                    onChange={(e) => setFormData({ ...formData, vessel_size: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Ultra Large">Ultra Large (&gt;18,000 TEU)</option>
                    <option value="Post-Panamax">Post-Panamax (10,000 - 18,000 TEU)</option>
                    <option value="Panamax">Panamax (5,000 - 10,000 TEU)</option>
                    <option value="Feeder">Feeder (&lt;5,000 TEU)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Payload Volume (TEU)</label>
                  <input
                    type="number"
                    required
                    value={formData.container_volume}
                    onChange={(e) => setFormData({ ...formData, container_volume: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">ETA (Arrival)</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.eta}
                    onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">ETD (Departure)</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.etd}
                    onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Arrived">Arrived</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Loading">Loading</option>
                    <option value="Unloading">Unloading</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Assigned Berth</label>
                  <select
                    value={formData.assigned_berth_id}
                    onChange={(e) => setFormData({ ...formData, assigned_berth_id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">None (Unassigned)</option>
                    {berths.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.berth_code} ({b.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Draft Depth (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.draft}
                    onChange={(e) => setFormData({ ...formData, draft: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Waiting Delay (hours)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.waiting_time_hours}
                    onChange={(e) => setFormData({ ...formData, waiting_time_hours: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Port of Origin</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
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
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-md cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Saving to PostgreSQL..." : isEditing ? "Update Vessel" : "Create Vessel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Vessel Details Modal */}
      {viewDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0e172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">{viewDetailsModal.name}</h3>
                <span className="text-xs font-mono text-cyan-400">{viewDetailsModal.imo_number}</span>
              </div>
              <button
                onClick={() => setViewDetailsModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Container Payload</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {Number(viewDetailsModal.container_volume).toLocaleString()} TEU
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Class & Draft</span>
                  <span className="font-semibold text-white">{viewDetailsModal.vessel_size}</span>
                  <span className="text-slate-400 block text-[10px]">{viewDetailsModal.draft}m draft</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Scheduled ETA</span>
                  <span className="font-mono text-slate-200">{new Date(viewDetailsModal.eta).toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Scheduled ETD</span>
                  <span className="font-mono text-slate-200">{new Date(viewDetailsModal.etd).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Assigned Berth</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {viewDetailsModal.assigned_berth_code || "Unassigned"}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Current Delay</span>
                  <span className="font-mono font-bold text-amber-400">{viewDetailsModal.waiting_time_hours} hrs</span>
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Route Origin:</span>
                  <span className="text-white font-medium">{viewDetailsModal.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Final Port Destination:</span>
                  <span className="text-white font-medium">{viewDetailsModal.destination}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex space-x-2">
              {onSelectVesselForBerthOpt && (
                <button
                  onClick={() => {
                    const vid = viewDetailsModal.id;
                    setViewDetailsModal(null);
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
                    const vid = viewDetailsModal.id;
                    setViewDetailsModal(null);
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
