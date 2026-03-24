import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    const categorySlug = searchParams.get("categorySlug");
    
    const search = searchParams.get("search") || undefined;
    
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;

    // Fetch category info to check type
    let categoryType = "Postagens";
    if (categorySlug) {
      const cat = await prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { type: true }
      });
      if (cat?.type) categoryType = cat.type;
    }

    const where: Prisma.PostWhereInput = {
      ...(projectId ? { projectId } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ]
      } : {}),
      publishedAt: {
        not: null,
        lte: new Date(),
      },
      ...(categorySlug ? {
        categories: {
          some: {
            category: {
              slug: categorySlug
            }
          }
        }
      } : {}),
    };

    let posts;
    let total;

    if (categoryType === "Eventos") {
      // Custom ordering for Events:
      // 1. Future/Ongoing (startDate >= today OR (endDate >= today AND startDate < today)) -> Order by startDate ASC
      // 2. Past (endDate < today) -> Order by startDate DESC
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // We need to fetch all and sort in JS because of the complex cross-model logic 
      // OR we do specialized queries. Since we have pagination, specialized queries are better.
      
      // But prismas 'orderBy' doesn't support complex conditional logic easily across relations.
      // So we'll fetch them and sort in memory for now, or use two raw queries if volume is high.
      // Given it's a content portal, total posts per category isn't likely in the millions.
      
      const allPosts = await prisma.post.findMany({
        where,
        include: {
          categories: {
            include: { category: true },
            where: { category: { isVisible: true } }
          },
          tags: { include: { tag: true } },
          actions: { include: { action: true } },
        },
      });

      total = allPosts.length;

      // Sort logic
      posts = allPosts.sort((a, b) => {
        const eventA = a.actions.find(act => act.action.type === "Evento")?.action;
        const eventB = b.actions.find(act => act.action.type === "Evento")?.action;

        if (!eventA && !eventB) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (!eventA) return 1;
        if (!eventB) return -1;

        const dateA = new Date(eventA.startDate || a.createdAt);
        const endA = eventA.endDate ? new Date(eventA.endDate) : dateA;
        const dateB = new Date(eventB.startDate || b.createdAt);
        const endB = eventB.endDate ? new Date(eventB.endDate) : dateB;

        const isPastA = endA < now;
        const isPastB = endB < now;

        if (!isPastA && isPastB) return -1;
        if (isPastA && !isPastB) return 1;

        if (!isPastA) {
          // Both future/ongoing: ASC by startDate
          return dateA.getTime() - dateB.getTime();
        } else {
          // Both past: DESC by startDate
          return dateB.getTime() - dateA.getTime();
        }
      });

      // Apply pagination in memory
      if (limit !== undefined && offset !== undefined) {
        posts = posts.slice(offset, offset + limit);
      }
    } else {
      // Standard ordering for Postagens: DESC by createdAt
      [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          take: limit,
          skip: offset,
          include: {
            categories: {
              include: { category: true },
              where: {
                category: {
                  isVisible: true,
                }
              }
            },
            tags: { include: { tag: true } },
            actions: { include: { action: true } },
          },
          orderBy: { publishedAt: "desc" },
        }),
        prisma.post.count({ where })
      ]);
    }

    return NextResponse.json(
      { posts, total },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
