// inc-voting-ui/src/socket.js
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL;

export const socket = io(API_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('Socket.IO connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket.IO disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error);
});