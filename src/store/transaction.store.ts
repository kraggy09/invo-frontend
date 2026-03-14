import { create } from "zustand";

export interface ITransaction {
  _id: string;
  id: number;
  date: string;
  previousOutstanding?: number;
  newOutstanding?: number;
  customer: string; // ObjectId as string
  approved: boolean;
  approvedBy: string; // ObjectId as string
  name: string;
  purpose?: string;
  amount: number;
  taken?: boolean;
  paymentIn: boolean;
  approvedAt?: Date | string;
  rejectedAt?: Date | string;
  createdAt: Date | string;
  paymentMode: "CASH" | "ONINE" | "PRODUCT_RETURN";
}

type TransactionStore = {
  transactionId: number;
  setTransactionId: (transactionId: number) => void;
  transactionApprovals: ITransaction[]
  setTransactionApproval: (approvals: ITransaction[]) => void;
  transactions: ITransaction[];
  loading: boolean;
  error: string | null;
  setTransactions: (transactions: ITransaction[]) => void;
  addTransaction: (transaction: ITransaction) => void;
  approveTransaction: (transaction: ITransaction) => void;
  rejectTransaction: (transaction: ITransaction) => void;
  deleteTransaction: (transactionId: string) => void;
};

const useTransactionStore = create<TransactionStore>((set) => ({
  transactionId: 0,
  transactionApprovals: [],
  setTransactionApproval: (approvals: ITransaction[]) => set({ transactionApprovals: approvals }),
  setTransactionId: (transactionId) => set({ transactionId }),
  transactions: [],
  loading: false,
  error: null,
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) => {
    set((state) => {
      // If paymentIn is false (internal expense) or already approved, it goes straight to the main ledger
      if (transaction.paymentIn === false || transaction.approved === true) {
        return {
          transactions: [...state.transactions, transaction],
        };
      }
      // Customer payments needing approval go to the approvals queue
      return {
        transactionApprovals: [transaction, ...state.transactionApprovals],
      };
    });
  },
  approveTransaction: (transaction: ITransaction) => {
    set((state) => {
      const idx = state.transactionApprovals.findIndex((t) => t._id === transaction._id);
      if (idx !== -1) {
        const newApprovals = [...state.transactionApprovals];
        newApprovals.splice(idx, 1);
        return {
          transactionApprovals: newApprovals,
          transactions: [transaction, ...state.transactions],
        };
      }
      return state;
    });
  },
  rejectTransaction: (transaction: ITransaction) => {
    set((state) => {
      const idx = state.transactionApprovals.findIndex((t) => t._id === transaction._id);
      if (idx !== -1) {
        const newApprovals = [...state.transactionApprovals];
        newApprovals.splice(idx, 1);
        return {
          transactionApprovals: newApprovals,
        };
      }
      return state;
    });
  },
  deleteTransaction: (transactionId) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t._id !== transactionId),
    })),
}));

export default useTransactionStore;
