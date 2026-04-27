import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin(hospitalName, email, password) {
  const hospital = await prisma.hospital.findFirst({
    where: { name: hospitalName }
  });

  if (!hospital) {
    console.log(`Hospital not found: ${hospitalName}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      hospitalId: hospital.id,
      isActive: true
    },
    create: {
      email,
      password: hashedPassword,
      name: `${hospitalName} Admin`,
      role: 'ADMIN',
      hospitalId: hospital.id,
      isActive: true
    }
  });

  console.log(`Admin created for ${hospitalName}: ${admin.email}`);
}

async function main() {
  await createAdmin('SELVARANGAM HOSPITAL', 'admin@selvarangam.com', 'password123');
  await createAdmin('JOTHAM HEALTH CARE', 'admin@jotham.com', 'password123');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
