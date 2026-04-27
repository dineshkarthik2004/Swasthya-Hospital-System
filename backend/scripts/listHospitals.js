import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const hospitals = await prisma.hospital.findMany();
  console.log('HOSPITALS_LIST:');
  console.log(JSON.stringify(hospitals, null, 2));
  await prisma.$disconnect();
}

main();
