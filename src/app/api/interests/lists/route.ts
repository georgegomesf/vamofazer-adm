import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createActivity } from "@/actions/activities";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");

    if (id) {
      const list = await prisma.interestList.findUnique({
        where: { id },
        include: {
          _count: { select: { interests: true } },
          user: { select: { name: true, image: true } }
        }
      });

      if (!list) return NextResponse.json({ error: "List not found" }, { status: 404, headers: corsHeaders });
      if (!list.isPublic && (userId ? list.userId !== userId : true)) {
        if (!list.isPublic) return NextResponse.json({ error: "Private list" }, { status: 403, headers: corsHeaders });
      }

      return NextResponse.json({ list }, { headers: corsHeaders });
    }

    if (!userId || !projectId) {
      return NextResponse.json({ error: "userId and projectId are required" }, { status: 400, headers: corsHeaders });
    }

    const lists = await prisma.interestList.findMany({
      where: { userId, projectId },
      include: { _count: { select: { interests: true } } },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ lists }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch lists" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, projectId, name, description, isPublic } = body;

    if (!userId || !projectId || !name) {
      return NextResponse.json({ error: "userId, projectId and name are required" }, { status: 400, headers: corsHeaders });
    }

    const list = await prisma.interestList.create({
      data: { userId, projectId, name, description, isPublic: !!isPublic }
    });

    // Create Activity: Only if created as public
    if (list.isPublic) {
      await createActivity(projectId, {
        type: "LIST_CREATED",
        title: `${list.name}`,
        description: `${list.description ?? ''}`,
        url: `/l/${list.id}`,
        userId,
        metadata: { listId: list.id }
      });
    }

    return NextResponse.json({ list, message: "Lista criada com sucesso" }, { headers: corsHeaders });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Você já possui uma lista com este nome." }, { status: 400, headers: corsHeaders });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to create list" }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400, headers: corsHeaders });
    }

    await prisma.interestList.delete({ where: { id } });
    return NextResponse.json({ message: "Lista apagada com sucesso" }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete list" }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, isPublic } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400, headers: corsHeaders });
    }

    const data: any = {};
    if (typeof name === "string") data.name = name;
    if (typeof description === "string" || description === null) data.description = description;
    if (typeof isPublic === "boolean") data.isPublic = isPublic;

    const oldList = await prisma.interestList.findUnique({ where: { id } });
    const list = await prisma.interestList.update({ where: { id }, data });

    // Trigger activity only if it became public now
    if (list.isPublic && (!oldList || !oldList.isPublic)) {
      await createActivity(list.projectId, {
        type: "LIST_CREATED",
        title: `${list.name}`,
        description: `${list.description ?? ''}`,
        url: `/l/${list.id}`,
        userId: list.userId,
        metadata: { listId: list.id }
      });
    }

    return NextResponse.json({ list, message: "Lista atualizada com sucesso" }, { headers: corsHeaders });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Você já possui uma lista com este nome." }, { status: 400, headers: corsHeaders });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to update list" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
