import { prisma, runScript } from "../prisma/script-client";

runScript(async () => {
  const historyResult = await prisma.$executeRaw`UPDATE "Grade" SET subject = 'GuP' WHERE subject = 'History'`;
  const scienceResult = await prisma.$executeRaw`UPDATE "Grade" SET subject = 'TuU' WHERE subject = 'Science'`;

  console.log(`Renamed ${historyResult} "History" grades → "GuP"`);
  console.log(`Renamed ${scienceResult} "Science" grades → "TuU"`);
});
