import { runSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await runSeed();
    return Response.json({ message: "Database re-seeded successfully with 28+ vessels, 10 berths, 16 cranes, 5 yards, predictions, alerts, and 72-hour plans!" });
  } catch (error: any) {
    console.error("Seed error:", error);
    return Response.json({ message: error.message || "Failed to seed database" }, { status: 500 });
  }
}
