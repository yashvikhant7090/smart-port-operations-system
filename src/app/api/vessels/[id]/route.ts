import { db } from "@/db";
import { vessels, berths } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const vesselId = parseInt(id, 10);
    if (isNaN(vesselId)) return Response.json({ message: "Invalid vessel ID" }, { status: 400 });

    const [vessel] = await db.select().from(vessels).where(eq(vessels.id, vesselId)).limit(1);
    if (!vessel) return Response.json({ message: "Vessel not found" }, { status: 404 });

    let berthInfo = null;
    if (vessel.assigned_berth_id) {
      const [berth] = await db.select().from(berths).where(eq(berths.id, vessel.assigned_berth_id)).limit(1);
      berthInfo = berth;
    }

    return Response.json({
      ...vessel,
      assigned_berth: berthInfo,
    });
  } catch (error: any) {
    return Response.json({ message: error.message || "Error fetching vessel" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const vesselId = parseInt(id, 10);
    if (isNaN(vesselId)) return Response.json({ message: "Invalid vessel ID" }, { status: 400 });

    const body = await request.json();

    const [existing] = await db.select().from(vessels).where(eq(vessels.id, vesselId)).limit(1);
    if (!existing) return Response.json({ message: "Vessel not found" }, { status: 404 });

    const updateData: any = {
      updated_at: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.imo_number !== undefined) updateData.imo_number = body.imo_number.trim();
    if (body.eta !== undefined) updateData.eta = new Date(body.eta);
    if (body.etd !== undefined) updateData.etd = new Date(body.etd);
    if (body.container_volume !== undefined) updateData.container_volume = Number(body.container_volume);
    if (body.vessel_size !== undefined) updateData.vessel_size = body.vessel_size;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assigned_berth_id !== undefined) updateData.assigned_berth_id = body.assigned_berth_id ? Number(body.assigned_berth_id) : null;
    if (body.destination !== undefined) updateData.destination = body.destination.trim();
    if (body.origin !== undefined) updateData.origin = body.origin.trim();
    if (body.draft !== undefined) updateData.draft = body.draft.toString();
    if (body.waiting_time_hours !== undefined) updateData.waiting_time_hours = body.waiting_time_hours.toString();

    const [updated] = await db.update(vessels).set(updateData).where(eq(vessels.id, vesselId)).returning();

    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to update vessel" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const vesselId = parseInt(id, 10);
    if (isNaN(vesselId)) return Response.json({ message: "Invalid vessel ID" }, { status: 400 });

    const [existing] = await db.select().from(vessels).where(eq(vessels.id, vesselId)).limit(1);
    if (!existing) return Response.json({ message: "Vessel not found" }, { status: 404 });

    await db.delete(vessels).where(eq(vessels.id, vesselId));
    return Response.json({ message: "Vessel deleted successfully", id: vesselId });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to delete vessel" }, { status: 500 });
  }
}
