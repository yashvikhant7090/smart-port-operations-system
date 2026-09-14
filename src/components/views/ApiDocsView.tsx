"use client";

import React, { useState } from "react";
import { Code2, Download, Copy, Check, ExternalLink, Send } from "lucide-react";

export function ApiDocsView() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const endpoints = [
    {
      category: "Authentication",
      items: [
        {
          method: "POST",
          path: "/api/auth/register",
          desc: "Create new user account",
          body: JSON.stringify({ name: "Officer John", email: "officer@portdemo.com", password: "Password@123", role: "Operator" }, null, 2),
        },
        {
          method: "POST",
          path: "/api/auth/login",
          desc: "Authenticate and receive JWT token",
          body: JSON.stringify({ email: "admin@portdemo.com", password: "Admin@123" }, null, 2),
        },
        {
          method: "GET",
          path: "/api/auth/me",
          desc: "Fetch authenticated user profile (Bearer token required)",
          headers: { Authorization: "Bearer <YOUR_JWT_TOKEN>" },
        },
      ],
    },
    {
      category: "Dashboard & Telemetry",
      items: [
        {
          method: "GET",
          path: "/api/dashboard",
          desc: "Get real-time operational cards, congestion score, and forecast charts",
        },
      ],
    },
    {
      category: "Vessel Management (CRUD)",
      items: [
        {
          method: "GET",
          path: "/api/vessels?status=Waiting&priority=Critical",
          desc: "Filter and search vessel schedules and queues",
        },
        {
          method: "POST",
          path: "/api/vessels",
          desc: "Register new incoming vessel",
          body: JSON.stringify(
            {
              name: "MV Pacific Express",
              imo_number: "IMO9912834",
              container_volume: 18500,
              vessel_size: "Ultra Large",
              priority: "High",
              status: "Waiting",
              destination: "Los Angeles",
            },
            null,
            2
          ),
        },
        {
          method: "PUT",
          path: "/api/vessels/1",
          desc: "Update vessel status or assigned berth",
          body: JSON.stringify({ status: "Arrived", assigned_berth_id: 6 }, null, 2),
        },
        {
          method: "DELETE",
          path: "/api/vessels/1",
          desc: "Delete vessel from terminal manifest",
        },
      ],
    },
    {
      category: "Congestion Prediction Engine",
      items: [
        {
          method: "POST",
          path: "/api/predictions",
          desc: "Run rule-based prediction engine & save forecast",
          body: JSON.stringify(
            {
              portId: 1,
              incomingVessels: 18,
              availableBerths: 2,
              containerVolume: 195000,
              availableCranes: 4,
              yardUtilisation: 88,
              historicalWaitingTime: 5.4,
              vesselPriority: "Critical",
            },
            null,
            2
          ),
        },
        {
          method: "GET",
          path: "/api/predictions",
          desc: "Fetch recent congestion predictions",
        },
      ],
    },
    {
      category: "Berth, Crane & Routing Optimisation",
      items: [
        {
          method: "POST",
          path: "/api/optimization/berth",
          desc: "Calculate optimal quay assignment for vessel",
          body: JSON.stringify({ vesselId: 1 }, null, 2),
        },
        {
          method: "POST",
          path: "/api/optimization/crane",
          desc: "Calculate high-speed crane gang allocation",
          body: JSON.stringify({ vesselId: 1 }, null, 2),
        },
        {
          method: "GET",
          path: "/api/optimization/routing",
          desc: "Detect congestion hotspots and recommend dynamic alternate reroutes",
        },
        {
          method: "POST",
          path: "/api/optimization/routing",
          desc: "Execute dynamic reroute to bypass congestion",
          body: JSON.stringify({ action: "apply", vesselId: 1, targetBerthId: 6 }, null, 2),
        },
      ],
    },
    {
      category: "72-Hour Operations Planner",
      items: [
        {
          method: "POST",
          path: "/api/operations/generate",
          desc: "Automatically synthesize 72-hour operational timeline",
          body: JSON.stringify({ portId: 1 }, null, 2),
        },
        {
          method: "GET",
          path: "/api/operations/72-hour",
          desc: "Retrieve synchronized 72-hour timeline grouped by TODAY, TOMORROW, and DAY 3",
        },
      ],
    },
    {
      category: "Analytics & Telemetry",
      items: [
        {
          method: "GET",
          path: "/api/analytics?range=7days",
          desc: "Get waiting time trends, throughput TEU, and demurrage avoidance KPIs",
        },
      ],
    },
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadPostman = () => {
    const postmanCollection = {
      info: {
        name: "Container Congestion Predictor & Port Operations Optimiser API",
        description: "Complete REST API Collection for Smart Port Operations",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      item: endpoints.map((sec) => ({
        name: sec.category,
        item: sec.items.map((it) => ({
          name: it.desc,
          request: {
            method: it.method,
            header: [
              { key: "Content-Type", value: "application/json" },
              ...((it as any).headers ? [{ key: "Authorization", value: (it as any).headers.Authorization }] : []),
            ],
            url: {
              raw: `{{baseUrl}}${it.path}`,
              host: ["{{baseUrl}}"],
              path: it.path.split("/").filter(Boolean),
            },
            ...(it.body
              ? {
                  body: {
                    mode: "raw",
                    raw: it.body,
                  },
                }
              : {}),
          },
        })),
      })),
      variable: [
        {
          key: "baseUrl",
          value: window.location.origin,
          type: "string",
        },
      ],
    };

    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SmartPort_Operations_API.postman_collection.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Code2 className="w-5 h-5 text-cyan-400" />
              <span>REST API Reference & Postman Testing Collection</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              Open REST Endpoints
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standard RESTful APIs with JWT authentication, Knex/PostgreSQL integration, and JSON contracts.
          </p>
        </div>

        <button
          onClick={handleDownloadPostman}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-md transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Postman Collection (JSON)</span>
        </button>
      </div>

      {/* Demo Credentials Box */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-2">
        <h3 className="font-bold text-white uppercase font-mono tracking-wider text-[11px]">
          Demo Authentication Credentials
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 font-mono">
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Email:</span>
            <span className="text-cyan-400 font-bold">admin@portdemo.com</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Password:</span>
            <span className="text-cyan-400 font-bold">Admin@123</span>
          </div>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-6">
        {endpoints.map((group, gIdx) => (
          <div key={gIdx} className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300">
              {group.category}
            </div>

            <div className="divide-y divide-slate-800/60 p-2">
              {group.items.map((item, idx) => {
                const uniqueIdx = gIdx * 100 + idx;
                const methodColor =
                  item.method === "GET"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : item.method === "POST"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                    : item.method === "PUT"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40";

                return (
                  <div key={idx} className="p-3 space-y-2 hover:bg-slate-800/30 rounded-lg transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 font-mono text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${methodColor}`}>
                          {item.method}
                        </span>
                        <span className="text-white font-bold">{item.path}</span>
                      </div>
                      <span className="text-xs text-slate-400">{item.desc}</span>
                    </div>

                    {item.body && (
                      <div className="relative">
                        <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                          {item.body}
                        </pre>
                        <button
                          onClick={() => handleCopy(item.body!, uniqueIdx)}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white bg-slate-900 rounded border border-slate-700 cursor-pointer"
                          title="Copy payload"
                        >
                          {copiedIndex === uniqueIdx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
