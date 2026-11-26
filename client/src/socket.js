import { io } from 'socket.io-client';

let socket = null;
let socketToken = null;

export function connectSocket(token) {
  if (!token) return null;

  if (socket && socketToken !== token) {
    disconnectSocket();
  }

  if (!socket) {
    socketToken = token;
    socket = io('/', {
      autoConnect: false,
      auth: { token }
    });
  }

  if (!socket.active) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;

  socket.disconnect();
  socket = null;
  socketToken = null;
}
