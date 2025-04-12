import { useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";

interface SocketEvent<T = unknown> {
  event: string;
  handler: (data: T) => void;
}

export const useSocketEvents = <T = unknown>(events: SocketEvent<T>[]) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Add event listeners
    events.forEach(({ event, handler }) => {
      socket.on(event, handler);
    });

    // Cleanup event listeners
    return () => {
      events.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
    };
  }, [socket, isConnected, events]);
};
