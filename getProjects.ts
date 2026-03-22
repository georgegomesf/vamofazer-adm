import { prisma } from "./src/lib/prisma";

async function main() {
  const projects = await prisma.project.findMany();
  process.stdout.write(JSON.stringify(projects, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
