"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar, NavTab } from "@/components/Sidebar";
import { AuthModal } from "@/components/AuthModal";

// Views
import { DashboardView } from "@/components/views/DashboardView";
import { PredictionView } from "@/components/views/PredictionView";
import { VesselsView } from "@/components/views/VesselsView";
import { BerthsView } from "@/components/views/BerthsView";
import { CranesView } from "@/components/views/CranesView";
import { PortMapView } from "@/components/views/PortMapView";
import { BerthOptimizationView } from "@/components/views/BerthOptimizationView";
import { CraneOptimizationView } from "@/components/views/CraneOptimizationView";
import { RoutingOptimizationView } from "@/components/views/RoutingOptimizationView";
import { PlannerView } from "@/components/views/PlannerView";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { AlertsView } from "@/components/views/AlertsView";
import { ApiDocsView } from "@/components/views/ApiDocsView";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activePort, setActivePort] = useState("USLAX");

  // Telemetry data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [unreadAlertCount, setUnreadAlertCount] = useState(5);
  const [routingPendingCount, setRoutingPendingCount] = useState(2);
  const [isSeeding, setIsSeeding] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Cross-view linking state
  const [vesselForBerthOpt, setVesselForBerthOpt] = useState<number | null>(null);
  const [vesselForCraneOpt, setVesselForCraneOpt] = useState<number | null>(null);

  // Initialize auth
  useEffect(() => {
    const savedUser = localStorage.getItem("port_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    } else {
      // Default to demo admin session for seamless immediate usage
      const demoUser = {
        name: "Capt. Arthur Miller",
        email: "admin@portdemo.com",
        role: "Admin",
      };
      setUser(demoUser);
      localStorage.setItem("port_user", JSON.stringify(demoUser));
    }
  }, []);

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    setApiError(null);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        throw new Error("Backend server is not connected. Please verify database and API.");
      }
      const data = await res.json();
      setDashboardData(data);
      if (data.recentAlerts) {
        setUnreadAlertCount(data.recentAlerts.filter((a: any) => !a.is_read).length);
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Failed to connect to backend server");
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [activePort]);

  const handleResetSeed = async () => {
    if (!window.confirm("Reset and seed realistic terminal data (28+ vessels, 10 berths, 16 cranes, 72h plans)?")) return;
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        await fetchDashboard();
        alert("Demo database re-seeded successfully with high congestion backlog scenario!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("port_token");
    localStorage.removeItem("port_user");
    setUser(null);
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
  };

  // Navigations with context
  const handleSelectVesselForBerth = (vesselId: number) => {
    setVesselForBerthOpt(vesselId);
    setCurrentTab("berth-opt");
  };

  const handleSelectVesselForCrane = (vesselId: number) => {
    setVesselForCraneOpt(vesselId);
    setCurrentTab("crane-opt");
  };

  return (
    <div className="min-h-screen bg-[#080e1d] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
        activePort={activePort}
        onPortChange={(p) => setActivePort(p)}
        unreadAlertCount={unreadAlertCount}
        onOpenAlerts={() => setCurrentTab("alerts")}
        onResetSeed={handleResetSeed}
        isSeeding={isSeeding}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          unreadAlertCount={unreadAlertCount}
          routingPendingCount={routingPendingCount}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
          {/* Error Banner */}
          {apiError && (
            <div className="mb-6 p-4 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center justify-between text-rose-300 text-xs shadow-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>Backend server is not connected. Please start the backend server. Error: {apiError}</span>
              </div>
              <button
                onClick={fetchDashboard}
                className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded font-semibold cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* View Routing */}
          {currentTab === "dashboard" && (
            <DashboardView
              data={dashboardData}
              loading={loadingDashboard}
              onRefresh={fetchDashboard}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === "prediction" && (
            <PredictionView onNavigateToRouting={() => setCurrentTab("routing-opt")} />
          )}

          {currentTab === "vessels" && (
            <VesselsView
              onSelectVesselForBerthOpt={handleSelectVesselForBerth}
              onSelectVesselForCraneOpt={handleSelectVesselForCrane}
            />
          )}

          {currentTab === "berths" && (
            <BerthsView onSelectVesselForBerthOpt={handleSelectVesselForBerth} />
          )}

          {currentTab === "cranes" && (
            <CranesView onSelectVesselForCraneOpt={handleSelectVesselForCrane} />
          )}

          {currentTab === "port-map" && (
            <PortMapView
              onSelectVesselForBerthOpt={handleSelectVesselForBerth}
              onSelectVesselForCraneOpt={handleSelectVesselForCrane}
            />
          )}

          {currentTab === "berth-opt" && (
            <BerthOptimizationView
              initialVesselId={vesselForBerthOpt}
              onNavigateToCraneOpt={handleSelectVesselForCrane}
            />
          )}

          {currentTab === "crane-opt" && (
            <CraneOptimizationView initialVesselId={vesselForCraneOpt} />
          )}

          {currentTab === "routing-opt" && (
            <RoutingOptimizationView onNavigateToBerths={() => setCurrentTab("berths")} />
          )}

          {currentTab === "planner" && <PlannerView />}

          {currentTab === "analytics" && <AnalyticsView />}

          {currentTab === "alerts" && (
            <AlertsView
              onNavigateToRouting={() => setCurrentTab("routing-opt")}
              onNavigateToCranes={() => setCurrentTab("crane-opt")}
            />
          )}

          {currentTab === "api-docs" && <ApiDocsView />}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
