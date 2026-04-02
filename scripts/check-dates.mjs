
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true
    }
  });

  console.log("Recent Posts:");
  posts.forEach(p => {
    console.log(`- ${p.title}:`);
    console.log(`  createdAt:   ${p.createdAt.toISOString()}`);
    console.log(`  updatedAt:   ${p.updatedAt.toISOString()}`);
    console.log(`  publishedAt: ${p.publishedAt ? p.publishedAt.toISOString() : 'null'}`);
  });

  const activities = await prisma.activity.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      title: true,
      createdAt: true
    }
  });

  console.log("\nRecent Activities:");
  activities.forEach(a => {
    console.log(`- ${a.title}: ${a.createdAt.toISOString()}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
