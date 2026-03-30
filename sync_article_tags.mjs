import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const projectId = 'ckx7m9a0b0004w3e7r1t9y5u2';

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    // Pre-fetch all tags to speed up
    console.log('Carregando cache de tags...');
    const existingTags = await prisma.tag.findMany({
        where: { projectId: projectId }
    });
    const tagCache = new Map(existingTags.map(t => [t.slug, t.id]));
    const postTagCache = new Set();

    console.log(`Buscando artigos do projeto ${projectId}...`);

    // Fetch articles linked to posts of this project
    const postArticles = await prisma.postArticle.findMany({
        where: {
            post: { 
                projectId: projectId,
                tags: { none: {} }
            },
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

    let processed = 0;
    const CHUNK_SIZE = 50;

    for (let i = 0; i < postArticles.length; i += CHUNK_SIZE) {
        const chunk = postArticles.slice(i, i + CHUNK_SIZE);
        
        // 1. Prepare all keywords for this chunk
        const chunkData = chunk.map(pa => {
            if (!pa.article) return null;
            let keywordsRaw = pa.article.keywords;
            if (!keywordsRaw) return null;

            keywordsRaw = keywordsRaw.replace(/^(Palavras-chave|Keywords?|Mots-clés|Palabras clave)\s*[:\s-]*\s*/i, '');
            const keywords = keywordsRaw
                .split(/[;,]|\.\s+/)
                .map(k => k.trim().replace(/\.$/, ''))
                .filter(k => k.length > 2 && k.toLowerCase() !== 'null' && !/^(e|o|a|de|do|da|em)$/i.test(k));

            if (keywords.length === 0) return null;

            return {
                postId: pa.postId,
                keywords: keywords.map(k => ({ title: k, slug: slugify(k) })).filter(k => k.slug)
            };
        }).filter(Boolean);

        // 2. Pre-create/get all unique tags in this chunk (avoiding race conditions)
        const uniqueTagsInChunk = new Map();
        for (const item of chunkData) {
            for (const k of item.keywords) {
                if (!tagCache.has(k.slug)) {
                    uniqueTagsInChunk.set(k.slug, k.title);
                }
            }
        }

        // Upsert tags sequentially (or just carefully) to avoid races
        for (const [slug, title] of uniqueTagsInChunk.entries()) {
            try {
                const tag = await prisma.tag.upsert({
                    where: { slug: slug },
                    update: {},
                    create: {
                        title: title.charAt(0).toUpperCase() + title.slice(1),
                        slug: slug,
                        projectId: projectId
                    }
                });
                tagCache.set(slug, tag.id);
            } catch (err) {
                // If it failed because of a race, try fetching it
                const existing = await prisma.tag.findUnique({ where: { slug: slug } });
                if (existing) {
                    tagCache.set(slug, existing.id);
                } else {
                    console.error(`Falha ao criar tag ${slug}:`, err.message);
                }
            }
        }

        // 3. Associate tags with posts in parallel
        await Promise.all(chunkData.map(async (item) => {
            for (const k of item.keywords) {
                const tagId = tagCache.get(k.slug);
                if (!tagId) continue;

                const pairKey = `${item.postId}_${tagId}`;
                if (!postTagCache.has(pairKey)) {
                    try {
                        await prisma.postTag.upsert({
                            where: {
                                postId_tagId: {
                                    postId: item.postId,
                                    tagId: tagId
                                }
                            },
                            update: {},
                            create: {
                                postId: item.postId,
                                tagId: tagId
                            }
                        });
                        postTagCache.add(pairKey);
                    } catch (err) {
                        if (err.code !== 'P2003') {
                            // Silently ignore other errors or log if needed
                        }
                    }
                }
            }
        }));

        processed += chunk.length;
        if (processed % 100 === 0 || processed >= postArticles.length) {
            console.log(`Progresso: ${processed}/${postArticles.length} artigos...`);
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
