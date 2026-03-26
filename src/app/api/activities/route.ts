import { NextResponse } from "next/server";
import { getActivities } from "@/actions/activities";

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

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400, headers: corsHeaders });
    }

    const activities = await getActivities(projectId, limit, page);
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
