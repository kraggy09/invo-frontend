import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  isSessionBlocked: boolean;
  blockSession: () => void;
  connect: () => void;
  disconnect: () => void;
  terminateSession: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isReconnecting: false,
  isSessionBlocked: false,
  blockSession: () => { },
  connect: () => { },
  disconnect: () => { },
  terminateSession: () => { },
});

export const useSocket = () => useContext(SocketContext);

// Use a module-level variable to persist the socket instance across re-mounts (important for React 18 StrictMode in dev)
let globalSocket: Socket | null = null;
let globalIsConnected = false;
let globalIsReconnecting = false;

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socket = useRef<Socket | null>(globalSocket);
  const [isConnected, setIsConnected] = useState(globalIsConnected);
  const [isReconnecting, setIsReconnecting] = useState(globalIsReconnecting);
  const [isSessionBlocked, setIsSessionBlocked] = useState(false);

  const blockSession = useCallback(() => {
    setIsSessionBlocked(true);
  }, []);

  const disconnect = useCallback(() => {
    console.log("[SocketContext] Disconnecting socket...");
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
      globalSocket = null;
      setIsConnected(false);
      globalIsConnected = false;
      setIsReconnecting(false);
      globalIsReconnecting = false;
      console.log("[SocketContext] Socket disconnected and cleared.");
    } else {
      console.log("[SocketContext] No active socket to disconnect.");
    }
  }, [socket]);

  // Permanently disconnect with no reconnect — used when session is terminated by the server
  const terminateSession = useCallback(() => {
    console.log("[SocketContext] Terminating session...");
    if (socket.current) {
      socket.current.io.opts.reconnection = false;
      socket.current.disconnect();
      socket.current = null;
      globalSocket = null;
      setIsConnected(false);
      globalIsConnected = false;
      setIsReconnecting(false);
      globalIsReconnecting = false;
    }
  }, [socket]);

  const connect = useCallback(() => {
    console.log("[SocketContext] Connect called.");

    // If we have a socket instance that is disconnected, manual connect
    if (socket.current && !socket.current.connected) {
      console.log("[SocketContext] Socket instance exists but disconnected, connecting...");
      socket.current.connect();
      return;
    }

    // If we already have a socket instance that is connected, don't create another one
    if (socket.current || globalSocket) {
      console.log("[SocketContext] Socket instance already exists and potentially connected, skipping initialization.");
      if (!socket.current && globalSocket) {
        socket.current = globalSocket;
        setIsConnected(globalIsConnected);
        setIsReconnecting(globalIsReconnecting);
      }
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[SocketContext] No token found, socket connection aborted.");
      return;
    }

    console.log("[SocketContext] Initializing new socket instance...");
    const socketInstance = io(
      import.meta.env.VITE_SOCKET_URL || import.meta.env.SOCKET_URL || "http://localhost:3000",
      {
        transports: ["websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        auth: {
          token: token,
        },
      }
    );

    // Immediate assignment to prevent race conditions from concurrent calls
    socket.current = socketInstance;
    globalSocket = socketInstance;

    // Connection events
    socketInstance.on("connect", () => {
      setIsConnected(true);
      globalIsConnected = true;
      setIsReconnecting(false);
      globalIsReconnecting = false;
      console.log("[SocketContext] Socket connected event fired.");
    });

    socketInstance.on("disconnect", (reason) => {
      setIsConnected(false);
      globalIsConnected = false;
      console.log("[SocketContext] Socket disconnected event fired. Reason:", reason);

      // I/O logic: if disconnect is NOT manual, it might be reconnecting
      if (reason === "io server disconnect" || reason === "transport close" || reason === "transport error") {
        setIsReconnecting(true);
        globalIsReconnecting = true;
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[SocketContext] Socket connection error:", error);
      setIsConnected(false);
      globalIsConnected = false;
      // After a connect error, socket.io usually starts reconnecting automatically if configured
      setIsReconnecting(true);
      globalIsReconnecting = true;
    });

    socketInstance.on("reconnect_attempt", (attempt) => {
      console.log(`[SocketContext] Socket reconnection attempt ${attempt}...`);
      setIsReconnecting(true);
      globalIsReconnecting = true;
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(`[SocketContext] Socket reconnected after ${attemptNumber} attempts.`);
      setIsConnected(true);
      globalIsConnected = true;
      setIsReconnecting(false);
      globalIsReconnecting = false;
    });

    socketInstance.on("reconnect_error", (error) => {
      console.error("[SocketContext] Socket reconnection error:", error);
      setIsReconnecting(true);
      globalIsReconnecting = true;
    });

    socketInstance.on("reconnect_failed", () => {
      console.error("[SocketContext] Socket reconnection failed.");
      setIsReconnecting(false);
      globalIsReconnecting = false;
    });

    socketInstance.on("error", (error) => {
      console.error("[SocketContext] Socket error:", error);
      if (error.message === "Authentication error") {
        disconnect();
      }
    });
  }, [socket, disconnect]);

  // Handle tab close and component unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [disconnect]);

  return (
    <SocketContext.Provider
      value={{ socket: socket.current, isConnected, isReconnecting, isSessionBlocked, blockSession, connect, disconnect, terminateSession }}
    >
      {children}
    </SocketContext.Provider>
  );
};
