"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getActions(projectId: string) {
  try {
    const actions = await prisma.action.findMany({
      where: { projectId },
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
      include: {
        ActionGroup: {
          include: { Group: true }
        }
      }
    });
    return action;
  } catch (error) {
    console.error("Error fetching action by id:", error);
    return null;
  }
}

export async function createAction(projectId: string, data: any) {
  try {
    const { groups, ...actionData } = data;
    const action = await prisma.action.create({
      data: {
        ...actionData,
        projectId,
        id: Math.random().toString(36).substring(2, 11),
        startDate: actionData.startDate ? new Date(actionData.startDate) : null,
        endDate: actionData.endDate ? new Date(actionData.endDate) : null,
        updatedAt: new Date(),
        ActionGroup: groups ? {
          create: groups.map((groupId: string) => ({ groupId }))
        } : undefined
      },
    });
    revalidatePath("/adm/actions");
    return { success: true, action };
  } catch (error: any) {
    console.error("Server: Error creating action:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAction(id: string, data: any) {
  try {
    const { groups, ...actionData } = data;
    
    if (groups !== undefined) {
      await prisma.actionGroup.deleteMany({ where: { actionId: id } });
      if (groups.length > 0) {
          await prisma.actionGroup.createMany({
            data: groups.map((groupId: string) => ({ actionId: id, groupId }))
          });
      }
    }

    const action = await prisma.action.update({
      where: { id },
      data: {
        ...actionData,
        startDate: actionData.startDate ? new Date(actionData.startDate) : null,
        endDate: actionData.endDate ? new Date(actionData.endDate) : null,
        updatedAt: new Date(),
      },
    });
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
