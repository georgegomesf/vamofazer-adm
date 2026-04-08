import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Get action details with plugins and linked groups
    const action = await prisma.action.findUnique({
      where: { id },
      include: {
        ActionPlugin: {
          include: { Plugin: true }
        },
        ActionGroup: {
          include: { 
            Group: {
              include: {
                GroupMembership: {
                  where: { status: "ACTIVE" },
                  include: { User: true }
                }
              }
            }
          }
        }
      }
    });

    if (!action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    // 2. Identify User Role in the Action
    // Roles: OWNER, ORGANIZER, MEMBER, GUEST
    let role = "GUEST";
    
    // Check project admin role
    const userProject = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId: action.projectId } }
    });
    
    if (userProject?.role === "ADMIN") {
      role = "OWNER"; // Project admins are owners of all actions
    } else {
      // Check group-based roles
      for (const ag of action.ActionGroup) {
        const membership = ag.Group.GroupMembership.find(m => m.userId === userId);
        if (membership) {
          if (role === "GUEST" || (membership.role === "OWNER" && role !== "OWNER") || (membership.role === "ORGANIZER" && role === "MEMBER")) {
             // Promote role if higher found
             if (membership.role === "OWNER") role = "OWNER";
             else if (membership.role === "ORGANIZER") role = "ORGANIZER";
             else if (role === "GUEST") role = "MEMBER";
          }
        }
      }
    }

    // 3. Permission check: can the user even see this?
    if (action.onlyMembers && role === "GUEST") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 4. If admin (OWNER/ORGANIZER), include detailed participant list
    let participants: any[] = [];
    if (role === "OWNER" || role === "ORGANIZER") {
      const participantMap = new Map();
      action.ActionGroup.forEach(ag => {
        ag.Group.GroupMembership.forEach(m => {
          if (!participantMap.has(m.userId) && m.User) {
            participantMap.set(m.userId, {
              id: m.userId,
              name: m.User.name,
              email: m.User.email,
              image: m.User.image,
              role: m.role,
              groupId: ag.groupId,
              groupName: ag.Group.name
            });
          }
        });
      });
      participants = Array.from(participantMap.values());
    } else if (role === "MEMBER") {
       // Members can see others but maybe fewer details? User requested participant list.
       // For now, let's include for members too if they are part of it.
       const participantMap = new Map();
       action.ActionGroup.forEach(ag => {
         ag.Group.GroupMembership.forEach(m => {
           if (!participantMap.has(m.userId) && m.User) {
             participantMap.set(m.userId, {
               id: m.userId,
               name: m.User.name,
               image: m.User.image,
               role: m.role,
               groupName: ag.Group.name
             });
           }
         });
       });
       participants = Array.from(participantMap.values());
    }

    return NextResponse.json(
      { 
        action, 
        role, 
        participants,
        plugins: action.ActionPlugin.map(ap => ap.Plugin)
      },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("Action Detail API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, ...data } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Check if user has permission
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

    if (!action) {
       return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    // Check project admin role
    const userProject = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId: action.projectId } }
    });

    let canEdit = userProject?.role === "ADMIN";
    
    if (!canEdit) {
       for (const ag of action.ActionGroup) {
         const m = ag.Group.GroupMembership[0]; // We filtered by userId in reach
         if (m && (m.role === "OWNER" || m.role === "ORGANIZER")) {
           canEdit = true;
           break;
         }
       }
    }

    if (!canEdit) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 2. Perform Update
    const updatedAction = await prisma.action.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        backgroundUrl: data.backgroundUrl,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(
      { success: true, action: updatedAction },
      { 
        headers: { 
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        } 
      }
    );
  } catch (error) {
    console.error("Action Update API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
