import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 1. Invitation by ID
    let invitation = await prisma.invitation.findUnique({
      where: { id },
      include: { Group: true }
    });

    // 2. Invitation by Code
    if (!invitation) {
        invitation = await prisma.invitation.findFirst({
            where: { code: id.toUpperCase() },
            include: { Group: true }
        });
    }

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (invitation) {
      if (invitation.isUsed) {
        return NextResponse.json({ error: "Este convite já foi processado e não pode ser utilizado novamente" }, { status: 400, headers });
      }
      if (invitation.expiresAt && invitation.expiresAt < new Date()) {
        return NextResponse.json({ error: "Este convite expirou" }, { status: 410, headers });
      }
      return NextResponse.json({ type: 'INVITATION', invitation }, { headers });
    }

    // 3. Membership by ID
    let membership = await prisma.groupMembership.findUnique({
        where: { id },
        include: { Group: true }
    });

    // 4. Membership by Code
    if (!membership) {
        membership = await prisma.groupMembership.findFirst({
            where: { confirmationCode: id.toUpperCase() },
            include: { Group: true }
        });
    }

    if (membership) {
        if (membership.isConfirmed) {
            return NextResponse.json({ error: "Sua participação já está confirmada" }, { status: 400, headers });
        }
        return NextResponse.json({ 
            type: 'MEMBERSHIP',
            invitation: {
                id: membership.id,
                groupId: membership.groupId,
                type: 'INDIVIDUAL',
                Group: membership.Group,
                targetNames: JSON.stringify([membership.name || membership.email])
            }
        }, { headers });
    }

    return NextResponse.json({ error: "Convite não encontrado ou ID inválido" }, { status: 404, headers });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar convite" }, { status: 500 });
  }
}

export async function OPTIONS() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}
