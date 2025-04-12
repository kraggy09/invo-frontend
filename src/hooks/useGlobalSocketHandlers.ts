import { useEffect, useCallback } from "react";
import { useSocket } from "../contexts/SocketContext";
import {
  SocketEvents,
  NotificationEvent,
  BillCreatedEvent,
} from "../types/socket";
import { message } from "antd";

export const useGlobalSocketHandlers = () => {
  const { socket, isConnected } = useSocket();

  const handleNotification = useCallback((data: NotificationEvent) => {
    switch (data.type) {
      case "success":
        message.success(data.message);
        break;
      case "error":
        message.error(data.message);
        break;
      case "warning":
        message.warning(data.message);
        break;
      case "info":
        message.info(data.message);
        break;
    }
  }, []);

  const handleBillCreated = useCallback((data: BillCreatedEvent) => {
    // You can update any global state here if needed
    console.log("New bill created globally:", data);

    // Show a notification
    message.success(`New bill created for customer ID: ${data.customerId}`);
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Add global event handlers
    socket.on(SocketEvents.NOTIFICATION, handleNotification);
    const billCreated = socket.on(SocketEvents.BILL.CREATED, handleBillCreated);
    console.log("This is the socket for handling bill created", billCreated);

    // Cleanup on unmount (though these should persist)
    return () => {
      socket.off(SocketEvents.NOTIFICATION, handleNotification);
      socket.off(SocketEvents.BILL.CREATED, handleBillCreated);
    };
  }, [socket, isConnected, handleNotification, handleBillCreated]);
};
