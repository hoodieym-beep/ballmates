import { io } from 'socket.io-client';
import { API_URL } from '../constants/config';
import { getStoredToken } from './api';

let socket = null;

export async function getSocket() {
  // Reuse existing socket even if still connecting — socket.io queues events until connected
  if (socket) return socket;

  const token = await getStoredToken();

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
