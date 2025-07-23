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
}

export const useInventoryRequestStore = create<InventoryRequestStore>(
  (set) => ({
    requests: [],
    loading: false,
    error: null,

    setRequests: (requests) => set({ requests }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  })
);

export type { InventoryRequest, User, Product };
