import { prisma } from './src/lib/prisma'
import { put } from '@vercel/blob'
import fs from 'fs'

async function main() {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "cmmvobjo80001pcoifi6iawc3"
  console.log("Using projectId:", projectId);

  const imagePath = '/tmp/simphilo_banner.png'
  const fileData = fs.readFileSync(imagePath)
  const blob = await put('posts/iv-simphilo.png', fileData, {
     access: 'public',
     token: process.env.BLOB_READ_WRITE_TOKEN
  })
  console.log("Image uploaded:", blob.url);

  const title = "IV SIMPHILO & I ENPROFILO"
  const slug = "iv-simphilo-i-enprofilo-2026-" + Math.random().toString(36).substring(7)
  const content = "# IV SIMPHILO & I ENPROFILO\n\nO **IV Simpósio de Ensino de Filosofia (SIMPHILO)** e o **I Encontro do Programa de Pós-Graduação Profissional em Ensino de Filosofia (ENPROFILO/UERN)** são iniciativas do departamento de filosofia e do mestrado profissional em filosofia – PROF-FILO de Caicó, da Universidade do Estado do Rio Grande do Norte (UERN).\n\n### Sobre o Evento\nO SIMPHILO (quarta edição) e o ENPROFILO (primeira edição) têm como propósito articular a graduação e a pós-graduação em filosofia, reunindo pesquisadores, estudantes e educadores de todo o país para discutir problemas e propostas em torno do ensino de Filosofia na Educação Básica.\n\nO evento será semipresencial, com atividades no Campus Caicó da UERN e transmissões online via YouTube. A programação incluirá conferências, mesas-redondas, minicursos e mostras de materiais didáticos.\n\n**Data:** 27 a 30 de Abril de 2026\n**Local:** Campus Avançado de Caicó/UERN e Auditório Dom José de Medeiros Delgado.\n\n**Fonte:** [Site Oficial](https://www.even3.com.br/ivsimphilo-698918/)"

  const post = await prisma.post.create({
    data: {
      projectId,
      title,
      slug,
      content,
      imageUrl: blob.url,
      publishedAt: null,
      categories: { create: { category: { connectOrCreate: { where: { slug: "eventos" }, create: { title: "Eventos", slug: "eventos", projectId } } } } }
    }
  })

  // 1. EVENTO PRINCIPAL
  const mainEvent = await prisma.action.create({
    data: {
      projectId,
      title: "IV SIMPHILO & I ENPROFILO",
      type: "Evento",
      startDate: new Date("2026-04-27T19:00:00Z"),
      endDate: new Date("2026-04-30T21:30:00Z"),
      imageUrl: blob.url,
      url: "/p/" + post.slug
    }
  })
  await prisma.postAction.create({ data: { postId: post.id, actionId: mainEvent.id } })

  // 2. ATIVIDADES
  const activities = [
    { title: "Minicurso: Ensino de filosofia e literatura", type: "Atividade", start: "2026-04-28T14:00:00Z", end: "2026-04-28T17:00:00Z" },
    { title: "Minicurso: Produtos Educacionais em ensino de filosofia", type: "Atividade", start: "2026-04-28T14:00:00Z", end: "2026-04-28T17:00:00Z" },
    { title: "Minicurso: Pedagogia da imagem", type: "Atividade", start: "2026-04-29T08:00:00Z", end: "2026-04-29T11:00:00Z" },
    { title: "Mesa-redonda: A proposta de doutorado do PROF-FILO", type: "Atividade", start: "2026-04-30T14:00:00Z", end: "2026-04-30T16:00:00Z" },
    { title: "Divulgação de Horários", type: "Prazo", start: "2026-04-22T08:00:00Z", end: null },
  ]

  for (const act of activities) {
    const res = await prisma.action.create({
      data: {
        projectId,
        title: act.title,
        type: act.type,
        startDate: new Date(act.start),
        endDate: act.end ? new Date(act.end) : null,
        url: "/p/" + post.slug
      }
    })
    await prisma.postAction.create({ data: { postId: post.id, actionId: res.id } })
  }

  console.log("SUCCESS_POST_ID:" + post.id)
  process.exit(0)
}
main().catch(err => { console.error(err); process.exit(1) })
