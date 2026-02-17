
const { PrismaClient } = require('@prisma/client')
// Pass explicit datasouce if needed, or empty ID for this specific error "PrismaClient needs to be constructed with..."
// Just passing {} often fixes the "non-empty" error if it's strict.
const prisma = new PrismaClient({})

async function main() {
    const recordings = await prisma.recording.findMany()
    console.log(`Found ${recordings.length} recordings`)

    for (const rec of recordings) {
        // Check for old public paths
        let needsUpdate = false
        let oldUrl = rec.url

        if (oldUrl.includes('/uploads/recordings/') || oldUrl.includes('/uploads/videos/')) {
            if (!oldUrl.startsWith('/api/stream/')) {
                needsUpdate = true
            }
        }

        if (needsUpdate) {
            const filename = oldUrl.split('/').pop()
            const newUrl = `/api/stream/video/${filename}`
            console.log(`Migrating ${rec.id}: ${oldUrl} -> ${newUrl}`)

            await prisma.recording.update({
                where: { id: rec.id },
                data: { url: newUrl }
            })

            // Also update session if it matches
            const session = await prisma.examSession.findUnique({ where: { id: rec.sessionId } })
            if (session && session.recordingUrl === oldUrl) {
                await prisma.examSession.update({
                    where: { id: rec.sessionId },
                    data: { recordingUrl: newUrl }
                })
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
