import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "ProjectId is required" }, { status: 400, headers: corsHeaders });
    }

    const mainMenu = await prisma.mainMenu.findFirst({
      where: { projectId },
    });

    if (!mainMenu) {
      return NextResponse.json({ items: [] }, { headers: corsHeaders });
    }

    const items = await prisma.menuItem.findMany({
      where: {
        AND: [
          { menuId: mainMenu.id },
          {
            OR: [
              { postId: null },
              { 
                post: {
                  publishedAt: {
                    not: null,
                    lte: new Date(),
                  }
                }
              }
            ]
          },
          {
            OR: [
              { categoryId: null },
              {
                category: {
                  isVisible: true
                }
              }
            ]
          }
        ]
      },
      orderBy: { order: "asc" },
      include: {
        category: true,
        post: {
          include: {
            categories: { include: { category: true } },
            tags: { include: { tag: true } }
          }
        },
      }
    });

    return NextResponse.json({ items }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
