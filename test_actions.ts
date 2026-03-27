import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const actions = await prisma.action.findMany({
    where: { 
      type: "Prazo"
    },
    include: { posts: { include: { post: true } } }
  });
  console.log(JSON.stringify(actions, null, 2));
}
main().finally(() => prisma.$disconnect());
