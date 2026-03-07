import { Bill } from "../store/bill.store";
import { ICustomer } from "../store/customer.store";
import { ITransaction } from "../store/transaction.store";

// Bill related events

export interface PurchasedBill {
  id: number;
  customer: string;
  createdBy: string;
  items: Array<{
    previousQuantity: number;
    newQuantity: number;
    product: string;
    quantity: number;
    discount: number;
    type: string;
    total: number;
    costPrice: number;
    _id: string;
  }>;
  total: number;
  payment: number;
  discount: number;
  _id: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
export interface BillCreatedEvent {
  bill: Bill;
  billId: number;
  transaction: ITransaction;
  transactionId: number;
  updatedCustomer: ICustomer;
}

export interface BillUpdatedEvent {
  id: string;
  total: number;
  status: "pending" | "paid" | "cancelled";
  updatedAt: string;
}

export interface BillDeletedEvent {
  id: string;
  deletedAt: string;
}

// Customer related events
export interface CustomerUpdatedEvent {
  id: string;
  name: string;
  outstanding: number;
  updatedAt: string;
}

// Notification events
export interface NotificationEvent {
  type: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: string;
}

// Socket event names
export const SocketEvents = {
  BILL: {
    CREATED: "BILL_CREATED",
    UPDATED: "BILL_UPDATED",
    DELETED: "BILL_DELETED",
    RETURN_CREATED: "RETURN_BILL_CREATED",
  },
  CUSTOMER: {
    CREATED: "CUSTOMER_CREATED",
    UPDATED: "CUSTOMER_UPDATED",
  },
  PRODUCT: {
    CREATED: "PRODUCT_CREATED",
    UPDATED: "PRODUCT_UPDATED",
    DELETED: "PRODUCT_DELETED",
  },
  TRANSACTION: {
    CREATED: "TRANSACTION_CREATED",
    UPDATED: "TRANSACTION_UPDATED",
  },
  INVENTORY: {
    UPDATED: "INVENTORY_UPDATED",
    REJECTED: "INVENTORY_REJECTED",
    UPDATE_REQUEST: "INVENTORY_UPDATE_REQUEST",
  },
  NOTIFICATION: "NOTIFICATION",
} as const;
