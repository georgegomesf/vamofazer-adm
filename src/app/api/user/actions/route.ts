import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");

    if (!userId || !projectId) {
      return NextResponse.json({ error: "Missing userId or projectId" }, { status: 400 });
    }

    // 1. Get user group IDs
    const memberships = await prisma.groupMembership.findMany({
      where: {
        userId,
        Group: { projectId },
        status: "ACTIVE"
      },
      select: { groupId: true }
    });

    const userGroupIds = memberships.map(m => m.groupId);

    // 2. Fetch all current/next actions
    const now = new Date();
    const actions = await prisma.action.findMany({
      where: {
        projectId,
        AND: [
          { publishedAt: { lte: now, not: null } },
          {
            OR: [
                { onlyMembers: false },
                { ActionGroup: { some: { groupId: { in: userGroupIds } } } }
            ]
          }
        ]
      },
      include: {
        ActionGroup: {
          include: { Group: true }
        }
      },
      orderBy: { startDate: "asc" }
    });

    return NextResponse.json(
      { actions },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("User Actions API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
