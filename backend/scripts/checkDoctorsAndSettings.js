import { prisma } from "../config/db.js";

const doctors = await prisma.user.findMany({ 
  where: { role: 'DOCTOR' }, 
  select: { id: true, name: true, email: true, hospitalId: true } 
});
console.log('\nDOCTORS IN DB:');
doctors.forEach(d => console.log(`  ${d.name} | email: ${d.email} | hospitalId: ${d.hospitalId}`));

const settings = await prisma.systemSettings.findMany();
console.log('\nALL SETTINGS IN DB:');
settings.forEach(s => console.log(`  "${s.key}" = "${s.value}"`));

await prisma.$disconnect();
