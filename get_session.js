
const { PrismaClient } = require('@prisma/client')
// require('dotenv').config() // Environment variables should be loaded automatically in Next.js env or via standard execution if .env exists
const prisma = new PrismaClient()

async function main() {
    const session = await prisma.examSession.findFirst({
        where: {
            // Just get the latest one, regardless of analysis status to see if we can analyze it
        },
        orderBy: { updatedAt: 'desc' },
        include: { exam: true }
    })

    if (session) {
        console.log(`${session.examId} ${session.id}`)
    } else {
        console.log("NO_SESSION")
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
