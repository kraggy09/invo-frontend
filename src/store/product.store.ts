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
  addProduct: (product: IProduct) => void;
  updateProduct: (product: IProduct) => void;
  removeProduct: (productId: string) => void;
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

  addProduct: (product: IProduct) => {
    set((state) => {
      const newProducts = [...state.products, product].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      const newMap = new Map<string, number>();
      newProducts.forEach((p, index) => newMap.set(p._id, index));
      return { products: newProducts, productMap: newMap };
    });
  },

  updateProduct: (product: Partial<IProduct> & { _id: string }) => {
    set((state) => {
      const newProducts = state.products.map((p) => {
        if (p._id === product._id) {
          // Explicitly prevent stock from being manipulated during a general product update
          // as stock is only allowed to be explicitly updated via updateStock globally.
          const { stock, ...restOfFields } = product as any;
          return { ...p, ...restOfFields };
        }
        return p;
      }).sort((a, b) => a.name.localeCompare(b.name));
      const newMap = new Map<string, number>();
      newProducts.forEach((p, index) => newMap.set(p._id, index));
      return { products: newProducts, productMap: newMap };
    });
  },

  removeProduct: (productId: string) => {
    set((state) => {
      const newProducts = state.products.filter((p) => p._id !== productId);
      const newMap = new Map<string, number>();
      newProducts.forEach((p, index) => newMap.set(p._id, index));
      return { products: newProducts, productMap: newMap };
    });
  },
}));

export default useProductStore;
