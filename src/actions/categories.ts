"use server";

import { prisma } from "@/lib/prisma";
import { deleteImage } from "./upload";

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

export async function createCategory(projectId: string, data: { title: string; slug: string; description?: string; imageUrl?: string }) {
  try {
    const category = await prisma.category.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        projectId,
      },
    });
    return { success: true, category };
  } catch (error: any) {
    console.error("Error creating category:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCategory(id: string, data: { title: string; slug: string; description?: string; imageUrl?: string }) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    });
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
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
