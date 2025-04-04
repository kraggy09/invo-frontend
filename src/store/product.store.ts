import { create } from "zustand";

export interface Product {
  _id: string;
  name: string;
  mrp: number;
  costPrice: number;
  measuring: string;
  category?: string;
  retailPrice: number;
  wholesalePrice: number;
  superWholesalePrice: number;
  barcode: number[];
  stock: number;
  packet: number;
  box: number;
  minQuantity: number;
  hi?: string;
  __v: number;
}

interface ProductStore {
  products: Product[];
  loading: boolean;
  error: string | null;

  setProducts: (products: Product[]) => void;
  updateStock: (productId: string, newStock: number) => void;
}

const useProductStore = create<ProductStore>((set) => ({
  // Initial State
  products: [],
  loading: false,
  error: null,

  // Actions
  setProducts: (products) => set({ products }),

  updateStock: (productId: string, newStock: number) => {
    set((state) => ({
      products: state.products.map((p) =>
        p._id === productId ? { ...p, stock: newStock } : p
      ),
    }));
  },
}));

export default useProductStore;
