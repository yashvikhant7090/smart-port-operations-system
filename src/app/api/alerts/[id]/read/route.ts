import { db } from "@/db";
import { alerts } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const alertId = parseInt(id, 10);
    if (isNaN(alertId)) return Response.json({ message: "Invalid alert ID" }, { status: 400 });

    const [updated] = await db
      .update(alerts)
      .set({ is_read: true })
      .where(eq(alerts.id, alertId))
      .returning();

    if (!updated) return Response.json({ message: "Alert not found" }, { status: 404 });
    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to mark alert as read" }, { status: 500 });
  }
}
