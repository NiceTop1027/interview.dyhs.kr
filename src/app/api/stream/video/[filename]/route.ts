
import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!['ADMIN', 'EXAMINER'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Await params for Next.js 15+
        const { filename } = await params

        // Prevent directory traversal
        const safeFilename = filename.replace(/(\.\.(\/|\\|$))+/g, '')

        // Private directory
        const filePath = join(process.cwd(), 'uploads', 'videos', safeFilename)

        try {
            await stat(filePath)
        } catch {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        const fileBuffer = await readFile(filePath)

        // Determine content type (simple version)
        const ext = safeFilename.split('.').pop()?.toLowerCase()
        let contentType = 'application/octet-stream'
        if (ext === 'mp4') contentType = 'video/mp4'
        if (ext === 'webm') contentType = 'video/webm'
        if (ext === 'mov') contentType = 'video/quicktime'
        if (ext === 'avi') contentType = 'video/x-msvideo'

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'private, max-age=3600'
            }
        })

    } catch (error) {
        console.error('Stream error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
