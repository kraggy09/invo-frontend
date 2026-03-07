import { create } from "zustand";

export interface BillProduct {
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
  __v: number;
}

export interface BillCustomer {
  _id: string;
  name: string;
  outstanding: number;
  phone: number;
}

export interface BillCreatedBy {
  _id: string;
  name: string;
  username: string;
}

export interface BillItem {
  _id: string;
  previousQuantity: number;
  newQuantity: number;
  product: BillProduct | string;
  quantity: number;
  discount: number;
  type: "WHOLESALE" | "RETAIL" | "SUPERWHOLESALE";
  total: number;
  costPrice: number;
}

export interface Bill {
  _id: string;
  id: number;
  customer: BillCustomer;
  createdBy: BillCreatedBy;
  items: BillItem[];
  productsTotal?: number;
  total: number;
  payment: number;
  discount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

type BillStore = {
  bills: Bill[];
  billingId: number;
  setBillingId: (billingId: number) => void;
  setBills: (bills: Bill[]) => void;
  addBill: (bill: Bill) => void;
  updateBill: (updatedBill: Partial<Bill> & { _id: string }) => void;
};

const useBillStore = create<BillStore>((set) => ({
  bills: [],
  billingId: 0,
  setBills: (bills) => set({ bills }),
  setBillingId: (billingId) => set({ billingId }),
  addBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),
  updateBill: (updatedBill) =>
    set((state) => ({
      bills: state.bills.map((b) =>
        b._id === updatedBill._id ? { ...b, ...updatedBill } : b
      ),
    })),
}));

export default useBillStore;
