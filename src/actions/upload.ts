"use server";

import { put, del } from "@vercel/blob";
import { revalidatePath } from "next/cache";

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  // Create a unique filename
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

  try {
    const blob = await put(filename, file, {
      access: "public",
    });
    return blob;
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    throw error;
  }
}

export async function deleteImage(url: string) {
  if (!url) return;
  try {
    await del(url);
  } catch (error) {
    console.error("Error deleting from Vercel Blob:", error);
  }
}
