import * as dotenv from 'dotenv';
import { join } from 'path';
dotenv.config({ path: join(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  if (!projectId) {
     console.error("Missing NEXT_PUBLIC_PROJECT_ID in environment.");
     return;
  }
  
  const existingActivities = await prisma.activity.findMany({
    where: { projectId }
  });
  const posts = await prisma.post.findMany({
    where: { projectId, publishedAt: { not: null } },
    include: { actions: true, attachments: true }
  });
  
  let postsMissing = 0;
  let actionsMissing = 0;
  let attachmentsMissing = 0;

  for (const post of posts) {
     const hasPostAct = existingActivities.some(act => 
        act.type === "POST_PUBLISHED" && 
        act.metadata && typeof act.metadata === 'object' && 
        (act.metadata as any).postId === post.id
     );
     if (!hasPostAct) postsMissing++;

     for (const pa of post.actions) {
         const hasActionAct = existingActivities.some(act => 
            act.type === "ACTION_LINKED" && 
            act.metadata && typeof act.metadata === 'object' && 
            (act.metadata as any).postId === post.id && (act.metadata as any).actionId === pa.actionId
         );
         if (!hasActionAct) actionsMissing++;
     }

     for (const patt of post.attachments) {
         const hasAttAct = existingActivities.some(act => 
            act.type === "ATTACHMENT_LINKED" && 
            act.metadata && typeof act.metadata === 'object' && 
            (act.metadata as any).postId === post.id && (act.metadata as any).attachmentId === patt.attachmentId
         );
         if (!hasAttAct) attachmentsMissing++;
     }
  }

  console.log(`REPORT: ${postsMissing} posts missing, ${actionsMissing} actions missing, ${attachmentsMissing} attachments missing.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
