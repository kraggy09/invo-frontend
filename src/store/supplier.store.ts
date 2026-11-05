import { create } from "zustand";

export interface ISupplier {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  outstanding: number;
  createdAt?: string;
  updatedAt?: string;
}

interface SupplierStore {
  suppliers: ISupplier[];
  loading: boolean;
  error: string | null;

  setSuppliers: (suppliers: ISupplier[]) => void;
  getSupplierById: (id: string) => ISupplier | undefined;
  addSupplier: (supplier: ISupplier) => void;
  updateSupplier: (supplier: ISupplier) => void;
  updateOutstanding: (id: string, newOutstanding: number) => ISupplier | undefined;
  reset: () => void;
}

const useSupplierStore = create<SupplierStore>((set, get) => ({
  suppliers: [],
  loading: false,
  error: null,

  setSuppliers: (suppliers) => set({ suppliers }),

  getSupplierById: (id) =>
    get().suppliers.find((supplier) => supplier._id === id),

  addSupplier: (supplier) =>
    set((state) => {
      const exists = state.suppliers.some((s) => s._id === supplier._id);
      if (exists) {
        return {
          suppliers: state.suppliers.map((s) =>
            s._id === supplier._id ? supplier : s
          ),
        };
      }
      const newSuppliers = [...state.suppliers, supplier].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      return { suppliers: newSuppliers };
    }),

  updateSupplier: (supplier) =>
    set((state) => ({
      suppliers: state.suppliers.map((s) =>
        s._id === supplier._id ? { ...s, ...supplier } : s
      ),
    })),

  updateOutstanding: (id: string, newOutstanding: number) => {
    let updated: ISupplier | undefined;
    set((state) => {
      const updatedSuppliers = state.suppliers.map((s) => {
        if (s._id === id) {
          updated = { ...s, outstanding: newOutstanding };
          return updated;
        }
        return s;
      });
      return { suppliers: updatedSuppliers };
    });
    return updated;
  },

  reset: () => set({ suppliers: [], loading: false, error: null }),
}));

export default useSupplierStore;

