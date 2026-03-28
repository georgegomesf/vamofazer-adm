"use server";

import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export type ActivityType = "POST_PUBLISHED" | "ACTION_LINKED" | "ATTACHMENT_LINKED" | "LIST_CREATED" | "ITEM_ADDED" | "NOTICE";

export async function createActivity(projectId: string, data: {
  type: ActivityType;
  title: string;
  description?: string;
  url?: string;
  userId?: string;
  metadata?: any;
}) {
  try {
    const activity = await prisma.activity.create({
      data: {
        ...data,
        projectId,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            id: true,
          }
        },
        project: {
          select: {
            logoUrl: true,
            name: true,
          }
        }
      }
    });

    // Push to pusher - Only if secret is present to avoid crash if not configured
    if (process.env.PUSHER_SECRET) {
      try {
        await pusherServer.trigger(`project-${projectId}`, "new-activity", activity);
      } catch (err) {
        console.error("Pusher trigger error:", err);
      }
    }

    return activity;
  } catch (error) {
    console.error("Error creating activity:", error);
    return null;
  }
}

export async function getActivities(projectId: string, limit: number = 50, page: number = 1, userId?: string, publicOnly: boolean = false, activityId?: string) {
  try {
    const skip = (page - 1) * limit;

    // Determine which IDs the user has actively followed
    let favoritedPostIds: string[] = [];
    let subscribedListIds: string[] = [];

    // Base types everyone sees
    const orConditions: any[] = [
      { type: { in: ["POST_PUBLISHED", "LIST_CREATED", "NOTICE"] } }
    ];

    if (userId) {
      // The user always sees their own activities
      orConditions.push({ userId });

      const [interests, subscriptions] = await Promise.all([
        prisma.userInterest.findMany({ where: { userId, projectId }, select: { postId: true } }),
        prisma.listSubscription.findMany({ where: { userId }, select: { listId: true } })
      ]);

      favoritedPostIds = interests.map((i: any) => i.postId);
      subscribedListIds = subscriptions.map((s: any) => s.listId);

      const mappedPosts = favoritedPostIds.map((id: string) => ({ metadata: { path: ["postId"], equals: id } }));
      if (mappedPosts.length > 0) {
        orConditions.push({
          type: { in: ["ACTION_LINKED", "ATTACHMENT_LINKED"] },
          OR: mappedPosts
        });
      }

      const mappedLists = subscribedListIds.map((id: string) => ({ metadata: { path: ["listId"], equals: id } }));
      if (mappedLists.length > 0) {
        orConditions.push({
          type: "ITEM_ADDED",
          OR: mappedLists
        });
      }
    }

    const activities = await prisma.activity.findMany({
      where: {
        projectId,
        ...(activityId ? { id: activityId } : { OR: orConditions }),
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            id: true,
          }
        },
        project: {
          select: {
            logoUrl: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });

    let linkedActivities: any[] = []; // No longer needed as separate fetch

    // Add dynamic notices for actions
    const notices: any[] = [];
    if (page === 1) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const actions = await prisma.action.findMany({
        where: {
          projectId,
          OR: [
            { startDate: { gte: today } }, // Future or starting today
            { endDate: { gte: today } },   // Ending today or future
          ],
          posts: {
            some: {}
          }
        },
        include: {
          posts: {
            include: {
              post: {
                select: {
                  imageUrl: true
                }
              }
            }
          }
        }
      });

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { logoUrl: true, name: true }
      });

      actions.forEach(action => {
        const start = action.startDate ? new Date(action.startDate) : null;
        const end = action.endDate ? new Date(action.endDate) : null;
        const postImageUrl = action.posts?.[0]?.post?.imageUrl || action.imageUrl;
        const postId = action.posts?.[0]?.postId;

        if (start && start.toDateString() === today.toDateString()) {
          notices.push({
            id: `notice-start-${action.id}`,
            type: "NOTICE",
            title: `${action.title}`,
            description: null,
            projectId,
            createdAt: start,
            isSystem: true,
            url: action.url,
            project,
            metadata: { actionId: action.id, status: "STARTING", imageUrl: postImageUrl, postId }
          });
        } else if (end && end.toDateString() === today.toDateString()) {
          notices.push({
            id: `notice-end-${action.id}`,
            type: "NOTICE",
            title: `${action.title}`,
            description: null,
            projectId,
            createdAt: end,
            isSystem: true,
            url: action.url,
            project,
            metadata: { actionId: action.id, status: "ENDING", imageUrl: postImageUrl, postId }
          });
        } else if (start && end && now > start && now < end) {
          notices.push({
            id: `notice-progress-${action.id}`,
            type: "NOTICE",
            title: `${action.title}`,
            description: null,
            projectId,
            createdAt: start, // Use start date for ordering
            isSystem: true,
            url: action.url,
            project,
            metadata: { actionId: action.id, status: "IN_PROGRESS", imageUrl: postImageUrl, postId }
          });
        }
      });
    }

    // Combine
    let combined = [...activities, ...linkedActivities, ...notices];

    // Enrichment: Synchronize titles, descriptions and URLs with current data from source entities
    const postIds = new Set<string>();
    const actionIds = new Set<string>();
    const attachmentIds = new Set<string>();
    const listIds = new Set<string>();

    combined.forEach((a: any) => {
      let { postId, actionId, attachmentId, listId } = a.metadata || {};
      
      // Fallback: Tentar extrair do URL se o metadata estiver incompleto (para atividades legadas)
      if (!postId && a.url?.startsWith('/p/')) postId = a.url.split('/').pop();
      if (!listId && a.url?.startsWith('/l/')) listId = a.url.split('/').pop();

      if (postId) postIds.add(postId);
      if (actionId) actionIds.add(actionId);
      if (attachmentId) attachmentIds.add(attachmentId);
      if (listId) listIds.add(listId);
      
      // Armazenar os IDs recuperados de volta no objeto para facilitar o mapeamento posterior
      a._recoveredIds = { postId, actionId, attachmentId, listId };
    });

    const [posts, actions, attachments, currentLists] = await Promise.all([
      postIds.size > 0 ? prisma.post.findMany({ where: { OR: [{ id: { in: Array.from(postIds) } }, { slug: { in: Array.from(postIds) } }] }, select: { id: true, title: true, slug: true, imageUrl: true } }) : [],
      actionIds.size > 0 ? prisma.action.findMany({ where: { id: { in: Array.from(actionIds) } }, select: { id: true, title: true, url: true, imageUrl: true } }) : [],
      attachmentIds.size > 0 ? prisma.attachment.findMany({ where: { id: { in: Array.from(attachmentIds) } }, select: { id: true, title: true, url: true, type: true } }) : [],
      listIds.size > 0 ? prisma.interestList.findMany({ where: { id: { in: Array.from(listIds) } }, select: { id: true, name: true, imageUrl: true, isPublic: true } }) : [],
    ]);

    const postMap = new Map();
    posts.forEach(p => { postMap.set(p.id, p); postMap.set(p.slug, p); });
    const actionMap = new Map(actions.map(a => [a.id, a]));
    const attachmentMap = new Map(attachments.map(at => [at.id, at]));
    const listMap = new Map(currentLists.map(l => [l.id, l]));

    combined = combined.map((a: any) => {
      const { postId, actionId, attachmentId, listId } = a._recoveredIds || {};
      let updated = { ...a };
      delete (updated as any)._recoveredIds;

      // 1. Resolve Action and Attachment basic data
      if (actionId && actionMap.has(actionId)) {
        const act = actionMap.get(actionId)!;
        updated.title = updated.type === "ACTION_LINKED" || updated.type === "NOTICE" ? act.title : updated.title;
        updated.url = act.url || updated.url;
        updated.metadata = { 
          ...updated.metadata, 
          itemUrl: act.url, 
          imageUrl: act.imageUrl || updated.metadata?.imageUrl 
        };
      }

      if (attachmentId && attachmentMap.has(attachmentId)) {
        const att = attachmentMap.get(attachmentId)!;
        updated.title = updated.type === "ATTACHMENT_LINKED" ? att.title : updated.title;
        updated.url = att.url || updated.url;
        updated.metadata = { 
          ...updated.metadata, 
          itemUrl: att.url,
          attachmentType: att.type
        };
      }

      if (listId && listMap.has(listId)) {
        const l = listMap.get(listId)!;
        updated.title = updated.type === "LIST_CREATED" ? l.name : updated.title;
        // Keep the list image separately to allow filtering by list status
        updated.metadata = { 
          ...updated.metadata, 
          listImageUrl: l.imageUrl, 
          listName: l.name,
          isListPublic: l.isPublic,
          imageUrl: l.imageUrl || updated.metadata?.imageUrl 
        };
      }

      // 2. Overwrite with Post data if available (Internal priority)
      if (postId && postMap.has(postId)) {
        const p = postMap.get(postId)!;
        updated.title = updated.type === "POST_PUBLISHED" ? p.title : updated.title;
        updated.metadata = { 
           ...updated.metadata, 
           postTitle: p.title,
           postUrl: `/p/${p.slug}`,
           imageUrl: p.imageUrl || updated.metadata?.imageUrl 
        };
        // Always point to internal post URL if attached to a post
        updated.url = `/p/${p.slug}`;
      }

      return updated;
    });

    // If publicOnly is true, filter out items linked to unpublished posts
    if (publicOnly) {
      // Extract all postIds from metadata
      const postIdsToCheck = combined
        .map((a: any) => a.metadata?.postId)
        .filter((id): id is string => typeof id === 'string');

      if (postIdsToCheck.length > 0) {
        // Fetch published posts
        const publishedPosts = await prisma.post.findMany({
          where: {
            id: { in: postIdsToCheck },
            publishedAt: { not: null }
          },
          select: { id: true }
        });
        const publishedIds = new Set(publishedPosts.map(p => p.id));

        // Filter: Keep if it doesn't have a postId or if the postId is in publishedIds
        combined = combined.filter((a: any) => {
          const postId = a.metadata?.postId;
          if (postId && typeof postId === 'string') {
            return publishedIds.has(postId);
          }
          return true; // Keep system notices or activities without postId
        });
      }
    }

    // If userId is provided, attach 'viewed' status
    if (userId) {
      const viewedRecords = await prisma.activityView.findMany({
        where: {
          userId,
          activityId: { in: combined.map(a => a.id) }
        },
        select: { activityId: true }
      });
      const viewedIds = new Set(viewedRecords.map(v => v.activityId));
      combined = combined.map(a => ({
        ...a,
        viewed: viewedIds.has(a.id)
      }));
    }

    // Sort: unviewed first, then by date (most recent)
    // Actually the user said "jogada para depois das mensagens não vistas"
    // So unviewed first, then viewed.
    combined.sort((a, b) => {
      // Unviewed (false) comes first
      if (a.viewed !== b.viewed) {
        return a.viewed ? 1 : -1;
      }
      // Then date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return combined;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
}

export async function markActivitiesAsViewed(userId: string, activityIds: string[]) {
  try {
    const data = activityIds.map(activityId => ({
      userId,
      activityId,
    }));

    await prisma.activityView.createMany({
      data,
      skipDuplicates: true,
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking activities as viewed:", error);
    return { success: false, error };
  }
}
