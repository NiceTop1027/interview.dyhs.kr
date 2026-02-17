
const { PrismaClient } = require('@prisma/client')
// Fix: Use permitted options to satisfy constructor validation
const prisma = new PrismaClient({ log: ['info'] })

async function main() {
    // Get the most recently updated session that has analysis data
    const session = await prisma.examSession.findFirst({
        where: {
            NOT: {
                aiVideoAnalysis: {
                    equals: null
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    })

    if (session) {
        console.log('Session ID:', session.id)
        console.log('Analysis Data:', JSON.stringify(session.aiVideoAnalysis, null, 2))
    } else {
        console.log('No session with analysis found.')
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
