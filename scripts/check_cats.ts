import { prisma } from "../src/lib/prisma";

async function checkCategories() {
  const projectId = "cmmvobjo80001pcoifi6iawc3";
  const posts = await prisma.post.findMany({
    where: { projectId },
    select: { id: true, categoryId: true, category: true }
  });
  
  const hasCategoryId = posts.filter(p => p.categoryId);
  const categoriesInDb = await prisma.category.findMany();
  
  console.log(`Total posts: ${posts.length}`);
  console.log(`Posts with categoryId: ${hasCategoryId.length}`);
  console.log(`Total Categories in DB: ${categoriesInDb.length}`);
  console.log(`Categories in DB:`, categoriesInDb.map(c => ({ id: c.id, title: c.title, projectId: c.projectId })));
  
  // Also let's check tags
  const tags = await prisma.tag.findMany();
  console.log(`Total Tags in DB: ${tags.length}`);
  
  process.exit(0);
}

checkCategories().catch(console.error);
