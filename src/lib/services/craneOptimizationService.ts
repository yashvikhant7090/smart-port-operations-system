import { db } from "@/db";
import { cranes, vessels, berths, craneAssignments } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface CraneOptimizationResult {
  vessel: {
    id: number;
    name: string;
    container_volume: number;
    priority: string;
    vessel_size: string;
    assigned_berth_code?: string;
  };
  currentAllocation: Array<{
    crane_code: string;
    type: string;
    status: string;
    capacity: number;
  }>;
  recommendedAllocation: Array<{
    crane_id: number;
    crane_code: string;
    type: string;
    capacity: number;
    role: "Primary" | "Secondary" | "Backup Standby";
    score: number;
    status: string;
  }>;
  estimatedHandlingHours: number;
  expectedThroughputRate: number; // total moves per hour
  targetCompletionHours: number;
  reason: string;
}

export class CraneOptimizationService {
  public static async optimizeForVessel(vesselId: number): Promise<CraneOptimizationResult> {
    const [vessel] = await db.select().from(vessels).where(eq(vessels.id, vesselId)).limit(1);
    if (!vessel) throw new Error(`Vessel ${vesselId} not found`);

    const allCranes = await db.select().from(cranes);
    const allBerths = await db.select().from(berths);
    const assignedBerth = allBerths.find((b) => b.id === vessel.assigned_berth_id);

    // Current cranes allocated to this vessel
    const currentAlloc = allCranes.filter((c) => c.current_vessel_id === vessel.id);

    // Filter available operable cranes
    const candidateCranes = allCranes
      .filter((c) => c.maintenance_status === "Operational" && c.status !== "Offline")
      .map((c) => {
        let score = 50;

        // Capacity bonus (STS Super Post-Panamax = higher moves)
        score += Math.round(c.capacity * 0.8);

        // Same berth location bonus
        if (assignedBerth && c.assigned_berth_id === assignedBerth.id) {
          score += 35;
        }

        // Available status bonus
        if (c.status === "Available") {
          score += 25;
        } else if (c.status === "Working") {
          score -= 15;
        }

        // Penalty if currently in maintenance
        if (c.status === "Maintenance" || c.maintenance_status !== "Operational") {
          score = 0;
        }

        return {
          ...c,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    // Determine target cranes needed
    let requiredCount = 2;
    if (vessel.container_volume > 20000) requiredCount = 4;
    else if (vessel.container_volume > 13000) requiredCount = 3;
    else if (vessel.container_volume > 6000) requiredCount = 2;
    else requiredCount = 1;

    if (vessel.priority === "Critical" && requiredCount < 4) {
      requiredCount += 1;
    }

    type CraneRole = "Primary" | "Secondary" | "Backup Standby";

    const primaryAlloc: Array<{
      crane_id: number;
      crane_code: string;
      type: string;
      capacity: number;
      role: CraneRole;
      score: number;
      status: string;
    }> = candidateCranes.slice(0, requiredCount).map((c, idx) => ({
      crane_id: c.id,
      crane_code: c.crane_code,
      type: c.type,
      capacity: c.capacity,
      role: (idx === 0 ? "Primary" : idx === 1 ? "Secondary" : "Primary") as CraneRole,
      score: c.score,
      status: c.status,
    }));

    // Add 1 backup crane
    const backupCandidate = candidateCranes.slice(requiredCount, requiredCount + 1)[0];
    const recommendedAllocation = [...primaryAlloc];
    if (backupCandidate) {
      recommendedAllocation.push({
        crane_id: backupCandidate.id,
        crane_code: backupCandidate.crane_code,
        type: backupCandidate.type,
        capacity: backupCandidate.capacity,
        role: "Backup Standby",
        score: backupCandidate.score,
        status: backupCandidate.status,
      });
    }

    // Calculate throughput & handling time
    const activeCranes = primaryAlloc;
    const totalMovesPerHour = activeCranes.reduce((sum, c) => sum + c.capacity, 0);
    // Assuming container_volume TEU, ~1.6 TEU per crane lift move
    const totalLifts = Math.round(vessel.container_volume / 1.6);
    const estimatedHandlingHours = totalMovesPerHour > 0 ? parseFloat((totalLifts / totalMovesPerHour).toFixed(1)) : 24.0;

    const reasons: string[] = [
      `Selected ${primaryAlloc.length} high-throughput gantry cranes for ${vessel.vessel_size} cargo payload (${vessel.container_volume.toLocaleString()} TEU).`,
      `Target gang rate: ${totalMovesPerHour} net moves/hour with synchronous dual-lift cycling.`,
      backupCandidate ? `Designated ${backupCandidate.crane_code} on standby buffer to prevent dwell time spillover.` : "",
    ].filter(Boolean);

    return {
      vessel: {
        id: vessel.id,
        name: vessel.name,
        container_volume: vessel.container_volume,
        priority: vessel.priority,
        vessel_size: vessel.vessel_size,
        assigned_berth_code: assignedBerth ? assignedBerth.berth_code : "Pending",
      },
      currentAllocation: currentAlloc.map((c) => ({
        crane_code: c.crane_code,
        type: c.type,
        status: c.status,
        capacity: c.capacity,
      })),
      recommendedAllocation,
      estimatedHandlingHours,
      expectedThroughputRate: totalMovesPerHour,
      targetCompletionHours: Math.round(estimatedHandlingHours * 1.1),
      reason: reasons.join(" "),
    };
  }

  /**
   * Apply crane allocation to database
   */
  public static async applyAllocation(vesselId: number, craneIds: number[]) {
    const [vessel] = await db.select().from(vessels).where(eq(vessels.id, vesselId)).limit(1);
    if (!vessel) throw new Error("Vessel not found");

    for (const cid of craneIds) {
      await db
        .update(cranes)
        .set({
          current_vessel_id: vesselId,
          status: "Working",
          assigned_berth_id: vessel.assigned_berth_id,
          utilisation: 85,
          updated_at: new Date(),
        })
        .where(eq(cranes.id, cid));

      const now = new Date();
      await db.insert(craneAssignments).values({
        crane_id: cid,
        vessel_id: vesselId,
        berth_id: vessel.assigned_berth_id || 1,
        shift: "Day Shift",
        assigned_from: now,
        assigned_to: new Date(now.getTime() + 18 * 3600 * 1000),
        status: "Active",
      });
    }

    return { success: true, allocatedCranes: craneIds.length, vesselName: vessel.name };
  }
}
