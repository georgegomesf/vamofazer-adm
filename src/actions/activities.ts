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

export async function getActivities(projectId: string, limit: number = 50, page: number = 1, userId?: string) {
  try {
    const skip = (page - 1) * limit;

    // Resolve favorited postIds for the user (if logged in)
    let favoritedPostIds: string[] | null = null;
    if (userId) {
      const interests = await prisma.userInterest.findMany({
        where: { userId, projectId },
        select: { postId: true }
      });
      favoritedPostIds = interests.map(i => i.postId);
    }

    // Build filter: ACTION_LINKED and ATTACHMENT_LINKED are only shown
    // if the referenced postId is in the user's favorites.
    // Anonymous users never see these types.
    const linkedTypesFilter: any[] = [];
    if (favoritedPostIds && favoritedPostIds.length > 0) {
      linkedTypesFilter.push({
        type: { in: ["ACTION_LINKED", "ATTACHMENT_LINKED"] as any },
        metadata: {
          path: ["postId"],
          string_in: favoritedPostIds
        }
      });
    }

    const activities = await prisma.activity.findMany({
      where: {
        projectId,
        NOT: { type: { in: ["ACTION_LINKED", "ATTACHMENT_LINKED"] as any } },
        ...({} as any) // workaround – real filter below via OR
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

    // Fetch matching ACTION_LINKED / ATTACHMENT_LINKED separately (if user has favorites)
    let linkedActivities: typeof activities = [];
    if (favoritedPostIds && favoritedPostIds.length > 0) {
      linkedActivities = await prisma.activity.findMany({
        where: {
          projectId,
          type: { in: ["ACTION_LINKED", "ATTACHMENT_LINKED"] as any },
        },
        include: {
          user: { select: { name: true, image: true, id: true } },
          project: { select: { logoUrl: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
      }) as typeof activities;

      // filter in memory by metadata.postId in favoritedPostIds
      const favSet = new Set(favoritedPostIds);
      linkedActivities = linkedActivities.filter((a: any) => favSet.has(a?.metadata?.postId));
    }

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
          ]
        }
      });

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { logoUrl: true, name: true }
      });

      actions.forEach(action => {
        const start = action.startDate ? new Date(action.startDate) : null;
        const end = action.endDate ? new Date(action.endDate) : null;

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
            metadata: { actionId: action.id, status: "STARTING" }
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
            metadata: { actionId: action.id, status: "ENDING" }
          });
        } else if (start && end && now > start && now < end) {
          notices.push({
            id: `notice-progress-${action.id}`,
            type: "NOTICE",
            title: `${action.title}`,
            description: "Em andamento.",
            projectId,
            createdAt: start, // Use start date for ordering
            isSystem: true,
            url: action.url,
            project,
            metadata: { actionId: action.id, status: "IN_PROGRESS" }
          });
        }
      });
    }

    // Combine and sort
    const combined = [...activities, ...linkedActivities, ...notices].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return combined;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
}
