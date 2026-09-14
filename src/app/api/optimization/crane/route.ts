import { CraneOptimizationService } from "@/lib/services/craneOptimizationService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vesselId, action, craneIds } = body;

    if (action === "apply") {
      if (!vesselId || !Array.isArray(craneIds) || craneIds.length === 0) {
        return Response.json({ message: "vesselId and craneIds array are required to apply crane allocation" }, { status: 400 });
      }
      const applied = await CraneOptimizationService.applyAllocation(Number(vesselId), craneIds.map(Number));
      return Response.json(applied);
    }

    if (!vesselId) {
      return Response.json({ message: "vesselId is required for crane optimization" }, { status: 400 });
    }

    const result = await CraneOptimizationService.optimizeForVessel(Number(vesselId));
    return Response.json(result);
  } catch (error: any) {
    console.error("POST /api/optimization/crane error:", error);
    return Response.json({ message: error.message || "Crane optimization failed" }, { status: 500 });
  }
}
