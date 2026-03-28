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
  console.log("Starting mass activity generation for ALL projects...");
  
  const projects = await prisma.project.findMany();
  
  for (const project of projects) {
      console.log(`\nProcessing Project: ${project.name} (${project.id})...`);
      
      const existingActivities = await prisma.activity.findMany({
        where: { projectId: project.id }
      });
      
      const checkExists = (type: string, key: string, val: string) => {
        return existingActivities.some(act => 
            act.type === type && 
            act.metadata && 
            typeof act.metadata === 'object' && 
            (act.metadata as any)[key] === val
        );
      };

      const posts = await prisma.post.findMany({
        where: { projectId: project.id, publishedAt: { not: null } },
        include: { actions: true, attachments: true }
      });
      
      console.log(`Found ${posts.length} published posts.`);
      let countP = 0, countA = 0, countT = 0;

      for (const post of posts) {
         const postUrl = `/p/${post.slug}`;
         
         if (!checkExists("POST_PUBLISHED", "postId", post.id)) {
             await prisma.activity.create({
                data: {
                   type: "POST_PUBLISHED",
                   title: post.title,
                   description: post.summary ? (post.summary.length > 200 ? post.summary.substring(0, 197) + "..." : post.summary) : "Uma nova postagem foi publicada.",
                   url: postUrl,
                   projectId: project.id,
                   userId: post.createdBy || undefined,
                   createdAt: post.publishedAt || post.createdAt,
                   metadata: { postId: post.id, imageUrl: post.imageUrl }
                }
             });
             countP++;
         }
         
         for (const pa of post.actions) {
             if (!checkExists("ACTION_LINKED", "actionId", pa.actionId)) {
                 const action = await prisma.action.findUnique({ where: { id: pa.actionId }});
                 if (!action) continue;
                 await prisma.activity.create({
                    data: {
                        type: "ACTION_LINKED",
                        title: `${action.title}`,
                        description: `O item foi vinculada à postagem "${post.title}".`,
                        url: postUrl,
                        projectId: project.id,
                        userId: post.createdBy || undefined,
                        createdAt: post.publishedAt || post.createdAt, 
                        metadata: { postId: post.id, actionId: action.id }
                    }
                 });
                 countA++;
             }
         }
         
         for (const patt of post.attachments) {
             if (!checkExists("ATTACHMENT_LINKED", "attachmentId", patt.attachmentId)) {
                 const attachment = await prisma.attachment.findUnique({ where: { id: patt.attachmentId }});
                 if (!attachment) continue;
                 await prisma.activity.create({
                     data: {
                         type: "ATTACHMENT_LINKED",
                         title: `${attachment.title}`,
                         description: `O anexo foi vinculado à postagem "${post.title}".`,
                         url: postUrl,
                         projectId: project.id,
                         userId: post.createdBy || undefined,
                         createdAt: post.publishedAt || post.createdAt,
                         metadata: { postId: post.id, attachmentId: attachment.id }
                     }
                 });
                 countT++;
             }
         }
      }
      console.log(`Created: ${countP} posts, ${countA} actions, ${countT} attachments.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
