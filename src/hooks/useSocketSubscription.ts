import { useEffect, useCallback } from "react";
import { useSocket } from "../contexts/SocketContext";

interface SocketSubscriptionOptions<T> {
  event: string;
  handler: (data: T) => void;
  enabled?: boolean;
}

export const useSocketSubscription = <T = unknown>({
  event,
  handler,
  enabled = true,
}: SocketSubscriptionOptions<T>) => {
  const { socket, isConnected } = useSocket();

  const handleEvent = useCallback(
    (data: T) => {
      if (enabled) {
        handler(data);
      }
    },
    [enabled, handler]
  );

  useEffect(() => {
    if (!socket || !isConnected || !enabled) return;

    socket.on(event, handleEvent);

    return () => {
      socket.off(event, handleEvent);
    };
  }, [socket, isConnected, event, handleEvent, enabled]);
};
