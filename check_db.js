const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
})

async function main() {
    console.log('Testing DB connection with generated client (hardcoded schema)...')
    try {
        const userCount = await prisma.user.count()
        console.log('Successfully connected! User count:', userCount)
    } catch (error) {
        console.error('DB Connection FAILED:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
