import { useEffect, useCallback, useRef } from "react";
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
import useProductStore, { IProduct } from "../store/product.store";
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
  const addProduct = useProductStore((state) => state.addProduct);
  const updateProduct = useProductStore((state) => state.updateProduct);
  const removeProduct = useProductStore((state) => state.removeProduct);
  // Customer store
  const setCustomers = useCustomerStore((state) => state.setCustomers);
  const updateOutstanding = useCustomerStore(
    (state) => state.updateOutstanding
  );
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const updateCustomer = useCustomerStore((state) => state.updateCustomer);

  // Category store
  const setCategories = useCategoriesStore((state) => state.setCategories);

  // Transaction store
  const setTransactions = useTransactionStore((state) => state.setTransactions);
  const setTransactionId = useTransactionStore(
    (state) => state.setTransactionId
  );
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);

  // Bill store
  const setBillingId = useBillStore((state) => state.setBillingId);
  const setBills = useBillStore((state) => state.setBills);
  const addBill = useBillStore((state) => state.addBill);
  const updateBill = useBillStore((state) => state.updateBill);

  const requests = useInventoryRequestStore((state) => state.requests);
  const setRequests = useInventoryRequestStore((state) => state.setRequests);
  // Current bill store
  const afterBillCreated = useCurrentBillStore(
    (state) => state.afterBillCreated
  );
  const afterStockUpdated = useCurrentBillStore(
    (state) => state.afterStockUpdated
  );

  const productsRef = useRef(products);
  const productMapRef = useRef(productMap);
  const requestsRef = useRef(requests);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    productMapRef.current = productMap;
  }, [productMap]);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);
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
      const productsIdMap = productMapRef.current;

      let updatedProducts = [...productsRef.current];
      console.log(
        productsIdMap,
        productsRef.current,
        updatedProducts,
        "This is the products ID map"
      );
      const itemsMap = new Map(
        items.map((item) => [
          typeof item.product === "string" ? item.product : item.product._id,
          item,
        ])
      );

      items.forEach((item) => {
        const productId =
          typeof item.product === "string" ? item.product : item.product._id;
        const productIndex = productsIdMap.get(productId);
        if (productIndex !== undefined) {
          updatedProducts[productIndex].stock -= item.quantity;
          console.log("Old Stock and New Stock", {
            oldStock: updatedProducts[productIndex].stock + item.quantity,
            newStock: updatedProducts[productIndex].stock,
          });
        } else {
          console.warn(
            `Product with ID ${productId} not found in products.`
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
      afterBillCreated(customer || updatedCustomer, itemsMap);

      // Show a notfication
      message.success(`New bill created for customer ID`);
    },
    []
  );

  const handleInventoryUpdateRequest = useCallback(
    (data: any) => {
      console.log("CALLING INVENTORY UPDATE REQUEST HANDLER");

      console.log(data, "This is the inventory update request data");
      console.log("requests:", requestsRef.current);
      console.log("data:", data);
      const newRequests = [...data, ...requestsRef.current];
      console.log("newRequests:", newRequests);

      setRequests(newRequests);
    },
    []
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

      const oldProducts = [...productsRef.current];

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
    []
  );

  const handleStockRejected = useCallback((requestId: string) => {
    console.log("HANDLING STOCK REJECTION SUCCESSFULLY", requestId);

    const newRequests = requestsRef.current.map((request) => {
      if (request._id === requestId) {
        return {
          ...request,
          rejected: true,
        };
      }
      return request;
    });
    setRequests(newRequests);
  }, [setRequests]);
  const handleProductCreated = useCallback((product: IProduct) => addProduct(product), [addProduct]);
  const handleProductUpdated = useCallback((product: IProduct) => updateProduct(product), [updateProduct]);
  const handleProductDeleted = useCallback((productId: string) => removeProduct(productId), [removeProduct]);

  const handleCustomerCreated = useCallback((customer: any) => addCustomer(customer), [addCustomer]);
  const handleCustomerUpdated = useCallback((customer: any) => updateCustomer(customer), [updateCustomer]);

  const handleTransactionCreated = useCallback((transaction: any) => addTransaction(transaction), [addTransaction]);
  const handleTransactionUpdated = useCallback((transaction: any) => updateTransaction(transaction._id, transaction), [updateTransaction]);

  const handleBillUpdated = useCallback(
    (data: any) => {
      console.log("Bill updated via socket:", data);
      updateBill(data);
    },
    [updateBill]
  );

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
      apiCaller.get("/bills", {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      })
    );

    promiseData.push(apiCaller.get("/customers"));

    promiseData.push(
      apiCaller.get("/transactions", {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      })
    );

    promiseData.push(apiCaller.get("/products"));
    promiseData.push(apiCaller.get("/categories"));
    promiseData.push(apiCaller.get("/bills/latest-id"));
    promiseData.push(apiCaller.get("/transactions/latest-id"));
    promiseData.push(
      apiCaller.get("/stocks/requests/all", {
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
    socket.on(SocketEvents.BILL.UPDATED, handleBillUpdated);
    socket.on(SocketEvents.PRODUCT.CREATED, handleProductCreated);
    socket.on(SocketEvents.PRODUCT.UPDATED, handleProductUpdated);
    socket.on(SocketEvents.PRODUCT.DELETED, handleProductDeleted);
    socket.on(SocketEvents.CUSTOMER.CREATED, handleCustomerCreated);
    socket.on(SocketEvents.CUSTOMER.UPDATED, handleCustomerUpdated);
    socket.on(SocketEvents.TRANSACTION.CREATED, handleTransactionCreated);
    socket.on(SocketEvents.TRANSACTION.UPDATED, handleTransactionUpdated);

    // Cleanup on unmount (though these should persist)
    return () => {
      socket.off(SocketEvents.NOTIFICATION);
      socket.off(SocketEvents.BILL.CREATED);
      socket.off(SocketEvents.BILL.UPDATED);
      socket.off("welcome");
      socket.off(SocketEvents.INVENTORY.UPDATED);
      socket.off(SocketEvents.INVENTORY.UPDATE_REQUEST);
      socket.off(SocketEvents.INVENTORY.REJECTED);
      socket.off(SocketEvents.PRODUCT.CREATED);
      socket.off(SocketEvents.PRODUCT.UPDATED);
      socket.off(SocketEvents.PRODUCT.DELETED);
      socket.off(SocketEvents.CUSTOMER.CREATED);
      socket.off(SocketEvents.CUSTOMER.UPDATED);
      socket.off(SocketEvents.TRANSACTION.CREATED);
      socket.off(SocketEvents.TRANSACTION.UPDATED);
    };
  }, [socket, isConnected, handleWelcomeMessage, handleNotification, handleBillCreated, handleBillUpdated, handleInventoryUpdateRequest, handleStockUpdated, handleStockRejected, handleProductCreated, handleProductUpdated, handleProductDeleted, handleCustomerCreated, handleCustomerUpdated, handleTransactionCreated, handleTransactionUpdated]);
};
