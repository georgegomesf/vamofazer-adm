import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PROJECT_ID = 'ckx7m9a0b0004w3e7r1t9y5u2';
const TESE_CAT_ID = 'cmnd9w0fb0000etoi7rnh392k';
const DISSERTACAO_CAT_ID = 'cmnd9w0sc0001etoi4e6jeg4x';

function createSlug(text) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Clean up diacritics
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function main() {
    console.log("Iniciando importação em massa de Teses para Postagens...");

    // Fetch all theses
    const theses = await prisma.thesis.findMany();
    console.log(`Total de teses encontradas: ${theses.length}`);

    let createdCount = 0;

    // Map to keep track of slugs to avoid collisions
    const usedSlugs = new Set();
    // Pre-populate with existing slugs in this project
    const existingPosts = await prisma.post.findMany({
        where: { projectId: PROJECT_ID },
        select: { slug: true }
    });
    existingPosts.forEach(p => usedSlugs.add(p.slug));

    for (const thesis of theses) {
        // Determine category
        const catId = (thesis.degree || '').toUpperCase().includes('DOUTORADO') ? TESE_CAT_ID : DISSERTACAO_CAT_ID;

        // Generate slug
        let baseSlug = createSlug(thesis.title);
        if (!baseSlug) baseSlug = 'sem-titulo';
        let slug = baseSlug;
        let counter = 2;
        while (usedSlugs.has(slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        usedSlugs.add(slug);

        // Build content (Markdown)
        const content = `
${thesis.abstract || 'Sem resumo disponível.'}

---

**Autoria:** ${thesis.authors}  
${thesis.advisor ? `**Orientação:** ${thesis.advisor}  \n` : ''}**Grau:** ${thesis.degree}  
**Programa:** ${thesis.program}  
**Instituição:** ${thesis.university} (${thesis.universityInitials || ''})  
**Ano:** ${thesis.year || 'N/A'}  

${thesis.url ? `Fonte: Banco de Teses e Dissertações - CAPES. Mais detalhes em: [${thesis.url}](${thesis.url})` : ''}
        `;

        // Determine publishedAt with year fallback
        let publishedAt = thesis.datePublished;
        if (!publishedAt && thesis.year) {
            publishedAt = new Date(thesis.year, 0, 1);
        }
        if (!publishedAt) publishedAt = new Date();

        try {
            await prisma.post.create({
                data: {
                    title: thesis.title,
                    slug: slug,
                    summary: thesis.abstract ? (thesis.abstract.slice(0, 250) + '...') : '',
                    content: content,
                    authorName: thesis.authors,
                    projectId: PROJECT_ID,
                    publishedAt: publishedAt,
                    categories: {
                        create: {
                            categoryId: catId
                        }
                    },
                    postTheses: {
                        create: {
                            thesisId: thesis.id
                        }
                    }
                }
            });
            createdCount++;
            if (createdCount % 100 === 0) {
                console.log(`Progresso: ${createdCount}/${theses.length} postagens criadas...`);
            }
        } catch (error) {
            console.error(`Erro ao criar postagem para a tese "${thesis.title}":`, error.message);
        }
    }

    console.log(`Importação concluída! Total de postagens criadas: ${createdCount}/${theses.length}`);
}

main().finally(() => prisma.$disconnect());
