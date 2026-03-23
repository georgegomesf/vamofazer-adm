"use server";

import { prisma } from "@/lib/prisma";
import { deleteImage } from "./upload";
import { revalidatePath } from "next/cache";

export async function getPosts(projectId: string) {
  try {
    const posts = await prisma.post.findMany({
      where: { projectId },
      include: {
        categories: {
          include: { category: true },
        },
        tags: {
          include: { tag: true },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export async function getPostById(id: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: true },
        },
        tags: {
          include: { tag: true },
        },
        attachments: {
          include: { attachment: true },
        },
        actions: {
          include: { action: true },
        },
      },
    });
    return post;
  } catch (error) {
    console.error("Error fetching post by id:", error);
    return null;
  }
}

export async function createPost(projectId: string, data: any) {
  console.log("Server: Creating post...", { projectId });
  try {
    const { tagIds, categoryIds, attachmentIds, actionIds, ...postData } = data;
    
    const post = await prisma.post.create({
      data: {
        ...postData,
        projectId,
        categories: {
          create: categoryIds?.map((categoryId: string) => ({
            category: { connect: { id: categoryId } }
          }))
        },
        tags: {
          create: tagIds?.map((tagId: string) => ({
            tag: { connect: { id: tagId } }
          }))
        },
        attachments: {
          create: attachmentIds?.map((attachmentId: string) => ({
            attachment: { connect: { id: attachmentId } }
          }))
        },
        actions: {
          create: actionIds?.map((actionId: string) => ({
            action: { connect: { id: actionId } }
          }))
        }
      },
    });
    console.log("Server: Post created successfully:", post.id);
    revalidatePath("/adm/posts");
    return { success: true, post };
  } catch (error: any) {
    console.error("Error creating post:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePost(id: string, data: any) {
  console.log("Server: Updating post...", id);
  try {
    const { tagIds, categoryIds, attachmentIds, actionIds, ...postData } = data;

    // Delete existing relations first for update
    await prisma.postCategory.deleteMany({
      where: { postId: id }
    });

    await prisma.postTag.deleteMany({
      where: { postId: id }
    });

    await prisma.postAttachment.deleteMany({
      where: { postId: id }
    });

    await prisma.postAction.deleteMany({
      where: { postId: id }
    });

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...postData,
        categories: {
          create: categoryIds?.map((categoryId: string) => ({
            category: { connect: { id: categoryId } }
          }))
        },
        tags: {
          create: tagIds?.map((tagId: string) => ({
            tag: { connect: { id: tagId } }
          }))
        },
        attachments: {
          create: attachmentIds?.map((attachmentId: string) => ({
            attachment: { connect: { id: attachmentId } }
          }))
        },
        actions: {
          create: actionIds?.map((actionId: string) => ({
            action: { connect: { id: actionId } }
          }))
        }
      },
    });
    console.log("Server: Post updated successfully:", post.id);
    revalidatePath("/adm/posts");
    revalidatePath(`/adm/posts/${id}`);
    return { success: true, post };
  } catch (error: any) {
    console.error("Error updating post:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePost(id: string) {
  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (post?.imageUrl && post.imageUrl.includes("blob.vercel-storage.com")) {
      await deleteImage(post.imageUrl);
    }
    await prisma.post.delete({
      where: { id },
    });
    revalidatePath("/adm/posts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
