import { create } from "zustand";

export interface Product {
  _id: string;
  name: string;
  mrp: number;
  costPrice: number;
  measuring: string;
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

export interface BillItem {
  _id: string;
  previousQuantity: number;
  newQuantity: number;
  product: Product | string;
  quantity: number;
  discount: number;
  type: string;
  total: number;
  costPrice: number;
}

export interface Bill {
  _id: string;
  id: number;
  customer: string; // customer ID
  createdBy: string;
  items: BillItem[];
  total: number;
  payment: number;
  discount: number;
  date: string; // ISO string
  createdAt: string;
  __v: number;
}

type BillStore = {
  bills: Bill[];
  billingId: number;
  setBillingId: (billingId: number) => void;
  setBills: (bills: Bill[]) => void;
  addBill: (bill: Bill) => void;
};

const useBillStore = create<BillStore>((set) => ({
  bills: [],
  billingId: 0,
  setBills: (bills) => set({ bills }),
  setBillingId: (billingId) => set({ billingId }),
  addBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),
}));

export default useBillStore;
