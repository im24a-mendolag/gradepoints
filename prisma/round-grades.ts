import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {
  arrayMode: false,
  fullResults: true,
});
const prisma = new PrismaClient({ adapter });

async function main() {
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
