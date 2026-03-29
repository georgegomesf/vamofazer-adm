"use server";

import { prisma } from "@/lib/prisma";
import { deleteImage } from "./upload";
import { revalidatePath } from "next/cache";

export async function getProject(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });
    return project;
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

export async function updateProject(id: string, data: any) {
  try {
    // 1. Get current project to check for images to delete
    const currentProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!currentProject) throw new Error("Project not found");

    // 2. Check for replaced images
    const imageFields = ['logoUrl', 'logoHorizontalUrl', 'coverUrl', 'backgroundUrl', 'defaultThumbUrl'];
    for (const field of imageFields) {
      if (data[field] !== undefined && data[field] !== currentProject[field as keyof typeof currentProject]) {
        const oldUrl = currentProject[field as keyof typeof currentProject] as string;
        if (oldUrl && oldUrl.includes("blob.vercel-storage.com")) {
          await deleteImage(oldUrl);
        }
      }
    }

    // 3. Update database
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        link: data.link,
        email: data.email,
        logoUrl: data.logoUrl,
        logoHorizontalUrl: data.logoHorizontalUrl,
        coverUrl: data.coverUrl,
        backgroundUrl: data.backgroundUrl,
        defaultThumbUrl: data.defaultThumbUrl,
        defaultEntryRole: data.defaultEntryRole,
        heroVisible: data.heroVisible,
        newArrivalsVisible: data.newArrivalsVisible,
        countdownVisible: data.countdownVisible,
        bestSellersVisible: data.bestSellersVisible,
        searchVisible: data.searchVisible,
        heroLabel: data.heroLabel,
        newArrivalsLabel: data.newArrivalsLabel,
        countdownLabel: data.countdownLabel,
        bestSellersLabel: data.bestSellersLabel,
        searchLabel: data.searchLabel,
        homeSectionOrder: data.homeSectionOrder,
      },
    });

    revalidatePath("/adm/projeto");
    revalidatePath("/");
    return { success: true, project };
  } catch (error: any) {
    console.error("Error updating project:", error);
    return { success: false, error: error.message };
  }
}
