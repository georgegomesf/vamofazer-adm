"use server";

import { prisma } from "@/lib/prisma";
import { getAttachmentTypeFromUrl } from "@/lib/attachment-utils";
import { revalidatePath } from "next/cache";

export async function getAttachments(projectId: string) {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return attachments;
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return [];
  }
}

export async function getAttachmentById(id: string) {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });
    return attachment;
  } catch (error) {
    console.error("Error fetching attachment by id:", error);
    return null;
  }
}

export async function createAttachment(projectId: string, data: any) {
  console.log("Server: Creating attachment...", { projectId, data });
  try {
    const type = getAttachmentTypeFromUrl(data.url);
    console.log("Server: Detected type:", type);
    const attachment = await prisma.attachment.create({
      data: {
        ...data,
        type,
        projectId,
      },
    });
    console.log("Server: Attachment created successfully:", attachment);
    revalidatePath("/adm/attachments");
    return { success: true, attachment };
  } catch (error: any) {
    console.error("Server: Error creating attachment:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAttachment(id: string, data: any) {
  try {
    const type = getAttachmentTypeFromUrl(data.url);
    const attachment = await prisma.attachment.update({
      where: { id },
      data: {
        ...data,
        type,
      },
    });
    revalidatePath("/adm/attachments");
    return { success: true, attachment };
  } catch (error: any) {
    console.error("Error updating attachment:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAttachment(id: string) {
  try {
    await prisma.attachment.delete({
      where: { id },
    });
    revalidatePath("/adm/attachments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
