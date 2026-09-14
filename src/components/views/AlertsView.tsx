"use client";

import React, { useState, useEffect } from "react";
import {
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Check,
  RefreshCw,
  Route,
  Zap,
  Info,
  ShieldAlert,
  Clock,
  Layers,
  Construction,
} from "lucide-react";

interface AlertsViewProps {
  onNavigateToRouting?: () => void;
  onNavigateToCranes?: () => void;
}

export function AlertsView({ onNavigateToRouting, onNavigateToCranes }: AlertsViewProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("All");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const url = filterSeverity === "All" ? "/api/alerts" : `/api/alerts?severity=${filterSeverity}`;
      const res = await fetch(url);
      if (res.ok) {
        setAlerts(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filterSeverity]);

  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/alerts/${id}/read`, { method: "PUT" });
      if (res.ok) {
        setAlerts(alerts.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAlerts(alerts.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return {
          badge: "bg-red-500/20 text-red-400 border-red-500/40 font-bold",
          border: "border-red-900/60 bg-red-950/20",
          icon: <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />,
        };
      case "HIGH":
        return {
          badge: "bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold",
          border: "border-orange-900/60 bg-orange-950/20",
          icon: <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />,
        };
      case "MEDIUM":
        return {
          badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 font-medium",
          border: "border-yellow-900/40 bg-yellow-950/10",
          icon: <Info className="w-5 h-5 text-yellow-400 shrink-0" />,
        };
      default:
        return {
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          border: "border-slate-800 bg-slate-900/60",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
        };
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <BellRing className="w-5 h-5 text-cyan-400" />
              <span>Operational Alerts & Dispatch Warnings</span>
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated alerts tracking berth overloads, gantry crane shortages, yard capacity thresholds, vessel delays, and rerouting actions.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <button
            onClick={fetchAlerts}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Refresh Alerts"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading operational alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Active Alerts</h3>
          <p className="text-xs max-w-sm mx-auto">
            All port operations are running within safety and capacity parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);
            const isReroute = alert.category?.includes("ALTERNATE ROUTE");
            const isCrane = alert.category?.includes("CRANE");

            return (
              <div
                key={alert.id}
                className={`border rounded-xl p-4 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  alert.is_read ? "opacity-75 bg-slate-900/40 border-slate-800" : style.border
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="mt-0.5">{style.icon}</div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white">{alert.title}</span>

                      <span className={`px-2 py-0.2 rounded text-[10px] font-mono border ${style.badge}`}>
                        {alert.severity}
                      </span>

                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.2 rounded border border-slate-800">
                        {alert.category}
                      </span>

                      {!alert.is_read && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" title="Unread"></span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{alert.message}</p>

                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(alert.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                  {isReroute && onNavigateToRouting && (
                    <button
                      onClick={onNavigateToRouting}
                      className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-300 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Route className="w-3.5 h-3.5" />
                      <span>Reroute</span>
                    </button>
                  )}

                  {isCrane && onNavigateToCranes && (
                    <button
                      onClick={onNavigateToCranes}
                      className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-300 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Reallocate</span>
                    </button>
                  )}

                  {!alert.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Mark as Read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    title="Delete Alert"
                  >
                    <Trash2 className="w-4 h-4" />
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
