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
  countdown: number;
  isSessionBlocked: boolean;
  blockSession: () => void;
  connect: () => void;
  manualReconnect: () => void;
  disconnect: () => void;
  terminateSession: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isReconnecting: false,
  countdown: 10,
  isSessionBlocked: false,
  blockSession: () => {},
  connect: () => {},
  manualReconnect: () => {},
  disconnect: () => {},
  terminateSession: () => {},
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
  const [countdown, setCountdown] = useState<number>(10);
  const [isSessionBlocked, setIsSessionBlocked] = useState(false);

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const blockSession = useCallback(() => {
    setIsSessionBlocked(true);
  }, []);

  const stopReconnection = useCallback(() => {
    console.log(
      "[SocketContext] Stopping reconnection attempts (10s window elapsed or manual stop).",
    );
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (socket.current) {
      socket.current.disconnect();
    }
    setIsReconnecting(false);
    globalIsReconnecting = false;
  }, []);

  const clearReconnectWindow = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsReconnecting(false);
    globalIsReconnecting = false;
    setCountdown(10);
  }, []);

  const startReconnectWindow = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setIsReconnecting(true);
    globalIsReconnecting = true;
    setCountdown(10);

    let currentSeconds = 10;
    countdownIntervalRef.current = setInterval(() => {
      currentSeconds -= 1;
      setCountdown(currentSeconds);
      if (currentSeconds <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    }, 1000);

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(
        "[SocketContext] 10s auto-reconnect window elapsed. Stopping reconnection.",
      );
      stopReconnection();
    }, 10000);
  }, [stopReconnection]);

  const disconnect = useCallback(() => {
    console.log("[SocketContext] Disconnecting socket...");
    clearReconnectWindow();
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
      globalSocket = null;
      setIsConnected(false);
      globalIsConnected = false;
      console.log("[SocketContext] Socket disconnected and cleared.");
    } else {
      console.log("[SocketContext] No active socket to disconnect.");
    }
  }, [clearReconnectWindow]);

  // Permanently disconnect with no reconnect — used when session is terminated by the server
  const terminateSession = useCallback(() => {
    console.log("[SocketContext] Terminating session...");
    clearReconnectWindow();
    if (socket.current) {
      socket.current.io.opts.reconnection = false;
      socket.current.disconnect();
      socket.current = null;
      globalSocket = null;
      setIsConnected(false);
      globalIsConnected = false;
    }
  }, [clearReconnectWindow]);

  const connect = useCallback(() => {
    console.log("[SocketContext] Connect called.");

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[SocketContext] No token found, socket connection aborted.");
      return;
    }

    const currentAuthToken =
      (socket.current?.auth as any)?.token ||
      (globalSocket?.auth as any)?.token;

    // If socket exists and token has changed (e.g., switched shop or re-logged in as another user),
    // tear down old socket so a new one is created with the new token
    if (
      (socket.current || globalSocket) &&
      currentAuthToken &&
      currentAuthToken !== token
    ) {
      console.log(
        "[SocketContext] Token changed, recreating socket for new session...",
      );
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
      setIsConnected(false);
      globalIsConnected = false;
      setIsReconnecting(false);
      globalIsReconnecting = false;
    }

    // If we have a socket instance that is connected with the current token, don't create another one
    if (socket.current?.connected) {
      console.log(
        "[SocketContext] Socket instance already connected with active token.",
      );
      return;
    }

    // If we have a socket instance that is disconnected with the current token, reconnect it
    if (socket.current && !socket.current.connected) {
      console.log(
        "[SocketContext] Socket instance exists but disconnected, reconnecting...",
      );
      socket.current.auth = { token };
      socket.current.connect();
      return;
    }

    if (
      !socket.current &&
      globalSocket?.connected &&
      currentAuthToken === token
    ) {
      socket.current = globalSocket;
      setIsConnected(globalIsConnected);
      setIsReconnecting(globalIsReconnecting);
      return;
    }

    console.log("[SocketContext] Initializing new socket instance...");
    const socketInstance = io(
      import.meta.env.VITE_SOCKET_URL ||
        import.meta.env.SOCKET_URL ||
        "http://localhost:3000",
      {
        transports: ["websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 3000,
        timeout: 10000,
        auth: {
          token: token,
        },
      },
    );

    // Immediate assignment to prevent race conditions from concurrent calls
    socket.current = socketInstance;
    globalSocket = socketInstance;

    // Connection events
    socketInstance.on("connect", () => {
      setIsConnected(true);
      globalIsConnected = true;
      clearReconnectWindow();
      console.log("[SocketContext] Socket connected event fired.");
    });

    socketInstance.on("disconnect", (reason) => {
      setIsConnected(false);
      globalIsConnected = false;
      console.log(
        "[SocketContext] Socket disconnected event fired. Reason:",
        reason,
      );

      // If disconnect is NOT intentional manual close, trigger 10-second auto-reconnect window
      if (
        reason === "io server disconnect" ||
        reason === "transport close" ||
        reason === "transport error" ||
        reason === "ping timeout"
      ) {
        startReconnectWindow();
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[SocketContext] Socket connection error:", error);
      setIsConnected(false);
      globalIsConnected = false;
      startReconnectWindow();
    });

    socketInstance.on("reconnect_attempt", (attempt) => {
      console.log(`[SocketContext] Socket reconnection attempt ${attempt}...`);
      startReconnectWindow();
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(
        `[SocketContext] Socket reconnected after ${attemptNumber} attempts.`,
      );
      setIsConnected(true);
      globalIsConnected = true;
      clearReconnectWindow();
    });

    socketInstance.on("reconnect_error", (error) => {
      console.error("[SocketContext] Socket reconnection error:", error);
    });

    socketInstance.on("reconnect_failed", () => {
      console.error("[SocketContext] Socket reconnection failed.");
      stopReconnection();
    });

    socketInstance.on("error", (error) => {
      console.error("[SocketContext] Socket error:", error);
      if (error.message === "Authentication error") {
        disconnect();
      }
    });
  }, [clearReconnectWindow, disconnect, startReconnectWindow, stopReconnection]);

  // Clean manual reconnect: Tears down stale socket to prevent hanging on network switch (e.g. Wi-Fi to Hotspot)
  const manualReconnect = useCallback(() => {
    console.log("[SocketContext] Manual reconnect requested by user.");
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
    }
    setIsConnected(false);
    globalIsConnected = false;

    // Start fresh 10s reconnect window
    startReconnectWindow();

    // Re-initialize fresh socket instance
    connect();
  }, [connect, startReconnectWindow]);

  // Handle tab close and component unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [disconnect]);

  return (
    <SocketContext.Provider
      value={{
        socket: socket.current,
        isConnected,
        isReconnecting,
        countdown,
        isSessionBlocked,
        blockSession,
        connect,
        manualReconnect,
        disconnect,
        terminateSession,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
