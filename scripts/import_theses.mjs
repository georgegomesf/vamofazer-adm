import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const file1 = '/hd2/george/Projetos/RedeFilosofica/data/datafilo_teses_e_dissertacoes_detalhes_2021_2023_export_2026-03-30_092551.csv';
const file2 = '/hd2/george/Projetos/RedeFilosofica/data/datafilo_teses_e_dissertacoes_detalhes_export_2026-03-30_090559.csv';

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    console.log('Lendo arquivos CSV...');
    const content1 = fs.readFileSync(file1, 'utf-8');
    const content2 = fs.readFileSync(file2, 'utf-8');

    const records1 = parse(content1, { columns: true, skip_empty_lines: true });
    const records2 = parse(content2, { columns: true, skip_empty_lines: true });

    console.log(`Arquivo 1: ${records1.length} registros`);
    console.log(`Arquivo 2: ${records2.length} registros`);

    const thesisMap = new Map();

    function getUniqueKey(record) {
        return `${record.titulo?.toLowerCase().trim()}|${record.autor?.toLowerCase().trim()}`;
    }

    // Processar Arquivo 1 (2021-2023) - Tem prioridade
    console.log('Processando Arquivo 1 (Principais)...');
    for (const record of records1) {
        if (!record.titulo || !record.autor) continue;
        const key = getUniqueKey(record);
        thesisMap.set(key, record);
    }

    // Processar Arquivo 2 - Apenas se não estiver no Arquivo 1
    console.log('Processando Arquivo 2 (Legado/Geral)...');
    let replacedCount = 0;
    for (const record of records2) {
        if (!record.titulo || !record.autor) continue;
        const key = getUniqueKey(record);
        if (thesisMap.has(key)) {
            replacedCount++;
            continue;
        }
        thesisMap.set(key, record);
    }

    console.log(`Total de teses únicas: ${thesisMap.size} (${replacedCount} duplicatas ignoradas do Arquivo 2)`);

    const recordsToImport = Array.from(thesisMap.values());
    let imported = 0;
    let errors = 0;

    console.log('Iniciando importação no banco de dados...');

    // Chunk size for progress tracking
    const CHUNK_SIZE = 100;
    
    for (let i = 0; i < recordsToImport.length; i++) {
        const record = recordsToImport[i];
        try {
            await prisma.thesis.create({
                data: {
                    title: record.titulo,
                    abstract: record.resumo,
                    authors: record.autor,
                    url: record.url,
                    keywords: record.palavras,
                    advisor: record.orientador,
                    university: record.ies_nome,
                    universityCity: record.uf_sg,
                    universityInitials: record.ies_sg,
                    program: record.programa,
                    programCode: record.programa_cd,
                    degree: record.grau,
                    line: record.linha,
                    year: parseInt(record.ano) || null,
                    datePublished: parseDate(record.defesa_f || record.defesa)
                }
            });
            imported++;
        } catch (err) {
            errors++;
            if (errors < 10) {
              console.error(`Erro ao importar "${record.titulo}":`, err.message);
            }
        }

        if ((i + 1) % CHUNK_SIZE === 0 || (i + 1) === recordsToImport.length) {
            console.log(`Progresso: ${i + 1}/${recordsToImport.length} processados...`);
        }
    }

    console.log(`\nImportação concluída!`);
    console.log(`Sucesso: ${imported}`);
    console.log(`Erros: ${errors}`);

    await prisma.$disconnect();
    await pool.end();
}

function parseDate(dateStr) {
    if (!dateStr || dateStr === 'null' || dateStr === '') return null;
    
    // Formato 2004-03-01 00:00:00
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    }

    // Formato 30MAR2023:00:00:00
    if (dateStr.includes(':')) {
        const months = {
            'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
            'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11,
            'AGO': 7, 'SET': 8, 'OUT': 9, 'DEZ': 11
        };
        const match = dateStr.match(/(\d{2})([A-Z]{3})(\d{4})/);
        if (match) {
            const day = parseInt(match[1]);
            const monthStr = match[2].toUpperCase();
            const year = parseInt(match[3]);
            const month = months[monthStr] !== undefined ? months[monthStr] : 0;
            return new Date(year, month, day);
        }
    }

    // Formato 01/03/2004
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            const d = new Date(year, month, day);
            return isNaN(d.getTime()) ? null : d;
        }
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

main().catch(console.error);
