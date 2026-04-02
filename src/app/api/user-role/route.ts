import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");

    if (!userId || !projectId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400, headers: corsHeaders });
    }

    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404, headers: corsHeaders });
    }

    // Se for admin global
    if (user.role === "ADMIN") {
        return NextResponse.json({ role: "admin", globalAdmin: true }, { headers: corsHeaders });
    }

    const userProject = await prisma.userProject.findFirst({
        where: { userId, projectId }
    });

    return NextResponse.json({ role: userProject?.role || "visitor" }, { headers: corsHeaders });
    
  } catch (error) {
    console.error("Error fetching user role API:", error);
    return NextResponse.json({ error: "Failed to fetch user role" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
