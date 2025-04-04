import { create } from "zustand";
import { Customer } from "./customer.store";

type PurchasedProduct = {
  id: string;
  packetQuantity: number;
  boxQuantity: number;
  wholesalePrice: number;
  retailPrice: number;
  superWholesalePrice: number;
  measuring: "kg" | "pieces";
  barcode: number[];
  name: string;
  price: number;
  mrp: number;
  type: "superWholesale" | "wholesale" | "retail";
  piece: number;
  packet: number;
  box: number;
  discount: number;
  total: number;
  category: string;
  hi: string;
  stock: number;
};

type Bill = {
  id: string;
  idx: number;
  amount: number;
  purchased: PurchasedProduct[];
  customer: Customer | null;
  discount: number;
};

type BillingStore = {
  bills: Bill[];
  billingId: number;
  addBill: (bill: Bill) => void;
  removeBill: (id: string) => void;
  setBillingId: (id: number) => void;
  currentBillingId: number;
  setCurrentBillingId: (id: number) => void;
  initialBills: (bills: Bill[]) => void;
  setCustomerForBill: (customer: Customer | null, id: string) => void;
  addProduct: (product: PurchasedProduct, id: string) => void;
  removeProduct: (productId: string, billId: string) => void;
};

const useCurrentBillStore = create<BillingStore>((set) => ({
  bills: [],
  billingId: 1,
  addBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),
  initialBills: (bills: Bill[]) => set(() => ({ bills: bills })),
  removeBill: (id) =>
    set((state) => {
      const idx = state.bills.findIndex((bill) => bill.id === id);
      const updatedBills = state.bills.filter((bill) => bill.id !== id);
      let removedId = Number(id);
      // Shift IDs backward
      for (let i = idx; i < updatedBills.length; i++) {
        updatedBills[i].id = removedId + "";
        removedId++;
      }

      return { bills: updatedBills };
    }),
  setBillingId: (id) => set(() => ({ billingId: id })),
  currentBillingId: 1,
  setCurrentBillingId: (id) => set(() => ({ currentBillingId: id })),
  setCustomerForBill: (customer: Customer | null, id: string) => {
    set((state) => {
      const idx = state.bills.findIndex((bill) => bill.id === id);
      state.bills[idx].customer = customer;
      return { bills: state.bills };
    });
  },
  addProduct: (product: PurchasedProduct, id: string) => {
    set((state) => {
      const idx = state.bills.findIndex((bill) => bill.id === id);
      state.bills[idx].purchased.push(product);
      return { bills: state.bills };
    });
  },
  removeProduct: (productId: string, billId: string) => {
    set((state) => {
      const idx = state.bills.findIndex((bill) => bill.id === billId);
      state.bills[idx].purchased = state.bills[idx].purchased.filter(
        (product) => product.id !== productId
      );
      return { bills: state.bills };
    });
  },
}));

export default useCurrentBillStore;
