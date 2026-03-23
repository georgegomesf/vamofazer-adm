"use server";

import { prisma } from "@/lib/prisma";

export async function getMenuItems(projectId: string) {
  try {
    let mainMenu = await prisma.mainMenu.findFirst({
      where: { projectId },
    });

    if (!mainMenu) {
      mainMenu = await prisma.mainMenu.create({
        data: {
          title: "Menu Principal",
          projectId,
        },
      });
    }

    const items = await prisma.menuItem.findMany({
      where: { menuId: mainMenu.id },
      orderBy: { order: "asc" },
      include: {
        category: true,
        post: true,
      }
    });

    return items;
  } catch (error) {
    console.error("Error fetching menus:", error);
    return [];
  }
}

export async function createMenuItem(projectId: string, data: any) {
  try {
    let mainMenu = await prisma.mainMenu.findFirst({
      where: { projectId },
    });

    if (!mainMenu) {
      mainMenu = await prisma.mainMenu.create({
        data: {
          title: "Menu Principal",
          projectId,
        },
      });
    }

    const item = await prisma.menuItem.create({
      data: {
        ...data,
        menuId: mainMenu.id,
      },
    });
    return { success: true, item };
  } catch (error: any) {
    console.error("Error creating menu item:", error);
    return { success: false, error: error.message };
  }
}

export async function updateMenuItem(id: string, data: any) {
  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data,
    });
    return { success: true, item };
  } catch (error: any) {
    console.error("Error updating menu item:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteMenuItem(id: string) {
  try {
    await prisma.menuItem.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reorderMenuItems(items: { id: string; order: number }[]) {
  try {
    await prisma.$transaction(
      items.map((item) =>
        prisma.menuItem.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error reordering menu items:", error);
    return { success: false, error: error.message };
  }
}
