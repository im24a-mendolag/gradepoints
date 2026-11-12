import { prisma, runScript } from "./script-client";

runScript(async () => {
  const result = await prisma.$executeRaw`
    UPDATE "Grade"
    SET
      value  = ROUND(value::numeric,  3),
      weight = ROUND(weight::numeric, 3)
    WHERE
      value  != ROUND(value::numeric,  3)
      OR weight != ROUND(weight::numeric, 3)
  `;
  console.log(`Updated ${result} grade(s).`);
});
