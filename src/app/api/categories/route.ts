import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const slug = searchParams.get("slug");

    const categories = await prisma.category.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(slug ? { slug } : {}),
        isVisible: true,
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json(
      { categories },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
