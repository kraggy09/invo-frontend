import { useEffect, useCallback, useRef } from "react";
import { useSocket } from "../contexts/SocketContext";
import {
  SocketEvents,
  NotificationEvent,
  BillCreatedEvent,
} from "../types/socket";
import { message, modal } from "../utils/antdStatic";
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
import useSupplierStore from "../store/supplier.store";
import useSupplierPurchaseStore from "../store/supplierPurchase.store";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Initialize dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export const useGlobalSocketHandlers = () => {
  const { socket, isConnected, terminateSession, blockSession } = useSocket();

  // Zustands optimized with selectors

  // User store
  const setSocketId = useUserStore((state) => state.setSocketId);

  const user = useUserStore((state) => state.user);
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
    (state) => state.updateOutstanding,
  );
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const updateCustomerStore = useCustomerStore((state) => state.updateCustomer);

  // Category store
  const setCategories = useCategoriesStore((state) => state.setCategories);
  const addCategory = useCategoriesStore((state) => state.addCategory);
  const updateCategoryStore = useCategoriesStore(
    (state) => state.updateCategory,
  );
  const removeCategory = useCategoriesStore((state) => state.removeCategory);

  // Transaction store
  const setTransactions = useTransactionStore((state) => state.setTransactions);
  const setTransactionId = useTransactionStore(
    (state) => state.setTransactionId,
  );
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const approveTransaction = useTransactionStore(
    (state) => state.approveTransaction,
  );
  const rejectTransaction = useTransactionStore(
    (state) => state.rejectTransaction,
  );
  const transactionApprovals = useTransactionStore(
    (state) => state.transactionApprovals,
  );
  const setTransactionApproval = useTransactionStore(
    (state) => state.setTransactionApproval,
  );

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
  const setPendingReturnBills = useReturnBillStore(
    (state) => state.setPendingReturnBills,
  );
  const addPendingReturnBill = useReturnBillStore(
    (state) => state.addPendingReturnBill,
  );
  const removePendingReturnBill = useReturnBillStore(
    (state) => state.removePendingReturnBill,
  );
  const updateReturnBillInStore = useReturnBillStore(
    (state) => state.updateReturnBill,
  );

  // Supplier store
  const setSuppliers = useSupplierStore((state) => state.setSuppliers);
  const addSupplier = useSupplierStore((state) => state.addSupplier);
  const updateSupplier = useSupplierStore((state) => state.updateSupplier);

  // Supplier purchase store
  const setSupplierPurchases = useSupplierPurchaseStore(
    (state) => state.setPurchases,
  );
  const addSupplierPurchase = useSupplierPurchaseStore(
    (state) => state.addPurchase,
  );
  const updateSupplierPurchase = useSupplierPurchaseStore(
    (state) => state.updatePurchase,
  );
  const approveSupplierPurchase = useSupplierPurchaseStore(
    (state) => state.approvePurchase,
  );
  const rejectSupplierPurchase = useSupplierPurchaseStore(
    (state) => state.rejectPurchase,
  );

  // Journey logs store
  const addLogFromSocket = useJourneyStore((state) => state.addLogFromSocket);

  // Current bill store
  const afterBillCreated = useCurrentBillStore(
    (state) => state.afterBillCreated,
  );
  const afterStockUpdated = useCurrentBillStore(
    (state) => state.afterStockUpdated,
  );
  const afterProductUpdated = useCurrentBillStore(
    (state) => state.afterProductUpdated,
  );
  const afterProductDeleted = useCurrentBillStore(
    (state) => state.afterProductDeleted,
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

  const handleBillCreated = useCallback((data: BillCreatedEvent) => {
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
      "This is the products ID map",
    );
    const itemsMap = new Map(
      items.map((item) => [
        typeof item.product === "string" ? item.product : item.product._id,
        item,
      ]),
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
        console.warn(`Product with ID ${productId} not found in products.`);
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
      updatedCustomer.outstanding,
    );
    afterBillCreated(customer || updatedCustomer, itemsMap);

    // Show a notfication
    message.success(`New bill created for customer ID`);
  }, []);

  const handleReturnBillCreated = useCallback(
    (data: any) => {
      console.log("New return bill initiated globally:", data);
      if (data.returnBill) {
        addReturnBill(data.returnBill);
        if (data.returnBill.status === "PENDING") {
          addPendingReturnBill(data.returnBill);
          message.info(
            `Return Bill #R-${data.returnBill.id} initiated. Awaiting admin approval.`,
          );
        }
      }
    },
    [addReturnBill, addPendingReturnBill],
  );

  const handleReturnBillApproved = useCallback(
    (data: any) => {
      console.log("Return bill approved globally:", data);
      const { returnBill, transaction, updatedOutstanding } = data;
      if (returnBill) {
        updateReturnBillInStore(returnBill);
        removePendingReturnBill(returnBill._id);
      }
      if (transaction) {
        addTransaction(transaction);
        const txId = transaction.id ?? data.transactionId;
        if (txId !== undefined && txId !== null) {
          setTransactionId(txId);
        }
      } else if (
        data.transactionId !== undefined &&
        data.transactionId !== null
      ) {
        setTransactionId(data.transactionId);
      }

      let currentCustomer: any = null;
      const targetOutstanding =
        updatedOutstanding !== undefined
          ? updatedOutstanding
          : returnBill?.newOutstanding !== undefined
            ? returnBill.newOutstanding
            : typeof returnBill?.customer === "object"
              ? returnBill.customer.outstanding
              : undefined;

      if (returnBill?.customer) {
        const customerId =
          typeof returnBill.customer === "string"
            ? returnBill.customer
            : returnBill.customer._id?.toString();

        if (customerId && targetOutstanding !== undefined) {
          currentCustomer = updateOutstanding(customerId, targetOutstanding);
        }

        if (typeof returnBill.customer === "object" && returnBill.customer) {
          const customerObj = {
            ...returnBill.customer,
            ...(targetOutstanding !== undefined
              ? { outstanding: targetOutstanding }
              : {}),
          };
          updateCustomerStore(customerObj);
          if (!currentCustomer) {
            currentCustomer = customerObj;
          }
        }
      }

      if (returnBill?.items && returnBill.items.length > 0) {
        const returnMap = new Map<string, number>();
        returnBill.items.forEach((item: any) => {
          const pid = String(
            typeof item.product === "string"
              ? item.product
              : item.product?._id || item.product,
          );
          returnMap.set(
            pid,
            (returnMap.get(pid) || 0) + (Number(item.quantityReturned) || 0),
          );
        });

        const itemsMap = new Map();
        const updatedProducts = (productsRef.current || []).map((prod) => {
          const prodId = String(prod._id);
          if (returnMap.has(prodId)) {
            const returnedQty = returnMap.get(prodId) || 0;
            const newStock = (prod.stock || 0) + returnedQty;
            itemsMap.set(prodId, { newQuantity: newStock });
            return {
              ...prod,
              stock: newStock,
            };
          }
          return prod;
        });

        setProducts(updatedProducts);

        if (currentCustomer) {
          afterBillCreated(currentCustomer, itemsMap);
        }
      } else if (currentCustomer) {
        afterBillCreated(currentCustomer);
      }

      message.success(`Return Bill #R-${returnBill?.id || ""} approved.`);
    },
    [
      updateReturnBillInStore,
      removePendingReturnBill,
      addTransaction,
      setTransactionId,
      updateOutstanding,
      updateCustomerStore,
      setProducts,
      afterBillCreated,
    ],
  );

  const handleReturnBillRejected = useCallback(
    (data: any) => {
      console.log("Return bill rejected globally:", data);
      if (data.returnBill) {
        updateReturnBillInStore(data.returnBill);
        removePendingReturnBill(data.returnBill._id);
        message.warning(`Return Bill #R-${data.returnBill.id} was rejected.`);
      }
    },
    [updateReturnBillInStore, removePendingReturnBill],
  );

  const handleBillUpdated = useCallback(
    (data: any) => {
      console.log("Bill updated globally via socket:", data);

      const bill = data.bill;
      const updatedCustomer = data.updatedCustomer || data.customer;
      const stockDeltas = data.stockDeltas || [];
      const productsIdMap = productMapRef.current;

      // 1. Update bill in BillStore
      if (bill) {
        updateBill(bill);
      }

      // 2. Adjust product stocks in ProductStore
      let updatedProducts = [...productsRef.current];
      const itemsMap = new Map();

      if (stockDeltas.length > 0) {
        stockDeltas.forEach(
          ({ productId, delta }: { productId: string; delta: number }) => {
            const productIndex = productsIdMap.get(productId);
            if (productIndex !== undefined) {
              updatedProducts[productIndex].stock += delta;
              itemsMap.set(productId, {
                newQuantity: updatedProducts[productIndex].stock,
              });
            }
          },
        );
        setProducts(updatedProducts);
      }

      // 3. Update customer outstanding in CustomerStore
      let currentCustomer = null;
      if (updatedCustomer) {
        const customerId =
          typeof updatedCustomer === "string"
            ? updatedCustomer
            : updatedCustomer._id;
        currentCustomer = updateOutstanding(
          customerId,
          updatedCustomer.outstanding,
        );
      }

      // 4. Synchronize active POS carts & open billing tabs
      if (currentCustomer || updatedCustomer) {
        afterBillCreated(
          currentCustomer || updatedCustomer,
          itemsMap.size > 0 ? itemsMap : undefined,
        );
      }

      message.info(`Bill #${bill?.id || data.billId || ""} was updated`);
    },
    [updateBill, setProducts, updateOutstanding, afterBillCreated],
  );

  const handleInventoryUpdateRequest = useCallback((data: any) => {
    console.log("CALLING INVENTORY UPDATE REQUEST HANDLER");

    console.log(data, "This is the inventory update request data");
    console.log("requests:", requestsRef.current);
    console.log("data:", data);
    const newRequests = [...data, ...requestsRef.current];
    console.log("newRequests:", newRequests);

    setRequests(newRequests);
  }, []);

  const handleStockUpdated = useCallback(
    (data: {
      action?: string;
      data: {
        updatedProducts: {
          newStock: number;
          previousStock: number;
          productId: string;
          quantityAdded: number;
          costPrice?: number;
          retailPrice?: number;
          wholesalePrice?: number;
          superWholesalePrice?: number;
        }[];
        updatedRequests?: any[];
        stockDocs?: any[];
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
              updatedProduct.newStock,
              "and prices:",
              updatedProduct.retailPrice,
              updatedProduct.costPrice,
            );
            return {
              ...prod,
              stock: updatedProduct.newStock,
              costPrice:
                updatedProduct.costPrice !== undefined
                  ? updatedProduct.costPrice
                  : prod.costPrice,
              retailPrice:
                updatedProduct.retailPrice !== undefined
                  ? updatedProduct.retailPrice
                  : prod.retailPrice,
              wholesalePrice:
                updatedProduct.wholesalePrice !== undefined
                  ? updatedProduct.wholesalePrice
                  : prod.wholesalePrice,
              superWholesalePrice:
                updatedProduct.superWholesalePrice !== undefined
                  ? updatedProduct.superWholesalePrice
                  : prod.superWholesalePrice,
            };
          }
        } else {
          console.log("NOT IN THE MAP");
        }
        return prod;
      });
      afterStockUpdated(updatedProducts);

      if (
        data.data.updatedRequests &&
        Array.isArray(data.data.updatedRequests)
      ) {
        const requestsMap = new Map();
        data.data.updatedRequests.forEach((req) => {
          requestsMap.set(req._id, {
            stockAtUpdate: req.previousStock ?? req.stockAtUpdate,
            newStock: req.newStock,
          });
        });
        useInventoryRequestStore.getState().afterStockUpdated(requestsMap);
        useInventoryRequestStore
          .getState()
          .addOrUpdateRequests(data.data.updatedRequests);
      }

      if (data.data.stockDocs && Array.isArray(data.data.stockDocs)) {
        useInventoryRequestStore
          .getState()
          .addOrUpdateRequests(data.data.stockDocs);
      }

      setProducts(newProducts);
    },
    [afterStockUpdated, setProducts],
  );

  const handleStockRejected = useCallback(
    (requestId: string) => {
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
    },
    [setRequests],
  );

  const handleTransactionCreated = useCallback(
    (data: {
      transaction: ITransaction;
      transactionId: number;
      supplier?: any;
      customer?: any;
    }) => {
      const { transaction, transactionId, supplier, customer } = data;
      if (!transaction) return;
      console.log("New transaction created globally:", data);

      addTransaction(transaction);
      if (transactionId) {
        setTransactionId(transactionId);
      }

      // Handle supplier update if supplier payment
      const supplierData =
        supplier ||
        (typeof transaction.supplier === "object"
          ? transaction.supplier
          : null);

      if (supplierData && supplierData._id) {
        updateSupplier(supplierData);
      } else if (
        transaction.supplier &&
        transaction.newOutstanding !== undefined
      ) {
        useSupplierStore
          .getState()
          .updateOutstanding(
            transaction.supplier.toString(),
            transaction.newOutstanding,
          );
      }

      // Handle customer update if customer payment
      const customerData =
        customer ||
        (typeof transaction.customer === "object"
          ? transaction.customer
          : null);

      if (customerData && customerData._id) {
        updateOutstanding(customerData._id, customerData.outstanding);
      } else if (
        transaction.customer &&
        transaction.newOutstanding !== undefined
      ) {
        updateOutstanding(
          transaction.customer.toString(),
          transaction.newOutstanding,
        );
      }

      const party =
        supplierData?.name || customerData?.name || transaction.name || "Party";
      const isPaymentIn = transaction.paymentIn ?? !transaction.taken;
      message.info(
        `Payment of ₹${transaction.amount} ${isPaymentIn ? "received from" : "paid to"} ${party}`,
      );
    },
    [addTransaction, setTransactionId, updateSupplier, updateOutstanding],
  );

  const handleTransactionUpdated = useCallback(
    (data: {
      transaction: ITransaction;
      customer?: ICustomer;
      supplier?: any;
      purpose: "ACCEPT" | "REJECT";
    }) => {
      const { transaction, customer, supplier, purpose } = data;
      console.log(data, "This is the data we have in the console");
      if (purpose === "ACCEPT") {
        approveTransaction(transaction);
        if (customer) {
          const updatedCustomer = updateOutstanding(
            customer._id,
            customer.outstanding,
          );
          afterBillCreated(updatedCustomer || customer);
        }
        if (supplier) {
          updateSupplier(supplier);
        }
      } else if (purpose === "REJECT") {
        rejectTransaction(transaction);
      }
    },
    [
      approveTransaction,
      rejectTransaction,
      updateOutstanding,
      updateSupplier,
      afterBillCreated,
    ],
  );

  const handleProductCreated = useCallback(
    (product: IProduct) => {
      console.log("New product created globally:", product);
      addProduct(product);
      message.success(`Product ${product.name} created successfully`);
    },
    [addProduct],
  );

  const handleProductUpdated = useCallback(
    (product: IProduct) => {
      console.log("Product updated globally:", product);
      updateProduct(product);
      afterProductUpdated(product);
    },
    [updateProduct, afterProductUpdated],
  );

  const handleProductDeleted = useCallback(
    (productId: string) => {
      removeProduct(productId);
      afterProductDeleted(productId);
      message.info("A product was removed from the catalog");
    },
    [removeProduct, afterProductDeleted],
  );

  const handleCategoryCreated = useCallback(
    (category: any) => {
      addCategory(category);
      message.success(`Category ${category.name} created`);
    },
    [addCategory],
  );

  const handleCategoryUpdated = useCallback(
    (category: any) => {
      updateCategoryStore(category);
      message.success(`Category ${category.name} updated`);
    },
    [updateCategoryStore],
  );

  const handleCategoryDeleted = useCallback(
    (categoryId: string) => {
      removeCategory(categoryId);
      message.info("A category was removed");
    },
    [removeCategory],
  );

  const handleCustomerCreated = useCallback(
    (customer: any) => addCustomer(customer),
    [addCustomer],
  );

  const handleCustomerUpdated = useCallback(
    (data: any) => {
      if (!data) return;
      const customer = data.updatedCustomer || data.customer || data;
      if (!customer || !(customer._id || customer.id)) return;

      console.log("Customer updated globally via socket:", customer);
      updateCustomerStore(customer);
      afterBillCreated(customer);
    },
    [updateCustomerStore, afterBillCreated],
  );

  const handleJourneyLogCreated = useCallback(
    (log: any) => {
      addLogFromSocket(log);
    },
    [addLogFromSocket],
  );

  const handleSupplierCreated = useCallback(
    (supplier: any) => {
      addSupplier(supplier);
    },
    [addSupplier],
  );

  const handleSupplierUpdated = useCallback(
    (supplier: any) => {
      updateSupplier(supplier);
    },
    [updateSupplier],
  );

  const handleSupplierPurchaseCreated = useCallback(
    (purchase: any) => {
      addSupplierPurchase(purchase);
      message.info(
        `New purchase request from ${purchase.supplier?.name || "supplier"}`,
      );
    },
    [addSupplierPurchase],
  );

  const handleSupplierPurchaseAccepted = useCallback(
    (purchase: any) => {
      updateSupplierPurchase(purchase);
      message.info("Purchase request accepted and prices updated");
    },
    [updateSupplierPurchase],
  );

  const handleSupplierPurchaseApproved = useCallback(
    (purchase: any) => {
      if (!purchase) return;

      approveSupplierPurchase(purchase);
      if (purchase?.supplier) {
        useSupplierStore.getState().updateSupplier(purchase.supplier);
      }

      // Sync updated products, stock, and pricing details
      const updatedProductsMap = new Map<string, any>();
      if (purchase.updatedProducts && Array.isArray(purchase.updatedProducts)) {
        purchase.updatedProducts.forEach((p: any) => {
          const pid = p.productId ? p.productId.toString() : p._id?.toString();
          if (pid) {
            updatedProductsMap.set(pid, p);
          }
        });
      }

      const itemsMap = new Map<string, any>();
      if (purchase.items && Array.isArray(purchase.items)) {
        purchase.items.forEach((item: any) => {
          const pid = item.product?._id
            ? item.product._id.toString()
            : item.product
            ? item.product.toString()
            : item.productId?.toString();
          if (pid) {
            itemsMap.set(pid, item);
          }
        });
      }

      const oldProducts = [...productsRef.current];
      const productsForBillUpdate: {
        productId: string;
        previousStock: number;
        newStock: number;
        quantityAdded: number;
        costPrice?: number;
        retailPrice?: number;
        wholesalePrice?: number;
        superWholesalePrice?: number;
      }[] = [];

      const newProducts = oldProducts.map((prod) => {
        const prodId = prod._id?.toString();
        if (updatedProductsMap.has(prodId) || itemsMap.has(prodId)) {
          const upProduct = updatedProductsMap.get(prodId);
          const item = itemsMap.get(prodId);

          const itemProductObj =
            item?.product && typeof item.product === "object" ? item.product : {};

          const qtyAdded =
            upProduct?.quantityAdded !== undefined
              ? upProduct.quantityAdded
              : item?.quantity !== undefined
              ? Number(item.quantity)
              : 0;

          const newStock =
            upProduct?.newStock !== undefined
              ? upProduct.newStock
              : itemProductObj.stock !== undefined
              ? itemProductObj.stock
              : prod.stock + qtyAdded;

          const costPrice =
            upProduct?.costPrice !== undefined
              ? upProduct.costPrice
              : item?.newCostPrice !== undefined
              ? item.newCostPrice
              : itemProductObj.costPrice !== undefined
              ? itemProductObj.costPrice
              : prod.costPrice;

          const retailPrice =
            upProduct?.retailPrice !== undefined
              ? upProduct.retailPrice
              : item?.newRetailPrice !== undefined
              ? item.newRetailPrice
              : itemProductObj.retailPrice !== undefined
              ? itemProductObj.retailPrice
              : prod.retailPrice;

          const wholesalePrice =
            upProduct?.wholesalePrice !== undefined
              ? upProduct.wholesalePrice
              : item?.newWholesalePrice !== undefined
              ? item.newWholesalePrice
              : itemProductObj.wholesalePrice !== undefined
              ? itemProductObj.wholesalePrice
              : prod.wholesalePrice;

          const superWholesalePrice =
            upProduct?.superWholesalePrice !== undefined
              ? upProduct.superWholesalePrice
              : item?.newSuperWholesalePrice !== undefined
              ? item.newSuperWholesalePrice
              : itemProductObj.superWholesalePrice !== undefined
              ? itemProductObj.superWholesalePrice
              : prod.superWholesalePrice;

          const mergedProd: IProduct = {
            ...prod,
            ...itemProductObj,
            _id: prod._id,
            stock: newStock,
            costPrice,
            retailPrice,
            wholesalePrice,
            superWholesalePrice,
          };

          productsForBillUpdate.push({
            productId: prodId,
            previousStock: prod.stock,
            newStock,
            quantityAdded: qtyAdded,
            costPrice,
            retailPrice,
            wholesalePrice,
            superWholesalePrice,
          });

          afterProductUpdated(mergedProd);

          return mergedProd;
        }
        return prod;
      });

      // Handle any new product added during purchase that wasn't in productsRef
      itemsMap.forEach((item, pid) => {
        if (
          !oldProducts.some((p) => p._id?.toString() === pid) &&
          typeof item.product === "object" &&
          item.product?._id
        ) {
          const upProduct = updatedProductsMap.get(pid);
          const qtyAdded =
            upProduct?.quantityAdded ?? (Number(item.quantity) || 0);
          const newStock =
            upProduct?.newStock ??
            (item.product.stock !== undefined ? item.product.stock : qtyAdded);
          const brandNewProd: IProduct = {
            ...item.product,
            _id: pid,
            stock: newStock,
            costPrice:
              upProduct?.costPrice ?? item.newCostPrice ?? item.product.costPrice,
            retailPrice:
              upProduct?.retailPrice ??
              item.newRetailPrice ??
              item.product.retailPrice,
            wholesalePrice:
              upProduct?.wholesalePrice ??
              item.newWholesalePrice ??
              item.product.wholesalePrice,
            superWholesalePrice:
              upProduct?.superWholesalePrice ??
              item.newSuperWholesalePrice ??
              item.product.superWholesalePrice,
          };
          newProducts.push(brandNewProd);
          productsForBillUpdate.push({
            productId: pid,
            previousStock: 0,
            newStock,
            quantityAdded: qtyAdded,
            costPrice: brandNewProd.costPrice,
            retailPrice: brandNewProd.retailPrice,
            wholesalePrice: brandNewProd.wholesalePrice,
            superWholesalePrice: brandNewProd.superWholesalePrice,
          });
          afterProductUpdated(brandNewProd);
        }
      });

      if (productsForBillUpdate.length > 0) {
        afterStockUpdated(productsForBillUpdate);
        setProducts(newProducts);
      }

      if (purchase.stockDocs && Array.isArray(purchase.stockDocs)) {
        useInventoryRequestStore
          .getState()
          .addOrUpdateRequests(purchase.stockDocs);
      }

      message.success(`Purchase #${purchase._id?.slice(-6)} approved`);
    },
    [
      approveSupplierPurchase,
      afterProductUpdated,
      afterStockUpdated,
      setProducts,
    ],
  );

  const handleSupplierPurchaseRejected = useCallback(
    (purchase: any) => {
      rejectSupplierPurchase(purchase?._id || purchase);
      message.warning("Purchase request was rejected");
    },
    [rejectSupplierPurchase],
  );

  const handleWelcomeMessage = useCallback(
    async (data: { socketId: string }) => {
      console.log("Welcome message from server:", data);
      setSocketId(data.socketId);
      await fetchInitialData();
      message.info("Welcome to the billing system!");
    },
    [],
  );
  const fetchInitialData = useCallback(async () => {
    // Ensure all initial data fetching is based on Asia/Kolkata timing
    const indiaNow = dayjs().tz("Asia/Kolkata");
    const startDate = indiaNow.startOf("day").toISOString();
    const endDate = indiaNow.endOf("day").toISOString();

    const results = await Promise.allSettled([
      apiCaller.get("/bills", {
        params: {
          startDate: startDate,
          endDate: endDate,
          limit: 10000,
        },
      }),
      apiCaller.get("/customers"),
      apiCaller.get("/transactions", {
        params: {
          startDate: startDate,
          endDate: endDate,
          limit: 10000,
        },
      }),
      apiCaller.get("/products"),
      apiCaller.get("/categories"),
      apiCaller.get("/bills/latest-id"),
      apiCaller.get("/transactions/latest-id"),
      apiCaller.get("/stocks/requests/all", {
        params: {
          startDate: startDate,
          endDate: endDate,
          limit: 10000,
        },
      }),
      apiCaller.get("/transactions/approvals"),
      apiCaller.get("/return-bills", {
        params: {
          startDate: startDate,
          endDate: endDate,
          limit: 10000,
        },
      }),
      apiCaller.get("/suppliers"),
      apiCaller.get("/supplier-purchases"),
      apiCaller.get("/return-bills", {
        params: {
          status: "PENDING",
          limit: 1000,
        },
      }),
    ]);

    const getVal = (index: number, path: (data: any) => any, fallback: any) => {
      const res = results[index];
      console.log("This is the response", res);

      if (res?.status === "fulfilled" && res.value?.data?.data) {
        try {
          const val = path(res.value.data.data);
          return val !== undefined && val !== null ? val : fallback;
        } catch {
          return fallback;
        }
      }
      return fallback;
    };

    console.log(
      results,
      getVal(3, (d) => d.products, []),
      "This are the results",
    );

    const bills = getVal(0, (d) => d.bills, []);
    const customers = getVal(1, (d) => d.customers, []);
    const transactions = getVal(2, (d) => d.transactions, []);
    const products = getVal(3, (d) => d.products, []);
    const categories = getVal(4, (d) => d.categories, []);
    const billingId = getVal(5, (d) => d.billId, 0);
    const transactionId = getVal(6, (d) => d.transactionId, 0);
    const requests = getVal(7, (d) => d.requests, []);
    const approvals = getVal(8, (d) => d.transactions, []);
    const returnBillsRes = getVal(9, (d) => d.returnBills, []);
    const suppliers = getVal(10, (d) => d.suppliers, []);
    const purchases = getVal(11, (d) => d.purchases, []);
    const pendingReturns = getVal(12, (d) => d.returnBills, []);

    const productsMap: Map<string, number> = new Map(
      (products || []).map((p: Product, i: number) => [p._id, i]),
    );
    setProductMap(productsMap);
    setRequests(requests);
    setCustomers(customers);
    setBillingId(billingId);
    setProducts(products);
    setBills(bills);
    setReturnBills(returnBillsRes || []);
    setPendingReturnBills(pendingReturns || []);
    setTransactions(transactions);
    setTransactionId(transactionId);
    setCategories(categories);
    setTransactionApproval(approvals);
    setSuppliers(suppliers);
    setSupplierPurchases(purchases);
  }, [
    setProductMap,
    setRequests,
    setCustomers,
    setBillingId,
    setProducts,
    setBills,
    setReturnBills,
    setTransactions,
    setTransactionId,
    setCategories,
    setTransactionApproval,
    setPendingReturnBills,
  ]);

  const modalVisibleRef = useRef(false);

  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.on(SocketEvents.NOTIFICATION, handleNotification);
    socket.on("welcome", handleWelcomeMessage);
    socket.on(SocketEvents.INVENTORY.UPDATED, handleStockUpdated);
    socket.on(SocketEvents.INVENTORY.STOCK_UPDATED, handleStockUpdated);
    socket.on(
      SocketEvents.INVENTORY.UPDATE_REQUEST,
      handleInventoryUpdateRequest,
    );
    socket.on(SocketEvents.INVENTORY.REJECTED, handleStockRejected);
    socket.on(SocketEvents.BILL.CREATED, handleBillCreated);
    socket.on(SocketEvents.BILL.RETURN_CREATED, handleReturnBillCreated);
    socket.on(SocketEvents.BILL.RETURN_APPROVED, handleReturnBillApproved);
    socket.on(SocketEvents.BILL.RETURN_REJECTED, handleReturnBillRejected);
    socket.on(SocketEvents.BILL.UPDATED, handleBillUpdated);
    socket.on(SocketEvents.PRODUCT.CREATED, handleProductCreated);
    socket.on(SocketEvents.PRODUCT.UPDATED, handleProductUpdated);
    socket.on(SocketEvents.PRODUCT.DELETED, handleProductDeleted);
    socket.on(SocketEvents.CUSTOMER.CREATED, handleCustomerCreated);
    socket.on(SocketEvents.CUSTOMER.UPDATED, handleCustomerUpdated);
    socket.on(SocketEvents.TRANSACTION.CREATED, handleTransactionCreated);
    socket.on(SocketEvents.TRANSACTION.UPDATED, handleTransactionUpdated);
    socket.on(SocketEvents.CATEGORY.CREATED, handleCategoryCreated);
    socket.on(SocketEvents.CATEGORY.UPDATED, handleCategoryUpdated);
    socket.on(SocketEvents.CATEGORY.DELETED, handleCategoryDeleted);
    socket.on("JOURNEY_LOG_CREATED", handleJourneyLogCreated);
    socket.on(SocketEvents.SUPPLIER.CREATED, handleSupplierCreated);
    socket.on(SocketEvents.SUPPLIER.UPDATED, handleSupplierUpdated);
    socket.on(
      SocketEvents.SUPPLIER_PURCHASE.CREATED,
      handleSupplierPurchaseCreated,
    );
    socket.on(
      SocketEvents.SUPPLIER_PURCHASE.ACCEPTED,
      handleSupplierPurchaseAccepted,
    );
    socket.on(
      SocketEvents.SUPPLIER_PURCHASE.APPROVED,
      handleSupplierPurchaseApproved,
    );
    socket.on(
      SocketEvents.SUPPLIER_PURCHASE.REJECTED,
      handleSupplierPurchaseRejected,
    );

    socket.on("SESSION_ALREADY_ACTIVE", () => {
      if (modalVisibleRef.current) return;
      modalVisibleRef.current = true;

      modal.confirm({
        title: "Connection Active in Another Tab",
        content:
          "You already have an active session in another tab. Do you want to use this tab instead?",
        okText: "Switch to this tab",
        cancelText: "Cancel",
        onOk: () => {
          modalVisibleRef.current = false;
          socket.emit("FORCE_SESSION");
        },
        onCancel: () => {
          modalVisibleRef.current = false;
          // Block this tab — can't use it, session is elsewhere
          terminateSession();
          blockSession();
        },
      });
    });

    socket.on("SESSION_TERMINATED", () => {
      // Disable reconnection first so the old tab doesn't fight the new session
      terminateSession();
      blockSession();
    });

    // Cleanup on unmount (though these should persist)
    return () => {
      socket.off(SocketEvents.NOTIFICATION);
      socket.off(SocketEvents.BILL.CREATED);
      socket.off(SocketEvents.BILL.RETURN_CREATED);
      socket.off(SocketEvents.BILL.RETURN_APPROVED);

      socket.off(SocketEvents.BILL.RETURN_REJECTED);
      socket.off(SocketEvents.BILL.UPDATED);
      socket.off("welcome");
      socket.off(SocketEvents.INVENTORY.UPDATED);
      socket.off(SocketEvents.INVENTORY.STOCK_UPDATED);
      socket.off(SocketEvents.INVENTORY.UPDATE_REQUEST);
      socket.off(SocketEvents.INVENTORY.REJECTED);
      socket.off(SocketEvents.PRODUCT.CREATED);
      socket.off(SocketEvents.PRODUCT.UPDATED);
      socket.off(SocketEvents.PRODUCT.DELETED);
      socket.off(SocketEvents.CUSTOMER.CREATED);
      socket.off(SocketEvents.CUSTOMER.UPDATED);
      socket.off(SocketEvents.TRANSACTION.CREATED);
      socket.off(SocketEvents.TRANSACTION.UPDATED);
      socket.off(SocketEvents.CATEGORY.CREATED);
      socket.off(SocketEvents.CATEGORY.UPDATED);
      socket.off(SocketEvents.CATEGORY.DELETED);
      socket.off("JOURNEY_LOG_CREATED");
      socket.off(SocketEvents.SUPPLIER.CREATED);
      socket.off(SocketEvents.SUPPLIER.UPDATED);
      socket.off(SocketEvents.SUPPLIER_PURCHASE.CREATED);
      socket.off(SocketEvents.SUPPLIER_PURCHASE.ACCEPTED);
      socket.off(SocketEvents.SUPPLIER_PURCHASE.APPROVED);
      socket.off(SocketEvents.SUPPLIER_PURCHASE.REJECTED);
      socket.off("SESSION_ALREADY_ACTIVE");
      socket.off("SESSION_TERMINATED");
    };
  }, [
    socket,
    isConnected,
    handleWelcomeMessage,
    handleNotification,
    handleBillCreated,
    handleInventoryUpdateRequest,
    handleStockUpdated,
    handleStockRejected,
    handleProductCreated,
    handleProductUpdated,
    handleProductDeleted,
    handleCustomerCreated,
    handleCustomerUpdated,
    handleTransactionCreated,
    handleTransactionUpdated,
    handleJourneyLogCreated,
    handleCategoryCreated,
    handleCategoryUpdated,
    handleCategoryDeleted,
  ]);
};
