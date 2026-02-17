import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export async function GET(
    request: NextRequest,
    { params }: { params: { filename: string } } | any
) {
    // Next.js 15+에서는 params를 await해야 할 수도 있으나 여기서는 호환성을 위해 처리
    const resolvedParams = await params
    const filename = resolvedParams.filename

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'recordings', filename)

    if (!existsSync(filePath)) {
        console.error(`[File Server] File not found: ${filePath}`)
        return new NextResponse('File Not Found', { status: 404 })
    }

    try {
        const fileBuffer = await readFile(filePath)

        let contentType = 'video/webm'
        if (filename.endsWith('.mp4')) contentType = 'video/mp4'

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch (error) {
        console.error(`[File Server] Error reading file:`, error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
