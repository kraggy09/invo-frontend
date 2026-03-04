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
  updateOutstanding: (id: string, newOutstanding: number) => Customer | undefined;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
}

const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loading: false,
  error: null,

  setCustomers: (customers) => set({ customers }),

  getCustomerById: (id) =>
    get().customers.find((customer) => customer._id === id),

  updateOutstanding: (
    id: string,
    newOutstanding: number
  ): Customer | undefined => {
    let updatedCustomer: Customer | undefined;

    set((state) => {
      const updatedCustomers = state.customers.map((customer) => {
        if (customer._id === id) {
          updatedCustomer = { ...customer, outstanding: newOutstanding };
          return updatedCustomer;
        }
        return customer;
      });

      return { customers: updatedCustomers };
    });

    return updatedCustomer;
  },

  addCustomer: (customer) => set((state) => {
    const newCustomers = [...state.customers, customer].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return { customers: newCustomers };
  }),

  updateCustomer: (updatedCustomer) =>
    set((state) => {
      const newCustomers = state.customers.map((c) => (c._id === updatedCustomer._id ? updatedCustomer : c)).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      return { customers: newCustomers };
    }),
}));

export default useCustomerStore;
