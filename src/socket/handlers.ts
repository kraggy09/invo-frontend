import { Socket } from "socket.io-client";
import { SocketEvents } from "../types/socket";

interface BillUpdateData {
  billId: string;
  status: string;
  total: number;
}

interface NotificationData {
  type: string;
  message: string;
  timestamp: string;
}

export const setupBillHandlers = (socket: Socket) => {
  socket.on(SocketEvents.BILL.CREATED, (data: BillUpdateData) => {
    console.log("New bill created:", data);
    // Handle new bill creation
  });

  socket.on(SocketEvents.BILL.UPDATED, (data: BillUpdateData) => {
    console.log("Bill updated:", data);
    // Handle bill update
  });

  socket.on(SocketEvents.BILL.DELETED, (billId: string) => {
    console.log("Bill deleted:", billId);
    // Handle bill deletion
  });
};

export const setupNotificationHandlers = (socket: Socket) => {
  socket.on(SocketEvents.NOTIFICATION, (data: NotificationData) => {
    console.log("New notification:", data);
    // Handle new notification
  });
};
