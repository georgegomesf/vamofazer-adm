const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const post = await prisma.post.findUnique({
    where: { slug: 'selecao-ppgfil-ufrn-2026-5048' },
    include: { actions: true }
  });
  console.log(post.actions);
}
main().catch(console.error).finally(() => prisma.$disconnect());
