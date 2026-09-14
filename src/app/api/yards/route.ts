import { db } from "@/db";
import { yards } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const allYards = await db.select().from(yards).orderBy(asc(yards.yard_code));
    const result = allYards.map((y) => ({
      ...y,
      occupancy_pct: Math.round((y.current_occupancy / y.capacity) * 100),
      available_teu: Math.max(0, y.capacity - y.current_occupancy),
    }));
    return Response.json(result);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to fetch yards" }, { status: 500 });
  }
}
