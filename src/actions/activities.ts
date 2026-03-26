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

export async function getActivities(projectId: string, limit: number = 50, page: number = 1) {
  try {
    const skip = (page - 1) * limit;
    const activities = await prisma.activity.findMany({
      where: { projectId },
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
          description: "Encerra hoje!",
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
    const combined = [...activities, ...notices].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return combined;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
}
