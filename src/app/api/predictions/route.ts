import { db } from "@/db";
import { congestionPredictions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { CongestionService } from "@/lib/services/congestionService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const list = await db.select().from(congestionPredictions).orderBy(desc(congestionPredictions.created_at)).limit(20);
    const parsed = list.map((item) => {
      let details = {};
      try {
        details = JSON.parse(item.details_json);
      } catch {}
      return {
        ...item,
        details,
      };
    });
    return Response.json(parsed);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to fetch predictions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await CongestionService.predictAndSave(body);
    return Response.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/predictions error:", error);
    return Response.json({ message: error.message || "Failed to generate prediction" }, { status: 500 });
  }
}
