import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // ADMIN users have access to all projects
    if (userRole === "ADMIN") {
      const dbProjects = await prisma.project.findMany({
        select: { id: true, name: true, logoUrl: true, logoHorizontalUrl: true, link: true, theme: true },
        orderBy: { name: "asc" },
      });
      // Map to include global admin role (lowercase as requested)
      const projects = dbProjects.map(p => ({ ...p, role: "admin" }));
      return NextResponse.json({ projects });
    }

    // Regular users: fetch their UserProject records
    const userProjects = await prisma.userProject.findMany({
      where: {
        userId,
        role: { not: "blocked" },
      },
      include: {
        Project: {
          select: { id: true, name: true, logoUrl: true, logoHorizontalUrl: true, link: true, theme: true },
        },
      },
      orderBy: { Project: { name: "asc" } },
    });

    const projects = userProjects.map((up) => ({
      ...up.Project,
      role: up.role
    }));

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error("Error fetching user projects:", error?.message);
    return NextResponse.json({ error: "Failed to fetch user projects" }, { status: 500 });
  }
}
