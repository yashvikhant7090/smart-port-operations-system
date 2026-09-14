import { db } from "@/db";
import { berths, vessels, cranes, yards, congestionPredictions } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7days"; // today, 7days, 30days

    const allBerths = await db.select().from(berths);
    const allCranes = await db.select().from(cranes);
    const allYards = await db.select().from(yards);
    const allVessels = await db.select().from(vessels);

    // Multipliers for timeframes
    const mult = range === "today" ? 1 : range === "7days" ? 7 : 30;

    // 1. Average Vessel Waiting Time Trends
    const waitingTimeTrends =
      range === "today"
        ? [
            { label: "00:00", actual: 3.8, baseline: 2.5, target: 2.0 },
            { label: "04:00", actual: 4.2, baseline: 2.5, target: 2.0 },
            { label: "08:00", actual: 5.6, baseline: 3.0, target: 2.0 },
            { label: "12:00", actual: 5.2, baseline: 3.2, target: 2.0 },
            { label: "16:00", actual: 4.9, baseline: 3.0, target: 2.0 },
            { label: "20:00", actual: 4.4, baseline: 2.8, target: 2.0 },
          ]
        : range === "7days"
        ? [
            { label: "Day 1", actual: 3.4, baseline: 4.5, rerouted: 2.8 },
            { label: "Day 2", actual: 4.2, baseline: 5.2, rerouted: 3.1 },
            { label: "Day 3", actual: 5.8, baseline: 6.8, rerouted: 3.9 },
            { label: "Day 4", actual: 5.4, baseline: 6.5, rerouted: 3.6 },
            { label: "Day 5", actual: 4.9, baseline: 6.0, rerouted: 3.3 },
            { label: "Day 6", actual: 4.3, baseline: 5.5, rerouted: 2.9 },
            { label: "Day 7", actual: 4.1, baseline: 5.2, rerouted: 2.7 },
          ]
        : [
            { label: "Week 1", actual: 6.2, baseline: 7.5, rerouted: 4.2 },
            { label: "Week 2", actual: 5.7, baseline: 7.1, rerouted: 3.8 },
            { label: "Week 3", actual: 4.8, baseline: 6.4, rerouted: 3.2 },
            { label: "Week 4", actual: 4.1, baseline: 5.9, rerouted: 2.8 },
          ];

    // 2. Vessel Arrivals by Category
    const arrivalsByCategory = [
      { category: "Ultra Large (>18k TEU)", count: allVessels.filter((v) => v.vessel_size === "Ultra Large").length },
      { category: "Post-Panamax (10-18k TEU)", count: allVessels.filter((v) => v.vessel_size === "Post-Panamax").length },
      { category: "Panamax (5-10k TEU)", count: allVessels.filter((v) => v.vessel_size === "Panamax").length },
      { category: "Feeder (<5k TEU)", count: allVessels.filter((v) => v.vessel_size === "Feeder").length },
    ];

    // 3. Berth Utilisation Breakdown
    const berthUtilisation = allBerths.map((b) => ({
      code: b.berth_code,
      name: b.name.split("-")[1]?.trim() || b.name,
      utilisation: b.current_utilisation,
      capacity: b.capacity,
      congestion: b.current_utilisation >= 80 ? "Critical" : b.current_utilisation >= 60 ? "High" : "Optimal",
    }));

    // 4. Crane Utilisation & Efficiency
    const craneEfficiency = allCranes.map((c) => ({
      code: c.crane_code,
      type: c.type.replace("STS ", "").replace("Mobile Harbour Crane", "Mobile HC"),
      movesPerHour: c.capacity,
      utilisation: c.utilisation,
      status: c.status,
    }));

    // 5. Yard Capacity & Distribution
    const yardDistribution = allYards.map((y) => ({
      code: y.yard_code,
      name: y.name.replace("Yard ", ""),
      capacity: y.capacity,
      occupancy: y.current_occupancy,
      ratePct: Math.round((y.current_occupancy / y.capacity) * 100),
      zone: y.zone_type,
    }));

    // 6. Container Throughput vs Target (TEU)
    const throughputTimeSeries =
      range === "today"
        ? [
            { time: "06:00", inbound: 4500, outbound: 3200, net: 7700 },
            { time: "10:00", inbound: 6200, outbound: 4800, net: 11000 },
            { time: "14:00", inbound: 7800, outbound: 5600, net: 13400 },
            { time: "18:00", inbound: 5900, outbound: 4900, net: 10800 },
            { time: "22:00", inbound: 4100, outbound: 3500, net: 7600 },
          ]
        : [
            { time: "Mon", inbound: 28500, outbound: 24200, net: 52700 },
            { time: "Tue", inbound: 31200, outbound: 26800, net: 58000 },
            { time: "Wed", inbound: 35800, outbound: 29400, net: 65200 },
            { time: "Thu", inbound: 33400, outbound: 31100, net: 64500 },
            { time: "Fri", inbound: 29800, outbound: 28200, net: 58000 },
            { time: "Sat", inbound: 24500, outbound: 21900, net: 46400 },
            { time: "Sun", inbound: 26100, outbound: 22800, net: 48900 },
          ];

    // 7. Congestion Incident Frequency
    const congestionFrequency = [
      { level: "Low (0-30)", count: 18, sharePct: 42 },
      { level: "Medium (31-60)", count: 14, sharePct: 32 },
      { level: "High (61-80)", count: 7, sharePct: 16 },
      { level: "Critical (81-100)", count: 4, sharePct: 10 },
    ];

    // 8. Optimisation Impact Metrics
    const optimizationImpact = {
      avgWaitingReductionPct: 28.6,
      hoursSavedPerVessel: 1.8,
      vesselsRerouted: 12,
      craneGangEfficiencyGainPct: 18.2,
      yardCongestionIncidentsPrevented: 9,
      demurrageCostAvoidedUSD: 480000,
    };

    return Response.json({
      range,
      waitingTimeTrends,
      arrivalsByCategory,
      berthUtilisation,
      craneEfficiency,
      yardDistribution,
      throughputTimeSeries,
      congestionFrequency,
      optimizationImpact,
    });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to load analytics" }, { status: 500 });
  }
}
