import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function scoreArticle(article) {
  let score = 0;
  if (article.doi && article.doi.length > 5 && article.doi !== 'null') score += 10;
  if (article.abstract && article.abstract.length > 10 && article.abstract !== 'null') score += 5;
  if (article.authors && article.authors !== 'null') score += 5;
  if (article.keywords && article.keywords !== 'null') score += 5;
  if (article.url && article.url !== 'null') score += 2;
  return score;
}

// Para campos nulos literais string 'null' oriundos da importação anterior se houver
function isValid(val) {
  return val && val !== 'null' && val !== 'undefined';
}

async function cleanupDuplicates() {
  console.log("Iniciando limpeza de Artigos duplicados...");
  const logStream = fs.createWriteStream("cleanup_duplicates.log", { flags: 'a' });
  const log = (msg) => {
    console.log(msg);
    logStream.write(msg + "\n");
  };

  // Encontrar grupos duplicados estritos: mesmo título e mesma edição
  const groupsToProcess = await prisma.article.groupBy({
    by: ['title', 'issueId'],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } }
  });

  log(`Encontrados ${groupsToProcess.length} grupos de artigos exatamente duplicados (título + edição). Iniciando consolidação...`);

  let totalDeletedArticles = 0;
  let totalDeletedPosts = 0;
  const BATCH_SIZE = 100;

  for (let i = 0; i < groupsToProcess.length; i += BATCH_SIZE) {
    const batch = groupsToProcess.slice(i, i + BATCH_SIZE);
    
    for (const group of batch) {
      if (!group.title || !group.issueId) continue;

      const articles = await prisma.article.findMany({
        where: { title: group.title, issueId: group.issueId },
        include: {
          posts: {
            include: { post: true }
          }
        }
      });

      if (articles.length <= 1) continue;

      // Classificar para achar o sobrevivente
      const sortedArticles = articles.sort((a, b) => scoreArticle(b) - scoreArticle(a));
      const survivor = sortedArticles[0];
      const victims = sortedArticles.slice(1);

      // Merge de dados (se sobrevivente não tem, e vítima tem)
      let updateData = {};
      
      for (const victim of victims) {
        if (!isValid(survivor.doi) && isValid(victim.doi) && !updateData.doi) updateData.doi = victim.doi;
        if (!isValid(survivor.abstract) && isValid(victim.abstract) && !updateData.abstract) updateData.abstract = victim.abstract;
        if (!isValid(survivor.authors) && isValid(victim.authors) && !updateData.authors) updateData.authors = victim.authors;
        if (!isValid(survivor.keywords) && isValid(victim.keywords) && !updateData.keywords) updateData.keywords = victim.keywords;
        if (!isValid(survivor.url) && isValid(victim.url) && !updateData.url) updateData.url = victim.url;
        if (!isValid(survivor.pages) && isValid(victim.pages) && !updateData.pages) updateData.pages = victim.pages;
        if (!isValid(survivor.datePublished) && isValid(victim.datePublished) && !updateData.datePublished) updateData.datePublished = victim.datePublished;
      }

      try {
        await prisma.$transaction(async (tx) => {
          // Atualiza o sobrevivente se houver fusão de novos dados
          if (Object.keys(updateData).length > 0) {
            await tx.article.update({
              where: { id: survivor.id },
              data: updateData
            });
          }

          const victimArticleIds = victims.map(v => v.id);
          const victimPostIds = [];
          
          for (const victim of victims) {
            for (const postArticle of victim.posts) {
              if (postArticle.post) {
                victimPostIds.push(postArticle.post.id);
              }
            }
          }

          // Deleta Posts gerados a partir dos Artigos "vítimas"
          if (victimPostIds.length > 0) {
            await tx.post.deleteMany({
              where: { id: { in: victimPostIds } }
            });
            totalDeletedPosts += victimPostIds.length;
          }

          // Deleta os Artigos duplicados
          await tx.article.deleteMany({
            where: { id: { in: victimArticleIds } }
          });
          totalDeletedArticles += victimArticleIds.length;
        });

      } catch (err) {
        log(`Erro ao processar o grupo "${group.title}": ${err.message}`);
      }
    }
    
    // Log gerencial progressivo reduzido
    log(`Lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(groupsToProcess.length / BATCH_SIZE)} finalizado. Deletados: Artigos (${totalDeletedArticles}) | Posts (${totalDeletedPosts})`);
  }

  log("\n==================================");
  log("Conclusão da Consolidação:");
  log(`-> Total geral de Artigos deletados: ${totalDeletedArticles}`);
  log(`-> Total geral de Postagens-clones deletadas: ${totalDeletedPosts}`);
  log("==================================");

  logStream.end();
  await prisma.$disconnect();
}

cleanupDuplicates().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
