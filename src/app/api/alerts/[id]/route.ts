import { db } from "@/db";
import { alerts } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const alertId = parseInt(id, 10);
    if (isNaN(alertId)) return Response.json({ message: "Invalid alert ID" }, { status: 400 });

    await db.delete(alerts).where(eq(alerts.id, alertId));
    return Response.json({ message: "Alert deleted", id: alertId });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to delete alert" }, { status: 500 });
  }
}
