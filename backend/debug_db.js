import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({ include: { sessions: true } })
  console.log("USERS:", JSON.stringify(users, null, 2))
  const patients = await prisma.patient.findMany()
  console.log("PATIENTS:", JSON.stringify(patients, null, 2))
  const visits = await prisma.visit.findMany()
  console.log("VISITS:", JSON.stringify(visits, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
