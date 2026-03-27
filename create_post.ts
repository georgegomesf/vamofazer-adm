import { prisma } from './src/lib/prisma'

async function main() {
  console.log("CREATING...");
  try {
    const post = await prisma.post.create({
      data: {
        projectId: "cmmvobjo80001pcoifi6iawc3",
        title: "III International Colloquium on the Metaphysics and Semantics of Fiction",
        slug: "iii-colloquium-2026-" + Date.now(),
        content: "Online event.",
        publishedAt: null,
      }
    });
    console.log("POST_CREATED_ID:" + post.id);
  } catch (err) {
    console.error("ERROR_PRISMA:", err);
  }
}
main().catch(console.error);
