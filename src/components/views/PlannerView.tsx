"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  RefreshCw,
  Printer,
  Download,
  Trash2,
  Edit2,
  Ship,
  Anchor,
  Construction,
  Layers,
  Wrench,
  CheckCircle2,
  X,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export function PlannerView() {
  const [plans, setPlans] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Record<string, any[]>>({
    TODAY: [],
    TOMORROW: [],
    "DAY 3": [],
  });
  const [activeDay, setActiveDay] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit / Add modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    plan_title: "",
    day_label: "TODAY",
    time_slot: "08:00",
    event_type: "Berth Allocation",
    vessel_name: "",
    berth_code: "B04",
    details: "",
    priority: "High",
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/operations/72-hour");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.all || []);
        setGrouped(data.grouped || { TODAY: [], TOMORROW: [], "DAY 3": [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/operations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portId: 1 }),
      });
      if (res.ok) {
        setSuccessMsg("Successfully synthesized and generated 72-Hour Integrated Operations Plan!");
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this scheduled event from the operations plan?")) return;
    try {
      const res = await fetch(`/api/operations/${id}`, { method: "DELETE" });
      if (res.ok) fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      id: 0,
      plan_title: "",
      day_label: activeDay === "ALL" ? "TODAY" : activeDay,
      time_slot: "09:00",
      event_type: "Berth Allocation",
      vessel_name: "",
      berth_code: "B04",
      details: "",
      priority: "Normal",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setIsEditing(true);
    setFormData({
      id: item.id,
      plan_title: item.plan_title,
      day_label: item.day_label,
      time_slot: item.time_slot,
      event_type: item.event_type,
      vessel_name: item.vessel_name || "",
      berth_code: item.berth_code || "",
      details: item.details,
      priority: item.priority,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/operations/${formData.id}` : "/api/operations";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export Plan to CSV
  const handleExportCSV = () => {
    const headers = ["Day", "Time Slot", "Event Type", "Vessel Name", "Berth Code", "Priority", "Title", "Details"];
    const rows = plans.map((p) => [
      p.day_label,
      p.time_slot,
      p.event_type,
      p.vessel_name || "N/A",
      p.berth_code || "N/A",
      p.priority,
      `"${(p.plan_title || "").replace(/"/g, '""')}"`,
      `"${(p.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `USLAX_72Hour_Operations_Plan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "Berth Allocation":
        return <Anchor className="w-4 h-4 text-cyan-400" />;
      case "Crane Allocation":
        return <Construction className="w-4 h-4 text-blue-400" />;
      case "Vessel Rerouting":
        return <Ship className="w-4 h-4 text-rose-400" />;
      case "Yard Redistribution":
        return <Layers className="w-4 h-4 text-indigo-400" />;
      case "Maintenance":
        return <Wrench className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold";
      case "High":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const daysToDisplay = activeDay === "ALL" ? ["TODAY", "TOMORROW", "DAY 3"] : [activeDay];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <CalendarDays className="w-5 h-5 text-cyan-400" />
              <span>72-Hour Integrated Port Operations Planner</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              Terminal Ops Schedule
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Integrated timeline synchronizing priority vessel arrivals, berth slips, STS crane gangs, intermodal yard evacuations, and maintenance.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGeneratePlan}
            disabled={generating}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>{generating ? "Generating Operations Loop..." : "Generate 72-Hour Plan"}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Event</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Export Plan to CSV"
          >
            <Download className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={handlePrint}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Print Operations Manifest"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center space-x-2 text-emerald-300 text-xs shadow-lg animate-fade-in no-print">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {/* Filter Tabs for Day Horizon */}
      <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 w-fit no-print">
        {["ALL", "TODAY", "TOMORROW", "DAY 3"].map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeDay === day
                ? "bg-cyan-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {day === "ALL" ? "Full 72-Hour Horizon" : day}
          </button>
        ))}
      </div>

      {/* Printable Header */}
      <div className="hidden print-only mb-6">
        <h1 className="text-xl font-bold">PORT OF LOS ANGELES / LONG BEACH - 72-HOUR OPERATIONS PLAN</h1>
        <p className="text-xs text-gray-600">Generated on: {new Date().toLocaleString()}</p>
      </div>

      {/* Timeline view by Day */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading operational timeline schedule...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {daysToDisplay.map((dayLabel) => {
            const items = grouped[dayLabel] || [];
            return (
              <div key={dayLabel} className="space-y-3">
                {/* Day Header */}
                <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                  <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">{dayLabel}</h2>
                  <span className="text-[11px] text-slate-400 font-mono">({items.length} Synchronized Actions)</span>
                </div>

                {/* Event items list */}
                {items.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                    No scheduled operations for this horizon.
                  </div>
                ) : (
                  <div className="space-y-2.5 pl-2 sm:pl-4 border-l-2 border-slate-800 ml-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-start space-x-3.5">
                          {/* Time tag */}
                          <div className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 font-mono font-bold text-xs shrink-0 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.time_slot}</span>
                          </div>

                          {/* Event details */}
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="flex items-center space-x-1 text-xs font-bold text-white">
                                {getEventIcon(item.event_type)}
                                <span>{item.plan_title}</span>
                              </span>

                              {item.vessel_name && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 font-semibold">
                                  {item.vessel_name}
                                </span>
                              )}

                              {item.berth_code && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/70 border border-blue-800/80 text-blue-300 font-semibold">
                                  {item.berth_code}
                                </span>
                              )}

                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getPriorityStyle(
                                  item.priority
                                )}`}
                              >
                                {item.priority}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{item.details}</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1.5 self-end md:self-center shrink-0 no-print">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Edit Plan Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Delete Plan Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="relative w-full max-w-md bg-[#0e172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <CalendarDays className="w-4 h-4 text-cyan-400" />
                <span>{isEditing ? "Edit Operations Event" : "Add Operations Event"}</span>
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
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.plan_title}
                  onChange={(e) => setFormData({ ...formData, plan_title: e.target.value })}
                  placeholder="Priority Mooring Sequence"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Day Horizon</label>
                  <select
                    value={formData.day_label}
                    onChange={(e) => setFormData({ ...formData, day_label: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="TODAY">TODAY</option>
                    <option value="TOMORROW">TOMORROW</option>
                    <option value="DAY 3">DAY 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Time Slot</label>
                  <input
                    type="text"
                    required
                    value={formData.time_slot}
                    onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                    placeholder="08:00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Event Type</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Berth Allocation">Berth Allocation</option>
                    <option value="Crane Allocation">Crane Allocation</option>
                    <option value="Vessel Rerouting">Vessel Rerouting</option>
                    <option value="Yard Redistribution">Yard Redistribution</option>
                    <option value="Maintenance">Maintenance</option>
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
                    <option value="Normal">Normal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Vessel Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.vessel_name}
                    onChange={(e) => setFormData({ ...formData, vessel_name: e.target.value })}
                    placeholder="MV Ocean Star"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Berth Slip</label>
                  <input
                    type="text"
                    value={formData.berth_code}
                    onChange={(e) => setFormData({ ...formData, berth_code: e.target.value })}
                    placeholder="B04"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Operational Instructions</label>
                <textarea
                  required
                  rows={3}
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Detail gantry moves, pilot boat escort, and lashers team schedule..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                ></textarea>
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
                  Save Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
