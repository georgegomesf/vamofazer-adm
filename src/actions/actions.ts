"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getActions(projectId: string) {
  try {
    const actions = await prisma.action.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return actions;
  } catch (error) {
    console.error("Error fetching actions:", error);
    return [];
  }
}

export async function getActionById(id: string) {
  try {
    const action = await prisma.action.findUnique({
      where: { id },
    });
    return action;
  } catch (error) {
    console.error("Error fetching action by id:", error);
    return null;
  }
}

export async function createAction(projectId: string, data: any) {
  console.log("Server: Creating action...", { projectId, data });
  try {
    const action = await prisma.action.create({
      data: {
        ...data,
        projectId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    console.log("Server: Action created successfully:", action.id);
    revalidatePath("/adm/actions");
    return { success: true, action };
  } catch (error: any) {
    console.error("Server: Error creating action:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAction(id: string, data: any) {
  console.log("Server: Updating action...", id);
  try {
    const action = await prisma.action.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    console.log("Server: Action updated successfully:", action.id);
    revalidatePath("/adm/actions");
    return { success: true, action };
  } catch (error: any) {
    console.error("Server: Error updating action:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAction(id: string) {
  try {
    await prisma.action.delete({
      where: { id },
    });
    revalidatePath("/adm/actions");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting action:", error);
    return { success: false, error: error.message };
  }
}
