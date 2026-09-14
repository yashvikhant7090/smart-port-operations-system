"use client";

import React, { useState, useEffect } from "react";
import {
  Anchor,
  Bell,
  RefreshCw,
  LogOut,
  ShieldAlert,
  ChevronDown,
  User,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface NavbarProps {
  user: { name: string; email: string; role: string } | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  activePort: string;
  onPortChange: (port: string) => void;
  unreadAlertCount: number;
  onOpenAlerts: () => void;
  onResetSeed: () => void;
  isSeeding: boolean;
}

export function Navbar({
  user,
  onLogout,
  onOpenAuth,
  activePort,
  onPortChange,
  unreadAlertCount,
  onOpenAlerts,
  onResetSeed,
  isSeeding,
}: NavbarProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [portDropdownOpen, setPortDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " UTC"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const ports = [
    { code: "USLAX", name: "USLAX - Port of LA / Long Beach Complex (High Congestion Scenario)" },
    { code: "SGSIN", name: "SGSIN - Port of Singapore (Tuas Mega Terminal)" },
    { code: "NLRTM", name: "NLRTM - Port of Rotterdam (Maasvlakte II)" },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-[#0d1527]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-lg">
      {/* Left: Port selector & Live Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold tracking-wider text-sm sm:text-base">
          <Anchor className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline font-mono uppercase bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded text-xs text-cyan-300">
            PORT-OPS v2.4
          </span>
        </div>

        {/* Port dropdown */}
        <div className="relative">
          <button
            onClick={() => setPortDropdownOpen(!portDropdownOpen)}
            className="flex items-center space-x-2 bg-slate-900/80 border border-slate-700/80 hover:border-cyan-500/60 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-200 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold text-slate-100">{activePort}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {portDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
              <div className="px-3 py-1.5 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                Active Terminal Complex
              </div>
              {ports.map((p) => (
                <button
                  key={p.code}
                  onClick={() => {
                    onPortChange(p.code);
                    setPortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    activePort === p.code ? "bg-cyan-950/50 text-cyan-400 font-semibold" : "text-slate-300"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {activePort === p.code && <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300">ACTIVE</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Congestion Ticker */}
        <div className="hidden lg:flex items-center space-x-2 bg-rose-950/40 border border-rose-800/50 px-2.5 py-1 rounded text-xs text-rose-300">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Berths B04/B05 Congestion Hotspot Active (96% Occ)</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-3">
        {/* Clock */}
        <div className="hidden md:flex items-center space-x-1.5 text-slate-400 font-mono text-xs bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentTime || "12:00:00 UTC"}</span>
        </div>

        {/* Seed demo reset button */}
        <button
          onClick={onResetSeed}
          disabled={isSeeding}
          title="Reset realistic demo dataset (28+ vessels, 10 berths, 16 cranes)"
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSeeding ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{isSeeding ? "Resetting..." : "Reset Demo Data"}</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
          title="View Operational Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
              {unreadAlertCount}
            </span>
          )}
        </button>

        {/* User profile / Login */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center font-bold text-white text-[11px]">
                {user.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-slate-200 leading-none">{user.name}</div>
                <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{user.role}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="font-semibold text-slate-100">{user.name}</div>
                  <div className="text-slate-400 text-[11px] truncate">{user.email}</div>
                  <span className="inline-block mt-1 bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-950/40 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout from Terminal</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Login / Demo Account</span>
          </button>
        )}
      </div>
    </header>
  );
}
