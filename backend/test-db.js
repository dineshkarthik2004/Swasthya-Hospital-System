import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const test = await prisma.consultation.create({
      data: {
        diagnosis: "Test",
        adviceInstructions: "Test advice",
        labPending: true,
        doctorId: "any-valid-uuid-or-id", // Needs a real one probably
        visitId: "any-valid-uuid-or-id"
      }
    })
    console.log("Success:", test)
  } catch (e) {
    console.error("Error:", e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
