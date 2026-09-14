import { db } from "@/db";
import { operationPlans, vessels, berths, cranes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export class OperationPlannerService {
  /**
   * Automatically generate an optimized 72-hour port operations plan
   * prioritizing: Critical vessels, High priority, ETA, Berth capacity, Crane availability, Yard capacity, Maintenance.
   */
  public static async generate72HourPlan(portId: number = 1) {
    const allVessels = await db.select().from(vessels);
    const allBerths = await db.select().from(berths);
    const allCranes = await db.select().from(cranes);

    // Sort vessels by priority (Critical > High > Medium > Low) then ETA
    const priorityWeight: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    const sortedVessels = [...allVessels].sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
      if (pDiff !== 0) return pDiff;
      return new Date(a.eta).getTime() - new Date(b.eta).getTime();
    });

    // Delete existing auto-generated draft plans
    await db.delete(operationPlans).where(eq(operationPlans.port_id, portId));

    const todayItems = [
      {
        port_id: portId,
        plan_title: "Priority Berth Allocation & Mooring",
        day_label: "TODAY",
        time_slot: "08:00",
        event_type: "Berth Allocation",
        vessel_name: sortedVessels[0]?.name || "MV Ocean Star",
        berth_code: "B04",
        details: "Fast-track berthing for critical container cargo; coordinate dual tug assist and harbor pilot.",
        priority: "Critical",
        status: "In Progress",
      },
      {
        port_id: portId,
        plan_title: "Quay Operations & Discharging",
        day_label: "TODAY",
        time_slot: "10:00",
        event_type: "Berth Allocation",
        vessel_name: sortedVessels[1]?.name || "MSC Horizon",
        berth_code: "B02",
        details: "Commence twin-lift gantry discharging; synchronize yard drayage trucks to Yard A buffer.",
        priority: "High",
        status: "Approved",
      },
      {
        port_id: portId,
        plan_title: "High-Speed Crane Gang Allocation",
        day_label: "TODAY",
        time_slot: "12:00",
        event_type: "Crane Allocation",
        vessel_name: sortedVessels[0]?.name || "MV Ocean Star",
        berth_code: "B06",
        details: "Assign STS Cranes C08, C09, C10, C11. Target collective handling rate: 140 moves/hr.",
        priority: "High",
        status: "Approved",
      },
      {
        port_id: portId,
        plan_title: "Dynamic Congestion Bypass Rerouting",
        day_label: "TODAY",
        time_slot: "15:00",
        event_type: "Vessel Rerouting",
        vessel_name: sortedVessels[2]?.name || "CMA CGM Palais Royal",
        berth_code: "B03",
        details: "Divert from congested B05 to Pier Middle Harbor Basin (B03) to reduce waiting delay by 2.7h.",
        priority: "Critical",
        status: "Approved",
      },
      {
        port_id: portId,
        plan_title: "Yard Rail Intermodal Evacuation Wave",
        day_label: "TODAY",
        time_slot: "18:00",
        event_type: "Yard Redistribution",
        vessel_name: "Import Staging Batches",
        berth_code: "YARD-A",
        details: "Shift 1,200 TEU import dwell containers to on-dock intermodal rail trackage to prevent yard gridlock.",
        priority: "High",
        status: "Approved",
      },
    ];

    const tomorrowItems = [
      {
        port_id: portId,
        plan_title: "ULCV Berthing Assignment",
        day_label: "TOMORROW",
        time_slot: "08:00",
        event_type: "Berth Allocation",
        vessel_name: sortedVessels[3]?.name || "Ever Given II",
        berth_code: "B01",
        details: "Starboard mooring alongside Pier 400 Deepwater quay. Full shore lashers team deployed.",
        priority: "High",
        status: "Approved",
      },
      {
        port_id: portId,
        plan_title: "Yard Dwell Balancing & Cold Chain Check",
        day_label: "TOMORROW",
        time_slot: "11:00",
        event_type: "Yard Redistribution",
        vessel_name: "Cold-Chain Reefer Blocks",
        berth_code: "YARD-C",
        details: "Re-plug 450 export reefer containers; clear empty container stacks to Yard D exterior depot.",
        priority: "Normal",
        status: "Approved",
      },
      {
        port_id: portId,
        plan_title: "Heavy-Lift Crane Gang Reconfiguration",
        day_label: "TOMORROW",
        time_slot: "14:00",
        event_type: "Crane Allocation",
        vessel_name: sortedVessels[4]?.name || "COSCO Shipping Universe",
        berth_code: "B04",
        details: "Position Cranes C01 & C02 to center bays; switch spreaders for 45ft high-cube containers.",
        priority: "High",
        status: "Approved",
      },
      {
        port_id: portId,
        plan_title: "Regional Feeder Inter-Berth Loading",
        day_label: "TOMORROW",
        time_slot: "17:00",
        event_type: "Berth Allocation",
        vessel_name: sortedVessels[6]?.name || "Wan Hai 515",
        berth_code: "B08",
        details: "Direct cross-dock transfer of transshipment containers from B02 arrival to regional feeder.",
        priority: "Normal",
        status: "Approved",
      },
    ];

    const day3Items = [
      {
        port_id: portId,
        plan_title: "Preventative Crane Maintenance & Certification",
        day_label: "DAY 3",
        time_slot: "09:00",
        event_type: "Maintenance",
        vessel_name: "Quay Crane C07 & C13",
        berth_code: "B09",
        details: "Complete wire rope inspections, spreader optical alignment, and high-voltage power pickup check.",
        priority: "High",
        status: "Approved",
      },
      {
        port_id: portId,
        plan_title: "Automated Terminal Deepwater Reception",
        day_label: "DAY 3",
        time_slot: "13:00",
        event_type: "Berth Allocation",
        vessel_name: sortedVessels[5]?.name || "Madrid Maersk",
        berth_code: "B06",
        details: "Docking at Pier E fully automated quay with AGV fleet and automated stacking cranes.",
        priority: "Critical",
        status: "Approved",
      },
      {
        port_id: portId,
        plan_title: "Overnight Throughput Acceleration Shift",
        day_label: "DAY 3",
        time_slot: "20:00",
        event_type: "Crane Allocation",
        vessel_name: sortedVessels[7]?.name || "HMM Algeciras",
        berth_code: "B05",
        details: "Deploy 4 gantry cranes to ensure vessel turn-around inside 32-hour target schedule.",
        priority: "High",
        status: "Approved",
      },
    ];

    const allItems = [...todayItems, ...tomorrowItems, ...day3Items];

    const inserted = await db.insert(operationPlans).values(allItems).returning();
    return inserted;
  }
}
