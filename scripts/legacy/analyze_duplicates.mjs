import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function analyzeDuplicates() {
  console.log("Iniciando análise de duplicidades de Artigos...");

  // Identificar duplicados por título
  const duplicateTitles = await prisma.article.groupBy({
    by: ['title'],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } }
  });

  console.log(`\nEncontrados ${duplicateTitles.length} títulos de artigos duplicados.`);

  let totalDuplicatedArticles = 0;
  let exactDuplicatesCount = 0;
  
  // Vamos ver os 10 primeiros para analisar o padrão
  for (let i = 0; i < Math.min(10, duplicateTitles.length); i++) {
    const titleObj = duplicateTitles[i];
    const articles = await prisma.article.findMany({
      where: { title: titleObj.title },
      include: {
        posts: {
          include: { post: true }
        }
      }
    });
    
    totalDuplicatedArticles += articles.length;
    
    // Check if they belong to the same issue or have same DOI
    const issues = new Set(articles.map(a => a.issueId));
    if (issues.size === 1) exactDuplicatesCount++;

    console.log(`\nTítulo: "${titleObj.title}" (Aparece ${articles.length} vezes)`);
    articles.forEach((art, idx) => {
      console.log(`  [${idx + 1}] ID: ${art.id} | IssueID: ${art.issueId} | DOI: ${art.doi} | Posts vinculados: ${art.posts.length}`);
      if (art.posts.length > 0) {
        art.posts.forEach(p => {
          console.log(`    -> Post ID: ${p.post.id} | Slug: ${p.post.slug} | Preview: ${p.post.title.substring(0, 30)}...`);
        });
      }
    });
  }

  console.log("\n==================================");
  console.log("Relatório Prévio de Duplicação:");
  console.log(`Títulos Duplicados: ${duplicateTitles.length}`);
  console.log(`Destes 10 primeiros analisados, ${exactDuplicatesCount} pertencem à mesma Edição (Issue) simultaneamente (duplicação de importação exata).`);
  
  // Identificar posts duplicados diretamente (se os slugs também se repetem ou títulos das postagens)
  const postsDuplicates = await prisma.post.groupBy({
    by: ['title', 'projectId'],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } }
  });
  
  console.log(`\nPosts totais repetidos por Título no mesmo Projeto: ${postsDuplicates.length}`);

  await prisma.$disconnect();
}

analyzeDuplicates().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
