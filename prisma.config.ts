import { config } from "dotenv";
import path from "node:path";

// Same precedence as Next.js: .env.local (dev branch) wins over .env.
config({ path: [".env.local", ".env"], quiet: true });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
