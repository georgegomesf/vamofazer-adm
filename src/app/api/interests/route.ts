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
      return NextResponse.json({ error: "userId and projectId are required" }, { status: 400, headers: corsHeaders });
    }

    const listId = searchParams.get("listId");

    const where: any = { userId, projectId };
    if (listId) {
      where.listId = listId;
    }

    const interests = await prisma.userInterest.findMany({
      where,
      include: {
        list: true,
        post: {
          include: {
            categories: { 
              include: { category: true },
              where: { category: { isVisible: true } }
            },
            actions: { include: { action: true } },
            tags: { include: { tag: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const items = interests.map((interest: any) => {
        const post = interest.post;
        if (!post) return null;
        
        const mainEventAction = post.actions.find((act: any) => act.action.type === "Evento")?.action;

        return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            summary: post.summary,
            imageUrl: post.imageUrl,
            img: post.imageUrl || "", 
            imgs: {
                thumbnails: [post.imageUrl || ""],
                previews: [post.imageUrl || ""]
            },
            date: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "",
            eventDate: mainEventAction?.startDate,
            eventEndDate: mainEventAction?.endDate,
            hasEvent: !!mainEventAction,
            listId: interest.listId,
            listName: interest.list?.name || "Minha Lista",
            quantity: 1,
            post: post 
        };
    }).filter(Boolean);

    return NextResponse.json({ interests: items }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch interests" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, postId, projectId } = body;
    let { listId } = body;

    if (!userId || !postId || !projectId) {
      return NextResponse.json({ error: "userId, postId and projectId are required" }, { status: 400, headers: corsHeaders });
    }

    if (!listId) {
      const defaultList = await prisma.interestList.upsert({
        where: { userId_name_projectId: { userId, projectId, name: "Minha Lista" } },
        update: {},
        create: { userId, projectId, name: "Minha Lista" }
      });
      listId = defaultList.id;
    }

    const where = { userId_postId_listId: { userId, postId, listId } };
    const existingInterest = await prisma.userInterest.findUnique({ where });

    if (existingInterest) {
      await prisma.userInterest.delete({ where });
      return NextResponse.json({ action: "removed", message: "Interesse removido com sucesso" }, { headers: corsHeaders });
    } else {
      await prisma.userInterest.create({ data: { userId, postId, projectId, listId } });
      return NextResponse.json({ action: "added", message: "Interesse adicionado com sucesso" }, { headers: corsHeaders });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process interest" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
