import { db } from "@/db";
import { operationPlans } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const planId = parseInt(id, 10);
    if (isNaN(planId)) return Response.json({ message: "Invalid plan ID" }, { status: 400 });

    const body = await request.json();
    const [existing] = await db.select().from(operationPlans).where(eq(operationPlans.id, planId)).limit(1);
    if (!existing) return Response.json({ message: "Operation plan item not found" }, { status: 404 });

    const updateData: any = { updated_at: new Date() };
    if (body.plan_title !== undefined) updateData.plan_title = body.plan_title.trim();
    if (body.day_label !== undefined) updateData.day_label = body.day_label;
    if (body.time_slot !== undefined) updateData.time_slot = body.time_slot;
    if (body.event_type !== undefined) updateData.event_type = body.event_type;
    if (body.vessel_name !== undefined) updateData.vessel_name = body.vessel_name;
    if (body.berth_code !== undefined) updateData.berth_code = body.berth_code;
    if (body.details !== undefined) updateData.details = body.details;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;

    const [updated] = await db.update(operationPlans).set(updateData).where(eq(operationPlans.id, planId)).returning();
    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to update operation plan" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const planId = parseInt(id, 10);
    if (isNaN(planId)) return Response.json({ message: "Invalid plan ID" }, { status: 400 });

    await db.delete(operationPlans).where(eq(operationPlans.id, planId));
    return Response.json({ message: "Operation plan item deleted", id: planId });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to delete plan item" }, { status: 500 });
  }
}
