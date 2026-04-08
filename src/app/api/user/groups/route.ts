import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");

    if (!userId || !projectId) {
      return NextResponse.json({ error: "Missing userId or projectId" }, { status: 400 });
    }

    const memberships = await prisma.groupMembership.findMany({
      where: {
        userId,
        Group: { projectId },
        status: "ACTIVE"
      },
      include: {
        Group: true
      },
      orderBy: { createdAt: "desc" }
    });

    const groups = memberships.map(m => m.Group);

    return NextResponse.json(
      { groups },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("User Groups API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
