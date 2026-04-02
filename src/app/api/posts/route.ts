import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

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
    let dominantType = "DEFAULT";
    if (categorySlug) {
      const cat = await prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { type: true, dominantType: true }
      });
      if (cat?.type) categoryType = cat.type;
      if (cat?.dominantType) dominantType = cat.dominantType;
    }

    let isPreview = searchParams.get("preview") === "true";
    
    // Security: Only admins can view list of drafts
    if (isPreview) {
      const session = await auth();
      const user = session?.user as any;
      const isAdmin = user?.role === "ADMIN" || user?.projectRole === "admin";
      if (!isAdmin) {
        isPreview = false;
      }
    }
    
    // Base filter for public requests: only published and not scheduled
    const publicationFilter = !isPreview ? {
      publishedAt: {
        not: null,
        lte: new Date(),
      }
    } : {};

    const where: any = {
      ...(projectId ? { projectId } : {}),
      ...publicationFilter,
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { authorName: { contains: search, mode: 'insensitive' } },
          ...(dominantType === "LIBRARY" ? [
            { postArticles: { some: { article: { 
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { abstract: { contains: search, mode: 'insensitive' } },
                { authors: { contains: search, mode: 'insensitive' } },
                { keywords: { contains: search, mode: 'insensitive' } },
              ]
            } } } },
            { postIssues: { some: { issue: { 
              title: { contains: search, mode: 'insensitive' }
            } } } },
            { postJournals: { some: { journal: { 
              title: { contains: search, mode: 'insensitive' }
            } } } },
            { postTheses: { some: { thesis: { 
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { authors: { contains: search, mode: 'insensitive' } },
                { abstract: { contains: search, mode: 'insensitive' } },
                { university: { contains: search, mode: 'insensitive' } },
                { advisor: { contains: search, mode: 'insensitive' } },
              ]
            } } } },
          ] : []),
          ...(dominantType === "ACTIONS" ? [
            { actions: { some: { action: {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { organizer: { contains: search, mode: 'insensitive' } },
              ]
            } } } }
          ] : [])
        ]
      } : {}),
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
      posts = allPosts.sort((a: any, b: any) => {
        const eventA = a.actions.find((act: any) => 
          ["Evento", "Atividade", "Prazo"].includes(act.action.type)
        )?.action;
        const eventB = b.actions.find((act: any) => 
          ["Evento", "Atividade", "Prazo"].includes(act.action.type)
        )?.action;

        if (!eventA && !eventB) return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
        if (!eventA) return 1;
        if (!eventB) return -1;

        const dateA = new Date(eventA.startDate || a.publishedAt || a.createdAt);
        const endA = eventA.endDate ? new Date(eventA.endDate) : dateA;
        const dateB = new Date(eventB.startDate || b.publishedAt || b.createdAt);
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
            postTheses: { include: { thesis: true } },
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
