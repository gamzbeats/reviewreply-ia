import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const email = process.argv[2];
  const plan = process.argv[3]?.toUpperCase();

  if (!email || !plan || !["FREE", "PRO", "BUSINESS"].includes(plan)) {
    console.error("Usage: npx tsx scripts/set-plan.ts <email> <FREE|PRO|BUSINESS>");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`User with email ${email} not found.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { plan: plan as "FREE" | "PRO" | "BUSINESS" },
  });

  console.log(`Updated ${updated.email}: ${user.plan} → ${updated.plan}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
