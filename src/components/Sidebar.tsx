"use client";

import React from "react";
import {
  LayoutDashboard,
  BrainCircuit,
  Ship,
  Anchor,
  Construction,
  MapPin,
  Compass,
  Zap,
  Route,
  CalendarDays,
  BarChart3,
  BellRing,
  Code2,
  Sliders,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "prediction"
  | "vessels"
  | "berths"
  | "cranes"
  | "port-map"
  | "berth-opt"
  | "crane-opt"
  | "routing-opt"
  | "planner"
  | "analytics"
  | "alerts"
  | "api-docs";

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadAlertCount: number;
  routingPendingCount: number;
}

export function Sidebar({ currentTab, onTabChange, unreadAlertCount, routingPendingCount }: SidebarProps) {
  const navSections = [
    {
      group: "Operations Overview",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "port-map", label: "Interactive Port Map", icon: MapPin },
        { id: "planner", label: "72-Hour Planner", icon: CalendarDays, badge: "CORE" },
      ],
    },
    {
      group: "Intelligence & Optimisation",
      items: [
        { id: "prediction", label: "Congestion Prediction", icon: BrainCircuit, badge: "HOT" },
        { id: "routing-opt", label: "Alternate Routing", icon: Route, badge: routingPendingCount > 0 ? `${routingPendingCount} Pending` : "CORE", badgeColor: "bg-rose-500/20 text-rose-300" },
        { id: "berth-opt", label: "Berth Optimisation", icon: Compass, badge: "AI" },
        { id: "crane-opt", label: "Crane Optimisation", icon: Zap },
      ],
    },
    {
      group: "Terminal Assets & CRUD",
      items: [
        { id: "vessels", label: "Vessel Management", icon: Ship },
        { id: "berths", label: "Berth Management", icon: Anchor },
        { id: "cranes", label: "Crane Management", icon: Construction },
      ],
    },
    {
      group: "Intelligence & Reports",
      items: [
        { id: "analytics", label: "Analytics & Trends", icon: BarChart3 },
        { id: "alerts", label: "Alerts & Warnings", icon: BellRing, badge: unreadAlertCount > 0 ? `${unreadAlertCount}` : undefined, badgeColor: "bg-amber-500 text-slate-900 font-bold" },
        { id: "api-docs", label: "API Testing & Postman", icon: Code2 },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#090f1e] border-r border-slate-800 flex flex-col shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      {/* Brand header */}
      <div className="p-4 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Anchor className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-100 tracking-wide uppercase">Smart Port Control</h1>
            <p className="text-[10px] text-cyan-400/80 font-mono">Operations Optimizer</p>
          </div>
        </div>
      </div>

      {/* Navigation menu */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.group}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id as NavTab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-600/30 to-blue-600/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                        item.badgeColor || (isActive ? "bg-cyan-500/30 text-cyan-200" : "bg-slate-800 text-slate-300")
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer system status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between font-mono">
          <span>Congestion Engine</span>
          <span className="text-emerald-400 font-semibold">ONLINE</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
          <span>Model Engine</span>
          <span>Rule-Based v1.2</span>
        </div>
      </div>
    </aside>
  );
}
