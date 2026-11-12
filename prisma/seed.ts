import bcryptjs from "bcryptjs";
import { prisma, runScript } from "./script-client";
import { randomDate, randomGrade, kshSpecs, bzzSpecs, type GradeSpec } from "./seed-data";

// ─── Seeding ────────────────────────────────────────────────────

async function createGrades(userId: string, school: "KSH" | "BZZ", specs: GradeSpec[]) {
  for (const { subject, semester, description, value, date } of specs) {
    await prisma.grade.create({
      data: {
        value: value ?? randomGrade(),
        weight: 1,
        description,
        date: date ?? randomDate(),
        semester,
        subject,
        school,
        userId,
      },
    });
  }
  return specs.length;
}

async function seedSchool(userId: string, school: "KSH" | "BZZ", specs: () => GradeSpec[]) {
  const existing = await prisma.grade.findFirst({ where: { userId, school } });
  if (existing) {
    console.log(`${school} grades already exist, skipping.`);
    return;
  }
  const count = await createGrades(userId, school, specs());
  console.log(`Created ${count} ${school} grades.`);
}

// ─── Seed ───────────────────────────────────────────────────────

runScript(async () => {
  console.log("Seeding database...\n");

  const hashedPassword = await bcryptjs.hash("demo123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@gradepoints.ch" },
    update: { emailVerified: true, password: hashedPassword }, // keep the documented demo login working
    create: {
      name: "Demo Student",
      email: "demo@gradepoints.ch",
      password: hashedPassword,
      emailVerified: true,
    },
  });
  console.log("Demo user ready: demo@gradepoints.ch / demo123");

  await seedSchool(user.id, "KSH", kshSpecs);
  await seedSchool(user.id, "BZZ", bzzSpecs);

  console.log("\nDone!");
});
