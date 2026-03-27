import { prisma } from './src/lib/prisma'
import { put } from '@vercel/blob'
import fs from 'fs'

async function main() {
  console.log("STARTING FINAL TRY...");
  try {
      const projectId = "cmmvobjo80001pcoifi6iawc3"
      const imagePath = '/tmp/simphilo_banner.png'
      const fileData = fs.readFileSync(imagePath)
      const blob = await put('posts/iv-simphilo.png', fileData, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: true
      })
      console.log("Image:", blob.url);

      const post = await prisma.post.create({
        data: {
          projectId,
          title: "IV SIMPHILO & I ENPROFILO",
          slug: "iv-simp-2026-" + Date.now(),
          content: "# IV SIMPHILO & I ENPROFILO\n\nO **IV Simpósio de Ensino de Filosofia (SIMPHILO)** e o **I Encontro do Programa de Pós-Graduação Profissional em Ensino de Filosofia (ENPROFILO/UERN)** ocorrerão de 27 a 30 de abril de 2026.\n\n### Sobre o Evento\nO evento será semipresencial em Caicó/RN e online via YouTube.\n\n**Fonte:** [Site Oficial](https://www.even3.com.br/ivsimphilo-698918/)",
          imageUrl: blob.url
        }
      });
      console.log("Post ID:", post.id);

      const activities = [
        { title: "IV SIMPHILO & I ENPROFILO", type: "Evento", start: "2026-04-27T19:00:00Z", end: "2026-04-30T21:30:00Z" },
        { title: "Minicurso: Ensino de filosofia e literatura", type: "Atividade", start: "2026-04-28T14:00:00Z", end: "2026-04-28T17:00:00Z" },
        { title: "Minicurso: Produtos Educacionais em ensino de filosofia", type: "Atividade", start: "2026-04-28T14:00:00Z", end: "2026-04-28T17:00:00Z" },
        { title: "Minicurso: Pedagogia da imagem", type: "Atividade", start: "2026-04-29T08:00:00Z", end: "2026-04-29T11:00:00Z" },
        { title: "Mesa-redonda: A proposta de doutorado do PROF-FILO", type: "Atividade", start: "2026-04-30T14:00:00Z", end: "2026-04-30T16:00:00Z" },
        { title: "Divulgação de Horários", type: "Prazo", start: "2026-04-22T08:00:00Z", end: null },
      ]

      for (const act of activities) {
        const action = await prisma.action.create({
          data: {
            projectId,
            title: act.title,
            type: act.type,
            startDate: new Date(act.start),
            endDate: act.end ? new Date(act.end) : null,
            imageUrl: blob.url,
            url: "/p/" + post.slug
          }
        });
        await prisma.postAction.create({ data: { postId: post.id, actionId: action.id } });
      }
      console.log("DONE");
  } catch(e) { console.error("FATAL ERROR", e) }
}
main()
