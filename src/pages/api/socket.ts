import { Server as NetServer } from 'http'
import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { NextApiResponseServerIO } from '@/types'

export const config = {
    api: {
        bodyParser: false,
    },
}

import { setIO } from '@/lib/socket-io'

// 허용된 origin 목록 (환경 변수에서 가져오거나 기본값 사용)
const getAllowedOrigins = (): string[] => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (siteUrl) {
        return [siteUrl]
    }
    // 개발 환경에서는 localhost 허용
    if (process.env.NODE_ENV === 'development') {
        return ['http://localhost:3000', 'http://127.0.0.1:3000']
    }
    return []
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
    // CORS 헤더 설정 (폴링 요청 및 사전 검사용)
    const origin = req.headers.origin || 'https://interview.dyhs.kr'
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (!res.socket.server.io) {
        console.log('--- 소켓 서버 초기화 시작 ---')
        const io = new ServerIO(res.socket.server as any, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: {
                origin: ["https://interview.dyhs.kr", "http://interview.dyhs.kr"],
                methods: ["GET", "POST"],
                credentials: true
            },
            pingTimeout: 120000,
            pingInterval: 30000,
            allowEIO3: true,
            transports: ['websocket', 'polling']
        })

        io.on('connect', (socket) => {
            console.log(`[Socket Server] New Connection: ${socket.id}`)
            socket.on('disconnect', (reason) => {
                console.log(`[Socket Server] Disconnected: ${socket.id} (Reason: ${reason})`)
            })
        })

        res.socket.server.io = io
        setIO(io)
    }

    res.end()
}

export default SocketHandler
