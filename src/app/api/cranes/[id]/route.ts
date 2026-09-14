import { db } from "@/db";
import { cranes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const craneId = parseInt(id, 10);
    if (isNaN(craneId)) return Response.json({ message: "Invalid crane ID" }, { status: 400 });

    const [crane] = await db.select().from(cranes).where(eq(cranes.id, craneId)).limit(1);
    if (!crane) return Response.json({ message: "Crane not found" }, { status: 404 });

    return Response.json(crane);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to fetch crane" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const craneId = parseInt(id, 10);
    if (isNaN(craneId)) return Response.json({ message: "Invalid crane ID" }, { status: 400 });

    const body = await request.json();
    const [existing] = await db.select().from(cranes).where(eq(cranes.id, craneId)).limit(1);
    if (!existing) return Response.json({ message: "Crane not found" }, { status: 404 });

    const updateData: any = { updated_at: new Date() };
    if (body.crane_code !== undefined) updateData.crane_code = body.crane_code.trim().toUpperCase();
    if (body.type !== undefined) updateData.type = body.type.trim();
    if (body.capacity !== undefined) updateData.capacity = Number(body.capacity);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.maintenance_status !== undefined) updateData.maintenance_status = body.maintenance_status;
    if (body.current_vessel_id !== undefined) updateData.current_vessel_id = body.current_vessel_id ? Number(body.current_vessel_id) : null;
    if (body.assigned_berth_id !== undefined) updateData.assigned_berth_id = body.assigned_berth_id ? Number(body.assigned_berth_id) : null;
    if (body.utilisation !== undefined) updateData.utilisation = Number(body.utilisation);

    const [updated] = await db.update(cranes).set(updateData).where(eq(cranes.id, craneId)).returning();
    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to update crane" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const craneId = parseInt(id, 10);
    if (isNaN(craneId)) return Response.json({ message: "Invalid crane ID" }, { status: 400 });

    await db.delete(cranes).where(eq(cranes.id, craneId));
    return Response.json({ message: "Crane deleted", id: craneId });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to delete crane" }, { status: 500 });
  }
}
