import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

    socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })

    // Global error handling
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  }

  return socket
}

export const connectSocket = (userId: string, nickname: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const socketInstance = getSocket()

    if (socketInstance.connected) {
      resolve()
      return
    }

    socketInstance.auth = { userId, nickname }

    socketInstance.once('connect', () => {
      console.log('Socket connected successfully')
      resolve()
    })

    socketInstance.once('connect_error', (error) => {
      console.error('Failed to connect socket:', error)
      reject(error)
    })

    socketInstance.connect()
  })
}

export const disconnectSocket = (): void => {
  if (socket && socket.connected) {
    socket.disconnect()
    console.log('Socket disconnected')
  }
}

export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false
}
