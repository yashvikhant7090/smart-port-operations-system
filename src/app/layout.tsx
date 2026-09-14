import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Container Congestion Predictor & Port Operations Optimiser",
  description:
    "Smart Port Operations & Logistics Intelligence System for Congestion Hotspot Prediction, Dynamic Berth Allocation, Crane Optimisation, Alternate Routing, and Integrated 72-Hour Planning.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090e1a] text-slate-100 min-h-screen antialiased selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
