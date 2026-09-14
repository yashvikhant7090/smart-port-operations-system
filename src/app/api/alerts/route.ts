import { db } from "@/db";
import { alerts } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");

    let list = await db.select().from(alerts).orderBy(desc(alerts.created_at));

    if (severity && severity !== "All") {
      list = list.filter((a) => a.severity.toUpperCase() === severity.toUpperCase());
    }

    if (category && category !== "All") {
      list = list.filter((a) => a.category === category);
    }

    return Response.json(list);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, severity, category } = body;

    if (!title || !message) {
      return Response.json({ message: "Title and message are required" }, { status: 400 });
    }

    const [newAlert] = await db
      .insert(alerts)
      .values({
        port_id: body.port_id || 1,
        title: title.trim(),
        message: message.trim(),
        severity: severity || "MEDIUM",
        category: category || "HIGH CONGESTION WARNING",
        is_read: false,
      })
      .returning();

    return Response.json(newAlert, { status: 201 });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to create alert" }, { status: 500 });
  }
}
