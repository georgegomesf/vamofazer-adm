import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");

    if (!userId || !projectId) {
      return NextResponse.json({ error: "userId and projectId are required" }, { status: 400 });
    }

    const interests = await prisma.userInterest.findMany({
      where: { userId, projectId },
      include: {
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

    // Map to the format expected by the frontend cart/interest slice
    const items = interests.map((interest: any) => {
        const post = interest.post;
        const mainEventAction = post.actions.find((act: any) => act.action.type === "Evento")?.action;

        return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            imgs: {
                thumbnails: [post.imageUrl || ""],
                previews: [post.imageUrl || ""]
            },
            date: post.publishedAt?.toISOString(),
            eventDate: mainEventAction?.startDate?.toISOString(),
            eventEndDate: mainEventAction?.endDate?.toISOString(),
            hasEvent: !!mainEventAction,
            quantity: 1
        };
    });

    return NextResponse.json(
      { interests: items },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch interests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, postId, projectId } = body;
    console.log("API INTERESTS: POST request received", { userId, postId, projectId });

    if (!userId || !postId || !projectId) {
      console.warn("API INTERESTS: Missing required fields", { userId, postId, projectId });
      return NextResponse.json({ error: "userId, postId and projectId are required" }, { status: 400 });
    }

    const where = {
        userId_postId: { userId, postId }
    };

    const existingInterest = await prisma.userInterest.findUnique({
      where
    });

    if (existingInterest) {
      console.log("API INTERESTS: Removing existing interest", { userId, postId });
      await prisma.userInterest.delete({
        where
      });
      return NextResponse.json(
        { action: "removed", message: "Interesse removido com sucesso" },
        { headers: { "Access-Control-Allow-Origin": "*" } }
      );
    } else {
      console.log("API INTERESTS: Adding new interest", { userId, postId });
      await prisma.userInterest.create({
        data: { userId, postId, projectId }
      });
      return NextResponse.json(
        { action: "added", message: "Interesse adicionado com sucesso" },
        { headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }
  } catch (error) {
    console.error("API INTERESTS: Error processing POST", error);
    return NextResponse.json({ error: "Failed to process interest" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
