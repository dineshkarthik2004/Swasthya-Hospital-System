import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const hospital = await prisma.hospital.findFirst({
    where: { name: 'JOTHAM HEALTH CARE' }
  });

  if (!hospital) {
    console.log('Hospital not found');
    return;
  }

  const consultations = await prisma.consultation.findMany({
    where: { hospitalId: hospital.id }
  });

  console.log(`Found ${consultations.length} consultations for ${hospital.name} with ID ${hospital.id}`);
  
  const allConsultations = await prisma.consultation.findMany({
    include: { visit: { include: { doctor: true } } }
  });
  
  const potentialJotham = allConsultations.filter(c => 
    c.visit?.doctor?.clinicName?.includes('JOTHAM')
  );
  
  console.log(`Potential Jotham consultations based on clinicName: ${potentialJotham.length}`);
  console.log(`Records missing hospitalId: ${allConsultations.filter(c => !c.hospitalId).length}`);

  await prisma.$disconnect();
}

main();
