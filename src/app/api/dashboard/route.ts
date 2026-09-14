import { db } from "@/db";
import { berths, vessels, cranes, yards, congestionPredictions, alerts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const allVessels = await db.select().from(vessels);
    const allBerths = await db.select().from(berths);
    const allCranes = await db.select().from(cranes);
    const allYards = await db.select().from(yards);
    const recentPredictions = await db
      .select()
      .from(congestionPredictions)
      .orderBy(desc(congestionPredictions.created_at))
      .limit(3);
    const activeAlerts = await db.select().from(alerts).orderBy(desc(alerts.created_at)).limit(5);

    // Active vessels: Loading, Unloading, Arrived
    const activeVesselsCount = allVessels.filter((v) => ["Loading", "Unloading", "Arrived"].includes(v.status)).length;
    // Waiting vessels: Waiting, Scheduled, Delayed
    const waitingVesselsCount = allVessels.filter((v) => ["Waiting", "Scheduled", "Delayed"].includes(v.status)).length;

    // Available berths
    const availableBerthsCount = allBerths.filter((b) => b.status === "Available").length;

    // Available cranes
    const availableCranesCount = allCranes.filter(
      (c) => c.status === "Available" && c.maintenance_status === "Operational"
    ).length;

    // Yard utilisation
    const totalYardCap = allYards.reduce((acc, y) => acc + y.capacity, 0);
    const totalYardOcc = allYards.reduce((acc, y) => acc + y.current_occupancy, 0);
    const yardUtilisation = totalYardCap > 0 ? Math.round((totalYardOcc / totalYardCap) * 100) : 82;

    // Container throughput (TEU)
    const containerThroughput = allVessels.reduce((acc, v) => acc + v.container_volume, 0);

    // Average waiting time
    const waitTimes = allVessels.map((v) => parseFloat(v.waiting_time_hours || "0"));
    const avgWaitingTime = waitTimes.length > 0 ? parseFloat((waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length).toFixed(1)) : 4.6;

    // Latest congestion prediction
    const latestPrediction = recentPredictions[0] || {
      congestion_score: 84,
      risk_level: "CRITICAL",
      affected_berth: "Berths B04 & B05",
      expected_waiting_time: "5.8",
    };

    // Chart: Vessel Arrival Forecast (24h, 48h, 72h)
    const vesselArrivalForecast = [
      { timeframe: "Next 12h", vessels: 6, volumeTEU: 94000, expectedWait: 5.2 },
      { timeframe: "12-24h", vessels: 8, volumeTEU: 112000, expectedWait: 5.8 },
      { timeframe: "24-48h", vessels: 7, volumeTEU: 88000, expectedWait: 4.2 },
      { timeframe: "48-72h", vessels: 5, volumeTEU: 62000, expectedWait: 2.4 },
    ];

    // Chart: Berth Utilisation
    const berthChartData = allBerths.map((b) => ({
      code: b.berth_code,
      name: b.name.split("-")[0].trim(),
      utilisation: b.current_utilisation,
      capacity: b.capacity,
      status: b.status,
    }));

    // Chart: Crane Utilisation
    const craneChartData = allCranes.map((c) => ({
      code: c.crane_code,
      type: c.type.replace("STS ", "").replace("Mobile Harbour Crane", "Mobile HC"),
      utilisation: c.utilisation,
      capacity: c.capacity,
      status: c.status,
    }));

    // Chart: Yard Occupancy
    const yardChartData = allYards.map((y) => ({
      code: y.yard_code,
      name: y.name.replace("Yard ", "").split("-")[1]?.trim() || y.name,
      occupancy: y.current_occupancy,
      capacity: y.capacity,
      utilisation: Math.round((y.current_occupancy / y.capacity) * 100),
      status: y.status,
    }));

    // Chart: Average Waiting Time trend
    const waitingTimeTrend = [
      { day: "Mon", avgHours: 3.2, highRiskBerth: 4.8 },
      { day: "Tue", avgHours: 3.8, highRiskBerth: 5.4 },
      { day: "Wed", avgHours: 4.5, highRiskBerth: 6.9 },
      { day: "Thu", avgHours: 5.1, highRiskBerth: 7.8 },
      { day: "Fri", avgHours: 4.8, highRiskBerth: 7.2 },
      { day: "Sat", avgHours: 4.6, highRiskBerth: 6.8 },
      { day: "Today", avgHours: avgWaitingTime, highRiskBerth: parseFloat(latestPrediction.expected_waiting_time) },
    ];

    // Chart: Congestion Forecast (24h, 48h, 72h)
    const congestionForecast = [
      { period: "24-Hour", score: latestPrediction.congestion_score, risk: latestPrediction.risk_level, waitHours: parseFloat(latestPrediction.expected_waiting_time) },
      { period: "48-Hour", score: Math.round(latestPrediction.congestion_score * 0.85), risk: "HIGH", waitHours: parseFloat((parseFloat(latestPrediction.expected_waiting_time) * 0.8).toFixed(1)) },
      { period: "72-Hour", score: Math.round(latestPrediction.congestion_score * 0.6), risk: "MEDIUM", waitHours: parseFloat((parseFloat(latestPrediction.expected_waiting_time) * 0.55).toFixed(1)) },
    ];

    return Response.json({
      metrics: {
        activeVessels: activeVesselsCount,
        waitingVessels: waitingVesselsCount,
        totalVessels: allVessels.length,
        availableBerths: availableBerthsCount,
        totalBerths: allBerths.length,
        availableCranes: availableCranesCount,
        totalCranes: allCranes.length,
        yardUtilisation,
        containerThroughput: containerThroughput || 356400,
        averageWaitingTime: avgWaitingTime,
        congestionRisk: latestPrediction.risk_level,
        congestionScore: latestPrediction.congestion_score,
        affectedBerth: latestPrediction.affected_berth,
      },
      charts: {
        vesselArrivalForecast,
        berthChartData,
        craneChartData,
        yardChartData,
        waitingTimeTrend,
        congestionForecast,
      },
      recentAlerts: activeAlerts,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return Response.json({ message: error.message || "Failed to load dashboard data" }, { status: 500 });
  }
}
