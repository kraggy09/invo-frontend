import { useEffect, useCallback } from "react";
import { useSocket } from "../contexts/SocketContext";
import {
  SocketEvents,
  NotificationEvent,
  BillCreatedEvent,
} from "../types/socket";
import { message } from "antd";
import useUserStore from "../store/user.store";
import apiCaller from "../utils/apiCaller";

export const useGlobalSocketHandlers = () => {
  const { socket, isConnected } = useSocket();
  const { setSocketId } = useUserStore();

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

  const handleWelcomeMessage = useCallback(
    async (data: { socketId: string }) => {
      console.log("Welcome message from server:", data);
      setSocketId(data.socketId);
      await fetchInitialData();
      message.info("Welcome to the billing system!");
    },
    []
  );
  const fetchInitialData = useCallback(async () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const promiseData = [];

    promiseData.push(
      apiCaller.get("/bills/get-bills", {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      })
    );

    promiseData.push(apiCaller.get("/customers/get-customers"));

    promiseData.push(
      apiCaller.get("/transactions/get-transactions", {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      })
    );

    promiseData.push(apiCaller.get("/products/all-products"));

    await Promise.all(promiseData)
      .then((responses) => {
        const bills = responses[0].data.data.bills;
        const customers = responses[1].data.data.customers;
        const transactions = responses[2].data.data.transactions;
        const products = responses[3].data.data.products;

        console.log("Bills:", bills);
        console.log("Customers:", customers);
        console.log("Transactions:", transactions);
        console.log("Products:", products);
      })
      .catch((error) => {
        console.error("Error fetching initial data:", error);
      });
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.on(SocketEvents.NOTIFICATION, handleNotification);
    socket.on("welcome", handleWelcomeMessage);
    socket.on(SocketEvents.BILL.CREATED, handleBillCreated);

    // Cleanup on unmount (though these should persist)
    return () => {
      socket.off(SocketEvents.NOTIFICATION, handleNotification);
      socket.off(SocketEvents.BILL.CREATED, handleBillCreated);
      socket.off("welcome", handleWelcomeMessage);
    };
  }, [socket, isConnected, handleNotification, handleBillCreated]);
};
