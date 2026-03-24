"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAnpofEvents(projectId: string) {
  try {
    const events = await prisma.anpofEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return events;
  } catch (error) {
    console.error("Error fetching Anpof events:", error);
    return [];
  }
}

export async function toggleAnpofEventUsed(id: string, isUsed: boolean) {
  try {
    const event = await prisma.anpofEvent.update({
      where: { id },
      data: { isUsed },
    });
    revalidatePath("/adm/anpof");
    return { success: true, event };
  } catch (error) {
    console.error("Error toggling Anpof event used:", error);
    return { success: false, error: "Erro ao atualizar status." };
  }
}

export async function deleteAnpofEvent(id: string) {
  try {
    await prisma.anpofEvent.delete({
      where: { id },
    });
    revalidatePath("/adm/anpof");
    return { success: true };
  } catch (error) {
    console.error("Error deleting Anpof event:", error);
    return { success: false, error: "Erro ao excluir evento." };
  }
}
