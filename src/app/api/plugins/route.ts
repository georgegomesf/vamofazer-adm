import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plugins = await prisma.plugin.findMany({
      where: { available: true },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(
      plugins,
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("Plugins API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
