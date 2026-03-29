import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as readline from 'readline';

const csvPath = '/hd2/george/Projetos/RedeFilosofica/data/datafilo_edicoes_export_2026-03-28_160720.csv';

function extractFromTitle(title: string) {
  let volume: string | null = null;
  let number: string | null = null;
  let year: number | null = null;

  // Extract year pattern: (YYYY)
  const mxYear = title.match(/\((\d{4})\)/);
  if (mxYear && mxYear[1]) {
    year = parseInt(mxYear[1], 10);
  }

  // Extract volume pattern: v. XX
  const mxVol = title.match(/v\.\s*(\d+)/i);
  if (mxVol && mxVol[1]) {
    volume = mxVol[1];
  }

  // Extract number pattern: n. XX or n. esp / etc
  const mxNum = title.match(/n\.\s*([\w]+)/i);
  if (mxNum && mxNum[1]) {
    number = mxNum[1];
  }

  return { volume, number, year };
}

async function main() {
  console.log('Fetching issues from database...');
  const issues = await prisma.issue.findMany();
  console.log(`Found ${issues.length} issues in database.`);

  let updatedCount = 0;

  for (const issue of issues) {
    if (issue.volume && issue.number && issue.year) {
      // Data already filled, skip
      continue;
    }

    const title = issue.title;
    const { volume, number, year } = extractFromTitle(title);

    const newVolume = issue.volume || volume;
    const newNumber = issue.number || number;
    const newYear = issue.year || year;

    if (newVolume !== issue.volume || newNumber !== issue.number || newYear !== issue.year) {
      try {
        await prisma.issue.update({
          where: { id: issue.id },
          data: {
            volume: newVolume,
            number: newNumber,
            year: newYear,
          },
        });
        updatedCount++;
        console.log(`Updated issue ${issue.id} -> v: ${newVolume}, n: ${newNumber}, year: ${newYear}`);
      } catch (err) {
        console.error(`Error updating issue ${issue.id}:`, err);
      }
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} issues based on their titles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
