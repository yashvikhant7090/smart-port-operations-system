import { db } from "@/db";
import { vessels, berths } from "@/db/schema";
import { desc, eq, like, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const size = searchParams.get("size") || "";

    const allBerths = await db.select().from(berths);
    const berthMap = new Map(allBerths.map((b) => [b.id, b]));

    let query = db.select().from(vessels);
    const vesselList = await query.orderBy(desc(vessels.created_at));

    let filtered = vesselList;

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(s) ||
          v.imo_number.toLowerCase().includes(s) ||
          v.destination.toLowerCase().includes(s) ||
          v.origin.toLowerCase().includes(s)
      );
    }

    if (status && status !== "All") {
      filtered = filtered.filter((v) => v.status === status);
    }

    if (priority && priority !== "All") {
      filtered = filtered.filter((v) => v.priority === priority);
    }

    if (size && size !== "All") {
      filtered = filtered.filter((v) => v.vessel_size === size);
    }

    // Attach berth details
    const result = filtered.map((v) => {
      const b = v.assigned_berth_id ? berthMap.get(v.assigned_berth_id) : null;
      return {
        ...v,
        assigned_berth_code: b ? b.berth_code : null,
        assigned_berth_name: b ? b.name : null,
      };
    });

    return Response.json(result);
  } catch (error: any) {
    console.error("GET /api/vessels error:", error);
    return Response.json({ message: error.message || "Failed to fetch vessels" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      imo_number,
      eta,
      etd,
      container_volume,
      vessel_size,
      priority,
      status,
      assigned_berth_id,
      destination,
      origin,
      draft,
      waiting_time_hours,
    } = body;

    if (!name || !imo_number || !container_volume || !destination) {
      return Response.json({ message: "Vessel name, IMO number, container volume and destination are required." }, { status: 400 });
    }

    // Check duplicate IMO
    const [existing] = await db.select().from(vessels).where(eq(vessels.imo_number, imo_number.trim())).limit(1);
    if (existing) {
      return Response.json({ message: "Vessel with this IMO number already exists." }, { status: 409 });
    }

    const [newVessel] = await db
      .insert(vessels)
      .values({
        port_id: body.port_id || 1,
        name: name.trim(),
        imo_number: imo_number.trim(),
        eta: eta ? new Date(eta) : new Date(),
        etd: etd ? new Date(etd) : new Date(Date.now() + 48 * 3600 * 1000),
        container_volume: Number(container_volume),
        vessel_size: vessel_size || "Post-Panamax",
        priority: priority || "Medium",
        status: status || "Scheduled",
        assigned_berth_id: assigned_berth_id ? Number(assigned_berth_id) : null,
        destination: destination.trim(),
        origin: origin ? origin.trim() : "Shanghai Port",
        draft: draft ? draft.toString() : "14.5",
        waiting_time_hours: waiting_time_hours ? waiting_time_hours.toString() : "0.0",
      })
      .returning();

    return Response.json(newVessel, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/vessels error:", error);
    return Response.json({ message: error.message || "Failed to create vessel" }, { status: 500 });
  }
}
