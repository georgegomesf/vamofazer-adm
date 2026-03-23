import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || process.env.NEXT_PUBLIC_PROJECT_ID;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const categoryTitle = searchParams.get("categoryTitle");

    const posts = await prisma.post.findMany({
      where: { 
        projectId,
        publishedAt: {
          not: null,
          lte: new Date(),
        },
        ...(categoryTitle ? {
          categories: {
            some: {
              category: {
                title: categoryTitle,
              }
            }
          }
        } : {}),
      },
      take: 10,
      include: {
        categories: {
          include: { category: true }
        },
        actions: {
          include: {
            action: true
          }
        }
      },
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json(
      { posts },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch latest posts" }, { status: 500 });
  }
}
