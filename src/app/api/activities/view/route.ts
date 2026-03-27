import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(request: Request) {
  try {
    const { activityId, userId } = await request.json();

    if (!activityId || !userId) {
      return NextResponse.json({ error: "activityId and userId are required" }, { status: 400, headers: corsHeaders });
    }

    // Upsert to ensure we don't have duplicates and don't fail if already viewed
    await prisma.activityView.upsert({
      where: {
        userId_activityId: {
          userId,
          activityId
        }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        userId,
        activityId
      }
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error recording activity view:", error);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
