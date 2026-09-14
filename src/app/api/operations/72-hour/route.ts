import { db } from "@/db";
import { operationPlans } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const plans = await db.select().from(operationPlans).orderBy(asc(operationPlans.id));

    // Group by day_label: TODAY, TOMORROW, DAY 3
    const grouped = {
      TODAY: plans.filter((p) => p.day_label === "TODAY"),
      TOMORROW: plans.filter((p) => p.day_label === "TOMORROW"),
      "DAY 3": plans.filter((p) => p.day_label === "DAY 3"),
    };

    return Response.json({
      all: plans,
      grouped,
    });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to fetch operations plan" }, { status: 500 });
  }
}
