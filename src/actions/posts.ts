"use server";

import { prisma } from "@/lib/prisma";
import { deleteImage } from "./upload";
import { revalidatePath } from "next/cache";
import { createActivity } from "./activities";
import { auth } from "@/auth";

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
    const session = await auth();
    const userId = (session?.user as any)?.id;
    const { tagIds, categoryIds, attachmentIds, actionIds, ...postData } = data;

    const post = await prisma.post.create({
      data: {
        ...postData,
        projectId,
        createdBy: userId,
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

    // Create Activity: Post Published
    if (post.publishedAt) {
      await createActivity(projectId, {
        type: "POST_PUBLISHED",
        title: post.title,
        description: post.summary ? (post.summary.length > 200 ? post.summary.substring(0, 197) + "..." : post.summary) : "Uma nova postagem foi publicada.",
        url: `/p/${post.slug}`,
        userId: post.createdBy || undefined,
        metadata: { postId: post.id, imageUrl: post.imageUrl }
      });
    }

    // Create Activity: Actions Linked
    if (actionIds?.length > 0) {
      for (const actionId of actionIds) {
        const action = await prisma.action.findUnique({ where: { id: actionId } });
        if (action) {
          await createActivity(projectId, {
            type: "ACTION_LINKED",
            title: `${action.title}`,
            description: `O item foi vinculado à postagem ${post.title}`,
            url: `/p/${post.slug}`,
            userId: post.createdBy || undefined,
            metadata: { postId: post.id, actionId: action.id }
          });
        }
      }
    }

    // Create Activity: Attachments Linked
    if (attachmentIds?.length > 0) {
      for (const attachmentId of attachmentIds) {
        const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
        if (attachment) {
          await createActivity(projectId, {
            type: "ATTACHMENT_LINKED",
            title: `${attachment.title}`,
            description: `O anexo foi vinculado à postagem "${post.title}".`,
            url: `/p/${post.slug}`,
            userId: post.createdBy || undefined,
            metadata: { postId: post.id, attachmentId: attachment.id }
          });
        }
      }
    }

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
    const session = await auth();
    const userId = (session?.user as any)?.id;
    const { tagIds, categoryIds, attachmentIds, actionIds, ...postData } = data;

    // Snapshot current state BEFORE deleting relations (to compute diffs)
    const previousPost = await prisma.post.findUnique({
      where: { id },
      include: {
        attachments: { select: { attachmentId: true } },
        actions: { select: { actionId: true } },
      },
    });

    const prevAttachmentIds = new Set(previousPost?.attachments.map(a => a.attachmentId) ?? []);
    const prevActionIds = new Set(previousPost?.actions.map(a => a.actionId) ?? []);
    const wasUnpublished = !previousPost?.publishedAt;

    // Delete existing relations first for update
    await prisma.postCategory.deleteMany({ where: { postId: id } });
    await prisma.postTag.deleteMany({ where: { postId: id } });
    await prisma.postAttachment.deleteMany({ where: { postId: id } });
    await prisma.postAction.deleteMany({ where: { postId: id } });

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...postData,
        updatedBy: userId,
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

    // Activity: POST_PUBLISHED — on first publish OR when an image is added to a published post that had none
    const becamePublished = post.publishedAt && wasUnpublished;
    const addedImageToPublished = post.publishedAt && !wasUnpublished && (post.imageUrl && !previousPost?.imageUrl);

    if (becamePublished || addedImageToPublished) {
      await createActivity(post.projectId, {
        type: "POST_PUBLISHED",
        title: post.title,
        description: post.summary ? (post.summary.length > 200 ? post.summary.substring(0, 197) + "..." : post.summary) : "Uma nova postagem foi publicada.",
        url: `/p/${post.slug}`,
        userId: post.updatedBy || undefined,
        metadata: { postId: post.id, imageUrl: post.imageUrl }
      });
    }

    // Activity: ACTION_LINKED — only for newly added actions
    const newActionIds = (actionIds ?? []).filter((aid: string) => !prevActionIds.has(aid));
    for (const actionId of newActionIds) {
      const action = await prisma.action.findUnique({ where: { id: actionId } });
      if (action) {
        await createActivity(post.projectId, {
          type: "ACTION_LINKED",
          title: `${action.title}`,
          description: `O item foi vinculada à postagem "${post.title}".`,
          url: `/p/${post.slug}`,
          userId: post.updatedBy || undefined,
          metadata: { postId: post.id, actionId: action.id }
        });
      }
    }

    // Activity: ATTACHMENT_LINKED — only for newly added attachments
    const newAttachmentIds = (attachmentIds ?? []).filter((aid: string) => !prevAttachmentIds.has(aid));
    for (const attachmentId of newAttachmentIds) {
      const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
      if (attachment) {
        await createActivity(post.projectId, {
          type: "ATTACHMENT_LINKED",
          title: `${attachment.title}`,
          description: `O anexo foi vinculado à postagem "${post.title}".`,
          url: `/p/${post.slug}`,
          userId: post.updatedBy || undefined,
          metadata: { postId: post.id, attachmentId: attachment.id }
        });
      }
    }

    revalidatePath("/adm/posts");
    revalidatePath(`/adm/posts/${id}`);

    // Invalidar cache do site imediatamente após qualquer alteração no post
    try {
      const webUrl = process.env.NEXT_PUBLIC_WEB_SERVICE_URL || "http://localhost:3000";
      await fetch(`${webUrl}/api/revalidate?slug=${post.slug}`, { cache: "no-store" });
    } catch (_) {
      // Não bloquear o fluxo se o site estiver offline
    }

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
