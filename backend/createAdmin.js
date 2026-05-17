/**
 * createAdmin.js — Creates a new super-admin account (no hospitalId).
 * Usage: node createAdmin.js
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "admin@hospital";
  const password = "password123";
  const name = "Hospital Admin";
  const role = "ADMIN";

  // Check if username already taken
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`❌ Username "${username}" is already taken by: ${existing.name} (${existing.role})`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate a unique placeholder email
  const placeholderEmail = `${username.replace(/[^a-z0-9]/gi, ".")}.${Date.now()}@noemail.local`;

  const user = await prisma.user.create({
    data: {
      name,
      email: placeholderEmail,
      username,
      password: hashedPassword,
      role,
      isActive: true,
      hospitalId: null   // super-admin — not tied to any hospital
    }
  });

  console.log(`\n✅ Admin created successfully!`);
  console.log(`   ID       : ${user.id}`);
  console.log(`   Name     : ${user.name}`);
  console.log(`   Username : ${user.username}`);
  console.log(`   Role     : ${user.role}`);
  console.log(`   Password : password123\n`);
  console.log(`🔑 Login with: username = admin@hospital  |  password = password123\n`);
}

main()
  .catch(err => { console.error("❌ Error:", err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
