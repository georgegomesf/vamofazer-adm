const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const actions = await prisma.action.findMany({
    where: { title: { contains: 'UFRN' } }
  });
  console.log('Actions with UFRN:', actions);
  
  const tags = await prisma.post.findUnique({
    where: { slug: 'selecao-ppgfil-ufrn-2026-5048' },
    include: {
      tags: { include: { tag: true } },
      actions: { include: { action: true } }
    }
  });
  console.log('Post tags and actions:', JSON.stringify(tags, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
