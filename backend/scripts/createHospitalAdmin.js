import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  const hospitalId = 'cmocta4tw0000zbzsa9tt3sn4'; // BUDDHI CLINIC
  const email = 'admin@buddhi.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists.");
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: 'Buddhi Hospital Admin',
      email,
      password: hashedPassword,
      role: 'ADMIN',
      hospitalId
    }
  });

  console.log(`Created Admin: ${user.email} with password: ${password}`);
}

createAdmin().finally(() => prisma.$disconnect());
