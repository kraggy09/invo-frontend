import { Socket } from "socket.io-client";

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
  socket.on("bill:created", (data: BillUpdateData) => {
    console.log("New bill created:", data);
    // Handle new bill creation
  });

  socket.on("bill:updated", (data: BillUpdateData) => {
    console.log("Bill updated:", data);
    // Handle bill update
  });

  socket.on("bill:deleted", (billId: string) => {
    console.log("Bill deleted:", billId);
    // Handle bill deletion
  });
};

export const setupNotificationHandlers = (socket: Socket) => {
  socket.on("notification", (data: NotificationData) => {
    console.log("New notification:", data);
    // Handle new notification
  });
};
