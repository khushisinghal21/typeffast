/**
 * Seed script: creates 3 test users for multiplayer testing.
 * Run: node seed-users.cjs
 */
const bcrypt  = require("bcryptjs");
const { PrismaClient } = require("/Users/khushisinghal/ttypeFast/TypeFast/node_modules/.prisma/client");

const DATABASE_URL = "postgresql://khushisinghal@localhost:5432/typefast";

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

const USERS = [
  { name: "Alice", email: "alice@test.com",  password: "Password123!" },
  { name: "Bob",   email: "bob@test.com",    password: "Password123!" },
  { name: "Carol", email: "carol@test.com",  password: "Password123!" },
];

async function main() {
  console.log("🌱  Seeding test users …\n");
  for (const u of USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`⚠   ${u.email} already exists — skipping`);
      continue;
    }
    const hashed  = await bcrypt.hash(u.password, 10);
    const created = await prisma.user.create({
      data: { name: u.name, email: u.email, password: hashed, emailVerified: new Date() },
    });
    console.log(`✅  Created  ${u.name} <${u.email}>  id=${created.id}`);
  }
  console.log("\n🎉  Done!  All users share password: Password123!");
}

main()
  .catch((e) => { console.error("❌  Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
