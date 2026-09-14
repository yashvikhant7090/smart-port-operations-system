import { db } from "@/db";
import { berths, vessels, cranes, yards, congestionPredictions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface CongestionInput {
  portId?: number;
  date?: string;
  incomingVessels?: number;
  availableBerths?: number;
  containerVolume?: number;
  availableCranes?: number;
  yardUtilisation?: number;
  historicalWaitingTime?: number;
  vesselPriority?: "Low" | "Medium" | "High" | "Critical";
}

export interface CongestionOutput {
  portId: number;
  congestionScore: number; // 0 - 100
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  expectedWaitingTime: number; // in hours
  breakdown: {
    vesselLoadScore: number; // 0 - 30
    berthCapacityScore: number; // 0 - 25
    craneAvailabilityScore: number; // 0 - 15
    yardUtilisationScore: number; // 0 - 15
    historicalDelayScore: number; // 0 - 15
  };
  forecast: {
    period24h: { score: number; risk: string; waitHours: number };
    period48h: { score: number; risk: string; waitHours: number };
    period72h: { score: number; risk: string; waitHours: number };
  };
  highRiskBerths: string[];
  mainCauses: string[];
  recommendedActions: string[];
  engineType: "rule-based-v1.2" | "ml-ready-hybrid";
}

export class CongestionService {
  /**
   * Transparent rule-based engine calculating congestion score (0 - 100)
   * Score = VesselLoad(30) + BerthCapacity(25) + CraneAvail(15) + YardUtil(15) + HistoricalDelay(15)
   */
  public static calculateCongestion(input: CongestionInput, portBerthsList: Array<{ berth_code: string; current_utilisation: number; status: string }>): CongestionOutput {
    const incomingVessels = input.incomingVessels ?? 14;
    const availableBerths = input.availableBerths ?? 4;
    const totalBerths = portBerthsList.length || 10;
    const containerVolume = input.containerVolume ?? 145000;
    const availableCranes = input.availableCranes ?? 6;
    const yardUtilisation = input.yardUtilisation ?? 82; // %
    const historicalWait = input.historicalWaitingTime ?? 4.2; // hrs
    const priority = input.vesselPriority ?? "High";

    // 1. Vessel Load Score: 0 to 30
    // Higher incoming vessels + high container volume -> higher load
    const vesselCountFactor = Math.min(20, (incomingVessels / 20) * 20);
    const volumeFactor = Math.min(10, (containerVolume / 200000) * 10);
    let vesselLoadScore = Math.round(vesselCountFactor + volumeFactor);
    if (priority === "Critical") vesselLoadScore = Math.min(30, vesselLoadScore + 3);
    else if (priority === "Low") vesselLoadScore = Math.max(0, vesselLoadScore - 2);

    // 2. Berth Capacity Score: 0 to 25
    // Ratio of available berths vs total berths & current utilisation
    const berthOccupiedRatio = (totalBerths - availableBerths) / totalBerths;
    let berthCapacityScore = Math.round(berthOccupiedRatio * 25);
    berthCapacityScore = Math.min(25, Math.max(0, berthCapacityScore));

    // 3. Crane Availability Score: 0 to 15
    // Less cranes = higher congestion score
    const craneShortageFactor = Math.max(0, 16 - availableCranes) / 16;
    const craneAvailabilityScore = Math.min(15, Math.max(0, Math.round(craneShortageFactor * 15)));

    // 4. Yard Utilisation Score: 0 to 15
    // >80% yard utilisation is severe bottleneck
    let yardScore = 0;
    if (yardUtilisation >= 90) yardScore = 15;
    else if (yardUtilisation >= 80) yardScore = 12;
    else if (yardUtilisation >= 70) yardScore = 9;
    else if (yardUtilisation >= 50) yardScore = 5;
    else yardScore = 2;
    const yardUtilisationScore = yardScore;

    // 5. Historical Delay Score: 0 to 15
    const delayFactor = Math.min(15, Math.round((historicalWait / 8) * 15));
    const historicalDelayScore = Math.min(15, Math.max(0, delayFactor));

    // Total Score (0 - 100)
    const congestionScore = Math.min(
      100,
      Math.max(0, vesselLoadScore + berthCapacityScore + craneAvailabilityScore + yardUtilisationScore + historicalDelayScore)
    );

    // Risk Level determination
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    if (congestionScore <= 30) riskLevel = "LOW";
    else if (congestionScore <= 60) riskLevel = "MEDIUM";
    else if (congestionScore <= 80) riskLevel = "HIGH";
    else riskLevel = "CRITICAL";

    // Expected waiting time calculation (in hours)
    // Base 0.5hr + scaled by score
    const expectedWaitingTime = parseFloat((0.5 + (congestionScore / 100) * 6.5).toFixed(1));

    // High risk berths
    const highRiskBerths = portBerthsList
      .filter((b) => b.current_utilisation >= 80 || b.status === "High Congestion")
      .map((b) => b.berth_code);
    if (highRiskBerths.length === 0 && portBerthsList.length > 0) {
      highRiskBerths.push(portBerthsList[0].berth_code);
    }

    // Main causes
    const mainCauses: string[] = [];
    if (vesselLoadScore >= 18) {
      mainCauses.push(`High influx of queued vessel arrivals (${incomingVessels} vessels awaiting berth allocation)`);
    }
    if (berthCapacityScore >= 16) {
      mainCauses.push(`Berth occupancy at ${Math.round(berthOccupiedRatio * 100)}% with only ${availableBerths} available slips`);
    }
    if (craneAvailabilityScore >= 9) {
      mainCauses.push(`Severe STS crane shortage (${availableCranes} operable cranes available across deepwater quays)`);
    }
    if (yardUtilisationScore >= 10) {
      mainCauses.push(`Yard storage saturation at ${yardUtilisation}% capacity restricting discharge dwell throughput`);
    }
    if (historicalDelayScore >= 8) {
      mainCauses.push(`Accumulated channel anchorage delay trending above ${historicalWait} hours`);
    }
    if (mainCauses.length === 0) {
      mainCauses.push("Operational throughput within balanced parameters");
    }

    // Recommended actions
    const recommendedActions: string[] = [];
    if (congestionScore >= 61) {
      recommendedActions.push("Activate alternate dynamic rerouting from high-congestion berths to Pier E automated quay");
      recommendedActions.push("Authorize overtime twin-lift crane shifts across Berths B01 and B02");
      recommendedActions.push("Divert non-priority feeder vessels to auxiliary anchorages or off-peak night windows");
      recommendedActions.push("Evacuate dwell containers to intermodal rail corridor (Yard E)");
    } else if (congestionScore >= 31) {
      recommendedActions.push("Pre-assign incoming Post-Panamax vessels to available quays B03/B06");
      recommendedActions.push("Monitor Yard A dwell time threshold before afternoon discharge wave");
      recommendedActions.push("Verify crane gantry availability prior to pilot boarding");
    } else {
      recommendedActions.push("Maintain standard berth allocation schedule");
      recommendedActions.push("Proceed with planned routine maintenance on standby mobile cranes");
    }

    // 24h, 48h, 72h forecasts
    const forecast = {
      period24h: {
        score: congestionScore,
        risk: riskLevel,
        waitHours: expectedWaitingTime,
      },
      period48h: {
        score: Math.max(15, Math.round(congestionScore * 0.85)),
        risk: congestionScore * 0.85 > 80 ? "CRITICAL" : congestionScore * 0.85 > 60 ? "HIGH" : congestionScore * 0.85 > 30 ? "MEDIUM" : "LOW",
        waitHours: parseFloat((expectedWaitingTime * 0.82).toFixed(1)),
      },
      period72h: {
        score: Math.max(10, Math.round(congestionScore * 0.62)),
        risk: congestionScore * 0.62 > 80 ? "CRITICAL" : congestionScore * 0.62 > 60 ? "HIGH" : congestionScore * 0.62 > 30 ? "MEDIUM" : "LOW",
        waitHours: parseFloat((expectedWaitingTime * 0.58).toFixed(1)),
      },
    };

    return {
      portId: input.portId || 1,
      congestionScore,
      riskLevel,
      expectedWaitingTime,
      breakdown: {
        vesselLoadScore,
        berthCapacityScore,
        craneAvailabilityScore,
        yardUtilisationScore,
        historicalDelayScore,
      },
      forecast,
      highRiskBerths,
      mainCauses,
      recommendedActions,
      engineType: "rule-based-v1.2",
    };
  }

  /**
   * Predict from database state and record result
   */
  public static async predictAndSave(input: CongestionInput) {
    const allBerths = await db.select().from(berths);
    const availableBerthsCount = allBerths.filter((b) => b.status === "Available").length;
    const allCranes = await db.select().from(cranes);
    const availableCranesCount = allCranes.filter((c) => c.status === "Available" && c.maintenance_status === "Operational").length;
    const allYards = await db.select().from(yards);
    const totalYardCap = allYards.reduce((sum, y) => sum + y.capacity, 0);
    const totalYardOcc = allYards.reduce((sum, y) => sum + y.current_occupancy, 0);
    const yardUtil = totalYardCap > 0 ? Math.round((totalYardOcc / totalYardCap) * 100) : 80;

    const allVessels = await db.select().from(vessels);
    const waitingVessels = allVessels.filter((v) => v.status === "Waiting" || v.status === "Arrived" || v.status === "Scheduled");
    const avgWait = allVessels.length > 0
      ? allVessels.reduce((sum, v) => sum + parseFloat(v.waiting_time_hours || "0"), 0) / allVessels.length
      : 3.5;

    const mergedInput: CongestionInput = {
      portId: input.portId || 1,
      incomingVessels: input.incomingVessels ?? waitingVessels.length,
      availableBerths: input.availableBerths ?? availableBerthsCount,
      containerVolume: input.containerVolume ?? 155000,
      availableCranes: input.availableCranes ?? availableCranesCount,
      yardUtilisation: input.yardUtilisation ?? yardUtil,
      historicalWaitingTime: input.historicalWaitingTime ?? parseFloat(avgWait.toFixed(1)),
      vesselPriority: input.vesselPriority ?? "High",
    };

    const result = this.calculateCongestion(mergedInput, allBerths);

    // Save to DB
    const [saved] = await db
      .insert(congestionPredictions)
      .values({
        port_id: mergedInput.portId || 1,
        prediction_time: new Date(),
        forecast_period: "24h",
        congestion_score: result.congestionScore,
        risk_level: result.riskLevel,
        affected_berth: result.highRiskBerths.join(", ") || "Berth B04",
        expected_waiting_time: result.expectedWaitingTime.toString(),
        reason: result.mainCauses.join(". "),
        details_json: JSON.stringify({
          breakdown: result.breakdown,
          forecast: result.forecast,
          recommendedActions: result.recommendedActions,
          input: mergedInput,
        }),
      })
      .returning();

    return { ...result, predictionId: saved.id };
  }
}
