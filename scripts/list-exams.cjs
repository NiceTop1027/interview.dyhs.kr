/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')
const envPath = path.resolve('.env')
if (!fs.existsSync(envPath)) {
  throw new Error('.env file is required to read database configuration')
}

const env = fs
  .readFileSync(envPath, 'utf8')
  .split(/\r?\n/)
  .filter((line) => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, value = ''] = line.split('=', 2)
    acc[key.trim()] = value.trim().replace(/^"|"$/g, '')
    return acc
  }, {})

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in .env')
}

process.env.DATABASE_URL = env.DATABASE_URL

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
})

async function main() {
  await prisma.$connect()
  const exams = await prisma.exam.findMany({
    select: {
      id: true,
      title: true,
      status: true,
    },
  })
  console.log('exams', exams)
}

main()
  .catch((error) => {
    console.error('Error listing exams:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
