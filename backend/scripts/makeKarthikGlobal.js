import { prisma } from "../config/db.js";

async function makeKarthikGlobal() {
  const result = await prisma.user.updateMany({
    where: { name: 'karthik', role: 'RECEPTIONIST' },
    data: { hospitalId: null }
  });
  console.log('Updated Karthik to global receptionist (hospitalId: null):', result);
  await prisma.$disconnect();
}

makeKarthikGlobal().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
