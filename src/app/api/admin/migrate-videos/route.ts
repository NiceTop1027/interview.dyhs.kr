export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const recordings = await prisma.recording.findMany()
        let updatedCount = 0

        for (const rec of recordings) {
            // Check for old public paths or file paths
            let needsUpdate = false
            let oldUrl = rec.url

            // Match /uploads/recordings/... or /uploads/videos/...
            if (oldUrl.includes('/uploads/recordings/') || oldUrl.includes('/uploads/videos/')) {
                if (!oldUrl.startsWith('/api/stream/')) {
                    needsUpdate = true
                }
            }

            if (needsUpdate) {
                const filename = oldUrl.split('/').pop()
                const newUrl = `/api/stream/video/${filename}`

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
                updatedCount++
            }
        }

        return NextResponse.json({ success: true, updated: updatedCount, total: recordings.length })

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
