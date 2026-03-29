import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { prisma } from '../src/lib/prisma';

const DATA_DIR = '/hd2/george/Projetos/RedeFilosofica/data';

const parseDate = (dateStr: string | null | undefined) => {
  if (!dateStr || dateStr.trim() === '') return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

async function importData() {
  try {
    console.log('--- Starting Library Import (Optimized) ---');

    // 1. Import Journals (Revistas)
    console.log('Importing Journals (batch)...');
    const journalsFile = fs.readFileSync(path.join(DATA_DIR, 'datafilo_revistas_export_2026-03-28_160614.csv'), 'utf8');
    const journalsDataRaw = parse(journalsFile, { columns: true, skip_empty_lines: true });

    const journalsToCreate = journalsDataRaw.map((row: any) => ({
      id: row.id,
      title: row.titulo,
      link: row.link,
      description: row.descricao,
    }));

    await prisma.journal.createMany({
      data: journalsToCreate,
      skipDuplicates: true,
    });
    console.log(`Processed ${journalsToCreate.length} journals.`);

    // 2. Import Issues (Edições)
    console.log('Importing Issues (batch)...');
    const issuesFile = fs.readFileSync(path.join(DATA_DIR, 'datafilo_edicoes_export_2026-03-28_160720.csv'), 'utf8');
    const issuesDataRaw = parse(issuesFile, { columns: true, skip_empty_lines: true });

    const issuesToCreate = issuesDataRaw.map((row: any) => ({
      id: row.id,
      journalId: row.revista_id,
      title: row.titulo,
      volume: row.volume || null,
      number: row.numero || null,
      year: row.ano ? parseInt(row.ano) : null,
      description: row.descricao || null,
      datePublished: parseDate(row.data_publicacao),
      link: row.link || null,
      coverUrl: row.capa || null,
    }));

    const BATCH_SIZE = 5000;
    for (let i = 0; i < issuesToCreate.length; i += BATCH_SIZE) {
      const batch = issuesToCreate.slice(i, i + BATCH_SIZE);
      await prisma.issue.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`Processed ${Math.min(i + BATCH_SIZE, issuesToCreate.length)} issues...`);
    }

    // 3. Import Articles
    console.log('Importing Articles (Join batch)...');
    const articlesExportFile = fs.readFileSync(path.join(DATA_DIR, 'datafilo_artigos_export_2026-03-28_161431.csv'), 'utf8');
    const articlesExportData = parse(articlesExportFile, { columns: true, skip_empty_lines: true });

    const articlesDetailsFile = fs.readFileSync(path.join(DATA_DIR, 'datafilo_artigos_detalhes_export_2026-03-28_161838.csv'), 'utf8');
    const articlesDetailsData = parse(articlesDetailsFile, { columns: true, skip_empty_lines: true });

    const detailsMap = new Map();
    for (const detail of articlesDetailsData) {
      detailsMap.set(detail.url, detail);
    }

    const articlesToCreate = articlesExportData.map((row: any) => {
      const details = detailsMap.get(row.link);
      return {
        id: row.id,
        issueId: row.edicao_id,
        title: row.titulo,
        abstract: row.resumo || details?.resumo || null,
        authors: row.autor || details?.autor || null,
        doi: row.doi || details?.doi || null,
        url: row.link || details?.url || null,
        pages: row.paginas || (details?.pagina_inicial ? `${details.pagina_inicial}-${details.pagina_final}` : null),
        language: row.idioma || null,
        datePublished: parseDate(row.data_publicacao || details?.data_publicacao),
        keywords: row.palavras || details?.palavras || null,
        bibliography: row.referencias || null,
      };
    });

    for (let i = 0; i < articlesToCreate.length; i += BATCH_SIZE) {
      const batch = articlesToCreate.slice(i, i + BATCH_SIZE);
      await prisma.article.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`Processed ${Math.min(i + BATCH_SIZE, articlesToCreate.length)} articles...`);
    }

    console.log('--- Migration Complete ---');
  } catch (error: any) {
    if (error.code) console.error('Prisma Error Code:', error.code);
    if (error.meta) console.error('Prisma Meta Details:', JSON.stringify(error.meta, null, 2));
    console.error('Migration failed:', error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
