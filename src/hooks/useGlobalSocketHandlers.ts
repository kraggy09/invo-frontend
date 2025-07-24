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
import useCustomerStore from "../store/customer.store";
import useProductStore from "../store/product.store";
import useCategoriesStore from "../store/categories.store";
import useCurrentBillStore from "../store/currentBill.store";
import useTransactionStore from "../store/transaction.store";
import useBillStore from "../store/bill.store";
import { Product, useInventoryRequestStore } from "../store/requests.store";

export const useGlobalSocketHandlers = () => {
  const { socket, isConnected } = useSocket();

  // Zustands optimized with selectors

  // User store
  const setSocketId = useUserStore((state) => state.setSocketId);

  // Product store
  const products = useProductStore((state) => state.products);
  const setProducts = useProductStore((state) => state.setProducts);
  const setProductMap = useProductStore((state) => state.setProductMap);
  const productMap = useProductStore((state) => state.productMap);
  // Customer store
  const setCustomers = useCustomerStore((state) => state.setCustomers);
  const updateOutstanding = useCustomerStore(
    (state) => state.updateOutstanding
  );

  // Category store
  const setCategories = useCategoriesStore((state) => state.setCategories);

  // Transaction store
  const setTransactions = useTransactionStore((state) => state.setTransactions);
  const setTransactionId = useTransactionStore(
    (state) => state.setTransactionId
  );
  const addTransaction = useTransactionStore((state) => state.addTransaction);

  // Bill store
  const setBillingId = useBillStore((state) => state.setBillingId);
  const setBills = useBillStore((state) => state.setBills);
  const addBill = useBillStore((state) => state.addBill);

  const requests = useInventoryRequestStore((state) => state.requests);
  const setRequests = useInventoryRequestStore((state) => state.setRequests);
  // Current bill store
  const afterBillCreated = useCurrentBillStore(
    (state) => state.afterBillCreated
  );
  const afterStockUpdated = useCurrentBillStore(
    (state) => state.afterStockUpdated
  );
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

  const handleBillCreated = useCallback(
    (data: BillCreatedEvent) => {
      // You can update any global state here if needed
      console.log("New bill created globally:", data);

      const bill = data.bill;
      const items = bill.items;
      const billingId = data.billId;
      const transaction = data.transaction;
      const transactionId = data.transactionId;
      const updatedCustomer = data.updatedCustomer;
      const productsIdMap = productMap;

      let updatedProducts = [...products];
      console.log(
        productsIdMap,
        products,
        updatedProducts,
        "This is the products ID map"
      );
      const itemsMap = new Map(items.map((item) => [item.product, item]));

      items.forEach((item) => {
        const productIndex = productsIdMap.get(item.product as string);
        if (productIndex !== undefined) {
          updatedProducts[productIndex].stock -= item.quantity;
          console.log("Old Stock and New Stock", {
            oldStock: updatedProducts[productIndex].stock + item.quantity,
            newStock: updatedProducts[productIndex].stock,
          });
        } else {
          console.warn(
            `Product with ID ${item.product} not found in products.`
          );
        }
      });
      setProducts(updatedProducts);
      setBillingId(billingId);
      addBill(bill);
      if (transactionId) {
        setTransactionId(transactionId);
      }
      if (transaction) {
        addTransaction(transaction);
      }
      const customer = updateOutstanding(
        updatedCustomer._id,
        updatedCustomer.outstanding
      );
      afterBillCreated(customer, itemsMap);

      // Show a notfication
      message.success(`New bill created for customer ID`);
    },
    [products]
  );

  const handleInventoryUpdateRequest = useCallback(
    (data: any) => {
      console.log("CALLING INVENTORY UPDATE REQUEST HANDLER");

      console.log(data, "This is the inventory update request data");
      console.log("requests:", requests);
      console.log("data:", data);
      const newRequests = [...data, ...requests];
      console.log("newRequests:", newRequests);

      setRequests(newRequests);
    },
    [requests]
  );

  const handleStockUpdated = useCallback(
    (data: {
      data: {
        updatedProducts: {
          newStock: number;
          previousStock: number;
          productId: string;
          quantityAdded: number;
        }[];
        todayStockUpdates: {
          createdAt: string;
          product: string;
          quantity: number;
          _id: string;
          previousStock: number;
          newStock: number;
          totalQty: number;
        }[];
      };
    }) => {
      if (
        !data?.data?.updatedProducts ||
        !Array.isArray(data.data.updatedProducts)
      ) {
        console.warn("Invalid updatedProducts data:", data);
        return;
      }

      console.log(data, "this is the data");

      const updatedProducts = data.data.updatedProducts;

      const productsMap = new Map(updatedProducts.map((p) => [p.productId, p]));

      const oldProducts = [...products];

      const newProducts = oldProducts.map((prod) => {
        if (productsMap.has(prod._id)) {
          const updatedProduct = productsMap.get(prod._id);
          console.log(updatedProduct);

          if (updatedProduct) {
            console.log(
              prod.name,
              "Is updated with new stock",
              updatedProduct.newStock
            );
            return {
              ...prod,
              stock: updatedProduct.newStock,
            };
          }
        } else {
          console.log("NOT IN THE MAP");
        }
        return prod;
      });
      afterStockUpdated(updatedProducts);

      setProducts(newProducts);
    },
    [products] // Optional: Add as dependency if products changes often (test for loops)
  );

  const handleStockRejected = (requestId: string) => {
    console.log("HANDLING STOCK REJECTION SUCCESSFULLY", requestId);

    const newRequests = requests.map((request) => {
      if (request._id === requestId) {
        return {
          ...request,
          rejected: true,
        };
      }
      return request;
    });
    setRequests(newRequests);
  };
  // const handleTransactionUpdated = useCallback(() => {}, []);

  // const handleProductsUpdated = useCallback(() => {}, []);
  // const handleCategoriesUpdated = useCallback(() => {}, []);
  // const handleCustomersUpdated = useCallback(() => {}, []);
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
    promiseData.push(apiCaller.get("/categories/all-categories"));
    promiseData.push(apiCaller.get("/bills/get-billing-id"));
    promiseData.push(apiCaller.get("/transactions/get-transaction-id"));
    promiseData.push(
      apiCaller.get("/products/get-all-requests", {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      })
    );
    await Promise.all(promiseData)
      .then((responses) => {
        const bills = responses[0].data.data.bills;
        const customers = responses[1].data.data.customers;
        const transactions = responses[2].data.data.transactions;
        const products = responses[3].data.data.products;
        const categories = responses[4].data.data.categories;
        const billingId = responses[5].data.data.billId;
        const transactionId = responses[6].data.data.transactionId;
        const requests = responses[7].data.data.requests;
        console.log(requests, "This are the requests");

        const productsMap: Map<string, number> = new Map(
          products.map((p: Product, i: number) => [p._id, i])
        );
        console.log(productsMap, "This is the products map");
        setProductMap(productsMap);
        setRequests(requests);
        setCustomers(customers);
        setBillingId(billingId);
        setProducts(products);
        setBills(bills);
        setTransactions(transactions);
        setTransactionId(transactionId);
        setCategories(categories);

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
    socket.on(SocketEvents.INVENTORY.UPDATED, handleStockUpdated);
    socket.on(
      SocketEvents.INVENTORY.UPDATE_REQUEST,
      handleInventoryUpdateRequest
    );
    socket.on(SocketEvents.INVENTORY.REJECTED, handleStockRejected);
    socket.on(SocketEvents.BILL.CREATED, handleBillCreated);

    // Cleanup on unmount (though these should persist)
    return () => {
      socket.off(SocketEvents.NOTIFICATION);
      socket.off(SocketEvents.BILL.CREATED);
      socket.off("welcome");
      socket.off(SocketEvents.INVENTORY.UPDATED);
      socket.off(SocketEvents.INVENTORY.UPDATE_REQUEST);
      socket.off(SocketEvents.INVENTORY.REJECTED);
    };
  }, [socket, isConnected, handleNotification, handleBillCreated]);
};
