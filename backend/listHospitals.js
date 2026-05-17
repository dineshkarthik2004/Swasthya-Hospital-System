import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const res = await prisma.hospital.findMany({ select: { id: true, name: true, email: true } });
console.log("\nExisting hospitals:");
res.forEach((h, i) => console.log(`  ${i+1}. [${h.id}]  ${h.name}  (${h.email || "no email"})`));
await prisma.$disconnect();
