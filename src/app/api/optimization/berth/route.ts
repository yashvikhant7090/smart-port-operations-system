import { BerthOptimizationService } from "@/lib/services/berthOptimizationService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vesselId, action, berthId } = body;

    if (action === "apply") {
      if (!vesselId || !berthId) {
        return Response.json({ message: "vesselId and berthId are required to apply berth assignment" }, { status: 400 });
      }
      const applied = await BerthOptimizationService.applyAssignment(Number(vesselId), Number(berthId));
      return Response.json(applied);
    }

    if (!vesselId) {
      return Response.json({ message: "vesselId is required for berth optimization" }, { status: 400 });
    }

    const result = await BerthOptimizationService.optimizeForVessel(Number(vesselId));
    return Response.json(result);
  } catch (error: any) {
    console.error("POST /api/optimization/berth error:", error);
    return Response.json({ message: error.message || "Berth optimization failed" }, { status: 500 });
  }
}
