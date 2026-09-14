import { getUserFromRequest } from "@/lib/services/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ message: "Unauthorized. Invalid or missing token." }, { status: 401 });
    }

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    return Response.json({ message: error.message || "Failed to fetch user" }, { status: 500 });
  }
}
