import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Manage Participants (Role change or removal)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { requesterUserId, targetUserId, groupId, newRole } = await request.json();

    if (!requesterUserId || !targetUserId || !groupId || !newRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check requester permissions on the action/group
    const action = await prisma.action.findUnique({
      where: { id },
      include: {
        ActionGroup: {
          where: { groupId },
          include: { 
            Group: {
              include: {
                GroupMembership: {
                  where: { userId: requesterUserId, status: "ACTIVE" }
                }
              }
            }
          }
        }
      }
    });

    if (!action || action.ActionGroup.length === 0) return NextResponse.json({ error: "Action/Group not found" }, { status: 404 });

    const userProject = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId: requesterUserId, projectId: action.projectId } }
    });

    let canManage = userProject?.role === "ADMIN";
    if (!canManage) {
        const m = action.ActionGroup[0].Group.GroupMembership[0];
        if (m && (m.role === "OWNER" || m.role === "ORGANIZER")) {
           canManage = true;
        }
    }

    if (!canManage) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // 2. Perform Role Change
    const membership = await prisma.groupMembership.findFirst({
      where: { userId: targetUserId, groupId, status: "ACTIVE" }
    });

    if (!membership) return NextResponse.json({ error: "Membership not found" }, { status: 404 });

    await prisma.groupMembership.update({
      where: { id: membership.id },
      data: { role: newRole }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Participant Update API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const requesterUserId = searchParams.get("requesterUserId");
    const targetUserId = searchParams.get("targetUserId");
    const groupId = searchParams.get("groupId");

    if (!requesterUserId || !targetUserId || !groupId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Permission check...
    const action = await prisma.action.findUnique({
      where: { id },
      include: {
        ActionGroup: {
          where: { groupId },
          include: { 
            Group: {
              include: {
                GroupMembership: {
                  where: { userId: requesterUserId, status: "ACTIVE" }
                }
              }
            }
          }
        }
      }
    });

    if (!action || action.ActionGroup.length === 0) return NextResponse.json({ error: "Action/Group not found" }, { status: 404 });

    const userProject = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId: requesterUserId, projectId: action.projectId } }
    });

    let canManage = userProject?.role === "ADMIN";
    if (!canManage) {
        const m = action.ActionGroup[0].Group.GroupMembership[0];
        if (m && (m.role === "OWNER" || m.role === "ORGANIZER")) {
           canManage = true;
        }
    }

    if (!canManage) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // 3. Remove Participant
    const membership = await prisma.groupMembership.findFirst({
      where: { userId: targetUserId, groupId, status: "ACTIVE" }
    });

    if (membership) {
      await prisma.groupMembership.delete({
        where: { id: membership.id }
      });
    }

    return NextResponse.json(
      { success: true },
      { 
        headers: { 
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        } 
      }
    );
  } catch (error) {
    console.error("Participant Removal API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
