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
  isSessionBlocked: boolean;
  blockSession: () => void;
  connect: () => void;
  disconnect: () => void;
  terminateSession: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isSessionBlocked: false,
  blockSession: () => { },
  connect: () => { },
  disconnect: () => { },
  terminateSession: () => { },
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socket = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionBlocked, setIsSessionBlocked] = useState(false);

  const blockSession = useCallback(() => {
    setIsSessionBlocked(true);
  }, []);

  const connect = useCallback(() => {
    if (socket.current?.connected) return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, socket connection aborted");
      return;
    }

    const socketInstance = io(
      import.meta.env.VITE_SOCKET_URL || import.meta.env.SOCKET_URL || "http://localhost:3000",
      {
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

    // Connection events
    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    socketInstance.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
    });

    socketInstance.on("reconnect_failed", () => {
      console.error("Socket reconnection failed");
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
      if (error.message === "Authentication error") {
        disconnect();
      }
    });

    socket.current = socketInstance;
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
      setIsConnected(false);
    }
  }, [socket]);

  // Permanently disconnect with no reconnect — used when session is terminated by the server
  const terminateSession = useCallback(() => {
    if (socket.current) {
      socket.current.io.opts.reconnection = false;
      socket.current.disconnect();
      socket.current = null;
      setIsConnected(false);
    }
  }, [socket]);

  // Handle tab close
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
      value={{ socket: socket.current, isConnected, isSessionBlocked, blockSession, connect, disconnect, terminateSession }}
    >
      {children}
    </SocketContext.Provider>
  );
};
