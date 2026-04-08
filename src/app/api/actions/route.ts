import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const now = new Date();
    const actions = await prisma.action.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        publishedAt: { lte: now, not: null },
        onlyMembers: false,
      },
      include: {
        ActionGroup: {
          include: { Group: true }
        }
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
