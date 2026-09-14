import { RoutingService } from "@/lib/services/routingService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const recommendations = await RoutingService.analyzeAndRecommend();
    return Response.json(recommendations);
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to analyze routing" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, vesselId, targetBerthId, recId } = body;

    if (action === "apply") {
      if (!vesselId || !targetBerthId) {
        return Response.json({ message: "vesselId and targetBerthId are required to apply rerouting" }, { status: 400 });
      }
      const applied = await RoutingService.executeReroute(Number(vesselId), Number(targetBerthId), recId ? Number(recId) : undefined);
      return Response.json(applied);
    }

    const recommendations = await RoutingService.analyzeAndRecommend();
    return Response.json(recommendations);
  } catch (error: any) {
    console.error("POST /api/optimization/routing error:", error);
    return Response.json({ message: error.message || "Routing optimization failed" }, { status: 500 });
  }
}
