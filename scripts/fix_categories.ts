import { prisma } from "../src/lib/prisma";

async function main() {
  const projectId = "cmmvobjo80001pcoifi6iawc3";
  
  // Find the exact categories for Eventos and Chamadas
  const eventosCat = await prisma.category.findFirst({ where: { projectId, slug: "eventos" } });
  const chamadasCat = await prisma.category.findFirst({ where: { projectId, slug: "chamadas" } });
  
  if (!eventosCat || !chamadasCat) {
    console.log("Categories missing!");
    return;
  }

  // Find posts without categories
  const postsNoCat = await prisma.post.findMany({
    where: { projectId, categoryId: null },
    include: { tags: { include: { tag: true } } }
  });

  let updatedEventos = 0;
  let updatedChamadas = 0;

  for (const post of postsNoCat) {
    const isEvento = post.tags.some(t => t.tag.slug.toLowerCase() === "eventos");
    const isChamada = post.tags.some(t => t.tag.slug.toLowerCase() === "chamadas");

    if (isChamada) {
      await prisma.post.update({ where: { id: post.id }, data: { categoryId: chamadasCat.id } });
      updatedChamadas++;
    } else if (isEvento) {
      await prisma.post.update({ where: { id: post.id }, data: { categoryId: eventosCat.id } });
      updatedEventos++;
    }
  }

  console.log(`Updated ${updatedEventos} posts to Eventos, ${updatedChamadas} to Chamadas.`);
}
main().catch(console.error).finally(() => process.exit(0));
