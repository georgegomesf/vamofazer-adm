"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "contato@redefilosofica.com.br";
const WEB_SERVICE_URL = process.env.NEXT_PUBLIC_WEB_SERVICE_URL || "http://localhost:3000";

async function sendMemberInviteEmail(email: string, name: string, groupName: string, inviteId: string) {
  if (!BREVO_API_KEY) {
    console.warn("BREVO_API_KEY not found. Email not sent.");
    return;
  }
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "VamoFazer", email: EMAIL_FROM },
        to: [{ email, name }],
        subject: `Convite para o Grupo: ${groupName}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 24px;">
            <h2 style="color: #1a1a1a;">Olá, ${name}!</h2>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              Você foi convidado para ingressar no grupo <strong>${groupName}</strong> no portal VamoFazer.
            </p>
            <div style="margin: 32px 0;">
              <a href="${WEB_SERVICE_URL}/invite/${inviteId}" 
                 style="background-color: #3C50E0; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Confirmar Participação
              </a>
            </div>
            <p style="color: #888; font-size: 12px;">
              Se o botão acima não funcionar, copie e cole o link no seu navegador:<br>
              ${WEB_SERVICE_URL}/invite/${inviteId}
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API error:", errorData);
    }
  } catch (err) {
    console.error("Error sending email:", err);
  }
}

export async function getGroups(projectId: string) {
  try {
    return await prisma.group.findMany({
      where: { projectId },
      include: { _count: { select: { GroupMembership: true } }, Group: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return [];
  }
}

export async function getGroupById(id: string) {
  try {
    return await prisma.group.findUnique({
      where: { id },
      include: {
        GroupMembership: { include: { User: true } },
        Invitation: true,
        other_Group: true,
        Group: true,
      },
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    return null;
  }
}

export async function createGroup(projectId: string, data: any) {
  try {
    const group = await prisma.group.create({
      data: {
        ...data,
        projectId,
        id: Math.random().toString(36).substring(2, 11),
        updatedAt: new Date(),
      },
    });
    revalidatePath("/adm/groups");
    return { success: true, group };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateGroup(id: string, data: any) {
  try {
    const group = await prisma.group.update({ where: { id }, data });
    revalidatePath("/adm/groups");
    return { success: true, group };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteGroup(id: string) {
  try {
    await prisma.group.delete({ where: { id } });
    revalidatePath("/adm/groups");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addMemberDirect(groupId: string, userId: string) {
  try {
    const membership = await prisma.groupMembership.create({
      data: {
        id: Math.random().toString(36).substring(2, 11),
        groupId, userId,
        status: "ACTIVE",
        additionMethod: "DIRECT",
        isConfirmed: true,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    revalidatePath(`/adm/groups/${groupId}/manage`);
    return { success: true, membership };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function registerNewMember(groupId: string, data: { name: string; email: string }) {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    const inviteId = Math.random().toString(36).substring(2, 11);
    const invitation = await prisma.invitation.create({
      data: {
        id: inviteId,
        groupId,
        code,
        type: "INDIVIDUAL",
        confirmationType: "INDIVIDUAL",
        maxUses: 1,
      },
    });
    // Create pending membership
    const membership = await prisma.groupMembership.create({
      data: {
        id: Math.random().toString(36).substring(2, 11),
        groupId,
        name: data.name,
        email: data.email,
        status: "PENDING",
        additionMethod: "NEW_USER",
        confirmationCode: code,
        updatedAt: new Date(),
      },
    });
    if (group) {
      await sendMemberInviteEmail(data.email, data.name, group.name, inviteId);
    }
    revalidatePath(`/adm/groups/${groupId}/manage`);
    return { success: true, membership, inviteId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createInvitation(groupId: string, data: any) {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const invitation = await prisma.invitation.create({
      data: {
        ...data,
        id: Math.random().toString(36).substring(2, 11),
        groupId,
        code,
        targetNames: data.targetNames ? JSON.stringify(data.targetNames) : null,
      },
    });
    revalidatePath(`/adm/groups/${groupId}/manage`);
    return { success: true, invitation };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInvitation(id: string) {
  try {
    const invitation = await prisma.invitation.delete({ where: { id } });
    revalidatePath(`/adm/groups/${invitation.groupId}/manage`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reactivateInvitation(id: string) {
  try {
    const invitation = await prisma.invitation.update({
      where: { id },
      data: {
        currentUses: 0,
        isUsed: false
      }
    });
    revalidatePath(`/adm/groups/${invitation.groupId}/manage`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeMember(membershipId: string) {
  try {
    const membership = await prisma.groupMembership.delete({ where: { id: membershipId } });
    revalidatePath(`/adm/groups/${membership.groupId}/manage`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvitationNames(id: string, targetNames: string[]) {
  try {
    const invitation = await prisma.invitation.update({
      where: { id },
      data: {
        targetNames: JSON.stringify(targetNames),
        maxUses: targetNames.length > 0 ? targetNames.length : 1
      }
    });
    revalidatePath(`/adm/groups/${invitation.groupId}/manage`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
export async function sendConfirmationCodesEmail(email: string, groupName: string, memberships: any[]) {
  if (!BREVO_API_KEY) {
    console.warn("BREVO_API_KEY not found. Email not sent.");
    return;
  }
  try {
    const codesHtml = memberships.map(m => `
      <div style="padding: 12px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px;">
        <strong>${m.name || 'Código'}</strong>: <span style="font-family: monospace; font-size: 18px; color: #3C50E0;">${m.confirmationCode}</span>
      </div>
    `).join('');

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "VamoFazer", email: EMAIL_FROM },
        to: [{ email }],
        subject: `Comprovação de Participação: ${groupName}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 24px;">
            <h2 style="color: #1a1a1a;">A participação está confirmada!</h2>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              A participação em <strong>${groupName}</strong> foi confirmada!
            </p>
            <div style="margin: 24px 0;">
              ${codesHtml}
            </div>
            <p style="color: #888; font-size: 12px;">
              Guarde este email. O código de convite pode ser solicitado pelos organizadores.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API error:", errorData);
    }
  } catch (err) {
    console.error("Error sending confirmation email:", err);
  }
}
