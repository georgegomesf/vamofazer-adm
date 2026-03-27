import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const actions = await prisma.action.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        posts: {
          some: {
            post: {
              publishedAt: {
                not: null,
                lte: new Date(),
              },
            },
          },
        },
      },
      include: {
        posts: {
          include: {
            post: {
              include: {
                actions: {
                  include: {
                    action: true
                  }
                }
              }
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { actions },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch actions" }, { status: 500 });
  }
}
