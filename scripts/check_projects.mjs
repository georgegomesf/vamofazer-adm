import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const project = await prisma.project.findUnique({
        where: { id: 'ckx7m9a0b0004w3e7r1t9y5u2' },
        select: { id: true, name: true }
    });
    console.log("Project:", project);

    const projectAnpof = await prisma.project.findUnique({
        where: { id: 'cmmvobjo80001pcoifi6iawc3' },
        select: { id: true, name: true }
    });
    console.log("Project ANPOF:", projectAnpof);
}

main().finally(() => prisma.$disconnect());
