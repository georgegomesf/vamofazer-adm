"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Journals
export async function getJournals() {
  return await prisma.journal.findMany({
    orderBy: { title: "asc" },
    include: { _count: { select: { issues: true } } },
  });
}

export async function getJournal(id: string) {
  return await prisma.journal.findUnique({
    where: { id },
    include: { issues: true },
  });
}

export async function upsertJournal(data: any) {
  const { id, ...rest } = data;
  if (!id) return await prisma.journal.create({ data: rest });
  
  const journal = await prisma.journal.upsert({
    where: { id },
    update: rest,
    create: { id, ...rest },
  });
  
  revalidatePath("/adm/journals");
  return journal;
}

export async function deleteJournal(id: string) {
  await prisma.journal.delete({ where: { id } });
  revalidatePath("/adm/journals");
}

// Issues
export async function getIssues({ page = 1, pageSize = 10, search = "" } = {}) {
  const where: any = search ? {
    OR: [
      { title: { contains: search, mode: "insensitive" } },
      { journal: { title: { contains: search, mode: "insensitive" } } },
    ]
  } : {};

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      orderBy: { datePublished: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { 
        journal: { select: { title: true } },
        _count: { select: { articles: true } }
      },
    }),
    prisma.issue.count({ where })
  ]);

  return { issues, total };
}

export async function getIssue(id: string) {
  return await prisma.issue.findUnique({
    where: { id },
    include: { journal: true, articles: true },
  });
}

export async function upsertIssue(data: any) {
  const { id, ...rest } = data;
  if (!id) return await prisma.issue.create({ data: rest });

  const issue = await prisma.issue.upsert({
    where: { id },
    update: rest,
    create: { id, ...rest },
  });
  
  revalidatePath("/adm/issues");
  return issue;
}

export async function deleteIssue(id: string) {
  await prisma.issue.delete({ where: { id } });
  revalidatePath("/adm/issues");
}

// Articles
export async function getArticles({ page = 1, pageSize = 10, search = "" } = {}) {
  const where: any = search ? {
    OR: [
      { title: { contains: search, mode: "insensitive" } },
      { authors: { contains: search, mode: "insensitive" } },
      { issue: { title: { contains: search, mode: "insensitive" } } },
      { issue: { journal: { title: { contains: search, mode: "insensitive" } } } },
    ]
  } : {};

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { datePublished: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { 
        issue: { 
          select: { 
            title: true,
            journal: { select: { title: true } }
          } 
        } 
      },
    }),
    prisma.article.count({ where })
  ]);

  return { articles, total };
}

export async function getArticle(id: string) {
  return await prisma.article.findUnique({
    where: { id },
    include: { issue: { include: { journal: true } } },
  });
}

export async function upsertArticle(data: any) {
  const { id, ...rest } = data;
  if (!id) return await prisma.article.create({ data: rest });

  const article = await prisma.article.upsert({
    where: { id },
    update: rest,
    create: { id, ...rest },
  });
  
  revalidatePath("/adm/articles");
  return article;
}

export async function deleteArticle(id: string) {
  await prisma.article.delete({ where: { id } });
  revalidatePath("/adm/articles");
}

// Theses and Dissertations
export async function getTheses({ page = 1, pageSize = 10, search = "" } = {}) {
  const where: any = search ? {
    OR: [
      { title: { contains: search, mode: "insensitive" } },
      { authors: { contains: search, mode: "insensitive" } },
      { university: { contains: search, mode: "insensitive" } },
      { program: { contains: search, mode: "insensitive" } },
    ]
  } : {};

  const [theses, total] = await Promise.all([
    prisma.thesis.findMany({
      where,
      orderBy: { datePublished: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.thesis.count({ where })
  ]);

  return { theses, total };
}

export async function getThesis(id: string) {
  return await prisma.thesis.findUnique({
    where: { id },
  });
}

export async function upsertThesis(data: any) {
  const { id, ...rest } = data;
  if (!id) return await prisma.thesis.create({ data: rest });

  const thesis = await prisma.thesis.upsert({
    where: { id },
    update: rest,
    create: { id, ...rest },
  });
  
  revalidatePath("/adm/theses");
  return thesis;
}

export async function deleteThesis(id: string) {
  await prisma.thesis.delete({ where: { id } });
  revalidatePath("/adm/theses");
}
