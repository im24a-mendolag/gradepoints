-- Adds Grade.percent: a fixed share (0–100) of the subject's grade (per semester; per module for BZZ).
-- Additive and nullable: existing grades keep percent = NULL and stay weight-based.
-- Apply to each database BEFORE deploying code that reads the column
-- (Prisma selects every column, so queries fail until it exists).
--
-- Not applied with `prisma db push`: that would also drop the unrelated
-- `flyway_schema_history` table present in the Neon database.
ALTER TABLE "Grade" ADD COLUMN IF NOT EXISTS "percent" DOUBLE PRECISION;
