import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sendConfirmationCodesEmail } from "@/actions/groups";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invitationId } = await params;
  try {
    const { userId, namesFromCollective, wantsNews, confirmationEmail } = await request.json();

    let invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { Group: true }
    });

    let membershipByLink = null;
    if (!invitation) {
        // Try GroupMembership link
        membershipByLink = await prisma.groupMembership.findUnique({
            where: { id: invitationId },
            include: { Group: true }
        });

        if (!membershipByLink) {
            return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
        }
    }

    // Block new uses if already used
    if (invitation && invitation.isUsed) {
        return NextResponse.json({ error: "Este convite já foi processado" }, { status: 400 });
    }

    const memberships = [];

    // Process Invitation Type
    if (invitation) {
        // Mark as used immediately to block concurrent or subsequent attempts
        await prisma.invitation.update({
            where: { id: invitationId },
            data: { isUsed: true }
        });

        if (invitation.maxUses && invitation.currentUses >= invitation.maxUses) {
            return NextResponse.json({ error: "Limite de usos do convite atingido" }, { status: 400 });
        }

        if (invitation.type === 'INDIVIDUAL') {
            const existing = await prisma.groupMembership.findFirst({
                where: {
                    groupId: invitation.groupId,
                    userId: userId
                }
            });

            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            let m;

            if (existing) {
                m = await prisma.groupMembership.update({
                    where: { id: existing.id },
                    data: {
                        status: "ACTIVE",
                        isConfirmed: true,
                        confirmedAt: new Date(),
                        additionMethod: "INVITE",
                        confirmationCode: invitation.code || code,
                        updatedAt: new Date()
                    }
                });
            } else {
                m = await prisma.groupMembership.create({
                    data: {
                        id: Math.random().toString(36).substring(2, 11),
                        groupId: invitation.groupId,
                        userId: userId,
                        status: "ACTIVE",
                        isConfirmed: true,
                        confirmedAt: new Date(),
                        additionMethod: "INVITE",
                        confirmationCode: invitation.code || code,
                        updatedAt: new Date()
                    }
                });
            }
            memberships.push(m);

            await prisma.invitation.update({
                where: { id: invitationId },
                data: { currentUses: { increment: 1 } }
            });
        } else if (invitation.type === 'COLLECTIVE' && namesFromCollective) {
            const names = Array.isArray(namesFromCollective) ? namesFromCollective : [namesFromCollective];
            for (const name of names) {
                const exists = await prisma.groupMembership.findFirst({
                    where: {
                        groupId: invitation.groupId,
                        name: name,
                        status: 'ACTIVE'
                    }
                });

                if (!exists) {
                    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const m = await prisma.groupMembership.create({
                        data: {
                            id: Math.random().toString(36).substring(2, 11),
                            groupId: invitation.groupId,
                            name: name,
                            status: "ACTIVE",
                            isConfirmed: true,
                            confirmedAt: new Date(),
                            additionMethod: "INVITE",
                            confirmationCode: code,
                            updatedAt: new Date()
                        }
                    });
                    memberships.push(m);
                } else {
                    memberships.push(exists);
                }
            }

            await prisma.invitation.update({
                where: { id: invitationId },
                data: { currentUses: { increment: names.length } }
            });
        }

        // Send confirmation email if provided
        if (confirmationEmail && memberships.length > 0) {
            await sendConfirmationCodesEmail(confirmationEmail, invitation.Group.name, memberships);
        }

        revalidatePath(`/adm/groups/${invitation.groupId}/manage`);
    } 
    // Process Direct Membership Link
    else if (membershipByLink) {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const m = await prisma.groupMembership.update({
            where: { id: membershipByLink.id },
            data: {
                userId: userId,
                status: "ACTIVE",
                isConfirmed: true,
                confirmedAt: new Date(),
                confirmationCode: membershipByLink.confirmationCode || code,
                updatedAt: new Date()
            }
        });
        memberships.push(m);

        if (confirmationEmail) {
            await sendConfirmationCodesEmail(confirmationEmail, membershipByLink.Group.name, memberships);
        }

        revalidatePath(`/adm/groups/${membershipByLink.groupId}/manage`);
    }

    return NextResponse.json({ success: true, memberships }, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });

  } catch (error) {
    console.error("Error confirming participation:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
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
