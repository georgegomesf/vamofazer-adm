import { prisma } from "./src/lib/prisma";

async function main() {
  const posts = await prisma.post.findMany({
    where: { projectId: "cmmvobjo80001pcoifi6iawc3" },
    select: { id: true, title: true, createdAt: true, updatedAt: true, publishedAt: true },
    orderBy: { createdAt: "desc" },
  });
  console.table(posts.map(p => ({
    id: p.id,
    title: p.title.substring(0, 30),
    createdAt: p.createdAt.toISOString(),
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null
  })));
}

main().catch(console.error).finally(() => process.exit(0));
