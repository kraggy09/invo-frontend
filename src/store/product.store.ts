import { create } from "zustand";

export interface IProduct {
  _id: string;
  name: string;
  mrp: number;
  costPrice: number;
  measuring: "kg" | "pieces";
  category: string;
  retailPrice: number;
  wholesalePrice: number;
  superWholesalePrice: number;
  barcode: number[];
  stock: number;
  packet: number;
  box: number;
  minQuantity: number;
  hi: string;
  __v: number;
}

interface ProductStore {
  products: IProduct[];
  loading: boolean;
  error: string | null;

  setProducts: (products: IProduct[]) => void;
  updateStock: (productId: string, newStock: number) => void;
  productMap: Map<string, number>;
  setProductMap: (map: Map<string, number>) => void;
}

const useProductStore = create<ProductStore>((set) => ({
  // Initial State
  products: [],
  loading: false,
  error: null,
  productMap: new Map<string, number>(),

  setProductMap: (map) => set({ productMap: map }),
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
