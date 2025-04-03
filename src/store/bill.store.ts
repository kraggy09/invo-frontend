import { create } from "zustand";

type Bill = {
  id: string;
  idx: number;
  amount: number;
  description: string;
};

type BillingStore = {
  bills: Bill[];
  billingId: string;
  addBill: (bill: Bill) => void;
  removeBill: (id: string) => void;
  setBillingId: (id: string) => void;
  currentBillingId: string;
};

const useBillingStore = create<BillingStore>((set, get) => ({
  bills: [],
  billingId: "",
  addBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),
  removeBill: (id) =>
    set((state) => ({ bills: state.bills.filter((bill) => bill.id !== id) })),
  setBillingId: (id) => set(() => ({ billingId: id })),
  currentBillingId: get().billingId,
}));

export default useBillingStore;
