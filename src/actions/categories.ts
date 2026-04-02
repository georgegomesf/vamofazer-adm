"use server";

import { prisma } from "@/lib/prisma";
import { deleteImage } from "./upload";
import { revalidatePath } from "next/cache";
import { getWallClockNow } from "@/lib/date-utils";

export async function getCategories(projectId: string) {
  try {
    const categories = await prisma.category.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function createCategory(projectId: string, data: any) {
  try {
    const { 
      title, slug, description, imageUrl, isVisible, type, 
      viewType, dominantType, dateFormat 
    } = data;

    const category = await prisma.category.create({
      data: {
        title,
        slug,
        description,
        imageUrl,
        isVisible: isVisible ?? true,
        type: type ?? "Postagens",
        viewType: viewType ?? "grid",
        dominantType: dominantType ?? "DEFAULT",
        dateFormat: dateFormat ?? "DEFAULT",
        projectId,
        createdAt: getWallClockNow(),
        updatedAt: getWallClockNow(),
      },
    });
    revalidatePath("/adm/categories");
    return { success: true, category };
  } catch (error: any) {
    console.error("Error creating category:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCategory(id: string, data: any) {
  try {
    const { 
      title, slug, description, imageUrl, isVisible, type, 
      viewType, dominantType, dateFormat 
    } = data;

    const category = await prisma.category.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        imageUrl,
        isVisible,
        type,
        viewType,
        dominantType,
        dateFormat,
        updatedAt: getWallClockNow(),
      },
    });
    revalidatePath("/adm/categories");
    return { success: true, category };
  } catch (error: any) {
    console.error("Error updating category:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(id: string) {
  try {
    const category = await prisma.category.findUnique({ where: { id } });
    if (category?.imageUrl && category.imageUrl.includes("blob.vercel-storage.com")) {
      await deleteImage(category.imageUrl);
    }
    await prisma.category.delete({
      where: { id },
    });
    revalidatePath("/adm/categories");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
