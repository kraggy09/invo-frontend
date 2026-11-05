import { create } from "zustand";

export interface ReturnItem {
    product: any;
    quantityReturned: number;
    returnPrice: number;
    returnTotal: number;
    originalType: string;
}

export type ReturnBillStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReturnBill {
    _id: string;
    id: number;
    originalBill: any;
    customer: any;
    createdBy: any;
    items: ReturnItem[];
    totalAmount: number;
    paymentMode: "ADJUSTMENT" | "CASH";
    status: ReturnBillStatus;
    approvedBy?: any;
    approvedAt?: string;
    rejectedBy?: any;
    rejectedAt?: string;
    rejectionReason?: string;
    previousOutstanding?: number;
    newOutstanding?: number;
    productsTotal?: number;
    createdAt: string;
    updatedAt: string;
}

type ReturnBillStore = {
    returnBills: ReturnBill[];
    pendingReturnBills: ReturnBill[];
    setReturnBills: (returnBills: ReturnBill[]) => void;
    setPendingReturnBills: (pendingReturnBills: ReturnBill[]) => void;
    addReturnBill: (returnBill: ReturnBill) => void;
    addPendingReturnBill: (returnBill: ReturnBill) => void;
    removePendingReturnBill: (id: string) => void;
    updateReturnBill: (returnBill: ReturnBill) => void;
    reset: () => void;
};

const useReturnBillStore = create<ReturnBillStore>((set) => ({
    returnBills: [],
    pendingReturnBills: [],
    setReturnBills: (returnBills) => set({ returnBills }),
    setPendingReturnBills: (pendingReturnBills) => set({ pendingReturnBills }),
    addReturnBill: (returnBill) =>
        set((state) => ({
            returnBills: [returnBill, ...state.returnBills.filter((rb) => rb._id !== returnBill._id)],
        })),
    addPendingReturnBill: (returnBill) =>
        set((state) => ({
            pendingReturnBills: [returnBill, ...state.pendingReturnBills.filter((rb) => rb._id !== returnBill._id)],
        })),
    removePendingReturnBill: (id) =>
        set((state) => ({
            pendingReturnBills: state.pendingReturnBills.filter((rb) => rb._id !== id),
        })),
    updateReturnBill: (returnBill) =>
        set((state) => {
            const idMatch = (rb: any) =>
                String(rb._id) === String(returnBill._id) ||
                (rb.id !== undefined && returnBill.id !== undefined && String(rb.id) === String(returnBill.id));
            const exists = state.returnBills.some(idMatch);
            return {
                returnBills: exists
                    ? state.returnBills.map((rb) =>
                          idMatch(rb) ? { ...rb, ...returnBill, status: returnBill.status, rawData: returnBill } : rb
                      )
                    : [returnBill, ...state.returnBills],
                pendingReturnBills: state.pendingReturnBills.filter((rb) => !idMatch(rb)),
            };
        }),
    reset: () => set({ returnBills: [], pendingReturnBills: [] }),
}));

export default useReturnBillStore;
