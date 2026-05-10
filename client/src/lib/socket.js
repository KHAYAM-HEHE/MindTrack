import { io } from "socket.io-client";
import { API_BASE_URL } from "./http";

const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export function createSocket(token) {
  return io(SOCKET_BASE_URL, {
    transports: ["websocket"],
    auth: token ? { token } : undefined,
  });
}

