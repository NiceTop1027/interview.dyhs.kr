'use client'

import React, { createContext, useContext } from 'react'

interface SocketContextType {
    socket: any | null
    isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
})

export const useSocket = () => useContext(SocketContext)

// Socket.io 비활성화 - Cloudflare 프록시 환경에서 WebSocket 유지가 어려움
// 대신 관리자 페이지에서 자동 새로고침 기능 사용
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    // 소켓 연결 없이 더미 값만 제공
    return (
        <SocketContext.Provider value={{ socket: null, isConnected: false }}>
            {children}
        </SocketContext.Provider>
    )
}
