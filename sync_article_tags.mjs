import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const projectId = 'ckx7m9a0b0004w3e7r1t9y5u2';

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    console.log(`Buscando artigos do projeto ${projectId}...`);

    // Fetch articles linked to posts of this project
    const postArticles = await prisma.postArticle.findMany({
        where: {
            post: { projectId: projectId },
            article: { keywords: { not: null, not: 'null' } }
        },
        include: {
            article: {
                select: { id: true, title: true, keywords: true }
            },
            post: {
                select: { id: true, title: true }
            }
        }
    });

    console.log(`Encontrados ${postArticles.length} artigos com palavras-chave.`);

    for (const pa of postArticles) {
        const keywordsRaw = pa.article.keywords;
        if (!keywordsRaw) continue;

        // Keywords are often separated by ; or ,
        const keywords = keywordsRaw
            .split(/[;,]/)
            .map(k => k.trim())
            .filter(k => k.length > 0 && k.toLowerCase() !== 'null');

        if (keywords.length === 0) continue;

        console.log(`Artigo: "${pa.article.title.substring(0, 50)}..." - Keywords: ${keywords.join(', ')}`);

        for (const keyword of keywords) {
            const slug = slugify(keyword);
            if (!slug) continue;

            // 1. Find or create tag
            const tag = await prisma.tag.upsert({
                where: { slug: slug },
                update: {},
                create: {
                    title: keyword.charAt(0).toUpperCase() + keyword.slice(1),
                    slug: slug,
                    projectId: projectId
                }
            });

            // 2. Associate tag with post
            await prisma.postTag.upsert({
                where: {
                    postId_tagId: {
                        postId: pa.postId,
                        tagId: tag.id
                    }
                },
                update: {},
                create: {
                    postId: pa.postId,
                    tagId: tag.id
                }
            });
        }
    }

    console.log('Migração de tags finalizada.');
    await prisma.$disconnect();
    await pool.end();
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // normalize unicode
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/[^\w\s-]/g, '') // remove non-word characters
    .replace(/[\s_-]+/g, '-') // replace space/underscore with dash
    .replace(/^-+|-+$/g, ''); // remove leading/trailing dashes
}

main().catch(console.error);
