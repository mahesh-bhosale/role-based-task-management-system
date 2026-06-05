import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env';

let io: Server;

// Map to store connected users: userId -> socketId
const connectedUsers = new Map<string, string>();

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string };
      // Attach userId to the socket object for later use
      (socket as any).userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    connectedUsers.set(userId, socket.id);
    
    console.log(`[Socket] User connected: ${userId} (Socket: ${socket.id})`);

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      console.log(`[Socket] User disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (!io) return;
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};
