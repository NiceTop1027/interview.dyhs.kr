
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:postgres@localhost:25432/nicetop_ai?schema=public"
        }
    }
})

async function main() {
    const session = await prisma.examSession.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: { exam: true }
    })

    if (session) {
        console.log(session.examId)
        console.log(session.id)
    } else {
        console.log("NO_SESSION")
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
