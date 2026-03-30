import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const projectId = 'ckx7m9a0b0004w3e7r1t9y5u2';
const journalId = '49'; // Kínesis

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    console.log(`Buscando postagens de edições da revista Kínesis no projeto ${projectId}...`);

    const postIssues = await prisma.postIssue.findMany({
        where: {
            post: { projectId: projectId },
            issue: { journalId: journalId, coverUrl: { not: null, not: '' } }
        },
        include: {
            issue: {
                select: { id: true, title: true, coverUrl: true }
            },
            post: {
                select: { id: true, title: true, imageUrl: true }
            }
        }
    });

    console.log(`Encontradas ${postIssues.length} postagens de edições com capas disponíveis.`);

    let updatedCount = 0;
    for (const pi of postIssues) {
        if (!pi.issue || !pi.post) continue;
        if (pi.post.imageUrl === pi.issue.coverUrl) continue; // Already updated

        try {
            await prisma.post.update({
                where: { id: pi.postId },
                data: { imageUrl: pi.issue.coverUrl }
            });
            updatedCount++;
            if (updatedCount % 50 === 0) {
                console.log(`Atualizadas: ${updatedCount}/${postIssues.length}...`);
            }
        } catch (err) {
            console.error(`Erro ao atualizar post ${pi.postId}:`, err.message);
        }
    }

    console.log(`Fim. Total de postagens atualizadas: ${updatedCount}`);
    await prisma.$disconnect();
    await pool.end();
}

main().catch(console.error);
