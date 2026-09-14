import { db } from "@/db";
import { berths, vessels, cranes, berthAssignments } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface BerthOptimizationResult {
  vessel: {
    id: number;
    name: string;
    imo_number: string;
    size: string;
    container_volume: number;
    priority: string;
    eta: Date;
    current_berth?: string;
  };
  bestBerth: {
    id: number;
    berth_code: string;
    name: string;
    expectedWaiting: number; // hours
    expectedOperationTime: number; // hours
    requiredCranes: number;
    confidence: number; // %
    utilisation: number; // %
    score: number;
    reason: string;
  };
  alternativeBerth: {
    id: number;
    berth_code: string;
    name: string;
    expectedWaiting: number;
    expectedOperationTime: number;
    requiredCranes: number;
    confidence: number;
    utilisation: number;
    score: number;
    reason: string;
  } | null;
  allEvaluations: Array<{
    id: number;
    berth_code: string;
    name: string;
    score: number;
    expectedWaiting: number;
    status: string;
    fitRating: "Optimal" | "Good Alternative" | "Suboptimal" | "Not Recommended";
    notes: string;
  }>;
}

export class BerthOptimizationService {
  public static async optimizeForVessel(vesselId: number): Promise<BerthOptimizationResult> {
    const [vessel] = await db.select().from(vessels).where(eq(vessels.id, vesselId)).limit(1);
    if (!vessel) {
      throw new Error(`Vessel with ID ${vesselId} not found`);
    }

    const allBerths = await db.select().from(berths);
    const allCranes = await db.select().from(cranes);

    // Calculate requirements
    const vol = vessel.container_volume;
    const isUltraLarge = vessel.vessel_size === "Ultra Large";
    const isPostPanamax = vessel.vessel_size === "Post-Panamax";
    const isCritical = vessel.priority === "Critical";
    const isHigh = vessel.priority === "High";

    // Required cranes
    let recommendedCranesCount = 2;
    if (vol > 20000) recommendedCranesCount = 4;
    else if (vol > 14000) recommendedCranesCount = 3;
    else if (vol > 8000) recommendedCranesCount = 2;
    else recommendedCranesCount = 1;

    // Evaluate each berth
    const evaluated = allBerths.map((b) => {
      let score = 100;
      const reasons: string[] = [];

      // 1. Physical Capacity & Draft compatibility
      const draftReq = parseFloat(vessel.draft || "15.0");
      const berthMaxDraft = parseFloat(b.max_draft || "16.0");
      if (draftReq > berthMaxDraft) {
        score -= 50;
        reasons.push(`Draft clearance tight (${draftReq}m vs max ${berthMaxDraft}m)`);
      }

      if (b.capacity < vol) {
        score -= 30;
        reasons.push(`Berth length/capacity (${b.capacity} TEU) lower than vessel volume (${vol} TEU)`);
      }

      // 2. Status & Availability
      if (b.status === "Maintenance") {
        score -= 80;
        reasons.push("Berth currently offline for quay maintenance");
      } else if (b.status === "High Congestion") {
        score -= 40;
        reasons.push("Berth has severe active backlog");
      } else if (b.status === "Occupied") {
        score -= 25;
        reasons.push("Berth currently occupied; turn-around required");
      } else {
        score += 15;
        reasons.push("Berth currently vacant and clear for mooring");
      }

      // 3. Current Utilisation
      score -= Math.round(b.current_utilisation * 0.35);

      // 4. Crane availability at or near berth
      const berthCranes = allCranes.filter(
        (c) => c.assigned_berth_id === b.id && c.status === "Available" && c.maintenance_status === "Operational"
      );
      if (berthCranes.length >= recommendedCranesCount) {
        score += 15;
        reasons.push(`Direct gantry crane coverage (${berthCranes.length} available)`);
      } else if (berthCranes.length === 0) {
        score -= 20;
        reasons.push("No available STS cranes at this pier");
      }

      // 5. Special bonuses for automated quays (e.g. B06 Pier E)
      if (b.berth_code === "B06" && (isUltraLarge || isCritical || isHigh)) {
        score += 18;
        reasons.push("High-speed dual-trolley automated quay matched to mega-carrier");
      }

      // Calculate expected wait
      let expectedWait = 0.5;
      if (b.status === "High Congestion") expectedWait += 4.5 + (b.current_utilisation / 100) * 2;
      else if (b.status === "Occupied") expectedWait += 2.0 + (b.current_utilisation / 100) * 1.5;
      else expectedWait += 0.4;

      if (isCritical) expectedWait = Math.max(0.4, expectedWait * 0.7);

      // Expected operation time based on volume and cranes
      const avgMovesPerHr = 35 * Math.max(1, Math.min(recommendedCranesCount, Math.max(1, b.available_cranes)));
      const opHours = parseFloat((vol / (avgMovesPerHr * 20)).toFixed(1)); // ~20 TEU per move equiv or direct hour factor

      const finalScore = Math.max(0, Math.min(100, score));

      let fitRating: "Optimal" | "Good Alternative" | "Suboptimal" | "Not Recommended" = "Suboptimal";
      if (finalScore >= 80) fitRating = "Optimal";
      else if (finalScore >= 60) fitRating = "Good Alternative";
      else if (finalScore >= 40) fitRating = "Suboptimal";
      else fitRating = "Not Recommended";

      return {
        id: b.id,
        berth_code: b.berth_code,
        name: b.name,
        capacity: b.capacity,
        utilisation: b.current_utilisation,
        status: b.status,
        available_cranes: b.available_cranes,
        score: finalScore,
        expectedWaiting: parseFloat(expectedWait.toFixed(1)),
        expectedOperationTime: Math.max(8, opHours),
        fitRating,
        notes: reasons.join(". "),
      };
    });

    // Sort by score descending
    evaluated.sort((a, b) => b.score - a.score);

    const best = evaluated[0];
    const alt = evaluated.length > 1 ? evaluated[1] : null;

    const currentBerthObj = allBerths.find((b) => b.id === vessel.assigned_berth_id);

    return {
      vessel: {
        id: vessel.id,
        name: vessel.name,
        imo_number: vessel.imo_number,
        size: vessel.vessel_size,
        container_volume: vessel.container_volume,
        priority: vessel.priority,
        eta: vessel.eta,
        current_berth: currentBerthObj ? currentBerthObj.berth_code : "Unassigned",
      },
      bestBerth: {
        id: best.id,
        berth_code: best.berth_code,
        name: best.name,
        expectedWaiting: best.expectedWaiting,
        expectedOperationTime: best.expectedOperationTime,
        requiredCranes: recommendedCranesCount,
        confidence: Math.min(96, Math.max(75, best.score - 4)),
        utilisation: best.utilisation,
        score: best.score,
        reason: best.notes,
      },
      alternativeBerth: alt
        ? {
            id: alt.id,
            berth_code: alt.berth_code,
            name: alt.name,
            expectedWaiting: alt.expectedWaiting,
            expectedOperationTime: alt.expectedOperationTime,
            requiredCranes: recommendedCranesCount,
            confidence: Math.min(88, Math.max(60, alt.score - 8)),
            utilisation: alt.utilisation,
            score: alt.score,
            reason: alt.notes,
          }
        : null,
      allEvaluations: evaluated.map((e) => ({
        id: e.id,
        berth_code: e.berth_code,
        name: e.name,
        score: e.score,
        expectedWaiting: e.expectedWaiting,
        status: e.status,
        fitRating: e.fitRating,
        notes: e.notes,
      })),
    };
  }

  /**
   * Apply optimized berth assignment to vessel
   */
  public static async applyAssignment(vesselId: number, berthId: number) {
    const [vessel] = await db.select().from(vessels).where(eq(vessels.id, vesselId)).limit(1);
    const [berth] = await db.select().from(berths).where(eq(berths.id, berthId)).limit(1);
    if (!vessel || !berth) throw new Error("Invalid vessel or berth ID");

    // Update vessel
    await db
      .update(vessels)
      .set({
        assigned_berth_id: berthId,
        status: vessel.status === "Waiting" ? "Arrived" : vessel.status,
        updated_at: new Date(),
      })
      .where(eq(vessels.id, vesselId));

    // Record berth assignment
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 24 * 3600 * 1000);
    await db.insert(berthAssignments).values({
      vessel_id: vesselId,
      berth_id: berthId,
      start_time: startTime,
      end_time: endTime,
      status: "Active",
    });

    return { success: true, vesselName: vessel.name, assignedBerth: berth.berth_code };
  }
}
