// Bill related events
export interface BillCreatedEvent {
  id: string;
  total: number;
  customerId: string;
  createdAt: string;
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
    CREATED: "bill:created",
    UPDATED: "bill:updated",
    DELETED: "bill:deleted",
  },
  CUSTOMER: {
    UPDATED: "customer:updated",
  },
  NOTIFICATION: "notification",
} as const;
