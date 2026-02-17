import { Server as SocketIOServer } from 'socket.io'

declare global {
    var io: SocketIOServer | undefined
}

export const getIO = () => {
    return global.io
}

export const setIO = (io: SocketIOServer) => {
    global.io = io
}
