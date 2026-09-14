import { db } from "@/db";
import { yards } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const yardId = parseInt(id, 10);
    if (isNaN(yardId)) return Response.json({ message: "Invalid yard ID" }, { status: 400 });

    const [yard] = await db.select().from(yards).where(eq(yards.id, yardId)).limit(1);
    if (!yard) return Response.json({ message: "Yard not found" }, { status: 404 });

    return Response.json({
      ...yard,
      occupancy_pct: Math.round((yard.current_occupancy / yard.capacity) * 100),
      available_teu: Math.max(0, yard.capacity - yard.current_occupancy),
    });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to fetch yard" }, { status: 500 });
  }
}
