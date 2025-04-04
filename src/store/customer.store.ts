import { create } from "zustand";

export interface Customer {
  _id: string;
  name: string;
  outstanding: number;
  phone: number;
  __v: number;
}

interface CustomerStore {
  customers: Customer[];
  loading: boolean;
  error: string | null;

  // Actions
  setCustomers: (customers: Customer[]) => void;
  getCustomerById: (id: string) => Customer | undefined;
}

const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loading: false,
  error: null,

  setCustomers: (customers) => set({ customers }),
  getCustomerById: (id) =>
    get().customers.find((customer) => customer._id === id),
}));

export default useCustomerStore;
