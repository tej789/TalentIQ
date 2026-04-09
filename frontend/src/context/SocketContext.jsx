import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react";

const SocketContext = createContext(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};

export function SocketProvider({ children }) {
  const { user } = useUser();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // Stable user ID — prevents reconnection on Clerk user object reference changes
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    const apiUrl = import.meta.env.VITE_API_URL;
    const backendFromApi = apiUrl ? apiUrl.replace(/\/api\/?$/, "") : "";
    const serverUrl =
      import.meta.env.VITE_BACKEND_URL ||
      backendFromApi ||
      "http://localhost:3000";

    console.log("🔌 Connecting socket to:", serverUrl);

    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err?.message || err);
    });

    socket.io.on("reconnect_attempt", (attempt) => {
      console.warn("Socket reconnect attempt:", attempt);
    });

    socket.io.on("reconnect_failed", () => {
      console.error("Socket reconnect failed after max attempts");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [userId]);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, emit, on, off }}>
      {children}
    </SocketContext.Provider>
  );
}
