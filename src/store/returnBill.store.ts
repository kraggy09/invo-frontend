import { create } from "zustand";

export interface ReturnItem {
    product: any;
    quantityReturned: number;
    returnPrice: number;
    returnTotal: number;
    originalType: string;
}

export interface ReturnBill {
    _id: string;
    id: number;
    originalBill: any;
    customer: any;
    createdBy: any;
    items: ReturnItem[];
    totalAmount: number;
    paymentMode: "ADJUSTMENT" | "CASH";
    createdAt: string;
    updatedAt: string;
}

type ReturnBillStore = {
    returnBills: ReturnBill[];
    setReturnBills: (returnBills: ReturnBill[]) => void;
    addReturnBill: (returnBill: ReturnBill) => void;
};

const useReturnBillStore = create<ReturnBillStore>((set) => ({
    returnBills: [],
    setReturnBills: (returnBills) => set({ returnBills }),
    addReturnBill: (returnBill) => set((state) => ({ returnBills: [...state.returnBills, returnBill] })),
}));

export default useReturnBillStore;
