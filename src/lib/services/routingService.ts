import { db } from "@/db";
import { vessels, berths, routingRecommendations, alerts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface ReroutingCandidate {
  id?: number;
  vesselId: number;
  vesselName: string;
  imoNumber: string;
  containerVolume: number;
  currentBerthId: number | null;
  currentBerthCode: string;
  recommendedBerthId: number;
  recommendedBerthCode: string;
  currentExpectedWait: number; // hours
  waitAfterRerouting: number; // hours
  congestionReductionPct: number; // %
  timeSavedHours: number;
  reason: string;
  status: "Pending" | "Applied" | "Rejected";
}

export class RoutingService {
  /**
   * Evaluates congestion hotspots and discovers vessels that will benefit from dynamic rerouting
   */
  public static async analyzeAndRecommend(): Promise<ReroutingCandidate[]> {
    const allVessels = await db.select().from(vessels);
    const allBerths = await db.select().from(berths);
    const berthMap = new Map(allBerths.map((b) => [b.id, b]));

    // Find congested berths (utilisation > 80% or status === High Congestion)
    const congestedBerths = allBerths.filter((b) => b.current_utilisation >= 80 || b.status === "High Congestion");
    const congestedBerthIds = new Set(congestedBerths.map((b) => b.id));

    // Find available low-congestion candidate berths (utilisation < 60% and status === Available)
    const availableCandidateBerths = allBerths.filter((b) => b.status === "Available" && b.current_utilisation < 60);

    const recommendations: ReroutingCandidate[] = [];

    // Prioritize waiting / scheduled vessels assigned to congested berths
    const affectedVessels = allVessels.filter(
      (v) =>
        (v.status === "Waiting" || v.status === "Arrived" || v.status === "Scheduled") &&
        v.assigned_berth_id &&
        congestedBerthIds.has(v.assigned_berth_id)
    );

    for (const vessel of affectedVessels) {
      const curBerth = berthMap.get(vessel.assigned_berth_id!);
      if (!curBerth) continue;

      // Find best alternative berth that satisfies draft & capacity
      const vesselDraft = parseFloat(vessel.draft || "14.5");
      const suitableAlternatives = availableCandidateBerths
        .filter((b) => {
          const maxDraft = parseFloat(b.max_draft || "16.0");
          return maxDraft >= vesselDraft && b.capacity >= vessel.container_volume * 0.8;
        })
        .sort((a, b) => a.current_utilisation - b.current_utilisation);

      if (suitableAlternatives.length > 0) {
        const altBerth = suitableAlternatives[0];
        const currentWait = parseFloat(vessel.waiting_time_hours || "0") > 0 ? parseFloat(vessel.waiting_time_hours) : 5.4;
        const waitAfter = parseFloat((Math.max(1.2, currentWait * 0.65)).toFixed(1));
        const timeSaved = parseFloat((currentWait - waitAfter).toFixed(1));
        const reductionPct = parseFloat((((currentWait - waitAfter) / currentWait) * 100).toFixed(1));

        const reason = `Berth ${curBerth.berth_code} currently operates at ${curBerth.current_utilisation}% capacity with high waiting queues. Berth ${altBerth.berth_code} (${altBerth.name}) offers immediate quay clearance, ${altBerth.available_cranes} available STS cranes, and draft depth of ${altBerth.max_draft}m. Dynamic diversion eliminates ${timeSaved} hours of anchorage idle time.`;

        recommendations.push({
          vesselId: vessel.id,
          vesselName: vessel.name,
          imoNumber: vessel.imo_number,
          containerVolume: vessel.container_volume,
          currentBerthId: curBerth.id,
          currentBerthCode: curBerth.berth_code,
          recommendedBerthId: altBerth.id,
          recommendedBerthCode: altBerth.berth_code,
          currentExpectedWait: currentWait,
          waitAfterRerouting: waitAfter,
          congestionReductionPct: reductionPct,
          timeSavedHours: timeSaved,
          reason,
          status: "Pending",
        });
      }
    }

    // If no dynamic matches found, also pull from routingRecommendations table
    const storedRecs = await db.select().from(routingRecommendations).orderBy(desc(routingRecommendations.created_at));
    for (const rec of storedRecs) {
      const vessel = allVessels.find((v) => v.id === rec.vessel_id);
      const curB = berthMap.get(rec.current_berth_id || -1);
      const recB = berthMap.get(rec.recommended_berth_id);
      if (vessel && recB && !recommendations.some((r) => r.vesselId === vessel.id)) {
        const curWait = parseFloat(rec.current_expected_wait);
        const aftWait = parseFloat(rec.wait_after_rerouting);
        recommendations.push({
          id: rec.id,
          vesselId: vessel.id,
          vesselName: vessel.name,
          imoNumber: vessel.imo_number,
          containerVolume: vessel.container_volume,
          currentBerthId: curB ? curB.id : null,
          currentBerthCode: curB ? curB.berth_code : "Unassigned",
          recommendedBerthId: recB.id,
          recommendedBerthCode: recB.berth_code,
          currentExpectedWait: curWait,
          waitAfterRerouting: aftWait,
          congestionReductionPct: parseFloat(rec.congestion_reduction_pct || "0"),
          timeSavedHours: parseFloat((curWait - aftWait).toFixed(1)),
          reason: rec.reason,
          status: (rec.status as "Pending" | "Applied" | "Rejected") || "Pending",
        });
      }
    }

    return recommendations;
  }

  /**
   * Execute rerouting recommendation: updates vessel berth & waiting time and logs alert
   */
  public static async executeReroute(vesselId: number, targetBerthId: number, recId?: number) {
    const [vessel] = await db.select().from(vessels).where(eq(vessels.id, vesselId)).limit(1);
    const [targetBerth] = await db.select().from(berths).where(eq(berths.id, targetBerthId)).limit(1);
    if (!vessel || !targetBerth) throw new Error("Invalid vessel or berth");

    // Update vessel
    await db
      .update(vessels)
      .set({
        assigned_berth_id: targetBerthId,
        waiting_time_hours: "2.1",
        status: "Arrived",
        updated_at: new Date(),
      })
      .where(eq(vessels.id, vesselId));

    // Update recommendation status if exists
    if (recId) {
      await db.update(routingRecommendations).set({ status: "Applied" }).where(eq(routingRecommendations.id, recId));
    }

    // Insert alert
    await db.insert(alerts).values({
      port_id: vessel.port_id,
      title: `DYNAMIC REROUTE APPLIED: ${vessel.name}`,
      message: `Vessel ${vessel.name} successfully rerouted to Berth ${targetBerth.berth_code} (${targetBerth.name}). Expected waiting time reduced to 2.1 hours.`,
      severity: "MEDIUM",
      category: "ALTERNATE ROUTE RECOMMENDED",
      is_read: false,
      related_vessel_id: vesselId,
      related_berth_id: targetBerthId,
    });

    return {
      success: true,
      vesselName: vessel.name,
      newBerth: targetBerth.berth_code,
      message: `Successfully executed reroute of ${vessel.name} to Berth ${targetBerth.berth_code}.`,
    };
  }
}
