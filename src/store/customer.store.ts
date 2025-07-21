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
  updateOutstanding: (id: string, newOutstanding: number) => void;
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
}));

export default useCustomerStore;
