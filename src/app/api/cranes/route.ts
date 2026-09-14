import { db } from "@/db";
import { cranes, vessels, berths } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const allCranes = await db.select().from(cranes).orderBy(asc(cranes.crane_code));
    const allVessels = await db.select().from(vessels);
    const allBerths = await db.select().from(berths);
    const vesselMap = new Map(allVessels.map((v) => [v.id, v]));
    const berthMap = new Map(allBerths.map((b) => [b.id, b]));

    const result = allCranes.map((c) => {
      const v = c.current_vessel_id ? vesselMap.get(c.current_vessel_id) : null;
      const b = c.assigned_berth_id ? berthMap.get(c.assigned_berth_id) : null;
      return {
        ...c,
        current_vessel_name: v ? v.name : null,
        assigned_berth_code: b ? b.berth_code : null,
      };
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to fetch cranes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { crane_code, type, capacity, status, maintenance_status, assigned_berth_id, utilisation } = body;

    if (!crane_code || !type) {
      return Response.json({ message: "Crane code and type are required" }, { status: 400 });
    }

    const [existing] = await db.select().from(cranes).where(eq(cranes.crane_code, crane_code.trim())).limit(1);
    if (existing) {
      return Response.json({ message: "Crane code already exists" }, { status: 409 });
    }

    const [newCrane] = await db
      .insert(cranes)
      .values({
        port_id: body.port_id || 1,
        crane_code: crane_code.trim().toUpperCase(),
        type: type.trim(),
        capacity: capacity ? Number(capacity) : 40,
        status: status || "Available",
        maintenance_status: maintenance_status || "Operational",
        assigned_berth_id: assigned_berth_id ? Number(assigned_berth_id) : null,
        utilisation: utilisation ? Number(utilisation) : 0,
      })
      .returning();

    return Response.json(newCrane, { status: 201 });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to create crane" }, { status: 500 });
  }
}
