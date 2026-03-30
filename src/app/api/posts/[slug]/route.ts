import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get("preview") === "true";
    const projectId = searchParams.get("projectId");

    // Verificar autorização para preview
    let isAuthorized = false;
    let currentUserId = null;
    if (isPreview) {
      const previewSecret = request.headers.get("x-preview-secret");
      if (previewSecret && previewSecret === process.env.AUTH_SECRET) {
        isAuthorized = true;
      } else {
        const session = await auth();
        const user = session?.user as any;
        if (user) {
          currentUserId = user.id;
          if (user.role?.toUpperCase() === "ADMIN" || user.projectRole?.toUpperCase() === "ADMIN") {
            isAuthorized = true;
          }
        } else {
          return NextResponse.json({ error: "Unauthorized - Login Required for Preview" }, { status: 404 });
        }
      }
    }

    const post = await prisma.post.findFirst({
      where: {
        slug,
        ...(projectId ? { projectId } : {}),
        ...(!isPreview ? {
          publishedAt: {
            not: null,
            lte: new Date(),
          },
        } : {}),
      },
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
        attachments: { include: { attachment: true } },
        postJournals: { include: { journal: true } },
        postIssues: { 
          include: { 
            issue: {
              include: { 
                journal: true,
                articles: {
                  orderBy: { title: 'asc' },
                  include: {
                    posts: {
                      include: {
                        post: {
                          select: { slug: true }
                        }
                      }
                    }
                  }
                }
              }
            } 
          } 
        },
        postArticles: { 
          include: { 
            article: {
              include: {
                issue: {
                  include: { journal: true }
                }
              }
            } 
          } 
        },
        postTheses: { include: { thesis: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Se for preview e não for admin, verificar se é o criador
    if (isPreview && !isAuthorized) {
      if (!currentUserId || post.createdBy !== currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 404 });
      }
    }

    return NextResponse.json(
      { post },
      { 
        headers: { 
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store, max-age=0",
        } 
      }
    );
  } catch (error) {
    console.error("Single post fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}
