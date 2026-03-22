"use server";

import { prisma } from "@/lib/prisma";
import { deleteImage } from "./upload";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProfile(userId: string, data: any) {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) throw new Error("User not found");

    // 1. Check for replaced avatar
    if (data.image !== undefined && data.image !== currentUser.image) {
      if (currentUser.image && currentUser.image.includes("blob.vercel-storage.com")) {
        await deleteImage(currentUser.image);
      }
    }

    // 2. Prepare update data
    const updateData: any = {
      name: data.name,
      email: data.email,
      image: data.image,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // 3. Update database
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/adm/perfil");
    return { success: true, user };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }
}
