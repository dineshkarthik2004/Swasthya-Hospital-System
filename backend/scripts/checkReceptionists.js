import { prisma } from "../config/db.js";

async function checkKarthik() {
  const users = await prisma.user.findMany({ 
    where: { OR: [ { role: 'RECEPTIONIST' }, { name: 'karthik' } ] }, 
    select: { id: true, name: true, email: true, role: true, hospitalId: true } 
  });
  console.log('RECEPTIONISTS:');
  console.log(JSON.stringify(users, null, 2));

  await prisma.$disconnect();
}

checkKarthik().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
