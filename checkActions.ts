import { prisma } from "./src/lib/prisma";

async function main() {
  const projectId = "cmmvobjo80001pcoifi6iawc3";
  const actions = await prisma.action.findMany({
    where: { projectId },
  });
  console.log(JSON.stringify(actions, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
