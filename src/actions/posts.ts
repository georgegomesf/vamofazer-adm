"use server";

import { prisma } from "@/lib/prisma";
import { deleteImage } from "./upload";
import { revalidatePath } from "next/cache";
import { createActivity } from "./activities";
import { auth } from "@/auth";
import { getWallClockNow } from "@/lib/date-utils";

export async function getPosts(projectId: string, options: { page?: number; pageSize?: number; search?: string; status?: string; categoryId?: string } = {}) {
  const { page = 1, pageSize = 10, search = "", status = "all", categoryId = "all" } = options;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    const where: any = { projectId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "published") {
      where.publishedAt = { not: null };
    } else if (status === "draft") {
      where.publishedAt = null;
    }

    if (categoryId && categoryId !== "all") {
      where.categories = {
        some: {
          categoryId: categoryId
        }
      };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          categories: {
            include: { category: true },
          },
          tags: {
            include: { tag: true },
          },
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      prisma.post.count({ where }),
    ]);

    return { posts, total };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { posts: [], total: 0 };
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
        postJournals: {
          select: { journal: true, includeIssues: true, journalId: true },
        },
        postIssues: {
          select: { issue: true, includeArticles: true, issueId: true },
        },
        postArticles: {
          include: { article: true },
        },
        postTheses: {
          include: { thesis: true },
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
    const { 
      title, slug, summary, content, imageUrl, publishedAt, authorName,
      tagIds, categoryIds, attachmentIds, actionIds, journalIds, issueIds, articleIds, thesisIds 
    } = data;

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        summary,
        content,
        imageUrl,
        publishedAt,
        authorName,
        projectId,
        createdBy: userId,
        createdAt: getWallClockNow(),
        updatedAt: getWallClockNow(),
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
        },
        postJournals: {
          create: journalIds?.map((j: any) => {
            const jId = typeof j === 'string' ? j : j.id;
            const includeIssues = typeof j === 'string' ? false : !!j.includeIssues;
            return {
              journal: { connect: { id: jId } },
              includeIssues
            };
          })
        },
        postIssues: {
          create: issueIds?.map((i: any) => {
            const iId = typeof i === 'string' ? i : i.id;
            const includeArticles = typeof i === 'string' ? false : !!i.includeArticles;
            return {
              issue: { connect: { id: iId } },
              includeArticles
            };
          })
        },
        postArticles: {
          create: articleIds?.map((articleId: string) => ({
            article: { connect: { id: articleId } }
          }))
        },
        postTheses: {
          create: thesisIds?.map((thesisId: string) => ({
            thesis: { connect: { id: thesisId } }
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
    if (actionIds?.length > 0 && post.publishedAt) {
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
    if (attachmentIds?.length > 0 && post.publishedAt) {
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

    // Create Activity: Journals Linked
    if (journalIds?.length > 0 && post.publishedAt) {
      for (const journalId of journalIds) {
        const journal = await prisma.journal.findUnique({ where: { id: journalId } });
        if (journal) {
          await createActivity(projectId, {
            type: "JOURNAL_LINKED",
            title: journal.title,
            description: `A revista foi vinculada à postagem "${post.title}".`,
            url: `/p/${post.slug}`,
            userId: post.createdBy || undefined,
            metadata: { postId: post.id, journalId: journal.id }
          });
        }
      }
    }

    // Create Activity: Issues Linked
    if (issueIds?.length > 0 && post.publishedAt) {
      for (const issueId of issueIds) {
        const issue = await prisma.issue.findUnique({ where: { id: issueId } });
        if (issue) {
          await createActivity(projectId, {
            type: "ISSUE_LINKED",
            title: issue.title,
            description: `A edição foi vinculada à postagem "${post.title}".`,
            url: `/p/${post.slug}`,
            userId: post.createdBy || undefined,
            metadata: { postId: post.id, issueId: issue.id, imageUrl: issue.coverUrl }
          });
        }
      }
    }

    // Create Activity: Articles Linked
    if (articleIds?.length > 0 && post.publishedAt) {
      for (const articleId of articleIds) {
        const article = await prisma.article.findUnique({ where: { id: articleId } });
        if (article) {
          await createActivity(projectId, {
            type: "ARTICLE_LINKED",
            title: article.title,
            description: `O artigo foi vinculado à postagem "${post.title}".`,
            url: `/p/${post.slug}`,
            userId: post.createdBy || undefined,
            metadata: { postId: post.id, articleId: article.id }
          });
        }
      }
    }

    // Create Activity: Theses Linked
    if (thesisIds?.length > 0 && post.publishedAt) {
      for (const thesisId of thesisIds) {
        const thesis = await prisma.thesis.findUnique({ where: { id: thesisId } });
        if (thesis) {
          await createActivity(projectId, {
            type: "THESIS_LINKED",
            title: thesis.title,
            description: `A tese/dissertação foi vinculada à postagem "${post.title}".`,
            url: `/p/${post.slug}`,
            userId: post.createdBy || undefined,
            metadata: { postId: post.id, thesisId: thesis.id }
          });
        }
      }
    }

    revalidatePath("/adm/posts");
    return { success: true, post };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "Já existe uma postagem com este link (slug). Por favor, altere o campo do link antes de salvar." };
    }
    console.error("Error creating post:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePost(id: string, data: any) {
  console.log("Server: Updating post...", id);
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    const { 
      title, slug, summary, content, imageUrl, publishedAt, authorName,
      tagIds, categoryIds, attachmentIds, actionIds, journalIds, issueIds, articleIds, thesisIds 
    } = data;

    // Snapshot current state BEFORE deleting relations (to compute diffs)
    const previousPost = await prisma.post.findUnique({
      where: { id },
      include: {
        attachments: { select: { attachmentId: true } },
        actions: { select: { actionId: true } },
        postJournals: { select: { journalId: true } },
        postIssues: { select: { issueId: true } },
        postArticles: { select: { articleId: true } },
        postTheses: { select: { thesisId: true } },
      },
    });

    const prevAttachmentIds = new Set(previousPost?.attachments.map(a => a.attachmentId) ?? []);
    const prevActionIds = new Set(previousPost?.actions.map(a => a.actionId) ?? []);
    const prevJournalIds = new Set(previousPost?.postJournals.map(j => j.journalId) ?? []);
    const prevIssueIds = new Set(previousPost?.postIssues.map(i => i.issueId) ?? []);
    const prevArticleIds = new Set(previousPost?.postArticles.map(a => a.articleId) ?? []);
    const prevThesisIds = new Set(previousPost?.postTheses.map(t => t.thesisId) ?? []);
    
    const wasUnpublished = !previousPost?.publishedAt;

    // Delete existing relations first for update
    await prisma.postCategory.deleteMany({ where: { postId: id } });
    await prisma.postTag.deleteMany({ where: { postId: id } });
    await prisma.postAttachment.deleteMany({ where: { postId: id } });
    await prisma.postAction.deleteMany({ where: { postId: id } });
    await prisma.postJournal.deleteMany({ where: { postId: id } });
    await prisma.postIssue.deleteMany({ where: { postId: id } });
    await prisma.postArticle.deleteMany({ where: { postId: id } });
    await prisma.postThesis.deleteMany({ where: { postId: id } });

    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        slug,
        summary,
        content,
        imageUrl,
        publishedAt,
        authorName,
        updatedBy: userId,
        updatedAt: getWallClockNow(),
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
        },
        postJournals: {
          create: journalIds?.map((j: any) => {
            const jId = typeof j === 'string' ? j : j.id;
            const includeIssues = typeof j === 'string' ? false : !!j.includeIssues;
            return {
              journal: { connect: { id: jId } },
              includeIssues
            };
          })
        },
        postIssues: {
          create: issueIds?.map((i: any) => {
            const iId = typeof i === 'string' ? i : i.id;
            const includeArticles = typeof i === 'string' ? false : !!i.includeArticles;
            return {
              issue: { connect: { id: iId } },
              includeArticles
            };
          })
        },
        postArticles: {
          create: articleIds?.map((articleId: string) => ({
            article: { connect: { id: articleId } }
          }))
        },
        postTheses: {
          create: thesisIds?.map((thesisId: string) => ({
            thesis: { connect: { id: thesisId } }
          }))
        }
      },
    });

    console.log("Server: Post updated successfully:", post.id);

    const becamePublished = post.publishedAt && wasUnpublished;
    const addedImageToPublished = post.publishedAt && !wasUnpublished && (post.imageUrl && !previousPost?.imageUrl);
    
    // Novas ações ou anexos inseridos (verificação pré-laços)
    const normalizedJournalIds = journalIds?.map((j: any) => typeof j === 'string' ? j : j.id) || [];
    const normalizedIssueIds = issueIds?.map((i: any) => typeof i === 'string' ? i : i.id) || [];

    const newActionIds = actionIds?.filter((id: string) => !prevActionIds.has(id)) || [];
    const newAttachmentIds = attachmentIds?.filter((id: string) => !prevAttachmentIds.has(id)) || [];
    const newJournalIds = normalizedJournalIds.filter((id: string) => !prevJournalIds.has(id));
    const newIssueIds = normalizedIssueIds.filter((id: string) => !prevIssueIds.has(id));
    const newArticleIds = articleIds?.filter((id: string) => !prevArticleIds.has(id)) || [];
    const newThesisIds = thesisIds?.filter((id: string) => !prevThesisIds.has(id)) || [];

    // Create POST_PUBLISHED activity only if transitioning from draft to published
    // OR if it's already published but doesn't have an activity record (to fix legacy data)
    if (post.publishedAt) {
      const existingActivities = await prisma.activity.findMany({
        where: { type: "POST_PUBLISHED", projectId: post.projectId },
        select: { id: true, metadata: true }
      });
      
      const alreadyPublished = existingActivities.some(
        (act) => act.metadata && typeof act.metadata === 'object' && (act.metadata as any).postId === post.id
      );

      // E AINDA não gerou um registro de POST_PUBLISHED no banco, então gera AGORA.
      if (!alreadyPublished) {
        await createActivity(post.projectId, {
          type: "POST_PUBLISHED",
          title: post.title,
          description: post.summary ? (post.summary.length > 200 ? post.summary.substring(0, 197) + "..." : post.summary) : "Uma nova postagem foi publicada.",
          url: `/p/${post.slug}`,
          userId: post.updatedBy || undefined,
          metadata: { postId: post.id, imageUrl: post.imageUrl }
        });
      }
    }

    // Activity: ACTION_LINKED — only for newly added actions
    if (post.publishedAt) {
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
    }

    // Activity: ATTACHMENT_LINKED — only for newly added attachments
    if (post.publishedAt) {
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
    }

    // Activity: JOURNAL_LINKED — only for newly added journals
    if (post.publishedAt) {
      for (const journalId of newJournalIds) {
        const journal = await prisma.journal.findUnique({ where: { id: journalId } });
        if (journal) {
          await createActivity(post.projectId, {
            type: "JOURNAL_LINKED",
            title: journal.title,
            description: `A revista foi vinculada à postagem "${post.title}".`,
            url: `/p/${post.slug}`,
            userId: post.updatedBy || undefined,
            metadata: { postId: post.id, journalId: journal.id }
          });
        }
      }
    }

    // Activity: ISSUE_LINKED — only for newly added issues
    if (post.publishedAt) {
      for (const issueId of newIssueIds) {
        const issue = await prisma.issue.findUnique({ where: { id: issueId } });
        if (issue) {
          await createActivity(post.projectId, {
            type: "ISSUE_LINKED",
            title: issue.title,
            description: `A edição foi vinculada à postagem "${post.title}".`,
            url: `/p/${post.slug}`,
            userId: post.updatedBy || undefined,
            metadata: { postId: post.id, issueId: issue.id, imageUrl: issue.coverUrl }
          });
        }
      }
    }

    // Activity: ARTICLE_LINKED — only for newly added articles
    if (post.publishedAt) {
      for (const articleId of newArticleIds) {
        const article = await prisma.article.findUnique({ where: { id: articleId } });
        if (article) {
          await createActivity(post.projectId, {
            type: "ARTICLE_LINKED",
            title: article.title,
            description: `O artigo foi vinculado à postagem "${post.title}".`,
            url: `/p/${post.slug}`,
            userId: post.updatedBy || undefined,
            metadata: { postId: post.id, articleId: article.id }
          });
        }
      }
    }

    // Activity: THESIS_LINKED — only for newly added theses
    if (post.publishedAt) {
      for (const thesisId of newThesisIds) {
        const thesis = await prisma.thesis.findUnique({ where: { id: thesisId } });
        if (thesis) {
          await createActivity(post.projectId, {
            type: "THESIS_LINKED",
            title: thesis.title,
            description: `A tese/dissertação foi vinculada à postagem "${post.title}".`,
            url: `/p/${post.slug}`,
            userId: post.updatedBy || undefined,
            metadata: { postId: post.id, thesisId: thesis.id }
          });
        }
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
    if (error.code === 'P2002') {
      return { success: false, error: "Já existe outra postagem com este link (slug). Por favor, altere o campo do link antes de salvar." };
    }
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
