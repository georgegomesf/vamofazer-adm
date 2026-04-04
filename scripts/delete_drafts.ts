import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    const res = await client.query('SELECT title, id FROM "Post" WHERE "publishedAt" IS NULL');
    const rowCount = res.rowCount ?? 0;
    console.log(`Found ${rowCount} drafts.`);
    res.rows.forEach(d => console.log(`- ${d.title} (${d.id})`));

    if (rowCount > 0) {
      const delRes = await client.query('DELETE FROM "Post" WHERE "publishedAt" IS NULL');
      console.log(`Deleted ${delRes.rowCount ?? 0} drafts.`);
    }
  } catch (err) {
    console.error("Error  executing query:", err);
  } finally {
    await client.end();
  }
}

main();
