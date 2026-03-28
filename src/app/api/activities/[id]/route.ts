import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400, headers: corsHeaders });
    }

    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404, headers: corsHeaders });
    }

    if (userId && activity.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403, headers: corsHeaders });
    }

    await prisma.activity.delete({
      where: { id },
    });

    // Notify all connected clients in real-time
    if (process.env.PUSHER_SECRET) {
      try {
        await pusherServer.trigger(
          `project-${activity.projectId}`,
          "activity-deleted",
          { id }
        );
      } catch (err) {
        console.error("Pusher trigger error on delete:", err);
      }
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete activity" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
