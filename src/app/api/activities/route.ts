import { NextResponse } from "next/server";
import { getActivities } from "@/actions/activities";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const activityId = searchParams.get("activityId") || undefined;

    const userId = searchParams.get("userId") || undefined;
    let publicOnly = searchParams.get("publicOnly") === "true";

    // Segurança: Somente Admins podem ver atividades não-públicas (rascunhos)
    const session = await auth();
    const user = session?.user as any;
    const isAdmin = user?.role === "ADMIN" || user?.projectRole === "admin";
    
    if (!isAdmin) {
      publicOnly = true;
    }

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400, headers: corsHeaders });
    }

    const activities = await getActivities(projectId, limit, page, userId, publicOnly, activityId);
    return NextResponse.json({ activities }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
