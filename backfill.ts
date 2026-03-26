import { prisma } from "./src/lib/prisma";
import { createActivity } from "./src/actions/activities";

async function backfill() {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!;
  
  // Find latest published post
  const posts = await prisma.post.findMany({
    where: { projectId, publishedAt: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 1,
    include: {
      actions: { include: { action: true } },
      attachments: { include: { attachment: true } }
    }
  });

  if (posts.length === 0) {
    console.log("No published posts found.");
    return;
  }

  const post = posts[0];
  console.log("Backfilling for post:", post.title);

  // Post Published
  await createActivity(projectId, {
    type: "POST_PUBLISHED",
    title: post.title,
    description: "Postagem vinculada e ativa na rede.",
    url: `/p/${post.slug}`,
    userId: post.createdBy || undefined,
    metadata: { postId: post.id, imageUrl: post.imageUrl }
  });

  // Actions
  for (const { action } of post.actions) {
      await createActivity(projectId, {
        type: "ACTION_LINKED",
        title: `Ação: ${action.title}`,
        description: `A ação "${action.title}" foi vinculada.`,
        url: `/p/${post.slug}`,
        userId: post.createdBy || undefined,
        metadata: { postId: post.id, actionId: action.id }
      });
  }

  console.log("Backfill complete.");
}

backfill();
