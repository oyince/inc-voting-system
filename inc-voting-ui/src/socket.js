// src/socket.js
import { io } from "socket.io-client";

// Use environment variable for API URL, fallback to localhost
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

export const socket = io(API_URL);
