import { db } from "@/db";
import { berths, vessels, cranes } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const allBerths = await db.select().from(berths).orderBy(asc(berths.berth_code));
    const allVessels = await db.select().from(vessels);
    const allCranes = await db.select().from(cranes);

    const result = allBerths.map((b) => {
      // Find current active vessel berthed here
      const dockedVessel = allVessels.find(
        (v) => v.assigned_berth_id === b.id && ["Loading", "Unloading", "Arrived"].includes(v.status)
      ) || allVessels.find((v) => v.assigned_berth_id === b.id && v.status === "Waiting");

      const berthCranes = allCranes.filter((c) => c.assigned_berth_id === b.id);
      const availableCranesCount = berthCranes.filter(
        (c) => c.status === "Available" && c.maintenance_status === "Operational"
      ).length;

      // Congestion level derived
      let congestionLevel = "Low";
      if (b.current_utilisation >= 85 || b.status === "High Congestion") congestionLevel = "Critical";
      else if (b.current_utilisation >= 65) congestionLevel = "High";
      else if (b.current_utilisation >= 40) congestionLevel = "Medium";

      return {
        ...b,
        current_vessel_name: dockedVessel ? dockedVessel.name : null,
        current_vessel: dockedVessel || null,
        cranes_count: berthCranes.length,
        available_cranes_count: availableCranesCount,
        congestion_level: congestionLevel,
      };
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to fetch berths" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { berth_code, name, capacity, max_draft, status, available_cranes } = body;

    if (!berth_code || !name || !capacity) {
      return Response.json({ message: "Berth code, name, and capacity are required" }, { status: 400 });
    }

    const [existing] = await db.select().from(berths).where(eq(berths.berth_code, berth_code.trim())).limit(1);
    if (existing) {
      return Response.json({ message: "Berth code already exists" }, { status: 409 });
    }

    const [newBerth] = await db
      .insert(berths)
      .values({
        port_id: body.port_id || 1,
        berth_code: berth_code.trim().toUpperCase(),
        name: name.trim(),
        capacity: Number(capacity),
        max_draft: max_draft ? max_draft.toString() : "16.0",
        current_utilisation: body.current_utilisation || 0,
        status: status || "Available",
        available_cranes: available_cranes !== undefined ? Number(available_cranes) : 2,
      })
      .returning();

    return Response.json(newBerth, { status: 201 });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to create berth" }, { status: 500 });
  }
}
