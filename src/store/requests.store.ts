import { create } from "zustand";

interface User {
  _id: string;
  name: string;
  username: string;
}

interface Product {
  _id: string;
  name: string;
  stock: number;
}

interface InventoryRequest {
  _id: string;
  createdBy: User;
  approved: boolean;
  product: Product;
  oldStock: number;
  quantity: number;
  newStock: number;
  purpose: string;
  rejected: boolean;
  date: string;
  __v: number;
  approvedAt?: string;
  approvedBy?: string;
  stockAtUpdate?: number;
}

interface InventoryRequestStore {
  requests: InventoryRequest[];
  loading: boolean;
  error: string | null;

  setRequests: (requests: InventoryRequest[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  afterStockUpdated: (
    requestsMap: Map<string, { stockAtUpdate: number; newStock: number }>
  ) => void;
  addOrUpdateRequests: (newRequests: any[]) => void;
  reset: () => void;
}

export const useInventoryRequestStore = create<InventoryRequestStore>(
  (set, get) => ({
    requests: [],
    loading: false,
    error: null,

    setRequests: (requests) => set({ requests }),
    setLoading: (loading) => set({ loading }),
    afterStockUpdated: (requestsMap) => {
      const { requests } = get();
      const updatedRequests = requests.map((request) => {
        if (requestsMap.has(request._id)) {
          const updates = requestsMap.get(request._id);
          return {
            ...request,
            stockAtUpdate: updates?.stockAtUpdate,
            newStock: updates?.newStock as number,
            approved: true,
          };
        }
        return request;
      });
      set({ requests: updatedRequests });
      console.log("Stock updated for requests:", updatedRequests);
    },
    addOrUpdateRequests: (newRequests) => {
      const { requests } = get();
      const requestsMap = new Map(requests.map((r) => [r._id, r]));
      newRequests.forEach((req) => {
        if (requestsMap.has(req._id)) {
          requestsMap.set(req._id, { ...requestsMap.get(req._id), ...req });
        } else {
          requestsMap.set(req._id, req);
        }
      });
      const updated = Array.from(requestsMap.values()).sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || a.date).getTime();
        const timeB = new Date(b.createdAt || b.date).getTime();
        return timeB - timeA;
      });
      set({ requests: updated });
    },
    setError: (error) => set({ error }),
    reset: () => set({ requests: [], loading: false, error: null }),
  })
);

export type { InventoryRequest, User, Product };
