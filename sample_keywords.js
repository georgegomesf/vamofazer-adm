const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const articles = await prisma.article.findMany({
        take: 10,
        where: { keywords: { not: null } },
        select: { keywords: true }
    });
    console.log(JSON.stringify(articles, null, 2));
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
