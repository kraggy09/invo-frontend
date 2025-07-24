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
          return {
            ...request,
            stockAtUpdate: requestsMap.get(request._id)?.stockAtUpdate,
            newStock: requestsMap.get(request._id)?.newStock as number,
          };
        }
        return request;
      });
      set({ requests: updatedRequests });
      console.log("Stock updated for requests:", updatedRequests);
    },
    setError: (error) => set({ error }),
  })
);

export type { InventoryRequest, User, Product };
