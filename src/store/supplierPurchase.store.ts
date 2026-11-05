import { create } from "zustand";

export interface ISupplierPurchaseProduct {
  _id: string;
  name: string;
  barcode: number[];
  measuring: string;
  mrp: number;
  costPrice: number;
  retailPrice: number;
  wholesalePrice?: number;
  superWholesalePrice?: number;
  stock: number;
  packet?: number;
  box?: number;
}

export interface ISupplierPurchaseItem {
  product: ISupplierPurchaseProduct;
  quantity: number;
  previousCostPrice?: number;
  newCostPrice?: number;
  previousRetailPrice?: number;
  newRetailPrice?: number;
  previousWholesalePrice?: number;
  newWholesalePrice?: number;
  previousSuperWholesalePrice?: number;
  newSuperWholesalePrice?: number;
  priceUpdated?: boolean;
}

export interface ISupplierPurchase {
  _id: string;
  supplier: {
    _id: string;
    name: string;
    phone: string;
    outstanding: number;
  };
  status: "PENDING" | "ACCEPTED" | "APPROVED" | "REJECTED";
  raisedBy: {
    _id: string;
    name: string;
    username: string;
  };
  raisedAt: string;
  acceptedBy?: {
    _id: string;
    name: string;
    username: string;
  };
  acceptedAt?: string;
  approvedBy?: {
    _id: string;
    name: string;
    username: string;
  };
  approvedAt?: string;
  rejectedBy?: {
    _id: string;
    name: string;
    username: string;
  };
  rejectedAt?: string;
  items: ISupplierPurchaseItem[];
  totalAmount?: number;
  paymentMode?: "CASH" | "CREDIT" | "PARTIAL";
  cashPaid?: number;
  creditAmount?: number;
  previousSupplierOutstanding?: number;
  newSupplierOutstanding?: number;
  createdAt: string;
  updatedAt: string;
}

interface SupplierPurchaseStore {
  purchases: ISupplierPurchase[];
  loading: boolean;
  error: string | null;

  setPurchases: (purchases: ISupplierPurchase[]) => void;
  addPurchase: (purchase: ISupplierPurchase) => void;
  updatePurchase: (purchase: ISupplierPurchase) => void;
  approvePurchase: (purchase: ISupplierPurchase) => void;
  rejectPurchase: (id: string) => void;
  reset: () => void;
}

export const useSupplierPurchaseStore = create<SupplierPurchaseStore>(
  (set) => ({
    purchases: [],
    loading: false,
    error: null,

    setPurchases: (purchases) => set({ purchases }),

    addPurchase: (purchase) =>
      set((state) => {
        const filtered = state.purchases.filter((p) => p._id !== purchase._id);
        return { purchases: [purchase, ...filtered] };
      }),

    updatePurchase: (purchase) =>
      set((state) => ({
        purchases: state.purchases.map((p) =>
          p._id === purchase._id ? purchase : p
        ),
      })),

    approvePurchase: (purchase) =>
      set((state) => ({
        purchases: state.purchases.map((p) =>
          p._id === purchase._id ? purchase : p
        ),
      })),

    rejectPurchase: (id) =>
      set((state) => ({
        purchases: state.purchases.map((p) =>
          p._id === id ? { ...p, status: "REJECTED" as const } : p
        ),
      })),

    reset: () => set({ purchases: [], loading: false, error: null }),
  })
);

export default useSupplierPurchaseStore;

