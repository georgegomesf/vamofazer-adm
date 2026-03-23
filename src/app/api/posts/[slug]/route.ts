import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const post = await prisma.post.findFirst({
      where: {
        slug,
        ...(projectId ? { projectId } : {}),
        publishedAt: {
          not: null,
          lte: new Date(),
        },
      },
      include: {
        categories: {
          include: { category: true },
          where: {
            category: {
              isVisible: true,
            }
          }
        },
        tags: { include: { tag: true } },
        actions: { include: { action: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(
      { post },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("Single post fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}
