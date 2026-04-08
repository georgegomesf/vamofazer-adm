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

    // 1. Get all groups the user is part of (any role)
    const memberships = await prisma.groupMembership.findMany({
      where: {
        userId,
        Group: { projectId },
        status: "ACTIVE"
      },
      select: {
        groupId: true,
        createdAt: true,
        Group: {
          select: {
            id: true,
            name: true,
            description: true,
            isVisible: true,
            logoUrl: true,
            backgroundUrl: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const userGroupIds = memberships.map(m => m.groupId);

    // 2. Fetch up to 3 most recent VISIBLE groups
    const recentGroups = memberships
      .filter(m => m.Group.isVisible)
      .slice(0, 3)
      .map(m => m.Group);

    const now = new Date();

    // 3. Fetch up to 3 current or next actions
    const actions = await prisma.action.findMany({
      where: {
        projectId,
        publishedAt: { lte: now, not: null },
        AND: [
          {
            OR: [
              { onlyMembers: false }, // Visível para qualquer usuário do projeto
              { 
                ActionGroup: {
                  some: {
                    groupId: { in: userGroupIds }
                  }
                }
              } // Visível apenas para membros dos grupos vinculados
            ],
          },
          {
            OR: [
              { endDate: { gte: now } },
              { endDate: null, startDate: { gte: now } },
              { endDate: null, startDate: null } // Ações sem data definida também aparecem no dashboard
            ]
          }
        ]
      },
      include: {
        ActionGroup: {
          include: { Group: true }
        }
      },
      orderBy: { startDate: "asc" },
      take: 3
    });

    return NextResponse.json(
      { actions, groups: recentGroups },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
