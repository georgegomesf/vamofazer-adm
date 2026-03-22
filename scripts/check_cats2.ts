import { prisma } from "../src/lib/prisma";

async function findMissingCats() {
  const projectId = "cmmvobjo80001pcoifi6iawc3";
  const posts = await prisma.post.findMany({
    where: { projectId },
    select: { id: true, categoryId: true, category: true }
  });
  
  const categoryIds = new Set(posts.map(p => p.categoryId).filter(Boolean));
  console.log(`Unique category IDs in posts:`, categoryIds);
  
  const dbCats = await prisma.category.findMany({ where: { id: { in: Array.from(categoryIds as Set<string>) } }});
  const dbCatIds = new Set(dbCats.map(c => c.id));
  
  const missingCats = Array.from(categoryIds).filter(id => !dbCatIds.has(id as string));
  console.log(`Missing Category IDs:`, missingCats);
  
  process.exit(0);
}

findMissingCats().catch(console.error);
