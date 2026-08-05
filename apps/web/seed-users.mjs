/**
 * Seed script: creates 3 test users for multiplayer testing.
 * Run from web app dir: node --experimental-vm-modules seed-users.cjs
 */
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("./DB_prisma/node_modules/.prisma/client");

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || "postgresql://khushisinghal@localhost:5432/typefast" } }
});

const users = [
  { name: "Alice", email: "alice@test.com", password: "Password123!" },
  { name: "Bob",   email: "bob@test.com",   password: "Password123!" },
  { name: "Carol", email: "carol@test.com", password: "Password123!" },
];

async function main() {
  console.log("Seeding test users...\n");
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`⚠  ${u.email} already exists – skipping`);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 10);
    const created = await prisma.user.create({
      data: {
        name:          u.name,
        email:         u.email,
        password:      hashed,
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Created user: ${u.name} <${u.email}>  id=${created.id}`);
  }
  console.log("\n🎉 Done! Credentials for all users: Password123!");
}

main()
  .catch((e) => { console.error("❌ Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
