import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, pluginId, enable } = await request.json();

    if (!userId || !pluginId) {
      return NextResponse.json({ error: "Missing userId or pluginId" }, { status: 400 });
    }

    // 1. Check permissions (Dono/Organizador)
    const action = await prisma.action.findUnique({
      where: { id },
      include: {
        ActionGroup: {
          include: { 
            Group: {
              include: {
                GroupMembership: {
                  where: { userId, status: "ACTIVE" }
                }
              }
            }
          }
        }
      }
    });

    if (!action) return NextResponse.json({ error: "Action not found" }, { status: 404 });

    const userProject = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId: action.projectId } }
    });

    let canManage = userProject?.role === "ADMIN";
    if (!canManage) {
        for (const ag of action.ActionGroup) {
          const m = ag.Group.GroupMembership[0];
          if (m && (m.role === "OWNER" || m.role === "ORGANIZER")) {
            canManage = true;
            break;
          }
        }
    }

    if (!canManage) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // 2. Perform Toggle
    if (enable) {
      await prisma.actionPlugin.upsert({
        where: { actionId_pluginId: { actionId: id, pluginId } },
        update: {},
        create: { actionId: id, pluginId }
      });
    } else {
      await prisma.actionPlugin.deleteMany({
        where: { actionId: id, pluginId }
      });
    }

    return NextResponse.json(
      { success: true },
      { 
        headers: { 
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        } 
      }
    );
  } catch (error) {
    console.error("Action Plugin Toggle API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
