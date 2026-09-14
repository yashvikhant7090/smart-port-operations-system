import { db } from "@/db";
import { operationPlans } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db.select().from(operationPlans).orderBy(asc(operationPlans.id));
    return Response.json(list);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to fetch operations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan_title, day_label, time_slot, event_type, vessel_name, berth_code, details, priority } = body;

    if (!plan_title || !day_label || !time_slot || !event_type || !details) {
      return Response.json({ message: "Plan title, day, time slot, event type and details are required" }, { status: 400 });
    }

    const [newItem] = await db
      .insert(operationPlans)
      .values({
        port_id: body.port_id || 1,
        plan_title: plan_title.trim(),
        day_label: day_label || "TODAY",
        time_slot: time_slot || "08:00",
        event_type: event_type || "Berth Allocation",
        vessel_name: vessel_name || null,
        berth_code: berth_code || null,
        details: details.trim(),
        priority: priority || "Normal",
        status: body.status || "Approved",
      })
      .returning();

    return Response.json(newItem, { status: 201 });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to create plan item" }, { status: 500 });
  }
}
