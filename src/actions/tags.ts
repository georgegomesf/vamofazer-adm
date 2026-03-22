"use server";

import { prisma } from "@/lib/prisma";

export async function getTags(projectId: string) {
  try {
    const tags = await prisma.tag.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { title: "asc" },
    });
    return tags;
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}

export async function createTag(projectId: string, data: { title: string; slug: string; }) {
  try {
    const tag = await prisma.tag.create({
      data: {
        title: data.title,
        slug: data.slug,
        projectId,
      },
    });
    return { success: true, tag };
  } catch (error: any) {
    console.error("Error creating tag:", error);
    return { success: false, error: error.message };
  }
}

export async function updateTag(id: string, data: { title: string; slug: string; }) {
  try {
    const tag = await prisma.tag.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
      },
    });
    return { success: true, tag };
  } catch (error: any) {
    console.error("Error updating tag:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteTag(id: string) {
  try {
    await prisma.tag.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
