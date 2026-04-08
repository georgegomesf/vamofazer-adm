"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PluginType, PluginCategory } from "@prisma/client";

export async function getPlugins() {
  try {
    const plugins = await prisma.plugin.findMany({
      orderBy: { createdAt: "desc" },
    });
    return plugins;
  } catch (error) {
    console.error("Error fetching plugins:", error);
    return [];
  }
}

export async function getPluginById(id: string) {
  try {
    const plugin = await prisma.plugin.findUnique({
      where: { id },
    });
    return plugin;
  } catch (error) {
    console.error("Error fetching plugin by id:", error);
    return null;
  }
}

export async function createPlugin(data: {
  name: string;
  description?: string;
  type: PluginType;
  category: PluginCategory;
  imageUrl?: string;
  available: boolean;
}) {
  try {
    const plugin = await prisma.plugin.create({
      data,
    });
    revalidatePath("/adm/plugins");
    return { success: true, plugin };
  } catch (error: any) {
    console.error("Error creating plugin:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePlugin(
  id: string,
  data: {
    name?: string;
    description?: string;
    type?: PluginType;
    category?: PluginCategory;
    imageUrl?: string;
    available?: boolean;
  }
) {
  try {
    const plugin = await prisma.plugin.update({
      where: { id },
      data,
    });
    revalidatePath("/adm/plugins");
    return { success: true, plugin };
  } catch (error: any) {
    console.error("Error updating plugin:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePlugin(id: string) {
  try {
    await prisma.plugin.delete({
      where: { id },
    });
    revalidatePath("/adm/plugins");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting plugin:", error);
    return { success: false, error: error.message };
  }
}
