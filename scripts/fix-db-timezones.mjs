
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const fieldsByModel = {
    account: ['createdAt', 'updatedAt'],
    mobileAuthSession: ['expires', 'createdAt'],
    passwordResetToken: ['expires'],
    project: ['createdAt', 'updatedAt'],
    session: ['expires', 'createdAt', 'updatedAt'],
    user: ['emailVerified', 'createdAt', 'updatedAt'],
    userProject: ['createdAt'],
    verificationToken: ['expires'],
    interestList: ['createdAt', 'updatedAt'],
    userInterest: ['createdAt'],
    listSubscription: ['createdAt'],
    post: ['createdAt', 'updatedAt'],
    category: ['createdAt'],
    tag: ['createdAt'],
    mainMenu: ['createdAt'],
    menuItem: ['createdAt'],
    attachment: ['createdAt', 'updatedAt'],
    action: ['startDate', 'endDate', 'createdAt', 'updatedAt'],
    anpofEvent: ['createdAt', 'updatedAt'],
    activity: ['createdAt'],
    activityView: ['viewedAt'],
    journal: ['createdAt', 'updatedAt'],
    issue: ['createdAt', 'updatedAt'],
    article: ['createdAt', 'updatedAt'],
    thesis: ['createdAt', 'updatedAt']
  };

  const offset = 3 * 60 * 60 * 1000; // 3 hours

  for (const model in fieldsByModel) {
    const fields = fieldsByModel[model];
    if (fields.length === 0) continue;
    
    console.log(`Processing ${model}...`);
    
    const records = await prisma[model].findMany({
      select: {
        id: true,
        ...fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}),
        ...(model === 'account' ? { provider: true, providerAccountId: true } : {}),
        ...(model === 'userProject' ? { userId: true, projectId: true } : {}),
        ...(model === 'verificationToken' ? { identifier: true, token: true } : {}),
        ...(model === 'session' ? { sessionToken: true } : {}),
        ...(model === 'mobileAuthSession' ? { sessionId: true } : {}),
      }
    });

    for (const record of records) {
      const data = {};
      let hasChanges = false;
      
      for (const field of fields) {
        if (record[field]) {
          const oldDate = new Date(record[field]);
          const newDate = new Date(oldDate.getTime() - offset);
          data[field] = newDate;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        let where = record.id ? { id: record.id } : null;
        if (model === 'account') where = { provider_providerAccountId: { provider: record.provider, providerAccountId: record.providerAccountId } };
        if (model === 'userProject') where = { userId_projectId: { userId: record.userId, projectId: record.projectId } };
        if (model === 'verificationToken') where = { identifier_token: { identifier: record.identifier, token: record.token } };
        if (model === 'session') where = { sessionToken: record.sessionToken };
        if (model === 'mobileAuthSession' && !record.id) where = { sessionId: record.sessionId };

        if (!where) continue;

        try {
          await prisma[model].update({
            where,
            data
          });
        } catch (err) {
          console.error(`Error updating record in ${model}:`, err.message);
        }
      }
    }
    console.log(`Done processing ${records.length} records in ${model}.`);
  }

  console.log("Database alignment finished.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
