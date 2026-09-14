import { db } from "@/db";
import { congestionPredictions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const predId = parseInt(id, 10);
    if (isNaN(predId)) return Response.json({ message: "Invalid prediction ID" }, { status: 400 });

    const [pred] = await db.select().from(congestionPredictions).where(eq(congestionPredictions.id, predId)).limit(1);
    if (!pred) return Response.json({ message: "Prediction not found" }, { status: 404 });

    let details = {};
    try {
      details = JSON.parse(pred.details_json);
    } catch {}

    return Response.json({
      ...pred,
      details,
    });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to fetch prediction" }, { status: 500 });
  }
}
