import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, role: true, email: true } })
  console.log("USERS_SUMMARY:", users)
}

main().catch(console.error).finally(() => prisma.$disconnect())
