import { prisma } from './src/lib/prisma';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const postId = 'cmne2w9ge000004lb2a0gqksx';
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    console.error("Post not found!");
    return;
  }

  const projectId = post.projectId;

  const events = [
    { date: '2026-04-02', title: '“Abertura normativa” e Cap. 1 e 2 (p. 31-92)' },
    { date: '2026-04-16', title: 'Cap. 3 (p. 93-123)' },
    { date: '2026-04-30', title: 'Excurso I (p. 125-160)' },
    { date: '2026-05-14', title: '“Interlúdio histórico” e Cap. 4 e 5 (p. 163-218)' },
    { date: '2026-05-28', title: 'Cap. 6 (219-257)' },
    { date: '2026-06-11', title: 'Excurso II e Cap. 7 (p. 259-322)' },
    { date: '2026-06-25', title: 'Cap. 8 e 9 (p. 323-384)' },
  ];

  for (const event of events) {
    const action = await prisma.action.create({
      data: {
        title: event.title,
        type: 'Atividade',
        startDate: new Date(`${event.date}T09:00:00.000Z`),
        endDate: new Date(`${event.date}T11:30:00.000Z`),
        organizer: 'UFSC',
        url: 'https://ppgfil.posgrad.ufsc.br/2026/03/26/divulgacao-grupo-de-estudos-em-teoria-critica/',
        projectId: projectId,
      }
    });

    await prisma.postAction.create({
      data: {
        postId: postId,
        actionId: action.id
      }
    });

    console.log(`Created action ${action.id} and linked to post.`);
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
