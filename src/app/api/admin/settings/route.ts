export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/settings - Get system settings
export async function GET() {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const settings = await prisma.systemSetting.findMany()
        const config: Record<string, any> = {}
        settings.forEach((s: any) => {
            config[s.key] = s.value
        })

        // Default settings if not exists
        const defaultConfig = {
            platformName: 'NICETOP',
            enterpriseName: 'NiceTop Interview',
            primaryColor: 'slate-900',
            designMode: 'CORPORATE',
        }

        return NextResponse.json({ success: true, settings: { ...defaultConfig, ...config } })
    } catch (error) {
        console.error('Fetch settings error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST /api/admin/settings - Update system settings
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { settings } = await req.json()

        for (const [key, value] of Object.entries(settings)) {
            await prisma.systemSetting.upsert({
                where: { key },
                update: { value: value as any },
                create: { key, value: value as any },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Update settings error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
