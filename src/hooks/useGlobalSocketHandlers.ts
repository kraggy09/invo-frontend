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
import useCustomerStore, { ICustomer } from "../store/customer.store";
import useProductStore, { IProduct } from "../store/product.store";
import useCategoriesStore from "../store/categories.store";
import useCurrentBillStore from "../store/currentBill.store";
import useTransactionStore, { ITransaction } from "../store/transaction.store";
import useBillStore from "../store/bill.store";
import { Product, useInventoryRequestStore } from "../store/requests.store";
import { useJourneyStore } from "../store/journey.store";
import useReturnBillStore from "../store/returnBill.store";

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

  // Category store
  const setCategories = useCategoriesStore((state) => state.setCategories);

  // Transaction store
  const setTransactions = useTransactionStore((state) => state.setTransactions);
  const setTransactionId = useTransactionStore(
    (state) => state.setTransactionId
  );
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const approveTransaction = useTransactionStore((state) => state.approveTransaction);
  const rejectTransaction = useTransactionStore((state) => state.rejectTransaction);
  const transactionApprovals = useTransactionStore((state) => state.transactionApprovals);
  const setTransactionApproval = useTransactionStore((state) => state.setTransactionApproval);

  // Bill store
  const setBillingId = useBillStore((state) => state.setBillingId);
  const setBills = useBillStore((state) => state.setBills);
  const addBill = useBillStore((state) => state.addBill);
  const updateBill = useBillStore((state) => state.updateBill);

  const requests = useInventoryRequestStore((state) => state.requests);
  const setRequests = useInventoryRequestStore((state) => state.setRequests);

  // Return Bill store
  const addReturnBill = useReturnBillStore((state) => state.addReturnBill);
  const setReturnBills = useReturnBillStore((state) => state.setReturnBills);

  // Journey logs store
  const addLogFromSocket = useJourneyStore((state) => state.addLogFromSocket);

  // Current bill store
  const afterBillCreated = useCurrentBillStore(
    (state) => state.afterBillCreated
  );
  const afterStockUpdated = useCurrentBillStore(
    (state) => state.afterStockUpdated
  );
  const afterProductUpdated = useCurrentBillStore(
    (state) => state.afterProductUpdated
  );
  const afterProductDeleted = useCurrentBillStore(
    (state) => state.afterProductDeleted
  );

  const productsRef = useRef(products);
  const productMapRef = useRef(productMap);
  const requestsRef = useRef(requests);
  const transactionApprovalsRef = useRef(transactionApprovals);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    productMapRef.current = productMap;
  }, [productMap]);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  useEffect(() => {
    transactionApprovalsRef.current = transactionApprovals;
  }, [transactionApprovals]);

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

  const handleReturnBillCreated = useCallback((data: any) => {
    console.log("New return bill created globally:", data);
    addReturnBill(data.returnBill);
    if (data.transaction) {
      addTransaction(data.transaction);
    }

    let currentCustomer = null;
    if (data.returnBill.customer) {
      const customerId = typeof data.returnBill.customer === 'string' ? data.returnBill.customer : data.returnBill.customer._id;
      currentCustomer = updateOutstanding(customerId, data.updatedOutstanding);
    }
    // Also we should update the old products stock
    if (data.returnBill.items && data.returnBill.items.length > 0) {
      let updatedProducts = [...productsRef.current];
      const productsIdMap = productMapRef.current;
      const itemsMap = new Map();

      data.returnBill.items.forEach((item: any) => {
        const productId = typeof item.product === 'string' ? item.product : item.product._id;
        const productIndex = productsIdMap.get(productId);
        if (productIndex !== undefined) {
          updatedProducts[productIndex].stock += item.quantityReturned;
          itemsMap.set(productId, { newQuantity: updatedProducts[productIndex].stock });
        }
      });
      setProducts(updatedProducts);

      if (currentCustomer) {
        afterBillCreated(currentCustomer, itemsMap);
      }
    } else {
      if (currentCustomer) {
        afterBillCreated(currentCustomer);
      }
    }
  }, [addReturnBill, addTransaction, updateOutstanding, setProducts, afterBillCreated]);

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
        updatedRequests?: {
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

      if (data.data.updatedRequests) {
        const requestsMap = new Map();
        data.data.updatedRequests.forEach((req) => {
          requestsMap.set(req._id, {
            stockAtUpdate: req.previousStock,
            newStock: req.newStock,
          });
        });
        useInventoryRequestStore.getState().afterStockUpdated(requestsMap);
      }

      setProducts(newProducts);
    },
    [afterStockUpdated, setProducts]
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


  const handleTransactionCreated = useCallback((data: { transaction: ITransaction, transactionId: number }) => {
    const { transaction, transactionId } = data
    console.log(transactionId);

    addTransaction(transaction);
    setTransactionId(transactionId)
  }, [addTransaction, setTransactionId]);

  const handleTransactionUpdated = useCallback((data: { transaction: ITransaction, customer: ICustomer, purpose: "ACCEPT" | "REJECT" }) => {
    const { transaction, customer, purpose } = data;
    console.log(data, "This is the data we have in the console");
    if (purpose === "ACCEPT") {
      approveTransaction(transaction);
      if (customer) {
        const updatedCustomer = updateOutstanding(customer._id, customer.outstanding);
        afterBillCreated(updatedCustomer || customer);
      }
    } else if (purpose === "REJECT") {
      rejectTransaction(transaction);
    }

  }, [approveTransaction, rejectTransaction, updateOutstanding, afterBillCreated])

  const handleProductCreated = useCallback((product: IProduct) => {
    console.log("New product created globally:", product);
    addProduct(product);
    message.success(`Product ${product.name} created successfully`);
  }, [addProduct]);

  const handleProductUpdated = useCallback((product: IProduct) => {
    console.log("Product updated globally:", product);
    updateProduct(product);
    afterProductUpdated(product);
  }, [updateProduct, afterProductUpdated]);

  const handleProductDeleted = useCallback((productId: string) => {
    removeProduct(productId);
    afterProductDeleted(productId);
    message.info("A product was removed from the catalog");
  }, [removeProduct, afterProductDeleted]);

  const handleCustomerCreated = useCallback((customer: any) => addCustomer(customer), [addCustomer]);

  const handleJourneyLogCreated = useCallback((log: any) => {
    addLogFromSocket(log);
  }, [addLogFromSocket]);


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
    promiseData.push(apiCaller.get("/transactions/approvals"));
    promiseData.push(
      apiCaller.get("/return-bills", {
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
        const approvals = responses[8].data.data.transactions;
        const returnBillsRes = responses[9]?.data?.data?.returnBills;
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
        setReturnBills(returnBillsRes || []);
        setTransactions(transactions);
        setTransactionId(transactionId);
        setCategories(categories);
        setTransactionApproval(approvals);
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
    socket.on(SocketEvents.BILL.RETURN_CREATED, handleReturnBillCreated);
    socket.on(SocketEvents.PRODUCT.CREATED, handleProductCreated);
    socket.on(SocketEvents.PRODUCT.UPDATED, handleProductUpdated);
    socket.on(SocketEvents.PRODUCT.DELETED, handleProductDeleted);
    socket.on(SocketEvents.CUSTOMER.CREATED, handleCustomerCreated);
    socket.on(SocketEvents.TRANSACTION.CREATED, handleTransactionCreated);
    socket.on(SocketEvents.TRANSACTION.UPDATED, handleTransactionUpdated);
    socket.on("JOURNEY_LOG_CREATED", handleJourneyLogCreated);

    // Cleanup on unmount (though these should persist)
    return () => {
      socket.off(SocketEvents.NOTIFICATION);
      socket.off(SocketEvents.BILL.CREATED);
      socket.off(SocketEvents.BILL.RETURN_CREATED);
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
      socket.off("JOURNEY_LOG_CREATED");
    };
  }, [socket, isConnected, handleWelcomeMessage, handleNotification, handleBillCreated, handleInventoryUpdateRequest, handleStockUpdated, handleStockRejected, handleProductCreated, handleProductUpdated, handleProductDeleted, handleCustomerCreated, handleTransactionCreated, handleTransactionUpdated, handleJourneyLogCreated]);
};
