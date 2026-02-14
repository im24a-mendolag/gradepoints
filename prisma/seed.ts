import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import bcryptjs from "bcryptjs";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {
  arrayMode: false,
  fullResults: true,
});
const prisma = new PrismaClient({ adapter });

// ─── BZZ module config ──────────────────────────────────────────

const BZZ_NORMAL_MODULES = [
  "431", "117", "319", "162", "114", "164", "293", "231",
  "320", "165", "322", "122", "254", "346", "426", "347",
  "323", "450", "306", "183", "324", "321", "241", "245",
];

const BZZ_UK_MODULES = ["187", "106", "294", "295", "210", "335", "223"];

const BZZ_IPA = "IPA";

// ─── KSH semester config ────────────────────────────────────────

const SEMESTER_SUBJECTS: Record<number, string[]> = {
  1: ["German", "French", "English", "Math", "WR", "FrW", "History"],
  2: ["German", "French", "English", "Math", "WR", "FrW", "History"],
  3: ["German", "French", "English", "Math", "WR", "FrW", "History", "Science", "IDAF"],
  4: ["German", "French", "English", "Math", "WR", "FrW", "History", "Science", "IDAF"],
  5: ["German", "French", "English", "Math", "WR", "FrW", "Science"],
  6: ["German", "French", "English", "Math", "WR", "FrW", "Science", "IDPA"],
};

const FINALS_ENTRIES = [
  "German (Oral)", "German (Written)",
  "French (Oral)", "French (Written)",
  "English (Oral)", "English (Written)",
  "Math (Written)", "WR (Written)", "FrW (Written)",
];

// ─── Helpers ────────────────────────────────────────────────────

function randomGrade(): number {
  const grades = [3.0, 3.5, 4.0, 4.0, 4.5, 4.5, 4.5, 5.0, 5.0, 5.0, 5.5, 5.5, 6.0];
  return grades[Math.floor(Math.random() * grades.length)];
}

function randomDate(startYear = 2024, endYear = 2026): Date {
  const start = new Date(startYear, 8, 1);
  const end = new Date(endYear, 1, 14);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ─── Seed ───────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database...\n");

  // 1. Upsert demo user
  const hashedPassword = await bcryptjs.hash("demo123", 12);
  let user = await prisma.user.findUnique({ where: { email: "demo@gradepoints.ch" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Demo Student",
        email: "demo@gradepoints.ch",
        password: hashedPassword,
        emailVerified: true,
      },
    });
    console.log("Created demo user: demo@gradepoints.ch / demo123");
  } else {
    console.log("Demo user already exists.");
  }

  // 2. Check if grades already exist for this user
  const existingKsh = await prisma.grade.findFirst({ where: { userId: user.id, school: "KSH" } });
  const existingBzz = await prisma.grade.findFirst({ where: { userId: user.id, school: "BZZ" } });

  // 3. Seed KSH grades
  if (!existingKsh) {
    let kshCount = 0;

    // Semester grades (1-6)
    for (const [sem, subjects] of Object.entries(SEMESTER_SUBJECTS)) {
      const semester = parseInt(sem);
      for (const subject of subjects) {
        const numGrades = Math.random() < 0.3 ? 2 : Math.random() < 0.7 ? 3 : 4;
        for (let i = 0; i < numGrades; i++) {
          await prisma.grade.create({
            data: {
              value: randomGrade(),
              weight: 1,
              description: ["Test", "Exam", "Quiz", "Presentation"][i] ?? "Test",
              date: randomDate(),
              semester,
              subject,
              school: "KSH",
              userId: user.id,
            },
          });
          kshCount++;
        }
      }
    }

    // Finals grades (semester 7)
    for (const entry of FINALS_ENTRIES) {
      await prisma.grade.create({
        data: {
          value: randomGrade(),
          weight: 1,
          description: "",
          date: randomDate(2026, 2026),
          semester: 7,
          subject: entry,
          school: "KSH",
          userId: user.id,
        },
      });
      kshCount++;
    }

    console.log(`Created ${kshCount} KSH grades.`);
  } else {
    console.log("KSH grades already exist, skipping.");
  }

  // 4. Seed BZZ grades
  if (!existingBzz) {
    let bzzCount = 0;

    // Normal modules: 1-3 grades each
    for (const mod of BZZ_NORMAL_MODULES) {
      const numGrades = Math.random() < 0.3 ? 1 : Math.random() < 0.6 ? 2 : 3;
      for (let i = 0; i < numGrades; i++) {
        await prisma.grade.create({
          data: {
            value: randomGrade(),
            weight: 1,
            description: i === 0 ? "LB1" : i === 1 ? "LB2" : "LB3",
            date: randomDate(),
            semester: 1,
            subject: mod,
            school: "BZZ",
            userId: user.id,
          },
        });
        bzzCount++;
      }
    }

    // ÜK modules: 1-2 grades each
    for (const mod of BZZ_UK_MODULES) {
      const numGrades = Math.random() < 0.5 ? 1 : 2;
      for (let i = 0; i < numGrades; i++) {
        await prisma.grade.create({
          data: {
            value: randomGrade(),
            weight: 1,
            description: i === 0 ? "ÜK Test" : "ÜK Project",
            date: randomDate(),
            semester: 1,
            subject: mod,
            school: "BZZ",
            userId: user.id,
          },
        });
        bzzCount++;
      }
    }

    // IPA
    await prisma.grade.create({
      data: {
        value: 5.0,
        weight: 1,
        description: "IPA Final",
        date: new Date(2026, 0, 15),
        semester: 1,
        subject: BZZ_IPA,
        school: "BZZ",
        userId: user.id,
      },
    });
    bzzCount++;

    console.log(`Created ${bzzCount} BZZ grades.`);
  } else {
    console.log("BZZ grades already exist, skipping.");
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
