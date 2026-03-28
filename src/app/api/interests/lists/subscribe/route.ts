import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const listId = searchParams.get("listId");

    if (!userId || !listId) {
      return NextResponse.json({ subscribed: false }, { headers: corsHeaders });
    }

    const existing = await prisma.listSubscription.findUnique({
      where: {
        userId_listId: { userId, listId }
      }
    });

    return NextResponse.json({ subscribed: !!existing }, { headers: corsHeaders });
  } catch (error) {
    console.error("Subscription Status Error:", error);
    return NextResponse.json({ subscribed: false }, { headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, listId } = body;

    if (!userId || !listId) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400, headers: corsHeaders });
    }

    const existing = await prisma.listSubscription.findUnique({
      where: {
        userId_listId: { userId, listId }
      }
    });

    if (existing) {
      await prisma.listSubscription.delete({ where: { id: existing.id } });
      return NextResponse.json({ subscribed: false }, { headers: corsHeaders });
    } else {
      await prisma.listSubscription.create({ data: { userId, listId } });
      return NextResponse.json({ subscribed: true }, { headers: corsHeaders });
    }
  } catch (error) {
    console.error("Subscription Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
  }
}
