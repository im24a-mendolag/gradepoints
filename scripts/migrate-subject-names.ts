import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {
  arrayMode: false,
  fullResults: true,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const historyResult = await prisma.$executeRaw`UPDATE "Grade" SET subject = 'GuP' WHERE subject = 'History'`;
  const scienceResult = await prisma.$executeRaw`UPDATE "Grade" SET subject = 'TuU' WHERE subject = 'Science'`;

  console.log(`Renamed ${historyResult} "History" grades → "GuP"`);
  console.log(`Renamed ${scienceResult} "Science" grades → "TuU"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
