import { prisma } from "../config/db.js";

async function fixDinesh() {
  const jotham = await prisma.hospital.findFirst({ where: { name: { contains: 'jotham', mode: 'insensitive' } } });
  if (jotham) {
    const result = await prisma.user.updateMany({
      where: { email: 'jotham@receptionist.com' },
      data: { hospitalId: jotham.id }
    });
    console.log('Updated dinesh to hospital:', jotham.id, result);
  }
  await prisma.$disconnect();
}

fixDinesh().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
