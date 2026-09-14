import { db } from "@/db";
import { berths, vessels, cranes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const berthId = parseInt(id, 10);
    if (isNaN(berthId)) return Response.json({ message: "Invalid berth ID" }, { status: 400 });

    const [berth] = await db.select().from(berths).where(eq(berths.id, berthId)).limit(1);
    if (!berth) return Response.json({ message: "Berth not found" }, { status: 404 });

    const berthVessels = await db.select().from(vessels).where(eq(vessels.assigned_berth_id, berthId));
    const berthCranes = await db.select().from(cranes).where(eq(cranes.assigned_berth_id, berthId));

    return Response.json({
      ...berth,
      vessels: berthVessels,
      cranes: berthCranes,
    });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to fetch berth" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const berthId = parseInt(id, 10);
    if (isNaN(berthId)) return Response.json({ message: "Invalid berth ID" }, { status: 400 });

    const body = await request.json();
    const [existing] = await db.select().from(berths).where(eq(berths.id, berthId)).limit(1);
    if (!existing) return Response.json({ message: "Berth not found" }, { status: 404 });

    const updateData: any = { updated_at: new Date() };
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.berth_code !== undefined) updateData.berth_code = body.berth_code.trim().toUpperCase();
    if (body.capacity !== undefined) updateData.capacity = Number(body.capacity);
    if (body.max_draft !== undefined) updateData.max_draft = body.max_draft.toString();
    if (body.current_utilisation !== undefined) updateData.current_utilisation = Number(body.current_utilisation);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.available_cranes !== undefined) updateData.available_cranes = Number(body.available_cranes);

    const [updated] = await db.update(berths).set(updateData).where(eq(berths.id, berthId)).returning();
    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to update berth" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const berthId = parseInt(id, 10);
    if (isNaN(berthId)) return Response.json({ message: "Invalid berth ID" }, { status: 400 });

    await db.delete(berths).where(eq(berths.id, berthId));
    return Response.json({ message: "Berth deleted", id: berthId });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to delete berth" }, { status: 500 });
  }
}
