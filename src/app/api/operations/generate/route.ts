import { OperationPlannerService } from "@/lib/services/operationPlannerService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const portId = body.portId || 1;
    const generated = await OperationPlannerService.generate72HourPlan(portId);
    return Response.json({
      message: "Successfully generated 72-hour integrated operations plan",
      items: generated,
    });
  } catch (error: any) {
    console.error("POST /api/operations/generate error:", error);
    return Response.json({ message: error.message || "Failed to generate plan" }, { status: 500 });
  }
}
