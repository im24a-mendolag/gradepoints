// Shared Prisma client + runner for standalone scripts (seed, one-off migrations).
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

// Same precedence as Next.js: .env.local (dev branch) wins over .env, so scripts
// run locally hit the dev database unless DATABASE_URL is set explicitly.
config({ path: [".env.local", ".env"], quiet: true });

export const prisma = new PrismaClient({
  adapter: new PrismaNeonHttp(process.env.DATABASE_URL!, {
    arrayMode: false,
    fullResults: true,
  }),
});

/** Runs a script's main function, exiting non-zero on failure and always disconnecting. */
export function runScript(main: () => Promise<void>) {
  console.log(`Database host: ${new URL(process.env.DATABASE_URL!).host}`);
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
